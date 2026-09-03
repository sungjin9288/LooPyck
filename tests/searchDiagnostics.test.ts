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
import {
    buildSearchQualityObservation,
    type SearchQualityObservationInput,
} from '../lib/search/searchQualityObservation.ts';
import { readRuntimeMemoryUsage } from '../lib/core/performanceMonitor.ts';

function searchQualityObservationFixture(): SearchQualityObservationInput {
    return {
        summary: { trackedSearches: 80 },
        quality: {
            strong: 42,
            mixed: 28,
            weak: 10,
            lowFitShare: 47.5,
            compareReadyRatio: 18.2,
            priceSpreadCaptureRate: 61.4,
            optionMatchPrecision: 74,
            avgCapturedPriceSpread: 13200,
            maxCapturedPriceSpread: 42000,
        },
        interactionSummary: {
            total: 160,
            productImpressions: 120,
            productOpens: 30,
            badgeCohorts: [
                { cohort: 'shipping+benefit', impressions: 30, opens: 12, openRate: 40 },
                { cohort: 'shipping', impressions: 30, opens: 6, openRate: 20 },
                { cohort: 'benefit', impressions: 30, opens: 9, openRate: 30 },
                { cohort: 'none', impressions: 30, opens: 9, openRate: 30 },
            ],
        },
        sourceHealth: [
            { source: 'MUSINSA', status: 'healthy', reason: 'recent direct success' },
            { source: 'HAGO', status: 'degraded', reason: 'fallback observed' },
        ],
    };
}

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

test('recentOutcomes tracks direct=1/empty=0 and skips fallback (스트릭과 동일 규칙)', () => {
    resetSearchDiagnostics();

    recordSearchDiagnostics({
        query: 'A',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-07-01T00:00:00.000Z',
        totalProducts: 1,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [
            { source: 'MUSINSA', attempted: true, success: true, durationMs: 10, directCount: 1, naverCount: 0, finalCount: 1, strategy: 'direct' },
        ],
    });
    recordSearchDiagnostics({
        query: 'B',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-07-01T00:01:00.000Z',
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 0,
        sources: [
            { source: 'MUSINSA', attempted: true, success: false, durationMs: 10, directCount: 0, naverCount: 0, finalCount: 0, strategy: 'empty' },
        ],
    });
    recordSearchDiagnostics({
        query: 'C',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-07-01T00:02:00.000Z',
        totalProducts: 1,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [
            {
                source: 'MUSINSA',
                attempted: true,
                success: true,
                durationMs: 10,
                directCount: 0,
                naverCount: 1,
                finalCount: 1,
                strategy: 'naver_classified_fallback',
                fallbackReason: 'direct_empty_used_naver_classification',
            },
        ],
    });
    recordSearchDiagnostics({
        query: 'D',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-07-01T00:03:00.000Z',
        totalProducts: 1,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [
            { source: 'MUSINSA', attempted: true, success: true, durationMs: 10, directCount: 1, naverCount: 0, finalCount: 1, strategy: 'direct' },
        ],
    });

    const summary = getSearchDiagnosticsSummary();
    const musinsa = summary.sources.find((entry) => entry.source === 'MUSINSA');

    // fallback(C)는 스트릭과 마찬가지로 recentOutcomes에도 기록되지 않는다
    assert.deepEqual(musinsa?.recentOutcomes, [1, 0, 1]);
});

test('recentOutcomes caps at 20 entries, dropping the oldest, newest-last', () => {
    resetSearchDiagnostics();

    for (let i = 0; i < 25; i += 1) {
        const isDirect = i % 2 === 0;
        recordSearchDiagnostics({
            query: `q${i}`,
            page: 1,
            sort: 'sim',
            generatedAt: `2026-07-01T01:${String(i).padStart(2, '0')}:00.000Z`,
            totalProducts: isDirect ? 1 : 0,
            directSourceCount: isDirect ? 1 : 0,
            fallbackSourceCount: 0,
            sources: [
                {
                    source: 'MUSINSA',
                    attempted: true,
                    success: isDirect,
                    durationMs: 10,
                    directCount: isDirect ? 1 : 0,
                    naverCount: 0,
                    finalCount: isDirect ? 1 : 0,
                    strategy: isDirect ? 'direct' : 'empty',
                },
            ],
        });
    }

    const summary = getSearchDiagnosticsSummary();
    const musinsa = summary.sources.find((entry) => entry.source === 'MUSINSA');

    const fullSequence = Array.from({ length: 25 }, (_, i) => (i % 2 === 0 ? 1 : 0));
    const expected = fullSequence.slice(fullSequence.length - 20);

    assert.equal(musinsa?.recentOutcomes?.length, 20);
    assert.deepEqual(musinsa?.recentOutcomes, expected);
});

