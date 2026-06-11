import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildSearchComparisonSnapshot,
    buildSearchInteractionSummary,
    buildSearchQualitySummary,
    getRecentSearchDiagnostics,
    getRecentSearchInteractions,
    getSearchDiagnosticsSummary,
    recordSearchInteraction,
    recordSearchDiagnostics,
    resetSearchDiagnostics,
} from '../lib/api/searchDiagnostics.ts';
import {
    buildRealtimeSearchFeedbackNotificationKey,
    buildRealtimeSearchFallbackNotification,
    buildRealtimeSearchPersistentFeedback,
    mergeRealtimeSearchFeedbackMeta,
    parseRealtimeSearchFeedbackMeta,
} from '../lib/search/realtimeSearchFeedback.ts';
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

test('source diagnostics summary aggregates direct hits and fallbacks', () => {
    resetSearchDiagnostics();

    recordSearchDiagnostics({
        query: '니트',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-06T12:00:00.000Z',
        totalProducts: 12,
        directSourceCount: 2,
        fallbackSourceCount: 1,
        sources: [
            {
                source: 'NAVER',
                attempted: true,
                success: true,
                durationMs: 210,
                directCount: 12,
                naverCount: 12,
                finalCount: 4,
                strategy: 'api',
            },
            {
                source: 'W_CONCEPT',
                attempted: true,
                success: true,
                durationMs: 320,
                directCount: 3,
                naverCount: 1,
                finalCount: 3,
                strategy: 'direct_preferred_over_naver',
                requestedQueries: ['니트', 'knit'],
                resolvedQuery: 'knit',
            },
            {
                source: 'ABLY',
                attempted: true,
                success: true,
                durationMs: 280,
                directCount: 0,
                naverCount: 2,
                finalCount: 2,
                strategy: 'naver_classified_fallback',
                fallbackReason: 'direct_empty_used_naver_classification',
            },
        ],
    });

    recordSearchDiagnostics({
        query: '셔츠',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-06T12:05:00.000Z',
        totalProducts: 4,
        directSourceCount: 0,
        fallbackSourceCount: 0,
        sources: [
            {
                source: 'W_CONCEPT',
                attempted: true,
                success: false,
                durationMs: 410,
                directCount: 0,
                naverCount: 0,
                finalCount: 0,
                strategy: 'empty',
                fallbackReason: 'no_direct_results',
            },
        ],
    });

    const summary = getSearchDiagnosticsSummary();
    const recent = getRecentSearchDiagnostics(2);
    const quality = buildSearchQualitySummary(recent);

    assert.equal(summary.trackedSearches, 2);
    assert.equal(recent.length, 2);
    assert.equal(quality.mixed, 0);

    const wconcept = summary.sources.find((entry) => entry.source === 'W_CONCEPT');
    assert.ok(wconcept);
    assert.equal(wconcept?.searches, 2);
    assert.equal(wconcept?.directHits, 1);
    assert.equal(wconcept?.emptyHits, 1);
    assert.equal(wconcept?.successRate, 50);
    assert.equal(wconcept?.collectionMode, 'direct');

    const ably = summary.sources.find((entry) => entry.source === 'ABLY');
    assert.ok(ably);
    assert.equal(ably?.fallbackHits, 1);
    assert.equal(ably?.lastFallbackReason, 'direct_empty_used_naver_classification');
    const wConceptSnapshot = recent.find((snapshot) => snapshot.query === '니트');
    const wConceptSource = wConceptSnapshot?.sources.find((entry) => entry.source === 'W_CONCEPT');
    assert.equal(wConceptSource?.resolvedQuery, 'knit');
});

