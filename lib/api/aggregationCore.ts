/**
 * Pure aggregation core: dedupe/merge helpers, timed-search helpers, and diagnostics building.
 *
 * Moved verbatim (Phase 3 of the registry-based refactor) out of realtimeAggregator.ts.
 * No network I/O lives here — everything is pure or takes injected executors/promises.
 *
 * `buildAggregationDiagnostics` takes `directSourceOrder` as an explicit parameter instead of
 * closing over a module-level constant, so the registry (searchSourceRegistry.ts) can supply
 * the canonical 14-entry DIRECT_SOURCE_ORDER without this module needing to know about it.
 */
import { getSourceIdPrefix } from './sourceCatalog.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';
import type { ProductSource, UnifiedProduct } from './types.ts';
import type { SearchSort } from '../../types/searchSort.ts';
import { Logger } from '../core/observability.ts';

export type TimedSearchResult = {
    source: UnifiedProduct['source'];
    products: UnifiedProduct[];
    durationMs: number;
    fallbackReason?: string;
    requestedQueries?: string[];
    resolvedQuery?: string;
};

export type SearchSourceStrategy =
    | 'api'
    | 'direct'
    | 'direct_preferred_over_naver'
    | 'naver_classified_fallback'
    | 'classified_naver'
    | 'tracked_catalog'
    | 'empty';

export interface SearchSourceDiagnostic {
    source: UnifiedProduct['source'];
    attempted: boolean;
    success: boolean;
    durationMs: number;
    directCount: number;
    naverCount: number;
    finalCount: number;
    strategy: SearchSourceStrategy;
    fallbackReason?: string;
    requestedQueries?: string[];
    resolvedQuery?: string;
}

export interface SearchAggregationDiagnostics {
    query: string;
    page: number;
    sort: SearchSort;
    generatedAt: string;
    effectiveQuery?: string;
    queryIntent?: 'fashion' | 'mixed' | 'unknown' | 'non_fashion';
    resultQuality?: 'strong' | 'mixed' | 'weak';
    exactMatchCount?: number;
    strongMatchCount?: number;
    suggestedQueries?: string[];
    totalProducts: number;
    totalGroups?: number;
    comparableGroupCount?: number;
    compareReadyGroupCount?: number;
    spreadCapturedGroupCount?: number;
    capturedPriceSpreadTotal?: number;
    maxCapturedPriceSpread?: number;
    verifiedOptionGroupCount?: number;
    preciseOptionGroupCount?: number;
    directSourceCount: number;
    fallbackSourceCount: number;
    sources: SearchSourceDiagnostic[];
}

export interface AggregateRealtimeSearchResult {
    products: UnifiedProduct[];
    diagnostics: SearchAggregationDiagnostics;
}

export function buildSourceAwareId(source: UnifiedProduct['source'], productId: string, title: string, index: number): string {
    const trimmedProductId = productId.trim();
    const fallbackId = normalizeTitle(title).replace(/\s+/g, '_').slice(0, 40) || `item_${index}`;
    return `${getSourceIdPrefix(source)}_${trimmedProductId || fallbackId}`;
}

export function normalizeDedupLink(link: string): string {
    try {
        const parsed = new URL(link);
        const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
        return `${parsed.hostname.toLowerCase()}${pathname}`;
    } catch {
        return link.trim().toLowerCase();
    }
}

export function buildDedupKeys(product: UnifiedProduct): string[] {
    const keys: string[] = [];
    const linkKey = normalizeDedupLink(product.link);
    if (linkKey) {
        keys.push(`link:${product.source}:${linkKey}`);
    }

    const titleKey = normalizeTitle(product.title).toLowerCase().replace(/\s+/g, ' ').trim();
    if (titleKey) {
        keys.push(`title:${product.source}:${titleKey}:${product.price}`);
    }

    return keys;
}

export function dedupeProducts(products: UnifiedProduct[]): UnifiedProduct[] {
    const seen = new Set<string>();
    const deduped: UnifiedProduct[] = [];

    for (const product of products) {
        const keys = buildDedupKeys(product);
        if (keys.some((key) => seen.has(key))) {
            continue;
        }

        keys.forEach((key) => seen.add(key));
        deduped.push(product);
    }

    return deduped;
}

