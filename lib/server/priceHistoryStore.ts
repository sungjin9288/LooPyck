import { createHash } from 'node:crypto';
import { FieldValue, Timestamp, type Firestore } from 'firebase-admin/firestore';
import { isProductSource, type GroupedProduct, type ProductSource, type ProductVariantCandidate, type UnifiedProduct } from '@/lib/api/types';
import { buildOptionHistoryIdentity, buildOptionHistoryStorageKey } from '@/lib/product/optionHistory';
import { groupProducts } from '@/lib/product/productMatching';
import { analyzeFashionQuery, searchProductsByFashionQuery, type FashionQueryAnalysis } from '@/lib/search/fashionQueryAssistant';
import { buildVariantHistoryIdentity, buildVariantHistoryStorageKey } from '@/lib/product/variantHistory';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';
import { getAdminDb } from '@/lib/server/firebaseAdmin';

const MAX_PRODUCTS_PER_INGEST = 40;
const MAX_SITEMAP_PRODUCTS = 200;
const OPTION_HISTORY_COLLECTION = 'optionPriceHistory';
const VARIANT_HISTORY_COLLECTION = 'variantPriceHistory';
const GROUP_MATCH_STRATEGIES: GroupedProduct['matchStrategy'][] = ['single', 'model', 'brand_model', 'brand_token', 'token'];

function toSafeDocId(value: string): string {
    return value.replace(/[^\w:-]/g, '_').slice(0, 180);
}

export function buildHistoryKey(product: Pick<UnifiedProduct, 'source' | 'id'>): string {
    return toSafeDocId(`${product.source}:${product.id}`);
}

export function buildComparisonGroupId(group: Pick<GroupedProduct, 'variants'>): string {
    const variantKeys = [...group.variants.map((variant) => buildHistoryKey(variant))].sort();
    const digest = createHash('sha1').update(variantKeys.join('|')).digest('hex').slice(0, 24);
    return `cmp_${digest}`;
}

function normalizeText(value: unknown, maxLength: number): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim().replace(/[\u0000-\u001F\u007F]/g, '').slice(0, maxLength);
    return normalized.length > 0 ? normalized : null;
}

function normalizeOptionalText(value: unknown, maxLength: number): string | undefined {
    return normalizeText(value, maxLength) ?? undefined;
}

function normalizePrice(value: unknown): number | null {
    if (typeof value !== 'number' || !Number.isFinite(value)) return null;
    return Math.max(0, Math.floor(value));
}

function normalizeOptionalMoney(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return Math.max(0, Math.floor(value));
}

function normalizeOptionalStringArray(value: unknown, maxItems: number, maxLength: number): string[] | undefined {
    if (!Array.isArray(value)) return undefined;

    const normalized = value
        .filter((entry): entry is string => typeof entry === 'string')
        .map((entry) => normalizeText(entry, maxLength))
        .filter(Boolean) as string[];

    return normalized.length > 0 ? normalized.slice(0, maxItems) : undefined;
}

function normalizeOptionalVariantCandidates(value: unknown, maxItems: number = 24): ProductVariantCandidate[] | undefined {
    if (!Array.isArray(value)) return undefined;

    const normalized = value.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
            return [];
        }

        const candidate = entry as Record<string, unknown>;
        const label = normalizeOptionalText(candidate.label, 120);
        if (!label) {
            return [];
        }

        const normalizedCandidate: ProductVariantCandidate = {
            label,
            variantId: normalizeOptionalText(candidate.variantId, 120),
            variantSku: normalizeOptionalText(candidate.variantSku, 120),
            color: normalizeOptionalText(candidate.color, 60),
            size: normalizeOptionalText(candidate.size, 40),
            price: normalizeOptionalMoney(candidate.price),
            stockStatus: candidate.stockStatus === 'in_stock' || candidate.stockStatus === 'low_stock' || candidate.stockStatus === 'sold_out' || candidate.stockStatus === 'unknown'
                ? candidate.stockStatus
                : undefined,
        };

        return [normalizedCandidate];
    }).slice(0, maxItems);

    return normalized.length > 0 ? normalized : undefined;
}

