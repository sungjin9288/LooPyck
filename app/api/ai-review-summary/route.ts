import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseGeminiJson } from '@/lib/ai/geminiJson';
import { sanitizePromptText, wrapUntrustedBlock } from '@/lib/ai/promptSafety';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { Logger } from '@/lib/core/observability';

const REQUEST_TIMEOUT_MS = 12_000;

const ReviewSummaryRequestSchema = z.object({
    reviews: z
        .array(
            z.object({
                text: z.string().max(260).transform((value) => value.trim()),
                rating: z.coerce.number().int().min(1).max(5),
                fit: z.enum(['small', 'true', 'large']).nullable().optional().default(null),
            })
        )
        .min(3, '리뷰가 3개 이상 필요합니다.')
        .max(12, '리뷰는 최대 12개까지 분석할 수 있습니다.'),
});

const ReviewSummaryResponseSchema = z.object({
    pros: z.string().trim().min(1).max(140),
    cons: z.string().trim().min(1).max(140),
    sizeTip: z.string().trim().min(1).max(140),
});

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'ai-review-summary'), 15, 60_000);
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

    const parsedRequest = ReviewSummaryRequestSchema.safeParse(payload);
    if (!parsedRequest.success) {
        return NextResponse.json(
            { error: parsedRequest.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'API 키가 설정되지 않았습니다.' },
            { status: 503, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const reviewTexts = parsedRequest.data.reviews
        .map((review, index) => `리뷰 ${index + 1}: [별점 ${review.rating}점 / 핏: ${review.fit || '알수없음'}] ${sanitizePromptText(review.text || '내용 없음', 260)}`)
        .join('\n');

    const prompt = `
당신은 e-커머스 리뷰 분석 AI입니다.
아래 사용자 리뷰 데이터를 분석하여 장점(pros), 단점(cons), 그리고 공통적인 사이즈/핏 팁(sizeTip)을 **각각 매우 간결한 1줄(30자 내외)**로 요약해 주세요.
말투는 "~합니다", "~편입니다" 와 같이 상품 상세페이지에 어울리는 정중하고 객관적인 쇼핑 가이드 톤으로 작성하세요.

${wrapUntrustedBlock(reviewTexts, 'REVIEWS')}

[출력 형식]
반드시 아래 JSON 형식으로만 응답하세요 (백틱 묶음 없이 순수 JSON만 반환):
{
  "pros": "가볍고 통기성이 좋아 여름철 데일리로 입기 좋습니다.",
  "cons": "기장이 다소 길어 키가 작은 분들은 수선이 필요할 수 있습니다.",
  "sizeTip": "대체로 정사이즈이나 볼이 넓은 경우 한 사이즈 업을 추천합니다."
}
`;

    const requestBody = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.1,
            responseMimeType: 'application/json',
        },
    };

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify(requestBody),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!response.ok) {
            // Do not leak the upstream provider status to the client.
            return NextResponse.json(
                { error: 'AI 리뷰 분석 중 오류가 발생했습니다.' },
                { status: 502, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        const data = (await response.json()) as unknown;
        const parsed = parseGeminiJson(data, ReviewSummaryResponseSchema);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: 'AI 응답 형식이 올바르지 않습니다.' },
                { status: 502, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        return NextResponse.json(parsed.data, {
            headers: {
                'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
        });
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return NextResponse.json(
                { error: 'AI 리뷰 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' },
                { status: 504, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }
        Logger.error('[AI Review Summary] request failed', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }
}
