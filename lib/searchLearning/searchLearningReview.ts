import { getAdminDb } from '../server/firebaseAdmin.ts';
import { analyzeFashionQuery } from '../search/fashionQueryAssistant.ts';
import type { SearchLearningEntry, SearchLearningStatus } from '../search/queryLearningTypes.ts';
import {
    buildSearchLearningRewritePacks,
    buildSearchLearningRewritePlanForAnalysis,
    type SearchLearningRewritePack,
} from './searchLearningRewritePacks.ts';
import {
    loadApprovedSearchLearningEntries,
    loadSearchLearningEntry,
} from './searchLearningEntryQueryStore.ts';
import { reviewSearchLearningEntry } from './searchLearningEntryMutationStore.ts';
import { SEARCH_LEARNING_COLLECTION } from './searchLearningCollections.ts';
import { recordSearchLearningActivity } from './searchLearningActivityStore.ts';
import {
    APPROVED_CACHE_TTL_MS,
    getApprovedCache,
    getMemoryEntries,
    getRewritePackCache,
    setRewritePackCache,
} from './searchLearningCache.ts';
import { buildSearchLearningDocId, parseEntry, uniqueOrdered } from './searchLearningEntryCodec.ts';

export async function loadApprovedSearchLearningQueries(queries: string[]): Promise<string[]> {
    const normalizedIds = uniqueOrdered(queries.map((query) => buildSearchLearningDocId(query)));
    const now = Date.now();
    const cache = getApprovedCache();
    const cachedQueries = normalizedIds.flatMap((id) => {
        const entry = cache.get(id);
        if (entry && entry.expiresAt > now) {
            return entry.queries;
        }
        return [];
    });

    const missingIds = normalizedIds.filter((id) => {
        const entry = cache.get(id);
        return !entry || entry.expiresAt <= now;
    });

    if (missingIds.length === 0) {
        return uniqueOrdered(cachedQueries);
    }

    const db = getAdminDb();
    if (!db) {
        const memoryQueries = missingIds.flatMap((id) => {
            const entry = getMemoryEntries().get(id);
            return entry?.status === 'approved' ? entry.approvedQueries : [];
        });
        return uniqueOrdered([...cachedQueries, ...memoryQueries]);
    }

    try {
        const refs = missingIds.map((id) => db.collection(SEARCH_LEARNING_COLLECTION).doc(id));
        const docs = await db.getAll(...refs);
        const loadedQueries = docs.flatMap((doc) => {
            if (!doc.exists) {
                return [];
            }
            const entry = parseEntry(doc.id, doc.data() as Record<string, unknown>);
            const approved = entry.status === 'approved' ? entry.approvedQueries : [];
            cache.set(doc.id, { queries: approved, expiresAt: now + APPROVED_CACHE_TTL_MS });
            return approved;
        });

        return uniqueOrdered([...cachedQueries, ...loadedQueries]);
    } catch {
        return uniqueOrdered(cachedQueries);
    }
}

export async function loadApprovedSearchLearningRewritePacks(): Promise<SearchLearningRewritePack[]> {
    const now = Date.now();
    const cached = getRewritePackCache<SearchLearningRewritePack>();
    if (cached && cached.expiresAt > now) {
        return cached.packs;
    }

    const approvedEntries = await loadApprovedSearchLearningEntries();
    const packs = buildSearchLearningRewritePacks(approvedEntries);
    setRewritePackCache(packs, now + APPROVED_CACHE_TTL_MS);
    return packs;
}

export async function loadApprovedSearchLearningRewritePlan(
    analysis: ReturnType<typeof analyzeFashionQuery>
): Promise<Partial<Record<string, string[]>>> {
    if (analysis.semanticClusterIds.length === 0 && analysis.categorySignals.length === 0) {
        return {};
    }

    const packs = await loadApprovedSearchLearningRewritePacks();
    return buildSearchLearningRewritePlanForAnalysis(analysis, packs);
}

export function mergeLearnedQueriesIntoPlan(
    plan: Partial<Record<string, string[]>>,
    learnedQueries: string[]
): Partial<Record<string, string[]>> {
    if (learnedQueries.length === 0) {
        return plan;
    }

    const nextPlan: Partial<Record<string, string[]>> = { ...plan };
    Object.entries(nextPlan).forEach(([source, queries]) => {
        nextPlan[source] = uniqueOrdered([...(queries || []), ...learnedQueries]);
    });

    if (!nextPlan.NAVER) {
        nextPlan.NAVER = learnedQueries;
    }

    return nextPlan;
}

export async function reviewSearchLearningEntries(
    entryIds: string[],
    status: SearchLearningStatus,
    reviewedBy: string,
    options: { context?: string | null } = {}
): Promise<SearchLearningEntry[]> {
    const normalizedIds = uniqueOrdered(entryIds.map((entryId) => entryId.trim()).filter(Boolean)).slice(0, 24);
    if (normalizedIds.length === 0) {
        return [];
    }

    const updatedEntries = await Promise.all(
        normalizedIds.map(async (entryId) => {
            const entry = await loadSearchLearningEntry(entryId);
            if (!entry) {
                return null;
            }

            const approvedQueries = status === 'approved'
                ? uniqueOrdered([
                    ...(entry.aiSuggestion?.suggestedQueries || []),
                    ...entry.approvedQueries,
                    ...entry.suggestedQueries,
                ]).slice(0, 8)
                : [];

            return await reviewSearchLearningEntry(entryId, status, reviewedBy, approvedQueries);
        })
    );

    const entries = updatedEntries.filter((entry): entry is SearchLearningEntry => Boolean(entry));
    if (entries.length > 0) {
        await recordSearchLearningActivity({
            type: 'review_entries',
            context: options.context,
            reviewedStatus: status,
            actorUid: reviewedBy,
            entryIds: entries.map((entry) => entry.id),
            queries: entries.map((entry) => entry.query),
        });
    }

    return entries;
}
