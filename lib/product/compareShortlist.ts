import type { Product } from '../../types/product';
import { buildFavoriteDocId } from '../favorites/favoriteProduct.ts';

export const COMPARE_SHORTLIST_STORAGE_KEY = 'loopyck-compare-shortlist';
export const MAX_COMPARE_SHORTLIST_ITEMS = 12;

export interface CompareShortlistItem extends Product {
    savedAt: number;
}

function isCompareShortlistItem(value: unknown): value is CompareShortlistItem {
    if (!value || typeof value !== 'object') return false;

    const item = value as Record<string, unknown>;
    return (
        typeof item.title === 'string'
        && typeof item.link === 'string'
        && typeof item.image === 'string'
        && typeof item.lprice === 'string'
        && typeof item.hprice === 'string'
        && typeof item.mallName === 'string'
        && typeof item.productId === 'string'
        && typeof item.productType === 'string'
        && typeof item.brand === 'string'
        && typeof item.maker === 'string'
        && typeof item.category1 === 'string'
        && typeof item.category2 === 'string'
        && typeof item.category3 === 'string'
        && typeof item.category4 === 'string'
        && typeof item.savedAt === 'number'
    );
}

export function buildCompareShortlistItem(product: Product, savedAt: number = Date.now()): CompareShortlistItem {
    return {
        ...product,
        favoriteId: buildFavoriteDocId(product),
        savedAt,
    };
}

export function parseCompareShortlist(value: unknown): CompareShortlistItem[] {
    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(isCompareShortlistItem)
        .sort((left, right) => right.savedAt - left.savedAt)
        .slice(0, MAX_COMPARE_SHORTLIST_ITEMS);
}

export function isShortlisted(items: CompareShortlistItem[], product: Pick<Product, 'productId' | 'favoriteId' | 'source' | 'variantKey'>): boolean {
    const targetId = buildFavoriteDocId(product);
    return items.some((item) => buildFavoriteDocId(item) === targetId);
}

export function upsertCompareShortlistItem(items: CompareShortlistItem[], product: Product, savedAt: number = Date.now()): CompareShortlistItem[] {
    const targetId = buildFavoriteDocId(product);
    const nextItem = buildCompareShortlistItem(product, savedAt);

    return [
        nextItem,
        ...items.filter((item) => buildFavoriteDocId(item) !== targetId),
    ].slice(0, MAX_COMPARE_SHORTLIST_ITEMS);
}

export function removeCompareShortlistItem(items: CompareShortlistItem[], productOrId: string | Pick<Product, 'productId' | 'favoriteId' | 'source' | 'variantKey'>): CompareShortlistItem[] {
    const targetId = typeof productOrId === 'string' ? productOrId : buildFavoriteDocId(productOrId);
    return items.filter((item) => buildFavoriteDocId(item) !== targetId);
}
