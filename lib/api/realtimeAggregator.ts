import * as cheerio from 'cheerio';
import { UnifiedProduct } from './types';
import { normalizeBrand, normalizePrice, normalizeTitle } from '@/lib/core/dataNormalizer';
import { SearchSort } from '@/types/searchSort';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';
import type { SearchQueryCandidatePlan } from '@/lib/search/fashionQueryAssistant';
import {
    buildCommerceDataFromTexts,
    parseNaverCommerceData,
    parseTwentyNineCmCommerceData,
} from '@/lib/product/sourceCommerceParsing';
import {
    detectMarketplaceSource,
    getSourceDisplayName,
} from '@/lib/api/sourceCatalog';
import {
    scrapeAbly,
    scrapeCoupang,
    scrapeEql,
    scrapeFarfetch,
    scrapeHago,
    scrapeHandsome,
    scrapeLfMall,
    scrapeSiVillage,
    scrapeSSF,
    scrapeSSense,
    scrapeWConcept,
    scrapeZigzag,
} from '@/lib/api/marketplaceScrapers';
import {
    buildSourceAwareId,
    mergeWithPreferredDirectProducts,
    runNaverSearchLike,
    runTimedSearchWithCandidates,
    withTimedSearchBudget,
    buildAggregationDiagnostics,
    type AggregateRealtimeSearchResult as CoreAggregateRealtimeSearchResult,
    type TimedSearchResult,
} from '@/lib/api/aggregationCore';
import { DIRECT_SOURCE_ORDER, buildDirectRegistry } from '@/lib/api/searchSourceRegistry';
import { withScrapeRetry } from '@/lib/api/scrapeRetry';
import { getHostLimiter, hostnameFromUrl } from '@/lib/api/hostConcurrency';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Re-export type for API usage
export type { UnifiedProduct };

// Re-export diagnostics types so downstream consumers (searchDiagnostics.ts,
// searchLearningEntryCodec.ts, searchLearningSeeding.ts, queryLearningTypes.ts) need zero changes.
export type { SearchSourceStrategy, SearchSourceDiagnostic, SearchAggregationDiagnostics, AggregateRealtimeSearchResult } from '@/lib/api/aggregationCore';

const NAVER_SEARCH_BUDGET_MS = 3_500;
const NAVER_API_HOST = 'openapi.naver.com';
const TWENTY_NINE_CM_API_HOST = 'search-api.29cm.co.kr';

// Naver Shopping API response item shape
interface NaverShopItem {
    productId: string;
    title: string;
    lprice: string;
    hprice?: string;
    image: string;
    link: string;
    mallName: string;
    brand: string;
    category1: string;
    category2?: string;
    category3?: string;
    category4?: string;
    delivery?: string;
    deliveryFeeContent?: string;
    benefitPrice?: string;
    discountPrice?: string;
    benefitText?: string;
    stockText?: string;
    availability?: string;
    status?: string;
}

// 29CM API response item shape
interface TwentyNineCMItem {
    itemNo: string;
    itemName: string;
    salePrice: number;
    consumerPrice: number;
    imageUrl: string;
    brandName: string;
    couponPrice?: number;
    memberPrice?: number;
    discountPrice?: number;
    finalPrice?: number;
    bestPrice?: number;
    immediateDiscountPrice?: number;
    shippingPrice?: number | string;
    deliveryPrice?: number | string;
    shippingFee?: number | string;
    deliveryFee?: number | string;
    freeShippingYn?: boolean | string;
    freeDeliveryYn?: boolean | string;
    freeShipping?: boolean | string;
    freeDelivery?: boolean | string;
    freeShippingStandardAmount?: number | string;
    freeDeliveryStandardPrice?: number | string;
    shippingFreeThreshold?: number | string;
    shippingInfo?: string;
    deliveryInfo?: string;
    shippingText?: string;
    benefitText?: string;
    memberBenefitText?: string;
    couponText?: string;
    discountText?: string;
    soldOut?: boolean | string;
    isSoldOut?: boolean | string;
    soldout?: boolean | string;
    saleState?: string;
    stockState?: string;
    displayState?: string;
    status?: string;
    stockText?: string;
}