function normalizeCount(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return Math.max(0, Math.floor(value));
}

function normalizeMatchConfidence(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
    return Math.max(0, Math.min(1, value));
}

function normalizeMatchStrategy(value: unknown): GroupedProduct['matchStrategy'] | undefined {
    return typeof value === 'string' && GROUP_MATCH_STRATEGIES.includes(value as GroupedProduct['matchStrategy'])
        ? value as GroupedProduct['matchStrategy']
        : undefined;
}

function normalizeTimestampMillis(value: unknown): number | null {
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    return null;
}

function buildStoredProductRecord(product: UnifiedProduct): Record<string, unknown> {
    const optionHistory = buildOptionHistoryIdentity(product);
    const variantHistory = buildVariantHistoryIdentity(product);

    return {
        productId: product.id,
        source: product.source,
        title: product.title,
        mallName: product.mallName,
        brand: product.brand || null,
        category1: product.category1 || null,
        category2: product.category2 || null,
        link: product.link,
        image: product.image,
        latestPrice: product.price,
        shippingFee: product.shippingFee ?? null,
        shippingFreeThreshold: product.shippingFreeThreshold ?? null,
        shippingText: product.shippingText || null,
        benefitPrice: product.benefitPrice ?? null,
        benefitText: product.benefitText || null,
        stockStatus: product.stockStatus || null,
        stockText: product.stockText || null,
        variantId: product.variantId || null,
        variantSku: product.variantSku || null,
        optionSummary: product.optionSummary || null,
        optionValues: product.optionValues || null,
        sizeOptions: product.sizeOptions || null,
        colorOptions: product.colorOptions || null,
        variantCandidates: product.variantCandidates?.slice(0, 24) || null,
        detailCollectedAt: product.detailCollectedAt || null,
        variantHistoryKey: variantHistory.variantKey || null,
        variantHistoryLabel: variantHistory.variantLabel || null,
        variantHistorySignature: variantHistory.variantSignature || null,
        optionHistoryKey: optionHistory.optionKey || null,
        optionHistoryLabel: optionHistory.optionLabel || null,
        optionHistorySignature: optionHistory.optionSignature || null,
    };
}

function toTrackedProduct(data: Record<string, unknown>): UnifiedProduct | null {
    const id = normalizeText(data.productId ?? data.id, 160);
    const title = normalizeText(data.title, 300);
    const mallName = normalizeText(data.mallName, 120);
    const sourceValue = normalizeText(data.source, 40);
    const image = typeof data.image === 'string' ? sanitizeExternalUrl(data.image) : null;
    const link = typeof data.link === 'string' ? sanitizeExternalUrl(data.link) : null;
    const price = normalizePrice(data.latestPrice ?? data.price);

    if (!id || !title || !mallName || !sourceValue || !isProductSource(sourceValue) || !image || !link || price === null) {
        return null;
    }

    return {
        id,
        title,
        price,
        image,
        link,
        mallName,
        source: sourceValue,
        brand: normalizeOptionalText(data.brand, 120),
        category1: normalizeOptionalText(data.category1, 80),
        category2: normalizeOptionalText(data.category2, 80),
        shippingFee: normalizeOptionalMoney(data.shippingFee),
        shippingFreeThreshold: normalizeOptionalMoney(data.shippingFreeThreshold),
        shippingText: normalizeOptionalText(data.shippingText, 160),
        benefitPrice: normalizeOptionalMoney(data.benefitPrice),
        benefitText: normalizeOptionalText(data.benefitText, 160),
        stockStatus: data.stockStatus === 'in_stock' || data.stockStatus === 'low_stock' || data.stockStatus === 'sold_out' || data.stockStatus === 'unknown'
            ? data.stockStatus
            : undefined,
        stockText: normalizeOptionalText(data.stockText, 120),
        variantId: normalizeOptionalText(data.variantId, 120),
        variantSku: normalizeOptionalText(data.variantSku, 120),
        optionSummary: normalizeOptionalText(data.optionSummary, 200),
        optionValues: normalizeOptionalStringArray(data.optionValues, 12, 60),
        sizeOptions: normalizeOptionalStringArray(data.sizeOptions, 12, 40),
        colorOptions: normalizeOptionalStringArray(data.colorOptions, 12, 40),
        variantCandidates: normalizeOptionalVariantCandidates(data.variantCandidates, 24),
        detailCollectedAt: normalizeOptionalText(data.detailCollectedAt, 64),
    };
}

