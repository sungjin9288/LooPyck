import type { Product } from '../../types/product';
import { isFavoriteAlertSnoozed } from './alertState.ts';
import { buildFavoriteBaseKey, buildFavoriteDocId } from './favoriteProduct.ts';

export interface FavoriteAlertItem {
    currentPrice: number;
    docId: string;
    favorite: Product;
    gapToTarget: number;
    isReached: boolean;
    isSnoozed: boolean;
    snoozedUntil?: number;
    targetPrice: number;
}

export interface FavoriteGroup {
    alertCount: number;
    baseKey: string;
    baseProductId: string;
    currentLowestPrice: number;
    deepLink?: string;
    mallNames: string[];
    products: Product[];
    representative: Product;
    targetLowestPrice?: number;
    title: string;
    totalCount: number;
    variantCount: number;
    variantLabels: string[];
    snoozedAlertCount: number;
}

function parsePrice(value: string | undefined): number {
    if (typeof value !== 'string') {
        return 0;
    }

    const parsed = Number.parseInt(value.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function toDistinct(values: Array<string | undefined>, limit: number): string[] {
    return Array.from(new Set(
        values
            .map((value) => value?.trim())
            .filter(Boolean) as string[]
    )).slice(0, limit);
}

function pickRepresentative(products: Product[]): Product {
    return products.find((product) => Boolean(product.deepLink))
        || products.find((product) => typeof product.targetPrice === 'number' && product.targetPrice > 0)
        || products[0];
}

export function listFavoriteAlerts(products: Product[]): FavoriteAlertItem[] {
    return products
        .filter((product) => typeof product.targetPrice === 'number' && product.targetPrice > 0)
        .map((favorite) => {
            const currentPrice = parsePrice(favorite.lprice);
            const targetPrice = Number(favorite.targetPrice);
            const gapToTarget = currentPrice - targetPrice;

            return {
                currentPrice,
                docId: buildFavoriteDocId(favorite),
                favorite,
                gapToTarget,
                isReached: gapToTarget <= 0,
                isSnoozed: isFavoriteAlertSnoozed(favorite),
                snoozedUntil: favorite.alertSnoozedUntil,
                targetPrice,
            };
        })
        .sort((left, right) => {
            if (left.isSnoozed !== right.isSnoozed) {
                return left.isSnoozed ? 1 : -1;
            }

            if (left.isReached !== right.isReached) {
                return left.isReached ? -1 : 1;
            }

            const leftGap = Math.abs(left.gapToTarget);
            const rightGap = Math.abs(right.gapToTarget);
            if (leftGap !== rightGap) {
                return leftGap - rightGap;
            }

            return left.favorite.title.localeCompare(right.favorite.title, 'ko');
        });
}

export function groupFavoritesByBaseProduct(products: Product[]): FavoriteGroup[] {
    const groups = new Map<string, Product[]>();

    products.forEach((product) => {
        const key = buildFavoriteBaseKey(product);
        const current = groups.get(key) || [];
        current.push(product);
        groups.set(key, current);
    });

    return Array.from(groups.entries())
        .map(([baseKey, groupedProducts]) => {
            const representative = pickRepresentative(groupedProducts);
            const prices = groupedProducts.map((product) => parsePrice(product.lprice)).filter((price) => price > 0);
            const targets = groupedProducts
                .map((product) => (typeof product.targetPrice === 'number' && product.targetPrice > 0 ? product.targetPrice : undefined))
                .filter((price): price is number => typeof price === 'number');

            return {
                alertCount: groupedProducts.filter((product) => typeof product.targetPrice === 'number' && product.targetPrice > 0).length,
                baseKey,
                baseProductId: representative.productId,
                currentLowestPrice: prices.length > 0 ? Math.min(...prices) : 0,
                deepLink: representative.deepLink,
                mallNames: toDistinct(groupedProducts.map((product) => product.mallName), 4),
                products: groupedProducts,
                representative,
                targetLowestPrice: targets.length > 0 ? Math.min(...targets) : undefined,
                title: representative.title,
                totalCount: groupedProducts.length,
                variantCount: groupedProducts.filter((product) => Boolean(product.variantKey || product.variantLabel)).length,
                variantLabels: toDistinct(groupedProducts.map((product) => product.variantLabel), 5),
                snoozedAlertCount: groupedProducts.filter((product) => typeof product.targetPrice === 'number' && product.targetPrice > 0 && isFavoriteAlertSnoozed(product)).length,
            } satisfies FavoriteGroup;
        })
        .sort((left, right) => {
            if (left.alertCount !== right.alertCount) {
                return right.alertCount - left.alertCount;
            }

            if (left.totalCount !== right.totalCount) {
                return right.totalCount - left.totalCount;
            }

            if (left.currentLowestPrice !== right.currentLowestPrice) {
                return left.currentLowestPrice - right.currentLowestPrice;
            }

            return left.title.localeCompare(right.title, 'ko');
        });
}
