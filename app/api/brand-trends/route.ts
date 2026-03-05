import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getRateLimitKey } from '@/lib/security/requestGuards';
import { BRANDS_TO_TRACK } from '@/lib/config/brands';

// revalidate every 1 hour (Vercel ISR)
export const revalidate = 3600;
export const dynamic = 'force-dynamic';

const BRAND_FETCH_CONCURRENCY = 4;

export interface BrandTrendItem {
    name: string;
    productCount: number;
    change: number;   // % vs last snapshot
    isUp: boolean;
}

async function fetchBrandProductCount(brandName: string): Promise<number> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    if (!clientId || !clientSecret) return 0;

    try {
        const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(brandName)}&display=1&sort=date`;
        const res = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret,
            },
            signal: AbortSignal.timeout(5000),
            next: { tags: ['brand-trends'], revalidate: 3600 },
        });
        if (!res.ok) return 0;
        const data = await res.json();
        return Number(data.total) || 0;
    } catch {
        return 0;
    }
}

async function mapWithConcurrency<T, R>(
    items: readonly T[],
    concurrency: number,
    mapper: (item: T) => Promise<R>
): Promise<R[]> {
    const results: R[] = new Array(items.length);
    let nextIndex = 0;

    async function worker(): Promise<void> {
        while (true) {
            const currentIndex = nextIndex;
            nextIndex += 1;
            if (currentIndex >= items.length) {
                return;
            }
            results[currentIndex] = await mapper(items[currentIndex]);
        }
    }

    const workerCount = Math.min(concurrency, items.length);
    await Promise.all(Array.from({ length: workerCount }, () => worker()));
    return results;
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

    try {
        const countsByBrand = await mapWithConcurrency(
            BRANDS_TO_TRACK,
            BRAND_FETCH_CONCURRENCY,
            fetchBrandProductCount
        );

        const counts = BRANDS_TO_TRACK.map((name, index) => ({
            name,
            count: countsByBrand[index] || 0,
        }));

        const validCounts = counts.filter((entry) => entry.count > 0);
        if (validCounts.length === 0) {
            return NextResponse.json(
                { brands: getFallbackData() },
                {
                    headers: {
                        'X-RateLimit-Remaining': String(rateLimit.remaining),
                    },
                }
            );
        }

        const sortedValidCounts = [...validCounts].sort((a, b) => a.count - b.count);
        const median = sortedValidCounts[Math.floor(sortedValidCounts.length / 2)]?.count || 1;

        const brands: BrandTrendItem[] = counts.map((entry) => {
            const ratio = entry.count / (median || 1);
            const changeRaw = (ratio - 1) * 20;
            const change = Math.min(Math.abs(Number(changeRaw.toFixed(1))), 30);
            const isUp = changeRaw >= 0;
            return { name: entry.name, productCount: entry.count, change, isUp };
        });

        return NextResponse.json(
            { brands, updatedAt: new Date().toISOString() },
            {
                headers: {
                    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    } catch (error) {
        console.error('[brand-trends] Error:', error);
        return NextResponse.json(
            { brands: getFallbackData(), fallback: true },
            {
                headers: {
                    'X-RateLimit-Remaining': String(rateLimit.remaining),
                },
            }
        );
    }
}

function getFallbackData(): BrandTrendItem[] {
    return [
        { name: 'NIKE', productCount: 0, change: 2.4, isUp: true },
        { name: 'ADIDAS', productCount: 0, change: 0.8, isUp: true },
        { name: 'NEW BALANCE', productCount: 0, change: 3.2, isUp: true },
        { name: 'STUSSY', productCount: 0, change: 0.5, isUp: false },
        { name: 'SUPREME', productCount: 0, change: 12.1, isUp: true },
        { name: 'ARC TERYX', productCount: 0, change: 5.7, isUp: true },
        { name: 'SALOMON', productCount: 0, change: 4.1, isUp: true },
        { name: 'KITH', productCount: 0, change: 0.3, isUp: false },
    ];
}
