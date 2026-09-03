import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeKeywordList, parseGeminiJson } from '@/lib/ai/geminiJson';
import { sanitizePromptText, wrapUntrustedBlock } from '@/lib/ai/promptSafety';
import { buildPriceGroundingBlock } from '@/lib/ai/priceInsightGrounding';
import { computePriceVerdict } from '@/lib/product/priceVerdict';
import { ALLOWED_PRODUCT_SOURCES } from '@/lib/api/types';
import { readPriceHistory } from '@/lib/server/priceHistoryStore';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { buildAiInsightFallback, type AiInsightResult } from '@/lib/ai/aiInsightFallback';
import { INVESTMENT_RATINGS } from '@/lib/product/investmentRating';
import { Logger, toErrorMessage } from '@/lib/core/observability';

const REQUEST_TIMEOUT_MS = 12_000;

const InsightRequestSchema = z.object({
    title: z.string().trim().min(1, '상품명이 필요합니다.').max(180),
    price: z.coerce.number().int().positive('가격 정보가 올바르지 않습니다.').max(1_000_000_000),
    brand: z.string().trim().max(80).optional().default(''),
    category: z.string().trim().max(80).optional().default(''),
    // Optional product identity — lets the route ground the price judgment in
    // real collected history instead of letting the model guess.
    source: z.enum(ALLOWED_PRODUCT_SOURCES).optional(),
    productId: z.string().trim().min(1).max(160).optional(),
});

const ReasoningItemSchema = z.object({
    factor: z.string().trim().min(1).max(30),
    score: z.coerce.number().finite().transform((v) => Math.max(0, Math.min(100, Math.round(v)))),
    note: z.string().trim().min(1).max(80),
});

const InsightResponseSchema = z.object({
    insight: z.object({
        score: z.coerce.number().finite().transform((value) => Math.max(0, Math.min(100, Math.round(value)))),
        ratingEN: z.enum(INVESTMENT_RATINGS),
        advice: z.string().trim().min(1).max(40),
        reason: z.string().trim().min(1).max(240),
        reasoning: z.array(ReasoningItemSchema).min(1).max(5).optional().default([]),
    }),
    trend: z.object({
        score: z.coerce.number().finite().transform((value) => Math.max(0, Math.min(100, Math.round(value)))),
        label: z.string().trim().min(1).max(40),
        keywords: z.array(z.string().trim().min(1).max(30)).max(8).optional().default([]),
    }),
});