// Helper Fetcher with Validation
async function fetchHtml(url: string): Promise<string> {
    const host = hostnameFromUrl(url);

    try {
        return await getHostLimiter(host).run(() => withScrapeRetry(
            async () => {
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
            },
            (html) => html.length === 0,
            Date.now() + 8000
        ));
    } catch (e) {
        console.warn(`[RealtimeSearch] fetchHtml gave up for ${url}:`, e);
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
        const res = await getHostLimiter(NAVER_API_HOST).run(() => withScrapeRetry(
            async () => {
                const response = await fetch(url, {
                    headers: {
                        'X-Naver-Client-Id': clientId,
                        'X-Naver-Client-Secret': clientSecret
                    },
                    signal: AbortSignal.timeout(8000),
                });
                if (!response.ok) throw new Error(`Status ${response.status}`);
                return response;
            },
            () => false,
            Date.now() + 8000
        ));
        if (!res.ok) return [];
        const data = await res.json();
        if (!data.items) return [];

        return data.items.reduce((products: UnifiedProduct[], item: NaverShopItem, index: number) => {
            const image = sanitizeExternalUrl(item.image);
            const link = sanitizeExternalUrl(item.link);
            const price = parseInt(item.lprice, 10);

            if (!image || !link || !Number.isFinite(price)) {
                return products;
            }

            const title = normalizeTitle(item.title).replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
            const source = detectMarketplaceSource(item.mallName, link);

            products.push({
                id: buildSourceAwareId(source, item.productId, title, index),
                title,
                price,
                image,
                link,
                mallName: getSourceDisplayName(source, item.mallName),
                brand: item.brand,
                category1: item.category1,
                category2: item.category2,
                source,
                ...parseNaverCommerceData(item as unknown as Record<string, unknown>, price)
            });
            return products;
        }, []);
    } catch (e) {
        console.warn('[RealtimeSearch] Naver API gave up:', e);
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
            const price = normalizePrice(priceStr);
            const shippingText = [
                $el.find('.txt_delivery').first().text(),
                $el.find('.delivery').first().text(),
                $el.find('[class*="delivery"]').first().text(),
                $el.find('[class*="shipping"]').first().text(),
            ].find((value) => value && value.trim().length > 0);
            const benefitText = [
                $el.find('.txt_member_price').first().text(),
                $el.find('.member-price').first().text(),
                $el.find('[class*="member"]').first().text(),
                $el.find('[class*="coupon"]').first().text(),
                $el.find('[class*="discount"]').first().text(),
            ].find((value) => value && value.trim().length > 0);
            const stockText = [
                $el.find('.txt_state').first().text(),
                $el.find('.soldout').first().text(),
                $el.find('[class*="soldout"]').first().text(),
                $el.find('[class*="stock"]').first().text(),
                $el.find('[class*="status"]').first().text(),
            ].find((value) => value && value.trim().length > 0);

            if (title && priceStr && imgUrl && link) {
                if (imgUrl.startsWith('//')) imgUrl = 'https:' + imgUrl;
                const image = sanitizeExternalUrl(proxyImage(imgUrl));
                const productLink = sanitizeExternalUrl(`https://www.musinsa.com${link}`);
                if (!image || !productLink) {
                    return;
                }

                products.push({
                    id: link?.split('/').pop()
                        ? `musinsa_${link.split('/').pop()}`
                        : `musinsa_${normalizeTitle(String(title)).slice(0, 24)}_${products.length}`,
                    title: normalizeTitle(title as string),
                    price,
                    image,
                    link: productLink,
                    mallName: 'Musinsa',
                    brand: normalizeBrand(brand),
                    source: 'MUSINSA' as const,
                    ...buildCommerceDataFromTexts({
                        basePrice: price,
                        shippingText,
                        benefitText,
                        stockText,
                    }),
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
        const res = await getHostLimiter(TWENTY_NINE_CM_API_HOST).run(() => withScrapeRetry(
            async () => {
                const response = await fetch(url, {
                    signal: AbortSignal.timeout(8000),
                });
                if (!response.ok) throw new Error(`Status ${response.status}`);
                return response;
            },
            () => false,
            Date.now() + 8000
        ));
        const data = await res.json();

        if (!data.data || !data.data.products) return [];

        return data.data.products.reduce((products: UnifiedProduct[], item: TwentyNineCMItem) => {
            const image = sanitizeExternalUrl(
                proxyImage(`https://img.29cm.co.kr${item.imageUrl}`.replace('https://img.29cm.co.krhttps', 'https'))
            );
            const link = sanitizeExternalUrl(`https://product.29cm.co.kr/catalog/${item.itemNo}`);
            const price = item.salePrice || item.consumerPrice;

            if (!image || !link || !Number.isFinite(price)) {
                return products;
            }

            products.push({
                id: `29cm_${item.itemNo}`,
                title: normalizeTitle(item.itemName),
                price,
                image,
                link,
                mallName: '29CM',
                brand: normalizeBrand(item.brandName),
                source: '29CM' as const,
                ...parseTwentyNineCmCommerceData(item as unknown as Record<string, unknown>, price),
            });
            return products;
        }, []);
    } catch (e) {
        console.warn('[RealtimeSearch] 29CM API gave up:', e);
        return [];
    }
}

function hasNaverCredentials(): boolean {
    return Boolean(process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET);
}

/**
 * Main Aggregator Function
 */
export async function aggregateRealtimeSearchDetailed(
    query: string,
    page: number = 1,
    sort: SearchSort = 'sim',
    sourceQueryPlan?: SearchQueryCandidatePlan
): Promise<CoreAggregateRealtimeSearchResult> {
    const naverQueries = sourceQueryPlan?.NAVER || [query];

    const registry = buildDirectRegistry({
        musinsa: scrapeMusinsa,
        twentyNineCm: scrape29CM,
        wConcept: scrapeWConcept,
        zigzag: scrapeZigzag,
        ably: scrapeAbly,
        ssf: scrapeSSF,
        coupang: scrapeCoupang,
        handsome: scrapeHandsome,
        farfetch: scrapeFarfetch,
        ssense: scrapeSSense,
        hago: scrapeHago,
        eql: scrapeEql,
        lfMall: scrapeLfMall,
        siVillage: scrapeSiVillage,
    });

    const [naverRun, ...directRuns]: [TimedSearchResult, ...TimedSearchResult[]] = await Promise.all([
        withTimedSearchBudget(
            'NAVER',
            naverQueries,
            runNaverSearchLike(naverQueries, page, sort, fetchNaverRealtime, hasNaverCredentials),
            NAVER_SEARCH_BUDGET_MS,
            'naver_timeout'
        ),
        ...registry.map((entry) => {
            const queries = sourceQueryPlan?.[entry.source] || [query];
            return withTimedSearchBudget(
                entry.source,
                queries,
                runTimedSearchWithCandidates(entry.source, queries, (candidate) => entry.scrape(candidate, page), entry.emptyReason),
                entry.budgetMs,
                entry.timeoutReason
            );
        }),
    ]) as [TimedSearchResult, ...TimedSearchResult[]];

    const aggregated = mergeWithPreferredDirectProducts(
        naverRun.products,
        directRuns.flatMap((run) => run.products)
    );

    const sorted = [...aggregated];
    if (sort === 'asc') {
        sorted.sort((a, b) => a.price - b.price);
    } else if (sort === 'dsc') {
        sorted.sort((a, b) => b.price - a.price);
    }

    const diagnostics = buildAggregationDiagnostics(
        query,
        page,
        sort,
        sorted,
        naverRun,
        directRuns,
        DIRECT_SOURCE_ORDER
    );

    return {
        products: sorted,
        diagnostics,
    };
}

export async function aggregateRealtimeSearchNaverOnly(
    query: string,
    page: number = 1,
    sort: SearchSort = 'sim',
    queries: string[] = [query]
): Promise<CoreAggregateRealtimeSearchResult> {
    const naverRun = await withTimedSearchBudget(
        'NAVER',
        queries,
        runNaverSearchLike(queries, page, sort, fetchNaverRealtime, hasNaverCredentials),
        NAVER_SEARCH_BUDGET_MS,
        'naver_timeout'
    );
    const diagnostics = buildAggregationDiagnostics(query, page, sort, naverRun.products, naverRun, [], DIRECT_SOURCE_ORDER);

    return {
        products: naverRun.products,
        diagnostics,
    };
}

export async function aggregateRealtimeSearch(
    query: string,
    page: number = 1,
    sort: SearchSort = 'sim'
): Promise<UnifiedProduct[]> {
    const result = await aggregateRealtimeSearchDetailed(query, page, sort);
    return result.products;
}
