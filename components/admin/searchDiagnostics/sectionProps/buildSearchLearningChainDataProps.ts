import type { OpsChainGroupData } from '../opsChainSections';
import type { BuildSearchLearningSectionPropsParams } from './types';

export function buildSearchLearningChainDataProps({
    model,
}: Pick<BuildSearchLearningSectionPropsParams, 'model'>) {
    const { searchLearningWorkbench } = model;
    const {
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
        searchLearningImpactSummary,
        searchLearningImpactClusterRollup,
        searchLearningImpactClusters,
        searchLearningRewritePacks,
        searchLearningRewriteRecommendations,
        searchLearningRewriteRecommendationSummary,
        searchLearningRewriteSourceDrafts,
        searchLearningRewriteSourceDraftSummary,
    } = searchLearningWorkbench;

    /**
     * Group g = { activity(g), outcomes(g), recommendations(g), queue(g) } where
     * queue(g) feeds activity(g+1). The snapshot keys are unchanged — only the
     * grouping into OpsChainGroupData is new. The last group has no queue.
     */
    const completionChainGroups: OpsChainGroupData[] = [
        {
            activity: searchLearningOpsCompletionActivity,
            outcomes: searchLearningOpsCompletionOutcomes,
            recommendations: searchLearningOpsCompletionRecommendations,
            queue: searchLearningOpsCompletionRecommendationQueue,
        },
        {
            activity: searchLearningOpsCompletionRecommendationActivity,
            outcomes: searchLearningOpsCompletionRecommendationOutcomes,
            recommendations: searchLearningOpsCompletionRecommendationOutcomeRecommendations,
            queue: searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue,
        },
        {
            activity: searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity,
            outcomes: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes,
            recommendations: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
            queue: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
        },
        {
            activity: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
            outcomes: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
            recommendations: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
            queue: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue,
        },
        {
            activity: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity,
            outcomes: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes,
            recommendations: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
            queue: null,
        },
    ];

    const playbookChainGroups: OpsChainGroupData[] = [
        {
            activity: searchLearningOpsPlaybookRecommendationActivity,
            outcomes: searchLearningOpsPlaybookRecommendationOutcomes,
            recommendations: searchLearningOpsPlaybookRecommendationOutcomeRecommendations,
            queue: searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue,
        },
        {
            activity: searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity,
            outcomes: searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes,
            recommendations: searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
            queue: searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
        },
        {
            activity: searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
            outcomes: searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
            recommendations: searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
            queue: null,
        },
    ];

    return {
        playbookChainDataProps: {
            playbookChainGroups,
            searchLearningImpactSummary,
            searchLearningImpactClusterRollup,
            searchLearningImpactClusters,
            searchLearningRewritePacks,
            searchLearningRewriteRecommendationSummary,
            searchLearningRewriteRecommendations,
            searchLearningRewriteSourceDraftSummary,
            searchLearningRewriteSourceDrafts,
        },
        completionChainDataProps: {
            searchLearningOpsCompletionSummary,
            searchLearningOpsCompletionActions,
            searchLearningOpsCompletionQueue,
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
            completionChainGroups,
        },
        playbookDataProps: {
            searchLearningOpsPlaybooks,
            searchLearningOpsPlaybookActivity,
            searchLearningOpsPlaybookOutcomes,
            searchLearningOpsPlaybookRecommendations,
            searchLearningOpsPlaybookRecommendationQueue,
            searchLearningOpsCenter,
        },
    };
}
