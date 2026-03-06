import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeVariantAlignment, detectVariantOptionSignal } from '../lib/product/variantAlignment.ts';
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

test('detects color and size signals from title and category text', () => {
    const signal = detectVariantOptionSignal(product({
        title: '뉴발란스 327 스니커즈 화이트 245',
        category1: '신발',
        category2: '스니커즈',
    }));

    assert.equal(signal.color, '화이트');
    assert.equal(signal.size, '245');
});

test('color-only mismatch is treated as medium risk', () => {
    const summary = analyzeVariantAlignment([
        product({
            id: 'item-1',
            title: '나이키 V2K 런 블랙',
            brand: '나이키',
            source: 'MUSINSA',
        }),
        product({
            id: 'item-2',
            title: '나이키 V2K 런 화이트',
            brand: '나이키',
            source: '29CM',
        }),
    ]);

    assert.equal(summary.hasMismatchRisk, true);
    assert.equal(summary.riskLevel, 'medium');
    assert.deepEqual(summary.distinctColors.sort(), ['블랙', '화이트']);
});

test('size mismatch is treated as high risk', () => {
    const summary = analyzeVariantAlignment([
        product({
            id: 'item-1',
            title: '아디다스 삼바 OG 블랙 240',
            source: 'MUSINSA',
        }),
        product({
            id: 'item-2',
            title: '아디다스 삼바 OG 블랙 260',
            source: 'W_CONCEPT',
        }),
    ]);

    assert.equal(summary.hasMismatchRisk, true);
    assert.equal(summary.riskLevel, 'high');
    assert.deepEqual(summary.distinctSizes.sort(), ['240', '260']);
});

test('gender mismatch is treated as high risk', () => {
    const summary = analyzeVariantAlignment([
        product({
            id: 'item-1',
            title: '뉴발란스 530 women white',
            source: 'MUSINSA',
        }),
        product({
            id: 'item-2',
            title: '뉴발란스 530 men white',
            source: 'SSF',
        }),
    ]);

    assert.equal(summary.hasMismatchRisk, true);
    assert.equal(summary.riskLevel, 'high');
    assert.deepEqual(summary.distinctGenders.sort(), ['남성', '여성']);
});

test('matching titles without option differences stay low risk', () => {
    const summary = analyzeVariantAlignment([
        product({
            id: 'item-1',
            title: '무신사 스탠다드 릴렉스드 싱글 블레이저',
            source: 'MUSINSA',
        }),
        product({
            id: 'item-2',
            title: '무신사 스탠다드 릴렉스드 싱글 블레이저',
            source: '29CM',
        }),
    ]);

    assert.equal(summary.hasMismatchRisk, false);
    assert.equal(summary.riskLevel, 'low');
    assert.equal(summary.summaryLabel, '옵션 차이 신호 없음');
});
