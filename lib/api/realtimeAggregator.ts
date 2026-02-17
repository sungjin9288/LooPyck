import * as cheerio from 'cheerio';
import { UnifiedProduct } from './types';
import { normalizeBrand, normalizePrice, normalizeTitle } from '@/lib/core/dataNormalizer';
import { SearchSort } from '@/types/searchSort';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Re-export type for API usage
export type { UnifiedProduct };

// Naver Shopping API response item shape
interface NaverShopItem {
    productId: string;
    title: string;
    lprice: string;
    image: string;
    link: string;
    mallName: string;
    brand: string;
    category1: string;
}

// 29CM API response item shape
interface TwentyNineCMItem {
    itemNo: string;
    itemName: string;
    salePrice: number;
    consumerPrice: number;
    imageUrl: string;
    brandName: string;
}

// Helper Fetcher with Validation
async function fetchHtml(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7'
            },
            next: { revalidate: 60 }, // Server-side caching 60s
            signal: AbortSignal.timeout(8000)
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
async function fetchNaverRealtime(
    query: string,
    page: number = 1,
    sort: SearchSort = 'sim'
): Promise<UnifiedProduct[]> {
    const clientId = process.env.NAVER_CLIENT_ID;
    const clientSecret = process.env.NAVER_CLIENT_SECRET;
    const start = (page - 1) * 20 + 1;

    if (!clientId || !clientSecret) {
        return [];
    }

    try {
        const url = `https://openapi.naver.com/v1/search/shop.json?query=${encodeURIComponent(query)}&display=20&start=${start}&sort=${sort}`;
        const res = await fetch(url, {
            headers: {
                'X-Naver-Client-Id': clientId,
                'X-Naver-Client-Secret': clientSecret
            },
            signal: AbortSignal.timeout(8000),
        });
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.items) return [];

        return data.items.map((item: NaverShopItem) => ({
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
                    id: link?.split('/').pop()
                        ? `musinsa_${link.split('/').pop()}`
                        : `musinsa_${normalizeTitle(String(title)).slice(0, 24)}_${products.length}`,
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
        const res = await fetch(url, {
            signal: AbortSignal.timeout(8000),
        });
        const data = await res.json();

        if (!data.data || !data.data.products) return [];

        return data.data.products.map((item: TwentyNineCMItem) => ({
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
        console.error('29CM API Error:', e);
        return [];
    }
}

/**
 * Main Aggregator Function
 */
export async function aggregateRealtimeSearch(
    query: string,
    page: number = 1,
    sort: SearchSort = 'sim'
): Promise<UnifiedProduct[]> {
    const results = await Promise.allSettled([
        fetchNaverRealtime(query, page, sort),
        scrapeMusinsa(query, page),
        scrape29CM(query, page)
    ]);

    let aggregated: UnifiedProduct[] = [];
    const sourceBuckets: UnifiedProduct[][] = [];

    results.forEach(result => {
        if (result.status === 'fulfilled') {
            aggregated = [...aggregated, ...result.value];
            sourceBuckets.push(result.value);
        }
    });

    if (sort === 'asc') {
        return aggregated.sort((a, b) => a.price - b.price);
    }
    if (sort === 'dsc') {
        return aggregated.sort((a, b) => b.price - a.price);
    }
    if (sort === 'date') {
        return interleaveBySourceRank(sourceBuckets);
    }
    return aggregated;
}

function interleaveBySourceRank(sourceBuckets: UnifiedProduct[][]): UnifiedProduct[] {
    const maxLen = sourceBuckets.reduce((max, bucket) => Math.max(max, bucket.length), 0);
    const merged: UnifiedProduct[] = [];

    for (let i = 0; i < maxLen; i += 1) {
        for (const bucket of sourceBuckets) {
            const item = bucket[i];
            if (item) merged.push(item);
        }
    }

    return merged;
}
