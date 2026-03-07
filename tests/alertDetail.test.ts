import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product } from '../types/product';
import type { AlertInboxItem } from '../hooks/useAlertInbox.ts';
import { resolveFavoriteForAlert, suggestNextTargetPrice } from '../lib/favorites/alertDetail.ts';

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
        targetPrice: overrides.targetPrice,
    };
}

function alert(overrides: Partial<AlertInboxItem> = {}): AlertInboxItem {
    return {
        createdAt: overrides.createdAt || Date.now(),
        id: overrides.id || 'alert-1',
        message: overrides.message || '가격이 내려왔습니다.',
        read: overrides.read ?? true,
        title: overrides.title || '가격 알림',
        type: overrides.type || 'alert',
        favoriteId: overrides.favoriteId,
        productId: overrides.productId,
        source: overrides.source,
        variantKey: overrides.variantKey,
        targetPrice: overrides.targetPrice,
        currentPrice: overrides.currentPrice,
        deepLink: overrides.deepLink,
        link: overrides.link,
        mallName: overrides.mallName,
        variantLabel: overrides.variantLabel,
        cheapestLink: overrides.cheapestLink,
        cheapestMall: overrides.cheapestMall,
        cheapestPrice: overrides.cheapestPrice,
    };
}

test('resolveFavoriteForAlert prefers favoriteId match', () => {
    const result = resolveFavoriteForAlert(
        alert({ favoriteId: 'MUSINSA:item-1:black-l' }),
        [
            favorite({ favoriteId: 'MUSINSA:item-1:black-l', variantKey: 'black-l' }),
            favorite({ favoriteId: 'MUSINSA:item-1:black-m', variantKey: 'black-m' }),
        ]
    );

    assert.equal(result?.variantKey, 'black-l');
});

test('resolveFavoriteForAlert falls back to product source and variant key', () => {
    const result = resolveFavoriteForAlert(
        alert({ productId: 'item-1', source: 'MUSINSA', variantKey: 'black-m' }),
        [
            favorite({ favoriteId: 'MUSINSA:item-1:black-l', variantKey: 'black-l' }),
            favorite({ favoriteId: 'MUSINSA:item-1:black-m', variantKey: 'black-m' }),
        ]
    );

    assert.equal(result?.variantKey, 'black-m');
});

test('suggestNextTargetPrice defaults to 5 percent below current price', () => {
    assert.equal(suggestNextTargetPrice(100000, undefined), 95000);
    assert.equal(suggestNextTargetPrice(103500, undefined), 98000);
});

test('suggestNextTargetPrice keeps lower explicit target', () => {
    assert.equal(suggestNextTargetPrice(100000, 92000), 92000);
});
