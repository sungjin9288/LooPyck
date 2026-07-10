import * as cheerio from 'cheerio';
import { type ProductSource, type ProductStockStatus, type UnifiedProduct } from './types.ts';
import { normalizeBrand, normalizePrice, normalizeTitle } from '../core/dataNormalizer.ts';
import { sanitizeExternalUrl } from '../security/urlSafety.ts';
import { getSourceIdPrefix, getSourceMetadata } from './sourceCatalog.ts';
import { Logger } from '../core/observability.ts';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

type MarketplaceAdapterConfig = {
    source: ProductSource;
    searchUrl: (query: string, page: number) => string;
    absoluteOrigin: string;
    cardSelectors: readonly string[];
    titleSelectors: readonly string[];
    priceSelectors: readonly string[];
    brandSelectors?: readonly string[];
    linkSelectors?: readonly string[];
    imageSelectors?: readonly string[];
    shippingSelectors?: readonly string[];
    benefitSelectors?: readonly string[];
    stockSelectors?: readonly string[];
    linkPattern: RegExp;
    maxItems?: number;
    proxyImages?: boolean;
};

type ParsedCommerceData = {
    shippingFee?: number;
    shippingFreeThreshold?: number;
    shippingText?: string;
    benefitPrice?: number;
    benefitText?: string;
    stockStatus?: ProductStockStatus;
    stockText?: string;
};

const DEFAULT_SHIPPING_SELECTORS = [
    '[class*="shipping"]',
    '[class*="delivery"]',
    '[data-testid*="shipping"]',
    '[data-testid*="delivery"]',
] as const;

const DEFAULT_BENEFIT_SELECTORS = [
    '[class*="benefit"]',
    '[class*="member-price"]',
    '[class*="member_price"]',
    '[class*="coupon"]',
    '[class*="discount"]',
    '[data-testid*="benefit"]',
    '[data-testid*="member"]',
] as const;

const DEFAULT_STOCK_SELECTORS = [
    '[class*="sold"]',
    '[class*="stock"]',
    '[class*="status"]',
    '[data-testid*="sold"]',
    '[data-testid*="stock"]',
] as const;

