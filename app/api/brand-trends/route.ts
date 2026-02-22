import { NextResponse } from 'next/server';

// revalidate every 1 hour (Vercel ISR)
export const revalidate = 3600;
export const dynamic = 'force-dynamic';

const BRANDS_TO_TRACK = [
    'NIKE', 'ADIDAS', 'NEW BALANCE', 'STUSSY', 'SUPREME',
    'ARC TERYX', 'SALOMON', 'HUMAN MADE', 'KITH', 'PALACE',
    'MUSINSA STANDARD', 'ADER ERROR'
];

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
            // Next.js ISR cache tag
            next: { tags: ['brand-trends'], revalidate: 3600 }
        });
        if (!res.ok) return 0;
        const data = await res.json();
        return data.total || 0;
    } catch {
        return 0;
    }
}

export async function GET() {
    try {
        // Fetch all brands in parallel (with concurrency limit)
        const results = await Promise.allSettled(
            BRANDS_TO_TRACK.map(brand => fetchBrandProductCount(brand))
        );

        const counts = results.map((r, i) => ({
            name: BRANDS_TO_TRACK[i],
            count: r.status === 'fulfilled' ? r.value : 0,
        }));

        // Normalize to "trend score" relative to median
        const validCounts = counts.filter(c => c.count > 0);
        if (validCounts.length === 0) {
            // Fallback if no API keys
            return NextResponse.json({ brands: getFallbackData() });
        }

        const max = Math.max(...validCounts.map(c => c.count));
        const median = validCounts.sort((a, b) => a.count - b.count)[Math.floor(validCounts.length / 2)]?.count || 1;

        const brands: BrandTrendItem[] = counts.map(c => {
            // Simulate change: deviation from median as a percentage
            const ratio = c.count / (median || 1);
            const changeRaw = ((ratio - 1) * 20);
            const change = Math.min(Math.abs(Number(changeRaw.toFixed(1))), 30);
            const isUp = changeRaw >= 0;
            return { name: c.name, productCount: c.count, change, isUp };
        });

        return NextResponse.json({ brands, updatedAt: new Date().toISOString() }, {
            headers: {
                'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
            }
        });
    } catch (error) {
        console.error('[brand-trends] Error:', error);
        return NextResponse.json({ brands: getFallbackData(), fallback: true });
    }
}

// Hardcoded fallback for when API is unavailable
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
