/**
 * Trend Scoring Engine
 * 소셜 미디어 트렌드와 검색량을 기반으로 상품의 'Hotness Index'를 계산합니다.
 */

export interface TrendAnalysis {
    score: number; // 0 ~ 100
    keywords: string[]; // 연관 키워드 (예: "y2k", "festival")
    label: string; // "Rising Star", "Steady Seller", etc.
}

export function analyzeTrend(productTitle: string): TrendAnalysis {
    // 1. Keyword Extraction (Simple Heuristic for now)
    const keywords = extractKeywords(productTitle);

    // 2. Score Calculation (Simulation)
    // 실제로는 Redis나 트렌드 DB에서 검색량을 조회해야 함.
    // 여기서는 키워드 매칭과 랜덤성을 조합.

    let baseScore = 50;

    // Bonus for trendy keywords
    const trendyKeywords = ['빈티지', '오버핏', '고프코어', 'y2k', '실버', '리본', '카고'];

    let matchCount = 0;
    trendyKeywords.forEach(tk => {
        if (productTitle.includes(tk)) {
            baseScore += 15;
            matchCount++;
        }
    });

    // Random volatility to simulate real-time live data
    const score = Math.min(100, Math.max(0, baseScore + Math.floor(Math.random() * 20 - 10)));

    let label = 'Steady Seller';
    if (score >= 80) label = '🔥 Super Hot';
    else if (score >= 60) label = '📈 Rising Star';
    else if (score < 40) label = '❄️ Cool';

    return {
        score,
        keywords: keywords.slice(0, 3), // Top 3
        label
    };
}

function extractKeywords(text: string): string[] {
    // Mock extraction
    return text.split(' ').filter(w => w.length > 2);
}
