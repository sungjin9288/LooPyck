import { NextRequest, NextResponse } from 'next/server';
import { aggregateRealtimeSearch } from '@/lib/api/realtimeAggregator';
import { analyzeFashionQuery, rerankProductsByFashionRelevance } from '@/lib/search/fashionQueryAssistant';
import { checkRateLimit, getRateLimitKey, normalizeQuery } from '@/lib/security/requestGuards';
import { isFashionRelated } from '@/lib/core/domainGuard';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'affordable-alternatives'), 20, 60_000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: '요청이 너무 많습니다.' },
            { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSec) } }
        );
    }

    const { searchParams } = request.nextUrl;
    const rawQ = searchParams.get('q') || '';
    const currentPrice = parseInt(searchParams.get('price') || '0', 10);
    const currentId = searchParams.get('id') || '';

    const q = normalizeQuery(rawQ);
    if (!q || !Number.isFinite(currentPrice) || currentPrice <= 0) {
        return NextResponse.json({ alternatives: [] });
    }

    const guard = isFashionRelated(q);
    if (!guard.allowed) {
        return NextResponse.json({ alternatives: [] });
    }

    const queryAnalysis = analyzeFashionQuery(q);
    if (
        !queryAnalysis.allowed
        || (queryAnalysis.brandSignals.length === 0 && queryAnalysis.categorySignals.length === 0)
    ) {
        return NextResponse.json({ alternatives: [] });
    }

    try {
        // 가격 오름차순 검색 후, 패션 relevance가 약한 결과는 대체 상품 후보에서 제외
        const results = await aggregateRealtimeSearch(q, 1, 'asc');
        const reranked = rerankProductsByFashionRelevance(results, queryAnalysis, 'sim');
        if (reranked.meta.resultQuality === 'weak') {
            return NextResponse.json({ alternatives: [] });
        }

        const maxPrice = currentPrice * 0.8;
        const alternatives = reranked.products
            .filter((product) =>
                product.id !== currentId
                && product.price > 0
                && product.price <= maxPrice
                && product.image
            )
            .slice(0, 3);

        return NextResponse.json(
            { alternatives },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=120, stale-while-revalidate=60',
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    } catch (error) {
        console.error('[affordable-alternatives]', error);
        return NextResponse.json({ alternatives: [] });
    }
}
