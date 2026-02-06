/**
 * RAG Advisor - 트렌드 기반 심층 상담
 * 패션 트렌드 데이터와 Gemini를 연동한 컨텍스트 강화 추천
 */

import type { AIExtractedProduct } from '@/types/aiExtraction';

// 트렌드 데이터 타입
export interface TrendData {
    id: string;
    name: string;
    nameKo: string;
    category: 'color' | 'style' | 'material' | 'silhouette';
    keywords: string[];
    keywordsKo: string[];
    relevanceScore: number;
    season: string;
    description: string;
    descriptionKo: string;
}

// 트렌드 매칭 결과
export interface TrendMatch {
    trend: TrendData;
    matchScore: number;
    matchedKeywords: string[];
}

// RAG 컨텍스트
export interface RAGContext {
    trends: TrendMatch[];
    enrichedPrompt: string;
    confidence: number;
}

// 2026 패션 트렌드 데이터셋
export const TREND_DATABASE: TrendData[] = [
    // 컬러 트렌드
    {
        id: 'pantone_2026',
        name: 'Pantone 2026 Peach Fuzz',
        nameKo: '팬톤 2026 피치퍼즈',
        category: 'color',
        keywords: ['peach', 'coral', 'warm', 'soft', 'pink'],
        keywordsKo: ['피치', '코랄', '살구', '복숭아', '웜톤', '따뜻한'],
        relevanceScore: 0.95,
        season: '2026 S/S',
        description: 'A warm, peachy coral that embodies gentleness and optimism',
        descriptionKo: '부드럽고 따뜻한 살구빛 코랄로, 온화함과 낙관을 표현합니다',
    },
    {
        id: 'butter_yellow',
        name: 'Butter Yellow',
        nameKo: '버터 옐로우',
        category: 'color',
        keywords: ['yellow', 'butter', 'cream', 'soft', 'pastel'],
        keywordsKo: ['노랑', '버터', '크림', '파스텔', '연노랑'],
        relevanceScore: 0.88,
        season: '2026 S/S',
        description: 'Soft, creamy yellow reminiscent of butter',
        descriptionKo: '부드럽고 크리미한 버터색 옐로우',
    },
    // 스타일 트렌드
    {
        id: 'old_money',
        name: 'Old Money Style',
        nameKo: '올드머니룩',
        category: 'style',
        keywords: ['classic', 'preppy', 'elegant', 'timeless', 'luxury', 'heritage'],
        keywordsKo: ['올드머니', '클래식', '프레피', '우아한', '고급', '상속자', '럭셔리'],
        relevanceScore: 0.92,
        season: '2025-2026',
        description: 'Understated elegance inspired by old wealth aesthetics',
        descriptionKo: '절제된 우아함을 추구하는 전통적 상류층 스타일',
    },
    {
        id: 'quiet_luxury',
        name: 'Quiet Luxury',
        nameKo: '조용한 럭셔리',
        category: 'style',
        keywords: ['minimal', 'subtle', 'quality', 'understated', 'refined'],
        keywordsKo: ['조용한', '럭셔리', '미니멀', '절제된', '고급', '품격'],
        relevanceScore: 0.90,
        season: '2025-2026',
        description: 'Luxury that whispers rather than shouts',
        descriptionKo: '로고 없이 품질과 소재로 말하는 럭셔리',
    },
    {
        id: 'coastal_grandmother',
        name: 'Coastal Grandmother',
        nameKo: '코스탈 그랜마',
        category: 'style',
        keywords: ['coastal', 'relaxed', 'linen', 'natural', 'beach', 'effortless'],
        keywordsKo: ['해안', '린넨', '자연스러운', '여유로운', '휴양지'],
        relevanceScore: 0.78,
        season: '2025 S/S',
        description: 'Relaxed, coastal-inspired elegance',
        descriptionKo: '해안가에서 영감받은 여유로운 우아함',
    },
    // 소재 트렌드
    {
        id: 'sustainable_materials',
        name: 'Sustainable Materials',
        nameKo: '지속가능 소재',
        category: 'material',
        keywords: ['organic', 'recycled', 'eco', 'sustainable', 'hemp', 'bamboo'],
        keywordsKo: ['친환경', '재활용', '오가닉', '지속가능', '유기농', '에코'],
        relevanceScore: 0.85,
        season: '2025-2026',
        description: 'Environmentally conscious fabric choices',
        descriptionKo: '환경을 생각하는 의식있는 소재 선택',
    },
    {
        id: 'premium_cashmere',
        name: 'Premium Cashmere',
        nameKo: '프리미엄 캐시미어',
        category: 'material',
        keywords: ['cashmere', 'wool', 'luxury', 'soft', 'warm', 'premium'],
        keywordsKo: ['캐시미어', '캐시미르', '울', '고급', '부드러운', '프리미엄'],
        relevanceScore: 0.88,
        season: '2025 F/W',
        description: 'High-quality cashmere for timeless pieces',
        descriptionKo: '시간이 지나도 변치 않는 고급 캐시미어',
    },
    // 실루엣 트렌드
    {
        id: 'relaxed_tailoring',
        name: 'Relaxed Tailoring',
        nameKo: '릴렉스드 테일러링',
        category: 'silhouette',
        keywords: ['relaxed', 'tailored', 'oversized', 'structured', 'loose'],
        keywordsKo: ['릴렉스', '테일러드', '오버사이즈', '여유로운', '구조적'],
        relevanceScore: 0.87,
        season: '2026 S/S',
        description: 'Structured yet comfortable tailoring',
        descriptionKo: '편안하면서도 구조적인 테일러드 룩',
    },
];

