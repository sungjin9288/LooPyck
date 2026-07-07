import type { SearchLearningTerminalMetrics } from './searchLearningTerminalMetrics.ts';
import type { SearchLearningTerminalWorkflowSummary } from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalTrendTone = 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';

export type SearchLearningTerminalTrendCard = {
    id: string;
    title: string;
    label: string;
    summary: string;
    tone: SearchLearningTerminalTrendTone;
    count: number;
};

export type SearchLearningTerminalTrends = {
    paceLabel: string;
    backlogLabel: string;
    approvalLabel: string;
    focusAreas: SearchLearningTerminalTrendCard[];
};

function average(values: number[]): number {
    if (values.length === 0) {
        return 0;
    }
    return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function relativeLabel(current: number, baseline: number, betterWhenLower = false): string {
    if (baseline <= 0 && current <= 0) {
        return betterWhenLower ? 'stable' : 'idle';
    }
    if (baseline <= 0) {
        return betterWhenLower ? 'rising' : 'accelerating';
    }

    const ratio = current / baseline;
    if (betterWhenLower) {
        if (ratio <= 0.8) {
            return 'falling';
        }
        if (ratio >= 1.2) {
            return 'rising';
        }
        return 'stable';
    }

    if (ratio >= 1.2) {
        return 'accelerating';
    }
    if (ratio <= 0.8) {
        return 'slowing';
    }
    return 'steady';
}

function approvalLabel(reviewed: number, approved: number): string {
    if (reviewed <= 0) {
        return 'awaiting_reviews';
    }
    const rate = approved / reviewed;
    if (rate >= 0.75) {
        return 'healthy';
    }
    if (rate >= 0.45) {
        return 'mixed';
    }
    return 'needs_attention';
}

export function buildSearchLearningTerminalTrends(
    workflow: SearchLearningTerminalWorkflowSummary,
    metrics: SearchLearningTerminalMetrics
): SearchLearningTerminalTrends {
    const trailing = metrics.trend.slice(-3);
    const leading = metrics.trend.slice(0, Math.max(0, metrics.trend.length - 3));
    const trailingTotal = trailing.reduce((sum, point) => sum + point.seeded + point.generated + point.reviewed, 0);
    const leadingAverage = average(
        leading.map((point) => point.seeded + point.generated + point.reviewed)
    );
    const trailingAverage = average(
        trailing.map((point) => point.seeded + point.generated + point.reviewed)
    );
    const pace = relativeLabel(trailingAverage, leadingAverage, false);

    const trailingReviews = trailing.reduce((sum, point) => sum + point.reviewed, 0);
    const trailingApproved = trailing.reduce((sum, point) => sum + point.approved, 0);
    const approval = approvalLabel(trailingReviews, trailingApproved);
    const backlog = relativeLabel(
        workflow.reviewNow + workflow.drafts + workflow.retrainNow,
        Math.max(1, workflow.observe + workflow.improved),
        true
    );

    const focusAreas: SearchLearningTerminalTrendCard[] = [
        {
            id: 'activity_pace',
            title: 'Activity Pace',
            label: pace,
            summary:
                pace === 'accelerating'
                    ? '최근 3일 활동량이 앞선 기간보다 빠르게 증가했습니다.'
                    : pace === 'slowing'
                        ? '최근 3일 activity가 줄어들어 운영 루프가 느려졌습니다.'
                        : pace === 'steady'
                            ? '최근 activity가 안정적으로 유지되고 있습니다.'
                            : '최근 activity가 거의 없어 fresh sample이 부족합니다.',
            tone:
                pace === 'accelerating'
                    ? 'emerald'
                    : pace === 'slowing'
                        ? 'amber'
                        : pace === 'steady'
                            ? 'sky'
                            : 'slate',
            count: trailingTotal,
        },
        {
            id: 'backlog_direction',
            title: 'Backlog Direction',
            label: backlog,
            summary:
                backlog === 'falling'
                    ? 'review/draft/retrain backlog가 관찰 대비 줄어드는 흐름입니다.'
                    : backlog === 'rising'
                        ? 'review/draft/retrain backlog가 다시 쌓이고 있습니다.'
                        : 'backlog가 큰 변화 없이 유지되고 있습니다.',
            tone:
                backlog === 'falling'
                    ? 'emerald'
                    : backlog === 'rising'
                        ? 'rose'
                        : 'sky',
            count: workflow.reviewNow + workflow.drafts + workflow.retrainNow,
        },
        {
            id: 'approval_quality',
            title: 'Approval Quality',
            label: approval,
            summary:
                approval === 'healthy'
                    ? '최근 review의 승인 비율이 높아 rewrite 방향이 안정적입니다.'
                    : approval === 'mixed'
                        ? '승인과 ignore가 같이 나오므로 draft quality를 더 봐야 합니다.'
                        : approval === 'needs_attention'
                            ? 'review 대비 승인율이 낮아 AI draft quality를 재조정해야 합니다.'
                            : '아직 review 표본이 부족해 승인 품질을 판단하기 어렵습니다.',
            tone:
                approval === 'healthy'
                    ? 'emerald'
                    : approval === 'mixed'
                        ? 'amber'
                        : approval === 'needs_attention'
                            ? 'rose'
                            : 'slate',
            count: trailingApproved,
        },
    ];

    return {
        paceLabel: pace,
        backlogLabel: backlog,
        approvalLabel: approval,
        focusAreas,
    };
}
