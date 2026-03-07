import { buildHistoryKey, persistTrackedProductDetails, readTrackedProductsBatch } from './priceHistoryStore.ts';
import {
    hasPdpDetailData,
    isPdpDetailEnrichmentSupported,
    parseProductDetailHtml,
    type PdpDetailSignals,
} from '../product/pdpDetailEnrichment.ts';
import type { UnifiedProduct } from '../api/types.ts';
import { persistPdpDiagnostics, recordPdpDiagnostics, type PdpEnrichmentDiagnosticEvent } from '../api/pdpDiagnostics.ts';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const MAX_ENRICH_PRODUCTS = 8;
const DETAIL_CACHE_TTL_MS = 1000 * 60 * 60 * 12;

function isDetailCacheFresh(product: Pick<UnifiedProduct, 'detailCollectedAt'>, nowMs: number = Date.now()): boolean {
    if (!product.detailCollectedAt) return false;
    const collectedAtMs = Date.parse(product.detailCollectedAt);
    if (!Number.isFinite(collectedAtMs)) return false;
    return nowMs - collectedAtMs <= DETAIL_CACHE_TTL_MS;
}

function mergeProductWithDetail(product: UnifiedProduct, detail: PdpDetailSignals): UnifiedProduct {
    const merged: UnifiedProduct = {
        ...product,
        ...detail,
    };

    if (
        typeof detail.shippingFee === 'number'
        || typeof detail.shippingFreeThreshold === 'number'
        || detail.shippingText
        || typeof detail.benefitPrice === 'number'
        || detail.benefitText
        || detail.stockStatus
        || detail.stockText
        || hasPdpDetailData(detail)
    ) {
        merged.detailCollectedAt = detail.detailCollectedAt || new Date().toISOString();
    }

    return merged;
}

function hasMaterialDetailSignals(detail: PdpDetailSignals): boolean {
    return Boolean(
        typeof detail.shippingFee === 'number'
        || typeof detail.shippingFreeThreshold === 'number'
        || detail.shippingText
        || typeof detail.benefitPrice === 'number'
        || detail.benefitText
        || detail.stockStatus
        || detail.stockText
        || hasPdpDetailData(detail)
    );
}