export function mergeWithPreferredDirectProducts(primary: UnifiedProduct[], preferredDirectProducts: UnifiedProduct[]): UnifiedProduct[] {
    const preferredEntries = preferredDirectProducts.map((product) => ({
        keys: buildDedupKeys(product),
        product,
    }));

    const mergedPrimary = primary.map((product) => {
        const productKeys = buildDedupKeys(product);
        const preferred = preferredEntries.find(({ keys }) => productKeys.some((key) => keys.includes(key)));
        return preferred?.product ?? product;
    });

    return dedupeProducts([...mergedPrimary, ...preferredDirectProducts]);
}

export function countProductsBySource(products: UnifiedProduct[]): Map<UnifiedProduct['source'], number> {
    const counts = new Map<UnifiedProduct['source'], number>();

    products.forEach((product) => {
        counts.set(product.source, (counts.get(product.source) || 0) + 1);
    });

    return counts;
}

export async function runTimedSearch(
    source: UnifiedProduct['source'],
    executor: () => Promise<UnifiedProduct[]>,
    emptyReason: string
): Promise<TimedSearchResult> {
    const startedAt = Date.now();

    try {
        const products = await executor();
        return {
            source,
            products,
            durationMs: Date.now() - startedAt,
            fallbackReason: products.length > 0 ? undefined : emptyReason,
        };
    } catch (error) {
        Logger.error(`[RealtimeSearch] ${source} adapter failed`, error);
        return {
            source,
            products: [],
            durationMs: Date.now() - startedAt,
            fallbackReason: 'adapter_exception',
        };
    }
}

