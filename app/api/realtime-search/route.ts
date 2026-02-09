import { NextRequest, NextResponse } from 'next/server';
import { aggregateRealtimeSearch } from '@/lib/api/realtimeAggregator';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const page = parseInt(searchParams.get('page') || '1', 10);

    if (!query) {
        return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    try {
        const products = await aggregateRealtimeSearch(query, page);

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