function buildFallbackResponse(verdict: ReturnType<typeof computePriceVerdict>, remaining: number, reason: string) {
    return NextResponse.json(buildAiInsightFallback(verdict), {
        headers: {
            'X-RateLimit-Remaining': String(remaining),
            'X-AI-Insight-Source': 'fallback',
            'X-AI-Insight-Reason': reason,
            'Cache-Control': 'private, max-age=60',
        },
    });
}

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'ai-insight'), 12, 60_000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: '요청이 너무 많습니다.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimit.retryAfterSec),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { error: '요청 본문(JSON)을 확인해주세요.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const parsedRequest = InsightRequestSchema.safeParse(payload);
    if (!parsedRequest.success) {
        return NextResponse.json(
            { error: parsedRequest.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const { title, price, brand, category, source, productId } = parsedRequest.data;

    // Ground the price judgment in REAL collected history when the product is
    // identifiable. Falls back to a conservative "insufficient" block on any
    // failure or when Firebase Admin is unavailable (graceful degradation).
    let priceVerdict: ReturnType<typeof computePriceVerdict>;
    try {
        const history = source && productId ? await readPriceHistory(source, productId, 30) : { points: [] };
        priceVerdict = computePriceVerdict(history.points, price);
    } catch (historyError) {
        Logger.warn('[AI Insight] price history grounding failed', {
            error: toErrorMessage(historyError),
        });
        priceVerdict = computePriceVerdict([], price);
    }
    const priceGrounding = buildPriceGroundingBlock(priceVerdict);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return buildFallbackResponse(priceVerdict, rateLimit.remaining, 'missing_api_key');
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    // title/brand/category are scraped (untrusted) — fence them so a crafted
    // product name cannot inject instructions. price is a validated int (safe).
    const productInfo = [
        `상품명: ${sanitizePromptText(title, 180)}`,
        `브랜드: ${sanitizePromptText(brand, 80) || '일반 브랜드'}`,
        `카테고리: ${sanitizePromptText(category, 80) || '의류/잡화'}`,
        `현재 최저가: ${price}원`,
    ].join('\n');

    const prompt = `
당신은 한국 패션 가격 비교 서비스의 전문 쇼핑 어드바이저입니다.
아래 상품 정보를 바탕으로 구매 가치와 트렌드 적합도를 분석해주세요.

${wrapUntrustedBlock(productInfo, 'PRODUCT')}

${priceGrounding}

[분석 요구사항]
1. 트렌드 분석: 이 아이템이 현재 패션 흐름(Y2K, 올드머니, 고프코어 등)에 얼마나 잘 맞는지 평가하세요.
2. 가격 가치: 위 [실제 가격 이력] 수치에 근거해 현재 가격(${price}원)이 합리적인지 평가하세요. 데이터가 부족하면 합리성을 단정하지 말고 보수적으로 평가하세요.
3. 구매 의견: 사용자가 가격 비교 플랫폼에서 참고할 수 있게 "지금 비교해볼 만함", "추천", "보류", "주의" 중 하나의 톤으로 설명하세요.

[출력 형식]
반드시 아래 JSON 형식으로만 응답하세요 (백틱 묶음 없이 순수 JSON만 반환):
{
  "insight": {
    "score": 85,
    "ratingEN": "BUY",
    "advice": "지금 비교해볼 만한 상품입니다.",
    "reason": "고프코어 트렌드에 부합하고 현재 가격은 브랜드 평균 대비 합리적인 편이라 구매 검토 가치가 높습니다.",
    "reasoning": [
      { "factor": "트렌드 부합도", "score": 90, "note": "고프코어/아웃도어 트렌드와 강하게 부합" },
      { "factor": "가격 합리성", "score": 80, "note": "브랜드 평균 대비 5~10% 저렴" },
      { "factor": "브랜드 신뢰도", "score": 85, "note": "인지도가 높아 가격 설득력이 있는 편" },
      { "factor": "계절 적합성", "score": 88, "note": "현 시즌 착용 빈도 높음" }
    ]
  },
  "trend": {
    "score": 90,
    "label": "🔥 Super Hot",
    "keywords": ["고프코어", "나일론", "오버핏"]
  }
}
`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.3,
            responseMimeType: 'application/json',
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.any([request.signal, AbortSignal.timeout(REQUEST_TIMEOUT_MS)]),
        });

        if (!response.ok) {
            return buildFallbackResponse(priceVerdict, rateLimit.remaining, `gemini_status_${response.status}`);
        }

        const data = (await response.json()) as unknown;
        const parsed = parseGeminiJson(data, InsightResponseSchema);
        if (!parsed.ok) {
            return buildFallbackResponse(priceVerdict, rateLimit.remaining, 'gemini_parse_failed');
        }

        const result: AiInsightResult = {
            analysisSource: 'ai',
            insight: {
                ...parsed.data.insight,
                score: Number(parsed.data.insight.score),
                reasoning: parsed.data.insight.reasoning.map((item) => ({
                    ...item,
                    score: Number(item.score),
                })),
            },
            trend: {
                ...parsed.data.trend,
                score: Number(parsed.data.trend.score),
                keywords: normalizeKeywordList(parsed.data.trend.keywords, 3),
            },
        };
        return NextResponse.json(
            result,
            { headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining), 'X-AI-Insight-Source': 'ai', 'Cache-Control': 'private, max-age=300' } }
        );
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return buildFallbackResponse(priceVerdict, rateLimit.remaining, error.name === 'AbortError' ? 'request_aborted' : 'gemini_timeout');
        }
        Logger.warn('[AI Insight] Gemini request failed', { error: toErrorMessage(error) });
        return buildFallbackResponse(priceVerdict, rateLimit.remaining, 'gemini_unknown_error');
    }
}