function toPersistedComparisonGroup(
    data: Record<string, unknown>,
    fallbackGroupId: string
): GroupedProduct | null {
    if (!Array.isArray(data.variants)) {
        return null;
    }

    const variants = data.variants.flatMap((entry) => {
        if (!entry || typeof entry !== 'object') {
            return [];
        }

        const parsed = toTrackedProduct(entry as Record<string, unknown>);
        return parsed ? [parsed] : [];
    });

    if (variants.length === 0) {
        return null;
    }

    const sortedVariants = [...variants].sort((left, right) => left.price - right.price);
    const representativeKey = normalizeText(data.representativeKey, 240);
    const representative = representativeKey
        ? sortedVariants.find((variant) => buildHistoryKey(variant) === representativeKey) || sortedVariants[0]
        : sortedVariants[0];

    return {
        groupKey: normalizeText(data.groupKey, 240) || fallbackGroupId,
        representative,
        variants: sortedVariants,
        lowestPrice: normalizePrice(data.lowestPrice) ?? sortedVariants[0].price,
        highestPrice: normalizePrice(data.highestPrice) ?? sortedVariants[sortedVariants.length - 1].price,
        mallCount: normalizeCount(data.mallCount) ?? new Set(sortedVariants.map((variant) => variant.mallName)).size,
        matchConfidence: normalizeMatchConfidence(data.matchConfidence) ?? (sortedVariants.length > 1 ? 0.7 : 1),
        matchStrategy: normalizeMatchStrategy(data.matchStrategy) ?? (sortedVariants.length > 1 ? 'token' : 'single'),
    };
}

function mergeSeedIntoGroup(group: GroupedProduct, seedProduct: UnifiedProduct): GroupedProduct {
    const variantMap = new Map(group.variants.map((variant) => [buildHistoryKey(variant), variant]));
    variantMap.set(buildHistoryKey(seedProduct), seedProduct);

    const variants = Array.from(variantMap.values()).sort((left, right) => left.price - right.price);
    const representativeKey = buildHistoryKey(group.representative);
    const representative = variants.find((variant) => buildHistoryKey(variant) === representativeKey) || variants[0];

    return {
        ...group,
        representative,
        variants,
        lowestPrice: variants[0].price,
        highestPrice: variants[variants.length - 1].price,
        mallCount: new Set(variants.map((variant) => variant.mallName)).size,
    };
}

async function readPersistedComparableGroup(
    db: Firestore,
    seedProduct: UnifiedProduct
): Promise<GroupedProduct | null> {
    const seedSnap = await db.collection('marketPriceHistory').doc(buildHistoryKey(seedProduct)).get();
    if (!seedSnap.exists) {
        return null;
    }

    const comparisonGroupId = normalizeText(seedSnap.data()?.comparisonGroupId, 120);
    if (!comparisonGroupId) {
        return null;
    }

    const groupSnap = await db.collection('comparisonGroups').doc(comparisonGroupId).get();
    if (!groupSnap.exists) {
        return null;
    }

    const group = toPersistedComparisonGroup(groupSnap.data() || {}, comparisonGroupId);
    if (!group) {
        return null;
    }

    if (!group.variants.some((variant) => variant.id === seedProduct.id && variant.source === seedProduct.source)) {
        return null;
    }

    return mergeSeedIntoGroup(group, seedProduct);
}

