import { DocumentData, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { aggregateRealtimeSearch } from '@/lib/api/realtimeAggregator';
import { buildCanonicalProductDetailHref } from '@/lib/api/productSnapshot';
import {
    detectMarketplaceSource,
    getSourceDisplayName,
    stripSourceIdPrefix,
} from '@/lib/api/sourceCatalog';
import { isProductSource, type ProductSource, type UnifiedProduct } from '@/lib/api/types';
import { normalizeTitle } from '@/lib/core/dataNormalizer';
import { comparePurchaseOffers, inferStockStatus } from '@/lib/product/purchasePricing';
import { isPlausibleCrossMallPrice } from '@/lib/search/priceOutlierFilter';
import { applyVariantSelectionToProducts, findSelectedVariantOption, listVariantSelectionOptions } from '@/lib/product/variantSelection';
import { deriveAlertPriority, isFavoriteAlertSnoozed } from '@/lib/favorites/alertState';
import { getAdminDb, getAdminMessaging } from '@/lib/server/firebaseAdmin';
import { markAlertDelivery, readComparableGroup, readTrackedProduct } from '@/lib/server/priceHistoryStore';
import { Logger, toErrorMessage } from '../core/observability.ts';

type FavoriteDoc = {
    favoriteId?: string;
    title?: string;
    lprice?: string;
    productId?: string;
    mallName?: string;
    source?: string;
    variantKey?: string;
    variantLabel?: string;
    variantId?: string;
    variantSku?: string;
    optionKey?: string;
    targetPrice?: number;
    alertSnoozedUntil?: number;
    link?: string;
    deepLink?: string;
    lastAlertedPrice?: number;
};

function parseCurrentPrice(raw: unknown): number {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
    if (typeof raw !== 'string') return 0;
    const parsed = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

type CheapestResult = { price: number; mallName: string; link: string } | null;
type ResolvedFavoriteContext = {
    currentPrice: number;
    currentAvailable: boolean;
    deepLink: string;
    cheapest: CheapestResult;
};

function findCheapestCrossMall(
    results: Awaited<ReturnType<typeof aggregateRealtimeSearch>>,
    referencePrice?: number
): CheapestResult {
    if (results.length === 0) return null;
    // 기준가 하한: 추적 상품 가격의 10% 미만 후보는 부자재/오매칭 —
    // "후드집업이 20원!" 류의 거짓 최저가 알림을 차단한다.
    const sorted = [...results]
        .filter(r => isPlausibleCrossMallPrice(r.price, referencePrice))
        .sort((a, b) => a.price - b.price);
    if (sorted.length === 0) return null;
    const cheapest = sorted[0];
    const mallName = getSourceDisplayName(cheapest.source, cheapest.mallName);
    return { price: cheapest.price, mallName, link: cheapest.link || '' };
}

function sanitizeQuery(title: string): string {
    return normalizeTitle(title).replace(/\s+/g, ' ').trim().slice(0, 50);
}

function normalizeSourceFromMall(mallName: string, link?: string): string {
    return detectMarketplaceSource(mallName, link || '');
}

function resolveFavoriteSource(favorite: FavoriteDoc): ProductSource | null {
    if (favorite.source && isProductSource(favorite.source)) {
        return favorite.source;
    }

    const detected = normalizeSourceFromMall(favorite.mallName || '', favorite.link);
    return isProductSource(detected) ? detected : null;
}

function normalizeId(value: string): string {
    return stripSourceIdPrefix(value);
}

function findCheapestProduct(products: UnifiedProduct[]): CheapestResult {
    if (products.length === 0) {
        return null;
    }

    const offers = comparePurchaseOffers(products);
    const availableProducts = offers.filter((offer) => offer.isAvailable).map((offer) => offer.product);
    const pool = availableProducts.length > 0 ? availableProducts : products;
    const cheapest = [...pool]
        .filter((product) => product.price > 0)
        .sort((left, right) => left.price - right.price)[0];

    if (!cheapest) {
        return null;
    }

    return {
        price: cheapest.price,
        mallName: getSourceDisplayName(cheapest.source, cheapest.mallName),
        link: cheapest.link || '',
    };
}

async function resolveFavoriteCompareContext(favorite: FavoriteDoc): Promise<ResolvedFavoriteContext | null> {
    const source = resolveFavoriteSource(favorite);
    const productId = favorite.productId ? normalizeId(favorite.productId) : '';
    if (!source || !productId) {
        return null;
    }

    const seedProduct = await readTrackedProduct(source, productId);
    if (!seedProduct) {
        return null;
    }

    const compareGroup = await readComparableGroup(seedProduct);
    const baseProducts = compareGroup?.variants || [seedProduct];
    const variantOptions = listVariantSelectionOptions(baseProducts, seedProduct);
    const selectedVariant = favorite.variantKey
        ? findSelectedVariantOption(variantOptions, favorite.variantKey)
        : variantOptions.find((option) => favorite.variantLabel && option.label === favorite.variantLabel);

    if ((favorite.variantKey || favorite.variantLabel) && variantOptions.length > 0 && !selectedVariant) {
        return {
            currentPrice: seedProduct.price,
            currentAvailable: false,
            deepLink: favorite.deepLink || buildCanonicalProductDetailHref(seedProduct, { variantKey: favorite.variantKey }),
            cheapest: null,
        };
    }

    const scopedProducts = applyVariantSelectionToProducts(baseProducts, selectedVariant);
    const currentProduct = scopedProducts.find((product) =>
        product.source === source && normalizeId(product.id) === productId
    ) || scopedProducts.find((product) => product.source === source) || scopedProducts[0] || seedProduct;
    const currentAvailable = comparePurchaseOffers([currentProduct])[0]?.isAvailable ?? inferStockStatus(currentProduct) !== 'sold_out';
    const deepLink = favorite.deepLink
        || buildCanonicalProductDetailHref(seedProduct, { variantKey: favorite.variantKey || selectedVariant?.key });

    return {
        currentPrice: currentProduct.price,
        currentAvailable,
        deepLink,
        cheapest: findCheapestProduct(scopedProducts),
    };
}

function pickCurrentPrice(
    queryResults: Awaited<ReturnType<typeof aggregateRealtimeSearch>>,
    favorite: FavoriteDoc
): number {
    if (queryResults.length === 0) {
        return parseCurrentPrice(favorite.lprice);
    }

    const expectedId = favorite.productId ? normalizeId(favorite.productId) : '';
    const expectedSource = normalizeSourceFromMall(favorite.mallName || '', favorite.link);

    const exact = queryResults.find((item) => {
        if (expectedSource && item.source !== expectedSource) return false;
        if (!expectedId) return false;
        return normalizeId(item.id) === expectedId;
    });
    if (exact) return exact.price;

    const sameSource = queryResults
        .filter((item) => item.source === expectedSource)
        .sort((a, b) => a.price - b.price);
    if (sameSource.length > 0) return sameSource[0].price;

    return Math.min(...queryResults.map((item) => item.price));
}

async function sendFcmIfAvailable(
    appId: string,
    userId: string,
    title: string,
    body: string,
    link: string
): Promise<number> {
    const db = getAdminDb();
    const messaging = getAdminMessaging();
    if (!db || !messaging) return 0;

    const tokensSnap = await db.collection(`artifacts/${appId}/users/${userId}/devices`).limit(20).get();
    const tokens: string[] = [];
    tokensSnap.forEach((doc) => {
        const data = doc.data() as { token?: string; notificationsEnabled?: boolean };
        if (data.notificationsEnabled === false) return;
        if (data.token && typeof data.token === 'string') {
            tokens.push(data.token);
        }
    });
    if (tokens.length === 0) return 0;

    const result = await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: {
            type: 'price_alert',
            link,
            title,
            body,
        },
    });
    return result.successCount;
}

