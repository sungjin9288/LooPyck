/**
 * Registry of direct-scrape search sources.
 *
 * Test-runner-safe: no I/O imports, no `@/` value imports — only types and the frozen
 * DIRECT_SOURCE_ORDER constant. realtimeAggregator.ts wires the concrete network executors
 * in via `buildDirectRegistry(...)`.
 *
 * The order below is load-bearing (I5/I8): it drives both
 * `mergeWithPreferredDirectProducts`'s direct-product ordering and the `classified_naver`
 * filter in `buildAggregationDiagnostics`. It intentionally does NOT reuse
 * sourceCatalog's DETECTION_ORDER, which has a different ordering and would silently change
 * diagnostics output.
 */
import type { ProductSource, UnifiedProduct } from './types.ts';

export type SourceScrapeFn = (query: string, page: number) => Promise<UnifiedProduct[]>;

export interface SearchSourceEntry {
    source: ProductSource;
    kind: 'naver_api' | 'direct';
    scrape: SourceScrapeFn;
    budgetMs: number;
    emptyReason: string;
    timeoutReason: string;
}

export const DIRECT_SOURCE_ORDER: readonly ProductSource[] = [
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
] as const;

const DIRECT_SOURCE_SEARCH_BUDGET_MS = 3_500;
const DIRECT_EMPTY_REASON = 'no_direct_results';
const DIRECT_TIMEOUT_REASON = 'source_timeout';

export interface DirectSourceExecutors {
    musinsa: SourceScrapeFn;
    twentyNineCm: SourceScrapeFn;
    wConcept: SourceScrapeFn;
    zigzag: SourceScrapeFn;
    ably: SourceScrapeFn;
    ssf: SourceScrapeFn;
    coupang: SourceScrapeFn;
    handsome: SourceScrapeFn;
    farfetch: SourceScrapeFn;
    ssense: SourceScrapeFn;
    hago: SourceScrapeFn;
    eql: SourceScrapeFn;
    lfMall: SourceScrapeFn;
    siVillage: SourceScrapeFn;
}

/**
 * Compile-time exhaustiveness guard: mapping every direct ProductSource to an executor key.
 * If a future ProductSource union member is added without a corresponding registry line,
 * this `satisfies` assignment fails to compile.
 */
const DIRECT_SOURCE_TO_EXECUTOR_KEY = {
    MUSINSA: 'musinsa',
    '29CM': 'twentyNineCm',
    W_CONCEPT: 'wConcept',
    ZIGZAG: 'zigzag',
    ABLY: 'ably',
    SSF: 'ssf',
    COUPANG: 'coupang',
    HANDSOME: 'handsome',
    FARFETCH: 'farfetch',
    SSENSE: 'ssense',
    HAGO: 'hago',
    EQL: 'eql',
    LFMALL: 'lfMall',
    SIVILLAGE: 'siVillage',
} satisfies Record<Exclude<ProductSource, 'NAVER'>, keyof DirectSourceExecutors>;

export function buildDirectRegistry(executors: DirectSourceExecutors): readonly SearchSourceEntry[] {
    return DIRECT_SOURCE_ORDER.map((source) => {
        const executorKey = DIRECT_SOURCE_TO_EXECUTOR_KEY[source as Exclude<ProductSource, 'NAVER'>];
        return {
            source,
            kind: 'direct' as const,
            scrape: executors[executorKey],
            budgetMs: DIRECT_SOURCE_SEARCH_BUDGET_MS,
            emptyReason: DIRECT_EMPTY_REASON,
            timeoutReason: DIRECT_TIMEOUT_REASON,
        };
    });
}
