import * as cheerio from 'cheerio';
import { UnifiedProduct } from './aggregator'; // Type Reuse
import { normalizeBrand, normalizeImageUrl, normalizePrice, normalizeTitle } from '@/lib/core/dataNormalizer';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Re-export type for API usage
export type { UnifiedProduct };

// Helper Fetcher with Validation
async function fetchHtml(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            next: { revalidate: 60 } // Server-side caching 60s
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        return await response.text();
    } catch (e) {
        console.error(`Fetch Failed for ${url}:`, e);
        return '';
    }
}

// Helper to proxy images for 29CM/Musinsa to bypass hotlink protection
const proxyImage = (url: string) => `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=500&output=webp`;

// 1. Naver API Wrapper
async function fetchNaverRealtime(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const start = (page - 1) * 20 + 1;

    if (!clientId || !clientSecret) {
        return [];
    }

    try {
        const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=20&start=${start}&sort=sim`;
        const res = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            }
        });
        const data = await res.json();
        if (!data.items) return [];

        return data.items.map((item: any) => ({
            id: `naver_${item.productId}`,
            title: normalizeTitle(item.title).replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
            price: parseInt(item.lprice, 10),
            image: item.image, // Naver images usually work fine
            link: item.link,
            mallName: item.mallName,
            brand: item.brand,
            category1: item.category1,
            source: 'NAVER' as const
        }));
    } catch (e) {
        console.error('Naver API Error:', e);
        return [];
    }
}

// 2. Musinsa Real-time Scraper (HTML Parsing)
async function scrapeMusinsa(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    const url = `https://www.musinsa.com/search/goods?keyword=${encodeURIComponent(query)}&page=${page}`;
    const html = await fetchHtml(url);
    if (!html) return [];

    const $ = cheerio.load(html);
    const products: UnifiedProduct[] = [];

    $('.list-box .li_box').each((_, el) => {
        try {
            const $el = $(el);
            const title = $el.find('.item_title').text() || $el.find('.list_info a').attr('title');
            const priceStr = $el.find('.price').text();
            let imgUrl = $el.find('img').attr('data-original') || $el.find('img').attr('src');
            const link = $el.find('.list_info a').attr('href');
            const brand = $el.find('.item_brand').text();

            if (title && priceStr && imgUrl) {
                if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;

                products.push({
                    id: `musinsa_${link?.split('/').pop() || Math.random()}`,
                    title: normalizeTitle(title as string),
                    price: normalizePrice(priceStr),
                    image: proxyImage(imgUrl), // Proxy applied
                    link: link ? `https://www.musinsa.com${link}` : '#',
                    mallName: 'Musinsa',
                    brand: normalizeBrand(brand),
                    source: 'MUSINSA' as const
                });
            }
        } catch (e) {
            // Ignore
        }
    });

    return products.slice(0, 10);
}

// 3. 29CM Real-time Scraper
async function scrape29CM(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    const offset = (page - 1) * 10;
    try {
        const url = `https://search-api.29cm.co.kr/api/v4/products/search?keyword=${encodeURIComponent(query)}&limit=10&offset=${offset}`;
        const res = await fetch(url);
        const data = await res.json();

        if (!data.data || !data.data.products) return [];

        return data.data.products.map((item: any) => ({
            id: `29cm_${item.itemNo}`,
            title: normalizeTitle(item.itemName),
            price: item.salePrice || item.consumerPrice,
            image: proxyImage(`https://img.29cm.co.kr${item.imageUrl}`.replace('https://img.29cm.co.krhttps', 'https')), // Fix double protocol if API returns full URL
            link: `https://product.29cm.co.kr/catalog/${item.itemNo}`,
            mallName: '29CM',
            brand: normalizeBrand(item.brandName),
            source: '29CM' as const
        }));
    } catch (e) {
        return [];
    }
}

/**
 * Main Aggregator Function
 */
export async function aggregateRealtimeSearch(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    const results = await Promise.allSettled([
        fetchNaverRealtime(query, page),
        scrapeMusinsa(query, page),
        scrape29CM(query, page),
        mockGlobalMalls(query, page) // Verified Mock Data
    ]);

    let aggregated: UnifiedProduct[] = [];

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            aggregated = [...aggregated, ...result.value];
        }
    });

    return aggregated.sort((a, b) => a.price - b.price);
}

// 4. Mock Global Malls (Simulation for Diversity)
async function mockGlobalMalls(query: string, page: number): Promise<UnifiedProduct[]> {
    // Only return mocks on page 1 to avoid clutter
    if (page > 1) return [];

    const mocks: UnifiedProduct[] = [
        {
            id: `farfetch_${Math.random()}`,
            title: `[Farfetch Global] ${query} Premium Collection`,
            price: Math.floor(Math.random() * 500000) + 150000,
            image: `https://loremflickr.com/400/500/fashion,luxury?random=${Math.random()}`,
            link: 'https://www.farfetch.com',
            mallName: 'Farfetch',
            brand: 'Off-White',
            source: 'FARFETCH' as const
        },
        {
            id: `coupang_${Math.random()}`,
            title: `[Rocket Delivery] ${query} Daily Essential`,
            price: Math.floor(Math.random() * 50000) + 10000,
            image: `https://loremflickr.com/400/500/clothing,casual?random=${Math.random()}`,
            link: 'https://www.coupang.com',
            mallName: 'Coupang',
            brand: 'Base Alpha',
            source: 'COUPANG' as const
        },
        {
            id: `ssense_${Math.random()}`,
            title: `[SSENSE Exclusive] ${query} Limited Edition`,
            price: Math.floor(Math.random() * 800000) + 300000,
            image: `https://loremflickr.com/400/500/model,streetwear?random=${Math.random()}`,
            link: 'https://www.ssense.com',
            mallName: 'SSENSE',
            brand: 'Essentials',
            source: 'SSENSE' as const
        }
    ];

    return mocks;
}
// 5. Mock Product Fetcher by ID (Phase 40: SEO Support)
export async function getProductById(id: string): Promise<UnifiedProduct | null> {
    // In a real scenario, this would fetch from Firestore or decode the ID to scrape.
    // For now, we return a mock based on the ID to allow the page to render.

    // Simulate lookup delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return {
        id: id,
        title: `[Specimen] High-End Fashion Item ${id.substring(0, 5)}`,
        price: 125000,
        image: `https://loremflickr.com/500/700/fashion,outfit?random=${id}`,
        link: 'https://www.musinsa.com',
        mallName: 'Musinsa',
        brand: 'LooPyck Selection',
        source: 'MUSINSA' as const
    };
}
