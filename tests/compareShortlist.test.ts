import test from 'node:test';
import assert from 'node:assert/strict';
import type { Product } from '../types/product.ts';
import {
    MAX_COMPARE_SHORTLIST_ITEMS,
    isShortlisted,
    parseCompareShortlist,
    removeCompareShortlistItem,
    upsertCompareShortlistItem,
} from '../lib/product/compareShortlist.ts';

function product(overrides: Partial<Product>): Product {
    return {
        favoriteId: overrides.favoriteId,
        title: overrides.title || '기본 상품',
        link: overrides.link || 'https://example.com/item',
        image: overrides.image || 'https://example.com/item.jpg',
        lprice: overrides.lprice || '100000',
        hprice: overrides.hprice || '100000',
        mallName: overrides.mallName || '무신사',
        productId: overrides.productId || 'test-item',
        productType: overrides.productType || '1',
        brand: overrides.brand || '테스트 브랜드',
        maker: overrides.maker || '',
        category1: overrides.category1 || '신발',
        category2: overrides.category2 || '스니커즈',
        category3: overrides.category3 || '',
        category4: overrides.category4 || '',
        source: overrides.source || 'MUSINSA',
        variantKey: overrides.variantKey,
        variantLabel: overrides.variantLabel,
        variantId: overrides.variantId,
        variantSku: overrides.variantSku,
        optionKey: overrides.optionKey,
        deepLink: overrides.deepLink || '/product/test-item?source=MUSINSA',
        targetPrice: overrides.targetPrice,
        alertSnoozedUntil: overrides.alertSnoozedUntil,
    };
}

test('upsert compare shortlist keeps newest item first and dedupes by favorite identity', () => {
    const first = upsertCompareShortlistItem([], product({ productId: 'item-1' }), 100);
    const second = upsertCompareShortlistItem(first, product({ productId: 'item-2' }), 200);
    const deduped = upsertCompareShortlistItem(second, product({ productId: 'item-1' }), 300);

    assert.deepEqual(deduped.map((item) => item.productId), ['item-1', 'item-2']);
    assert.equal(deduped[0]?.savedAt, 300);
});

test('compare shortlist respects max item cap', () => {
    let items = parseCompareShortlist([]);

    for (let index = 0; index < MAX_COMPARE_SHORTLIST_ITEMS + 2; index += 1) {
        items = upsertCompareShortlistItem(items, product({ productId: `item-${index}` }), index);
    }

    assert.equal(items.length, MAX_COMPARE_SHORTLIST_ITEMS);
    assert.equal(items[0]?.productId, `item-${MAX_COMPARE_SHORTLIST_ITEMS + 1}`);
});

test('compare shortlist remove and contains use favorite identity', () => {
    const variantProduct = product({
        productId: 'item-1',
        source: 'MUSINSA',
        variantKey: 'black-260',
        variantLabel: '블랙 / 260',
    });
    const items = upsertCompareShortlistItem([], variantProduct, 100);

    assert.equal(isShortlisted(items, variantProduct), true);
    assert.equal(removeCompareShortlistItem(items, variantProduct).length, 0);
});
