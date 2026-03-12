import type { SearchLearningActivityEvent } from './queryLearning.ts';
import type { SearchLearningOpsPlaybookAction } from './searchLearningOpsPlaybooks.ts';

export type SearchLearningOpsPlaybookRun = {
    id: string;
    playbookId: string;
    action: SearchLearningOpsPlaybookAction;
    title: string;
    description: string;
    actionLabel: string;
    priority: 'critical' | 'high' | 'medium';
    context: string;
    count: number;
    entryIds: string[];
    queries: string[];
    actorUid: string | null;
    createdAt: string;
};

export type SearchLearningOpsPlaybookActivitySummary = {
    totalRuns: number;
    approvalRuns: number;
    generationRuns: number;
    retrainRuns: number;
    uniqueQueries: number;
    recentRuns: SearchLearningOpsPlaybookRun[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function parsePlaybookContext(context: string | null): { playbookId: string; action: SearchLearningOpsPlaybookAction } | null {
    if (!context) {
        return null;
    }

    if (context.startsWith('ops_playbook_approve_')) {
        return {
            playbookId: context.slice('ops_playbook_approve_'.length),
            action: 'approve_batch',
        };
    }

    if (context.startsWith('ops_playbook_generate_')) {
        const playbookId = context.slice('ops_playbook_generate_'.length);
        return {
            playbookId,
            action: playbookId === 'retrain' ? 'retrain_batch' : 'generate_batch',
        };
    }

    return null;
}

function resolveRunMeta(
    action: SearchLearningOpsPlaybookAction
): Pick<SearchLearningOpsPlaybookRun, 'title' | 'description' | 'actionLabel' | 'priority'> {
    switch (action) {
        case 'approve_batch':
            return {
                title: 'Review Pending Batch',
                description: 'AI suggestion이 생성된 pending query를 배치 승인한 실행 기록입니다.',
                actionLabel: '즉시 승인',
                priority: 'critical',
            };
        case 'retrain_batch':
            return {
                title: 'Retrain Batch',
                description: '개선이 없는 query에 재학습 AI suggestion을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            };
        default:
            return {
                title: 'Generate Needed Batch',
                description: 'seed query에 대한 AI suggestion을 배치 생성한 실행 기록입니다.',
                actionLabel: '즉시 AI 제안',
                priority: 'high',
            };
    }
}

function toRun(event: SearchLearningActivityEvent): SearchLearningOpsPlaybookRun | null {
    const parsed = parsePlaybookContext(event.context);
    if (!parsed) {
        return null;
    }

    const meta = resolveRunMeta(parsed.action);
    return {
        id: event.id,
        playbookId: parsed.playbookId,
        action: parsed.action,
        title: meta.title,
        description: meta.description,
        actionLabel: meta.actionLabel,
        priority: meta.priority,
        context: event.context || '',
        count: event.count,
        entryIds: uniqueOrdered(event.entryIds).slice(0, 24),
        queries: uniqueOrdered(event.queries).slice(0, 8),
        actorUid: event.actorUid,
        createdAt: event.createdAt,
    };
}

export function buildSearchLearningOpsPlaybookActivity(
    events: SearchLearningActivityEvent[]
): SearchLearningOpsPlaybookActivitySummary {
    const runs = events.map(toRun).filter((run): run is SearchLearningOpsPlaybookRun => Boolean(run));
    const recentRuns = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
        totalRuns: runs.length,
        approvalRuns: runs.filter((run) => run.action === 'approve_batch').length,
        generationRuns: runs.filter((run) => run.action === 'generate_batch').length,
        retrainRuns: runs.filter((run) => run.action === 'retrain_batch').length,
        uniqueQueries: new Set(runs.flatMap((run) => run.queries)).size,
        recentRuns: recentRuns.slice(0, 6),
    };
}
