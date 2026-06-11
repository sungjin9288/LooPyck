import type { BuildSearchLearningSectionPropsParams } from './types';

export function buildSearchLearningCompletionChainActionProps({
    actions,
}: Pick<BuildSearchLearningSectionPropsParams, 'actions'>) {
    const {
        completionChainHandlers,
        handleSearchLearningOpsCompletionAction,
        handleSearchLearningOpsCompletionQueueItem,
        playbookChainHandlers,
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
        // The summary cards run the deepest playbook recommendation action
        // ('ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_recommendation'),
        // which is exactly the playbook chain group 2 recommendation handler.
        onRunSummaryRecommendation: playbookChainHandlers[2].onRunRecommendation,
        completionChainHandlers,
    };
}
