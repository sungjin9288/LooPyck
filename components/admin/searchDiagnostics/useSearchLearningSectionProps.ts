'use client';

import type { User } from 'firebase/auth';
import type { Dispatch, SetStateAction } from 'react';
import { buildSearchLearningSectionProps } from './searchLearningSectionProps';
import type { SearchDiagnosticsDashboardModel } from './sectionProps/types';
import type { DiagnosticsResponse } from './types';
import { useSearchLearningActions } from './useSearchLearningActions';

type UseSearchLearningSectionPropsParams = {
    user: User | null;
    data: DiagnosticsResponse | null;
    setData: Dispatch<SetStateAction<DiagnosticsResponse | null>>;
    selectedSource: string | null;
    setSelectedSource: (source: string | null) => void;
    dashboardModel: SearchDiagnosticsDashboardModel;
};

export function useSearchLearningSectionProps({
    user,
    data,
    setData,
    selectedSource,
    setSelectedSource,
    dashboardModel,
}: UseSearchLearningSectionPropsParams) {
    const searchLearningActions = useSearchLearningActions({
        user,
        data,
        setData,
        searchLearningEntries: dashboardModel.searchLearningEntries,
        workbench: {
            searchLearningDraftEntries: dashboardModel.searchLearningWorkbench.searchLearningDraftEntries,
            searchLearningImpactSummary: dashboardModel.searchLearningWorkbench.searchLearningImpactSummary,
            searchLearningImpactClusterRollup: dashboardModel.searchLearningWorkbench.searchLearningImpactClusterRollup,
            searchLearningRewriteSourceActionDraftSummary: dashboardModel.searchLearningWorkbench.searchLearningRewriteSourceActionDraftSummary,
            searchLearningRewriteSourceActionReviewSummary: dashboardModel.searchLearningWorkbench.searchLearningRewriteSourceActionReviewSummary,
            searchLearningRewriteSourceApprovalQueueSummary: dashboardModel.searchLearningWorkbench.searchLearningRewriteSourceApprovalQueueSummary,
            searchLearningRewriteSourceApprovalActivitySummary: dashboardModel.searchLearningWorkbench.searchLearningRewriteSourceApprovalActivitySummary,
            searchLearningOpsCompletionActions: dashboardModel.searchLearningWorkbench.searchLearningOpsCompletionActions,
            searchLearningOpsCompletionRecommendations: dashboardModel.searchLearningWorkbench.searchLearningOpsCompletionRecommendations,
            searchLearningOpsCompletionRecommendationOutcomeRecommendations:
                dashboardModel.searchLearningWorkbench.searchLearningOpsCompletionRecommendationOutcomeRecommendations,
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations:
                dashboardModel.searchLearningWorkbench.searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations:
                dashboardModel.searchLearningWorkbench.searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations:
                dashboardModel.searchLearningWorkbench.searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
        },
    });

    return buildSearchLearningSectionProps({
        data,
        selectedSource,
        onSelectSource: setSelectedSource,
        model: dashboardModel,
        actions: searchLearningActions,
    });
}
