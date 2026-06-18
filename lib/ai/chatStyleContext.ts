/**
 * Chat style context — derives a compact, deterministic taste profile from the
 * user's favorited products so the AI stylist can personalize advice. Returns
 * null when there is nothing to say, so we never inject an empty context block.
 *
 * The output is a single plain-text line; the server still sanitizes it before
 * putting it into a prompt (brand/title text originates from scraped data).
 */

import type { Product } from '@/types/product';

const MAX_BRANDS = 3;
const MAX_CATEGORIES = 2;

function topByFrequency(values: string[], limit: number): string[] {
    const counts = new Map<string, number>();
    for (const raw of values) {
        const value = (raw ?? '').trim();
        if (!value) continue;
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Array.from(counts.entries())
        .sort((left, right) => right[1] - left[1])
        .slice(0, limit)
        .map(([value]) => value);
}

export function buildChatStyleContext(favorites: readonly Product[] | undefined | null): string | null {
    if (!Array.isArray(favorites) || favorites.length === 0) {
        return null;
    }

    const brands = topByFrequency(favorites.map((item) => item?.brand ?? ''), MAX_BRANDS);
    const categories = topByFrequency(favorites.map((item) => item?.category1 ?? ''), MAX_CATEGORIES);

    const parts = [`즐겨찾기 ${favorites.length}개`];
    if (brands.length > 0) {
        parts.push(`자주 찜한 브랜드: ${brands.join(', ')}`);
    }
    if (categories.length > 0) {
        parts.push(`관심 카테고리: ${categories.join(', ')}`);
    }

    return parts.join(' · ');
}
