import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeKeywordList, parseGeminiJson } from '@/lib/ai/geminiJson';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
const REQUEST_TIMEOUT_MS = 15_000;

const StyleRecommendRequestSchema = z.object({
    gender: z.enum(['M', 'F', 'N']),
    height: z.coerce.number().int().min(100, '키는 100~230cm 사이여야 합니다.').max(230, '키는 100~230cm 사이여야 합니다.'),
    weight: z.coerce.number().int().min(30, '몸무게는 30~200kg 사이여야 합니다.').max(200, '몸무게는 30~200kg 사이여야 합니다.'),
    preferredStyles: z
        .array(z.string().trim().min(1).max(30))
        .min(1, '선호 스타일을 1개 이상 선택해주세요.')
        .max(3, '선호 스타일은 최대 3개까지 선택할 수 있습니다.'),
    budget: z.enum(['low', 'mid', 'high']).optional().default('mid'),
});

const LookRecommendationSchema = z.object({
    lookName: z.string().trim().min(1).max(40),
    description: z.string().trim().min(1).max(220),
    keyItems: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
    reason: z.string().trim().min(1).max(160),
});

const StyleRecommendResponseSchema = z.object({
    looks: z.array(LookRecommendationSchema).min(2).max(3),
    bodyNote: z.string().trim().min(1).max(140),
});

export type StyleRecommendRequest = z.infer<typeof StyleRecommendRequestSchema>;
export type LookRecommendation = z.infer<typeof LookRecommendationSchema>;
export type StyleRecommendResponse = {
    looks: Array<LookRecommendation & { keyItems: string[] }>;
    bodyNote: string;
};

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'style-recommend'), 10, 60_000);
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

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'AI 서비스가 설정되지 않았습니다.' },
            { status: 503, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    let payload: unknown;
    try {
        payload = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const parsedRequest = StyleRecommendRequestSchema.safeParse(payload);
    if (!parsedRequest.success) {
        return NextResponse.json(
            { error: parsedRequest.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const { gender, height, weight, preferredStyles, budget } = parsedRequest.data;

    const bmi = weight / (height / 100) ** 2;
    const genderLabel = gender === 'M' ? '남성' : gender === 'F' ? '여성' : '논바이너리';
    const budgetLabel = budget === 'low' ? '3만원 이하' : budget === 'mid' ? '3~10만원' : '10만원 이상';

    const prompt = `당신은 전문 패션 스타일리스트입니다.

고객 정보:
- 성별: ${genderLabel}
- 키: ${height}cm
- 몸무게: ${weight}kg (BMI: ${bmi.toFixed(1)})
- 선호 스타일: ${preferredStyles.join(', ')}
- 예산: 아이템당 ${budgetLabel}

이 고객에게 딱 맞는 패션 룩 3가지를 추천해주세요.

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):
{
  "bodyNote": "체형 특성 한 줄 설명",
  "looks": [
    {
      "lookName": "룩 이름 (예: 모던 캐주얼 룩)",
      "description": "이 룩의 전체적인 스타일 설명 (2문장)",
      "keyItems": ["실제 검색 가능한 아이템1", "아이템2", "아이템3"],
      "reason": "이 체형에 이 룩이 어울리는 이유 (1문장)"
    }
  ]
}

keyItems는 반드시 무신사, 29cm 같은 쇼핑몰에서 실제 검색 가능한 구체적인 아이템명으로 작성하세요.
예: "슬림핏 테일러드 자켓", "하이웨이스트 와이드 팬츠", "오버핏 스트라이프 셔츠"`;

    try {
        const res = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1024,
                    responseMimeType: 'application/json',
                },
            }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!res.ok) {
            throw new Error(`Gemini API error: ${res.status}`);
        }

        const data = (await res.json()) as unknown;
        const parsed = parseGeminiJson(data, StyleRecommendResponseSchema);

        if (!parsed.ok) {
            return NextResponse.json(
                { error: 'AI 응답을 파싱하는 데 실패했습니다.' },
                { status: 502, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        const looks = parsed.data.looks.map((look) => ({
            ...look,
            keyItems: normalizeKeywordList(look.keyItems, 3),
        }));

        return NextResponse.json(
            {
                bodyNote: parsed.data.bodyNote,
                looks,
            } satisfies StyleRecommendResponse,
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return NextResponse.json(
                { error: 'AI 추천 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' },
                { status: 504, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }
        console.error('[Style Recommend API Error]', error);
        return NextResponse.json(
            { error: 'AI 추천 오류가 발생했습니다.' },
            { status: 500, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }
}
