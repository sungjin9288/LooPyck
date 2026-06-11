import { buildSearchLearningImpactClusterRollup, buildSearchLearningImpactClusterSummaries, buildSearchLearningImpactSummary } from '@/lib/search/searchLearningImpact';
import {
    buildSearchLearningActivitySnapshot,
} from '@/lib/search/searchLearningActivity';
import {
    buildSearchLearningOpsSnapshot,
} from '@/lib/search/searchLearningOps';
import {
    buildSearchLearningRewriteSnapshot,
} from '@/lib/search/searchLearningRewrite';
import {
    buildSearchLearningTerminalSnapshot,
} from '@/lib/search/searchLearningTerminal';
import type { DiagnosticsResponse, SearchLearningActivityEvent, SearchLearningEntry } from './types';

type BuildSearchLearningWorkbenchParams = {
    entries: SearchLearningEntry[];
    activity: SearchLearningActivityEvent[];
    coverage?: DiagnosticsResponse['searchQualityCoverage'] | null;
    summary: {
        trackedSearches: number;
        observedSources: number;
        productOpens: number;
    };
};

const EMPTY_SEARCH_QUALITY_COVERAGE: DiagnosticsResponse['searchQualityCoverage'] = {
    totalQueries: 0,
    globalTargetQueries: 0,
    naverCovered: 0,
    globalCovered: 0,
    fullyCovered: 0,
    naverCoverageRate: 0,
    globalCoverageRate: 0,
    fullCoverageRate: 0,
    uncoveredQueries: [],
    clusters: [],
};

export function buildSearchLearningWorkbench({
    entries,
    activity,
    coverage,
    summary,
}: BuildSearchLearningWorkbenchParams) {
    const {
        searchLearningActivitySummary,
        searchLearningActivityRecommendations,
        searchLearningActivityOpsQueue,
        searchLearningActivityFollowups,
    } = buildSearchLearningActivitySnapshot({
        entries,
        activity,
    });
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
    } = buildSearchLearningOpsSnapshot({
        entries,
        activity,
        recommendations: searchLearningActivityRecommendations,
        opsQueue: searchLearningActivityOpsQueue,
        followups: searchLearningActivityFollowups,
    });
    const searchLearningImpactSummary = buildSearchLearningImpactSummary(entries);
    const searchLearningImpactClusterRollup = buildSearchLearningImpactClusterRollup(entries);
    const impactClusterSummaries = buildSearchLearningImpactClusterSummaries(entries);
    const searchLearningImpactClusters = impactClusterSummaries.slice(0, 6);
    const {
        searchLearningDraftEntries,
        searchLearningTerminalWorkflow,
        searchLearningTerminalAlerts,
        searchLearningTerminalHealth,
        searchLearningTerminalChecklist,
        searchLearningTerminalRunbook,
        searchLearningTerminalMetrics,
        searchLearningTerminalTrends,
        searchLearningTerminalWatchlist,
        searchLearningTerminalMetricsMaxDailyTotal,
        searchLearningTerminalCoverage,
        searchLearningTerminalPriorities,
        searchLearningTerminalOverview,
        searchLearningTerminalHandoff,
        searchLearningTerminalValidation,
    } = buildSearchLearningTerminalSnapshot({
        entries,
        activity,
        coverage: coverage || EMPTY_SEARCH_QUALITY_COVERAGE,
        summary,
        opsCenter: searchLearningOpsCenter,
        completionSummary: searchLearningOpsCompletionSummary,
        impactSummary: searchLearningImpactSummary,
        impactClusterRollup: searchLearningImpactClusterRollup,
    });
    const {
        searchLearningRewritePacks,
        searchLearningRewriteRecommendations,
        searchLearningRewriteRecommendationSummary,
        searchLearningRewriteSourceDrafts,
        searchLearningRewriteSourceDraftSummary,
        searchLearningRewriteSourceOps,
        searchLearningRewriteSourceOpsSummary,
        searchLearningRewriteSourceActionDrafts,
        searchLearningRewriteSourceActionDraftSummary,
        searchLearningRewriteSourceActionReviewQueue,
        searchLearningRewriteSourceActionReviewSummary,
        searchLearningRewriteSourceApprovalQueue,
        searchLearningRewriteSourceApprovalQueueSummary,
        searchLearningRewriteSourceApprovalActivity,
        searchLearningRewriteSourceApprovalActivitySummary,
    } = buildSearchLearningRewriteSnapshot({
        entries,
        impactClusters: impactClusterSummaries,
    });

    return {
        searchLearningActivitySummary,
        searchLearningActivityRecommendations,
        searchLearningActivityOpsQueue,
        searchLearningActivityFollowups,
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
        searchLearningDraftEntries,
        searchLearningImpactSummary,
        searchLearningTerminalWorkflow,
        searchLearningTerminalAlerts,
        searchLearningTerminalHealth,
        searchLearningTerminalChecklist,
        searchLearningTerminalRunbook,
        searchLearningTerminalMetrics,
        searchLearningTerminalTrends,
        searchLearningTerminalWatchlist,
        searchLearningTerminalMetricsMaxDailyTotal,
        searchLearningImpactClusterRollup,
        searchLearningImpactClusters,
        searchLearningTerminalCoverage,
        searchLearningTerminalPriorities,
        searchLearningTerminalOverview,
        searchLearningTerminalHandoff,
        searchLearningTerminalValidation,
        searchLearningRewritePacks: searchLearningRewritePacks.slice(0, 6),
        searchLearningRewriteRecommendations,
        searchLearningRewriteRecommendationSummary,
        searchLearningRewriteSourceDrafts,
        searchLearningRewriteSourceDraftSummary,
        searchLearningRewriteSourceOps,
        searchLearningRewriteSourceOpsSummary,
        searchLearningRewriteSourceActionDrafts,
        searchLearningRewriteSourceActionDraftSummary,
        searchLearningRewriteSourceActionReviewQueue,
        searchLearningRewriteSourceActionReviewSummary,
        searchLearningRewriteSourceApprovalQueue,
        searchLearningRewriteSourceApprovalQueueSummary,
        searchLearningRewriteSourceApprovalActivity,
        searchLearningRewriteSourceApprovalActivitySummary,
    };
}

export type { SearchLearningActivityOpsQueueItem } from '@/lib/search/searchLearningActivity';
export type {
    SearchLearningOpsCenterItem,
    SearchLearningOpsCompletionAction,
    SearchLearningOpsCompletionQueueItem,
    OpsChainRecommendation,
    OpsChainQueueItem,
    SearchLearningOpsPlaybook,
    SearchLearningOpsPlaybookOutcome,
    SearchLearningOpsPlaybookRecommendation,
    OpsChainOutcome,
} from '@/lib/search/searchLearningOps';
export type { SearchLearningTerminalWorkflowAction } from '@/lib/search/searchLearningTerminal';