test('interaction summary aggregates suggestion clicks and product opens', () => {
    resetSearchDiagnostics();

    recordSearchInteraction({
        type: 'suggestion_click',
        query: '아이폰 케이스',
        selectedQuery: '폰백',
        generatedAt: '2026-03-06T12:00:00.000Z',
        context: 'search_bar_blocked',
    });
    recordSearchInteraction({
        type: 'product_open',
        query: '맨투맨',
        generatedAt: '2026-03-06T12:01:00.000Z',
        brand: '무신사 스탠다드',
        source: 'MUSINSA',
        productId: 'musinsa_1',
        productTitle: '무신사 스탠다드 맨투맨',
        context: 'search_results',
    });

    const recent = getRecentSearchInteractions(10);
    const summary = buildSearchInteractionSummary(recent);

    assert.equal(recent.length, 2);
    assert.equal(summary.suggestionClicks, 1);
    assert.equal(summary.productOpens, 1);
    assert.equal(summary.topSelectedQueries[0]?.query, '폰백');
    assert.equal(summary.topOpenedBrands[0]?.brand, '무신사 스탠다드');
});

test('comparison diagnostics snapshot captures compare-ready ratio, spread capture, and option precision', () => {
    const snapshot = buildSearchComparisonSnapshot([
        product({
            id: 'cortez-musinsa',
            title: '나이키 코르테즈 블랙',
            brand: '나이키',
            mallName: '무신사',
            source: 'MUSINSA',
            price: 100000,
            optionSummary: '블랙 / 260',
            sizeOptions: ['260', '270'],
            colorOptions: ['블랙'],
            detailCollectedAt: '2026-03-01T00:00:00.000Z',
        }),
        product({
            id: 'cortez-29cm',
            title: '나이키 코르테즈 블랙',
            brand: '나이키',
            mallName: '29CM',
            source: '29CM',
            price: 112000,
            shippingFee: 3000,
            optionSummary: '블랙 / 260',
            sizeOptions: ['260'],
            colorOptions: ['블랙'],
            detailCollectedAt: '2026-03-01T00:00:00.000Z',
        }),
        product({
            id: 'bag-single',
            title: '미니 크로스백',
            brand: '아크네',
            mallName: 'SSF',
            source: 'SSF',
            price: 198000,
        }),
    ]);

    const quality = buildSearchQualitySummary([
        {
            query: '나이키 코르테즈',
            page: 1,
            sort: 'sim',
            generatedAt: '2026-03-06T12:10:00.000Z',
            totalProducts: 3,
            directSourceCount: 2,
            fallbackSourceCount: 0,
            totalGroups: snapshot.totalGroups,
            comparableGroupCount: snapshot.comparableGroupCount,
            compareReadyGroupCount: snapshot.compareReadyGroupCount,
            spreadCapturedGroupCount: snapshot.spreadCapturedGroupCount,
            capturedPriceSpreadTotal: snapshot.capturedPriceSpreadTotal,
            maxCapturedPriceSpread: snapshot.maxCapturedPriceSpread,
            verifiedOptionGroupCount: snapshot.verifiedOptionGroupCount,
            preciseOptionGroupCount: snapshot.preciseOptionGroupCount,
            resultQuality: 'strong',
            exactMatchCount: 2,
            strongMatchCount: 2,
            sources: [],
        },
    ]);

    assert.equal(snapshot.totalGroups, 2);
    assert.equal(snapshot.compareReadyGroupCount, 1);
    assert.equal(snapshot.spreadCapturedGroupCount, 1);
    assert.equal(snapshot.verifiedOptionGroupCount, 1);
    assert.equal(snapshot.preciseOptionGroupCount, 1);
    assert.equal(quality.compareReadyRatio, 50);
    assert.equal(quality.priceSpreadCaptureRate, 100);
    assert.equal(quality.optionMatchPrecision, 100);
    assert.equal(quality.avgCapturedPriceSpread, 15000);
});

