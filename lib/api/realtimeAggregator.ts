import { UnifiedProduct } from './types';
import { normalizeBrand, normalizeTitle } from '@/lib/core/dataNormalizer';
import { SearchSort } from '@/types/searchSort';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';
import type { SearchQueryCandidatePlan } from '@/lib/search/fashionQueryAssistant';
import {
    parseMusinsaCommerceData,
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
import { getHostLimiter } from '@/lib/api/hostConcurrency';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Re-export type for API usage
export type { UnifiedProduct };

// Re-export diagnostics types so downstream consumers (searchDiagnostics.ts,
// searchLearningEntryCodec.ts, searchLearningSeeding.ts, queryLearningTypes.ts) need zero changes.
export type { SearchSourceStrategy, SearchSourceDiagnostic, SearchAggregationDiagnostics, AggregateRealtimeSearchResult } from '@/lib/api/aggregationCore';

const NAVER_SEARCH_BUDGET_MS = 3_500;
// Retry deadline must sit INSIDE the per-source withTimedSearchBudget race (3.5s):
// a retry that cannot finish before the race loses is wasted work and starves the
// candidate-query iteration in runTimedSearchWithCandidates.
const RETRY_DEADLINE_MS = 3_200;
const NAVER_API_HOST = 'openapi.naver.com';
const TWENTY_NINE_CM_API_HOST = 'search-api.29cm.co.kr';
const MUSINSA_API_HOST = 'api.musinsa.com';

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
            Date.now() + RETRY_DEADLINE_MS
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

// Musinsa goods search API item shape (api.musinsa.com/api2/dp/v1/plp/goods)
interface MusinsaApiItem {
    goodsNo: number;
    goodsName: string;
    goodsLinkUrl?: string;
    thumbnail?: string;
    brandName?: string;
    brand?: string;
    price?: number;
    finalPrice?: number;
    couponPrice?: number | null;
    isSoldOut?: boolean;
    isAd?: boolean;
    plusDeliveryGuideText?: string;
    isPlusDelivery?: boolean;
}

// 2. Musinsa Real-time Search (official frontend JSON API — the legacy HTML
// listing markup this scraper used to parse no longer exists on the SPA site)
async function scrapeMusinsa(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    try {
        const url = `https://api.musinsa.com/api2/dp/v1/plp/goods?keyword=${encodeURIComponent(query)}&sortCode=POPULAR&page=${page}&size=10&caller=SEARCH`;
        const res = await getHostLimiter(MUSINSA_API_HOST).run(() => withScrapeRetry(
            async () => {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': USER_AGENT,
                        'Accept': 'application/json',
                    },
                    next: { revalidate: 60 },
                    signal: AbortSignal.timeout(8000),
                });
                if (!response.ok) throw new Error(`Status ${response.status}`);
                return response;
            },
            () => false,
            Date.now() + RETRY_DEADLINE_MS
        ));
        const data = await res.json();
        const list: MusinsaApiItem[] = data?.data?.list;
        if (!Array.isArray(list)) return [];

        return list.reduce((products: UnifiedProduct[], item: MusinsaApiItem) => {
            // 광고 슬롯은 가격 비교 노이즈라 제외
            if (item.isAd) return products;

            const price = item.price ?? item.finalPrice;
            let thumb = typeof item.thumbnail === 'string' ? item.thumbnail : '';
            if (thumb.startsWith('//')) thumb = `https:${thumb}`;
            const image = thumb ? sanitizeExternalUrl(proxyImage(thumb)) : null;
            const link = sanitizeExternalUrl(
                item.goodsLinkUrl || `https://www.musinsa.com/products/${item.goodsNo}`
            );

            if (!item.goodsNo || !item.goodsName || !image || !link || !Number.isFinite(price) || (price as number) <= 0) {
                return products;
            }

            products.push({
                id: `musinsa_${item.goodsNo}`,
                title: normalizeTitle(item.goodsName),
                price: price as number,
                image,
                link,
                mallName: 'Musinsa',
                brand: normalizeBrand(item.brandName || item.brand || ''),
                source: 'MUSINSA' as const,
                ...parseMusinsaCommerceData(item as unknown as Record<string, unknown>, price as number),
            });
            return products;
        }, []);
    } catch (e) {
        console.warn('[RealtimeSearch] Musinsa API gave up:', e);
        return [];
    }
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
            Date.now() + RETRY_DEADLINE_MS
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
