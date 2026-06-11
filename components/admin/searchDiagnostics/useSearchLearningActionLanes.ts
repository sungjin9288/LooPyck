'use client';

import type { User } from 'firebase/auth';
import type { SearchLearningEntry } from './types';
import { buildSearchLearningActionRunnerDeps } from './searchLearningActionRunnerDeps';
import { useOpsChainActions } from './useOpsChainActions';
import { useSearchLearningBatchActions } from './useSearchLearningBatchActions';
import { useSearchLearningCompletionActions } from './useSearchLearningCompletionActions';
import { useSearchLearningPlaybookActions } from './useSearchLearningPlaybookActions';
import { useSearchLearningPrimaryActions } from './useSearchLearningPrimaryActions';
import type {
    SearchLearningImpactClusterRollup,
    SearchLearningImpactSummary,
    SearchLearningRewriteSourceActionDraftSummary,
    SearchLearningRewriteSourceActionReviewSummary,
    SearchLearningRewriteSourceApprovalQueueSummary,
    SearchLearningOpsCompletionActionsSummary,
    SearchLearningOpsCompletionRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendationsSummary,
    SearchLearningOpsPlaybookRecommendationsSummary,
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationsSummary,
} from './sectionProps/types';

type GenerateEntries = (
    entryIds: string[],
    processingKey: string,
    successMessage: (count: number) => string,
    fallbackErrorMessage: string
) => Promise<void>;

type ReviewEntries = (
    entryIds: string[],
    action: 'bulk_approve' | 'bulk_ignore',
    processingKey: string,
    successMessage: string | ((count: number) => string),
    fallbackErrorMessage: string
) => Promise<void>;

type SelectEntries = (entryIds: string[], message: string) => void;

type UseSearchLearningActionLanesParams = {
    user: User | null;
    selectedSearchLearningIds: string[];
    searchLearningEntries: SearchLearningEntry[];
    selectDraftSearchLearningEntries: () => void;
    selectSearchLearningEntries: SelectEntries;
    handleBulkGenerateSearchLearningSuggestionsForIds: GenerateEntries;
    handleBulkReviewSearchLearningForIds: ReviewEntries;
    searchLearningImpactClusterRollup: SearchLearningImpactClusterRollup;
    searchLearningImpactSummary: SearchLearningImpactSummary;
    searchLearningRewriteSourceActionDraftSummary: SearchLearningRewriteSourceActionDraftSummary;
    searchLearningRewriteSourceActionReviewSummary: SearchLearningRewriteSourceActionReviewSummary;
    searchLearningRewriteSourceApprovalQueueSummary: SearchLearningRewriteSourceApprovalQueueSummary;
    searchLearningOpsCompletionActions: SearchLearningOpsCompletionActionsSummary;
    searchLearningOpsCompletionRecommendations: SearchLearningOpsCompletionRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendationsSummary;
    searchLearningOpsPlaybookRecommendations: SearchLearningOpsPlaybookRecommendationsSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationsSummary;
};

export function useSearchLearningActionLanes({
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
    searchLearningOpsPlaybookRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
}: UseSearchLearningActionLanesParams) {
    const batchActions = useSearchLearningBatchActions({
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleBulkReviewSearchLearningForIds,
        searchLearningImpactClusterRollup,
        searchLearningImpactSummary,
        searchLearningRewriteSourceActionDraftSummary,
        searchLearningRewriteSourceActionReviewSummary,
        searchLearningRewriteSourceApprovalQueueSummary,
        selectSearchLearningEntries,
    });

    const searchLearningActionRunnerDeps = buildSearchLearningActionRunnerDeps({
        searchLearningEntries,
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleBulkReviewSearchLearningForIds,
        selectSearchLearningEntries,
    });

    const completionActions = useSearchLearningCompletionActions({
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleBulkReviewSearchLearningForIds,
        searchLearningOpsCompletionActions,
        selectSearchLearningEntries,
    });

    const playbookActions = useSearchLearningPlaybookActions({
        searchLearningActionRunnerDeps,
    });

    const opsChainActions = useOpsChainActions({
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
    });

    const primaryActions = useSearchLearningPrimaryActions({
        user,
        selectedSearchLearningIds,
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleBulkReviewSearchLearningForIds,
        selectDraftSearchLearningEntries,
        selectSearchLearningEntries,
    });

    return {
        ...batchActions,
        ...completionActions,
        ...playbookActions,
        ...opsChainActions,
        ...primaryActions,
    };
}
