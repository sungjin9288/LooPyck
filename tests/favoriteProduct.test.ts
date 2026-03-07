import test from 'node:test';
import assert from 'node:assert/strict';
import { buildFavoriteBaseKey, buildFavoriteDocId, buildFavoriteProductFromUnified, dedupeFavoritesForInsights } from '../lib/favorites/favoriteProduct.ts';
import type { UnifiedProduct } from '../lib/api/types.ts';

function product(overrides: Partial<UnifiedProduct> = {}): UnifiedProduct {
    return {
        id: overrides.id || 'item-1',
        title: overrides.title || '테스트 상품',
        price: overrides.price || 129000,
        image: overrides.image || 'https://example.com/item.jpg',
        link: overrides.link || 'https://example.com/item',
        mallName: overrides.mallName || '무신사',
        source: overrides.source || 'MUSINSA',
        brand: overrides.brand,
        category1: overrides.category1,
        category2: overrides.category2,
        shippingFee: overrides.shippingFee,
        shippingFreeThreshold: overrides.shippingFreeThreshold,
        shippingText: overrides.shippingText,
        benefitPrice: overrides.benefitPrice,
        benefitText: overrides.benefitText,
        stockStatus: overrides.stockStatus,
        stockText: overrides.stockText,
        variantId: overrides.variantId,
        variantSku: overrides.variantSku,
        optionSummary: overrides.optionSummary,
        optionValues: overrides.optionValues,
        sizeOptions: overrides.sizeOptions,
        colorOptions: overrides.colorOptions,
        variantCandidates: overrides.variantCandidates,
        detailCollectedAt: overrides.detailCollectedAt,
    };
}

test('favorite doc id falls back to product id without variant selection', () => {
    assert.equal(buildFavoriteDocId({ productId: 'item-1' }), 'item-1');
});

test('favorite doc id includes source and variant key for variant-specific favorites', () => {
    assert.equal(
        buildFavoriteDocId({ productId: 'item-1', source: 'MUSINSA', variantKey: 'variant-black-l' }),
        'MUSINSA:item-1:variant-black-l'
    );
});

test('favorite base key ignores variant selection', () => {
    assert.equal(
        buildFavoriteBaseKey({ productId: 'item-1', source: 'MUSINSA' }),
        'MUSINSA:item-1'
    );
});

test('favorite product builder preserves variant metadata and deep link', () => {
    const favorite = buildFavoriteProductFromUnified(product({
        id: 'item-42',
        source: '29CM',
        variantId: 'VAR-BLACK-L',
        variantSku: 'SKU-BLACK-L',
    }), {
        variantKey: 'variant-black-l',
        variantLabel: '블랙 / L',
        optionKey: 'opt_black_l',
    });

    assert.equal(favorite.favoriteId, '29CM:item-42:variant-black-l');
    assert.equal(favorite.variantKey, 'variant-black-l');
    assert.equal(favorite.variantLabel, '블랙 / L');
    assert.equal(favorite.variantId, 'VAR-BLACK-L');
    assert.equal(favorite.variantSku, 'SKU-BLACK-L');
    assert.equal(favorite.optionKey, 'opt_black_l');
    assert.match(favorite.deepLink || '', /variantKey=variant-black-l/);
});

test('favorites for insights are deduped by base product key', () => {
    const deduped = dedupeFavoritesForInsights([
        {
            favoriteId: 'MUSINSA:item-42:variant-black-l',
            title: '테스트 상품',
            link: 'https://example.com/item',
            image: 'https://example.com/item.jpg',
            lprice: '129000',
            hprice: '129000',
            mallName: '무신사',
            productId: 'item-42',
            productType: '1',
            brand: '테스트',
            maker: '',
            category1: '상의',
            category2: '후드',
            category3: '',
            category4: '',
            source: 'MUSINSA',
            variantKey: 'variant-black-l',
        },
        {
            favoriteId: 'MUSINSA:item-42:variant-black-m',
            title: '테스트 상품',
            link: 'https://example.com/item',
            image: 'https://example.com/item.jpg',
            lprice: '129000',
            hprice: '129000',
            mallName: '무신사',
            productId: 'item-42',
            productType: '1',
            brand: '테스트',
            maker: '',
            category1: '상의',
            category2: '후드',
            category3: '',
            category4: '',
            source: 'MUSINSA',
            variantKey: 'variant-black-m',
        },
    ]);

    assert.equal(deduped.length, 1);
    assert.equal(deduped[0]?.variantKey, 'variant-black-l');
});
