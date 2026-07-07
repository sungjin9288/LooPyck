import type { SearchLearningActivityEvent } from '../search/queryLearningTypes.ts';
import type { SearchLearningTerminalAlertSummary } from './searchLearningTerminalAlerts.ts';
import type { SearchLearningTerminalHealth } from './searchLearningTerminalHealth.ts';
import type { SearchLearningTerminalWorkflowSummary } from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalMetricPoint = {
    day: string;
    seeded: number;
    generated: number;
    reviewed: number;
    approved: number;
    ignored: number;
};

export type SearchLearningTerminalMetrics = {
    healthScore: number;
    criticalAlerts: number;
    backlogPressure: number;
    actionLoad: number;
    activeDays: number;
    recentGenerated: number;
    recentReviewed: number;
    recentApproved: number;
    recentIgnored: number;
    trend: SearchLearningTerminalMetricPoint[];
};

function toDay(value: string): string {
    return value.slice(0, 10);
}

function buildRecentDays(referenceDay: string, days: number): string[] {
    const date = new Date(`${referenceDay}T00:00:00.000Z`);
    const entries: string[] = [];
    for (let offset = days - 1; offset >= 0; offset -= 1) {
        const current = new Date(date);
        current.setUTCDate(date.getUTCDate() - offset);
        entries.push(current.toISOString().slice(0, 10));
    }
    return entries;
}

export function buildSearchLearningTerminalMetrics(
    workflow: SearchLearningTerminalWorkflowSummary,
    health: SearchLearningTerminalHealth,
    alerts: SearchLearningTerminalAlertSummary,
    events: SearchLearningActivityEvent[]
): SearchLearningTerminalMetrics {
    const referenceDay =
        events.length > 0
            ? toDay(
                events
                    .map((event) => event.createdAt)
                    .sort((left, right) => right.localeCompare(left))[0]
            )
            : new Date().toISOString().slice(0, 10);
    const days = buildRecentDays(referenceDay, 7);
    const trendMap = new Map<string, SearchLearningTerminalMetricPoint>(
        days.map((day) => [
            day,
            {
                day,
                seeded: 0,
                generated: 0,
                reviewed: 0,
                approved: 0,
                ignored: 0,
            },
        ])
    );

    for (const event of events) {
        const point = trendMap.get(toDay(event.createdAt));
        if (!point) {
            continue;
        }

        if (event.type === 'seed_queries') {
            point.seeded += event.count;
        } else if (event.type === 'generate_suggestions') {
            point.generated += event.count;
        } else if (event.type === 'review_entries') {
            point.reviewed += event.count;
            if (event.reviewedStatus === 'approved') {
                point.approved += event.count;
            } else if (event.reviewedStatus === 'ignored') {
                point.ignored += event.count;
            }
        }
    }

    const trend = days.map((day) => trendMap.get(day)!);
    const activeDays = trend.filter((point) => point.seeded + point.generated + point.reviewed > 0).length;

    return {
        healthScore: health.score,
        criticalAlerts: alerts.critical,
        backlogPressure: workflow.reviewNow + workflow.drafts + workflow.retrainNow + workflow.sampleCollection,
        actionLoad: workflow.reviewNow + workflow.drafts + workflow.generateNow + workflow.retrainNow,
        activeDays,
        recentGenerated: trend.reduce((sum, point) => sum + point.generated, 0),
        recentReviewed: trend.reduce((sum, point) => sum + point.reviewed, 0),
        recentApproved: trend.reduce((sum, point) => sum + point.approved, 0),
        recentIgnored: trend.reduce((sum, point) => sum + point.ignored, 0),
        trend,
    };
}
