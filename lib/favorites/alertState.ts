import type { Product } from '../../types/product';

export type AlertPriority = 'critical' | 'high' | 'medium';

type AlertPriorityInput = {
    currentPrice?: number;
    targetPrice?: number;
    cheapestPrice?: number;
};

export function deriveAlertPriority({
    currentPrice,
    targetPrice,
    cheapestPrice,
}: AlertPriorityInput): AlertPriority {
    if (typeof currentPrice === 'number' && currentPrice > 0 && typeof cheapestPrice === 'number' && cheapestPrice > 0 && cheapestPrice < currentPrice) {
        return 'critical';
    }

    if (
        typeof currentPrice === 'number'
        && currentPrice > 0
        && typeof targetPrice === 'number'
        && targetPrice > 0
    ) {
        const ratio = currentPrice / targetPrice;

        if (ratio <= 0.9) {
            return 'critical';
        }

        if (ratio <= 1) {
            return 'high';
        }
    }

    return 'medium';
}

export function isFavoriteAlertSnoozed(
    favorite: Pick<Product, 'alertSnoozedUntil'> | { alertSnoozedUntil?: number },
    now: number = Date.now()
): boolean {
    return typeof favorite.alertSnoozedUntil === 'number' && favorite.alertSnoozedUntil > now;
}

export function buildAlertSnoozeUntil(hours: number, now: number = Date.now()): number {
    return now + hours * 60 * 60 * 1000;
}

export function formatAlertSnoozeUntil(timestamp?: number): string {
    if (typeof timestamp !== 'number' || !Number.isFinite(timestamp) || timestamp <= 0) {
        return '미설정';
    }

    return new Date(timestamp).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function alertPriorityLabel(priority: AlertPriority): string {
    switch (priority) {
        case 'critical':
            return '긴급';
        case 'high':
            return '높음';
        default:
            return '기본';
    }
}
