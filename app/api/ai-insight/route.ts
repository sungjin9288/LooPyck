import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeKeywordList, parseGeminiJson } from '@/lib/ai/geminiJson';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';

export const runtime = 'edge';

const REQUEST_TIMEOUT_MS = 12_000;

const InsightRequestSchema = z.object({
    title: z.string().trim().min(1, '상품명이 필요합니다.').max(180),
    price: z.coerce.number().int().positive('가격 정보가 올바르지 않습니다.').max(1_000_000_000),
    brand: z.string().trim().max(80).optional().default(''),
    category: z.string().trim().max(80).optional().default(''),
});

const ReasoningItemSchema = z.object({
    factor: z.string().trim().min(1).max(30),
    score: z.coerce.number().finite().transform((v) => Math.max(0, Math.min(100, Math.round(v)))),
    note: z.string().trim().min(1).max(80),
});

const InsightResponseSchema = z.object({
    insight: z.object({
        score: z.coerce.number().finite().transform((value) => Math.max(0, Math.min(100, Math.round(value)))),
        ratingEN: z.enum(['STRONG BUY', 'BUY', 'HOLD', 'WAIT']),
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

    const { title, price, brand, category } = parsedRequest.data;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'API 키가 설정되지 않았습니다.' },
            { status: 503, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
당신은 한국 패션 트렌드와 가격 방어율(리셀 가치)을 전문적으로 분석하는 AI 애널리스트입니다.
아래 상품 정보를 바탕으로 구매 가치(Investment Insight)와 트렌드 지수(Trend Score)를 분석해주세요.

[상품 정보]
- 상품명: ${title}
- 브랜드: ${brand || '일반 브랜드'}
- 카테고리: ${category || '의류/잡화'}
- 현재 최저가: ${price}원

[분석 요구사항]
1. 트렌드 분석: 이 아이템이 현재 유행(Y2K, 올드머니, 고프코어 등)에 부합하는지, 검색량이 많을 만한 핫한 아이템인지 평가하세요.
2. 가격 가치: 브랜드 인지도와 아이템 종류를 감안했을 때 현재 가격(${price}원)이 합리적인지 평가하세요.
3. 구매 의견: "적극 매수", "매수", "보류", "대기" 중 하나로 평가하고 그 이유를 150자 내외로 설명하세요.

[출력 형식]
반드시 아래 JSON 형식으로만 응답하세요 (백틱 묶음 없이 순수 JSON만 반환):
{
  "insight": {
    "score": 85,
    "ratingEN": "BUY",
    "advice": "트렌디한 아이템이며 가격 방어가 잘 됩니다.",
    "reason": "고프코어 트렌드에 부합하고 현재 가격은 브랜드 평균 대비 합리적이라 구매 매력이 높습니다.",
    "reasoning": [
      { "factor": "트렌드 부합도", "score": 90, "note": "고프코어/아웃도어 트렌드와 강하게 부합" },
      { "factor": "가격 합리성", "score": 80, "note": "브랜드 평균 대비 5~10% 저렴" },
      { "factor": "브랜드 파워", "score": 85, "note": "글로벌 1티어 브랜드로 리셀 가치 안정" },
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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'AI 분석 중 오류가 발생했습니다.' },
                { status: response.status, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        const data = (await response.json()) as unknown;
        const parsed = parseGeminiJson(data, InsightResponseSchema);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: 'AI 응답 형식이 올바르지 않습니다.' },
                { status: 502, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        return NextResponse.json(
            {
                insight: parsed.data.insight,
                trend: {
                    ...parsed.data.trend,
                    keywords: normalizeKeywordList(parsed.data.trend.keywords, 3),
                },
            },
            { headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining), 'Cache-Control': 'private, max-age=300' } }
        );
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return NextResponse.json(
                { error: 'AI 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' },
                { status: 504, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }
        console.error('[AI Insight] Server Error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }
}
