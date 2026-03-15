import type { SearchLearningTerminalAlertSummary } from './searchLearningTerminalAlerts.ts';
import type { SearchLearningTerminalCoverage } from './searchLearningTerminalCoverage.ts';
import type { SearchLearningTerminalHealth } from './searchLearningTerminalHealth.ts';
import type { SearchLearningTerminalWatchlist } from './searchLearningTerminalWatchlist.ts';
import type {
    SearchLearningTerminalWorkflowAction,
    SearchLearningTerminalWorkflowSummary,
} from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalPrioritySeverity = 'critical' | 'high' | 'medium' | 'low';

export type SearchLearningTerminalPriority = {
    id: string;
    source: 'coverage' | 'alert' | 'watchlist' | 'workflow';
    severity: SearchLearningTerminalPrioritySeverity;
    title: string;
    summary: string;
    count: number;
    lane: 'review' | 'generate' | 'retrain' | 'samples' | 'observe' | 'coverage';
    action: SearchLearningTerminalWorkflowAction | null;
};

export type SearchLearningTerminalPrioritySummary = {
    status: 'critical' | 'action' | 'monitoring' | 'stable';
    headline: string;
    critical: number;
    high: number;
    medium: number;
    low: number;
    priorities: SearchLearningTerminalPriority[];
};

function severityWeight(severity: SearchLearningTerminalPrioritySeverity): number {
    if (severity === 'critical') {
        return 4;
    }
    if (severity === 'high') {
        return 3;
    }
    if (severity === 'medium') {
        return 2;
    }
    return 1;
}

function laneForAction(action: SearchLearningTerminalWorkflowAction | null): SearchLearningTerminalPriority['lane'] {
    if (!action) {
        return 'observe';
    }

    if (action.kind === 'review_now' || action.kind === 'draft_review') {
        return 'review';
    }
    if (action.kind === 'generate_now') {
        return 'generate';
    }
    if (action.kind === 'retrain_now') {
        return 'retrain';
    }
    if (action.kind === 'sample_collection') {
        return 'samples';
    }
    return 'observe';
}

function pickWorkflowAction(
    workflow: SearchLearningTerminalWorkflowSummary,
    kinds: SearchLearningTerminalWorkflowAction['kind'][]
): SearchLearningTerminalWorkflowAction | null {
    for (const kind of kinds) {
        const found = workflow.topActions.find((action) => action.kind === kind);
        if (found) {
            return found;
        }
    }
    return null;
}

export function buildSearchLearningTerminalPriorities(
    workflow: SearchLearningTerminalWorkflowSummary,
    health: SearchLearningTerminalHealth,
    alerts: SearchLearningTerminalAlertSummary,
    coverage: SearchLearningTerminalCoverage,
    watchlist: SearchLearningTerminalWatchlist
): SearchLearningTerminalPrioritySummary {
    const priorities: SearchLearningTerminalPriority[] = [];

    if (coverage.uncoveredQueries > 0 || coverage.needsAttentionClusters > 0) {
        const action =
            coverage.uncoveredQueries > 0
                ? pickWorkflowAction(workflow, ['generate_now', 'draft_review', 'review_now'])
                : pickWorkflowAction(workflow, ['retrain_now', 'review_now']);

        priorities.push({
            id: 'terminal_priority_coverage',
            source: 'coverage',
            severity:
                coverage.qualityLabel === 'weak'
                    ? 'critical'
                    : coverage.qualityLabel === 'mixed'
                        ? 'high'
                        : 'medium',
            title: 'Coverage Gap First',
            summary:
                coverage.uncoveredQueries > 0
                    ? `미커버 query ${coverage.uncoveredQueries}건과 cluster gap ${coverage.uncoveredClusters}건이 남아 있어 coverage 우선 보정이 필요합니다.`
                    : `coverage는 유지되지만 tuning이 필요한 cluster ${coverage.needsAttentionClusters}건이 남아 있습니다.`,
            count: coverage.uncoveredQueries > 0 ? coverage.uncoveredQueries : coverage.needsAttentionClusters,
            lane: coverage.uncoveredQueries > 0 ? 'coverage' : laneForAction(action),
            action,
        });
    }

    alerts.topAlerts
        .filter((alert) => alert.severity !== 'success' && alert.action)
        .slice(0, 2)
        .forEach((alert) => {
            priorities.push({
                id: `terminal_priority_alert_${alert.id}`,
                source: 'alert',
                severity:
                    alert.severity === 'critical'
                        ? 'critical'
                        : alert.severity === 'warning'
                            ? 'high'
                            : 'medium',
                title: alert.title,
                summary: alert.description,
                count: alert.count,
                lane: laneForAction(alert.action),
                action: alert.action,
            });
        });

    watchlist.items.slice(0, 2).forEach((item) => {
        priorities.push({
            id: `terminal_priority_watch_${item.id}`,
            source: 'watchlist',
            severity: item.priority,
            title: item.title,
            summary: item.description,
            count: item.count,
            lane: laneForAction(item.action),
            action: item.action,
        });
    });

    if (priorities.length === 0 && workflow.topActions.length > 0) {
        const fallback = workflow.topActions[0];
        priorities.push({
            id: `terminal_priority_workflow_${fallback.id}`,
            source: 'workflow',
            severity: 'low',
            title: fallback.title,
            summary: fallback.description,
            count: fallback.count,
            lane: laneForAction(fallback),
            action: fallback,
        });
    }

    const deduped: SearchLearningTerminalPriority[] = [];
    const seen = new Set<string>();
    priorities
        .sort((left, right) => {
            if (severityWeight(right.severity) !== severityWeight(left.severity)) {
                return severityWeight(right.severity) - severityWeight(left.severity);
            }
            return right.count - left.count;
        })
        .forEach((priority) => {
            const dedupeKey = priority.action
                ? `${priority.lane}:${priority.action.entryIds.join(',')}`
                : `${priority.source}:${priority.id}`;
            if (seen.has(dedupeKey)) {
                return;
            }
            seen.add(dedupeKey);
            deduped.push(priority);
        });

    const limited = deduped.slice(0, 4);
    const critical = limited.filter((item) => item.severity === 'critical').length;
    const high = limited.filter((item) => item.severity === 'high').length;
    const medium = limited.filter((item) => item.severity === 'medium').length;
    const low = limited.filter((item) => item.severity === 'low').length;

    const status =
        critical > 0
            ? 'critical'
            : high > 0 || health.label === 'warning'
                ? 'action'
                : medium > 0 || health.label === 'monitoring'
                    ? 'monitoring'
                    : 'stable';

    const headline =
        status === 'critical'
            ? '가장 먼저 막아야 할 terminal blocker가 있습니다.'
            : status === 'action'
                ? '지금 처리할 우선순위 액션이 남아 있습니다.'
                : status === 'monitoring'
                    ? '긴급하지는 않지만 계속 볼 lane가 남아 있습니다.'
                    : '지금은 terminal surface 기준 긴급 우선순위가 없습니다.';

    return {
        status,
        headline,
        critical,
        high,
        medium,
        low,
        priorities: limited,
    };
}
