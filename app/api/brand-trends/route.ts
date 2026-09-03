import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { NAVER_SHOPPING_SEARCH_RETIREMENT } from '@/lib/api/naverShoppingSearchLifecycle';

// revalidate every 1 hour (Vercel ISR)
export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export interface BrandTrendItem {
    name: string;
    productCount: number;
    change: number;   // % vs last snapshot
    isUp: boolean;
}

export async function GET(request: NextRequest) {
    const rateLimit = await checkRateLimit(getRateLimitKey(request, 'brand-trends'), 20, 60_000);
    if (!rateLimit.allowed) {
        return NextResponse.json(
            { error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' },
            {
                status: 429,
                headers: {
                    'Retry-After': String(rateLimit.retryAfterSec),
                    'X-RateLimit-Remaining': '0',
                },
            }
        );
    }

    return NextResponse.json(
        {
            brands: getFallbackData(),
            fallback: true,
            reason: NAVER_SHOPPING_SEARCH_RETIREMENT.reason,
        },
        {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
                'X-RateLimit-Remaining': String(rateLimit.remaining),
            },
        }
    );
}

function getFallbackData(): BrandTrendItem[] {
    return [
        { name: 'NIKE', productCount: 0, change: 0, isUp: true },
        { name: 'ADIDAS', productCount: 0, change: 0, isUp: true },
        { name: 'NEW BALANCE', productCount: 0, change: 0, isUp: true },
        { name: 'STUSSY', productCount: 0, change: 0, isUp: true },
        { name: 'SUPREME', productCount: 0, change: 0, isUp: true },
        { name: 'ARC TERYX', productCount: 0, change: 0, isUp: true },
        { name: 'SALOMON', productCount: 0, change: 0, isUp: true },
        { name: 'KITH', productCount: 0, change: 0, isUp: true },
    ];
}
