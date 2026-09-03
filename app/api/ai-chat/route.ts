import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildAiChatFallback, type AiChatLocale } from '@/lib/ai/aiChatFallback';
import { parseAiChatGeminiResponse } from '@/lib/ai/aiChatResponse';
import { sanitizePromptText } from '@/lib/ai/promptSafety';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { Logger, toErrorMessage } from '@/lib/core/observability';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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
    // Optional taste profile derived from the user's favorites — personalizes advice.
    styleProfile: z.string().trim().max(200).optional(),
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

function buildFallbackResponse(
    message: string,
    locale: AiChatLocale,
    remaining: number,
    reason: string
) {
    return NextResponse.json(buildAiChatFallback(message, locale), {
        headers: {
            'X-RateLimit-Remaining': String(remaining),
            'X-AI-Chat-Source': 'fallback',
            'X-AI-Chat-Reason': reason,
            'Cache-Control': 'private, no-store',
        },
    });
}

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

    const { message, history, locale, styleProfile } = parsedBody.data;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return buildFallbackResponse(message, locale, rateLimit.remaining, 'missing_api_key');
    }

    // Personalize the stylist with the user's taste, but keep their explicit
    // request authoritative. styleProfile is sanitized (favorites-derived text).
    const baseSystemPrompt = getSystemPrompt(locale);
    const systemPrompt = styleProfile
        ? `${baseSystemPrompt}\n\n[사용자 취향 참고]\n${sanitizePromptText(styleProfile, 200)}\n위 취향을 자연스럽게 반영하되, 사용자가 다른 요청을 하면 그 요청을 우선하세요.`
        : baseSystemPrompt;

    const geminiContents = [
        { role: 'user', parts: [{ text: systemPrompt }] },
        { role: 'model', parts: [{ text: getStarterResponse(locale) }] },
        ...history.slice(-HISTORY_CONTEXT_LIMIT).map((item) => ({
            role: item.role,
            parts: [{ text: item.text }],
        })),
        { role: 'user', parts: [{ text: message }] },
    ];

    try {
        const res = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
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
            Logger.warn('[AI Chat] Gemini upstream rejected request', { status: res.status });
            return buildFallbackResponse(message, locale, rateLimit.remaining, `gemini_http_${res.status}`);
        }

        const data = await res.json() as unknown;
        const parsed = parseAiChatGeminiResponse(data);

        if (parsed.ok === false) {
            Logger.warn('[AI Chat] Gemini response contract mismatch', { error: parsed.error });
            return buildFallbackResponse(message, locale, rateLimit.remaining, 'gemini_parse_failed');
        }

        return NextResponse.json(
            parsed.data,
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                    'X-AI-Chat-Source': 'ai',
                    'Cache-Control': 'private, no-store',
                },
            }
        );
    } catch (error) {
        if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
            return buildFallbackResponse(
                message,
                locale,
                rateLimit.remaining,
                error.name === 'AbortError' ? 'request_aborted' : 'gemini_timeout'
            );
        }
        Logger.warn('[AI Chat] Gemini request failed', { error: toErrorMessage(error) });
        return buildFallbackResponse(message, locale, rateLimit.remaining, 'gemini_request_failed');
    }
}
