import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const SYSTEM_PROMPT = `당신은 LooPyck의 전문 AI 패션 스타일리스트입니다.
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

export async function POST(request: NextRequest) {
    // Rate limit: 20 requests/min
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'ai-chat'), 20, 60_000);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'AI 서비스가 설정되지 않았습니다.' }, { status: 503 });
    }

    let body: { message: string; history?: { role: string; text: string }[] };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { message, history = [] } = body;
    if (!message || message.trim().length === 0) {
        return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 });
    }
    if (message.length > 500) {
        return NextResponse.json({ error: '메시지가 너무 깁니다.' }, { status: 400 });
    }

    // Build conversation history for Gemini
    const geminiContents = [
        { role: 'user', parts: [{ text: SYSTEM_PROMPT }] },
        { role: 'model', parts: [{ text: '{"text": "안녕하세요! AI 패션 스타일리스트입니다.", "searchKeywords": []}' }] },
        ...history.slice(-6).map(h => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
        })),
        { role: 'user', parts: [{ text: message }] }
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
            signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
            throw new Error(`Gemini API error: ${res.status}`);
        }

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        let parsed: { text: string; searchKeywords: string[] };
        try {
            parsed = JSON.parse(rawText);
        } catch {
            // JSON 파싱 실패 시 원문을 텍스트로 반환
            parsed = { text: rawText || '죄송합니다. 다시 시도해주세요.', searchKeywords: [] };
        }

        return NextResponse.json({
            text: parsed.text,
            searchKeywords: Array.isArray(parsed.searchKeywords) ? parsed.searchKeywords.slice(0, 3) : [],
        });
    } catch (error) {
        console.error('[AI Chat API Error]', error);
        return NextResponse.json({ error: 'AI 응답 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' }, { status: 500 });
    }
}
