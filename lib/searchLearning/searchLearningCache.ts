import type { SearchLearningActivityEvent, SearchLearningEntry } from '../search/queryLearningTypes.ts';

const MAX_MEMORY_ENTRIES = 80;
const MAX_MEMORY_ACTIVITY = 120;
export const APPROVED_CACHE_TTL_MS = 5 * 60_000;

const globalSearchLearning = globalThis as typeof globalThis & {
    __loopyckSearchLearningEntries?: Map<string, SearchLearningEntry>;
    __loopyckSearchLearningApprovedCache?: Map<string, { queries: string[]; expiresAt: number }>;
    __loopyckSearchLearningRewritePackCache?: { packs: unknown[]; expiresAt: number };
    __loopyckSearchLearningActivity?: SearchLearningActivityEvent[];
};

export function getMemoryEntries(): Map<string, SearchLearningEntry> {
    if (!globalSearchLearning.__loopyckSearchLearningEntries) {
        globalSearchLearning.__loopyckSearchLearningEntries = new Map();
    }

    return globalSearchLearning.__loopyckSearchLearningEntries;
}

export function getMemoryActivity(): SearchLearningActivityEvent[] {
    if (!globalSearchLearning.__loopyckSearchLearningActivity) {
        globalSearchLearning.__loopyckSearchLearningActivity = [];
    }

    return globalSearchLearning.__loopyckSearchLearningActivity;
}

export function appendMemoryActivity(event: SearchLearningActivityEvent): void {
    const activity = getMemoryActivity();
    activity.unshift(event);
    if (activity.length > MAX_MEMORY_ACTIVITY) {
        activity.splice(MAX_MEMORY_ACTIVITY);
    }
}

export function getApprovedCache(): Map<string, { queries: string[]; expiresAt: number }> {
    if (!globalSearchLearning.__loopyckSearchLearningApprovedCache) {
        globalSearchLearning.__loopyckSearchLearningApprovedCache = new Map();
    }

    return globalSearchLearning.__loopyckSearchLearningApprovedCache;
}

export function getRewritePackCache<T>(): { packs: T[]; expiresAt: number } | null {
    return (globalSearchLearning.__loopyckSearchLearningRewritePackCache as { packs: T[]; expiresAt: number } | undefined) || null;
}

export function setRewritePackCache<T>(packs: T[], expiresAt: number): void {
    globalSearchLearning.__loopyckSearchLearningRewritePackCache = { packs, expiresAt };
}

export function invalidateRewritePackCache(): void {
    delete globalSearchLearning.__loopyckSearchLearningRewritePackCache;
}

export function evictMemoryEntries(entries: Map<string, SearchLearningEntry>): void {
    if (entries.size <= MAX_MEMORY_ENTRIES) {
        return;
    }

    const ordered = Array.from(entries.values()).sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
    entries.clear();
    ordered.slice(0, MAX_MEMORY_ENTRIES).forEach((entry) => {
        entries.set(entry.id, entry);
    });
}

export function resetSearchLearningCache(): void {
    getMemoryEntries().clear();
    getApprovedCache().clear();
    invalidateRewritePackCache();
    getMemoryActivity().splice(0);
}
