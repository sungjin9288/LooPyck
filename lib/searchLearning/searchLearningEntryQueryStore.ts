import { getAdminDb } from '../server/firebaseAdmin.ts';
import type { SearchLearningEntry, SearchLearningQueue } from '../search/queryLearningTypes.ts';
import { getMemoryEntries } from './searchLearningCache.ts';
import { SEARCH_LEARNING_COLLECTION } from './searchLearningCollections.ts';
import { parseEntry } from './searchLearningEntryCodec.ts';

function summarizeEntries(entries: SearchLearningEntry[]): SearchLearningQueue['summary'] {
    return {
        total: entries.length,
        pending: entries.filter((entry) => entry.status === 'pending').length,
        approved: entries.filter((entry) => entry.status === 'approved').length,
        ignored: entries.filter((entry) => entry.status === 'ignored').length,
        zeroResult: entries.filter((entry) => entry.zeroResultCount > 0).length,
    };
}

export async function loadSearchLearningEntry(entryId: string): Promise<SearchLearningEntry | null> {
    const memory = getMemoryEntries().get(entryId);
    const db = getAdminDb();
    if (!db) {
        return memory || null;
    }

    const snapshot = await db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId).get();
    if (!snapshot.exists) {
        return memory || null;
    }

    return parseEntry(snapshot.id, snapshot.data() as Record<string, unknown>);
}

export async function loadSearchLearningQueue(limit: number = 20): Promise<SearchLearningQueue> {
    const db = getAdminDb();
    if (!db) {
        const entries = Array.from(getMemoryEntries().values())
            .sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt))
            .slice(0, limit);
        return {
            entries,
            summary: summarizeEntries(entries),
            storage: 'memory',
        };
    }

    const snapshot = await db.collection(SEARCH_LEARNING_COLLECTION)
        .orderBy('lastSeenAt', 'desc')
        .limit(Math.max(1, Math.min(limit, 80)))
        .get();

    const entries = snapshot.docs.map((doc) => parseEntry(doc.id, doc.data() as Record<string, unknown>));
    return {
        entries,
        summary: summarizeEntries(entries),
        storage: 'firestore',
    };
}

export async function loadApprovedSearchLearningEntries(): Promise<SearchLearningEntry[]> {
    const db = getAdminDb();
    if (!db) {
        return Array.from(getMemoryEntries().values()).filter((entry) => entry.status === 'approved' && entry.approvedQueries.length > 0);
    }

    const snapshot = await db.collection(SEARCH_LEARNING_COLLECTION)
        .where('status', '==', 'approved')
        .limit(120)
        .get();

    return snapshot.docs
        .map((doc) => parseEntry(doc.id, doc.data() as Record<string, unknown>))
        .filter((entry) => entry.approvedQueries.length > 0);
}
