import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildAggregationDiagnostics,
    mergeWithPreferredDirectProducts,
} from '../lib/api/aggregationCore.ts';
import { DIRECT_SOURCE_ORDER } from '../lib/api/searchSourceRegistry.ts';
import type { ProductSource, UnifiedProduct } from '../lib/api/types.ts';

const EXPECTED_DIRECT_ORDER: ProductSource[] = [
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'ABLY',
    'SSF',
    'COUPANG',
    'HANDSOME',
    'FARFETCH',
    'SSENSE',
    'HAGO',
    'EQL',
    'LFMALL',
    'SIVILLAGE',
];

function product(overrides: Partial<UnifiedProduct> & { id: string; source: ProductSource }): UnifiedProduct {
    return {
        title: '기본 상품',
        price: 10000,
        image: 'https://example.com/item.jpg',
        link: `https://example.com/${overrides.id}`,
        mallName: '테스트몰',
        ...overrides,
    };
}

test('DIRECT_SOURCE_ORDER equals the exact 14-entry list (I5/I8 guard)', () => {
    assert.deepEqual(DIRECT_SOURCE_ORDER, EXPECTED_DIRECT_ORDER);
    assert.equal(DIRECT_SOURCE_ORDER.length, 14);
});

test('mergeWithPreferredDirectProducts replaces NAVER-classified entries with direct-source duplicates', () => {
    // NAVER API results carry `source: detectMarketplaceSource(mallName, link)` — so a NAVER-origin
    // product classified as MUSINSA (source: 'MUSINSA') shares a dedup key (source-scoped) with a
    // genuine direct MUSINSA scrape of the same link, and gets replaced by the direct version.
    const naverProducts = [
        product({ id: 'naver-classified-musinsa', source: 'MUSINSA', link: 'https://www.musinsa.com/products/1', price: 12000 }),
        product({ id: 'naver-b', source: 'NAVER', link: 'https://www.musinsa.com/products/2', price: 15000 }),
    ];
    const directProducts = [
        product({ id: 'musinsa-1', source: 'MUSINSA', link: 'https://www.musinsa.com/products/1', price: 11000 }),
    ];

    const merged = mergeWithPreferredDirectProducts(naverProducts, directProducts);

    // naver-classified-musinsa should be replaced by the direct MUSINSA product (same dedup key via link+source)
    const replaced = merged.find((p) => p.link === 'https://www.musinsa.com/products/1');
    assert.ok(replaced);
    assert.equal(replaced?.id, 'musinsa-1');
    assert.equal(replaced?.price, 11000);

    // naver-b has no direct match, stays as-is
    const untouched = merged.find((p) => p.id === 'naver-b');
    assert.ok(untouched);
    assert.equal(untouched?.source, 'NAVER');

    assert.equal(merged.length, 2);
});

test('mergeWithPreferredDirectProducts appends direct products with no NAVER counterpart', () => {
    const naverProducts = [product({ id: 'naver-only', source: 'NAVER', link: 'https://shopping.naver.com/x' })];
    const directProducts = [product({ id: 'musinsa-new', source: 'MUSINSA', link: 'https://www.musinsa.com/products/new' })];

    const merged = mergeWithPreferredDirectProducts(naverProducts, directProducts);
    assert.equal(merged.length, 2);
    assert.ok(merged.some((p) => p.id === 'naver-only'));
    assert.ok(merged.some((p) => p.id === 'musinsa-new'));
});

