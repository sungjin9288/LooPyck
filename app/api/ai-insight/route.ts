import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { title, price, brand, category } = await req.json();

        if (!title || !price) {
            return NextResponse.json({ error: '상품명과 가격 정보가 필요합니다.' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
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
    "score": 85,           // 0 ~ 100 사이의 구매 가치 점수
    "ratingEN": "BUY",     // "STRONG BUY", "BUY", "HOLD", "WAIT" 중 택 1
    "advice": "트렌디한 아이템이며 가격 방어가 잘 되는 브랜드입니다. 당장 구매를 추천합니다.", // 메인 헤더용 (20자 이내)
    "reason": "고프코어 트렌드에 정확히 부합하며, 현재 ${price}원의 가격은 해당 브랜드의 평균 리테일가 대비 합리적입니다. 품절 전 구매를 권장합니다." // 상세 설명 (150자 내외)
  },
  "trend": {
    "score": 90,           // 0 ~ 100 사이의 트렌드 핫 지수
    "label": "🔥 Super Hot", // "🔥 Super Hot", "📈 Rising Star", "Steady Seller" 등
    "keywords": ["고프코어", "나일론", "오버핏"] // 연관 검색어 3개
  }
}
`;

        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.3,
                response_mime_type: "application/json",
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: response.status });
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
        }

        const cleanedText = textResponse.replace(/^```(json)?|```$/g, '').trim();
        const result = JSON.parse(cleanedText);

        return NextResponse.json(result);

    } catch (error) {
        console.error('Insight API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
