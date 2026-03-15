import type { SearchLearningTerminalCoverage } from './searchLearningTerminalCoverage.ts';
import type { SearchLearningTerminalHealth } from './searchLearningTerminalHealth.ts';
import type { SearchLearningTerminalMetrics } from './searchLearningTerminalMetrics.ts';
import type { SearchLearningTerminalPrioritySummary } from './searchLearningTerminalPriorities.ts';
import type { SearchLearningTerminalTrends } from './searchLearningTerminalTrends.ts';
import type { SearchLearningTerminalWorkflowSummary } from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalOverviewStatus = 'critical' | 'action' | 'monitoring' | 'stable';

export type SearchLearningTerminalOverviewSpotlight = {
    id: string;
    label: string;
    summary: string;
    tone: 'rose' | 'amber' | 'sky' | 'emerald' | 'slate';
};

export type SearchLearningTerminalOverview = {
    status: SearchLearningTerminalOverviewStatus;
    headline: string;
    summary: string;
    nextStep: string;
    primaryLane: 'review' | 'generate' | 'retrain' | 'samples' | 'observe' | 'coverage' | 'stable';
    healthScore: number;
    coverageScore: number;
    actionLoad: number;
    watchCount: number;
    spotlights: SearchLearningTerminalOverviewSpotlight[];
};

function mapStatus(
    health: SearchLearningTerminalHealth,
    priorities: SearchLearningTerminalPrioritySummary
): SearchLearningTerminalOverviewStatus {
    if (health.label === 'critical' || priorities.status === 'critical') {
        return 'critical';
    }
    if (health.label === 'warning' || priorities.status === 'action') {
        return 'action';
    }
    if (health.label === 'monitoring' || priorities.status === 'monitoring') {
        return 'monitoring';
    }
    return 'stable';
}

export function buildSearchLearningTerminalOverview(
    workflow: SearchLearningTerminalWorkflowSummary,
    health: SearchLearningTerminalHealth,
    priorities: SearchLearningTerminalPrioritySummary,
    metrics: SearchLearningTerminalMetrics,
    coverage: SearchLearningTerminalCoverage,
    trends: SearchLearningTerminalTrends
): SearchLearningTerminalOverview {
    const status = mapStatus(health, priorities);
    const primaryPriority = priorities.priorities[0] ?? null;
    const primaryLane = primaryPriority?.lane ?? (workflow.topActions[0]?.kind === 'review_now'
        ? 'review'
        : workflow.topActions[0]?.kind === 'generate_now'
            ? 'generate'
            : workflow.topActions[0]?.kind === 'retrain_now'
                ? 'retrain'
                : workflow.topActions[0]?.kind === 'sample_collection'
                    ? 'samples'
                    : workflow.topActions[0]?.kind === 'observe'
                        ? 'observe'
                        : workflow.topActions[0]?.kind === 'draft_review'
                            ? 'review'
                            : 'stable');

    const headline =
        status === 'critical'
            ? 'search-learning terminal이 막히기 전에 가장 급한 lane부터 처리해야 합니다.'
            : status === 'action'
                ? '운영상 바로 처리할 액션이 남아 있습니다.'
                : status === 'monitoring'
                    ? '긴급 병목은 줄었고, 지금은 관찰과 검증이 중심입니다.'
                    : 'search-learning terminal이 안정 상태에 있습니다.';

    const summary =
        primaryPriority
            ? `${primaryPriority.title}를 먼저 처리하면 terminal workflow가 가장 빨리 풀립니다. 현재 health ${health.score}, coverage ${coverage.coverageScore}, action load ${metrics.actionLoad} 기준입니다.`
            : `health ${health.score}, coverage ${coverage.coverageScore}, action load ${metrics.actionLoad} 기준으로 현재는 새로운 blocker보다 관찰이 중심입니다.`;

    const nextStep =
        primaryPriority?.action
            ? `${primaryPriority.action.actionLabel}으로 ${primaryPriority.count}개 query를 먼저 처리하세요.`
            : status === 'monitoring'
                ? '실제 검색을 반복해 sample과 impact 변화를 확인하세요.'
                : '새 low-fit/0건 query가 생길 때만 terminal workflow를 다시 시작하면 됩니다.';

    const spotlights: SearchLearningTerminalOverviewSpotlight[] = [
        {
            id: 'health',
            label: `health ${health.label}`,
            summary: health.summary,
            tone:
                health.label === 'critical'
                    ? 'rose'
                    : health.label === 'warning'
                        ? 'amber'
                        : health.label === 'monitoring'
                            ? 'sky'
                            : 'emerald',
        },
        {
            id: 'coverage',
            label: `coverage ${coverage.qualityLabel}`,
            summary:
                coverage.uncoveredQueries > 0
                    ? `미커버 query ${coverage.uncoveredQueries}건과 cluster gap ${coverage.uncoveredClusters}건이 남아 있습니다.`
                    : 'curated coverage 기준 큰 공백은 없습니다.',
            tone:
                coverage.qualityLabel === 'weak'
                    ? 'rose'
                    : coverage.qualityLabel === 'mixed'
                        ? 'amber'
                        : 'emerald',
        },
        {
            id: 'trend',
            label: `trend ${trends.paceLabel}`,
            summary: trends.focusAreas[0]?.summary || '최근 activity 추세를 먼저 확인하세요.',
            tone:
                trends.paceLabel === 'accelerating'
                    ? 'emerald'
                    : trends.paceLabel === 'slowing'
                        ? 'amber'
                        : trends.paceLabel === 'idle'
                            ? 'slate'
                            : 'sky',
        },
    ];

    return {
        status,
        headline,
        summary,
        nextStep,
        primaryLane,
        healthScore: health.score,
        coverageScore: coverage.coverageScore,
        actionLoad: metrics.actionLoad,
        watchCount: priorities.priorities.length,
        spotlights,
    };
}
