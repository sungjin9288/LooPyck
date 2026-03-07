import test from 'node:test';
import assert from 'node:assert/strict';
import type { AlertInboxItem } from '../hooks/useAlertInbox.ts';
import { filterAlertsByHistoryView, getAlertHistoryCounts } from '../lib/favorites/alertInbox.ts';

function alert(overrides: Partial<AlertInboxItem> = {}): AlertInboxItem {
    return {
        createdAt: overrides.createdAt || Date.now(),
        id: overrides.id || 'alert-1',
        message: overrides.message || '가격이 내려왔습니다.',
        read: overrides.read ?? false,
        title: overrides.title || '가격 알림',
        type: overrides.type || 'alert',
        archivedAt: overrides.archivedAt,
        currentPrice: overrides.currentPrice,
        deepLink: overrides.deepLink,
        favoriteId: overrides.favoriteId,
        link: overrides.link,
        mallName: overrides.mallName,
        productId: overrides.productId,
        readAt: overrides.readAt,
        source: overrides.source,
        targetPrice: overrides.targetPrice,
        variantKey: overrides.variantKey,
        variantLabel: overrides.variantLabel,
        cheapestLink: overrides.cheapestLink,
        cheapestMall: overrides.cheapestMall,
        cheapestPrice: overrides.cheapestPrice,
    };
}

test('getAlertHistoryCounts separates active unread and archived alerts', () => {
    const counts = getAlertHistoryCounts([
        alert({ id: 'active-read', read: true }),
        alert({ id: 'active-unread', read: false }),
        alert({ id: 'archived', read: false, archivedAt: Date.now() }),
    ]);

    assert.deepEqual(counts, {
        active: 2,
        archived: 1,
        unread: 1,
    });
});

test('filterAlertsByHistoryView returns only unread active alerts', () => {
    const result = filterAlertsByHistoryView([
        alert({ id: 'active-read', read: true }),
        alert({ id: 'active-unread', read: false }),
        alert({ id: 'archived', read: false, archivedAt: Date.now() }),
    ], 'unread');

    assert.deepEqual(result.map((item) => item.id), ['active-unread']);
});
