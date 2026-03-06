import type { SearchAggregationDiagnostics, SearchSourceDiagnostic } from './realtimeAggregator.ts';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../server/firebaseAdmin.ts';
import type { ProductSource } from './types.ts';

const MAX_RECENT_SNAPSHOTS = 120;
const MAX_RECENT_INTERACTIONS = 200;
const SNAPSHOT_COLLECTION = 'searchDiagnosticsSnapshots';
const SUMMARY_COLLECTION = 'searchDiagnosticsSourceSummary';
const META_COLLECTION = 'searchDiagnosticsMeta';
const INTERACTION_COLLECTION = 'searchDiagnosticsInteractions';
const META_DOC_ID = 'overview';
const DIRECT_ADAPTER_SOURCES = new Set<SearchSourceDiagnostic['source']>([
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
]);

type SearchCollectionMode = 'api' | 'direct' | 'classified';

export type SearchInteractionType = 'suggestion_click' | 'product_open' | 'store_click';

export interface SearchInteractionEvent {
    type: SearchInteractionType;
    query: string;
    generatedAt: string;
    selectedQuery?: string;
    source?: ProductSource;
    productId?: string;
    productTitle?: string;
    brand?: string;
    context?: string;
}

export type SearchInteractionSummary = {
    total: number;
    suggestionClicks: number;
    productOpens: number;
    storeClicks: number;
    topSelectedQueries: Array<{ query: string; count: number }>;
    topOpenedBrands: Array<{ brand: string; count: number }>;
};

export type SearchQualitySummary = {
    strong: number;
    mixed: number;
    weak: number;
    lowFitShare: number;
    avgStrongMatches: number;
    avgExactMatches: number;
};

type SourceSummaryState = {
    source: SearchSourceDiagnostic['source'];
    searches: number;
    successCount: number;
    directHits: number;
    fallbackHits: number;
    emptyHits: number;
    totalItems: number;
    totalLatencyMs: number;
    latencySamples: number;
    lastSeenAt: string;
    lastStrategy: SearchSourceDiagnostic['strategy'];
    lastFallbackReason?: string;
};

export type SearchSourceSummary = SourceSummaryState & {
    avgLatencyMs: number;
    successRate: number;
    collectionMode: SearchCollectionMode;
};

function getCollectionMode(source: SearchSourceDiagnostic['source']): SearchCollectionMode {
    if (source === 'NAVER') {
        return 'api';
    }

    return DIRECT_ADAPTER_SOURCES.has(source) ? 'direct' : 'classified';
}

const recentSnapshots: SearchAggregationDiagnostics[] = [];
const recentInteractions: SearchInteractionEvent[] = [];
const sourceSummaryMap = new Map<SearchSourceDiagnostic['source'], SourceSummaryState>();

function updateSourceSummary(snapshot: SearchAggregationDiagnostics, sourceDiagnostic: SearchSourceDiagnostic): void {
    const existing = sourceSummaryMap.get(sourceDiagnostic.source);

    const nextState: SourceSummaryState = existing
        ? { ...existing }
        : {
            source: sourceDiagnostic.source,
            searches: 0,
            successCount: 0,
            directHits: 0,
            fallbackHits: 0,
            emptyHits: 0,
            totalItems: 0,
            totalLatencyMs: 0,
            latencySamples: 0,
            lastSeenAt: snapshot.generatedAt,
            lastStrategy: sourceDiagnostic.strategy,
        };

    nextState.searches += 1;
    nextState.successCount += sourceDiagnostic.success ? 1 : 0;
    nextState.directHits += sourceDiagnostic.strategy === 'direct' || sourceDiagnostic.strategy === 'direct_preferred_over_naver' ? 1 : 0;
    nextState.fallbackHits += sourceDiagnostic.strategy === 'naver_classified_fallback' || sourceDiagnostic.strategy === 'classified_naver' ? 1 : 0;
    nextState.emptyHits += sourceDiagnostic.strategy === 'empty' ? 1 : 0;
    nextState.totalItems += sourceDiagnostic.finalCount;

    if (sourceDiagnostic.attempted) {
        nextState.totalLatencyMs += sourceDiagnostic.durationMs;
        nextState.latencySamples += 1;
    }

    nextState.lastSeenAt = snapshot.generatedAt;
    nextState.lastStrategy = sourceDiagnostic.strategy;
    nextState.lastFallbackReason = sourceDiagnostic.fallbackReason;

    sourceSummaryMap.set(sourceDiagnostic.source, nextState);
}

