import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildCommerceDataFromTexts,
    parseMusinsaCommerceData,
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

test('musinsa commerce parser maps coupon/final price, sold-out flag and plus delivery', () => {
    const parsed = parseMusinsaCommerceData({
        normalPrice: 59000,
        price: 38000,
        couponPrice: 35000,
        finalPrice: 35000,
        isSoldOut: false,
        plusDeliveryGuideText: '무료배송',
        isPlusDelivery: true,
    }, 38000);

    assert.equal(parsed.benefitPrice, 35000);
    assert.ok(parsed.benefitText && parsed.benefitText.length > 0);
    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.shippingText, '무료배송');
    assert.equal(parsed.stockStatus, 'in_stock');
});

test('musinsa commerce parser marks sold-out items and skips non-discount prices', () => {
    const parsed = parseMusinsaCommerceData({
        normalPrice: 59000,
        price: 38000,
        couponPrice: null,
        finalPrice: 38000,
        isSoldOut: true,
        plusDeliveryGuideText: '',
        isPlusDelivery: false,
    }, 38000);

    // finalPrice == basePrice → 혜택가 아님
    assert.equal(parsed.benefitPrice, undefined);
    assert.equal(parsed.stockStatus, 'sold_out');
});

test('musinsa commerce parser labels plus delivery when guide text is empty', () => {
    const parsed = parseMusinsaCommerceData({
        price: 42000,
        finalPrice: 42000,
        isSoldOut: false,
        plusDeliveryGuideText: '',
        isPlusDelivery: true,
    }, 42000);

    assert.equal(parsed.shippingText, '플러스배송');
    assert.equal(parsed.stockStatus, 'in_stock');
});
