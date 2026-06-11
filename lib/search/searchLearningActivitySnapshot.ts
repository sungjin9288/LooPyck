import type { SearchLearningActivityEvent, SearchLearningEntry } from './queryLearningTypes.ts';
import { buildSearchLearningActivityFollowups } from './searchLearningActivityFollowups.ts';
import { buildSearchLearningActivityOpsQueue } from './searchLearningActivityOpsQueue.ts';
import { buildSearchLearningActivityRecommendations } from './searchLearningActivityRecommendations.ts';
import { buildSearchLearningActivitySummary } from './searchLearningActivitySummary.ts';

export type SearchLearningActivitySnapshot = {
    searchLearningActivitySummary: ReturnType<typeof buildSearchLearningActivitySummary>;
    searchLearningActivityRecommendations: ReturnType<typeof buildSearchLearningActivityRecommendations>;
    searchLearningActivityOpsQueue: ReturnType<typeof buildSearchLearningActivityOpsQueue>;
    searchLearningActivityFollowups: ReturnType<typeof buildSearchLearningActivityFollowups>;
};

export function buildSearchLearningActivitySnapshot({
    entries,
    activity,
}: {
    entries: SearchLearningEntry[];
    activity: SearchLearningActivityEvent[];
}): SearchLearningActivitySnapshot {
    const searchLearningActivitySummary = buildSearchLearningActivitySummary(activity);
    const searchLearningActivityRecommendations = buildSearchLearningActivityRecommendations(activity, entries);
    const searchLearningActivityOpsQueue = buildSearchLearningActivityOpsQueue(activity, entries);
    const searchLearningActivityFollowups = buildSearchLearningActivityFollowups(activity, entries);

    return {
        searchLearningActivitySummary,
        searchLearningActivityRecommendations,
        searchLearningActivityOpsQueue,
        searchLearningActivityFollowups,
    };
}