test('realtime search feedback metadata parses fallback headers safely', () => {
    const headers = new Headers({
        'X-Search-Fallback-Mode': 'naver_only',
        'X-Search-Direct-Sources': '2',
        'X-Search-Fallback-Sources': '3',
    });

    assert.deepEqual(parseRealtimeSearchFeedbackMeta(headers), {
        fallbackMode: 'naver_only',
        directSourceCount: 2,
        fallbackSourceCount: 3,
    });

    const invalidHeaders = new Headers({
        'X-Search-Fallback-Mode': 'unexpected',
        'X-Search-Direct-Sources': 'NaN',
        'X-Search-Fallback-Sources': '-4',
    });

    assert.deepEqual(parseRealtimeSearchFeedbackMeta(invalidHeaders), {
        fallbackMode: 'full',
        directSourceCount: 0,
        fallbackSourceCount: 0,
    });
});

test('realtime search fallback notification explains degraded but non-blocking result paths', () => {
    assert.deepEqual(
        buildRealtimeSearchFallbackNotification(
            {
                fallbackMode: 'tracked_catalog',
                directSourceCount: 0,
                fallbackSourceCount: 2,
            },
            6
        ),
        {
            title: '일부 검색 소스 지연',
            message: '일부 쇼핑몰 응답이 느려 저장된 비교 상품을 먼저 보여주고 있습니다. 잠시 후 다시 검색하면 최신 결과를 더 확인할 수 있습니다.',
            type: 'info',
        }
    );

    assert.deepEqual(
        buildRealtimeSearchFallbackNotification(
            {
                fallbackMode: 'full',
                directSourceCount: 2,
                fallbackSourceCount: 1,
            },
            8
        ),
        {
            title: '일부 결과를 보완해 표시 중',
            message: '직접 수집 2개 소스에 대체 결과를 함께 반영해 비교를 이어가고 있습니다.',
            type: 'info',
        }
    );

    assert.equal(
        buildRealtimeSearchFallbackNotification(
            {
                fallbackMode: 'full',
                directSourceCount: 4,
                fallbackSourceCount: 0,
            },
            8
        ),
        null
    );
});

test('realtime search persistent feedback is hidden for normal results and shows exact degraded counts', () => {
    assert.equal(
        buildRealtimeSearchPersistentFeedback({
            fallbackMode: 'full',
            directSourceCount: 3,
            fallbackSourceCount: 0,
        }),
        null
    );

    assert.deepEqual(
        buildRealtimeSearchPersistentFeedback({
            fallbackMode: 'naver_only',
            directSourceCount: 2,
            fallbackSourceCount: 3,
        }),
        {
            fallbackMode: 'naver_only',
            directSourceCount: 2,
            fallbackSourceCount: 3,
            badgeLabel: 'Naver fallback',
            title: '일부 결과는 네이버 분류 기반 fallback으로 보완 중입니다.',
            detail: '직접 수집 2개 소스 · 대체/보완 3개 소스. 잠시 후 같은 검색어를 다시 조회하면 직접 수집 결과가 더 반영될 수 있습니다.',
        }
    );
});

test('realtime search degraded feedback remains stable across repeated degraded query paths', () => {
    const first = {
        fallbackMode: 'full' as const,
        directSourceCount: 2,
        fallbackSourceCount: 1,
    };
    const repeated = {
        fallbackMode: 'full' as const,
        directSourceCount: 2,
        fallbackSourceCount: 1,
    };
    const laterTrackedCatalog = {
        fallbackMode: 'tracked_catalog' as const,
        directSourceCount: 2,
        fallbackSourceCount: 3,
    };

    assert.equal(
        buildRealtimeSearchFeedbackNotificationKey('남자 후드', first, 12),
        buildRealtimeSearchFeedbackNotificationKey('남자 후드', repeated, 12)
    );

    assert.deepEqual(
        mergeRealtimeSearchFeedbackMeta(first, repeated),
        {
            fallbackMode: 'full',
            directSourceCount: 2,
            fallbackSourceCount: 1,
        }
    );

    assert.deepEqual(
        mergeRealtimeSearchFeedbackMeta(first, laterTrackedCatalog),
        {
            fallbackMode: 'tracked_catalog',
            directSourceCount: 2,
            fallbackSourceCount: 3,
        }
    );
});
