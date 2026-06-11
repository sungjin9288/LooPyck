import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePurchaseOffers } from '../lib/product/purchasePricing.ts';
import { buildPurchaseDecisionSummary } from '../lib/product/purchaseDecision.ts';
import type { UnifiedProduct } from '../lib/api/types.ts';

function product(overrides: Partial<UnifiedProduct>): UnifiedProduct {
    return {
        id: overrides.id || 'test-item',
        title: overrides.title || '기본 상품',
        price: overrides.price || 100000,
        image: overrides.image || 'https://example.com/item.jpg',
        link: overrides.link || `https://example.com/${overrides.id || 'test-item'}`,
        mallName: overrides.mallName || '테스트몰',
        brand: overrides.brand,
        category1: overrides.category1,
        category2: overrides.category2,
        source: overrides.source || 'MUSINSA',
        normalizedTitle: overrides.normalizedTitle,
        shippingFee: overrides.shippingFee,
        shippingFreeThreshold: overrides.shippingFreeThreshold,
        shippingText: overrides.shippingText,
        benefitPrice: overrides.benefitPrice,
        benefitText: overrides.benefitText,
        stockStatus: overrides.stockStatus,
        stockText: overrides.stockText,
        optionSummary: overrides.optionSummary,
        optionValues: overrides.optionValues,
        sizeOptions: overrides.sizeOptions,
        colorOptions: overrides.colorOptions,
        variantCandidates: overrides.variantCandidates,
        detailCollectedAt: overrides.detailCollectedAt,
    };
}

test('purchase decision summary promotes selected variant support and fit guidance', () => {
    const offers = comparePurchaseOffers([
        product({
            id: 'musinsa',
            title: '나이키 조던 1 로우 블랙',
            category1: '신발',
            mallName: '무신사',
            source: 'MUSINSA',
            price: 139000,
            shippingFee: 0,
            shippingText: '무료배송',
            stockStatus: 'in_stock',
            optionSummary: '블랙 / 260',
            colorOptions: ['블랙'],
            sizeOptions: ['260', '265'],
        }),
        product({
            id: 'wconcept',
            title: '나이키 조던 1 로우 블랙',
            category1: '신발',
            mallName: 'W컨셉',
            source: 'W_CONCEPT',
            price: 142000,
            shippingFee: 3000,
            shippingText: '배송비 3,000원',
            stockStatus: 'low_stock',
            optionSummary: '블랙 / 260',
            colorOptions: ['블랙'],
            sizeOptions: ['260'],
        }),
        product({
            id: 'ably',
            title: '나이키 조던 1 로우 블랙',
            category1: '신발',
            mallName: '에이블리',
            source: 'ABLY',
            price: 137000,
            stockStatus: 'sold_out',
            stockText: '선택 variant 미지원',
        }),
    ]);

    const summary = buildPurchaseDecisionSummary({
        offers,
        productName: '나이키 조던 1 로우 블랙',
        category: '신발',
        selectedVariantLabel: '블랙 / 260',
    });

    const optionCard = summary.cards.find((card) => card.key === 'option');
    const stockCard = summary.cards.find((card) => card.key === 'stock');
    const shippingCard = summary.cards.find((card) => card.key === 'shipping');
    const fitCard = summary.cards.find((card) => card.key === 'fit');

    assert.ok(summary.headline.includes('무신사'));
    assert.equal(optionCard?.tone, 'positive');
    assert.ok(optionCard?.headline.includes('블랙 / 260'));
    assert.ok(optionCard?.detail.includes('2개 쇼핑몰'));
    assert.ok(stockCard?.headline.includes('2곳 구매 가능'));
    assert.ok(stockCard?.pills.includes('재고 적음 1곳'));
    assert.ok(shippingCard?.headline.includes('무료배송 1곳'));
    assert.ok(shippingCard?.pills.includes('실배송 확인 2곳'));
    assert.equal(fitCard?.headline, '반업(+5mm) 추천');
});

test('purchase decision summary warns when options do not align and stock is gone', () => {
    const offers = comparePurchaseOffers([
        product({
            id: 'musinsa',
            title: '아디다스 삼바 OG 블랙',
            source: 'MUSINSA',
            mallName: '무신사',
            price: 129000,
            stockStatus: 'sold_out',
            optionSummary: '블랙 / 240',
            colorOptions: ['블랙'],
            sizeOptions: ['240'],
        }),
        product({
            id: 'wconcept',
            title: '아디다스 삼바 OG 화이트',
            source: 'W_CONCEPT',
            mallName: 'W컨셉',
            price: 131000,
            stockStatus: 'sold_out',
            optionSummary: '화이트 / 260',
            colorOptions: ['화이트'],
            sizeOptions: ['260'],
        }),
    ]);

    const summary = buildPurchaseDecisionSummary({
        offers,
        productName: '아디다스 삼바 OG',
        category: '신발',
    });

    const optionCard = summary.cards.find((card) => card.key === 'option');
    const stockCard = summary.cards.find((card) => card.key === 'stock');

    assert.ok(summary.headline.includes('재고 재확인'));
    assert.equal(optionCard?.tone, 'danger');
    assert.equal(optionCard?.headline, '공통 옵션 미확인');
    assert.equal(stockCard?.tone, 'danger');
    assert.equal(stockCard?.headline, '구매 가능 재고 없음');
});
