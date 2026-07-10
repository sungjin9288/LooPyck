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

/**
 * 프로덕션 실측으로 배선 해제된 소스 — 값은 복원 판단이 가능한 실측 사유.
 * 실행 레지스트리에서만 제외되며 DIRECT_SOURCE_ORDER(머지·진단 순서 의미)와
 * executor 맵(satisfies 완전성 가드)은 그대로 유지된다. 복원은 이 맵에서
 * 한 줄 지우면 끝.
 */
export const DISABLED_DIRECT_SOURCES: Readonly<Partial<Record<ProductSource, string>>> = {
    COUPANG: 'Netlify IP 상시 403 — 2026-07-10 관찰 리뷰에서 33회 연속 무수확 실측(로컬 IP에서만 수확되던 스크레이퍼)',
    SSENSE: 'Netlify IP 상시 403 — 2026-07-10 관찰 리뷰에서 35회 연속 무수확 실측(로컬 IP에서만 수확되던 스크레이퍼)',
};

/**
 * 실행·진단이 실제로 다루는 소스 순서. 진단의 classified_naver 테일은
 * "이 목록에 없는 소스"만 NAVER 분류 행으로 승격하므로, 비활성 소스를
 * 여기서 빼야 그들의 NAVER 분류 상품이 진단에서 사라지지 않는다.
 */
export const ACTIVE_DIRECT_SOURCE_ORDER: readonly ProductSource[] = DIRECT_SOURCE_ORDER.filter(
    (source) => !(source in DISABLED_DIRECT_SOURCES)
);

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
    return ACTIVE_DIRECT_SOURCE_ORDER.map((source) => {
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
