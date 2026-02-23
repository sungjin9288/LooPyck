import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { imageBase64, mimeType } = await req.json();

        if (!imageBase64 || !mimeType) {
            return NextResponse.json({ error: '이미지와 MIME 타입이 필요합니다.' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'API 키가 설정되지 않았습니다.' }, { status: 500 });
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
                                mime_type: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.2,
                response_mime_type: "application/json",
            }
        };

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const err = await response.text();
            console.error('Gemini API Error:', err);
            return NextResponse.json({ error: 'AI 분석 중 오류가 발생했습니다.' }, { status: response.status });
        }

        const data = await response.json();
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            return NextResponse.json({ error: 'AI 응답이 비어있습니다.' }, { status: 500 });
        }

        let result;
        try {
            // Remove potential markdown code blocks if the model ignores the instruction
            const cleanedText = textResponse.replace(/^```(json)?|```$/g, '').trim();
            result = JSON.parse(cleanedText);
        } catch (e) {
            console.error('Failed to parse JSON:', textResponse);
            return NextResponse.json({ error: 'JSON 파싱 실패' }, { status: 500 });
        }

        return NextResponse.json(result);

    } catch (error) {
        console.error('Vision API Error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
