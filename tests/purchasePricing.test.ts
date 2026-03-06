import test from 'node:test';
import assert from 'node:assert/strict';
import { comparePurchaseOffers, estimatePurchasePrice, inferStockStatus } from '../lib/product/purchasePricing.ts';
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
    };
}

test('shipping fee is waived when source threshold is met', () => {
    const estimate = estimatePurchasePrice(product({
        source: 'MUSINSA',
        price: 35000,
    }));

    assert.equal(estimate.shippingFee, 0);
    assert.equal(estimate.checkoutPrice, 35000);
});

test('coupon potential discount respects cap amount', () => {
    const estimate = estimatePurchasePrice(product({
        source: 'W_CONCEPT',
        price: 300000,
    }));

    assert.equal(estimate.potentialCouponDiscount, 25000);
    assert.equal(estimate.bestCasePrice, estimate.checkoutPrice - 25000);
});

test('actual shipping and benefit data override estimated source rules', () => {
    const estimate = estimatePurchasePrice(product({
        source: 'MUSINSA',
        price: 100000,
        shippingFee: 6000,
        shippingFreeThreshold: 150000,
        shippingText: '배송비 6,000원 / 150,000원 이상 무료',
        benefitPrice: 91000,
        benefitText: '회원가 91,000원',
    }));

    assert.equal(estimate.shippingFee, 6000);
    assert.equal(estimate.checkoutPrice, 106000);
    assert.equal(estimate.potentialCouponDiscount, 9000);
    assert.equal(estimate.bestCasePrice, 97000);
    assert.equal(estimate.shippingEstimated, false);
});

test('explicit stock status beats title inference', () => {
    const estimate = estimatePurchasePrice(product({
        title: '나이키 코르테즈',
        stockStatus: 'sold_out',
        stockText: '품절',
    }));

    assert.equal(estimate.isAvailable, false);
    assert.equal(estimate.stockStatus, 'sold_out');
});

test('sold out keywords are detected from title', () => {
    const status = inferStockStatus(product({
        title: '아디다스 삼바 OG 블랙 품절',
    }));

    assert.equal(status, 'sold_out');
});

test('purchase offers sort sold-out items behind available options', () => {
    const offers = comparePurchaseOffers([
        product({
            id: 'sold-out',
            title: '나이키 코르테즈 품절',
            source: 'MUSINSA',
            price: 90000,
        }),
        product({
            id: 'available',
            title: '나이키 코르테즈',
            source: '29CM',
            price: 92000,
        }),
    ]);

    assert.equal(offers[0].product.id, 'available');
    assert.equal(offers[1].product.id, 'sold-out');
});
