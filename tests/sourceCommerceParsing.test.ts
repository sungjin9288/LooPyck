import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildCommerceDataFromTexts,
    parseNaverCommerceData,
    parseTwentyNineCmCommerceData,
} from '../lib/product/sourceCommerceParsing.ts';

test('text-based commerce parser extracts musinsa-like shipping, benefit and stock signals', () => {
    const parsed = buildCommerceDataFromTexts({
        basePrice: 129000,
        shippingText: '배송비 3,000원 / 50,000원 이상 무료',
        benefitText: '회원가 119,000원',
        stockText: '판매중',
    });

    assert.equal(parsed.shippingFee, 3000);
    assert.equal(parsed.shippingFreeThreshold, 50000);
    assert.equal(parsed.benefitPrice, 119000);
    assert.equal(parsed.stockStatus, 'in_stock');
});

test('29CM commerce parser prefers direct API fields over generic text inference', () => {
    const parsed = parseTwentyNineCmCommerceData({
        memberPrice: 91000,
        shippingPrice: 2500,
        freeShippingStandardAmount: 80000,
        deliveryInfo: '배송비 2,500원 / 80,000원 이상 무료',
        soldOut: true,
    }, 99000);

    assert.equal(parsed.benefitPrice, 91000);
    assert.equal(parsed.shippingFee, 2500);
    assert.equal(parsed.shippingFreeThreshold, 80000);
    assert.equal(parsed.stockStatus, 'sold_out');
});

test('naver commerce parser can preserve fallback delivery and benefit metadata when present', () => {
    const parsed = parseNaverCommerceData({
        deliveryFeeContent: '배송비 3,000원 / 70,000원 이상 무료',
        discountPrice: '87000',
        availability: '판매중',
    }, 92000);

    assert.equal(parsed.shippingFee, 3000);
    assert.equal(parsed.shippingFreeThreshold, 70000);
    assert.equal(parsed.benefitPrice, 87000);
    assert.equal(parsed.stockStatus, 'in_stock');
});