function countBy<T extends string>(values: T[]): Array<{ value: T; count: number }> {
    const counts = new Map<T, number>();
    values.forEach((value) => {
        counts.set(value, (counts.get(value) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((left, right) => right.count - left.count || left.value.localeCompare(right.value));
}

export function buildSearchQualitySummary(snapshots: SearchAggregationDiagnostics[]): SearchQualitySummary {
    const strong = snapshots.filter((snapshot) => snapshot.resultQuality === 'strong').length;
    const mixed = snapshots.filter((snapshot) => snapshot.resultQuality === 'mixed').length;
    const weak = snapshots.filter((snapshot) => snapshot.resultQuality === 'weak' || snapshot.totalProducts === 0).length;
    const sampleCount = snapshots.length || 1;
    const strongMatches = snapshots.reduce((sum, snapshot) => sum + (snapshot.strongMatchCount || 0), 0);
    const exactMatches = snapshots.reduce((sum, snapshot) => sum + (snapshot.exactMatchCount || 0), 0);

    return {
        strong,
        mixed,
        weak,
        lowFitShare: Math.round(((weak + mixed) / sampleCount) * 1000) / 10,
        avgStrongMatches: Math.round((strongMatches / sampleCount) * 10) / 10,
        avgExactMatches: Math.round((exactMatches / sampleCount) * 10) / 10,
    };
}

export function buildSearchInteractionSummary(interactions: SearchInteractionEvent[]): SearchInteractionSummary {
    return {
        total: interactions.length,
        suggestionClicks: interactions.filter((entry) => entry.type === 'suggestion_click').length,
        productOpens: interactions.filter((entry) => entry.type === 'product_open').length,
        storeClicks: interactions.filter((entry) => entry.type === 'store_click').length,
        topSelectedQueries: countBy(interactions.map((entry) => entry.selectedQuery).filter(Boolean) as string[])
            .slice(0, 6)
            .map((entry) => ({ query: entry.value, count: entry.count })),
        topOpenedBrands: countBy(interactions.map((entry) => entry.brand).filter(Boolean) as string[])
            .slice(0, 6)
            .map((entry) => ({ brand: entry.value, count: entry.count })),
    };
}

export function recordSearchDiagnostics(snapshot: SearchAggregationDiagnostics): void {
    recentSnapshots.unshift(snapshot);
    if (recentSnapshots.length > MAX_RECENT_SNAPSHOTS) {
        recentSnapshots.length = MAX_RECENT_SNAPSHOTS;
    }

    snapshot.sources.forEach((sourceDiagnostic) => updateSourceSummary(snapshot, sourceDiagnostic));
}

export function recordSearchInteraction(event: SearchInteractionEvent): void {
    recentInteractions.unshift(event);
    if (recentInteractions.length > MAX_RECENT_INTERACTIONS) {
        recentInteractions.length = MAX_RECENT_INTERACTIONS;
    }
}

export function getRecentSearchDiagnostics(limit: number = 10): SearchAggregationDiagnostics[] {
    return recentSnapshots.slice(0, Math.max(1, Math.min(limit, MAX_RECENT_SNAPSHOTS)));
}

export function getRecentSearchInteractions(limit: number = 20): SearchInteractionEvent[] {
    return recentInteractions.slice(0, Math.max(1, Math.min(limit, MAX_RECENT_INTERACTIONS)));
}

export function getSearchDiagnosticsSummary(): {
    trackedSearches: number;
    lastUpdatedAt: string | null;
    sources: SearchSourceSummary[];
} {
    const sources = Array.from(sourceSummaryMap.values())
        .map((source) => ({
            ...source,
            avgLatencyMs: source.latencySamples > 0
                ? Math.round(source.totalLatencyMs / source.latencySamples)
                : 0,
            successRate: source.searches > 0
                ? Math.round((source.successCount / source.searches) * 1000) / 10
                : 0,
            collectionMode: getCollectionMode(source.source),
        }))
        .sort((left, right) => {
            const successDiff = right.successRate - left.successRate;
            if (successDiff !== 0) return successDiff;
            return right.totalItems - left.totalItems;
        });

    return {
        trackedSearches: recentSnapshots.length,
        lastUpdatedAt: recentSnapshots[0]?.generatedAt || null,
        sources,
    };
}

export function resetSearchDiagnostics(): void {
    recentSnapshots.length = 0;
    recentInteractions.length = 0;
    sourceSummaryMap.clear();
}

function toSafeDocId(value: string): string {
    return value.replace(/[^\w:-]/g, '_').slice(0, 180);
}

function serializeSnapshot(snapshot: SearchAggregationDiagnostics): Record<string, unknown> {
    return {
        query: snapshot.query,
        page: snapshot.page,
        sort: snapshot.sort,
        generatedAt: snapshot.generatedAt,
        effectiveQuery: snapshot.effectiveQuery || null,
        queryIntent: snapshot.queryIntent || null,
        resultQuality: snapshot.resultQuality || null,
        exactMatchCount: snapshot.exactMatchCount ?? null,
        strongMatchCount: snapshot.strongMatchCount ?? null,
        suggestedQueries: snapshot.suggestedQueries || [],
        totalProducts: snapshot.totalProducts,
        directSourceCount: snapshot.directSourceCount,
        fallbackSourceCount: snapshot.fallbackSourceCount,
        sources: snapshot.sources.map((source) => ({
            ...source,
            fallbackReason: source.fallbackReason || null,
            requestedQueries: source.requestedQueries || [],
            resolvedQuery: source.resolvedQuery || null,
        })),
    };
}

type PersistResult = {
    enabled: boolean;
    persisted: boolean;
};

export async function persistSearchDiagnostics(snapshot: SearchAggregationDiagnostics): Promise<PersistResult> {
    const db = getAdminDb();
    if (!db) {
        return { enabled: false, persisted: false };
    }

    const batch = db.batch();
    const snapshotId = toSafeDocId(`${snapshot.generatedAt}_${snapshot.query}_${snapshot.page}`);
    const snapshotRef = db.collection(SNAPSHOT_COLLECTION).doc(snapshotId);
    batch.set(snapshotRef, {
        ...serializeSnapshot(snapshot),
        createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    snapshot.sources.forEach((source) => {
        const summaryRef = db.collection(SUMMARY_COLLECTION).doc(source.source);
        const isDirectHit = source.strategy === 'direct' || source.strategy === 'direct_preferred_over_naver';
        const isFallbackHit = source.strategy === 'naver_classified_fallback' || source.strategy === 'classified_naver';
        const isEmpty = source.strategy === 'empty';

        batch.set(summaryRef, {
            source: source.source,
            searches: FieldValue.increment(1),
            successCount: FieldValue.increment(source.success ? 1 : 0),
            directHits: FieldValue.increment(isDirectHit ? 1 : 0),
            fallbackHits: FieldValue.increment(isFallbackHit ? 1 : 0),
            emptyHits: FieldValue.increment(isEmpty ? 1 : 0),
            totalItems: FieldValue.increment(source.finalCount),
            totalLatencyMs: FieldValue.increment(source.attempted ? source.durationMs : 0),
            latencySamples: FieldValue.increment(source.attempted ? 1 : 0),
            lastSeenAt: snapshot.generatedAt,
            lastStrategy: source.strategy,
            lastFallbackReason: source.fallbackReason || null,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    });

    const metaRef = db.collection(META_COLLECTION).doc(META_DOC_ID);
    batch.set(metaRef, {
        trackedSearches: FieldValue.increment(1),
        lastUpdatedAt: snapshot.generatedAt,
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await batch.commit();
    return { enabled: true, persisted: true };
}

function serializeInteraction(event: SearchInteractionEvent): Record<string, unknown> {
    return {
        type: event.type,
        query: event.query,
        generatedAt: event.generatedAt,
        selectedQuery: event.selectedQuery || null,
        source: event.source || null,
        productId: event.productId || null,
        productTitle: event.productTitle || null,
        brand: event.brand || null,
        context: event.context || null,
    };
}

export async function persistSearchInteraction(event: SearchInteractionEvent): Promise<PersistResult> {
    const db = getAdminDb();
    if (!db) {
        return { enabled: false, persisted: false };
    }

    const interactionId = toSafeDocId(`${event.generatedAt}_${event.type}_${event.query}_${event.productId || event.selectedQuery || ''}`);
    const interactionRef = db.collection(INTERACTION_COLLECTION).doc(interactionId);

    await interactionRef.set({
        ...serializeInteraction(event),
        createdAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return { enabled: true, persisted: true };
}

function parseRecentSnapshot(raw: Record<string, unknown>): SearchAggregationDiagnostics | null {
    if (typeof raw.query !== 'string' || typeof raw.generatedAt !== 'string' || typeof raw.page !== 'number' || typeof raw.totalProducts !== 'number') {
        return null;
    }

    const sourcesRaw = Array.isArray(raw.sources) ? raw.sources : [];
    const sources: SearchSourceDiagnostic[] = sourcesRaw
        .map((entry) => {
            if (!entry || typeof entry !== 'object') return null;
            const value = entry as Record<string, unknown>;
            if (
                typeof value.source !== 'string' ||
                typeof value.attempted !== 'boolean' ||
                typeof value.success !== 'boolean' ||
                typeof value.durationMs !== 'number' ||
                typeof value.directCount !== 'number' ||
                typeof value.naverCount !== 'number' ||
                typeof value.finalCount !== 'number' ||
                typeof value.strategy !== 'string'
            ) {
                return null;
            }

            return {
                source: value.source as SearchSourceDiagnostic['source'],
                attempted: value.attempted,
                success: value.success,
                durationMs: value.durationMs,
                directCount: value.directCount,
                naverCount: value.naverCount,
                finalCount: value.finalCount,
                strategy: value.strategy as SearchSourceDiagnostic['strategy'],
                fallbackReason: typeof value.fallbackReason === 'string' ? value.fallbackReason : undefined,
                requestedQueries: Array.isArray(value.requestedQueries)
                    ? value.requestedQueries.filter((entry): entry is string => typeof entry === 'string')
                    : undefined,
                resolvedQuery: typeof value.resolvedQuery === 'string' ? value.resolvedQuery : undefined,
            };
        })
        .filter(Boolean) as SearchSourceDiagnostic[];

    return {
        query: raw.query,
        page: raw.page,
        sort: (typeof raw.sort === 'string' ? raw.sort : 'sim') as SearchAggregationDiagnostics['sort'],
        generatedAt: raw.generatedAt,
        effectiveQuery: typeof raw.effectiveQuery === 'string' ? raw.effectiveQuery : undefined,
        queryIntent: typeof raw.queryIntent === 'string' ? raw.queryIntent as SearchAggregationDiagnostics['queryIntent'] : undefined,
        resultQuality: typeof raw.resultQuality === 'string' ? raw.resultQuality as SearchAggregationDiagnostics['resultQuality'] : undefined,
        exactMatchCount: typeof raw.exactMatchCount === 'number' ? raw.exactMatchCount : undefined,
        strongMatchCount: typeof raw.strongMatchCount === 'number' ? raw.strongMatchCount : undefined,
        suggestedQueries: Array.isArray(raw.suggestedQueries) ? raw.suggestedQueries.filter((entry): entry is string => typeof entry === 'string') : undefined,
        totalProducts: raw.totalProducts,
        directSourceCount: typeof raw.directSourceCount === 'number' ? raw.directSourceCount : 0,
        fallbackSourceCount: typeof raw.fallbackSourceCount === 'number' ? raw.fallbackSourceCount : 0,
        sources,
    };
}

function parseInteraction(raw: Record<string, unknown>): SearchInteractionEvent | null {
    if (typeof raw.type !== 'string' || typeof raw.query !== 'string' || typeof raw.generatedAt !== 'string') {
        return null;
    }

    return {
        type: raw.type as SearchInteractionType,
        query: raw.query,
        generatedAt: raw.generatedAt,
        selectedQuery: typeof raw.selectedQuery === 'string' ? raw.selectedQuery : undefined,
        source: typeof raw.source === 'string' ? raw.source as ProductSource : undefined,
        productId: typeof raw.productId === 'string' ? raw.productId : undefined,
        productTitle: typeof raw.productTitle === 'string' ? raw.productTitle : undefined,
        brand: typeof raw.brand === 'string' ? raw.brand : undefined,
        context: typeof raw.context === 'string' ? raw.context : undefined,
    };
}

export async function loadSearchDiagnostics(limit: number = 10): Promise<{
    summary: ReturnType<typeof getSearchDiagnosticsSummary>;
    recent: SearchAggregationDiagnostics[];
    recentInteractions: SearchInteractionEvent[];
    quality: SearchQualitySummary;
    interactionSummary: SearchInteractionSummary;
    storage: 'memory' | 'firestore';
}> {
    const db = getAdminDb();
    if (!db) {
        const recent = getRecentSearchDiagnostics(limit);
        const recentInteractionItems = getRecentSearchInteractions(limit);
        return {
            summary: getSearchDiagnosticsSummary(),
            recent,
            recentInteractions: recentInteractionItems,
            quality: buildSearchQualitySummary(recent),
            interactionSummary: buildSearchInteractionSummary(recentInteractionItems),
            storage: 'memory',
        };
    }

    try {
        const [metaSnap, summarySnap, recentSnap, interactionSnap] = await Promise.all([
            db.collection(META_COLLECTION).doc(META_DOC_ID).get(),
            db.collection(SUMMARY_COLLECTION).get(),
            db.collection(SNAPSHOT_COLLECTION).orderBy('generatedAt', 'desc').limit(Math.max(1, Math.min(limit, MAX_RECENT_SNAPSHOTS))).get(),
            db.collection(INTERACTION_COLLECTION).orderBy('generatedAt', 'desc').limit(Math.max(1, Math.min(limit, MAX_RECENT_INTERACTIONS))).get(),
        ]);

        const metaData = metaSnap.data() || {};
        const sources = summarySnap.docs.map((doc) => {
            const data = doc.data() || {};
            const searches = Number(data.searches || 0);
            const successCount = Number(data.successCount || 0);
            const totalLatencyMs = Number(data.totalLatencyMs || 0);
            const latencySamples = Number(data.latencySamples || 0);

            return {
                source: doc.id as SearchSourceSummary['source'],
                searches,
                successCount,
                directHits: Number(data.directHits || 0),
                fallbackHits: Number(data.fallbackHits || 0),
                emptyHits: Number(data.emptyHits || 0),
                totalItems: Number(data.totalItems || 0),
                totalLatencyMs,
                latencySamples,
                lastSeenAt: typeof data.lastSeenAt === 'string' ? data.lastSeenAt : '',
                lastStrategy: typeof data.lastStrategy === 'string'
                    ? data.lastStrategy as SearchSourceSummary['lastStrategy']
                    : 'empty',
                lastFallbackReason: typeof data.lastFallbackReason === 'string' ? data.lastFallbackReason : undefined,
                avgLatencyMs: latencySamples > 0 ? Math.round(totalLatencyMs / latencySamples) : 0,
                successRate: searches > 0 ? Math.round((successCount / searches) * 1000) / 10 : 0,
                collectionMode: getCollectionMode(doc.id as SearchSourceSummary['source']),
            };
        }).sort((left, right) => {
            const successDiff = right.successRate - left.successRate;
            if (successDiff !== 0) return successDiff;
            return right.totalItems - left.totalItems;
        });

        const recent = recentSnap.docs
            .map((doc) => parseRecentSnapshot(doc.data() as Record<string, unknown>))
            .filter(Boolean) as SearchAggregationDiagnostics[];
        const recentInteractionItems = interactionSnap.docs
            .map((doc) => parseInteraction(doc.data() as Record<string, unknown>))
            .filter(Boolean) as SearchInteractionEvent[];

        return {
            summary: {
                trackedSearches: Number(metaData.trackedSearches || recent.length),
                lastUpdatedAt: typeof metaData.lastUpdatedAt === 'string' ? metaData.lastUpdatedAt : recent[0]?.generatedAt || null,
                sources,
            },
            recent,
            recentInteractions: recentInteractionItems,
            quality: buildSearchQualitySummary(recent),
            interactionSummary: buildSearchInteractionSummary(recentInteractionItems),
            storage: 'firestore',
        };
    } catch (error) {
        console.warn('[SearchDiagnostics] firestore load failed:', error);
        const recent = getRecentSearchDiagnostics(limit);
        const recentInteractionItems = getRecentSearchInteractions(limit);
        return {
            summary: getSearchDiagnosticsSummary(),
            recent,
            recentInteractions: recentInteractionItems,
            quality: buildSearchQualitySummary(recent),
            interactionSummary: buildSearchInteractionSummary(recentInteractionItems),
            storage: 'memory',
        };
    }
}
