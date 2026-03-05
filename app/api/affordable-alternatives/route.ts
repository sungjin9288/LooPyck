import { NextRequest, NextResponse } from 'next/server';
import { aggregateRealtimeSearch } from '@/lib/api/realtimeAggregator';
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

    try {
        // 가격 오름차순 검색 → 현재 상품보다 20% 이상 저렴한 것만 필터
        const results = await aggregateRealtimeSearch(q, 1, 'asc');
        const maxPrice = currentPrice * 0.8;
        const alternatives = results
            .filter(p => p.id !== currentId && p.price > 0 && p.price <= maxPrice && p.image)
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
