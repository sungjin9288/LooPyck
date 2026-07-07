import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildCommerceDataFromTexts,
    parseAblyCommerceData,
    parseHagoCommerceData,
    parseMusinsaCommerceData,
    parseNaverCommerceData,
    parseTwentyNineCmCommerceData,
    parseWConceptCommerceData,
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

test('wconcept commerce parser maps finalPrice discount and active status code', () => {
    const parsed = parseWConceptCommerceData({
        salePrice: 79000,
        finalPrice: 69520,
        couponRate: 8,
        statusCd: '01',
    }, 79000);

    assert.equal(parsed.benefitPrice, 69520);
    assert.ok(parsed.benefitText && parsed.benefitText.length > 0);
    assert.equal(parsed.stockStatus, 'in_stock');
});

test('wconcept commerce parser skips non-discount finalPrice and leaves unknown status codes unset', () => {
    const parsed = parseWConceptCommerceData({
        salePrice: 38000,
        finalPrice: 38000,
        couponRate: 0,
        statusCd: '04',
    }, 38000);

    // finalPrice == basePrice → 혜택가 아님
    assert.equal(parsed.benefitPrice, undefined);
    // statusCd가 '01'(판매중) 외 값이면 의미가 불확실하므로 재고 상태를 단정하지 않음
    assert.equal(parsed.stockStatus, undefined);
});

test('hago commerce parser maps dc_1_price discount, sold-out and free-delivery flags', () => {
    const parsed = parseHagoCommerceData({
        sell_price: 43900,
        dc_1_price: 35998,
        is_soldout: false,
        addInfo: { is_free_delivery: true },
    }, 43900);

    assert.equal(parsed.benefitPrice, 35998);
    assert.ok(parsed.benefitText && parsed.benefitText.length > 0);
    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.stockStatus, 'in_stock');
});

test('hago commerce parser marks sold-out items and skips non-discount dc_1_price', () => {
    const parsed = parseHagoCommerceData({
        sell_price: 29452,
        dc_1_price: 29452,
        is_soldout: true,
        addInfo: { is_free_delivery: false },
    }, 29452);

    assert.equal(parsed.benefitPrice, undefined);
    assert.equal(parsed.stockStatus, 'sold_out');
    assert.equal(parsed.shippingFee, undefined);
});

test('hago commerce parser uses discount_step1_v2 coupon title as descriptive benefit text', () => {
    const parsed = parseHagoCommerceData({
        sell_price: 43900,
        dc_1_price: 35998,
        is_soldout: false,
        addInfo: { is_free_delivery: true },
        discount_step1_v2: {
            coupon_title: '전상품 18% 쿠폰',
            discount_amount_krw: 7902,
        },
    }, 43900);

    assert.equal(parsed.benefitPrice, 35998);
    assert.equal(parsed.benefitText, '전상품 18% 쿠폰');
});

test('hago commerce parser falls back to generic benefit text when coupon_title is missing', () => {
    const parsed = parseHagoCommerceData({
        sell_price: 43900,
        dc_1_price: 35998,
        is_soldout: false,
        addInfo: { is_free_delivery: true },
    }, 43900);

    assert.equal(parsed.benefitPrice, 35998);
    assert.equal(parsed.benefitText, 'HAGO 할인가');
});

test('ably commerce parser maps delivery_type to a descriptive shipping label', () => {
    const parsedStandard = parseAblyCommerceData({ delivery_type: 'standard' }, 30400);
    assert.equal(parsedStandard.shippingText, '일반배송');

    const parsedToday = parseAblyCommerceData({ delivery_type: 'today' }, 30400);
    assert.equal(parsedToday.shippingText, '오늘출발');

    const parsedShak = parseAblyCommerceData({ delivery_type: 'shak' }, 30400);
    assert.equal(parsedShak.shippingText, '샥배송');

    const parsedThirdPl = parseAblyCommerceData({ delivery_type: 'third_pl' }, 30400);
    assert.equal(parsedThirdPl.shippingText, '위탁배송');
});

test('ably commerce parser leaves shipping fields unset for unrecognized or missing delivery_type', () => {
    const parsed = parseAblyCommerceData({ delivery_type: 'some_new_unknown_type' }, 30400);
    assert.equal(parsed.shippingText, undefined);

    const parsedMissing = parseAblyCommerceData({}, 30400);
    assert.equal(parsedMissing.shippingText, undefined);
});

test('ably commerce parser does not map original_price to benefitPrice (it is higher than sale price, not a discount)', () => {
    const parsed = parseAblyCommerceData({
        delivery_type: 'standard',
        first_page_rendering: {
            original_price: 38000,
            price: 30400,
        },
    }, 30400);

    assert.equal(parsed.benefitPrice, undefined);
});

test('ably commerce parser never sets stockStatus (no sold-out signal exists in the API)', () => {
    const parsed = parseAblyCommerceData({ delivery_type: 'standard' }, 30400);
    assert.equal(parsed.stockStatus, undefined);
    assert.equal(parsed.stockText, undefined);
});
