import type { DiagnosticsResponse } from '../types';
import type { useSearchDiagnosticsDashboardModel } from '../useSearchDiagnosticsDashboardModel';
import type { useSearchLearningActions } from '../useSearchLearningActions';

export type SearchDiagnosticsDashboardModel = ReturnType<typeof useSearchDiagnosticsDashboardModel>;
export type SearchLearningActions = ReturnType<typeof useSearchLearningActions>;
export type SearchLearningImpactSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningImpactSummary'];
export type SearchLearningImpactClusterRollup =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningImpactClusterRollup'];
export type SearchLearningRewriteSourceActionDraftSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningRewriteSourceActionDraftSummary'];
export type SearchLearningRewriteSourceActionReviewSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningRewriteSourceActionReviewSummary'];
export type SearchLearningRewriteSourceApprovalQueueSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningRewriteSourceApprovalQueueSummary'];
export type SearchLearningOpsCompletionActionsSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningOpsCompletionActions'];
export type SearchLearningOpsCompletionRecommendationsSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningOpsCompletionRecommendations'];
export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationsSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningOpsCompletionRecommendationOutcomeRecommendations'];
export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationsSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations'];
export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationsSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'];
export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendationsSummary =
    SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations'];
export type SearchLearningActivityFollowupItem =
    | SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningActivityFollowups']['topRetrainNeeded'][number]
    | SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningActivityFollowups']['topAwaitingSamples'][number]
    | SearchDiagnosticsDashboardModel['searchLearningWorkbench']['searchLearningActivityFollowups']['topValidated'][number];

export type BuildSearchLearningSectionPropsParams = {
    data: DiagnosticsResponse | null;
    selectedSource: string | null;
    onSelectSource: (source: string | null) => void;
    model: Pick<
        SearchDiagnosticsDashboardModel,
        | 'summary'
        | 'searchLearningEntries'
        | 'searchLearningSummary'
        | 'searchLearningActivityEvents'
        | 'searchLearningActivityStorage'
        | 'searchLearningWorkbench'
        | 'selectedSummary'
        | 'drilldown'
        | 'trendPoints'
        | 'recentSnapshots'
        | 'lowFitQueries'
        | 'recentInteractions'
    >;
    actions: SearchLearningActions;
};