async function reconstructComparableGroup(
    db: Firestore,
    seedProduct: UnifiedProduct,
    limitCount: number,
    fallbackGroup: GroupedProduct | null
): Promise<GroupedProduct | null> {
    const snap = await db
        .collection('marketPriceHistory')
        .orderBy('updatedAt', 'desc')
        .limit(Math.max(20, Math.min(limitCount, 240)))
        .get();

    const dedup = new Map<string, UnifiedProduct>();
    snap.forEach((doc) => {
        const product = toTrackedProduct(doc.data() || {});
        if (!product) {
            return;
        }

        dedup.set(buildHistoryKey(product), product);
    });

    dedup.set(buildHistoryKey(seedProduct), seedProduct);

    const groups = groupProducts(Array.from(dedup.values()));
    return groups.find((group) =>
        group.variants.some((variant) => variant.id === seedProduct.id && variant.source === seedProduct.source)
    ) || fallbackGroup;
}

export async function persistPriceHistorySnapshot(
    products: UnifiedProduct[],
    searchQuery: string
): Promise<{
    persisted: number;
    enabled: boolean;
    comparisonGroupsPersisted: number;
    optionHistoriesPersisted: number;
    variantHistoriesPersisted: number;
}> {
    const db = getAdminDb();
    if (!db) {
        return {
            persisted: 0,
            enabled: false,
            comparisonGroupsPersisted: 0,
            optionHistoriesPersisted: 0,
            variantHistoriesPersisted: 0,
        };
    }

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
        return {
            persisted: 0,
            enabled: true,
            comparisonGroupsPersisted: 0,
            optionHistoriesPersisted: 0,
            variantHistoriesPersisted: 0,
        };
    }

    const batch = db.batch();
    const capturedAtMs = Date.now();
    const groups = groupProducts(entries.map(([, product]) => product));
    let optionHistoriesPersisted = 0;
    let variantHistoriesPersisted = 0;
    const groupMetaByHistoryKey = new Map<string, {
        comparisonGroupId: string;
        matchConfidence: number;
        mallCount: number;
        matchStrategy: GroupedProduct['matchStrategy'];
    }>();

    groups.forEach((group) => {
        const comparisonGroupId = buildComparisonGroupId(group);
        const groupRef = db.collection('comparisonGroups').doc(comparisonGroupId);

        batch.set(groupRef, {
            comparisonGroupId,
            groupKey: group.groupKey,
            representativeKey: buildHistoryKey(group.representative),
            variantKeys: group.variants.map((variant) => buildHistoryKey(variant)),
            matchConfidence: group.matchConfidence,
            matchStrategy: group.matchStrategy,
            mallCount: group.mallCount,
            lowestPrice: group.lowestPrice,
            highestPrice: group.highestPrice,
            variants: group.variants.map((variant) => buildStoredProductRecord(variant)),
            updatedAt: now,
            lastSeenQuery: searchTag,
        }, { merge: true });

        group.variants.forEach((variant) => {
            groupMetaByHistoryKey.set(buildHistoryKey(variant), {
                comparisonGroupId,
                matchConfidence: group.matchConfidence,
                mallCount: group.mallCount,
                matchStrategy: group.matchStrategy,
            });
        });
    });

    entries.forEach(([historyKey, product], index) => {
        const rootRef = db.collection('marketPriceHistory').doc(historyKey);
        const entryRef = rootRef.collection('entries').doc(`${capturedAtMs}-${index}`);
        const groupMeta = groupMetaByHistoryKey.get(historyKey);
        const variantHistory = buildVariantHistoryIdentity(product);
        const optionHistory = buildOptionHistoryIdentity(product);

        batch.set(rootRef, {
            ...buildStoredProductRecord(product),
            comparisonGroupId: groupMeta?.comparisonGroupId || null,
            comparisonGroupMatchConfidence: groupMeta?.matchConfidence ?? null,
            comparisonGroupMallCount: groupMeta?.mallCount ?? null,
            comparisonGroupMatchStrategy: groupMeta?.matchStrategy ?? null,
            comparisonGroupUpdatedAt: groupMeta ? now : null,
            updatedAt: now,
            lastSeenQuery: searchTag,
        }, { merge: true });

        batch.set(entryRef, {
            price: product.price,
            capturedAt: now,
            searchQuery: searchTag,
            mallName: product.mallName,
            source: product.source,
            stockStatus: product.stockStatus || null,
            stockText: product.stockText || null,
            variantId: product.variantId || null,
            variantSku: product.variantSku || null,
            optionKey: optionHistory.optionKey || null,
            optionLabel: optionHistory.optionLabel || null,
        }, { merge: true });

        if (variantHistory.variantKey) {
            const variantHistoryKey = toSafeDocId(buildVariantHistoryStorageKey(product.source, product.id, variantHistory.variantKey));
            const variantRootRef = db.collection(VARIANT_HISTORY_COLLECTION).doc(variantHistoryKey);
            const variantEntryRef = variantRootRef.collection('entries').doc(`${capturedAtMs}-${index}`);

            batch.set(variantRootRef, {
                ...buildStoredProductRecord(product),
                parentHistoryKey: historyKey,
                variantKey: variantHistory.variantKey,
                variantLabel: variantHistory.variantLabel || null,
                variantSignature: variantHistory.variantSignature || null,
                updatedAt: now,
                lastSeenQuery: searchTag,
            }, { merge: true });

            batch.set(variantEntryRef, {
                price: product.price,
                capturedAt: now,
                searchQuery: searchTag,
                mallName: product.mallName,
                source: product.source,
                stockStatus: product.stockStatus || null,
                stockText: product.stockText || null,
                variantId: product.variantId || null,
                variantSku: product.variantSku || null,
                variantKey: variantHistory.variantKey,
                variantLabel: variantHistory.variantLabel || null,
                optionKey: optionHistory.optionKey || null,
                optionLabel: optionHistory.optionLabel || null,
            }, { merge: true });

            variantHistoriesPersisted += 1;
        }

        if (optionHistory.optionKey) {
            const optionHistoryKey = toSafeDocId(buildOptionHistoryStorageKey(product.source, product.id, optionHistory.optionKey));
            const optionRootRef = db.collection(OPTION_HISTORY_COLLECTION).doc(optionHistoryKey);
            const optionEntryRef = optionRootRef.collection('entries').doc(`${capturedAtMs}-${index}`);

            batch.set(optionRootRef, {
                ...buildStoredProductRecord(product),
                parentHistoryKey: historyKey,
                optionKey: optionHistory.optionKey,
                optionLabel: optionHistory.optionLabel || null,
                optionSignature: optionHistory.optionSignature || null,
                updatedAt: now,
                lastSeenQuery: searchTag,
            }, { merge: true });

            batch.set(optionEntryRef, {
                price: product.price,
                capturedAt: now,
                searchQuery: searchTag,
                mallName: product.mallName,
                source: product.source,
                stockStatus: product.stockStatus || null,
                stockText: product.stockText || null,
                variantId: product.variantId || null,
                variantSku: product.variantSku || null,
                optionKey: optionHistory.optionKey,
                optionLabel: optionHistory.optionLabel || null,
            }, { merge: true });

            optionHistoriesPersisted += 1;
        }
    });

    await batch.commit();
    return {
        persisted: entries.length,
        enabled: true,
        comparisonGroupsPersisted: groups.length,
        optionHistoriesPersisted,
        variantHistoriesPersisted,
    };
}

