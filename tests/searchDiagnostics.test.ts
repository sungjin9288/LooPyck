import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildSearchInteractionSummary,
    buildSearchQualitySummary,
    getRecentSearchDiagnostics,
    getRecentSearchInteractions,
    getSearchDiagnosticsSummary,
    recordSearchInteraction,
    recordSearchDiagnostics,
    resetSearchDiagnostics,
} from '../lib/api/searchDiagnostics.ts';

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
