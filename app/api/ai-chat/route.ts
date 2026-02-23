import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { extractGeminiText, normalizeKeywordList, parseGeminiJson } from '@/lib/ai/geminiJson';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT_KO = `당신은 LooPyck의 전문 AI 패션 스타일리스트입니다.
사용자의 패션 질문에 친근하고 전문적으로 답변하세요.

규칙:
1. 답변은 3-4문장으로 간결하게 작성
2. 반드시 1~3개의 구체적인 패션 아이템 키워드를 추천
3. 응답은 반드시 아래 JSON 형식으로만 반환 (다른 텍스트 없이):

{
  "text": "스타일 조언 내용",
  "searchKeywords": ["검색키워드1", "검색키워드2"]
}

searchKeywords에는 실제 쇼핑몰에서 검색할 수 있는 구체적인 아이템명을 넣으세요.
예: "와이드 데님 팬츠", "오버사이즈 크루넥 니트", "로우탑 캔버스 스니커즈"`;

const SYSTEM_PROMPT_EN = `You are LooPyck's expert AI fashion stylist.
Answer the user's fashion question in a friendly but practical tone.

Rules:
1. Keep the answer concise in 3-4 sentences.
2. Recommend 1 to 3 concrete fashion item keywords.
3. Return only valid JSON in this exact shape (no extra text):

{
  "text": "style advice",
  "searchKeywords": ["keyword1", "keyword2"]
}

searchKeywords must be realistic shopping terms users can directly search for.`;

const ChatHistorySchema = z.object({
    role: z.enum(['user', 'model']),
    text: z.string().trim().min(1).max(800),
});

const ChatRequestSchema = z.object({
    message: z.string().trim().min(1, '메시지를 입력해주세요.').max(500, '메시지가 너무 깁니다.'),
    history: z.array(ChatHistorySchema).max(12).optional().default([]),
    locale: z.enum(['ko', 'en']).optional().default('ko'),
});

const ChatResponseSchema = z.object({
    text: z.string().trim().min(1).max(800),
    searchKeywords: z.array(z.string().trim().min(1).max(40)).max(5).optional().default([]),
});

function getSystemPrompt(locale: 'ko' | 'en'): string {
    return locale === 'en' ? SYSTEM_PROMPT_EN : SYSTEM_PROMPT_KO;
}

function getStarterResponse(locale: 'ko' | 'en'): string {
    return locale === 'en'
        ? '{"text":"Hi! I am your AI fashion stylist.", "searchKeywords":[]}'
        : '{"text":"안녕하세요! AI 패션 스타일리스트입니다.", "searchKeywords":[]}';
}

const HISTORY_CONTEXT_LIMIT = 6;
const REQUEST_TIMEOUT_MS = 10_000;
const FALLBACK_TEXT_MAX_LEN = 320;

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'ai-chat'), 20, 60_000);
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

    const parsedBody = ChatRequestSchema.safeParse(payload);
    if (!parsedBody.success) {
        return NextResponse.json(
            { error: parsedBody.error.issues[0]?.message || '요청 형식이 올바르지 않습니다.' },
            { status: 400, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }

    const { message, history, locale } = parsedBody.data;

    const geminiContents = [
        { role: 'user', parts: [{ text: getSystemPrompt(locale) }] },
        { role: 'model', parts: [{ text: getStarterResponse(locale) }] },
        ...history.slice(-HISTORY_CONTEXT_LIMIT).map((item) => ({
            role: item.role,
            parts: [{ text: item.text }],
        })),
        { role: 'user', parts: [{ text: message }] },
    ];

    try {
        const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: geminiContents,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 512,
                    responseMimeType: 'application/json',
                }
            }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        });

        if (!res.ok) {
            throw new Error(`Gemini API error: ${res.status}`);
        }

        const data = await res.json() as unknown;
        const parsed = parseGeminiJson(data, ChatResponseSchema);

        if (!parsed.ok) {
            const fallbackText = extractGeminiText(data);
            if (!fallbackText) {
                return NextResponse.json(
                    { error: 'AI 응답 형식을 처리하지 못했습니다.' },
                    { status: 502, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
                );
            }

            return NextResponse.json(
                {
                    text: fallbackText.slice(0, FALLBACK_TEXT_MAX_LEN),
                    searchKeywords: [],
                },
                { headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }

        return NextResponse.json(
            {
                text: parsed.data.text,
                searchKeywords: normalizeKeywordList(parsed.data.searchKeywords, 3),
            },
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return NextResponse.json(
                { error: 'AI 응답이 지연되고 있습니다. 잠시 후 다시 시도해주세요.' },
                { status: 504, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
            );
        }
        console.error('[AI Chat API Error]', error);
        return NextResponse.json(
            { error: 'AI 응답 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 500, headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) } }
        );
    }
}