export function uniqueQueryCandidates(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

export async function runTimedSearchWithCandidates(
    source: UnifiedProduct['source'],
    queries: string[],
    executor: (query: string) => Promise<UnifiedProduct[]>,
    emptyReason: string
): Promise<TimedSearchResult> {
    const startedAt = Date.now();
    const requestedQueries = uniqueQueryCandidates(queries);
    let lastReason = emptyReason;

    for (const candidate of requestedQueries) {
        try {
            const products = await executor(candidate);
            if (products.length > 0) {
                return {
                    source,
                    products,
                    durationMs: Date.now() - startedAt,
                    requestedQueries,
                    resolvedQuery: candidate,
                };
            }
        } catch (error) {
            Logger.error(`[RealtimeSearch] ${source} adapter failed`, error, { candidate });
            lastReason = 'adapter_exception';
        }
    }

    return {
        source,
        products: [],
        durationMs: Date.now() - startedAt,
        fallbackReason: lastReason,
        requestedQueries,
        resolvedQuery: requestedQueries[0],
    };
}

/**
 * NAVER search runner, parameterized over the actual Naver API fetch executor and a
 * credential-check predicate so this module has no direct env/network dependency.
 */
export async function runNaverSearchLike(
    queries: string[],
    page: number,
    sort: SearchSort,
    fetchNaverRealtime: (query: string, page: number, sort: SearchSort) => Promise<UnifiedProduct[]>,
    hasNaverCredentials: () => boolean
): Promise<TimedSearchResult> {
    const startedAt = Date.now();
    const requestedQueries = uniqueQueryCandidates(queries);
    const query = requestedQueries[0] || '';

    if (!hasNaverCredentials()) {
        return {
            source: 'NAVER',
            products: [],
            durationMs: Date.now() - startedAt,
            fallbackReason: 'naver_credentials_missing',
            requestedQueries,
            resolvedQuery: query,
        };
    }

    let lastReason = 'no_results_or_api_error';

    for (const candidate of requestedQueries) {
        try {
            const products = await fetchNaverRealtime(candidate, page, sort);
            if (products.length > 0) {
                return {
                    source: 'NAVER',
                    products,
                    durationMs: Date.now() - startedAt,
                    requestedQueries,
                    resolvedQuery: candidate,
                };
            }
        } catch (error) {
            Logger.error('[RealtimeSearch] NAVER adapter failed', error, { candidate });
            lastReason = 'naver_exception';
        }
    }

    return {
        source: 'NAVER',
        products: [],
        durationMs: Date.now() - startedAt,
        fallbackReason: lastReason,
        requestedQueries,
        resolvedQuery: query,
    };
}

export async function withTimedSearchBudget(
    source: UnifiedProduct['source'],
    queries: string[],
    promise: Promise<TimedSearchResult>,
    timeoutMs: number,
    timeoutReason: string
): Promise<TimedSearchResult> {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const requestedQueries = uniqueQueryCandidates(queries);
    const startedAt = Date.now();

    try {
        return await Promise.race([
            promise,
            new Promise<TimedSearchResult>((resolve) => {
                timer = setTimeout(() => {
                    resolve({
                        source,
                        products: [],
                        durationMs: Date.now() - startedAt,
                        fallbackReason: timeoutReason,
                        requestedQueries,
                        resolvedQuery: requestedQueries[0],
                    });
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}

export function buildAggregationDiagnostics(
    query: string,
    page: number,
    sort: SearchSort,
    aggregated: UnifiedProduct[],
    naverRun: TimedSearchResult,
    directRuns: TimedSearchResult[],
    directSourceOrder: readonly ProductSource[]
): SearchAggregationDiagnostics {
    const naverCounts = countProductsBySource(naverRun.products);
    const finalCounts = countProductsBySource(aggregated);

    const sourceDiagnostics: SearchSourceDiagnostic[] = [];

    sourceDiagnostics.push({
        source: 'NAVER',
        attempted: true,
        success: naverRun.products.length > 0,
        durationMs: naverRun.durationMs,
        directCount: naverRun.products.length,
        naverCount: naverRun.products.length,
        finalCount: finalCounts.get('NAVER') || 0,
        strategy: naverRun.products.length > 0 ? 'api' : 'empty',
        fallbackReason: naverRun.fallbackReason,
        requestedQueries: naverRun.requestedQueries,
        resolvedQuery: naverRun.resolvedQuery,
    });

    directRuns.forEach((run) => {
        const directCount = run.products.length;
        const naverCount = naverCounts.get(run.source) || 0;
        const finalCount = finalCounts.get(run.source) || 0;

        let strategy: SearchSourceStrategy = 'empty';
        let fallbackReason = run.fallbackReason;

        if (directCount > 0 && naverCount > 0) {
            strategy = 'direct_preferred_over_naver';
            fallbackReason = undefined;
        } else if (directCount > 0) {
            strategy = 'direct';
            fallbackReason = undefined;
        } else if (naverCount > 0) {
            strategy = 'naver_classified_fallback';
            fallbackReason = 'direct_empty_used_naver_classification';
        }

        sourceDiagnostics.push({
            source: run.source,
            attempted: true,
            success: finalCount > 0,
            durationMs: run.durationMs,
            directCount,
            naverCount,
            finalCount,
            strategy,
            fallbackReason,
            requestedQueries: run.requestedQueries,
            resolvedQuery: run.resolvedQuery,
        });
    });

    const directSourceSet = new Set<UnifiedProduct['source']>(directSourceOrder);
    Array.from(naverCounts.entries())
        .filter(([source, count]) => source !== 'NAVER' && !directSourceSet.has(source) && count > 0)
        .sort(([left], [right]) => left.localeCompare(right))
        .forEach(([source, naverCount]) => {
            sourceDiagnostics.push({
                source,
                attempted: false,
                success: true,
                durationMs: naverRun.durationMs,
                directCount: 0,
                naverCount,
                finalCount: finalCounts.get(source) || naverCount,
                strategy: 'classified_naver',
                fallbackReason: 'naver_classified_only',
                requestedQueries: naverRun.requestedQueries,
                resolvedQuery: naverRun.resolvedQuery,
            });
        });

    return {
        query,
        page,
        sort,
        generatedAt: new Date().toISOString(),
        totalProducts: aggregated.length,
        directSourceCount: sourceDiagnostics.filter((entry) => entry.strategy === 'direct' || entry.strategy === 'direct_preferred_over_naver').length,
        fallbackSourceCount: sourceDiagnostics.filter((entry) => entry.strategy === 'naver_classified_fallback' || entry.strategy === 'classified_naver').length,
        sources: sourceDiagnostics,
    };
}