async function fetchProductDetailHtml(product: UnifiedProduct): Promise<string> {
    if (!isPdpDetailEnrichmentSupported(product)) {
        return '';
    }

    try {
        const response = await fetch(product.link, {
            headers: {
                'User-Agent': USER_AGENT,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
            },
            next: { revalidate: 300 },
            signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
            throw new Error(`Status ${response.status}`);
        }

        return await response.text();
    } catch (error) {
        console.error('[pdpDetailService] fetch failed:', product.source, product.link, error);
        return '';
    }
}

export async function enrichProductWithPdpDetails(product: UnifiedProduct): Promise<UnifiedProduct> {
    const html = await fetchProductDetailHtml(product);
    if (!html) {
        return product;
    }

    const detail = parseProductDetailHtml(html, product);
    if (!hasMaterialDetailSignals(detail)) {
        return product;
    }

    return mergeProductWithDetail(product, detail);
}

export async function enrichProductsWithPdpDetails(products: UnifiedProduct[]): Promise<UnifiedProduct[]> {
    if (products.length === 0) {
        return [];
    }

    const nowMs = Date.now();
    const cachedProducts = await readTrackedProductsBatch(products);
    const diagnostics: PdpEnrichmentDiagnosticEvent[] = [];
    const mergedWithCache = products.map((product) => {
        const cached = cachedProducts.get(buildHistoryKey(product));
        if (!cached || !hasPdpDetailData(cached) || !isDetailCacheFresh(cached, nowMs)) {
            if (!isPdpDetailEnrichmentSupported(product)) {
                diagnostics.push({
                    source: product.source,
                    strategy: 'unsupported',
                    generatedAt: new Date().toISOString(),
                    durationMs: 0,
                    cacheHit: false,
                    fetchAttempted: false,
                    fetchSucceeded: false,
                    parseSucceeded: false,
                    reason: 'unsupported_source_or_host',
                    productId: product.id,
                });
            }
            return product;
        }

        diagnostics.push({
            source: product.source,
            strategy: 'cache_hit',
            generatedAt: new Date().toISOString(),
            durationMs: 0,
            cacheHit: true,
            fetchAttempted: false,
            fetchSucceeded: true,
            parseSucceeded: true,
            reason: 'fresh_cached_detail',
            productId: product.id,
        });

        return mergeProductWithDetail(product, {
            shippingFee: cached.shippingFee,
            shippingFreeThreshold: cached.shippingFreeThreshold,
            shippingText: cached.shippingText,
            benefitPrice: cached.benefitPrice,
            benefitText: cached.benefitText,
            stockStatus: cached.stockStatus,
            stockText: cached.stockText,
            variantId: cached.variantId,
            variantSku: cached.variantSku,
            optionSummary: cached.optionSummary,
            optionValues: cached.optionValues,
            sizeOptions: cached.sizeOptions,
            colorOptions: cached.colorOptions,
            variantCandidates: cached.variantCandidates,
            detailCollectedAt: cached.detailCollectedAt,
        });
    });

    const head = mergedWithCache.slice(0, MAX_ENRICH_PRODUCTS);
    const fetchTargets = head.filter((product) =>
        isPdpDetailEnrichmentSupported(product)
        && (!hasPdpDetailData(product) || !isDetailCacheFresh(product, nowMs))
    );

    if (fetchTargets.length === 0) {
        if (diagnostics.length > 0) {
            recordPdpDiagnostics(diagnostics);
            try {
                await persistPdpDiagnostics(diagnostics);
            } catch (error) {
                console.warn('[pdpDetailService] diagnostics persist failed:', error);
            }
        }
        return mergedWithCache;
    }

    const fetched = await Promise.all(fetchTargets.map(async (product) => {
        const startedAt = Date.now();
        const wasStaleCache = Boolean(cachedProducts.get(buildHistoryKey(product)));
        const html = await fetchProductDetailHtml(product);

        if (!html) {
            diagnostics.push({
                source: product.source,
                strategy: 'fetch_failed',
                generatedAt: new Date().toISOString(),
                durationMs: Date.now() - startedAt,
                cacheHit: false,
                fetchAttempted: true,
                fetchSucceeded: false,
                parseSucceeded: false,
                reason: 'empty_html_or_request_failed',
                productId: product.id,
            });
            return product;
        }

        const detail = parseProductDetailHtml(html, product);
        if (!hasMaterialDetailSignals(detail)) {
            diagnostics.push({
                source: product.source,
                strategy: 'parse_empty',
                generatedAt: new Date().toISOString(),
                durationMs: Date.now() - startedAt,
                cacheHit: false,
                fetchAttempted: true,
                fetchSucceeded: true,
                parseSucceeded: false,
                reason: 'no_detail_signals',
                productId: product.id,
            });
            return product;
        }

        diagnostics.push({
            source: product.source,
            strategy: wasStaleCache ? 'stale_cache_refreshed' : 'fetched',
            generatedAt: new Date().toISOString(),
            durationMs: Date.now() - startedAt,
            cacheHit: false,
            fetchAttempted: true,
            fetchSucceeded: true,
            parseSucceeded: true,
            reason: wasStaleCache ? 'stale_cache_refreshed' : 'live_fetch_success',
            productId: product.id,
        });

        return mergeProductWithDetail(product, detail);
    }));
    const fetchedByKey = new Map(fetched.map((product) => [buildHistoryKey(product), product]));
    const persistedCandidates = fetched.filter((product) => hasPdpDetailData(product));

    if (persistedCandidates.length > 0) {
        try {
            await persistTrackedProductDetails(persistedCandidates);
        } catch (error) {
            console.warn('[pdpDetailService] persist failed:', error);
        }
    }

    if (diagnostics.length > 0) {
        recordPdpDiagnostics(diagnostics);
        try {
            await persistPdpDiagnostics(diagnostics);
        } catch (error) {
            console.warn('[pdpDetailService] diagnostics persist failed:', error);
        }
    }

    return mergedWithCache.map((product) => fetchedByKey.get(buildHistoryKey(product)) || product);
}
