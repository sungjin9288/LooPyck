import type { UnifiedProduct } from '../api/types.ts';

export type PreferenceProfile = {
    totalSignals: number;
    topBrands: string[];
    topCategories: string[];
};

type RankedPreferenceResult = {
    products: UnifiedProduct[];
    profile: PreferenceProfile;
};

const INVALID_PROFILE_VALUES = new Set([
    'unknown brand',
    'unknown',
    '브랜드 없음',
    '알 수 없음',
]);

function normalize(value: string | undefined): string {
    return (value || '').trim().toLowerCase();
}

function buildCountMap(values: string[]): Map<string, number> {
    const counts = new Map<string, number>();
    values.forEach((value) => {
        const normalized = normalize(value);
        if (!normalized || INVALID_PROFILE_VALUES.has(normalized)) {
            return;
        }

        counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });

    return counts;
}

function topValues(counts: Map<string, number>, limit: number = 3): string[] {
    return Array.from(counts.entries())
        .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
        .slice(0, limit)
        .map(([value]) => value);
}

export function rerankProductsByPreference(
    products: UnifiedProduct[],
    recentlyViewed: UnifiedProduct[]
): RankedPreferenceResult {
    if (products.length === 0 || recentlyViewed.length === 0) {
        return {
            products,
            profile: {
                totalSignals: 0,
                topBrands: [],
                topCategories: [],
            },
        };
    }

    const brandCounts = buildCountMap(recentlyViewed.map((item) => item.brand || ''));
    const categoryCounts = buildCountMap(recentlyViewed.flatMap((item) => [item.category1 || '', item.category2 || '']));
    const sourceCounts = buildCountMap(recentlyViewed.map((item) => item.source));

    const ranked = products.map((product, index) => {
        const brandScore = (brandCounts.get(normalize(product.brand)) || 0) * 12;
        const categoryScore = (
            (categoryCounts.get(normalize(product.category1)) || 0)
            + (categoryCounts.get(normalize(product.category2)) || 0)
        ) * 8;
        const sourceScore = (sourceCounts.get(normalize(product.source)) || 0) * 4;

        return {
            product,
            index,
            preferenceScore: brandScore + categoryScore + sourceScore,
        };
    });

    ranked.sort((left, right) =>
        right.preferenceScore - left.preferenceScore
        || left.index - right.index
    );

    return {
        products: ranked.map((entry) => entry.product),
        profile: {
            totalSignals: recentlyViewed.length,
            topBrands: topValues(brandCounts),
            topCategories: topValues(categoryCounts),
        },
    };
}