function proxyImage(url: string): string {
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=500&output=webp`;
}

async function fetchSearchHtml(url: string): Promise<string> {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            next: { revalidate: 60 },
            signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        Logger.error('[marketplaceScrapers] fetch failed', error, { url });
        return '';
    }
}

function resolveAbsoluteUrl(origin: string, rawUrl: string): string | null {
    const trimmed = rawUrl.trim();
    if (!trimmed) return null;

    try {
        const resolved = new URL(trimmed, origin);
        return sanitizeExternalUrl(resolved.toString());
    } catch {
        return null;
    }
}

function resolveImageUrl(origin: string, rawUrl: string, proxyImages: boolean): string | null {
    const absoluteUrl = resolveAbsoluteUrl(origin, rawUrl);
    if (!absoluteUrl) return null;
    return sanitizeExternalUrl(proxyImages ? proxyImage(absoluteUrl) : absoluteUrl);
}

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function selectElements($root: cheerio.Cheerio<any>, selector: string): cheerio.Cheerio<any> {
    if ($root.is(selector)) {
        return $root;
    }
    return $root.find(selector);
}

function firstText($root: cheerio.Cheerio<any>, selectors: readonly string[] = []): string {
    for (const selector of selectors) {
        const match = selectElements($root, selector).first();
        if (match.length === 0) continue;

        const text = normalizeWhitespace(match.text());
        if (text) return text;

        const alt = normalizeWhitespace(match.attr('alt') || '');
        if (alt) return alt;

        const title = normalizeWhitespace(match.attr('title') || '');
        if (title) return title;

        const ariaLabel = normalizeWhitespace(match.attr('aria-label') || '');
        if (ariaLabel) return ariaLabel;
    }
    return '';
}

function firstSignalText($root: cheerio.Cheerio<any>, selectors: readonly string[] = []): string {
    for (const selector of selectors) {
        const match = selectElements($root, selector).first();
        if (match.length === 0) continue;

        const text = normalizeWhitespace(match.text());
        if (text) return text;

        const ariaLabel = normalizeWhitespace(match.attr('aria-label') || '');
        if (ariaLabel) return ariaLabel;

        const title = normalizeWhitespace(match.attr('title') || '');
        if (title) return title;

        const dataLabel = normalizeWhitespace(match.attr('data-label') || '');
        if (dataLabel) return dataLabel;

        const dataStatus = normalizeWhitespace(match.attr('data-status') || '');
        if (dataStatus) return dataStatus;

        const className = normalizeWhitespace(match.attr('class') || '');
        if (className) return className;
    }

    return '';
}

function firstAttr(
    $root: cheerio.Cheerio<any>,
    selectors: readonly string[] = [],
    attrs: readonly string[] = ['href']
): string {
    for (const selector of selectors) {
        const match = selectElements($root, selector).first();
        if (match.length === 0) continue;

        for (const attr of attrs) {
            const value = normalizeWhitespace(match.attr(attr) || '');
            if (value) return value;
        }
    }
    return '';
}

function extractIdFromLink(source: ProductSource, link: string, fallbackTitle: string, index: number): string {
    const prefix = getSourceIdPrefix(source);
    const parsedUrl = (() => {
        try {
            return new URL(link);
        } catch {
            return null;
        }
    })();
    const pathname = parsedUrl?.pathname || link;
    const queryToken = parsedUrl
        ? parsedUrl.searchParams.get('PROD_CD')
            || parsedUrl.searchParams.get('slitmCd')
            || parsedUrl.searchParams.get('goodsNo')
            || parsedUrl.searchParams.get('itemId')
        : '';

    const pathToken = pathname
        .split('/')
        .filter(Boolean)
        .pop()
        ?.replace(/[^a-zA-Z0-9_-]/g, '');

    const token = (pathToken && !['productdo', 'search', 'goods'].includes(pathToken.toLowerCase()) ? pathToken : '')
        || queryToken
        || normalizeTitle(fallbackTitle).replace(/\s+/g, '_').slice(0, 32)
        || `item_${index}`;

    return `${prefix}_${token}`;
}

function buildProduct(
    config: MarketplaceAdapterConfig,
    link: string,
    title: string,
    price: number,
    image: string,
    brand: string,
    commerceData: ParsedCommerceData,
    index: number
): UnifiedProduct | null {
    if (!config.linkPattern.test(link)) return null;
    if (!title || !Number.isFinite(price) || price <= 0 || !image) return null;

    return {
        id: extractIdFromLink(config.source, link, title, index),
        title: normalizeTitle(title),
        price,
        image,
        link,
        mallName: getSourceMetadata(config.source).label,
        brand: brand ? normalizeBrand(brand) : undefined,
        source: config.source,
        shippingFee: commerceData.shippingFee,
        shippingFreeThreshold: commerceData.shippingFreeThreshold,
        shippingText: commerceData.shippingText,
        benefitPrice: commerceData.benefitPrice,
        benefitText: commerceData.benefitText,
        stockStatus: commerceData.stockStatus,
        stockText: commerceData.stockText,
    };
}

function inferAvailabilityStatus(rawText: string): ProductStockStatus | undefined {
    const normalized = normalizeWhitespace(rawText).toLowerCase();
    if (!normalized) return undefined;

    if (
        normalized.includes('품절') ||
        normalized.includes('일시품절') ||
        normalized.includes('soldout') ||
        normalized.includes('sold out') ||
        normalized.includes('outofstock') ||
        normalized.includes('out of stock') ||
        normalized.includes('discontinued')
    ) {
        return 'sold_out';
    }

    if (
        normalized.includes('few left') ||
        normalized.includes('last one') ||
        normalized.includes('limited stock') ||
        normalized.includes('limitedavailability') ||
        normalized.includes('low stock') ||
        normalized.includes('재고소량') ||
        normalized.includes('마지막')
    ) {
        return 'low_stock';
    }

    if (
        normalized.includes('in stock') ||
        normalized.includes('instock') ||
        normalized.includes('판매중') ||
        normalized.includes('구매가능')
    ) {
        return 'in_stock';
    }

    return undefined;
}

function parseShippingText(rawText: string): ParsedCommerceData {
    const text = normalizeWhitespace(rawText);
    if (!text) return {};

    let shippingFee: number | undefined;
    let shippingFreeThreshold: number | undefined;

    const thresholdMatch = text.match(/([₩]?\s*[\d,]+)\s*원?\s*(?:이상|over)\s*(?:구매(?:시)?\s*)?(?:무료배송|무료|free)/i)
        || text.match(/(?:무료배송|free shipping)[^\d]{0,12}([₩]?\s*[\d,]+)\s*원?\s*(?:이상|over)/i);
    if (thresholdMatch?.[1]) {
        shippingFreeThreshold = normalizePrice(thresholdMatch[1]);
    }

    const feeMatch = text.match(/(?:배송비|delivery|shipping(?: fee)?)\s*[:\-]?\s*(무료|free|[₩]?\s*[\d,]+)\s*원?/i)
        || text.match(/([₩]?\s*[\d,]+)\s*원?\s*(?:배송비|delivery|shipping)/i);

    if (feeMatch?.[1]) {
        shippingFee = /무료|free/i.test(feeMatch[1]) ? 0 : normalizePrice(feeMatch[1]);
    } else if ((/무료배송|free shipping/i.test(text)) && typeof shippingFreeThreshold !== 'number') {
        shippingFee = 0;
    }

    return {
        shippingFee,
        shippingFreeThreshold,
        shippingText: text,
    };
}

function parseBenefitText(rawText: string, basePrice: number): ParsedCommerceData {
    const text = normalizeWhitespace(rawText);
    if (!text) return {};

    let benefitPrice: number | undefined;
    const directPriceMatch = text.match(/(?:회원가|혜택가|쿠폰가|최종가|즉시할인가?|할인가|sale price|member price|coupon price)[^\d]{0,8}([₩]?\s*[\d,]+)\s*원?/i)
        || text.match(/([₩]?\s*[\d,]+)\s*원?[^\d]{0,8}(?:회원가|혜택가|쿠폰가|최종가|즉시할인가?|할인가)/i);

    if (directPriceMatch?.[1]) {
        const parsed = normalizePrice(directPriceMatch[1]);
        if (parsed > 0 && parsed < basePrice) {
            benefitPrice = parsed;
        }
    } else if (text.includes('원')) {
        const parsed = normalizePrice(text);
        if (parsed >= 1_000 && parsed < basePrice) {
            benefitPrice = parsed;
        }
    }

    return {
        benefitPrice,
        benefitText: text,
    };
}

function parseStockSignal(rawText: string): ParsedCommerceData {
    const text = normalizeWhitespace(rawText);
    if (!text) return {};

    return {
        stockStatus: inferAvailabilityStatus(text) ?? 'unknown',
        stockText: text,
    };
}

function pickMonetaryValue(value: unknown): number {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return normalizePrice(value);
    if (value && typeof value === 'object') {
        const candidate = value as { value?: unknown; amount?: unknown; price?: unknown };
        return pickMonetaryValue(candidate.value ?? candidate.amount ?? candidate.price);
    }
    return 0;
}

function parseJsonLdShipping(value: unknown): ParsedCommerceData {
    if (!value) return {};

    if (Array.isArray(value)) {
        return value.reduce<ParsedCommerceData>((merged, entry) => ({ ...merged, ...parseJsonLdShipping(entry) }), {});
    }

    if (typeof value !== 'object') {
        return {};
    }

    const shipping = value as Record<string, unknown>;
    const shippingFee = pickMonetaryValue(shipping.shippingRate ?? shipping.rate ?? shipping.shippingPrice);
    const shippingThreshold = pickMonetaryValue(
        (shipping.eligibleTransactionVolume && typeof shipping.eligibleTransactionVolume === 'object'
            ? (shipping.eligibleTransactionVolume as Record<string, unknown>).price
            : undefined)
    );
    const shippingText = [shipping.name, shipping.description]
        .filter((entry): entry is string => typeof entry === 'string')
        .map(normalizeWhitespace)
        .filter(Boolean)
        .join(' · ');

    return {
        shippingFee: shippingFee > 0 || shippingFee === 0 ? shippingFee : undefined,
        shippingFreeThreshold: shippingThreshold > 0 ? shippingThreshold : undefined,
        shippingText: shippingText || undefined,
    };
}

function parseJsonLdBenefit(value: unknown, basePrice: number): ParsedCommerceData {
    if (!value) return {};

    const priceSpecifications = (() => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'object') {
            const record = value as Record<string, unknown>;
            const nested = record.priceSpecification ?? record.priceSpecifications;
            return Array.isArray(nested) ? nested : nested ? [nested] : [];
        }
        return [];
    })();

    const candidates = priceSpecifications
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const record = entry as Record<string, unknown>;
            const price = pickMonetaryValue(record.price ?? record.minPrice ?? record.value);
            if (!price || price >= basePrice) return null;

            const label = [record.priceType, record.name, record.description]
                .filter((value): value is string => typeof value === 'string')
                .map(normalizeWhitespace)
                .filter(Boolean)
                .join(' · ');

            return {
                benefitPrice: price,
                benefitText: label || '검색 결과 혜택가',
            };
        })
        .filter(Boolean) as Array<{ benefitPrice: number; benefitText: string }>;

    const best = candidates.sort((left, right) => left.benefitPrice - right.benefitPrice)[0];
    return best || {};
}

function parseJsonLdProducts(html: string, config: MarketplaceAdapterConfig): UnifiedProduct[] {
    const $ = cheerio.load(html);
    const products: UnifiedProduct[] = [];
    let index = 0;

    function pushCandidate(candidate: {
        title?: string;
        price?: number;
        image?: string;
        link?: string;
        brand?: string;
        commerceData?: ParsedCommerceData;
    }) {
        const link = candidate.link ? resolveAbsoluteUrl(config.absoluteOrigin, candidate.link) : null;
        const image = candidate.image ? resolveImageUrl(config.absoluteOrigin, candidate.image, config.proxyImages ?? true) : null;
        if (!link || !image) return;

        const product = buildProduct(
            config,
            link,
            normalizeWhitespace(candidate.title || ''),
            candidate.price || 0,
            image,
            normalizeWhitespace(candidate.brand || ''),
            candidate.commerceData || {},
            index++
        );

        if (product) {
            products.push(product);
        }
    }

    function pickImage(value: unknown): string {
        if (typeof value === 'string') return value;
        if (Array.isArray(value)) {
            const firstString = value.find((item) => typeof item === 'string');
            if (typeof firstString === 'string') return firstString;
            const firstObject = value.find((item) => item && typeof item === 'object' && typeof (item as { url?: unknown }).url === 'string') as { url?: string } | undefined;
            return firstObject?.url || '';
        }
        if (value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string') {
            return String((value as { url?: string }).url);
        }
        return '';
    }

    function pickPrice(value: unknown): number {
        if (typeof value === 'number') return value;
        if (typeof value === 'string') return normalizePrice(value);
        if (Array.isArray(value)) {
            for (const item of value) {
                const price = pickPrice(item);
                if (price > 0) return price;
            }
            return 0;
        }
        if (value && typeof value === 'object') {
            const candidate = value as { price?: unknown; lowPrice?: unknown; highPrice?: unknown };
            return pickPrice(candidate.price ?? candidate.lowPrice ?? candidate.highPrice);
        }
        return 0;
    }

    function visit(node: unknown) {
        if (!node) return;

        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }

        if (typeof node !== 'object') {
            return;
        }

        const value = node as Record<string, unknown>;
        const type = typeof value['@type'] === 'string' ? String(value['@type']) : '';

        if (type === 'ItemList' && Array.isArray(value.itemListElement)) {
            value.itemListElement.forEach((entry) => {
                if (entry && typeof entry === 'object' && 'item' in entry) {
                    visit((entry as { item?: unknown }).item);
                    return;
                }
                visit(entry);
            });
        }

        if (type === 'Product') {
            const brandValue = value.brand;
            const brand = typeof brandValue === 'string'
                ? brandValue
                : brandValue && typeof brandValue === 'object' && typeof (brandValue as { name?: unknown }).name === 'string'
                    ? String((brandValue as { name?: string }).name)
                    : '';

            pushCandidate({
                title: typeof value.name === 'string' ? String(value.name) : '',
                price: pickPrice(value.offers),
                image: pickImage(value.image),
                link: typeof value.url === 'string' ? String(value.url) : '',
                brand,
                commerceData: {
                    ...parseJsonLdShipping((value.offers && typeof value.offers === 'object') ? (value.offers as Record<string, unknown>).shippingDetails : undefined),
                    ...parseJsonLdBenefit(value.offers, pickPrice(value.offers)),
                    ...parseStockSignal(
                        typeof (value.offers && typeof value.offers === 'object' ? (value.offers as Record<string, unknown>).availability : undefined) === 'string'
                            ? String((value.offers as Record<string, unknown>).availability)
                            : ''
                    ),
                },
            });
        }

        Object.values(value).forEach(visit);
    }

    $('script[type="application/ld+json"]').each((_, element) => {
        const raw = $(element).contents().text().trim();
        if (!raw) return;

        try {
            visit(JSON.parse(raw));
        } catch {
            // ignore invalid blocks
        }
    });

    return dedupeProducts(products);
}

function parseCardProducts(html: string, config: MarketplaceAdapterConfig): UnifiedProduct[] {
    const $ = cheerio.load(html);
    const products: UnifiedProduct[] = [];
    const imageSelectors = config.imageSelectors ?? ['img'];
    const linkSelectors = config.linkSelectors ?? ['a'];
    const shippingSelectors = config.shippingSelectors ?? DEFAULT_SHIPPING_SELECTORS;
    const benefitSelectors = config.benefitSelectors ?? DEFAULT_BENEFIT_SELECTORS;
    const stockSelectors = config.stockSelectors ?? DEFAULT_STOCK_SELECTORS;
    let index = 0;

    for (const selector of config.cardSelectors) {
        $(selector).each((_, element) => {
            const $element = $(element);

            const rawLink = firstAttr($element, linkSelectors, ['href']) || firstAttr($element, ['a'], ['href']);
            const link = rawLink ? resolveAbsoluteUrl(config.absoluteOrigin, rawLink) : null;
            if (!link || !config.linkPattern.test(link)) return;

            const title = firstText($element, config.titleSelectors) || firstAttr($element, imageSelectors, ['alt', 'title']);
            const priceText = firstText($element, config.priceSelectors);
            const price = normalizePrice(priceText);
            const rawImage = firstAttr($element, imageSelectors, ['src', 'data-src', 'data-original', 'data-image']);
            const image = rawImage ? resolveImageUrl(config.absoluteOrigin, rawImage, config.proxyImages ?? true) : null;
            const brand = firstText($element, config.brandSelectors ?? []);
            const shippingText = firstSignalText($element, shippingSelectors);
            const benefitText = firstSignalText($element, benefitSelectors);
            const stockText = firstSignalText($element, stockSelectors);

            const product = image
                ? buildProduct(
                    config,
                    link,
                    title,
                    price,
                    image,
                    brand,
                    {
                        ...parseShippingText(shippingText),
                        ...parseBenefitText(benefitText, price),
                        ...parseStockSignal(stockText),
                    },
                    index++
                )
                : null;

            if (product) {
                products.push(product);
            }
        });
    }

    return dedupeProducts(products).slice(0, config.maxItems ?? 12);
}

export function dedupeProducts(products: UnifiedProduct[]): UnifiedProduct[] {
    const seen = new Set<string>();
    const deduped: UnifiedProduct[] = [];

    for (const product of products) {
        const key = `${product.source}:${product.link}:${product.price}`;
        if (seen.has(key)) continue;
        seen.add(key);
        deduped.push(product);
    }

    return deduped;
}

export function parseMarketplaceSearchResults(html: string, config: MarketplaceAdapterConfig): UnifiedProduct[] {
    const jsonLdProducts = parseJsonLdProducts(html, config);
    const cardProducts = parseCardProducts(html, config);
    return dedupeProducts([...jsonLdProducts, ...cardProducts]).slice(0, config.maxItems ?? 12);
}

async function scrapeMarketplace(query: string, page: number, config: MarketplaceAdapterConfig): Promise<UnifiedProduct[]> {
    const html = await fetchSearchHtml(config.searchUrl(query, page));
    if (!html) return [];
    return parseMarketplaceSearchResults(html, config);
}

export const WCONCEPT_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'W_CONCEPT',
    searchUrl: (query, page) => `https://www.wconcept.co.kr/Search?keyword=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://www.wconcept.co.kr',
    cardSelectors: ['a[href*="/Product/"]', 'li:has(a[href*="/Product/"])', '[data-itemcd]'],
    titleSelectors: ['[class*="prd_name"]', '[class*="product-name"]', '[class*="name"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"] strong', '[class*="price"]', '.price'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/Product/"]', 'a[href*="/product/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/Product\/|\/product\//i,
    maxItems: 10,
    proxyImages: true,
};

export const ZIGZAG_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'ZIGZAG',
    searchUrl: (query, page) => `https://zigzag.kr/catalog/products?keyword=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://zigzag.kr',
    cardSelectors: ['a[href*="/catalog/products/"]', 'li:has(a[href*="/catalog/products/"])', '[data-testid*="product"]'],
    titleSelectors: ['[class*="name"]', '[class*="title"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"]', '[data-testid*="price"]'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/catalog/products/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/catalog\/products\//i,
    maxItems: 10,
    proxyImages: true,
};

export const ABLY_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'ABLY',
    searchUrl: (query, page) => `https://m.a-bly.com/search?keyword=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://a-bly.com',
    cardSelectors: ['a[href*="/goods/"]', 'li:has(a[href*="/goods/"])', '[class*="product"]'],
    titleSelectors: ['[class*="ProductName"]', '[class*="name"]', '[class*="title"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"]', '[data-testid*="price"]'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/goods/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/goods\//i,
    maxItems: 10,
    proxyImages: true,
};

export const SSF_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'SSF',
    searchUrl: (query, page) => `https://www.ssfshop.com/public/search/searchView?keyword=${encodeURIComponent(query)}&currentPage=${page}`,
    absoluteOrigin: 'https://www.ssfshop.com',
    cardSelectors: ['a[href*="/goods/"]', 'li:has(a[href*="/goods/"])', '[class*="prd"]'],
    titleSelectors: ['[class*="prd_name"]', '[class*="name"]', '[class*="title"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"]', '.price'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/goods/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/goods\//i,
    maxItems: 10,
    proxyImages: true,
};

export const COUPANG_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'COUPANG',
    searchUrl: (query, page) => `https://www.coupang.com/np/search?q=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://www.coupang.com',
    cardSelectors: ['a[href*="/vp/products/"]', 'li:has(a[href*="/vp/products/"])', '[data-product-id]'],
    titleSelectors: ['[class*="name"]', '[class*="title"]', '[class*="product-name"]', 'img'],
    priceSelectors: ['[class*="price-value"]', '[class*="sale"]', '[class*="price"]'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/vp/products/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/vp\/products\//i,
    maxItems: 10,
    proxyImages: true,
};

export const HANDSOME_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'HANDSOME',
    searchUrl: (query, page) => `https://www.thehandsome.com/ko/DP/searchList?searchTerm=${encodeURIComponent(query)}&pageNo=${page}`,
    absoluteOrigin: 'https://www.thehandsome.com',
    cardSelectors: ['a[href*="productDetail"]', 'li:has(a[href*="productDetail"])', '[data-product-code]'],
    titleSelectors: ['[class*="product_name"]', '[class*="prod_name"]', '[class*="name"]', 'img'],
    priceSelectors: ['[class*="sell"]', '[class*="price"]', '.price'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="productDetail"]'],
    imageSelectors: ['img'],
    linkPattern: /productDetail/i,
    maxItems: 10,
    proxyImages: true,
};

