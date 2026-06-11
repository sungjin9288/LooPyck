'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';
import type {
    DiagnosticsResponse,
    SearchLearningEntry,
} from './types';
import { useSearchLearningActionLanes } from './useSearchLearningActionLanes';
import { useSearchLearningMutations } from './useSearchLearningMutations';
import { useSearchLearningSelectionState } from './useSearchLearningSelectionState';

type SearchLearningWorkbenchActions = Pick<
    ReturnType<typeof buildSearchLearningWorkbench>,
    | 'searchLearningDraftEntries'
    | 'searchLearningImpactSummary'
    | 'searchLearningImpactClusterRollup'
    | 'searchLearningRewriteSourceActionDraftSummary'
    | 'searchLearningRewriteSourceActionReviewSummary'
    | 'searchLearningRewriteSourceApprovalQueueSummary'
    | 'searchLearningRewriteSourceApprovalActivitySummary'
    | 'searchLearningOpsCompletionActions'
    | 'searchLearningOpsCompletionRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations'
>;

type UseSearchLearningActionsParams = {
    user: User | null;
    data: DiagnosticsResponse | null;
    setData: Dispatch<SetStateAction<DiagnosticsResponse | null>>;
    searchLearningEntries: SearchLearningEntry[];
    workbench: SearchLearningWorkbenchActions;
};

export function useSearchLearningActions({
    user,
    data,
    setData,
    searchLearningEntries,
    workbench,
}: UseSearchLearningActionsParams) {
    const [processingSearchLearningId, setProcessingSearchLearningId] = useState<string | null>(null);
    const [showAdvancedSearchLearningChain, setShowAdvancedSearchLearningChain] = useState(false);
    const [showAdvancedPlaybookChain, setShowAdvancedPlaybookChain] = useState(false);

    const {
        searchLearningDraftEntries,
        searchLearningImpactSummary,
        searchLearningImpactClusterRollup,
        searchLearningRewriteSourceActionDraftSummary,
        searchLearningRewriteSourceActionReviewSummary,
        searchLearningRewriteSourceApprovalQueueSummary,
        searchLearningRewriteSourceApprovalActivitySummary,
        searchLearningOpsCompletionActions,
        searchLearningOpsCompletionRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
    } = workbench;

    const {
        clearSearchLearningSelection,
        searchLearningMessage,
        selectedSearchLearningIds,
        selectDraftSearchLearningEntries,
        selectImpactAwaitingEntries,
        selectImpactClusterEntries,
        selectImpactClusters,
        selectImpactImprovedEntries,
        selectImpactNoImprovementEntries,
        selectPendingSearchLearningEntries,
        selectSearchLearningEntries,
        setSearchLearningMessage,
        setSelectedSearchLearningIds,
        toggleSearchLearningSelection,
    } = useSearchLearningSelectionState({
        searchLearningEntries,
        searchLearningDraftEntries,
        searchLearningImpactSummary,
        searchLearningImpactClusterRollup,
    });

    const {
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleBulkReviewSearchLearningForIds,
        handleGenerateSearchLearningSuggestion,
        handleReviewSearchLearningEntry,
        handleSeedCoverageClusterQueries,
        handleSeedCoverageQueries,
    } = useSearchLearningMutations({
        user,
        data,
        setData,
        setProcessingSearchLearningId,
        setSearchLearningMessage,
        setSelectedSearchLearningIds,
    });

    const laneActions = useSearchLearningActionLanes({
        user,
        selectedSearchLearningIds,
        searchLearningEntries,
        selectDraftSearchLearningEntries,
        selectSearchLearningEntries,
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleBulkReviewSearchLearningForIds,
        searchLearningImpactClusterRollup,
        searchLearningImpactSummary,
        searchLearningRewriteSourceActionDraftSummary,
        searchLearningRewriteSourceActionReviewSummary,
        searchLearningRewriteSourceApprovalQueueSummary,
        searchLearningOpsCompletionActions,
        searchLearningOpsCompletionRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
    });

    return {
        clearSearchLearningSelection,
        ...laneActions,
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleGenerateSearchLearningSuggestion,
        handleReviewSearchLearningEntry,
        handleSeedCoverageClusterQueries,
        handleSeedCoverageQueries,
        processingSearchLearningId,
        searchLearningMessage,
        selectDraftSearchLearningEntries,
        selectImpactAwaitingEntries,
        selectImpactClusterEntries,
        selectImpactClusters,
        selectImpactImprovedEntries,
        selectImpactNoImprovementEntries,
        selectSearchLearningEntries,
        selectedSearchLearningIds,
        selectPendingSearchLearningEntries,
        setShowAdvancedPlaybookChain,
        setShowAdvancedSearchLearningChain,
        showAdvancedPlaybookChain,
        showAdvancedSearchLearningChain,
        toggleSearchLearningSelection,
    };
}
