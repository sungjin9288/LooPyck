import type { BuildSearchLearningSectionPropsParams, SearchLearningActivityFollowupItem } from './types';

export function buildSearchLearningCoreActionProps({
    actions,
}: Pick<BuildSearchLearningSectionPropsParams, 'actions'>) {
    const {
        clearSearchLearningSelection,
        handleActivityFollowupAction,
        handleActivityOpsQueueItemAction,
        handleApproveSourceActionReviewSuggestions,
        handleApproveSourceApprovalReviewPending,
        handleBulkGenerateSearchLearningSuggestions,
        handleBulkReviewSearchLearning,
        handleGenerateSearchLearningSuggestion,
        handleGenerateSourceActionReviewSuggestions,
        handleGenerateSourceApprovalRollbackSuggestions,
        handleGenerateSourceRollbackDraftSuggestions,
        handleReviewSearchLearningEntry,
        handleSearchLearningTerminalAction,
        handleSeedCoverageClusterQueries,
        handleSeedCoverageQueries,
        processingSearchLearningId,
        searchLearningMessage,
        selectDraftSearchLearningEntries,
        selectPendingSearchLearningEntries,
        selectSearchLearningEntries,
        selectedSearchLearningIds,
        toggleSearchLearningSelection,
    } = actions;

    return {
        coverageActionProps: {
            processingSearchLearningId,
            onApproveSourceActionReviewSuggestions: handleApproveSourceActionReviewSuggestions,
            onApproveSourceApprovalReviewPending: handleApproveSourceApprovalReviewPending,
            onGenerateSourceActionReviewSuggestions: handleGenerateSourceActionReviewSuggestions,
            onGenerateSourceApprovalRollbackSuggestions: handleGenerateSourceApprovalRollbackSuggestions,
            onGenerateSourceRollbackDraftSuggestions: handleGenerateSourceRollbackDraftSuggestions,
            onSeedCoverageQueries: handleSeedCoverageQueries,
            onSeedCoverageClusterQueries: handleSeedCoverageClusterQueries,
            onSelectEntries: selectSearchLearningEntries,
        },
        terminalActionProps: {
            onRunTerminalAction: handleSearchLearningTerminalAction,
            onSelectEntries: selectSearchLearningEntries,
        },
        activityActionProps: {
            processingSearchLearningId,
            onRunActivityFollowup: (item: SearchLearningActivityFollowupItem) =>
                handleActivityFollowupAction(item.entryIds, item.action, item.title),
            onRunActivityOpsQueueItem: handleActivityOpsQueueItemAction,
            onSelectEntries: selectSearchLearningEntries,
        },
        queueActionProps: {
            processingSearchLearningId,
            searchLearningMessage,
            selectedSearchLearningIds,
            onBulkGenerateSuggestions: handleBulkGenerateSearchLearningSuggestions,
            onBulkReview: handleBulkReviewSearchLearning,
            onClearSelection: clearSearchLearningSelection,
            onGenerateSuggestion: handleGenerateSearchLearningSuggestion,
            onReviewEntry: handleReviewSearchLearningEntry,
            onSelectDraftEntries: selectDraftSearchLearningEntries,
            onSelectEntries: selectSearchLearningEntries,
            onSelectPendingEntries: selectPendingSearchLearningEntries,
            onToggleSelection: toggleSearchLearningSelection,
        },
    };
}
