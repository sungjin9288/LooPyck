import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildAggregationDiagnostics,
    mergeWithPreferredDirectProducts,
} from '../lib/api/aggregationCore.ts';
import { ACTIVE_DIRECT_SOURCE_ORDER, DIRECT_SOURCE_ORDER, DISABLED_DIRECT_SOURCES, buildDirectRegistry } from '../lib/api/searchSourceRegistry.ts';
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

// ── 프로덕션 실측 기반 소스 비활성화 (2026-07-10 관찰 리뷰) ─────────────
// COUPANG·SSENSE는 로컬 IP에서만 수확되던 스크레이퍼 — Netlify에서 33~35회
// 연속 무수확(403) 실측 후 배선 해제. 실행 레지스트리에서만 제외하고
// DIRECT_SOURCE_ORDER(머지·진단 순서 의미)는 그대로 둔다.

test('DISABLED_DIRECT_SOURCES: COUPANG·SSENSE가 실측 사유와 함께 등재', () => {
    assert.ok(DISABLED_DIRECT_SOURCES.COUPANG, 'COUPANG 비활성 사유 필요');
    assert.ok(DISABLED_DIRECT_SOURCES.SSENSE, 'SSENSE 비활성 사유 필요');
    // 사유는 복원 판단이 가능하도록 실측 근거를 포함해야 한다
    assert.match(DISABLED_DIRECT_SOURCES.COUPANG ?? '', /무수확|403|Netlify/);
    assert.match(DISABLED_DIRECT_SOURCES.SSENSE ?? '', /무수확|403|Netlify/);
});

test('buildDirectRegistry: 비활성 소스는 실행 레지스트리에서 제외된다', () => {
    const noop = async () => [] as UnifiedProduct[];
    const registry = buildDirectRegistry({
        musinsa: noop, twentyNineCm: noop, wConcept: noop, zigzag: noop,
        ably: noop, ssf: noop, coupang: noop, handsome: noop, farfetch: noop,
        ssense: noop, hago: noop, eql: noop, lfMall: noop, siVillage: noop,
    });

    const sources = registry.map((entry) => entry.source);
    assert.ok(!sources.includes('COUPANG'), 'COUPANG이 여전히 배선됨');
    assert.ok(!sources.includes('SSENSE'), 'SSENSE가 여전히 배선됨');
    // 비활성 외 소스는 DIRECT_SOURCE_ORDER 상대 순서 그대로
    const expected = DIRECT_SOURCE_ORDER.filter(
        (source) => !(source in DISABLED_DIRECT_SOURCES)
    );
    assert.deepEqual(sources, expected);
    assert.equal(sources.length, 12);
});

test('비활성 소스의 NAVER 분류 상품은 classified_naver 행으로 진단에 남는다', () => {
    // COUPANG은 배선 해제됐지만 NAVER가 쿠팡 상품을 분류해오면
    // ACTIVE 순서 기준 테일 루프가 행을 만들어야 한다(사각지대 방지).
    const naverRun = {
        source: 'NAVER' as ProductSource,
        products: [product({ id: 'naver-coupang', source: 'COUPANG' })],
        durationMs: 100,
    };

    const diagnostics = buildAggregationDiagnostics(
        '패딩', 1, 'sim',
        naverRun.products,
        naverRun as never,
        [],
        ACTIVE_DIRECT_SOURCE_ORDER
    );

    const coupangRow = diagnostics.sources.find((s) => s.source === 'COUPANG');
    assert.ok(coupangRow, 'COUPANG 진단 행이 사라짐');
    assert.equal(coupangRow?.strategy, 'classified_naver');
    assert.equal(coupangRow?.attempted, false);
});
