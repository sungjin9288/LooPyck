import type { BuildSearchLearningSectionPropsParams } from './types';

export function buildSearchLearningCompletionChainActionProps({
    actions,
}: Pick<BuildSearchLearningSectionPropsParams, 'actions'>) {
    const {
        handleSearchLearningOpsCompletionAction,
        handleSearchLearningOpsCompletionQueueItem,
        handleSearchLearningOpsCompletionRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem,
        handleSearchLearningOpsCompletionRecommendationQueueItem,
        handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction,
        selectSearchLearningEntries,
        setShowAdvancedSearchLearningChain,
        showAdvancedSearchLearningChain,
    } = actions;

    return {
        showAdvancedSearchLearningChain,
        onToggleAdvancedChain: () => setShowAdvancedSearchLearningChain((current) => !current),
        onSelectEntries: selectSearchLearningEntries,
        onRunCompletionAction: handleSearchLearningOpsCompletionAction,
        onRunCompletionQueueItem: handleSearchLearningOpsCompletionQueueItem,
        onRunSummaryRecommendation: handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction,
        onRunCompletionRecommendation: handleSearchLearningOpsCompletionRecommendation,
        onRunCompletionRecommendationQueueItem: handleSearchLearningOpsCompletionRecommendationQueueItem,
        onRunOutcomeRecommendation: handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation,
        onRunDeepQueueItem: handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem,
        onRunDeepRecommendation: handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
        onRunTerminalQueueItem: handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem,
        onRunTerminalRecommendation: handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation,
        onRunRecommendationOutcomeRecommendation: handleSearchLearningOpsCompletionRecommendationOutcomeRecommendation,
        onRunRecommendationQueueItem: handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem,
    };
}
