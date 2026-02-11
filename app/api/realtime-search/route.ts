import { NextRequest, NextResponse } from 'next/server';
import { aggregateRealtimeSearch } from '@/lib/api/realtimeAggregator';
import { isFashionRelated } from '@/lib/core/domainGuard';

type SearchSort = 'sim' | 'date' | 'asc' | 'dsc';
const ALLOWED_SORTS: SearchSort[] = ['sim', 'date', 'asc', 'dsc'];

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const pageRaw = parseInt(searchParams.get('page') || '1', 10);
    const sortRaw = searchParams.get('sort') || 'sim';
    const sort: SearchSort = ALLOWED_SORTS.includes(sortRaw as SearchSort) ? (sortRaw as SearchSort) : 'sim';
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
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
            }
        });
    } catch (error) {
        console.error('Real-time Search API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
