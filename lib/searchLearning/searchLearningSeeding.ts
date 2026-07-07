import { FieldValue } from 'firebase-admin/firestore';
import type { SearchAggregationDiagnostics } from '../api/realtimeAggregator.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';
import { getAdminDb } from '../server/firebaseAdmin.ts';
import { analyzeFashionQuery, buildSourceAwareSearchPlan } from '../search/fashionQueryAssistant.ts';
import type { SearchLearningEntry } from '../search/queryLearningTypes.ts';
import {
    loadSearchLearningEntry,
} from './searchLearningEntryQueryStore.ts';
import { SEARCH_LEARNING_COLLECTION } from './searchLearningCollections.ts';
import { recordSearchLearningActivity } from './searchLearningActivityStore.ts';
import { evictMemoryEntries, getMemoryEntries } from './searchLearningCache.ts';
import {
    buildSearchLearningDocId,
    mergeEntry,
    normalizeSearchLearningQuery,
    parseEntry,
    serializeEntry,
    shouldRecordSnapshot,
    uniqueOrdered,
} from './searchLearningEntryCodec.ts';

function buildSeedEntry(query: string, timestamp: string): SearchLearningEntry {
    const analysis = analyzeFashionQuery(query);
    const plan = buildSourceAwareSearchPlan(analysis);
    const suggestedQueries = uniqueOrdered([
        analysis.normalizedQuery || analysis.originalQuery,
        ...(plan.NAVER || []),
        ...analysis.suggestedQueries,
    ]).slice(0, 8);

    return {
        id: buildSearchLearningDocId(query),
        query,
        normalizedQuery: normalizeSearchLearningQuery(query),
        effectiveQuery: analysis.normalizedQuery || normalizeSearchLearningQuery(query),
        queryIntent: analysis.intent,
        status: 'pending',
        occurrenceCount: 1,
        lowFitCount: 1,
        zeroResultCount: 1,
        lastResultQuality: 'weak',
        lastTotalProducts: 0,
        suggestedQueries,
        approvedQueries: [],
        aiSuggestion: null,
        approvalBaseline: null,
        lastSeenAt: timestamp,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: timestamp,
        updatedAt: timestamp,
    };
}

function mergeSeedEntry(existing: SearchLearningEntry | undefined, query: string, timestamp: string): SearchLearningEntry {
    const seed = buildSeedEntry(query, timestamp);
    if (!existing) {
        return seed;
    }

    return {
        ...existing,
        query,
        normalizedQuery: seed.normalizedQuery,
        effectiveQuery: seed.effectiveQuery,
        queryIntent: seed.queryIntent || existing.queryIntent,
        occurrenceCount: existing.occurrenceCount + 1,
        lowFitCount: existing.lowFitCount + 1,
        zeroResultCount: existing.zeroResultCount + 1,
        lastResultQuality: 'weak',
        lastTotalProducts: 0,
        suggestedQueries: uniqueOrdered([...(existing.suggestedQueries || []), ...seed.suggestedQueries]).slice(0, 8),
        lastSeenAt: timestamp,
        updatedAt: timestamp,
    };
}

export function recordSearchLearningCandidate(snapshot: SearchAggregationDiagnostics): void {
    if (!shouldRecordSnapshot(snapshot)) {
        return;
    }

    const entries = getMemoryEntries();
    const id = buildSearchLearningDocId(snapshot.query);
    const next = mergeEntry(entries.get(id), snapshot);
    entries.set(id, next);
    evictMemoryEntries(entries);
}

export async function persistSearchLearningCandidate(
    snapshot: SearchAggregationDiagnostics
): Promise<{ enabled: boolean; persisted: boolean }> {
    if (!shouldRecordSnapshot(snapshot)) {
        return { enabled: true, persisted: false };
    }

    const db = getAdminDb();
    if (!db) {
        return { enabled: false, persisted: false };
    }

    const id = buildSearchLearningDocId(snapshot.query);
    const ref = db.collection(SEARCH_LEARNING_COLLECTION).doc(id);
    await db.runTransaction(async (transaction) => {
        const existingSnap = await transaction.get(ref);
        const existing = existingSnap.exists ? parseEntry(existingSnap.id, existingSnap.data() as Record<string, unknown>) : undefined;
        const next = mergeEntry(existing, snapshot);
        transaction.set(ref, {
            ...serializeEntry(next),
            createdAt: existing?.createdAt || snapshot.generatedAt,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    });

    return { enabled: true, persisted: true };
}

export async function seedSearchLearningEntries(
    queries: string[],
    options: { context?: string | null; actorUid?: string | null } = {}
): Promise<SearchLearningEntry[]> {
    const normalizedQueries = uniqueOrdered(
        queries.map((query) => normalizeTitle(query).trim()).filter(Boolean)
    ).slice(0, 24);

    if (normalizedQueries.length === 0) {
        return [];
    }

    const timestamp = new Date().toISOString();
    const memory = getMemoryEntries();
    const db = getAdminDb();

    const updatedEntries = await Promise.all(
        normalizedQueries.map(async (query) => {
            const entryId = buildSearchLearningDocId(query);
            const existing = await loadSearchLearningEntry(entryId);
            const next = mergeSeedEntry(existing || memory.get(entryId), query, timestamp);

            memory.set(entryId, next);
            evictMemoryEntries(memory);

            if (!db) {
                return next;
            }

            await db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId).set({
                ...serializeEntry(next),
                createdAt: existing?.createdAt || timestamp,
                updatedAt: FieldValue.serverTimestamp(),
            }, { merge: true });

            return await loadSearchLearningEntry(entryId);
        })
    );

    const entries = updatedEntries.filter((entry): entry is SearchLearningEntry => Boolean(entry));
    if (entries.length > 0) {
        await recordSearchLearningActivity({
            type: 'seed_queries',
            context: options.context,
            actorUid: options.actorUid,
            entryIds: entries.map((entry) => entry.id),
            queries: entries.map((entry) => entry.query),
        });
    }

    return entries;
}
