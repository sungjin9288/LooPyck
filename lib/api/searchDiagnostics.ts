import type { SearchAggregationDiagnostics, SearchSourceDiagnostic } from './realtimeAggregator.ts';
import type { UnifiedProduct } from './types.ts';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../server/firebaseAdmin.ts';
import type { ProductSource } from './types.ts';
import { groupProducts } from '../product/productMatching.ts';
import { getGroupPurchaseMetrics } from '../product/purchasePricing.ts';
import { analyzeVariantAlignment } from '../product/variantAlignment.ts';
import { Logger, toErrorMessage } from '../core/observability.ts';

const MAX_RECENT_SNAPSHOTS = 120;
const MAX_RECENT_INTERACTIONS = 200;
/** 소스별 최근 성공/실패 롤링 윈도우 상한 — lifetime 누적치와 달리 "지금" 상태를 반영 */
const MAX_RECENT_OUTCOMES = 20;
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
    compareReadyRatio: number;
    priceSpreadCaptureRate: number;
    optionMatchPrecision: number;
    avgCapturedPriceSpread: number;
    maxCapturedPriceSpread: number;
};

export type SearchComparisonSnapshot = {
    totalGroups: number;
    comparableGroupCount: number;
    compareReadyGroupCount: number;
    spreadCapturedGroupCount: number;
    capturedPriceSpreadTotal: number;
    maxCapturedPriceSpread: number;
    verifiedOptionGroupCount: number;
    preciseOptionGroupCount: number;
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
    /** direct 성공 시 0 리셋, empty 시 +1 — "되다가 죽은 소스" 감지용 */
    consecutiveEmptyHits?: number;
    lastDirectHitAt?: string;
    /** 최근 최대 MAX_RECENT_OUTCOMES회의 0/1 결과, append-newest-last.
     *  스트릭(consecutiveEmptyHits)과 동일한 성공/실패 판정 규칙을 따른다:
     *  direct 성공(및 NAVER의 strategy=api 성공) → 1, empty → 0, 그 외(fallback 등)는 미변경 */
    recentOutcomes?: number[];
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

/** strategy에서 direct 성공 여부를 판정한다 (스트릭/윈도우 공통 규칙) */
function isDirectStrategy(strategy: SearchSourceDiagnostic['strategy']): boolean {
    return strategy === 'direct' || strategy === 'direct_preferred_over_naver';
}

/** NAVER는 strategy='direct'가 아니라 'api'로 성공을 표현한다 — 이 소스만의 성공 신호 */
function isApiStrategySuccess(strategy: SearchSourceDiagnostic['strategy']): boolean {
    return strategy === 'api';
}

/** recentOutcomes에 최신값을 append하고 MAX_RECENT_OUTCOMES로 캡핑한다 (오래된 값부터 버림) */
function appendRecentOutcome(existing: number[] | undefined, outcome: 0 | 1): number[] {
    const next = existing ? [...existing, outcome] : [outcome];
    return next.length > MAX_RECENT_OUTCOMES
        ? next.slice(next.length - MAX_RECENT_OUTCOMES)
        : next;
}

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

    const isDirectHit = isDirectStrategy(sourceDiagnostic.strategy);
    const isEmptyHit = sourceDiagnostic.strategy === 'empty';
    const isRecentWindowSuccess = isDirectHit || isApiStrategySuccess(sourceDiagnostic.strategy);

    nextState.searches += 1;
    nextState.successCount += sourceDiagnostic.success ? 1 : 0;
    nextState.directHits += isDirectHit ? 1 : 0;
    nextState.fallbackHits += sourceDiagnostic.strategy === 'naver_classified_fallback' || sourceDiagnostic.strategy === 'classified_naver' ? 1 : 0;
    nextState.emptyHits += isEmptyHit ? 1 : 0;
    nextState.totalItems += sourceDiagnostic.finalCount;

    if (isDirectHit) {
        nextState.consecutiveEmptyHits = 0;
        nextState.lastDirectHitAt = snapshot.generatedAt;
    } else if (isEmptyHit) {
        nextState.consecutiveEmptyHits = (nextState.consecutiveEmptyHits ?? 0) + 1;
    }

    // 최근 성공/실패 윈도우: 스트릭과 동일한 규칙(direct/api 성공 → 1, empty → 0, fallback 등은 미변경)
    if (isRecentWindowSuccess) {
        nextState.recentOutcomes = appendRecentOutcome(nextState.recentOutcomes, 1);
    } else if (isEmptyHit) {
        nextState.recentOutcomes = appendRecentOutcome(nextState.recentOutcomes, 0);
    }

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

function toRate(numerator: number, denominator: number): number {
    if (denominator <= 0) {
        return 0;
    }

    return Math.round((numerator / denominator) * 1000) / 10;
}

export function buildSearchComparisonSnapshot(products: UnifiedProduct[]): SearchComparisonSnapshot {
    const groups = groupProducts(products);
    const comparableGroups = groups.filter((group) => group.mallCount > 1);
    const compareReadyGroups = comparableGroups.filter((group) => group.matchConfidence >= 0.72);

    let spreadCapturedGroupCount = 0;
    let capturedPriceSpreadTotal = 0;
    let maxCapturedPriceSpread = 0;
    let verifiedOptionGroupCount = 0;
    let preciseOptionGroupCount = 0;

    compareReadyGroups.forEach((group) => {
        const metrics = getGroupPurchaseMetrics(group);
        const priceSpread = Number.isFinite(metrics.lowestCheckoutPrice) && Number.isFinite(metrics.highestCheckoutPrice)
            ? Math.max(0, metrics.highestCheckoutPrice - metrics.lowestCheckoutPrice)
            : 0;
        if (priceSpread > 0) {
            spreadCapturedGroupCount += 1;
            capturedPriceSpreadTotal += priceSpread;
            maxCapturedPriceSpread = Math.max(maxCapturedPriceSpread, priceSpread);
        }

        const alignment = analyzeVariantAlignment(group.variants);
        if (alignment.verifiedOptionCount >= 2) {
            verifiedOptionGroupCount += 1;
            if (alignment.overlapLevel !== 'none') {
                preciseOptionGroupCount += 1;
            }
        }
    });

    return {
        totalGroups: groups.length,
        comparableGroupCount: comparableGroups.length,
        compareReadyGroupCount: compareReadyGroups.length,
        spreadCapturedGroupCount,
        capturedPriceSpreadTotal,
        maxCapturedPriceSpread,
        verifiedOptionGroupCount,
        preciseOptionGroupCount,
    };
}

export function buildSearchQualitySummary(snapshots: SearchAggregationDiagnostics[]): SearchQualitySummary {
    const strong = snapshots.filter((snapshot) => snapshot.resultQuality === 'strong').length;
    const mixed = snapshots.filter((snapshot) => snapshot.resultQuality === 'mixed').length;
    const weak = snapshots.filter((snapshot) => snapshot.resultQuality === 'weak' || snapshot.totalProducts === 0).length;
    const sampleCount = snapshots.length || 1;
    const strongMatches = snapshots.reduce((sum, snapshot) => sum + (snapshot.strongMatchCount || 0), 0);
    const exactMatches = snapshots.reduce((sum, snapshot) => sum + (snapshot.exactMatchCount || 0), 0);
    const totalGroups = snapshots.reduce((sum, snapshot) => sum + (snapshot.totalGroups || 0), 0);
    const compareReadyGroups = snapshots.reduce((sum, snapshot) => sum + (snapshot.compareReadyGroupCount || 0), 0);
    const spreadCapturedGroups = snapshots.reduce((sum, snapshot) => sum + (snapshot.spreadCapturedGroupCount || 0), 0);
    const capturedPriceSpreadTotal = snapshots.reduce((sum, snapshot) => sum + (snapshot.capturedPriceSpreadTotal || 0), 0);
    const maxCapturedPriceSpread = snapshots.reduce((max, snapshot) => Math.max(max, snapshot.maxCapturedPriceSpread || 0), 0);
    const verifiedOptionGroups = snapshots.reduce((sum, snapshot) => sum + (snapshot.verifiedOptionGroupCount || 0), 0);
    const preciseOptionGroups = snapshots.reduce((sum, snapshot) => sum + (snapshot.preciseOptionGroupCount || 0), 0);

    return {
        strong,
        mixed,
        weak,
        lowFitShare: Math.round(((weak + mixed) / sampleCount) * 1000) / 10,
        avgStrongMatches: Math.round((strongMatches / sampleCount) * 10) / 10,
        avgExactMatches: Math.round((exactMatches / sampleCount) * 10) / 10,
        compareReadyRatio: toRate(compareReadyGroups, totalGroups),
        priceSpreadCaptureRate: toRate(spreadCapturedGroups, compareReadyGroups),
        optionMatchPrecision: toRate(preciseOptionGroups, verifiedOptionGroups),
        avgCapturedPriceSpread: spreadCapturedGroups > 0 ? Math.round(capturedPriceSpreadTotal / spreadCapturedGroups) : 0,
        maxCapturedPriceSpread,
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
        totalGroups: snapshot.totalGroups ?? null,
        comparableGroupCount: snapshot.comparableGroupCount ?? null,
        compareReadyGroupCount: snapshot.compareReadyGroupCount ?? null,
        spreadCapturedGroupCount: snapshot.spreadCapturedGroupCount ?? null,
        capturedPriceSpreadTotal: snapshot.capturedPriceSpreadTotal ?? null,
        maxCapturedPriceSpread: snapshot.maxCapturedPriceSpread ?? null,
        verifiedOptionGroupCount: snapshot.verifiedOptionGroupCount ?? null,
        preciseOptionGroupCount: snapshot.preciseOptionGroupCount ?? null,
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

/** Firestore 문서에서 recentOutcomes(0/1 배열)를 안전하게 파싱한다 — 외부 데이터이므로 값 검증 필수 */
function parseRecentOutcomes(data: Record<string, unknown> | undefined): number[] | undefined {
    if (!data || !Array.isArray(data.recentOutcomes)) {
        return undefined;
    }

    return data.recentOutcomes.filter((value): value is 0 | 1 => value === 0 || value === 1);
}

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

    // recentOutcomes는 최대 20개로 캡핑된 배열이라 FieldValue.increment/arrayUnion으로 표현할 수
    // 없다(arrayUnion은 0/1 중복값을 dedupe해버림). 기존 값을 읽어 in-memory와 동일한 append+cap
    // 규칙을 적용한 뒤 그대로 덮어쓴다. 소스 수만큼 read가 늘지만 이 엔드포인트는 admin 진단용
    // 호출 빈도이지 hot path가 아니므로 허용 범위 — 병렬로 1회씩만 조회한다.
    const summaryRefs = snapshot.sources.map((source) => db.collection(SUMMARY_COLLECTION).doc(source.source));
    const existingSummaryDocs = await Promise.all(summaryRefs.map((ref) => ref.get()));

    snapshot.sources.forEach((source, index) => {
        const summaryRef = summaryRefs[index];
        const isDirectHit = isDirectStrategy(source.strategy);
        const isFallbackHit = source.strategy === 'naver_classified_fallback' || source.strategy === 'classified_naver';
        const isEmpty = source.strategy === 'empty';
        const isRecentWindowSuccess = isDirectHit || isApiStrategySuccess(source.strategy);

        const summaryPayload: Record<string, unknown> = {
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
        };

        // 헬스 판정용 스트릭: direct 성공 시 0 리셋, empty 시 +1, 그 외엔 미변경
        if (isDirectHit) {
            summaryPayload.consecutiveEmptyHits = 0;
            summaryPayload.lastDirectHitAt = snapshot.generatedAt;
        } else if (isEmpty) {
            summaryPayload.consecutiveEmptyHits = FieldValue.increment(1);
        }

        // 최근 성공/실패 윈도우: in-memory updateSourceSummary와 동일한 규칙(NAVER misclassification
        // 버그 재발 방지를 위해 두 경로의 성공/실패 판정 로직을 반드시 일치시킨다)
        const existingRecentOutcomes = parseRecentOutcomes(existingSummaryDocs[index].data());
        if (isRecentWindowSuccess) {
            summaryPayload.recentOutcomes = appendRecentOutcome(existingRecentOutcomes, 1);
        } else if (isEmpty) {
            summaryPayload.recentOutcomes = appendRecentOutcome(existingRecentOutcomes, 0);
        }

        batch.set(summaryRef, summaryPayload, { merge: true });
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
        totalGroups: typeof raw.totalGroups === 'number' ? raw.totalGroups : undefined,
        comparableGroupCount: typeof raw.comparableGroupCount === 'number' ? raw.comparableGroupCount : undefined,
        compareReadyGroupCount: typeof raw.compareReadyGroupCount === 'number' ? raw.compareReadyGroupCount : undefined,
        spreadCapturedGroupCount: typeof raw.spreadCapturedGroupCount === 'number' ? raw.spreadCapturedGroupCount : undefined,
        capturedPriceSpreadTotal: typeof raw.capturedPriceSpreadTotal === 'number' ? raw.capturedPriceSpreadTotal : undefined,
        maxCapturedPriceSpread: typeof raw.maxCapturedPriceSpread === 'number' ? raw.maxCapturedPriceSpread : undefined,
        verifiedOptionGroupCount: typeof raw.verifiedOptionGroupCount === 'number' ? raw.verifiedOptionGroupCount : undefined,
        preciseOptionGroupCount: typeof raw.preciseOptionGroupCount === 'number' ? raw.preciseOptionGroupCount : undefined,
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
                consecutiveEmptyHits: Number(data.consecutiveEmptyHits || 0),
                lastDirectHitAt: typeof data.lastDirectHitAt === 'string' ? data.lastDirectHitAt : undefined,
                recentOutcomes: parseRecentOutcomes(data),
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
        Logger.warn('[SearchDiagnostics] firestore load failed', { error: toErrorMessage(error) });
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
