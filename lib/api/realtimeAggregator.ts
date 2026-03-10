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
    getSourceIdPrefix,
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

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// Re-export type for API usage
export type { UnifiedProduct };

const DIRECT_SEARCH_SOURCES = [
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'ABLY',
    'SSF',
    'COUPANG',
    'HANDSOME',
    'FARFETCH',
    'SSENSE',
    'HAGO',
    'EQL',
    'LFMALL',
    'SIVILLAGE',
] as const;

type TimedSearchResult = {
    source: UnifiedProduct['source'];
    products: UnifiedProduct[];
    durationMs: number;
    fallbackReason?: string;
    requestedQueries?: string[];
    resolvedQuery?: string;
};

export type SearchSourceStrategy =
    | 'api'
    | 'direct'
    | 'direct_preferred_over_naver'
    | 'naver_classified_fallback'
    | 'classified_naver'
    | 'empty';

export interface SearchSourceDiagnostic {
    source: UnifiedProduct['source'];
    attempted: boolean;
    success: boolean;
    durationMs: number;
    directCount: number;
    naverCount: number;
    finalCount: number;
    strategy: SearchSourceStrategy;
    fallbackReason?: string;
    requestedQueries?: string[];
    resolvedQuery?: string;
}

export interface SearchAggregationDiagnostics {
    query: string;
    page: number;
    sort: SearchSort;
    generatedAt: string;
    effectiveQuery?: string;
    queryIntent?: 'fashion' | 'mixed' | 'unknown' | 'non_fashion';
    resultQuality?: 'strong' | 'mixed' | 'weak';
    exactMatchCount?: number;
    strongMatchCount?: number;
    suggestedQueries?: string[];
    totalProducts: number;
    directSourceCount: number;
    fallbackSourceCount: number;
    sources: SearchSourceDiagnostic[];
}

export interface AggregateRealtimeSearchResult {
    products: UnifiedProduct[];
    diagnostics: SearchAggregationDiagnostics;
}

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

function buildSourceAwareId(source: UnifiedProduct['source'], productId: string, title: string, index: number): string {
    const trimmedProductId = productId.trim();
    const fallbackId = normalizeTitle(title).replace(/\s+/g, '_').slice(0, 40) || `item_${index}`;
    return `${getSourceIdPrefix(source)}_${trimmedProductId || fallbackId}`;
}

function normalizeDedupLink(link: string): string {
    try {
        const parsed = new URL(link);
        const pathname = parsed.pathname.replace(/\/+$/, '') || '/';
        return `${parsed.hostname.toLowerCase()}${pathname}`;
    } catch {
        return link.trim().toLowerCase();
    }
}

function buildDedupKeys(product: UnifiedProduct): string[] {
    const keys: string[] = [];
    const linkKey = normalizeDedupLink(product.link);
    if (linkKey) {
        keys.push(`link:${product.source}:${linkKey}`);
    }

    const titleKey = normalizeTitle(product.title).toLowerCase().replace(/\s+/g, ' ').trim();
    if (titleKey) {
        keys.push(`title:${product.source}:${titleKey}:${product.price}`);
    }

    return keys;
}

function dedupeProducts(products: UnifiedProduct[]): UnifiedProduct[] {
    const seen = new Set<string>();
    const deduped: UnifiedProduct[] = [];

    for (const product of products) {
        const keys = buildDedupKeys(product);
        if (keys.some((key) => seen.has(key))) {
            continue;
        }

        keys.forEach((key) => seen.add(key));
        deduped.push(product);
    }

    return deduped;
}

function mergeWithPreferredDirectProducts(primary: UnifiedProduct[], preferredDirectProducts: UnifiedProduct[]): UnifiedProduct[] {
    const preferredEntries = preferredDirectProducts.map((product) => ({
        keys: buildDedupKeys(product),
        product,
    }));

    const mergedPrimary = primary.map((product) => {
        const productKeys = buildDedupKeys(product);
        const preferred = preferredEntries.find(({ keys }) => productKeys.some((key) => keys.includes(key)));
        return preferred?.product ?? product;
    });

    return dedupeProducts([...mergedPrimary, ...preferredDirectProducts]);
}

