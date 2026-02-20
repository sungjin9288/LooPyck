import { NextRequest, NextResponse } from 'next/server';
import { aggregateRealtimeSearch } from '@/lib/api/realtimeAggregator';
import { isFashionRelated } from '@/lib/core/domainGuard';
import { SearchSort, ALLOWED_SORTS } from '@/types/searchSort';
import { checkRateLimit, getRateLimitKey, isQueryLengthValid, normalizeQuery } from '@/lib/security/requestGuards';

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

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }
    if (!isQueryLengthValid(query, 1, 60)) {
        return NextResponse.json({ error: '검색어는 1~60자 사이여야 합니다' }, { status: 400 });
    }

    const guardResult = isFashionRelated(query);
    if (!guardResult.allowed) {
        return NextResponse.json({
            error: guardResult.reason,
            blocked: true
        }, { status: 400 });
    }

    try {
        const products = await aggregateRealtimeSearch(query, page, sort);

        // Cache Control: Public, s-maxage=60 (CDN cache), stale-while-revalidate=30
        return NextResponse.json({ products }, {
            headers: {
                'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
                'X-RateLimit-Remaining': String(rateLimit.remaining),
            }
        });
    } catch (error) {
        console.error('Real-time Search API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