export type PriceHistoryPoint = {
    price: number;
    capturedAt: number;
    stockStatus?: UnifiedProduct['stockStatus'];
    stockText?: string;
    variantKey?: string;
    variantLabel?: string;
    optionKey?: string;
    optionLabel?: string;
};

export async function readPriceHistory(
    source: string,
    productId: string,
    limitCount: number = 24,
    options?: {
        optionKey?: string;
        variantKey?: string;
    }
): Promise<{ points: PriceHistoryPoint[]; enabled: boolean; scope: 'product' | 'option' | 'variant' }> {
    const db = getAdminDb();
    if (!db) return { points: [], enabled: false, scope: 'product' };

    const normalizedLimit = Math.max(1, Math.min(limitCount, 120));
    const normalizedSource = source as UnifiedProduct['source'];
    const optionKey = options?.optionKey;
    const variantKey = options?.variantKey;

    async function readPoints(
        collection: 'marketPriceHistory' | typeof OPTION_HISTORY_COLLECTION | typeof VARIANT_HISTORY_COLLECTION,
        docId: string
    ): Promise<PriceHistoryPoint[]> {
        const snap = await db
            .collection(collection)
            .doc(docId)
            .collection('entries')
            .orderBy('capturedAt', 'desc')
            .limit(normalizedLimit)
            .get();

        const points: PriceHistoryPoint[] = [];
        snap.forEach((doc) => {
            const data = doc.data();
            const price = Number(data.price);
            const capturedAt = data.capturedAt instanceof Timestamp
                ? data.capturedAt.toMillis()
                : Number(data.capturedAt);

            if (!Number.isFinite(price) || !Number.isFinite(capturedAt)) {
                return;
            }

            points.push({
                price,
                capturedAt,
                stockStatus: data.stockStatus === 'in_stock' || data.stockStatus === 'low_stock' || data.stockStatus === 'sold_out' || data.stockStatus === 'unknown'
                    ? data.stockStatus
                    : undefined,
                stockText: normalizeOptionalText(data.stockText, 120),
                variantKey: normalizeOptionalText(data.variantKey, 120),
                variantLabel: normalizeOptionalText(data.variantLabel, 200),
                optionKey: normalizeOptionalText(data.optionKey, 120),
                optionLabel: normalizeOptionalText(data.optionLabel, 200),
            });
        });

        points.sort((a, b) => a.capturedAt - b.capturedAt);
        return points;
    }

    if (variantKey) {
        const variantPoints = await readPoints(
            VARIANT_HISTORY_COLLECTION,
            toSafeDocId(buildVariantHistoryStorageKey(normalizedSource, productId, variantKey))
        );

        if (variantPoints.length > 0) {
            return { points: variantPoints, enabled: true, scope: 'variant' };
        }
    }

    if (optionKey) {
        const optionPoints = await readPoints(
            OPTION_HISTORY_COLLECTION,
            toSafeDocId(buildOptionHistoryStorageKey(normalizedSource, productId, optionKey))
        );

        if (optionPoints.length > 0) {
            return { points: optionPoints, enabled: true, scope: 'option' };
        }
    }

    const historyKey = buildHistoryKey({ source: normalizedSource, id: productId });
    const points = await readPoints('marketPriceHistory', historyKey);
    return { points, enabled: true, scope: 'product' };
}

