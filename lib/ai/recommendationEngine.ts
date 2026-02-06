/**
 * Recommendation Engine - 스타일 유사도 기반 추천
 * Pure Functions for testability
 */

import type { AIExtractedProduct } from '@/types/aiExtraction';

// 소재 타입
type MaterialType = AIExtractedProduct['material'];
type SilhouetteType = AIExtractedProduct['silhouette'];

// 가중치 설정
export const WEIGHTS = {
    SILHOUETTE: 0.4,  // 40%
    MATERIAL: 0.3,    // 30%
    PRICE: 0.3,       // 30%
} as const;

// 실루엣 유사도 매트릭스
const SILHOUETTE_SIMILARITY: Record<SilhouetteType, Record<SilhouetteType, number>> = {
    fitted: { fitted: 1.0, regular: 0.6, relaxed: 0.3, oversized: 0.2, boxy: 0.3, slim: 0.9, straight: 0.5, wide: 0.2, unknown: 0.3 },
    regular: { fitted: 0.6, regular: 1.0, relaxed: 0.7, oversized: 0.4, boxy: 0.5, slim: 0.7, straight: 0.8, wide: 0.4, unknown: 0.5 },
    relaxed: { fitted: 0.3, regular: 0.7, relaxed: 1.0, oversized: 0.8, boxy: 0.7, slim: 0.4, straight: 0.6, wide: 0.7, unknown: 0.5 },
    oversized: { fitted: 0.2, regular: 0.4, relaxed: 0.8, oversized: 1.0, boxy: 0.9, slim: 0.2, straight: 0.5, wide: 0.8, unknown: 0.4 },
    boxy: { fitted: 0.3, regular: 0.5, relaxed: 0.7, oversized: 0.9, boxy: 1.0, slim: 0.3, straight: 0.6, wide: 0.7, unknown: 0.4 },
    slim: { fitted: 0.9, regular: 0.7, relaxed: 0.4, oversized: 0.2, boxy: 0.3, slim: 1.0, straight: 0.6, wide: 0.2, unknown: 0.3 },
    straight: { fitted: 0.5, regular: 0.8, relaxed: 0.6, oversized: 0.5, boxy: 0.6, slim: 0.6, straight: 1.0, wide: 0.5, unknown: 0.5 },
    wide: { fitted: 0.2, regular: 0.4, relaxed: 0.7, oversized: 0.8, boxy: 0.7, slim: 0.2, straight: 0.5, wide: 1.0, unknown: 0.4 },
    unknown: { fitted: 0.3, regular: 0.5, relaxed: 0.5, oversized: 0.4, boxy: 0.4, slim: 0.3, straight: 0.5, wide: 0.4, unknown: 1.0 },
};

// 소재 그룹
const MATERIAL_GROUPS: Record<string, MaterialType[]> = {
    cotton_group: ['cotton', 'linen'],
    synthetic_group: ['polyester', 'nylon'],
    premium_group: ['wool', 'silk', 'leather'],
    casual_group: ['denim', 'knit', 'fleece'],
};

/**
 * 소재 그룹 찾기
 */
function getMaterialGroup(material: MaterialType): string | null {
    for (const [group, materials] of Object.entries(MATERIAL_GROUPS)) {
        if (materials.includes(material)) {
            return group;
        }
    }
    return null;
}

/**
 * 실루엣 유사도 계산 (Pure Function)
 * @returns 0-1 (1 = 동일)
 */
export function getSilhouetteSimilarity(
    silhouette1: SilhouetteType,
    silhouette2: SilhouetteType
): number {
    return SILHOUETTE_SIMILARITY[silhouette1]?.[silhouette2] ?? 0.3;
}

/**
 * 소재 유사도 계산 (Pure Function)
 * @returns 0-1 (1 = 동일)
 */
export function getMaterialSimilarity(
    material1: MaterialType,
    material2: MaterialType
): number {
    // 동일 소재
    if (material1 === material2) return 1.0;

    // unknown 처리
    if (material1 === 'unknown' || material2 === 'unknown') return 0.3;
    if (material1 === 'mixed' || material2 === 'mixed') return 0.4;

    // 같은 그룹 내
    const group1 = getMaterialGroup(material1);
    const group2 = getMaterialGroup(material2);

    if (group1 && group1 === group2) return 0.6;

    // 다른 그룹
    return 0.2;
}

/**
 * 가격 유사도 계산 (Pure Function)
 * @returns 0-1 (1 = 동일 가격대)
 */
export function getPriceSimilarity(price1: number, price2: number): number {
    if (price1 <= 0 || price2 <= 0) return 0.5;

    const ratio = Math.min(price1, price2) / Math.max(price1, price2);

    // ±20% 이내면 높은 유사도
    if (ratio >= 0.8) return 1.0;
    // ±40% 이내
    if (ratio >= 0.6) return 0.7;
    // ±60% 이내
    if (ratio >= 0.4) return 0.4;
    // 그 이상 차이
    return 0.2;
}

/**
 * 두 상품 간 스타일 매칭 점수 계산 (Pure Function)
 * @returns 0-100
 */
export function calculateMatchScore(
    product1: Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price'>,
    product2: Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price'>
): number {
    const silhouetteScore = getSilhouetteSimilarity(product1.silhouette, product2.silhouette);
    const materialScore = getMaterialSimilarity(product1.material, product2.material);
    const priceScore = getPriceSimilarity(product1.price, product2.price);

    const totalScore =
        silhouetteScore * WEIGHTS.SILHOUETTE +
        materialScore * WEIGHTS.MATERIAL +
        priceScore * WEIGHTS.PRICE;

    return Math.round(totalScore * 100);
}

/**
 * 사용자 찜 목록과 현재 상품의 평균 스타일 매칭 점수
 * @returns 0-100
 */
export function getStyleMatchScore(
    userFavorites: Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price'>[],
    currentProduct: Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price'>
): number {
    if (userFavorites.length === 0) return 50; // 데이터 없으면 중립

    const scores = userFavorites.map(fav => calculateMatchScore(fav, currentProduct));
    const avgScore = scores.reduce((sum, s) => sum + s, 0) / scores.length;

    return Math.round(avgScore);
}

/**
 * 가장 유사한 찜 상품 찾기
 */
export function findMostSimilarFavorite<T extends Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price'>>(
    userFavorites: T[],
    currentProduct: Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price'>
): { favorite: T; score: number } | null {
    if (userFavorites.length === 0) return null;

    let bestMatch: T | null = null;
    let bestScore = 0;

    for (const fav of userFavorites) {
        const score = calculateMatchScore(fav, currentProduct);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = fav;
        }
    }

    return bestMatch ? { favorite: bestMatch, score: bestScore } : null;
}

/**
 * 스타일 매칭 레벨 분류
 */
export function getMatchLevel(score: number): 'perfect' | 'good' | 'ok' | 'poor' {
    if (score >= 85) return 'perfect';
    if (score >= 70) return 'good';
    if (score >= 50) return 'ok';
    return 'poor';
}

/**
 * 매칭 레벨별 메시지
 */
export function getMatchMessage(score: number): string {
    const level = getMatchLevel(score);

    switch (level) {
        case 'perfect':
            return '찜한 상품들과 완벽하게 어울려요! 🎯';
        case 'good':
            return '찜한 스타일과 잘 맞아요 👍';
        case 'ok':
            return '새로운 스타일에 도전해보세요 ✨';
        case 'poor':
            return '평소와 다른 스타일이에요 🔄';
    }
}
