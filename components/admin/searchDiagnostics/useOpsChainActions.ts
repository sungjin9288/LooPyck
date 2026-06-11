'use client';

import type {
    OpsChainOutcome,
    OpsChainQueueItem,
    OpsChainRecommendation,
} from './searchLearningWorkbench';
import {
    findSearchLearningRecommendationById,
    runSearchLearningOutcomeAction,
    runSearchLearningRecommendationAction,
    runSearchLearningRecommendationQueueItem,
    type SearchLearningActionRunnerDeps,
} from './searchLearningActionRunners';
import {
    completionChainGroupActions,
    playbookChainGroupActions,
    type OpsChainGroupActionConfig,
} from './opsChainSectionConfig';
import type { OpsChainGroupHandlers } from './opsChainSections';
import type {
    SearchLearningOpsCompletionRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendationsSummary,
    SearchLearningOpsPlaybookRecommendationsSummary,
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationsSummary,
} from './sectionProps/types';

type SelectEntries = (entryIds: string[], message: string) => void;

type RecommendationSummaryLike = {
    topReviewNow: OpsChainRecommendation[];
    topRetrainNow: OpsChainRecommendation[];
    topCollectSamples: OpsChainRecommendation[];
    topObserve: OpsChainRecommendation[];
};

type RerunRecommendationLike = {
    outcomeId: string;
    entryIds: string[];
    title: string;
    action: OpsChainRecommendation['action'];
    id: string;
};

type RerunSummaryLike = {
    topReviewNow: RerunRecommendationLike[];
    topRetrainNow: RerunRecommendationLike[];
    topCollectSamples: RerunRecommendationLike[];
    topObserve: RerunRecommendationLike[];
};

type UseOpsChainActionsParams = {
    searchLearningActionRunnerDeps: SearchLearningActionRunnerDeps;
    selectSearchLearningEntries: SelectEntries;
    searchLearningOpsCompletionRecommendations: SearchLearningOpsCompletionRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendationsSummary;
    searchLearningOpsPlaybookRecommendations: SearchLearningOpsPlaybookRecommendationsSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationsSummary;
};

function flattenRecommendations<TRecommendation>(summary: {
    topReviewNow: TRecommendation[];
    topRetrainNow: TRecommendation[];
    topCollectSamples: TRecommendation[];
    topObserve: TRecommendation[];
}): TRecommendation[] {
    return [
        ...summary.topReviewNow,
        ...summary.topRetrainNow,
        ...summary.topCollectSamples,
        ...summary.topObserve,
    ];
}

/**
 * Builds the per-group handler arrays for both ops chain lanes. The
 * contextBase/noun pairs come from opsChainSectionConfig.ts and are persisted
 * in Firestore activity logs — they must stay byte-identical per group.
 */
export function useOpsChainActions({
    searchLearningActionRunnerDeps,
    selectSearchLearningEntries,
    searchLearningOpsCompletionRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
    searchLearningOpsPlaybookRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
}: UseOpsChainActionsParams) {
    const deps = searchLearningActionRunnerDeps;

    function buildRecommendationHandler(config: OpsChainGroupActionConfig) {
        return async function runRecommendation(recommendation: OpsChainRecommendation) {
            await runSearchLearningRecommendationAction({
                recommendation,
                noun: config.recommendation.noun,
                contextBase: config.recommendation.contextBase,
                deps,
            });
        };
    }

    function buildCompletionQueueHandler(
        config: OpsChainGroupActionConfig,
        summary: RecommendationSummaryLike
    ) {
        const queueConfig = config.queue;
        if (!queueConfig) {
            return undefined;
        }

        return async function runQueueItem(item: OpsChainQueueItem) {
            await runSearchLearningRecommendationQueueItem({
                summary,
                recommendationId: item.recommendationId,
                entryIds: item.entryIds,
                title: item.title,
                noun: queueConfig.noun,
                contextBase: queueConfig.contextBase,
                deps,
            });
        };
    }

    /** playbook queues run the underlying recommendation and no-op when it is gone. */
    function buildPlaybookQueueHandler(
        config: OpsChainGroupActionConfig,
        summary: RecommendationSummaryLike
    ) {
        const queueConfig = config.queue;
        if (!queueConfig) {
            return undefined;
        }

        return async function runQueueItem(item: OpsChainQueueItem) {
            const recommendation = findSearchLearningRecommendationById(summary, item.recommendationId);
            if (!recommendation) {
                return;
            }

            await runSearchLearningRecommendationAction({
                recommendation,
                noun: queueConfig.noun,
                contextBase: queueConfig.contextBase,
                deps,
            });
        };
    }

    function buildRerunResolver(
        rerun: { contextBase: string; noun: string } | undefined,
        summary: RerunSummaryLike | null
    ) {
        if (!rerun || !summary) {
            return undefined;
        }

        return function resolveRerun(item: { outcomeId?: string }) {
            const recommendation = flattenRecommendations(summary)
                .find((candidate) => candidate.outcomeId === item.outcomeId);
            if (!recommendation) {
                return null;
            }

            return () => runSearchLearningRecommendationAction({
                recommendation,
                noun: rerun.noun,
                contextBase: rerun.contextBase,
                deps,
            });
        };
    }

    const completionRecommendationSummaries = [
        searchLearningOpsCompletionRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
    ];

    const completionChainHandlers: OpsChainGroupHandlers[] = completionChainGroupActions.map((config, index) => ({
        onSelectEntries: selectSearchLearningEntries,
        onRunRecommendation: buildRecommendationHandler(config),
        onRunQueueItem: buildCompletionQueueHandler(config, completionRecommendationSummaries[index]),
    }));

    const playbookRecommendationSummaries = [
        searchLearningOpsPlaybookRecommendationOutcomeRecommendations,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
        null,
    ];

    const playbookChainHandlers: OpsChainGroupHandlers[] = playbookChainGroupActions.map((config, index) => {
        const groupSummary = index === 2
            ? null
            : playbookRecommendationSummaries[index];
        const rerunSource = (rerun: { source: string } | undefined): RerunSummaryLike | null => {
            if (!rerun) {
                return null;
            }

            if (rerun.source === 'rootRecommendations') {
                return searchLearningOpsPlaybookRecommendations;
            }

            return playbookRecommendationSummaries[index - 1];
        };
        const outcomeConfig = config.outcome;

        return {
            onSelectEntries: selectSearchLearningEntries,
            onRunRecommendation: buildRecommendationHandler(config),
            onRunQueueItem: groupSummary ? buildPlaybookQueueHandler(config, groupSummary) : undefined,
            onRunOutcome: outcomeConfig
                ? async (outcome: OpsChainOutcome) => {
                    await runSearchLearningOutcomeAction({
                        outcome,
                        noun: outcomeConfig.noun,
                        contextBase: outcomeConfig.contextBase,
                        deps,
                    });
                }
                : undefined,
            resolveActivityRerun: buildRerunResolver(config.activityRerun, rerunSource(config.activityRerun)),
            resolveOutcomeRerun: buildRerunResolver(config.outcomeRerun, rerunSource(config.outcomeRerun)),
        };
    });

    return {
        completionChainHandlers,
        playbookChainHandlers,
    };
}
