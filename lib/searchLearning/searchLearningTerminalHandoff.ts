import type { SearchLearningTerminalOverview } from './searchLearningTerminalOverview.ts';
import type { SearchLearningTerminalPrioritySummary } from './searchLearningTerminalPriorities.ts';
import type { SearchLearningTerminalRunbook } from './searchLearningTerminalRunbook.ts';
import type { SearchLearningTerminalWorkflowAction } from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalHandoffTone = 'rose' | 'amber' | 'sky' | 'emerald' | 'slate';

export type SearchLearningTerminalHandoffItem = {
    id: string;
    label: string;
    title: string;
    summary: string;
    tone: SearchLearningTerminalHandoffTone;
    action: SearchLearningTerminalWorkflowAction | null;
};

export type SearchLearningTerminalHandoff = {
    status: SearchLearningTerminalOverview['status'];
    headline: string;
    current: SearchLearningTerminalHandoffItem;
    next: SearchLearningTerminalHandoffItem;
    followUp: SearchLearningTerminalHandoffItem;
};

function toneFromStatus(status: SearchLearningTerminalOverview['status']): SearchLearningTerminalHandoffTone {
    if (status === 'critical') {
        return 'rose';
    }
    if (status === 'action') {
        return 'amber';
    }
    if (status === 'monitoring') {
        return 'sky';
    }
    return 'emerald';
}

function titleFromAction(action: SearchLearningTerminalWorkflowAction | null, fallback: string): string {
    return action?.title || fallback;
}

export function buildSearchLearningTerminalHandoff(
    overview: SearchLearningTerminalOverview,
    priorities: SearchLearningTerminalPrioritySummary,
    runbook: SearchLearningTerminalRunbook
): SearchLearningTerminalHandoff {
    const firstPriority = priorities.priorities[0] ?? null;
    const secondPriority = priorities.priorities[1] ?? null;
    const currentAction = firstPriority?.action || runbook.primaryAction || null;
    const nextAction = secondPriority?.action || null;

    const current: SearchLearningTerminalHandoffItem = {
        id: 'current',
        label: 'now',
        title: titleFromAction(currentAction, 'Terminal Current Action'),
        summary: firstPriority?.summary || overview.nextStep,
        tone: toneFromStatus(overview.status),
        action: currentAction,
    };

    const next: SearchLearningTerminalHandoffItem = {
        id: 'next',
        label: 'next',
        title: titleFromAction(nextAction, runbook.steps[1]?.title || 'Next Check'),
        summary: secondPriority?.summary || runbook.steps[1]?.description || runbook.summary,
        tone:
            overview.status === 'critical'
                ? 'amber'
                : overview.status === 'action'
                    ? 'sky'
                    : 'slate',
        action: nextAction,
    };

    const followUp: SearchLearningTerminalHandoffItem = {
        id: 'follow_up',
        label: 'follow-up',
        title: runbook.steps[2]?.title || 'Follow-up',
        summary: runbook.followUp,
        tone:
            overview.status === 'stable'
                ? 'emerald'
                : overview.status === 'monitoring'
                    ? 'sky'
                    : 'slate',
        action: null,
    };

    const headline =
        overview.status === 'critical'
            ? '지금 바로 실행할 일과 그 다음 수순만 보면 됩니다.'
            : overview.status === 'action'
                ? '현재 액션과 바로 다음 액션을 짧게 이어서 처리하면 됩니다.'
                : overview.status === 'monitoring'
                    ? '지금은 관찰과 follow-up 확인만 유지하면 됩니다.'
                    : '현재 terminal workflow는 안정 상태이며 follow-up만 확인하면 됩니다.';

    return {
        status: overview.status,
        headline,
        current,
        next,
        followUp,
    };
}
