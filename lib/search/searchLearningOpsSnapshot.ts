import type { SearchLearningActivityEvent, SearchLearningEntry } from './queryLearningTypes.ts';
import type { SearchLearningActivityFollowupSummary } from './searchLearningActivityFollowups.ts';
import type { SearchLearningActivityOpsQueueSummary } from './searchLearningActivityOpsQueue.ts';
import type { SearchLearningActivityRecommendationSummary } from './searchLearningActivityRecommendations.ts';
import { buildSearchLearningOpsCenter } from './searchLearningOpsCenter.ts';
import { buildSearchLearningOpsCompletionActions } from './searchLearningOpsCompletionActions.ts';
import { buildSearchLearningOpsCompletionActivity } from './searchLearningOpsCompletionActivity.ts';
import { buildSearchLearningOpsCompletionOutcomes } from './searchLearningOpsCompletionOutcomes.ts';
import { buildSearchLearningOpsCompletionQueue } from './searchLearningOpsCompletionQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationActivity } from './searchLearningOpsCompletionRecommendationActivity.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationActivity } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueue } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendations } from './searchLearningOpsCompletionRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomes } from './searchLearningOpsCompletionRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionRecommendationQueue } from './searchLearningOpsCompletionRecommendationQueue.ts';
import { buildSearchLearningOpsCompletionRecommendations } from './searchLearningOpsCompletionRecommendations.ts';
import { buildSearchLearningOpsCompletionSummary } from './searchLearningOpsCompletionSummary.ts';
import { buildSearchLearningOpsPlaybookActivity } from './searchLearningOpsPlaybookActivity.ts';
import { buildSearchLearningOpsPlaybookOutcomes } from './searchLearningOpsPlaybookOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendationActivity } from './searchLearningOpsPlaybookRecommendationActivity.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomes } from './searchLearningOpsPlaybookRecommendationOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendationQueue } from './searchLearningOpsPlaybookRecommendationQueue.ts';
import { buildSearchLearningOpsPlaybookRecommendations } from './searchLearningOpsPlaybookRecommendations.ts';
import { buildSearchLearningOpsPlaybooks } from './searchLearningOpsPlaybooks.ts';

export type SearchLearningOpsSnapshot = {
    searchLearningOpsCenter: ReturnType<typeof buildSearchLearningOpsCenter>;
    searchLearningOpsPlaybooks: ReturnType<typeof buildSearchLearningOpsPlaybooks>;
    searchLearningOpsPlaybookActivity: ReturnType<typeof buildSearchLearningOpsPlaybookActivity>;
    searchLearningOpsPlaybookOutcomes: ReturnType<typeof buildSearchLearningOpsPlaybookOutcomes>;
    searchLearningOpsPlaybookRecommendations: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendations>;
    searchLearningOpsPlaybookRecommendationQueue: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationQueue>;
    searchLearningOpsPlaybookRecommendationActivity: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationActivity>;
    searchLearningOpsPlaybookRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomes>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes>;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations>;
    searchLearningOpsCompletionSummary: ReturnType<typeof buildSearchLearningOpsCompletionSummary>;
    searchLearningOpsCompletionActions: ReturnType<typeof buildSearchLearningOpsCompletionActions>;
    searchLearningOpsCompletionActivity: ReturnType<typeof buildSearchLearningOpsCompletionActivity>;
    searchLearningOpsCompletionOutcomes: ReturnType<typeof buildSearchLearningOpsCompletionOutcomes>;
    searchLearningOpsCompletionRecommendations: ReturnType<typeof buildSearchLearningOpsCompletionRecommendations>;
    searchLearningOpsCompletionRecommendationQueue: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationQueue>;
    searchLearningOpsCompletionRecommendationActivity: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationActivity>;
    searchLearningOpsCompletionRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomes>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendations: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendations>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueue>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationActivity>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations>;
    searchLearningOpsCompletionQueue: ReturnType<typeof buildSearchLearningOpsCompletionQueue>;
};

