import type { SearchLearningImpactClusterRollup, SearchLearningImpactSummary } from './searchLearningImpact.ts';
import type { SearchLearningOpsCompletionSummary } from './searchLearningOpsCompletionSummary.ts';
import type { SearchLearningOpsCenterSummary } from './searchLearningOpsCenter.ts';
import type { SearchLearningActivityEvent, SearchLearningEntry } from '../search/queryLearningTypes.ts';
import type { SearchQualityCoverageSummary } from '../search/searchQualityCoverage.ts';
import { buildSearchLearningTerminalAlerts } from './searchLearningTerminalAlerts.ts';
import { buildSearchLearningTerminalChecklist } from './searchLearningTerminalChecklist.ts';
import type { SearchLearningTerminalCoverage } from './searchLearningTerminalCoverage.ts';
import { buildSearchLearningTerminalCoverage } from './searchLearningTerminalCoverage.ts';
import { buildSearchLearningTerminalHandoff } from './searchLearningTerminalHandoff.ts';
import { buildSearchLearningTerminalHealth } from './searchLearningTerminalHealth.ts';
import { buildSearchLearningTerminalMetrics } from './searchLearningTerminalMetrics.ts';
import { buildSearchLearningTerminalOverview } from './searchLearningTerminalOverview.ts';
import { buildSearchLearningTerminalPriorities } from './searchLearningTerminalPriorities.ts';
import { buildSearchLearningTerminalRunbook } from './searchLearningTerminalRunbook.ts';
import { buildSearchLearningTerminalTrends } from './searchLearningTerminalTrends.ts';
import { buildSearchLearningTerminalValidation } from './searchLearningTerminalValidation.ts';
import { buildSearchLearningTerminalWatchlist } from './searchLearningTerminalWatchlist.ts';
import { buildSearchLearningTerminalWorkflow } from './searchLearningTerminalWorkflow.ts';

type SearchLearningTerminalSummaryInputs = {
    trackedSearches: number;
    observedSources: number;
    productOpens: number;
};

export type SearchLearningTerminalSnapshot = {
    searchLearningDraftEntries: SearchLearningEntry[];
    searchLearningTerminalWorkflow: ReturnType<typeof buildSearchLearningTerminalWorkflow>;
    searchLearningTerminalAlerts: ReturnType<typeof buildSearchLearningTerminalAlerts>;
    searchLearningTerminalHealth: ReturnType<typeof buildSearchLearningTerminalHealth>;
    searchLearningTerminalChecklist: ReturnType<typeof buildSearchLearningTerminalChecklist>;
    searchLearningTerminalRunbook: ReturnType<typeof buildSearchLearningTerminalRunbook>;
    searchLearningTerminalMetrics: ReturnType<typeof buildSearchLearningTerminalMetrics>;
    searchLearningTerminalTrends: ReturnType<typeof buildSearchLearningTerminalTrends>;
    searchLearningTerminalWatchlist: ReturnType<typeof buildSearchLearningTerminalWatchlist>;
    searchLearningTerminalMetricsMaxDailyTotal: number;
    searchLearningTerminalCoverage: SearchLearningTerminalCoverage;
    searchLearningTerminalPriorities: ReturnType<typeof buildSearchLearningTerminalPriorities>;
    searchLearningTerminalOverview: ReturnType<typeof buildSearchLearningTerminalOverview>;
    searchLearningTerminalHandoff: ReturnType<typeof buildSearchLearningTerminalHandoff>;
    searchLearningTerminalValidation: ReturnType<typeof buildSearchLearningTerminalValidation>;
};

export function buildSearchLearningTerminalSnapshot({
    entries,
    activity,
    coverage,
    summary,
    opsCenter,
    completionSummary,
    impactSummary,
    impactClusterRollup,
}: {
    entries: SearchLearningEntry[];
    activity: SearchLearningActivityEvent[];
    coverage: SearchQualityCoverageSummary;
    summary: SearchLearningTerminalSummaryInputs;
    opsCenter: SearchLearningOpsCenterSummary;
    completionSummary: SearchLearningOpsCompletionSummary;
    impactSummary: SearchLearningImpactSummary;
    impactClusterRollup: SearchLearningImpactClusterRollup;
}): SearchLearningTerminalSnapshot {
    const searchLearningDraftEntries = entries.filter(
        (entry) => entry.status === 'pending' && entry.aiSuggestion && entry.aiSuggestion.suggestedQueries.length > 0
    );
    const searchLearningTerminalWorkflow = buildSearchLearningTerminalWorkflow(
        entries,
        searchLearningDraftEntries,
        opsCenter,
        completionSummary,
        impactSummary
    );
    const searchLearningTerminalAlerts = buildSearchLearningTerminalAlerts(searchLearningTerminalWorkflow);
    const searchLearningTerminalHealth = buildSearchLearningTerminalHealth(
        searchLearningTerminalWorkflow,
        searchLearningTerminalAlerts
    );
    const searchLearningTerminalChecklist = buildSearchLearningTerminalChecklist(
        searchLearningTerminalWorkflow,
        searchLearningTerminalHealth
    );
    const searchLearningTerminalRunbook = buildSearchLearningTerminalRunbook(searchLearningTerminalWorkflow);
    const searchLearningTerminalMetrics = buildSearchLearningTerminalMetrics(
        searchLearningTerminalWorkflow,
        searchLearningTerminalHealth,
        searchLearningTerminalAlerts,
        activity
    );
    const searchLearningTerminalTrends = buildSearchLearningTerminalTrends(
        searchLearningTerminalWorkflow,
        searchLearningTerminalMetrics
    );
    const searchLearningTerminalWatchlist = buildSearchLearningTerminalWatchlist(
        searchLearningTerminalWorkflow,
        opsCenter,
        impactSummary
    );
    const searchLearningTerminalMetricsMaxDailyTotal = Math.max(
        1,
        ...searchLearningTerminalMetrics.trend.map((point) => point.seeded + point.generated + point.reviewed)
    );
    const searchLearningTerminalCoverage = buildSearchLearningTerminalCoverage(
        coverage,
        impactClusterRollup
    );
    const searchLearningTerminalPriorities = buildSearchLearningTerminalPriorities(
        searchLearningTerminalWorkflow,
        searchLearningTerminalHealth,
        searchLearningTerminalAlerts,
        searchLearningTerminalCoverage,
        searchLearningTerminalWatchlist
    );
    const searchLearningTerminalOverview = buildSearchLearningTerminalOverview(
        searchLearningTerminalWorkflow,
        searchLearningTerminalHealth,
        searchLearningTerminalPriorities,
        searchLearningTerminalMetrics,
        searchLearningTerminalCoverage,
        searchLearningTerminalTrends
    );
    const searchLearningTerminalHandoff = buildSearchLearningTerminalHandoff(
        searchLearningTerminalOverview,
        searchLearningTerminalPriorities,
        searchLearningTerminalRunbook
    );
    const searchLearningTerminalValidation = buildSearchLearningTerminalValidation(
        searchLearningTerminalOverview,
        searchLearningTerminalHandoff,
        searchLearningTerminalWorkflow,
        searchLearningTerminalCoverage,
        summary
    );

    return {
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
    };
}