export const FARFETCH_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'FARFETCH',
    searchUrl: (query, page) => `https://www.farfetch.com/kr/shopping/women/search/items.aspx?q=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://www.farfetch.com',
    cardSelectors: ['a[href*="/shopping/"]', 'article:has(a[href*="/shopping/"])', '[data-testid*="productCard"]'],
    titleSelectors: ['[data-testid*="productCardDescription"]', '[data-testid*="productName"]', '[itemprop="name"]', 'img'],
    priceSelectors: ['[data-testid*="price"]', '[data-testid*="productCardPrice"]', '[class*="price"]'],
    brandSelectors: ['[data-testid*="productCardDesignerName"]', '[class*="brand"]'],
    linkSelectors: ['a[href*="/shopping/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/shopping\/.*item-\d+/i,
    maxItems: 10,
    proxyImages: true,
};

export const SSENSE_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'SSENSE',
    searchUrl: (query, page) => `https://www.ssense.com/ko-kr/women/search?q=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://www.ssense.com',
    cardSelectors: ['a[href*="/product/"]', 'article:has(a[href*="/product/"])', '[data-testid*="product"]'],
    titleSelectors: ['[data-testid*="productName"]', '[class*="product-name"]', '[class*="title"]', 'img'],
    priceSelectors: ['[data-testid*="price"]', '[class*="price"]'],
    brandSelectors: ['[data-testid*="brandName"]', '[class*="brand"]'],
    linkSelectors: ['a[href*="/product/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/product\//i,
    maxItems: 10,
    proxyImages: true,
};