export async function readTrackedProduct(
    source: ProductSource,
    productId: string
): Promise<UnifiedProduct | null> {
    const db = getAdminDb();
    if (!db) return null;

    const snap = await db.collection('marketPriceHistory').doc(buildHistoryKey({ source, id: productId })).get();
    if (!snap.exists) return null;

    return toTrackedProduct(snap.data() || {});
}

export async function readTrackedProductsBatch(
    products: Array<Pick<UnifiedProduct, 'source' | 'id'>>
): Promise<Map<string, UnifiedProduct>> {
    const db = getAdminDb();
    const result = new Map<string, UnifiedProduct>();
    if (!db || products.length === 0) return result;

    const uniqueKeys = Array.from(new Set(products.map((product) => buildHistoryKey(product))));
    const refs = uniqueKeys.map((historyKey) => db.collection('marketPriceHistory').doc(historyKey));
    const docs = await Promise.all(refs.map((ref) => ref.get()));

    docs.forEach((doc) => {
        if (!doc.exists) {
            return;
        }

        const product = toTrackedProduct(doc.data() || {});
        if (!product) {
            return;
        }

        result.set(buildHistoryKey(product), product);
    });

    return result;
}

export async function persistTrackedProductDetails(
    products: UnifiedProduct[]
): Promise<{ persisted: number; enabled: boolean }> {
    const db = getAdminDb();
    if (!db || products.length === 0) {
        return { persisted: 0, enabled: Boolean(db) };
    }

    const batch = db.batch();
    const now = Timestamp.now();
    let persisted = 0;

    products.forEach((product) => {
        const historyKey = buildHistoryKey(product);
        const rootRef = db.collection('marketPriceHistory').doc(historyKey);
        const variantHistory = buildVariantHistoryIdentity(product);
        const optionHistory = buildOptionHistoryIdentity(product);

        batch.set(rootRef, {
            ...buildStoredProductRecord(product),
            updatedAt: now,
        }, { merge: true });

        if (variantHistory.variantKey) {
            const variantRootRef = db.collection(VARIANT_HISTORY_COLLECTION).doc(
                toSafeDocId(buildVariantHistoryStorageKey(product.source, product.id, variantHistory.variantKey))
            );

            batch.set(variantRootRef, {
                ...buildStoredProductRecord(product),
                parentHistoryKey: historyKey,
                variantKey: variantHistory.variantKey,
                variantLabel: variantHistory.variantLabel || null,
                variantSignature: variantHistory.variantSignature || null,
                updatedAt: now,
            }, { merge: true });
        }

        if (optionHistory.optionKey) {
            const optionRootRef = db.collection(OPTION_HISTORY_COLLECTION).doc(
                toSafeDocId(buildOptionHistoryStorageKey(product.source, product.id, optionHistory.optionKey))
            );

            batch.set(optionRootRef, {
                ...buildStoredProductRecord(product),
                parentHistoryKey: historyKey,
                optionKey: optionHistory.optionKey,
                optionLabel: optionHistory.optionLabel || null,
                optionSignature: optionHistory.optionSignature || null,
                updatedAt: now,
            }, { merge: true });
        }

        persisted += 1;
    });

    await batch.commit();
    return { persisted, enabled: true };
}

