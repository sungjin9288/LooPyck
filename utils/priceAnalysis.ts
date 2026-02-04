import { Product } from '@/types/product';
import { parsePrice } from '@/lib/api';

export interface InsightData {
    averagePrice: number;
    minPrice: number;
    maxPrice: number;
    productCount: number;
}

/**
 * Calculate the percentile rank of a target price within a list of prices.
 * Returns a number between 0 and 100.
 * 0 means lowest price (best), 100 means highest price.
 */
export function getPercentile(targetPrice: number, allPrices: number[]): number {
    if (!allPrices.length) return 50; // Default to middle if no data

    const sortedPrices = [...allPrices].sort((a, b) => a - b);
    const index = sortedPrices.findIndex(p => p >= targetPrice);

    if (index === -1) return 100; // Expensive than all

    // Linear interpolation for smoother ranking
    const rank = (index / (sortedPrices.length - 1)) * 100;
    return Math.max(0, Math.min(100, rank));
}

/**
 * Generate price insights for each brand in the product list.
 */
export function getBrandInsight(items: Product[]): Record<string, InsightData> {
    const brandGroups: Record<string, number[]> = {};

    items.forEach(item => {
        if (!item.brand) return;
        const price = parsePrice(item.lprice);
        if (!brandGroups[item.brand]) {
            brandGroups[item.brand] = [];
        }
        brandGroups[item.brand].push(price);
    });

    const insights: Record<string, InsightData> = {};

    Object.entries(brandGroups).forEach(([brand, prices]) => {
        if (prices.length === 0) return;

        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const sum = prices.reduce((acc, curr) => acc + curr, 0);
        const avg = Math.round(sum / prices.length);

        insights[brand] = {
            averagePrice: avg,
            minPrice: min,
            maxPrice: max,
            productCount: prices.length,
        };
    });

    return insights;
}
