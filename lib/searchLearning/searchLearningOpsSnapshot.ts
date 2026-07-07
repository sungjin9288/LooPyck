import type { SearchLearningActivityEvent, SearchLearningEntry } from '../search/queryLearningTypes.ts';
import type { SearchLearningActivityFollowupSummary } from './searchLearningActivityFollowups.ts';
import type { SearchLearningActivityOpsQueueSummary } from './searchLearningActivityOpsQueue.ts';
import type { SearchLearningActivityRecommendationSummary } from './searchLearningActivityRecommendations.ts';
import {
    buildOpsChainActivity,
    buildOpsChainOutcomes,
    buildOpsChainQueue,
    buildOpsChainRecommendations,
} from './searchLearningOpsChain.ts';
import type {
    OpsChainActivitySummary,
    OpsChainLevelConfig,
    OpsChainOutcomeSummary,
    OpsChainQueueSource,
    OpsChainQueueSummary,
    OpsChainRecommendationSource,
    OpsChainRecommendationSummary,
    OpsChainRun,
} from './searchLearningOpsChain.ts';
import {
    completionChainLevels,
    completionRecommendationsConfig,
    playbookChainLevels,
} from './searchLearningOpsChainLevels.ts';
import { buildSearchLearningOpsCenter } from './searchLearningOpsCenter.ts';
import { buildSearchLearningOpsCompletionActions } from './searchLearningOpsCompletionActions.ts';
import { buildSearchLearningOpsCompletionActivity } from './searchLearningOpsCompletionActivity.ts';
import { buildSearchLearningOpsCompletionOutcomes } from './searchLearningOpsCompletionOutcomes.ts';
import { buildSearchLearningOpsCompletionQueue } from './searchLearningOpsCompletionQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomes } from './searchLearningOpsCompletionRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionSummary } from './searchLearningOpsCompletionSummary.ts';
import { buildSearchLearningOpsPlaybookActivity } from './searchLearningOpsPlaybookActivity.ts';
import { buildSearchLearningOpsPlaybookOutcomes } from './searchLearningOpsPlaybookOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendations } from './searchLearningOpsPlaybookRecommendations.ts';
import { buildSearchLearningOpsPlaybooks } from './searchLearningOpsPlaybooks.ts';

// One recursive chain step: queue the previous recommendations, parse the
// runs executed against them, measure outcomes, and derive the next
// recommendations. Levels with a bespoke outcomes stage pass it in explicitly.
type OpsChainStep<TOutcomes extends OpsChainRecommendationSource = OpsChainOutcomeSummary> = {
    queue: OpsChainQueueSummary;
    activity: OpsChainActivitySummary;
    outcomes: TOutcomes;
    recommendations: OpsChainRecommendationSummary;
};

function buildOpsChainStep<TOutcomes extends OpsChainRecommendationSource = OpsChainOutcomeSummary>(
    previousRecommendations: OpsChainQueueSource,
    activity: SearchLearningActivityEvent[],
    entries: SearchLearningEntry[],
    level: OpsChainLevelConfig,
    bespokeOutcomes?: (runs: OpsChainRun[]) => TOutcomes
): OpsChainStep<TOutcomes> {
    const queue = buildOpsChainQueue(previousRecommendations, level.queue);
    const chainActivity = buildOpsChainActivity(activity, level.activity);
    const outcomes = (
        level.outcomes
            ? buildOpsChainOutcomes(chainActivity.recentRuns, entries, level.outcomes)
            : bespokeOutcomes!(chainActivity.recentRuns)
    ) as TOutcomes;
    const recommendations = buildOpsChainRecommendations(outcomes, level.recommendations);

    return { queue, activity: chainActivity, outcomes, recommendations };
}