/**
 * 사용자 쿼리에서 트렌드 매칭 (Pure Function)
 */
export function matchTrends(query: string, limit: number = 3): TrendMatch[] {
    const normalizedQuery = query.toLowerCase();
    const matches: TrendMatch[] = [];

    for (const trend of TREND_DATABASE) {
        const matchedKeywords: string[] = [];
        let matchScore = 0;

        // 영문 키워드 매칭
        for (const keyword of trend.keywords) {
            if (normalizedQuery.includes(keyword.toLowerCase())) {
                matchedKeywords.push(keyword);
                matchScore += 0.15;
            }
        }

        // 한글 키워드 매칭 (가중치 높음)
        for (const keyword of trend.keywordsKo) {
            if (query.includes(keyword)) {
                matchedKeywords.push(keyword);
                matchScore += 0.25;
            }
        }

        // 트렌드 이름 직접 매칭
        if (normalizedQuery.includes(trend.name.toLowerCase()) || query.includes(trend.nameKo)) {
            matchScore += 0.4;
            matchedKeywords.push(trend.nameKo);
        }

        if (matchScore > 0) {
            matches.push({
                trend,
                matchScore: Math.min(matchScore * trend.relevanceScore, 1),
                matchedKeywords: [...new Set(matchedKeywords)],
            });
        }
    }

    return matches
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
}

/**
 * 상품 데이터에서 트렌드 매칭
 */
export function matchProductToTrends(
    product: Pick<AIExtractedProduct, 'material' | 'silhouette' | 'styleCategory'>,
    limit: number = 2
): TrendMatch[] {
    const matches: TrendMatch[] = [];

    for (const trend of TREND_DATABASE) {
        let matchScore = 0;
        const matchedKeywords: string[] = [];

        // 소재 매칭
        if (trend.category === 'material') {
            const materialStr = product.material.toLowerCase();
            for (const keyword of trend.keywords) {
                if (materialStr.includes(keyword)) {
                    matchScore += 0.3;
                    matchedKeywords.push(keyword);
                }
            }
        }

        // 실루엣 매칭
        if (trend.category === 'silhouette') {
            const silhouetteStr = product.silhouette.toLowerCase();
            for (const keyword of trend.keywords) {
                if (silhouetteStr.includes(keyword)) {
                    matchScore += 0.25;
                    matchedKeywords.push(keyword);
                }
            }
        }

        // 스타일 매칭
        if (trend.category === 'style' && product.styleCategory) {
            const styleStr = product.styleCategory.toLowerCase();
            for (const keyword of trend.keywords) {
                if (styleStr.includes(keyword)) {
                    matchScore += 0.2;
                    matchedKeywords.push(keyword);
                }
            }
        }

        if (matchScore > 0) {
            matches.push({
                trend,
                matchScore: matchScore * trend.relevanceScore,
                matchedKeywords,
            });
        }
    }

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, limit);
}

/**
 * RAG 컨텍스트 생성 - 트렌드 정보로 프롬프트 강화
 */
export function buildRAGContext(query: string): RAGContext {
    const trends = matchTrends(query);

    if (trends.length === 0) {
        return {
            trends: [],
            enrichedPrompt: query,
            confidence: 0.5,
        };
    }

    // 트렌드 정보를 프롬프트에 추가
    const trendContexts = trends.map(t =>
        `[${t.trend.nameKo}] ${t.trend.descriptionKo}`
    ).join('\n');

    const enrichedPrompt = `
## 사용자 질문
${query}

## 관련 패션 트렌드 컨텍스트
${trendContexts}

위 트렌드 정보를 참고하여 더 풍부하고 전문적인 답변을 제공하세요.
`.trim();

    return {
        trends,
        enrichedPrompt,
        confidence: Math.min(0.5 + trends[0].matchScore * 0.5, 0.95),
    };
}

/**
 * 트렌드 기반 응답 강화
 */
export function enhanceResponseWithTrends(
    baseResponse: string,
    trendMatches: TrendMatch[]
): string {
    if (trendMatches.length === 0) return baseResponse;

    const trendTips = trendMatches.map(t =>
        `💡 **${t.trend.nameKo}** 트렌드와 어울려요! ${t.trend.descriptionKo}`
    ).join('\n');

    return `${baseResponse}\n\n---\n### 🔥 트렌드 인사이트\n${trendTips}`;
}

/**
 * 정보 풍부도 측정 (Before/After 비교용)
 */
export function measureInformationRichness(text: string): number {
    let score = 0;

    // 트렌드 키워드 포함 여부
    const allKeywords = TREND_DATABASE.flatMap(t => [...t.keywordsKo, t.nameKo]);
    for (const keyword of allKeywords) {
        if (text.includes(keyword)) score += 5;
    }

    // 이모지 (시각적 풍부함)
    const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
    score += emojiCount * 2;

    // 마크다운 포맷 (구조적 풍부함)
    if (text.includes('**')) score += 5;
    if (text.includes('###')) score += 5;
    if (text.includes('- ')) score += 3;

    // 텍스트 길이 (정보량)
    score += Math.min(text.length / 50, 20);

    return Math.round(score);
}