function countProductsBySource(products: UnifiedProduct[]): Map<UnifiedProduct['source'], number> {
    const counts = new Map<UnifiedProduct['source'], number>();

    products.forEach((product) => {
        counts.set(product.source, (counts.get(product.source) || 0) + 1);
    });

    return counts;
}

async function runTimedSearch(
    source: UnifiedProduct['source'],
    executor: () => Promise<UnifiedProduct[]>,
    emptyReason: string
): Promise<TimedSearchResult> {
    const startedAt = Date.now();

    try {
        const products = await executor();
        return {
            source,
            products,
            durationMs: Date.now() - startedAt,
            fallbackReason: products.length > 0 ? undefined : emptyReason,
        };
    } catch (error) {
        console.error(`[RealtimeSearch] ${source} adapter failed:`, error);
        return {
            source,
            products: [],
            durationMs: Date.now() - startedAt,
            fallbackReason: 'adapter_exception',
        };
    }
}

function uniqueQueryCandidates(values: string[]): string[] {
    return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

async function runTimedSearchWithCandidates(
    source: UnifiedProduct['source'],
    queries: string[],
    executor: (query: string) => Promise<UnifiedProduct[]>,
    emptyReason: string
): Promise<TimedSearchResult> {
    const startedAt = Date.now();
    const requestedQueries = uniqueQueryCandidates(queries);
    let lastReason = emptyReason;

    for (const candidate of requestedQueries) {
        try {
            const products = await executor(candidate);
            if (products.length > 0) {
                return {
                    source,
                    products,
                    durationMs: Date.now() - startedAt,
                    requestedQueries,
                    resolvedQuery: candidate,
                };
            }
        } catch (error) {
            console.error(`[RealtimeSearch] ${source} adapter failed for candidate "${candidate}":`, error);
            lastReason = 'adapter_exception';
        }
    }

    return {
        source,
        products: [],
        durationMs: Date.now() - startedAt,
        fallbackReason: lastReason,
        requestedQueries,
        resolvedQuery: requestedQueries[0],
    };
}

async function runNaverSearch(
    queries: string[],
    page: number,
    sort: SearchSort
): Promise<TimedSearchResult> {
    const startedAt = Date.now();
    const requestedQueries = uniqueQueryCandidates(queries);
    const query = requestedQueries[0] || '';

    if (!process.env.NAVER_CLIENT_ID || !process.env.NAVER_CLIENT_SECRET) {
        return {
            source: 'NAVER',
            products: [],
            durationMs: Date.now() - startedAt,
            fallbackReason: 'naver_credentials_missing',
            requestedQueries,
            resolvedQuery: query,
        };
    }

    let lastReason = 'no_results_or_api_error';

    for (const candidate of requestedQueries) {
        try {
            const products = await fetchNaverRealtime(candidate, page, sort);
            if (products.length > 0) {
                return {
                    source: 'NAVER',
                    products,
                    durationMs: Date.now() - startedAt,
                    requestedQueries,
                    resolvedQuery: candidate,
                };
            }
        } catch (error) {
            console.error(`[RealtimeSearch] NAVER adapter failed for candidate "${candidate}":`, error);
            lastReason = 'naver_exception';
        }
    }

    return {
        source: 'NAVER',
        products: [],
        durationMs: Date.now() - startedAt,
        fallbackReason: lastReason,
        requestedQueries,
        resolvedQuery: query,
    };
}

function buildAggregationDiagnostics(
    query: string,
    page: number,
    sort: SearchSort,
    aggregated: UnifiedProduct[],
    naverRun: TimedSearchResult,
    directRuns: TimedSearchResult[]
): SearchAggregationDiagnostics {
    const naverCounts = countProductsBySource(naverRun.products);
    const finalCounts = countProductsBySource(aggregated);

    const sourceDiagnostics: SearchSourceDiagnostic[] = [];

    sourceDiagnostics.push({
        source: 'NAVER',
        attempted: true,
        success: naverRun.products.length > 0,
        durationMs: naverRun.durationMs,
        directCount: naverRun.products.length,
        naverCount: naverRun.products.length,
        finalCount: finalCounts.get('NAVER') || 0,
        strategy: naverRun.products.length > 0 ? 'api' : 'empty',
        fallbackReason: naverRun.fallbackReason,
        requestedQueries: naverRun.requestedQueries,
        resolvedQuery: naverRun.resolvedQuery,
    });

    directRuns.forEach((run) => {
        const directCount = run.products.length;
        const naverCount = naverCounts.get(run.source) || 0;
        const finalCount = finalCounts.get(run.source) || 0;

        let strategy: SearchSourceStrategy = 'empty';
        let fallbackReason = run.fallbackReason;

        if (directCount > 0 && naverCount > 0) {
            strategy = 'direct_preferred_over_naver';
            fallbackReason = undefined;
        } else if (directCount > 0) {
            strategy = 'direct';
            fallbackReason = undefined;
        } else if (naverCount > 0) {
            strategy = 'naver_classified_fallback';
            fallbackReason = 'direct_empty_used_naver_classification';
        }

        sourceDiagnostics.push({
            source: run.source,
            attempted: true,
            success: finalCount > 0,
            durationMs: run.durationMs,
            directCount,
            naverCount,
            finalCount,
            strategy,
            fallbackReason,
            requestedQueries: run.requestedQueries,
            resolvedQuery: run.resolvedQuery,
        });
    });

    const directSourceSet = new Set<UnifiedProduct['source']>(DIRECT_SEARCH_SOURCES);
    Array.from(naverCounts.entries())
        .filter(([source, count]) => source !== 'NAVER' && !directSourceSet.has(source) && count > 0)
        .sort(([left], [right]) => left.localeCompare(right))
        .forEach(([source, naverCount]) => {
            sourceDiagnostics.push({
                source,
                attempted: false,
                success: true,
                durationMs: naverRun.durationMs,
                directCount: 0,
                naverCount,
                finalCount: finalCounts.get(source) || naverCount,
                strategy: 'classified_naver',
                fallbackReason: 'naver_classified_only',
                requestedQueries: naverRun.requestedQueries,
                resolvedQuery: naverRun.resolvedQuery,
            });
        });

    return {
        query,
        page,
        sort,
        generatedAt: new Date().toISOString(),
        totalProducts: aggregated.length,
        directSourceCount: sourceDiagnostics.filter((entry) => entry.strategy === 'direct' || entry.strategy === 'direct_preferred_over_naver').length,
        fallbackSourceCount: sourceDiagnostics.filter((entry) => entry.strategy === 'naver_classified_fallback' || entry.strategy === 'classified_naver').length,
        sources: sourceDiagnostics,
    };
}

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
        const res = await fetch(url, {
            signal: AbortSignal.timeout(8000),
        });
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
        console.error('29CM API Error:', e);
        return [];
    }
}

