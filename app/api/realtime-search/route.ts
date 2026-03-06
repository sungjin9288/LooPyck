import { NextRequest, NextResponse } from 'next/server';
import { aggregateRealtimeSearchDetailed } from '@/lib/api/realtimeAggregator';
import { persistSearchDiagnostics, recordSearchDiagnostics } from '@/lib/api/searchDiagnostics';
import { analyzeFashionQuery, buildSourceAwareSearchPlan, rerankProductsByFashionRelevance } from '@/lib/search/fashionQueryAssistant';
import { SearchSort, ALLOWED_SORTS } from '@/types/searchSort';
import { checkRateLimit, getRateLimitKey, isQueryLengthValid, normalizeQuery } from '@/lib/security/requestGuards';
import { persistPriceHistorySnapshot } from '@/lib/server/priceHistoryStore';

export const runtime = 'nodejs';

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
        const sourceQueryPlan = buildSourceAwareSearchPlan(queryAnalysis);
        const { products, diagnostics } = await aggregateRealtimeSearchDetailed(effectiveQuery, page, sort, sourceQueryPlan);
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
        try {
            await persistSearchDiagnostics(diagnosticsPayload);
        } catch (persistError) {
            console.warn('[SearchDiagnostics] persist failed:', persistError);
        }

        let historyEnabled = false;
        let comparisonGroupsPersisted = 0;
        try {
            const historyResult = await persistPriceHistorySnapshot(reranked.products, effectiveQuery);
            historyEnabled = historyResult.enabled;
            comparisonGroupsPersisted = historyResult.comparisonGroupsPersisted;
        } catch (ingestError) {
            console.warn('[PriceHistory] ingest failed:', ingestError);
        }

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
                    'X-Search-Direct-Sources': String(diagnosticsPayload.directSourceCount),
                    'X-Search-Fallback-Sources': String(diagnosticsPayload.fallbackSourceCount),
                },
            }
        );
    } catch (error) {
        console.error('Real-time Search API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
