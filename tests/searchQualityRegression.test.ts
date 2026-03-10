import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeFashionQuery, buildSourceAwareSearchPlan, searchProductsByFashionQuery } from '../lib/search/fashionQueryAssistant.ts';
import type { UnifiedProduct } from '../lib/api/types.ts';
import { resolveSemanticFashionExpansion } from '../lib/search/fashionOntology.ts';
import { SEARCH_QUALITY_DATASET } from '../lib/search/searchQualityDataset.ts';

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

test('fashion search regression plan covers curated fashion query dataset', () => {
    SEARCH_QUALITY_DATASET.forEach(({ query, expectedNaver, expectedGlobal }) => {
        const analysis = analyzeFashionQuery(query);
        const plan = buildSourceAwareSearchPlan(analysis);

        assert.equal(analysis.allowed, true, `${query} should be allowed`);
        assert.ok((plan.NAVER || []).length >= 1, `${query} should build a usable NAVER candidate set`);
        assert.ok(
            expectedNaver.some((candidate) => plan.NAVER?.includes(candidate)),
            `${query} should include at least one expected NAVER candidate`
        );

        if (expectedGlobal && expectedGlobal.length > 0) {
            assert.ok(
                expectedGlobal.some((candidate) => plan.SSENSE?.includes(candidate)),
                `${query} should include at least one expected global candidate in SSENSE candidates`
            );
        }
    });
});

test('semantic ontology expands broad fashion slang into canonical search candidates', () => {
    const hoodieExpansion = resolveSemanticFashionExpansion('짐웨어 후디');
    assert.ok(hoodieExpansion.matchedClusterIds.includes('hoodie_training'));
    assert.ok(hoodieExpansion.queries.includes('트레이닝 후드집업'));

    const runningExpansion = resolveSemanticFashionExpansion('러닝 슈즈');
    assert.ok(runningExpansion.matchedClusterIds.includes('running_shoes'));
    assert.ok(runningExpansion.queries.includes('러닝 슈즈'));
});

test('tracked catalog fallback search can recover hoodie-style products from generic fashion queries', () => {
    const analysis = analyzeFashionQuery('운동용 후드');
    const results = searchProductsByFashionQuery([
        product({
            id: 'training-hoodie',
            title: '남성 트레이닝 후드집업',
            brand: '나이키',
            category1: '상의',
            category2: '후드집업',
            source: 'MUSINSA',
        }),
        product({
            id: 'gym-hoodie',
            title: '짐웨어 기모 후드티',
            brand: '아디다스',
            category1: '상의',
            category2: '후드집업',
            source: 'SSF',
        }),
        product({
            id: 'wide-denim',
            title: '와이드 데님 팬츠',
            category1: '하의',
            category2: '데님 팬츠',
            source: '29CM',
        }),
    ], analysis, 5);

    assert.equal(results.length, 2);
    assert.equal(results[0].id, 'training-hoodie');
    assert.ok(results.some((entry) => entry.id === 'gym-hoodie'));
});

test('tracked catalog fallback search recovers pants-style products for broad athletic queries', () => {
    const analysis = analyzeFashionQuery('트레이닝 팬츠');
    const results = searchProductsByFashionQuery([
        product({
            id: 'track-pants',
            title: '사이드 라인 트랙 팬츠',
            brand: '아디다스',
            category1: '하의',
            category2: '트랙 팬츠',
            source: 'MUSINSA',
        }),
        product({
            id: 'jogger-pants',
            title: '러닝 조거 팬츠 블랙',
            brand: '나이키',
            category1: '하의',
            category2: '조거 팬츠',
            source: 'SSF',
        }),
        product({
            id: 'mini-bag',
            title: '미니 크로스백',
            category1: '가방',
            source: '29CM',
        }),
    ], analysis, 5);

    assert.equal(results.length, 2);
    assert.equal(results[0].id, 'track-pants');
    assert.ok(results.some((entry) => entry.id === 'jogger-pants'));
});