/**
 * Main Aggregator Function
 */
export async function aggregateRealtimeSearchDetailed(
    query: string,
    page: number = 1,
    sort: SearchSort = 'sim',
    sourceQueryPlan?: SearchQueryCandidatePlan
): Promise<AggregateRealtimeSearchResult> {
    const naverQueries = sourceQueryPlan?.NAVER || [query];
    const musinsaQueries = sourceQueryPlan?.MUSINSA || [query];
    const twentyNineQueries = sourceQueryPlan?.['29CM'] || [query];
    const wConceptQueries = sourceQueryPlan?.W_CONCEPT || [query];
    const zigzagQueries = sourceQueryPlan?.ZIGZAG || [query];
    const ablyQueries = sourceQueryPlan?.ABLY || [query];
    const ssfQueries = sourceQueryPlan?.SSF || [query];
    const coupangQueries = sourceQueryPlan?.COUPANG || [query];
    const handsomeQueries = sourceQueryPlan?.HANDSOME || [query];
    const farfetchQueries = sourceQueryPlan?.FARFETCH || [query];
    const ssenseQueries = sourceQueryPlan?.SSENSE || [query];
    const hagoQueries = sourceQueryPlan?.HAGO || [query];
    const eqlQueries = sourceQueryPlan?.EQL || [query];
    const lfMallQueries = sourceQueryPlan?.LFMALL || [query];
    const siVillageQueries = sourceQueryPlan?.SIVILLAGE || [query];

    const [
        naverRun,
        musinsaRun,
        twentyNineRun,
        wConceptRun,
        zigzagRun,
        ablyRun,
        ssfRun,
        coupangRun,
        handsomeRun,
        farfetchRun,
        ssenseRun,
        hagoRun,
        eqlRun,
        lfMallRun,
        siVillageRun,
    ] = await Promise.all([
        runNaverSearch(naverQueries, page, sort),
        runTimedSearchWithCandidates('MUSINSA', musinsaQueries, (candidate) => scrapeMusinsa(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('29CM', twentyNineQueries, (candidate) => scrape29CM(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('W_CONCEPT', wConceptQueries, (candidate) => scrapeWConcept(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('ZIGZAG', zigzagQueries, (candidate) => scrapeZigzag(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('ABLY', ablyQueries, (candidate) => scrapeAbly(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('SSF', ssfQueries, (candidate) => scrapeSSF(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('COUPANG', coupangQueries, (candidate) => scrapeCoupang(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('HANDSOME', handsomeQueries, (candidate) => scrapeHandsome(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('FARFETCH', farfetchQueries, (candidate) => scrapeFarfetch(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('SSENSE', ssenseQueries, (candidate) => scrapeSSense(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('HAGO', hagoQueries, (candidate) => scrapeHago(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('EQL', eqlQueries, (candidate) => scrapeEql(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('LFMALL', lfMallQueries, (candidate) => scrapeLfMall(candidate, page), 'no_direct_results'),
        runTimedSearchWithCandidates('SIVILLAGE', siVillageQueries, (candidate) => scrapeSiVillage(candidate, page), 'no_direct_results'),
    ]);

    const naverProducts = naverRun.products;
    const musinsaProducts = musinsaRun.products;
    const twentyNineProducts = twentyNineRun.products;
    const wConceptProducts = wConceptRun.products;
    const zigzagProducts = zigzagRun.products;
    const ablyProducts = ablyRun.products;
    const ssfProducts = ssfRun.products;
    const coupangProducts = coupangRun.products;
    const handsomeProducts = handsomeRun.products;
    const farfetchProducts = farfetchRun.products;
    const ssenseProducts = ssenseRun.products;
    const hagoProducts = hagoRun.products;
    const eqlProducts = eqlRun.products;
    const lfMallProducts = lfMallRun.products;
    const siVillageProducts = siVillageRun.products;
    const aggregated = mergeWithPreferredDirectProducts(
        naverProducts,
        [
            ...musinsaProducts,
            ...twentyNineProducts,
            ...wConceptProducts,
            ...zigzagProducts,
            ...ablyProducts,
            ...ssfProducts,
            ...coupangProducts,
            ...handsomeProducts,
            ...farfetchProducts,
            ...ssenseProducts,
            ...hagoProducts,
            ...eqlProducts,
            ...lfMallProducts,
            ...siVillageProducts,
        ]
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
        [
            musinsaRun,
            twentyNineRun,
            wConceptRun,
            zigzagRun,
            ablyRun,
            ssfRun,
            coupangRun,
            handsomeRun,
            farfetchRun,
            ssenseRun,
            hagoRun,
            eqlRun,
            lfMallRun,
            siVillageRun,
        ]
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
): Promise<AggregateRealtimeSearchResult> {
    const naverRun = await runNaverSearch(queries, page, sort);
    const diagnostics = buildAggregationDiagnostics(query, page, sort, naverRun.products, naverRun, []);

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
