import { getAdminDb } from '../server/firebaseAdmin.ts';
import type {
    SearchLearningActivityEvent,
    SearchLearningActivityFeed,
    SearchLearningActivityType,
    SearchLearningStatus,
} from './queryLearningTypes.ts';
import { appendMemoryActivity, getMemoryActivity } from './searchLearningCache.ts';
import { buildSearchLearningActivityId, uniqueOrdered } from './searchLearningEntryCodec.ts';

const SEARCH_LEARNING_ACTIVITY_COLLECTION = 'searchLearningActivity';

function parseActivityEvent(id: string, raw: Record<string, unknown>): SearchLearningActivityEvent {
    return {
        id,
        type: raw.type === 'seed_queries' || raw.type === 'review_entries' ? raw.type : 'generate_suggestions',
        context: typeof raw.context === 'string' ? raw.context : null,
        reviewedStatus: raw.reviewedStatus === 'approved' || raw.reviewedStatus === 'ignored' || raw.reviewedStatus === 'pending'
            ? raw.reviewedStatus
            : null,
        actorUid: typeof raw.actorUid === 'string' ? raw.actorUid : null,
        count: typeof raw.count === 'number' ? raw.count : 0,
        entryIds: Array.isArray(raw.entryIds) ? raw.entryIds.filter((entry): entry is string => typeof entry === 'string') : [],
        queries: Array.isArray(raw.queries) ? raw.queries.filter((entry): entry is string => typeof entry === 'string') : [],
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : new Date(0).toISOString(),
    };
}

function serializeActivityEvent(event: SearchLearningActivityEvent): Record<string, unknown> {
    return {
        type: event.type,
        context: event.context,
        reviewedStatus: event.reviewedStatus,
        actorUid: event.actorUid,
        count: event.count,
        entryIds: event.entryIds,
        queries: event.queries,
        createdAt: event.createdAt,
    };
}

export async function recordSearchLearningActivity(input: {
    type: SearchLearningActivityType;
    context?: string | null;
    reviewedStatus?: SearchLearningStatus | null;
    actorUid?: string | null;
    entryIds: string[];
    queries: string[];
}): Promise<SearchLearningActivityEvent> {
    const createdAt = new Date().toISOString();
    const event: SearchLearningActivityEvent = {
        id: buildSearchLearningActivityId(input.type, createdAt),
        type: input.type,
        context: input.context || null,
        reviewedStatus: input.reviewedStatus || null,
        actorUid: input.actorUid || null,
        count: Math.max(input.entryIds.length, input.queries.length),
        entryIds: uniqueOrdered(input.entryIds).slice(0, 24),
        queries: uniqueOrdered(input.queries).slice(0, 12),
        createdAt,
    };

    appendMemoryActivity(event);

    const db = getAdminDb();
    if (!db) {
        return event;
    }

    await db.collection(SEARCH_LEARNING_ACTIVITY_COLLECTION).doc(event.id).set(serializeActivityEvent(event), { merge: true });
    return event;
}

export async function loadSearchLearningActivity(limit: number = 20): Promise<SearchLearningActivityFeed> {
    const db = getAdminDb();
    if (!db) {
        return {
            events: getMemoryActivity().slice(0, Math.max(1, Math.min(limit, 40))),
            storage: 'memory',
        };
    }

    const snapshot = await db.collection(SEARCH_LEARNING_ACTIVITY_COLLECTION)
        .orderBy('createdAt', 'desc')
        .limit(Math.max(1, Math.min(limit, 40)))
        .get();

    return {
        events: snapshot.docs.map((doc) => parseActivityEvent(doc.id, doc.data() as Record<string, unknown>)),
        storage: 'firestore',
    };
}