export function buildSearchLearningOpsSnapshot({
    entries,
    activity,
    recommendations,
    opsQueue,
    followups,
}: {
    entries: SearchLearningEntry[];
    activity: SearchLearningActivityEvent[];
    recommendations: SearchLearningActivityRecommendationSummary;
    opsQueue: SearchLearningActivityOpsQueueSummary;
    followups: SearchLearningActivityFollowupSummary;
}): SearchLearningOpsSnapshot {
    const searchLearningOpsCenter = buildSearchLearningOpsCenter(
        recommendations,
        opsQueue,
        followups
    );
    const searchLearningOpsPlaybooks = buildSearchLearningOpsPlaybooks(searchLearningOpsCenter);
    const searchLearningOpsPlaybookActivity = buildSearchLearningOpsPlaybookActivity(activity);
    const searchLearningOpsPlaybookOutcomes = buildSearchLearningOpsPlaybookOutcomes(
        searchLearningOpsPlaybookActivity.recentRuns,
        entries
    );
    const searchLearningOpsPlaybookRecommendations = buildSearchLearningOpsPlaybookRecommendations(
        searchLearningOpsPlaybookOutcomes
    );
    const searchLearningOpsPlaybookRecommendationQueue = buildSearchLearningOpsPlaybookRecommendationQueue(
        searchLearningOpsPlaybookRecommendations
    );
    const searchLearningOpsPlaybookRecommendationActivity = buildSearchLearningOpsPlaybookRecommendationActivity(activity);
    const searchLearningOpsPlaybookRecommendationOutcomes = buildSearchLearningOpsPlaybookRecommendationOutcomes(
        searchLearningOpsPlaybookRecommendationActivity.recentRuns,
        entries
    );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendations =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations(
            searchLearningOpsPlaybookRecommendationOutcomes
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendations
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity(activity);
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.recentRuns,
            entries
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity(activity);
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns,
            entries
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsCompletionSummary = buildSearchLearningOpsCompletionSummary(
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity
    );
    const searchLearningOpsCompletionActions = buildSearchLearningOpsCompletionActions(
        searchLearningOpsCompletionSummary
    );
    const searchLearningOpsCompletionActivity = buildSearchLearningOpsCompletionActivity(activity);
    const searchLearningOpsCompletionOutcomes = buildSearchLearningOpsCompletionOutcomes(
        searchLearningOpsCompletionActivity.recentRuns,
        entries
    );
    const searchLearningOpsCompletionRecommendations = buildSearchLearningOpsCompletionRecommendations(
        searchLearningOpsCompletionOutcomes
    );
    const searchLearningOpsCompletionRecommendationQueue = buildSearchLearningOpsCompletionRecommendationQueue(
        searchLearningOpsCompletionRecommendations
    );
    const searchLearningOpsCompletionRecommendationActivity =
        buildSearchLearningOpsCompletionRecommendationActivity(activity);
    const searchLearningOpsCompletionRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationActivity.recentRuns,
            entries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendations(
            searchLearningOpsCompletionRecommendationOutcomes
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueue(
            searchLearningOpsCompletionRecommendationOutcomeRecommendations
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationActivity(activity);
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.recentRuns,
            entries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity(activity);
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns,
            entries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity(
            activity
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.recentRuns,
            entries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes
        );
    const searchLearningOpsCompletionQueue = buildSearchLearningOpsCompletionQueue(
        searchLearningOpsCompletionActions
    );

    return {
        searchLearningOpsCenter,
        searchLearningOpsPlaybooks,
        searchLearningOpsPlaybookActivity,
        searchLearningOpsPlaybookOutcomes,
        searchLearningOpsPlaybookRecommendations,
        searchLearningOpsPlaybookRecommendationQueue,
        searchLearningOpsPlaybookRecommendationActivity,
        searchLearningOpsPlaybookRecommendationOutcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendations,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
        searchLearningOpsCompletionSummary,
        searchLearningOpsCompletionActions,
        searchLearningOpsCompletionActivity,
        searchLearningOpsCompletionOutcomes,
        searchLearningOpsCompletionRecommendations,
        searchLearningOpsCompletionRecommendationQueue,
        searchLearningOpsCompletionRecommendationActivity,
        searchLearningOpsCompletionRecommendationOutcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
        searchLearningOpsCompletionQueue,
    };
}
