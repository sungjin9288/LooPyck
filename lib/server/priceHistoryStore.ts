import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { UnifiedProduct } from '@/lib/api/types';
import { getAdminDb } from '@/lib/server/firebaseAdmin';

const MAX_PRODUCTS_PER_INGEST = 40;

function toSafeDocId(value: string): string {
    return value.replace(/[^\w:-]/g, '_').slice(0, 180);
}

export function buildHistoryKey(product: Pick<UnifiedProduct, 'source' | 'id'>): string {
    return toSafeDocId(`${product.source}:${product.id}`);
}

export async function persistPriceHistorySnapshot(
    products: UnifiedProduct[],
    searchQuery: string
): Promise<{ persisted: number; enabled: boolean }> {
    const db = getAdminDb();
    if (!db) return { persisted: 0, enabled: false };

    const now = Timestamp.now();
    const searchTag = searchQuery.slice(0, 80);
    const dedup = new Map<string, UnifiedProduct>();

    for (const product of products.slice(0, MAX_PRODUCTS_PER_INGEST)) {
        const key = buildHistoryKey(product);
        if (!dedup.has(key)) {
            dedup.set(key, product);
        }
    }

    const entries = Array.from(dedup.entries());
    if (entries.length === 0) {
        return { persisted: 0, enabled: true };
    }

    const batch = db.batch();
    const capturedAtMs = Date.now();

    entries.forEach(([historyKey, product], index) => {
        const rootRef = db.collection('marketPriceHistory').doc(historyKey);
        const entryRef = rootRef.collection('entries').doc(`${capturedAtMs}-${index}`);

        batch.set(rootRef, {
            productId: product.id,
            source: product.source,
            title: product.title,
            mallName: product.mallName,
            brand: product.brand || null,
            link: product.link,
            image: product.image,
            latestPrice: product.price,
            updatedAt: now,
            lastSeenQuery: searchTag,
        }, { merge: true });

        batch.set(entryRef, {
            price: product.price,
            capturedAt: now,
            searchQuery: searchTag,
            mallName: product.mallName,
            source: product.source,
        }, { merge: true });
    });

    await batch.commit();
    return { persisted: entries.length, enabled: true };
}

export type PriceHistoryPoint = {
    price: number;
    capturedAt: number;
};

export async function readPriceHistory(
    source: string,
    productId: string,
    limitCount: number = 24
): Promise<{ points: PriceHistoryPoint[]; enabled: boolean }> {
    const db = getAdminDb();
    if (!db) return { points: [], enabled: false };

    const historyKey = buildHistoryKey({ source: source as UnifiedProduct['source'], id: productId });
    const snap = await db
        .collection('marketPriceHistory')
        .doc(historyKey)
        .collection('entries')
        .orderBy('capturedAt', 'desc')
        .limit(Math.max(1, Math.min(limitCount, 120)))
        .get();

    const points: PriceHistoryPoint[] = [];
    snap.forEach((doc) => {
        const data = doc.data();
        const price = Number(data.price);
        const capturedAt = data.capturedAt instanceof Timestamp
            ? data.capturedAt.toMillis()
            : Number(data.capturedAt);
        if (Number.isFinite(price) && Number.isFinite(capturedAt)) {
            points.push({ price, capturedAt });
        }
    });

    points.sort((a, b) => a.capturedAt - b.capturedAt);
    return { points, enabled: true };
}

export async function markAlertDelivery(
    favoriteRefPath: string,
    latestScannedPrice: number,
    alertedPrice?: number
): Promise<void> {
    const db = getAdminDb();
    if (!db) return;

    const payload: Record<string, unknown> = {
        latestScannedPrice,
        lastCheckedAt: FieldValue.serverTimestamp(),
    };

    if (typeof alertedPrice === 'number') {
        payload.lastAlertedPrice = alertedPrice;
        payload.lastAlertedAt = FieldValue.serverTimestamp();
    }

    await db.doc(favoriteRefPath).set(payload, { merge: true });
}
