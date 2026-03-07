import type { Product } from '../../types/product';
import type { AlertInboxItem } from '../../hooks/useAlertInbox.ts';
import { buildFavoriteDocId } from './favoriteProduct.ts';

export function resolveFavoriteForAlert(alert: AlertInboxItem, favorites: Product[]): Product | undefined {
    return favorites.find((favorite) => {
        const favoriteId = buildFavoriteDocId(favorite);

        if (alert.favoriteId && favoriteId === alert.favoriteId) {
            return true;
        }

        if (alert.variantKey && favorite.variantKey && alert.productId === favorite.productId) {
            return favorite.variantKey === alert.variantKey;
        }

        if (alert.productId && favorite.productId === alert.productId && alert.source && favorite.source === alert.source) {
            return true;
        }

        return false;
    });
}

export function suggestNextTargetPrice(currentPrice?: number, targetPrice?: number): number | undefined {
    if (!Number.isFinite(currentPrice) || (currentPrice || 0) <= 0) {
        return Number.isFinite(targetPrice) && (targetPrice || 0) > 0 ? targetPrice : undefined;
    }

    if (!Number.isFinite(targetPrice) || (targetPrice || 0) <= 0) {
        return Math.max(1000, Math.floor((currentPrice as number) * 0.95 / 1000) * 1000);
    }

    if ((targetPrice as number) < (currentPrice as number)) {
        return targetPrice;
    }

    return Math.max(1000, Math.floor((currentPrice as number) * 0.95 / 1000) * 1000);
}