test('buildAggregationDiagnostics produces the frozen shape guarded by tests/searchDiagnostics.test.ts', () => {
    const naverRun = {
        source: 'NAVER' as const,
        products: [
            product({ id: 'naver-1', source: 'NAVER' }),
            product({ id: 'naver-2', source: 'ABLY' }), // classified as ABLY by NAVER mallName detection
        ],
        durationMs: 120,
        requestedQueries: ['니트'],
        resolvedQuery: '니트',
    };

    const directRuns = EXPECTED_DIRECT_ORDER.map((source) => {
        if (source === 'MUSINSA') {
            return {
                source,
                products: [product({ id: 'musinsa-1', source: 'MUSINSA' })],
                durationMs: 200,
                requestedQueries: ['니트'],
                resolvedQuery: '니트',
            };
        }
        return {
            source,
            products: [],
            durationMs: 50,
            fallbackReason: 'no_direct_results',
            requestedQueries: ['니트'],
            resolvedQuery: '니트',
        };
    });

    const aggregated = [
        product({ id: 'naver-1', source: 'NAVER' }),
        product({ id: 'musinsa-1', source: 'MUSINSA' }),
    ];

    const diagnostics = buildAggregationDiagnostics(
        '니트',
        1,
        'sim',
        aggregated,
        naverRun,
        directRuns,
        EXPECTED_DIRECT_ORDER
    );

    assert.equal(diagnostics.query, '니트');
    assert.equal(diagnostics.page, 1);
    assert.equal(diagnostics.sort, 'sim');
    assert.equal(diagnostics.totalProducts, 2);
    assert.equal(typeof diagnostics.generatedAt, 'string');

    // NAVER entry always first
    assert.equal(diagnostics.sources[0].source, 'NAVER');
    assert.equal(diagnostics.sources[0].strategy, 'api');

    // MUSINSA direct hit
    const musinsaDiag = diagnostics.sources.find((s) => s.source === 'MUSINSA');
    assert.ok(musinsaDiag);
    assert.equal(musinsaDiag?.strategy, 'direct');
    assert.equal(musinsaDiag?.finalCount, 1);

    // ABLY was NAVER-classified but not in direct set match (it IS in direct set, but direct empty + naver has it => naver_classified_fallback)
    const ablyDiag = diagnostics.sources.find((s) => s.source === 'ABLY');
    assert.ok(ablyDiag);
    assert.equal(ablyDiag?.strategy, 'naver_classified_fallback');
    assert.equal(ablyDiag?.fallbackReason, 'direct_empty_used_naver_classification');

    assert.equal(diagnostics.directSourceCount, 1);
    assert.equal(diagnostics.fallbackSourceCount, 1);
    assert.equal(diagnostics.sources.length, 1 + EXPECTED_DIRECT_ORDER.length);
});

test('buildAggregationDiagnostics classifies NAVER-only non-direct sources as classified_naver', () => {
    const naverRun = {
        source: 'NAVER' as const,
        products: [product({ id: 'naver-farfetch', source: 'FARFETCH' })],
        durationMs: 90,
        requestedQueries: ['가방'],
        resolvedQuery: '가방',
    };

    // FARFETCH IS in the direct order list, so use a source NOT in the list to test classified_naver.
    // Since all ProductSource values except NAVER are in DIRECT_SOURCE_ORDER, we simulate a
    // reduced directSourceOrder param to exercise the classified_naver branch (I8).
    const reducedOrder: ProductSource[] = EXPECTED_DIRECT_ORDER.filter((s) => s !== 'FARFETCH');
    const directRuns = reducedOrder.map((source) => ({
        source,
        products: [],
        durationMs: 40,
        fallbackReason: 'no_direct_results',
        requestedQueries: ['가방'],
        resolvedQuery: '가방',
    }));

    const aggregated = [product({ id: 'naver-farfetch', source: 'FARFETCH' })];

    const diagnostics = buildAggregationDiagnostics(
        '가방',
        1,
        'sim',
        aggregated,
        naverRun,
        directRuns,
        reducedOrder
    );

    const farfetchDiag = diagnostics.sources.find((s) => s.source === 'FARFETCH');
    assert.ok(farfetchDiag);
    assert.equal(farfetchDiag?.strategy, 'classified_naver');
    assert.equal(farfetchDiag?.attempted, false);
    assert.equal(farfetchDiag?.fallbackReason, 'naver_classified_only');
});