test('NAVER strategy=api 성공은 recentOutcomes에 1로 기록된다 (direct와 동일 취급)', () => {
    resetSearchDiagnostics();

    recordSearchDiagnostics({
        query: 'A',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-07-01T02:00:00.000Z',
        totalProducts: 5,
        directSourceCount: 0,
        fallbackSourceCount: 0,
        sources: [
            { source: 'NAVER', attempted: true, success: true, durationMs: 10, directCount: 5, naverCount: 5, finalCount: 5, strategy: 'api' },
        ],
    });
    recordSearchDiagnostics({
        query: 'B',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-07-01T02:01:00.000Z',
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 0,
        sources: [
            { source: 'NAVER', attempted: true, success: false, durationMs: 10, directCount: 0, naverCount: 0, finalCount: 0, strategy: 'empty' },
        ],
    });

    const summary = getSearchDiagnosticsSummary();
    const naver = summary.sources.find((entry) => entry.source === 'NAVER');

    assert.deepEqual(naver?.recentOutcomes, [1, 0]);
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

test('interaction summary calculates badge cohort open rate from matched unique product impressions', () => {
    const summary = buildSearchInteractionSummary([
        {
            type: 'product_impression',
            query: '후드',
            generatedAt: '2026-07-10T01:00:00.000Z',
            productIds: ['shipping-1', 'shipping-2', 'shipping-2'],
            context: 'search_results:badges=shipping',
        },
        {
            type: 'product_impression',
            query: '후드',
            generatedAt: '2026-07-10T01:00:01.000Z',
            productIds: ['plain-1'],
            context: 'search_results:badges=none',
        },
        {
            type: 'product_open',
            query: '후드',
            generatedAt: '2026-07-10T01:00:02.000Z',
            productId: 'shipping-1',
            context: 'search_results:badges=shipping',
        },
        {
            type: 'product_open',
            query: '후드',
            generatedAt: '2026-07-10T01:00:03.000Z',
            productId: 'not-in-recent-impressions',
            context: 'search_results:badges=shipping',
        },
        {
            type: 'product_open',
            query: '맨투맨',
            generatedAt: '2026-07-10T01:00:04.000Z',
            productId: 'shipping-2',
            context: 'search_results:badges=shipping',
        },
    ]);

    const shipping = summary.badgeCohorts.find((entry) => entry.cohort === 'shipping');
    const none = summary.badgeCohorts.find((entry) => entry.cohort === 'none');

    assert.equal(summary.productImpressions, 3);
    assert.deepEqual(shipping, { cohort: 'shipping', impressions: 2, opens: 1, openRate: 50 });
    assert.deepEqual(none, { cohort: 'none', impressions: 1, opens: 0, openRate: 0 });
});

test('badge cohort opens do not match an impression from a different query', () => {
    const summary = buildSearchInteractionSummary([
        {
            type: 'product_impression',
            query: '후드',
            generatedAt: '2026-07-10T01:00:00.000Z',
            productIds: ['shared-product'],
            context: 'search_results:badges=benefit',
        },
        {
            type: 'product_open',
            query: '맨투맨',
            generatedAt: '2026-07-10T01:00:01.000Z',
            productId: 'shared-product',
            context: 'search_results:badges=benefit',
        },
    ]);

    assert.deepEqual(
        summary.badgeCohorts.find((entry) => entry.cohort === 'benefit'),
        { cohort: 'benefit', impressions: 1, opens: 0, openRate: 0 }
    );
});

test('badge cohort opens only count when they occur after the matching impression', () => {
    const summary = buildSearchInteractionSummary([
        {
            type: 'product_open',
            query: '후드',
            generatedAt: '2026-07-10T01:00:02.000Z',
            productId: 'valid-product',
            context: 'search_results:badges=shipping',
        },
        {
            type: 'product_impression',
            query: '후드',
            generatedAt: '2026-07-10T01:00:01.000Z',
            productIds: ['valid-product'],
            context: 'search_results:badges=shipping',
        },
        {
            type: 'product_open',
            query: '후드',
            generatedAt: '2026-07-10T00:59:59.000Z',
            productId: 'future-impression-product',
            context: 'search_results:badges=shipping',
        },
        {
            type: 'product_impression',
            query: '후드',
            generatedAt: '2026-07-10T01:00:03.000Z',
            productIds: ['future-impression-product'],
            context: 'search_results:badges=shipping',
        },
    ]);

    assert.deepEqual(
        summary.badgeCohorts.find((entry) => entry.cohort === 'shipping'),
        { cohort: 'shipping', impressions: 2, opens: 1, openRate: 50 }
    );
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

test('search quality observation compares sufficiently sampled cohorts against no-badge baseline', () => {
    const observation = buildSearchQualityObservation(searchQualityObservationFixture());
    const combined = observation.badgeCohorts.find((entry) => entry.cohort === 'shipping+benefit');
    const shipping = observation.badgeCohorts.find((entry) => entry.cohort === 'shipping');

    assert.equal(observation.status, 'watch');
    assert.equal(combined?.upliftVsNoBadge, 10);
    assert.equal(combined?.decision, 'candidate');
    assert.equal(shipping?.upliftVsNoBadge, -10);
    assert.equal(shipping?.decision, 'watch');
    assert.ok(observation.actions.some((action) => action.id === 'validate-positive-badge-cohorts'));
    assert.ok(observation.actions.some((action) => action.id === 'inspect-negative-badge-cohorts'));
});

test('search quality observation holds decisions when baseline or cohort samples are insufficient', () => {
    const input = searchQualityObservationFixture();
    input.interactionSummary.badgeCohorts = input.interactionSummary.badgeCohorts.map((entry) => ({
        ...entry,
        impressions: entry.cohort === 'none' ? 12 : 18,
    }));

    const observation = buildSearchQualityObservation(input);

    assert.equal(observation.status, 'hold');
    assert.ok(observation.badgeCohorts.every((entry) => entry.decision === 'hold'));
    assert.ok(observation.actions.some((action) => action.id === 'collect-no-badge-baseline'));
    assert.ok(observation.actions.some((action) => action.id === 'collect-badge-cohort-samples'));
});

test('search quality observation prioritizes failing sources without inventing traffic conclusions', () => {
    const input = searchQualityObservationFixture();
    input.interactionSummary.total = 0;
    input.interactionSummary.badgeCohorts = [];
    input.sourceHealth = [
        { source: 'W_CONCEPT', status: 'failing', reason: 'consecutive empty results' },
        { source: 'SSENSE', status: 'disabled', reason: 'adapter disabled' },
    ];

    const observation = buildSearchQualityObservation(input);

    assert.equal(observation.status, 'watch');
    assert.deepEqual(observation.sourceHealth.failingSources, [
        { source: 'W_CONCEPT', reason: 'consecutive empty results' },
    ]);
    assert.equal(observation.actions[0].id, 'repair-failing-sources');
});

test('search quality observation reports insufficient-data for an empty observation window', () => {
    const input = searchQualityObservationFixture();
    input.summary.trackedSearches = 0;
    input.interactionSummary.total = 0;
    input.interactionSummary.badgeCohorts = [];
    input.sourceHealth = [];

    assert.equal(buildSearchQualityObservation(input).status, 'insufficient-data');
});

test('runtime memory probe skips browser process polyfills without memoryUsage', () => {
    assert.equal(readRuntimeMemoryUsage({}), undefined);
    assert.ok(readRuntimeMemoryUsage(undefined));
});

test('runtime memory probe reads Node-compatible providers', () => {
    const memoryUsage = process.memoryUsage();
    assert.equal(readRuntimeMemoryUsage({ memoryUsage: () => memoryUsage }), memoryUsage);
});
