'use client';

import type { User } from 'firebase/auth';
import type { SearchLearningEntry } from './types';
import { buildSearchLearningActionRunnerDeps } from './searchLearningActionRunnerDeps';
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
        searchLearningActionRunnerDeps,
        searchLearningOpsCompletionActions,
        searchLearningOpsCompletionRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
        searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
        selectSearchLearningEntries,
    });

    const playbookActions = useSearchLearningPlaybookActions({
        searchLearningActionRunnerDeps,
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
        ...primaryActions,
    };
}
