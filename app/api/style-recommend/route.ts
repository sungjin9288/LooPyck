import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface StyleRecommendRequest {
    gender: 'M' | 'F' | 'N';
    height: number;      // cm
    weight: number;      // kg
    preferredStyles: string[]; // ['캐주얼', '미니멀', '스포티', '포멀', '빈티지']
    budget?: 'low' | 'mid' | 'high'; // ~3만 / 3~10만 / 10만+
}

export interface LookRecommendation {
    lookName: string;       // 예: "모던 캐주얼 룩"
    description: string;   // 스타일 설명
    keyItems: string[];     // 검색 키워드 ["와이드 팬츠", "크루넥 니트"]
    reason: string;         // 체형에 맞는 이유
}

export interface StyleRecommendResponse {
    looks: LookRecommendation[];
    bodyNote: string;  // 체형 특성 설명
}

export async function POST(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'style-recommend'), 10, 60_000);
    if (!rateLimit.allowed) {
        return NextResponse.json({ error: '요청이 너무 많습니다.' }, { status: 429 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: 'AI 서비스가 설정되지 않았습니다.' }, { status: 503 });
    }

    let body: StyleRecommendRequest;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validation
    const { gender, height, weight, preferredStyles, budget = 'mid' } = body;
    if (!gender || !['M', 'F', 'N'].includes(gender)) {
        return NextResponse.json({ error: '성별 값이 올바르지 않습니다.' }, { status: 400 });
    }
    if (!height || height < 100 || height > 230) {
        return NextResponse.json({ error: '키는 100~230cm 사이여야 합니다.' }, { status: 400 });
    }
    if (!weight || weight < 30 || weight > 200) {
        return NextResponse.json({ error: '몸무게는 30~200kg 사이여야 합니다.' }, { status: 400 });
    }

    const bmi = weight / ((height / 100) ** 2);
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
        const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 1024,
                    responseMimeType: 'application/json',
                }
            }),
            signal: AbortSignal.timeout(15000),
        });

        if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);

        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        let parsed: StyleRecommendResponse;
        try {
            parsed = JSON.parse(rawText);
        } catch {
            return NextResponse.json({ error: 'AI 응답을 파싱하는 데 실패했습니다.' }, { status: 500 });
        }

        return NextResponse.json(parsed);
    } catch (error) {
        console.error('[Style Recommend API Error]', error);
        return NextResponse.json({ error: 'AI 추천 오류가 발생했습니다.' }, { status: 500 });
    }
}
