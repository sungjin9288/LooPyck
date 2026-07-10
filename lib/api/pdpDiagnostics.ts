import { FieldValue } from 'firebase-admin/firestore';
import type { ProductSource } from './types.ts';
import { getAdminDb } from '../server/firebaseAdmin.ts';
import { Logger, toErrorMessage } from '../core/observability.ts';

const MAX_RECENT_EVENTS = 200;
const EVENTS_COLLECTION = 'pdpDiagnosticsEvents';
const SUMMARY_COLLECTION = 'pdpDiagnosticsSourceSummary';
const META_COLLECTION = 'pdpDiagnosticsMeta';
const META_DOC_ID = 'overview';

export type PdpEnrichmentStrategy =
    | 'cache_hit'
    | 'fetched'
    | 'stale_cache_refreshed'
    | 'fetch_failed'
    | 'parse_empty'
    | 'unsupported';

export interface PdpEnrichmentDiagnosticEvent {
    source: ProductSource;
    strategy: PdpEnrichmentStrategy;
    generatedAt: string;
    durationMs: number;
    cacheHit: boolean;
    fetchAttempted: boolean;
    fetchSucceeded: boolean;
    parseSucceeded: boolean;
    reason?: string;
    productId?: string;
    queryContext?: string;
}

type PdpSourceSummaryState = {
    source: ProductSource;
    requests: number;
    cacheHits: number;
    fetchAttempts: number;
    fetchSuccesses: number;
    parseSuccesses: number;
    unsupportedCount: number;
    totalLatencyMs: number;
    latencySamples: number;
    lastSeenAt: string;
    lastStrategy: PdpEnrichmentStrategy;
    lastReason?: string;
};

export type PdpSourceSummary = PdpSourceSummaryState & {
    cacheHitRate: number;
    fetchSuccessRate: number;
    parseSuccessRate: number;
    avgLatencyMs: number;
};

export type PdpDiagnosticsOverview = {
    trackedEvents: number;
    lastUpdatedAt: string | null;
    cacheHitRate: number;
    fetchSuccessRate: number;
    parseSuccessRate: number;
    sources: PdpSourceSummary[];
};

const recentEvents: PdpEnrichmentDiagnosticEvent[] = [];
const sourceSummaryMap = new Map<ProductSource, PdpSourceSummaryState>();

function toSafeDocId(value: string): string {
    return value.replace(/[^\w:-]/g, '_').slice(0, 180);
}

function updateSummary(event: PdpEnrichmentDiagnosticEvent): void {
    const existing = sourceSummaryMap.get(event.source);
    const next: PdpSourceSummaryState = existing
        ? { ...existing }
        : {
            source: event.source,
            requests: 0,
            cacheHits: 0,
            fetchAttempts: 0,
            fetchSuccesses: 0,
            parseSuccesses: 0,
            unsupportedCount: 0,
            totalLatencyMs: 0,
            latencySamples: 0,
            lastSeenAt: event.generatedAt,
            lastStrategy: event.strategy,
        };

    next.requests += 1;
    next.cacheHits += event.cacheHit ? 1 : 0;
    next.fetchAttempts += event.fetchAttempted ? 1 : 0;
    next.fetchSuccesses += event.fetchAttempted && event.fetchSucceeded ? 1 : 0;
    next.parseSuccesses += event.parseSucceeded ? 1 : 0;
    next.unsupportedCount += event.strategy === 'unsupported' ? 1 : 0;
    next.totalLatencyMs += event.durationMs;
    next.latencySamples += 1;
    next.lastSeenAt = event.generatedAt;
    next.lastStrategy = event.strategy;
    next.lastReason = event.reason;

    sourceSummaryMap.set(event.source, next);
}

function serializeEvent(event: PdpEnrichmentDiagnosticEvent): Record<string, unknown> {
    return {
        source: event.source,
        strategy: event.strategy,
        generatedAt: event.generatedAt,
        durationMs: event.durationMs,
        cacheHit: event.cacheHit,
        fetchAttempted: event.fetchAttempted,
        fetchSucceeded: event.fetchSucceeded,
        parseSucceeded: event.parseSucceeded,
        reason: event.reason || null,
        productId: event.productId || null,
        queryContext: event.queryContext || null,
    };
}

