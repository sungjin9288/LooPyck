import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { reviews } = await req.json();

        if (!reviews || !Array.isArray(reviews) || reviews.length < 3) {
            return NextResponse.json({ error: '리뷰가 3개 이상 필요합니다.' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

        // 리뷰 텍스트 모음
        const reviewTexts = reviews.map((r: any, i: number) => `리뷰 ${i + 1}: [별점 ${r.rating}점 / 핏: ${r.fit || '알수없음'}] ${r.text}`).join('\n');

        const prompt = `
당신은 e-커머스 리뷰 분석 AI입니다.
아래 다수의 사용자 리뷰 데이터를 분석하여 장점(pros), 단점(cons), 그리고 공통적인 사이즈/핏 팁(sizeTip)을 **각각 매우 간결한 1줄(30자 내외)**로 요약해 주세요.
말투는 "~합니다", "~편입니다" 와 같이 상품 상세페이지에 어울리는 정중하고 객관적인 쇼핑 가이드 톤으로 작성하세요.

[사용자 리뷰 데이터]
${reviewTexts}

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
                temperature: 0.1, // 요약이므로 사실 기반으로 낮게 설정
                response_mime_type: "application/json",
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            return NextResponse.json({ error: 'AI 리뷰 분석 중 오류가 발생했습니다.' }, { status: response.status });
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
        console.error('Review Summary API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
