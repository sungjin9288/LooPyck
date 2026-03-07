import test from 'node:test';
import assert from 'node:assert/strict';
import type { UnifiedProduct } from '../lib/api/types.ts';
import {
    applyVariantSelectionToProducts,
    getDefaultVariantSelectionKey,
    listVariantSelectionOptions,
} from '../lib/product/variantSelection.ts';

function product(overrides: Partial<UnifiedProduct>): UnifiedProduct {
    return {
        id: overrides.id || 'item-1',
        title: overrides.title || '테스트 상품',
        price: overrides.price || 129000,
        image: overrides.image || 'https://example.com/item.jpg',
        link: overrides.link || 'https://example.com/item',
        mallName: overrides.mallName || '테스트몰',
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

test('variant selection options merge the same candidate across malls', () => {
    const products = [
        product({
            source: 'MUSINSA',
            mallName: '무신사',
            variantCandidates: [
                { label: '블랙/L', color: '블랙', size: 'L', variantSku: 'SKU-BLACK-L' },
            ],
        }),
        product({
            id: 'item-2',
            source: '29CM',
            mallName: '29CM',
            variantCandidates: [
                { label: '블랙/L', color: '블랙', size: 'L', variantSku: 'SKU-BLACK-L' },
                { label: '블랙/M', color: '블랙', size: 'M', variantSku: 'SKU-BLACK-M' },
            ],
        }),
    ];

    const options = listVariantSelectionOptions(products, products[0]);
    assert.equal(options[0]?.label, '블랙/L');
    assert.equal(options[0]?.matchedMallCount, 2);
});

test('default variant selection prefers the current product variant', () => {
    const primaryProduct = product({
        variantId: 'VAR-L',
        variantSku: 'SKU-L',
        optionSummary: '색상 블랙 · 사이즈 L',
        variantCandidates: [
            { label: '블랙/L', color: '블랙', size: 'L', variantId: 'VAR-L', variantSku: 'SKU-L' },
            { label: '블랙/M', color: '블랙', size: 'M', variantId: 'VAR-M', variantSku: 'SKU-M' },
        ],
    });

    const selectedKey = getDefaultVariantSelectionKey([primaryProduct], primaryProduct);
    const options = listVariantSelectionOptions([primaryProduct], primaryProduct);

    assert.equal(selectedKey, options.find((option) => option.variantSku === 'SKU-L')?.key);
});

test('variant selection applies candidate price and marks unsupported malls unavailable', () => {
    const primaryProduct = product({
        source: 'MUSINSA',
        variantCandidates: [
            { label: '블랙/L', color: '블랙', size: 'L', variantSku: 'SKU-L', price: 119000, stockStatus: 'in_stock' },
        ],
    });
    const secondaryProduct = product({
        id: 'item-2',
        source: '29CM',
        variantCandidates: [
            { label: '블랙/M', color: '블랙', size: 'M', variantSku: 'SKU-M', price: 99000, stockStatus: 'in_stock' },
        ],
    });

    const selected = listVariantSelectionOptions([primaryProduct, secondaryProduct], primaryProduct)
        .find((option) => option.label === '블랙/L');

    const scoped = applyVariantSelectionToProducts([primaryProduct, secondaryProduct], selected);

    assert.equal(scoped[0]?.price, 119000);
    assert.equal(scoped[0]?.variantSku, 'SKU-L');
    assert.equal(scoped[0]?.optionSummary, '색상 블랙 · 사이즈 L');
    assert.equal(scoped[1]?.stockStatus, 'sold_out');
    assert.match(scoped[1]?.stockText || '', /선택 variant 미지원/);
});