function parseEvent(raw: Record<string, unknown>): PdpEnrichmentDiagnosticEvent | null {
    if (
        typeof raw.source !== 'string'
        || typeof raw.strategy !== 'string'
        || typeof raw.generatedAt !== 'string'
        || typeof raw.durationMs !== 'number'
        || typeof raw.cacheHit !== 'boolean'
        || typeof raw.fetchAttempted !== 'boolean'
        || typeof raw.fetchSucceeded !== 'boolean'
        || typeof raw.parseSucceeded !== 'boolean'
    ) {
        return null;
    }

    return {
        source: raw.source as ProductSource,
        strategy: raw.strategy as PdpEnrichmentStrategy,
        generatedAt: raw.generatedAt,
        durationMs: raw.durationMs,
        cacheHit: raw.cacheHit,
        fetchAttempted: raw.fetchAttempted,
        fetchSucceeded: raw.fetchSucceeded,
        parseSucceeded: raw.parseSucceeded,
        reason: typeof raw.reason === 'string' ? raw.reason : undefined,
        productId: typeof raw.productId === 'string' ? raw.productId : undefined,
        queryContext: typeof raw.queryContext === 'string' ? raw.queryContext : undefined,
    };
}

function enrichSummary(state: PdpSourceSummaryState): PdpSourceSummary {
    const boundedFetchSuccesses = Math.min(state.fetchSuccesses, state.fetchAttempts);
    return {
        ...state,
        cacheHitRate: state.requests > 0 ? Math.round((state.cacheHits / state.requests) * 1000) / 10 : 0,
        fetchSuccessRate: state.fetchAttempts > 0 ? Math.round((boundedFetchSuccesses / state.fetchAttempts) * 1000) / 10 : 0,
        parseSuccessRate: state.requests > 0 ? Math.round((state.parseSuccesses / state.requests) * 1000) / 10 : 0,
        avgLatencyMs: state.latencySamples > 0 ? Math.round(state.totalLatencyMs / state.latencySamples) : 0,
    };
}

export function recordPdpDiagnostics(events: PdpEnrichmentDiagnosticEvent[]): void {
    events.forEach((event) => {
        recentEvents.unshift(event);
        updateSummary(event);
    });

    if (recentEvents.length > MAX_RECENT_EVENTS) {
        recentEvents.length = MAX_RECENT_EVENTS;
    }
}

export function getPdpDiagnosticsSummary(): PdpDiagnosticsOverview {
    const sources = Array.from(sourceSummaryMap.values())
        .map(enrichSummary)
        .sort((left, right) => right.requests - left.requests || left.source.localeCompare(right.source));

    const totalRequests = sources.reduce((sum, source) => sum + source.requests, 0);
    const totalCacheHits = sources.reduce((sum, source) => sum + source.cacheHits, 0);
    const totalFetchAttempts = sources.reduce((sum, source) => sum + source.fetchAttempts, 0);
    const totalFetchSuccesses = sources.reduce((sum, source) => sum + Math.min(source.fetchSuccesses, source.fetchAttempts), 0);
    const totalParseSuccesses = sources.reduce((sum, source) => sum + source.parseSuccesses, 0);

    return {
        trackedEvents: recentEvents.length,
        lastUpdatedAt: recentEvents[0]?.generatedAt || null,
        cacheHitRate: totalRequests > 0 ? Math.round((totalCacheHits / totalRequests) * 1000) / 10 : 0,
        fetchSuccessRate: totalFetchAttempts > 0 ? Math.round((totalFetchSuccesses / totalFetchAttempts) * 1000) / 10 : 0,
        parseSuccessRate: totalRequests > 0 ? Math.round((totalParseSuccesses / totalRequests) * 1000) / 10 : 0,
        sources,
    };
}

export function getRecentPdpDiagnostics(limit: number = 20): PdpEnrichmentDiagnosticEvent[] {
    return recentEvents.slice(0, Math.max(1, Math.min(limit, MAX_RECENT_EVENTS)));
}

export function resetPdpDiagnostics(): void {
    recentEvents.length = 0;
    sourceSummaryMap.clear();
}

type PersistResult = {
    enabled: boolean;
    persisted: boolean;
};

