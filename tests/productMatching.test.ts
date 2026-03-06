import test from 'node:test';
import assert from 'node:assert/strict';
import { groupProducts } from '../lib/product/productMatching.ts';
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
    };
}

test('same model across malls groups together even with color and size noise', () => {
    const groups = groupProducts([
        product({
            id: 'nb-327-1',
            title: '뉴발란스 327 스니커즈 화이트 240',
            brand: '뉴발란스',
            mallName: '무신사',
            source: 'MUSINSA',
            price: 89000,
            category1: '패션잡화',
            category2: '운동화',
        }),
        product({
            id: 'nb-327-2',
            title: '[뉴발란스] 327 운동화 화이트 245',
            brand: '뉴발란스',
            mallName: 'W컨셉',
            source: 'W_CONCEPT',
            price: 99000,
            category1: '신발',
            category2: '스니커즈',
        }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].mallCount, 2);
    assert.equal(groups[0].matchStrategy, 'brand_model');
    assert.ok(groups[0].matchConfidence >= 0.85);
});

test('different models from the same brand do not get grouped', () => {
    const groups = groupProducts([
        product({
            id: 'nike-af1',
            title: '나이키 에어포스 1 로우 07',
            brand: '나이키',
            mallName: '무신사',
            source: 'MUSINSA',
            price: 129000,
            category1: '신발',
            category2: '스니커즈',
        }),
        product({
            id: 'nike-cortez',
            title: '나이키 코르테즈 레더',
            brand: '나이키',
            mallName: '29CM',
            source: '29CM',
            price: 119000,
            category1: '신발',
            category2: '스니커즈',
        }),
    ]);

    assert.equal(groups.length, 2);
    assert.ok(groups.every((group) => group.mallCount === 1));
});

test('same branded item without model code groups on distinctive tokens', () => {
    const groups = groupProducts([
        product({
            id: 'ms-blazer-1',
            title: '[무신사 스탠다드] 우먼즈 릴렉스드 싱글 블레이저 베이지',
            brand: '무신사 스탠다드',
            mallName: '무신사',
            source: 'MUSINSA',
            price: 79900,
            category1: '아우터',
            category2: '블레이저',
        }),
        product({
            id: 'ms-blazer-2',
            title: '무신사 스탠다드 릴렉스드 싱글 블레이저',
            brand: '무신사 스탠다드',
            mallName: '29CM',
            source: '29CM',
            price: 85900,
            category1: '여성의류',
            category2: '블레이저',
        }),
    ]);

    assert.equal(groups.length, 1);
    assert.equal(groups[0].mallCount, 2);
    assert.equal(groups[0].matchStrategy, 'brand_token');
    assert.ok(groups[0].matchConfidence >= 0.7);
});

test('generic overlap with different categories stays separated', () => {
    const groups = groupProducts([
        product({
            id: 'ms-blazer',
            title: '무신사 스탠다드 릴렉스드 블레이저',
            brand: '무신사 스탠다드',
            mallName: '무신사',
            source: 'MUSINSA',
            price: 89900,
            category1: '아우터',
            category2: '블레이저',
        }),
        product({
            id: 'ms-shirt',
            title: '무신사 스탠다드 릴렉스드 셔츠',
            brand: '무신사 스탠다드',
            mallName: 'SSF',
            source: 'SSF',
            price: 49900,
            category1: '상의',
            category2: '셔츠',
        }),
    ]);

    assert.equal(groups.length, 2);
});
