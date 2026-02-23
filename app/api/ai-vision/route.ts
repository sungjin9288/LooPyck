import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { normalizeKeywordList, parseGeminiJson } from '@/lib/ai/geminiJson';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';

export const runtime = 'edge';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;

const VisionRequestSchema = z.object({
    imageBase64: z
        .string()
        .min(100, '이미지 데이터가 너무 짧습니다.')
        .max(6_000_000, '이미지 데이터가 너무 큽니다.'),
    mimeType: z.string().trim().regex(/^image\/[a-z0-9.+-]+$/i, '지원되지 않는 이미지 포맷입니다.'),
});

const VisionResponseSchema = z.object({
    description: z.string().trim().min(1).max(220),
    searchKeywords: z.array(z.string().trim().min(1).max(40)).max(8).optional().default([]),
});

function estimateDecodedBytes(base64: string): number {
    const normalized = base64.replace(/\s+/g, '');
    const paddingMatch = normalized.match(/=+$/);
    const padding = paddingMatch ? paddingMatch[0].length : 0;
    return Math.floor((normalized.length * 3) / 4) - padding;
}

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'ai-vision'), 8, 60_000);
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

    const parsedRequest = VisionRequestSchema.safeParse(payload);
    if (!parsedRequest.success) {
        return NextResponse.json(
            { error: parsedRequest.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const normalizedImageBase64 = parsedRequest.data.imageBase64.replace(/\s+/g, '');
    const decodedBytes = estimateDecodedBytes(normalizedImageBase64);
    if (decodedBytes > MAX_IMAGE_BYTES) {
        return NextResponse.json(
            { error: '이미지는 4MB 이하여야 합니다.' },
            { status: 413, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json(
            { error: 'API 키가 설정되지 않았습니다.' },
            { status: 503, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
당신은 한국 최고의 패션 플랫폼의 AI 스타일리스트입니다.
주어진 이미지를 꼼꼼하게 분석하여 사용자가 이와 "가장 시각적으로 유사한" 옷을 쇼핑몰에서 검색할 수 있도록
정확하고 구체적인 검색 키워드 모음을 만들어주세요.

[분석 지침]
1. 메인 아이템 파악: 이미지에서 가장 핵심이 되는 의류나 신발, 가방을 1~2개 꼽으세요.
2. 디테일 포착: 색상, 소재(레더, 데님, 니트 등), 핏(오버핏, 크롭, 와이드 등), 특정 디테일(카고, 지퍼, 자수 등)을 조합하세요.
3. 쇼핑몰 검색 최적화: 사용자가 무신사, 29CM 등에 그대로 검색창에 입력했을 때 최적의 결과가 나올 법한 단어여야 합니다. (예: "검정색 바지" -> "블랙 와이드 데님 팬츠" 또는 "나일론 파라슈트 팬츠")
4. 트렌드 반영: Y2K, 고프코어, 올드머니, 그런지 등 스타일 키워드가 명확하다면 포함하세요.

[출력 형식]
반드시 다음 JSON 형식으로만 응답할 것 (백틱(\`\`\`) 없이 순수 JSON만 반환):
{
  "description": "이미지에 대한 패션전문가 느낌의 친절한 설명 1~2줄 (한국어)",
  "searchKeywords": ["키워드1", "키워드2", "키워드3"]
}
    `;

    const requestBody = {
        contents: [
            {
                parts: [
                    { text: prompt },
                    {
                        inline_data: {
                            mime_type: parsedRequest.data.mimeType,
                            data: normalizedImageBase64,
                        },
                    },
                ],
            },
        ],
        generationConfig: {
            temperature: 0.2,
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
            const err = (await response.text()).slice(0, 300);
            console.error('[AI Vision] Gemini API Error:', response.status, err);
            return NextResponse.json(
                { error: 'AI 분석 중 오류가 발생했습니다.' },
                { status: response.status, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        const data = (await response.json()) as unknown;
        const parsed = parseGeminiJson(data, VisionResponseSchema);
        if (!parsed.ok) {
            return NextResponse.json(
                { error: 'AI 응답 형식이 올바르지 않습니다.' },
                { status: 502, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        return NextResponse.json(
            {
                description: parsed.data.description,
                searchKeywords: normalizeKeywordList(parsed.data.searchKeywords, 3),
            },
            { headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return NextResponse.json(
                { error: '이미지 분석 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' },
                { status: 504, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }
        console.error('[AI Vision] Server Error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }
}
