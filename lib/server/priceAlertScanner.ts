import { DocumentData, FieldValue, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { aggregateRealtimeSearch } from '@/lib/api/realtimeAggregator';
import { normalizeTitle } from '@/lib/core/dataNormalizer';
import { getAdminDb, getAdminMessaging } from '@/lib/server/firebaseAdmin';
import { markAlertDelivery } from '@/lib/server/priceHistoryStore';

type FavoriteDoc = {
    title?: string;
    lprice?: string;
    productId?: string;
    mallName?: string;
    targetPrice?: number;
    link?: string;
    lastAlertedPrice?: number;
};

function parseCurrentPrice(raw: unknown): number {
    if (typeof raw === 'number' && Number.isFinite(raw) && raw > 0) return raw;
    if (typeof raw !== 'string') return 0;
    const parsed = Number.parseInt(raw.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

type CheapestResult = { price: number; mallName: string; link: string } | null;

function findCheapestCrossMall(
    results: Awaited<ReturnType<typeof aggregateRealtimeSearch>>
): CheapestResult {
    if (results.length === 0) return null;
    const sorted = [...results].filter(r => r.price > 0).sort((a, b) => a.price - b.price);
    if (sorted.length === 0) return null;
    const cheapest = sorted[0];
    const mallName = cheapest.source === 'MUSINSA' ? '무신사' : cheapest.source === '29CM' ? '29CM' : '네이버쇼핑';
    return { price: cheapest.price, mallName, link: cheapest.link || '' };
}

function sanitizeQuery(title: string): string {
    return normalizeTitle(title).replace(/\s+/g, ' ').trim().slice(0, 50);
}

function normalizeSourceFromMall(mallName: string): string {
    const lower = mallName.toLowerCase();
    if (lower.includes('musinsa') || lower.includes('무신사')) return 'MUSINSA';
    if (lower.includes('29')) return '29CM';
    return 'NAVER';
}

function normalizeId(value: string): string {
    return value.replace(/^(naver_|musinsa_|29cm_)/i, '');
}

function pickCurrentPrice(
    queryResults: Awaited<ReturnType<typeof aggregateRealtimeSearch>>,
    favorite: FavoriteDoc
): number {
    if (queryResults.length === 0) {
        return parseCurrentPrice(favorite.lprice);
    }

    const expectedId = favorite.productId ? normalizeId(favorite.productId) : '';
    const expectedSource = normalizeSourceFromMall(favorite.mallName || '');

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

            const currentPrice = pickCurrentPrice(results, favorite);
            const shouldTrigger = currentPrice <= targetPrice && currentPrice !== favorite.lastAlertedPrice;

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

            // 크로스몰 최저가 탐색
            const cheapest = findCheapestCrossMall(results ?? []);
            const cheapestIsOtherMall = cheapest && cheapest.price < currentPrice;

            const deepLink = (cheapestIsOtherMall ? cheapest.link : favorite.link) || '/';
            const alertTitle = '목표가 도달 🎉';
            const priceText = currentPrice.toLocaleString();
            const crossMallNote = cheapestIsOtherMall
                ? ` 💡 ${cheapest.mallName}에서 ${cheapest.price.toLocaleString()}원으로 더 저렴!`
                : '';
            const alertMessage = `${favorite.title || '관심 상품'}이(가) ${priceText}원으로 내려왔습니다.${crossMallNote}`;

            const alertRef = db.collection(`artifacts/${appId}/users/${userId}/alerts`).doc();
            await alertRef.set({
                type: 'alert',
                title: alertTitle,
                message: alertMessage,
                productId: favorite.productId || '',
                mallName: favorite.mallName || '',
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
