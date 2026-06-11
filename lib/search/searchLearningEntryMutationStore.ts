import { FieldValue } from 'firebase-admin/firestore';
import { getAdminDb } from '../server/firebaseAdmin.ts';
import type { SearchLearningStatus, SearchLearningSuggestion } from './queryLearningTypes.ts';
import {
    getApprovedCache,
    getMemoryEntries,
    invalidateRewritePackCache,
    resetSearchLearningCache,
} from './searchLearningCache.ts';
import {
    buildApprovalBaseline,
    serializeApprovalBaseline,
    serializeEntry,
    serializeSuggestion,
    uniqueOrdered,
} from './searchLearningEntryCodec.ts';
import { SEARCH_LEARNING_COLLECTION } from './searchLearningCollections.ts';
import { loadSearchLearningEntry } from './searchLearningEntryQueryStore.ts';

export async function saveSearchLearningEntryRecord(
    entryId: string,
    entry: Parameters<typeof serializeEntry>[0],
    createdAt: string | null | undefined = entry.createdAt
): Promise<void> {
    const db = getAdminDb();
    if (!db) {
        return;
    }

    await db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId).set({
        ...serializeEntry(entry),
        createdAt: createdAt || entry.createdAt,
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
}

export async function saveSearchLearningSuggestion(
    entryId: string,
    suggestion: SearchLearningSuggestion
) {
    const entries = getMemoryEntries();
    const memoryEntry = entries.get(entryId);
    if (memoryEntry) {
        entries.set(entryId, {
            ...memoryEntry,
            aiSuggestion: suggestion,
            updatedAt: new Date().toISOString(),
        });
    }

    const db = getAdminDb();
    if (!db) {
        return entries.get(entryId) || null;
    }

    await db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId).set({
        aiSuggestion: serializeSuggestion(suggestion),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return await loadSearchLearningEntry(entryId);
}

export async function reviewSearchLearningEntry(
    entryId: string,
    status: SearchLearningStatus,
    reviewedBy: string,
    approvedQueries: string[] = []
) {
    const reviewedAt = new Date().toISOString();
    const nextApprovedQueries = status === 'approved' ? uniqueOrdered(approvedQueries).slice(0, 8) : [];
    const cache = getApprovedCache();
    cache.delete(entryId);
    invalidateRewritePackCache();

    const entries = getMemoryEntries();
    const memoryEntry = entries.get(entryId);
    const currentEntry = memoryEntry || await loadSearchLearningEntry(entryId);
    const approvalBaseline = status === 'approved'
        ? (currentEntry?.approvalBaseline || buildApprovalBaseline(currentEntry || {
            occurrenceCount: 0,
            lowFitCount: 0,
            zeroResultCount: 0,
        }, reviewedAt))
        : null;

    if (memoryEntry) {
        entries.set(entryId, {
            ...memoryEntry,
            status,
            approvedQueries: nextApprovedQueries,
            reviewedAt,
            reviewedBy,
            approvalBaseline,
            updatedAt: reviewedAt,
        });
    }

    const db = getAdminDb();
    if (!db) {
        return entries.get(entryId) || null;
    }

    await db.collection(SEARCH_LEARNING_COLLECTION).doc(entryId).set({
        status,
        approvedQueries: nextApprovedQueries,
        reviewedAt,
        reviewedBy,
        approvalBaseline: serializeApprovalBaseline(approvalBaseline),
        updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });

    return await loadSearchLearningEntry(entryId);
}

export function resetSearchLearningEntries(): void {
    resetSearchLearningCache();
}