export type SearchLearningOpsSnapshot = {
    searchLearningOpsCenter: ReturnType<typeof buildSearchLearningOpsCenter>;
    searchLearningOpsPlaybooks: ReturnType<typeof buildSearchLearningOpsPlaybooks>;
    searchLearningOpsPlaybookActivity: ReturnType<typeof buildSearchLearningOpsPlaybookActivity>;
    searchLearningOpsPlaybookOutcomes: ReturnType<typeof buildSearchLearningOpsPlaybookOutcomes>;
    searchLearningOpsPlaybookRecommendations: ReturnType<typeof buildSearchLearningOpsPlaybookRecommendations>;
    searchLearningOpsPlaybookRecommendationQueue: OpsChainQueueSummary;
    searchLearningOpsPlaybookRecommendationActivity: OpsChainActivitySummary;
    searchLearningOpsPlaybookRecommendationOutcomes: OpsChainOutcomeSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations: OpsChainRecommendationSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue: OpsChainQueueSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity: OpsChainActivitySummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes: OpsChainOutcomeSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations: OpsChainRecommendationSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue: OpsChainQueueSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity: OpsChainActivitySummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes: OpsChainOutcomeSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations: OpsChainRecommendationSummary;
    searchLearningOpsCompletionSummary: ReturnType<typeof buildSearchLearningOpsCompletionSummary>;
    searchLearningOpsCompletionActions: ReturnType<typeof buildSearchLearningOpsCompletionActions>;
    searchLearningOpsCompletionActivity: ReturnType<typeof buildSearchLearningOpsCompletionActivity>;
    searchLearningOpsCompletionOutcomes: ReturnType<typeof buildSearchLearningOpsCompletionOutcomes>;
    searchLearningOpsCompletionRecommendations: OpsChainRecommendationSummary;
    searchLearningOpsCompletionRecommendationQueue: OpsChainQueueSummary;
    searchLearningOpsCompletionRecommendationActivity: OpsChainActivitySummary;
    searchLearningOpsCompletionRecommendationOutcomes: ReturnType<typeof buildSearchLearningOpsCompletionRecommendationOutcomes>;
    searchLearningOpsCompletionRecommendationOutcomeRecommendations: OpsChainRecommendationSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue: OpsChainQueueSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity: OpsChainActivitySummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes: OpsChainOutcomeSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations: OpsChainRecommendationSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue: OpsChainQueueSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity: OpsChainActivitySummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes: OpsChainOutcomeSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations: OpsChainRecommendationSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue: OpsChainQueueSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity: OpsChainActivitySummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes: OpsChainOutcomeSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations: OpsChainRecommendationSummary;
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
    const opsCenter = buildSearchLearningOpsCenter(recommendations, opsQueue, followups);
    const playbooks = buildSearchLearningOpsPlaybooks(opsCenter);

    // Playbook lane: bespoke root, then 3 recursive chain steps.
    const playbookActivity = buildSearchLearningOpsPlaybookActivity(activity);
    const playbookOutcomes = buildSearchLearningOpsPlaybookOutcomes(playbookActivity.recentRuns, entries);
    const playbookRecommendations = buildSearchLearningOpsPlaybookRecommendations(playbookOutcomes);
    const playbookStep1 = buildOpsChainStep(playbookRecommendations, activity, entries, playbookChainLevels[0]);
    const playbookStep2 = buildOpsChainStep(playbookStep1.recommendations, activity, entries, playbookChainLevels[1]);
    const playbookStep3 = buildOpsChainStep(playbookStep2.recommendations, activity, entries, playbookChainLevels[2]);

    // Completion lane: summary/actions derive from the deepest playbook step,
    // then a bespoke root and 4 recursive chain steps.
    const completionSummary = buildSearchLearningOpsCompletionSummary(
        playbookStep3.queue,
        playbookStep3.outcomes,
        playbookStep3.activity
    );
    const completionActions = buildSearchLearningOpsCompletionActions(completionSummary);
    const completionActivity = buildSearchLearningOpsCompletionActivity(activity);
    const completionOutcomes = buildSearchLearningOpsCompletionOutcomes(completionActivity.recentRuns, entries);
    const completionRecommendations = buildOpsChainRecommendations(completionOutcomes, completionRecommendationsConfig);
    const completionStep1 = buildOpsChainStep(
        completionRecommendations,
        activity,
        entries,
        completionChainLevels[0],
        (runs) => buildSearchLearningOpsCompletionRecommendationOutcomes(runs, entries)
    );
    const completionStep2 = buildOpsChainStep(completionStep1.recommendations, activity, entries, completionChainLevels[1]);
    const completionStep3 = buildOpsChainStep(completionStep2.recommendations, activity, entries, completionChainLevels[2]);
    const completionStep4 = buildOpsChainStep(completionStep3.recommendations, activity, entries, completionChainLevels[3]);
    const completionQueue = buildSearchLearningOpsCompletionQueue(completionActions);

    return {
        searchLearningOpsCenter: opsCenter,
        searchLearningOpsPlaybooks: playbooks,
        searchLearningOpsPlaybookActivity: playbookActivity,
        searchLearningOpsPlaybookOutcomes: playbookOutcomes,
        searchLearningOpsPlaybookRecommendations: playbookRecommendations,
        searchLearningOpsPlaybookRecommendationQueue: playbookStep1.queue,
        searchLearningOpsPlaybookRecommendationActivity: playbookStep1.activity,
        searchLearningOpsPlaybookRecommendationOutcomes: playbookStep1.outcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendations: playbookStep1.recommendations,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue: playbookStep2.queue,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity: playbookStep2.activity,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes: playbookStep2.outcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations: playbookStep2.recommendations,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue: playbookStep3.queue,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity: playbookStep3.activity,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes: playbookStep3.outcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations:
            playbookStep3.recommendations,
        searchLearningOpsCompletionSummary: completionSummary,
        searchLearningOpsCompletionActions: completionActions,
        searchLearningOpsCompletionActivity: completionActivity,
        searchLearningOpsCompletionOutcomes: completionOutcomes,
        searchLearningOpsCompletionRecommendations: completionRecommendations,
        searchLearningOpsCompletionRecommendationQueue: completionStep1.queue,
        searchLearningOpsCompletionRecommendationActivity: completionStep1.activity,
        searchLearningOpsCompletionRecommendationOutcomes: completionStep1.outcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendations: completionStep1.recommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue: completionStep2.queue,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity: completionStep2.activity,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes: completionStep2.outcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations:
            completionStep2.recommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue: completionStep3.queue,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity:
            completionStep3.activity,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes:
            completionStep3.outcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations:
            completionStep3.recommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue:
            completionStep4.queue,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity:
            completionStep4.activity,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes:
            completionStep4.outcomes,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations:
            completionStep4.recommendations,
        searchLearningOpsCompletionQueue: completionQueue,
    };
}