export async function persistPdpDiagnostics(events: PdpEnrichmentDiagnosticEvent[]): Promise<PersistResult> {
    const db = getAdminDb();
    if (!db || events.length === 0) {
        return { enabled: Boolean(db), persisted: false };
    }

    const batch = db.batch();

    events.forEach((event) => {
        const eventId = toSafeDocId(`${event.generatedAt}_${event.source}_${event.productId || event.strategy}`);
        const eventRef = db.collection(EVENTS_COLLECTION).doc(eventId);
        batch.set(eventRef, {
            ...serializeEvent(event),
            createdAt: FieldValue.serverTimestamp(),
        }, { merge: true });

        const summaryRef = db.collection(SUMMARY_COLLECTION).doc(event.source);
        batch.set(summaryRef, {
            source: event.source,
            requests: FieldValue.increment(1),
            cacheHits: FieldValue.increment(event.cacheHit ? 1 : 0),
            fetchAttempts: FieldValue.increment(event.fetchAttempted ? 1 : 0),
            fetchSuccesses: FieldValue.increment(event.fetchAttempted && event.fetchSucceeded ? 1 : 0),
            parseSuccesses: FieldValue.increment(event.parseSucceeded ? 1 : 0),
            unsupportedCount: FieldValue.increment(event.strategy === 'unsupported' ? 1 : 0),
            totalLatencyMs: FieldValue.increment(event.durationMs),
            latencySamples: FieldValue.increment(1),
            lastSeenAt: event.generatedAt,
            lastStrategy: event.strategy,
            lastReason: event.reason || null,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    });

    const metaRef = db.collection(META_COLLECTION).doc(META_DOC_ID);
    batch.set(metaRef, {
        trackedEvents: FieldValue.increment(events.length),
        lastUpdatedAt: events[0]?.generatedAt || null,
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    await batch.commit();
    return { enabled: true, persisted: true };
}

export async function loadPdpDiagnostics(limit: number = 20): Promise<{
    summary: PdpDiagnosticsOverview;
    recent: PdpEnrichmentDiagnosticEvent[];
    storage: 'memory' | 'firestore';
}> {
    const db = getAdminDb();
    if (!db) {
        return {
            summary: getPdpDiagnosticsSummary(),
            recent: getRecentPdpDiagnostics(limit),
            storage: 'memory',
        };
    }

    try {
        const [metaSnap, summarySnap, recentSnap] = await Promise.all([
            db.collection(META_COLLECTION).doc(META_DOC_ID).get(),
            db.collection(SUMMARY_COLLECTION).get(),
            db.collection(EVENTS_COLLECTION).orderBy('generatedAt', 'desc').limit(Math.max(1, Math.min(limit, MAX_RECENT_EVENTS))).get(),
        ]);

        const metaData = metaSnap.data() || {};
        const sources = summarySnap.docs
            .map((doc) => {
                const data = doc.data() || {};
                const state: PdpSourceSummaryState = {
                    source: doc.id as ProductSource,
                    requests: Number(data.requests || 0),
                    cacheHits: Number(data.cacheHits || 0),
                    fetchAttempts: Number(data.fetchAttempts || 0),
                    fetchSuccesses: Number(data.fetchSuccesses || 0),
                    parseSuccesses: Number(data.parseSuccesses || 0),
                    unsupportedCount: Number(data.unsupportedCount || 0),
                    totalLatencyMs: Number(data.totalLatencyMs || 0),
                    latencySamples: Number(data.latencySamples || 0),
                    lastSeenAt: typeof data.lastSeenAt === 'string' ? data.lastSeenAt : '',
                    lastStrategy: typeof data.lastStrategy === 'string' ? data.lastStrategy as PdpEnrichmentStrategy : 'unsupported',
                    lastReason: typeof data.lastReason === 'string' ? data.lastReason : undefined,
                };

                return enrichSummary(state);
            })
            .sort((left, right) => right.requests - left.requests || left.source.localeCompare(right.source));
        const recent = recentSnap.docs
            .map((doc) => parseEvent(doc.data() as Record<string, unknown>))
            .filter(Boolean) as PdpEnrichmentDiagnosticEvent[];

        const totalRequests = sources.reduce((sum, source) => sum + source.requests, 0);
        const totalCacheHits = sources.reduce((sum, source) => sum + source.cacheHits, 0);
        const totalFetchAttempts = sources.reduce((sum, source) => sum + source.fetchAttempts, 0);
        const totalFetchSuccesses = sources.reduce((sum, source) => sum + Math.min(source.fetchSuccesses, source.fetchAttempts), 0);
        const totalParseSuccesses = sources.reduce((sum, source) => sum + source.parseSuccesses, 0);

        return {
            summary: {
                trackedEvents: Number(metaData.trackedEvents || recent.length),
                lastUpdatedAt: typeof metaData.lastUpdatedAt === 'string' ? metaData.lastUpdatedAt : recent[0]?.generatedAt || null,
                cacheHitRate: totalRequests > 0 ? Math.round((totalCacheHits / totalRequests) * 1000) / 10 : 0,
                fetchSuccessRate: totalFetchAttempts > 0 ? Math.round((totalFetchSuccesses / totalFetchAttempts) * 1000) / 10 : 0,
                parseSuccessRate: totalRequests > 0 ? Math.round((totalParseSuccesses / totalRequests) * 1000) / 10 : 0,
                sources,
            },
            recent,
            storage: 'firestore',
        };
    } catch (error) {
        Logger.warn('[PdpDiagnostics] firestore load failed', { error: toErrorMessage(error) });
        return {
            summary: getPdpDiagnosticsSummary(),
            recent: getRecentPdpDiagnostics(limit),
            storage: 'memory',
        };
    }
}
