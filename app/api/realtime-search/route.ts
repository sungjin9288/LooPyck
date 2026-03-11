import { NextRequest, NextResponse } from 'next/server';
import { aggregateRealtimeSearchDetailed, aggregateRealtimeSearchNaverOnly, type SearchAggregationDiagnostics, type SearchSourceDiagnostic, type UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { persistSearchDiagnostics, recordSearchDiagnostics } from '@/lib/api/searchDiagnostics';
import { analyzeFashionQuery, buildSourceAwareSearchPlan, rerankProductsByFashionRelevance } from '@/lib/search/fashionQueryAssistant';
import { loadApprovedSearchLearningQueries, loadApprovedSearchLearningRewritePlan, mergeLearnedQueriesIntoPlan, persistSearchLearningCandidate, recordSearchLearningCandidate } from '@/lib/search/queryLearning';
import { mergeSourceQueryPlans } from '@/lib/search/searchLearningRewritePacks';
import { SearchSort, ALLOWED_SORTS } from '@/types/searchSort';
import { checkRateLimit, getRateLimitKey, isQueryLengthValid, normalizeQuery } from '@/lib/security/requestGuards';
import { persistPriceHistorySnapshot, searchTrackedProductsByFashionQuery } from '@/lib/server/priceHistoryStore';

export const runtime = 'nodejs';
const SEARCH_AGGREGATION_TIMEOUT_MS = 12_000;
const SEARCH_SIDE_EFFECT_TIMEOUT_MS = 1_500;

function uniqueQueryCandidates(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function buildBroadFallbackQueries(
    queryAnalysis: ReturnType<typeof analyzeFashionQuery>,
    sourceQueryPlan: ReturnType<typeof buildSourceAwareSearchPlan>
): string[] {
    const categoryQueries = queryAnalysis.categorySignals.flatMap((category) => {
        const categoryAnalysis = analyzeFashionQuery(category);
        const categoryPlan = buildSourceAwareSearchPlan(categoryAnalysis);
        return categoryPlan.NAVER || [category];
    });

    return uniqueQueryCandidates([
        ...(sourceQueryPlan.NAVER || []),
        ...queryAnalysis.suggestedQueries,
        ...categoryQueries,
    ]).slice(0, 12);
}

function buildTrackedCatalogDiagnostics(
    baseDiagnostics: SearchAggregationDiagnostics,
    products: UnifiedProduct[]
): SearchAggregationDiagnostics {
    const counts = new Map<string, number>();
    products.forEach((product) => {
        counts.set(product.source, (counts.get(product.source) || 0) + 1);
    });

    const sourceDiagnostics: SearchSourceDiagnostic[] = Array.from(counts.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([source, count]) => ({
            source: source as UnifiedProduct['source'],
            attempted: false,
            success: count > 0,
            durationMs: 0,
            directCount: count,
            naverCount: 0,
            finalCount: count,
            strategy: 'tracked_catalog',
            fallbackReason: 'tracked_catalog_search',
            requestedQueries: [baseDiagnostics.effectiveQuery || baseDiagnostics.query],
            resolvedQuery: baseDiagnostics.effectiveQuery || baseDiagnostics.query,
        }));

    return {
        ...baseDiagnostics,
        generatedAt: new Date().toISOString(),
        totalProducts: products.length,
        directSourceCount: sourceDiagnostics.length,
        fallbackSourceCount: sourceDiagnostics.length,
        sources: sourceDiagnostics,
    };
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout> | undefined;

    try {
        return await Promise.race([
            promise,
            new Promise<T>((_, reject) => {
                timer = setTimeout(() => {
                    reject(new Error(`search_timeout_${timeoutMs}`));
                }, timeoutMs);
            }),
        ]);
    } finally {
        if (timer) {
            clearTimeout(timer);
        }
    }
}

async function withSoftTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
    try {
        return await withTimeout(promise, timeoutMs);
    } catch {
        return null;
    }
}

export async function GET(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'realtime-search'), 60, 60_000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimit.retryAfterSec),
                },
            }
        );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = normalizeQuery(searchParams.get('q'));
    const pageRaw = parseInt(searchParams.get('page') || '1', 10);
    const sortRaw = searchParams.get('sort') || 'sim';
    const sort: SearchSort = ALLOWED_SORTS.includes(sortRaw as SearchSort) ? (sortRaw as SearchSort) : 'sim';
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.min(pageRaw, 25) : 1;
    const debug = searchParams.get('debug') === '1';

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }
    if (!isQueryLengthValid(query, 1, 60)) {
        return NextResponse.json({ error: '검색어는 1~60자 사이여야 합니다' }, { status: 400 });
    }

    const queryAnalysis = analyzeFashionQuery(query);
    if (!queryAnalysis.allowed) {
        return NextResponse.json({
            error: queryAnalysis.reason,
            blocked: true,
            suggestedQueries: queryAnalysis.suggestedQueries,
            searchMeta: {
                requestedQuery: queryAnalysis.originalQuery,
                effectiveQuery: queryAnalysis.normalizedQuery,
                queryIntent: queryAnalysis.intent,
                reranked: false,
                exactMatchCount: 0,
                strongMatchCount: 0,
                resultQuality: 'weak',
                suggestedQueries: queryAnalysis.suggestedQueries,
            },
        }, { status: 400 });
    }

    try {
        const effectiveQuery = queryAnalysis.normalizedQuery || query;
        const learnedQueries = await loadApprovedSearchLearningQueries([effectiveQuery, queryAnalysis.originalQuery, query]);
        const learnedRewritePlan = await loadApprovedSearchLearningRewritePlan(queryAnalysis);
        const sourceQueryPlan = mergeSourceQueryPlans(
            mergeLearnedQueriesIntoPlan(
                buildSourceAwareSearchPlan(queryAnalysis),
                learnedQueries
            ),
            learnedRewritePlan
        );
        let fallbackMode: 'full' | 'naver_only' | 'tracked_catalog' = 'full';
        let aggregation = await withTimeout(
            aggregateRealtimeSearchDetailed(effectiveQuery, page, sort, sourceQueryPlan),
            SEARCH_AGGREGATION_TIMEOUT_MS
        ).catch(async (error) => {
            console.warn('[RealtimeSearch] full aggregation failed, falling back to NAVER only:', error);
            fallbackMode = 'naver_only';
            return await aggregateRealtimeSearchNaverOnly(
                effectiveQuery,
                page,
                sort,
                sourceQueryPlan.NAVER || [effectiveQuery, query]
            );
        });

        if (aggregation.products.length === 0) {
            const naverFallback = await aggregateRealtimeSearchNaverOnly(
                effectiveQuery,
                page,
                sort,
                sourceQueryPlan.NAVER || [effectiveQuery, query]
            );

            if (naverFallback.products.length > 0) {
                aggregation = naverFallback;
                fallbackMode = 'naver_only';
            } else {
                const broadFallbackQueries = buildBroadFallbackQueries(queryAnalysis, sourceQueryPlan);
                const broadFallback = await aggregateRealtimeSearchNaverOnly(
                    effectiveQuery,
                    page,
                    sort,
                    broadFallbackQueries
                );

                if (broadFallback.products.length > 0) {
                    aggregation = broadFallback;
                    fallbackMode = 'naver_only';
                }
            }
        }

        if (aggregation.products.length === 0) {
            const trackedFallbackProducts = await searchTrackedProductsByFashionQuery(queryAnalysis, 24, 320);
            if (trackedFallbackProducts.length > 0) {
                aggregation = {
                    products: trackedFallbackProducts,
                    diagnostics: buildTrackedCatalogDiagnostics(aggregation.diagnostics, trackedFallbackProducts),
                };
                fallbackMode = 'tracked_catalog';
            }
        }

        const { products, diagnostics } = aggregation;
        const reranked = rerankProductsByFashionRelevance(products, queryAnalysis, sort);
        const diagnosticsPayload = {
            ...diagnostics,
            effectiveQuery,
            queryIntent: queryAnalysis.intent,
            resultQuality: reranked.meta.resultQuality,
            exactMatchCount: reranked.meta.exactMatchCount,
            strongMatchCount: reranked.meta.strongMatchCount,
            suggestedQueries: reranked.meta.suggestedQueries,
            totalProducts: reranked.products.length,
        };
        recordSearchDiagnostics(diagnosticsPayload);
        recordSearchLearningCandidate(diagnosticsPayload);

        let historyEnabled = false;
        let comparisonGroupsPersisted = 0;
        let optionHistoriesPersisted = 0;
        let variantHistoriesPersisted = 0;
        const searchDiagnosticsPersistPromise = withSoftTimeout(
            persistSearchDiagnostics(diagnosticsPayload).catch((persistError) => {
                console.warn('[SearchDiagnostics] persist failed:', persistError);
                return null;
            }),
            SEARCH_SIDE_EFFECT_TIMEOUT_MS
        );

        const historyPersistPromise = withSoftTimeout(
            persistPriceHistorySnapshot(reranked.products, effectiveQuery).catch((ingestError) => {
                console.warn('[PriceHistory] ingest failed:', ingestError);
                return null;
            }),
            SEARCH_SIDE_EFFECT_TIMEOUT_MS
        );
        const learningPersistPromise = withSoftTimeout(
            persistSearchLearningCandidate(diagnosticsPayload).catch((learningError) => {
                console.warn('[SearchLearning] persist failed:', learningError);
                return null;
            }),
            SEARCH_SIDE_EFFECT_TIMEOUT_MS
        );

        const historyResult = await historyPersistPromise;
        if (historyResult) {
            historyEnabled = historyResult.enabled;
            comparisonGroupsPersisted = historyResult.comparisonGroupsPersisted;
            optionHistoriesPersisted = historyResult.optionHistoriesPersisted;
            variantHistoriesPersisted = historyResult.variantHistoriesPersisted;
        }
        void searchDiagnosticsPersistPromise;
        void learningPersistPromise;

        const fallbackSources = diagnosticsPayload.sources.filter(
            (entry) => entry.strategy === 'naver_classified_fallback' || entry.strategy === 'classified_naver'
        );

        if (fallbackSources.length > 0) {
            console.info('[RealtimeSearch] source fallback', {
                query: effectiveQuery,
                page,
                fallbackSources: fallbackSources.map((entry) => ({
                    source: entry.source,
                    reason: entry.fallbackReason,
                    finalCount: entry.finalCount,
                })),
            });
        }

        // Cache Control: Public, s-maxage=60 (CDN cache), stale-while-revalidate=30
        return NextResponse.json(
            debug
                ? { products: reranked.products, diagnostics: diagnosticsPayload, searchMeta: reranked.meta }
                : { products: reranked.products, searchMeta: reranked.meta },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                    'X-PriceHistory-Enabled': String(historyEnabled),
                    'X-Comparison-Groups-Persisted': String(comparisonGroupsPersisted),
                    'X-Variant-Histories-Persisted': String(variantHistoriesPersisted),
                    'X-Option-Histories-Persisted': String(optionHistoriesPersisted),
                    'X-Search-Direct-Sources': String(diagnosticsPayload.directSourceCount),
                    'X-Search-Fallback-Sources': String(diagnosticsPayload.fallbackSourceCount),
                    'X-Search-Fallback-Mode': fallbackMode,
                },
            }
        );
    } catch (error) {
        console.error('Real-time Search API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
