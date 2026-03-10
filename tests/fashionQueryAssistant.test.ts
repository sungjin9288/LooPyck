import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFashionQuery, buildSourceAwareSearchPlan, rerankProductsByFashionRelevance } from '../lib/search/fashionQueryAssistant.ts';
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
        detailCollectedAt: overrides.detailCollectedAt,
    };
}

test('non-fashion query returns fashion-oriented fallback suggestions', () => {
    const analysis = analyzeFashionQuery('아이폰 케이스');

    assert.equal(analysis.allowed, false);
    assert.equal(analysis.intent, 'non_fashion');
    assert.ok(analysis.reason?.includes('패션 비교 플랫폼'));
    assert.ok(analysis.suggestedQueries.includes('폰백'));
});

test('mixed query removes non-fashion noise and keeps fashion intent', () => {
    const analysis = analyzeFashionQuery('아이폰 수납 가방 추천');

    assert.equal(analysis.allowed, true);
    assert.equal(analysis.intent, 'mixed');
    assert.equal(analysis.normalizedQuery, '수납 가방');
    assert.ok(!analysis.normalizedQuery.includes('아이폰'));
    assert.ok(analysis.categorySignals.includes('가방'));
});

test('relevance rerank pushes exact brand and item match to the top', () => {
    const analysis = analyzeFashionQuery('나이키 후드집업');
    const result = rerankProductsByFashionRelevance([
        product({
            id: 'nike-hoodie',
            title: '나이키 스포츠웨어 후드집업 블랙',
            brand: '나이키',
            category1: '상의',
            category2: '후드집업',
            source: 'MUSINSA',
        }),
        product({
            id: 'nike-tee',
            title: '나이키 에센셜 반팔 티셔츠',
            brand: '나이키',
            category1: '상의',
            category2: '티셔츠',
            source: '29CM',
        }),
        product({
            id: 'adidas-hoodie',
            title: '아디다스 에센셜 후드집업',
            brand: '아디다스',
            category1: '상의',
            category2: '후드집업',
            source: 'SSF',
        }),
    ], analysis, 'sim');

    assert.equal(result.products[0].id, 'nike-hoodie');
    assert.equal(result.meta.reranked, true);
    assert.ok(result.meta.strongMatchCount >= 1);
});

test('source-aware query plan adds english fashion variants for global sources', () => {
    const analysis = analyzeFashionQuery('나이키 후드집업');
    const plan = buildSourceAwareSearchPlan(analysis);

    assert.ok(plan.SSENSE?.includes('zip hoodie'));
    assert.ok(plan.SSENSE?.includes('nike'));
    assert.ok(plan.MUSINSA?.includes('후드집업'));
    assert.ok(plan.NAVER?.includes('후드집업'));
});

test('naver query plan broadens generic hoodie searches', () => {
    const analysis = analyzeFashionQuery('남자 후드');
    const plan = buildSourceAwareSearchPlan(analysis);

    assert.equal(analysis.allowed, true);
    assert.ok(plan.NAVER?.includes('남자 후드'));
    assert.ok(plan.NAVER?.includes('후드집업'));
    assert.ok(plan.NAVER?.includes('후드'));
});

test('weak-result search meta exposes refinement suggestions', () => {
    const analysis = analyzeFashionQuery('코트');
    const result = rerankProductsByFashionRelevance([
        product({
            id: 'tee',
            title: '기본 반팔 티셔츠',
            category1: '상의',
            category2: '티셔츠',
            source: 'MUSINSA',
        }),
        product({
            id: 'pants',
            title: '와이드 데님 팬츠',
            category1: '하의',
            category2: '데님',
            source: '29CM',
        }),
    ], analysis, 'sim');

    assert.equal(result.meta.resultQuality, 'weak');
    assert.ok(result.meta.suggestedQueries.some((suggestion) => suggestion.includes('코트')));
});