export async function scanAndDispatchPriceAlerts(): Promise<{
    checked: number;
    triggered: number;
    alertsCreated: number;
    fcmSent: number;
    enabled: boolean;
}> {
    const db = getAdminDb();
    if (!db) {
        return { checked: 0, triggered: 0, alertsCreated: 0, fcmSent: 0, enabled: false };
    }
    const pageSize = Math.max(20, Math.min(Number(process.env.PRICE_ALERT_SCAN_PAGE_SIZE || 200), 1000));
    const maxChecked = Math.max(pageSize, Math.min(Number(process.env.PRICE_ALERT_SCAN_MAX_CHECKED || 2000), 10000));

    const queryCache = new Map<string, Awaited<ReturnType<typeof aggregateRealtimeSearch>>>();
    let checked = 0;
    let triggered = 0;
    let alertsCreated = 0;
    let fcmSent = 0;
    let cursor: QueryDocumentSnapshot<DocumentData> | null = null;

    while (checked < maxChecked) {
        let favoritesQuery = db
            .collectionGroup('favorites')
            .where('targetPrice', '>', 0)
            .orderBy('targetPrice')
            .limit(pageSize);
        if (cursor) {
            favoritesQuery = favoritesQuery.startAfter(cursor);
        }

        const favorites = await favoritesQuery.get();
        if (favorites.empty) {
            break;
        }

        for (const doc of favorites.docs) {
            if (checked >= maxChecked) break;

            const favorite = doc.data() as FavoriteDoc;
            const targetPrice = Number(favorite.targetPrice);
            if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
                continue;
            }

            if (isFavoriteAlertSnoozed(favorite)) {
                continue;
            }

            checked += 1;
            const query = sanitizeQuery(favorite.title || '');
            if (!query) {
                await markAlertDelivery(doc.ref.path, parseCurrentPrice(favorite.lprice));
                continue;
            }

            let results = queryCache.get(query);
            if (!results) {
                try {
                    results = await aggregateRealtimeSearch(query, 1, 'sim');
                } catch {
                    results = [];
                }
                queryCache.set(query, results);
            }

            let currentPrice = pickCurrentPrice(results, favorite);
            let currentAvailable = true;
            let cheapest = findCheapestCrossMall(results ?? [], currentPrice);
            let deepLink = favorite.deepLink || favorite.link || '/';

            try {
                const compareContext = await resolveFavoriteCompareContext(favorite);
                if (compareContext) {
                    currentPrice = compareContext.currentPrice;
                    currentAvailable = compareContext.currentAvailable;
                    cheapest = compareContext.cheapest;
                    deepLink = compareContext.deepLink || deepLink;
                }
            } catch (error) {
                Logger.warn('[PriceAlertScanner] compare context resolution failed', { error: toErrorMessage(error) });
            }

            const shouldTrigger = currentAvailable
                && currentPrice <= targetPrice
                && currentPrice !== favorite.lastAlertedPrice;

            if (!shouldTrigger) {
                await markAlertDelivery(doc.ref.path, currentPrice);
                continue;
            }

            const segments = doc.ref.path.split('/');
            const appId = segments[1];
            const userId = segments[3];
            if (!appId || !userId || segments.length < 4) {
                await markAlertDelivery(doc.ref.path, currentPrice);
                continue;
            }

            const cheapestIsOtherMall = cheapest && cheapest.price < currentPrice;
            const alertTitle = '목표가 도달 🎉';
            const priceText = currentPrice.toLocaleString();
            const crossMallNote = cheapestIsOtherMall
                ? ` 💡 ${cheapest.mallName}에서 ${cheapest.price.toLocaleString()}원으로 더 저렴!`
                : '';
            const variantSuffix = favorite.variantLabel ? ` (${favorite.variantLabel})` : '';
            const alertMessage = `${favorite.title || '관심 상품'}${variantSuffix}이(가) ${priceText}원으로 내려왔습니다.${crossMallNote}`;
            const priority = deriveAlertPriority({
                currentPrice,
                targetPrice,
                cheapestPrice: cheapest?.price,
            });

            const alertRef = db.collection(`artifacts/${appId}/users/${userId}/alerts`).doc();
            await alertRef.set({
                type: 'alert',
                title: alertTitle,
                message: alertMessage,
                priority,
                favoriteId: favorite.favoriteId || null,
                productId: favorite.productId || '',
                mallName: favorite.mallName || '',
                source: favorite.source || resolveFavoriteSource(favorite),
                variantKey: favorite.variantKey || null,
                variantLabel: favorite.variantLabel || null,
                link: favorite.link || '',
                deepLink,
                currentPrice,
                targetPrice,
                cheapestMall: cheapest?.mallName ?? null,
                cheapestPrice: cheapest?.price ?? null,
                cheapestLink: cheapest?.link ?? null,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
            });

            await markAlertDelivery(doc.ref.path, currentPrice, currentPrice);
            const sent = await sendFcmIfAvailable(appId, userId, alertTitle, alertMessage, deepLink);
            fcmSent += sent;
            alertsCreated += 1;
            triggered += 1;
        }

        cursor = favorites.docs[favorites.docs.length - 1] || null;
        if (favorites.size < pageSize) {
            break;
        }
    }

    return { checked, triggered, alertsCreated, fcmSent, enabled: true };
}