export const HAGO_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'HAGO',
    searchUrl: (query, page) => `https://hago.kr/search?keyword=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://hago.kr',
    cardSelectors: ['a[href*="/product/"]', 'li:has(a[href*="/product/"])', '[class*="product"]'],
    titleSelectors: ['[class*="product-name"]', '[class*="title"]', '[class*="name"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"]', '.price'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/product/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/product\//i,
    maxItems: 10,
    proxyImages: true,
};

export const EQL_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'EQL',
    searchUrl: (query, page) => `https://www.eqlstore.com/display/search?keyword=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://www.eqlstore.com',
    cardSelectors: ['a[href*="/product/"]', 'li:has(a[href*="/product/"])', '[data-itemno]'],
    titleSelectors: ['[class*="product-name"]', '[class*="title"]', '[class*="name"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"]', '.price'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/product/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/product\//i,
    maxItems: 10,
    proxyImages: true,
};

export const LFMALL_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'LFMALL',
    searchUrl: (query, page) => `https://www.lfmall.co.kr/app/search/searchResult?searchText=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://www.lfmall.co.kr',
    cardSelectors: ['a[href*="/product.do"]', 'li:has(a[href*="/product.do"])', '[class*="product"]'],
    titleSelectors: ['[class*="product-name"]', '[class*="title"]', '[class*="name"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"]', '.price'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/product.do"]'],
    imageSelectors: ['img'],
    linkPattern: /\/product\.do/i,
    maxItems: 10,
    proxyImages: true,
};

export const SIVILLAGE_SCRAPER_CONFIG: MarketplaceAdapterConfig = {
    source: 'SIVILLAGE',
    searchUrl: (query, page) => `https://www.sivillage.com/search?keyword=${encodeURIComponent(query)}&page=${page}`,
    absoluteOrigin: 'https://www.sivillage.com',
    cardSelectors: ['a[href*="/goods/"]', 'li:has(a[href*="/goods/"])', '[class*="product"]'],
    titleSelectors: ['[class*="product-name"]', '[class*="title"]', '[class*="name"]', 'img'],
    priceSelectors: ['[class*="sale"]', '[class*="price"]', '.price'],
    brandSelectors: ['[class*="brand"]'],
    linkSelectors: ['a[href*="/goods/"]'],
    imageSelectors: ['img'],
    linkPattern: /\/goods\//i,
    maxItems: 10,
    proxyImages: true,
};

export async function scrapeWConcept(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, WCONCEPT_SCRAPER_CONFIG);
}

export async function scrapeZigzag(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, ZIGZAG_SCRAPER_CONFIG);
}

export async function scrapeAbly(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, ABLY_SCRAPER_CONFIG);
}

export async function scrapeSSF(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, SSF_SCRAPER_CONFIG);
}

export async function scrapeCoupang(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, COUPANG_SCRAPER_CONFIG);
}

export async function scrapeHandsome(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, HANDSOME_SCRAPER_CONFIG);
}

export async function scrapeFarfetch(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, FARFETCH_SCRAPER_CONFIG);
}

export async function scrapeSSense(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, SSENSE_SCRAPER_CONFIG);
}

export async function scrapeHago(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, HAGO_SCRAPER_CONFIG);
}

export async function scrapeEql(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, EQL_SCRAPER_CONFIG);
}

export async function scrapeLfMall(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, LFMALL_SCRAPER_CONFIG);
}

export async function scrapeSiVillage(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    return scrapeMarketplace(query, page, SIVILLAGE_SCRAPER_CONFIG);
}
