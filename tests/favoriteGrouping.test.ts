import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product } from '../types/product';
import { groupFavoritesByBaseProduct, listFavoriteAlerts } from '../lib/favorites/favoriteGrouping.ts';

function favorite(overrides: Partial<Product> = {}): Product {
    return {
        favoriteId: overrides.favoriteId,
        title: overrides.title || '테스트 상품',
        link: overrides.link || 'https://example.com/item',
        image: overrides.image || 'https://example.com/item.jpg',
        lprice: overrides.lprice || '129000',
        hprice: overrides.hprice || '129000',
        mallName: overrides.mallName || '무신사',
        productId: overrides.productId || 'item-1',
        productType: overrides.productType || '1',
        brand: overrides.brand || '테스트',
        maker: overrides.maker || '',
        category1: overrides.category1 || '상의',
        category2: overrides.category2 || '후드',
        category3: overrides.category3 || '',
        category4: overrides.category4 || '',
        source: overrides.source || 'MUSINSA',
        variantKey: overrides.variantKey,
        variantLabel: overrides.variantLabel,
        variantId: overrides.variantId,
        variantSku: overrides.variantSku,
        optionKey: overrides.optionKey,
        deepLink: overrides.deepLink,
        targetPrice: overrides.targetPrice,
        alertSnoozedUntil: overrides.alertSnoozedUntil,
    };
}

test('favorite grouping merges multiple variants under one base product', () => {
    const groups = groupFavoritesByBaseProduct([
        favorite({
            favoriteId: 'MUSINSA:item-1:black-l',
            variantKey: 'black-l',
            variantLabel: '블랙 / L',
            targetPrice: 99000,
        }),
        favorite({
            favoriteId: 'MUSINSA:item-1:black-m',
            variantKey: 'black-m',
            variantLabel: '블랙 / M',
            mallName: '무신사',
            source: 'MUSINSA',
        }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0]?.totalCount, 2);
    assert.equal(groups[0]?.variantCount, 2);
    assert.equal(groups[0]?.alertCount, 1);
    assert.deepEqual(groups[0]?.variantLabels, ['블랙 / L', '블랙 / M']);
});

test('favorite alerts are sorted by reached status and proximity to target', () => {
    const alerts = listFavoriteAlerts([
        favorite({ favoriteId: 'a', targetPrice: 130000, lprice: '129000' }),
        favorite({ favoriteId: 'b', targetPrice: 125000, lprice: '129000' }),
        favorite({ favoriteId: 'c', targetPrice: 90000, lprice: '129000' }),
    ]);

    assert.equal(alerts.length, 3);
    assert.equal(alerts[0]?.docId, 'a');
    assert.equal(alerts[0]?.isReached, true);
    assert.equal(alerts[1]?.docId, 'b');
    assert.equal(alerts[1]?.gapToTarget, 4000);
});

test('favorite alerts push snoozed targets behind active targets', () => {
    const alerts = listFavoriteAlerts([
        favorite({ favoriteId: 'active', targetPrice: 125000, lprice: '129000' }),
        favorite({ favoriteId: 'snoozed', targetPrice: 130000, lprice: '129000', alertSnoozedUntil: Date.now() + 60_000 }),
    ]);

    assert.equal(alerts[0]?.docId, 'active');
    assert.equal(alerts[1]?.isSnoozed, true);
});