export async function readComparableGroup(
    seedProduct: UnifiedProduct,
    limitCount: number = 180
): Promise<GroupedProduct | null> {
    const fallbackGroup = groupProducts([seedProduct])[0] || null;
    const db = getAdminDb();

    if (!db) {
        return fallbackGroup;
    }

    try {
        const persistedGroup = await readPersistedComparableGroup(db, seedProduct);
        if (persistedGroup) {
            return persistedGroup;
        }

        return await reconstructComparableGroup(db, seedProduct, limitCount, fallbackGroup);
    } catch (error) {
        console.warn('[PriceHistory] comparable group load failed:', error);
        return fallbackGroup;
    }
}

export type SitemapTrackedProduct = UnifiedProduct & {
    updatedAt: number;
};

export async function listTrackedProductsForSitemap(
    limitCount: number = MAX_SITEMAP_PRODUCTS
): Promise<SitemapTrackedProduct[]> {
    const db = getAdminDb();
    if (!db) return [];

    try {
        const snap = await db
            .collection('marketPriceHistory')
            .orderBy('updatedAt', 'desc')
            .limit(Math.max(1, Math.min(limitCount, MAX_SITEMAP_PRODUCTS)))
            .get();

        const products: SitemapTrackedProduct[] = [];
        snap.forEach((doc) => {
            const data = doc.data() || {};
            const product = toTrackedProduct(data);
            const updatedAt = normalizeTimestampMillis(data.updatedAt);

            if (!product || updatedAt === null) {
                return;
            }

            products.push({
                ...product,
                updatedAt,
            });
        });

        return products;
    } catch (error) {
        console.warn('[PriceHistory] sitemap load failed:', error);
        return [];
    }
}

export async function searchTrackedProductsByFashionQuery(
    query: string | FashionQueryAnalysis,
    limitCount: number = 24,
    poolSize: number = 240
): Promise<UnifiedProduct[]> {
    const db = getAdminDb();
    if (!db) return [];

    const analysis = typeof query === 'string' ? analyzeFashionQuery(query) : query;
    if (!analysis.allowed) {
        return [];
    }

    try {
        const snap = await db
            .collection('marketPriceHistory')
            .orderBy('updatedAt', 'desc')
            .limit(Math.max(20, Math.min(poolSize, 400)))
            .get();

        const dedup = new Map<string, UnifiedProduct>();
        snap.forEach((doc) => {
            const product = toTrackedProduct(doc.data() || {});
            if (!product) {
                return;
            }

            dedup.set(buildHistoryKey(product), product);
        });

        return searchProductsByFashionQuery(Array.from(dedup.values()), analysis, limitCount);
    } catch (error) {
        console.warn('[PriceHistory] tracked search fallback failed:', error);
        return [];
    }
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
