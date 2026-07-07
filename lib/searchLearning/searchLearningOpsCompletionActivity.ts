import type { SearchLearningActivityEvent } from '../search/queryLearningTypes.ts';

export type SearchLearningOpsCompletionActivityAction =
    | 'execute_now'
    | 'review_now';

export type SearchLearningOpsCompletionActivityRun = {
    id: string;
    action: SearchLearningOpsCompletionActivityAction;
    title: string;
    description: string;
    actionLabel: string;
    priority: 'critical' | 'high';
    context: string;
    count: number;
    entryIds: string[];
    queries: string[];
    actorUid: string | null;
    createdAt: string;
};

export type SearchLearningOpsCompletionActivitySummary = {
    totalRuns: number;
    executeRuns: number;
    reviewRuns: number;
    uniqueQueries: number;
    recentRuns: SearchLearningOpsCompletionActivityRun[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function parseCompletionContext(
    context: string | null
): { action: SearchLearningOpsCompletionActivityAction } | null {
    if (!context) {
        return null;
    }

    if (context.startsWith('completion_execute_generate')) {
        return { action: 'execute_now' };
    }

    if (context.startsWith('completion_review_approve')) {
        return { action: 'review_now' };
    }

    return null;
}

function resolveRunMeta(
    action: SearchLearningOpsCompletionActivityAction
): Pick<SearchLearningOpsCompletionActivityRun, 'title' | 'description' | 'actionLabel' | 'priority'> {
    switch (action) {
        case 'review_now':
            return {
                title: 'Completion Review Run',
                description: 'completion queue에서 review 대기 query를 즉시 승인한 실행 기록입니다.',
                actionLabel: '즉시 승인',
                priority: 'critical',
            };
        default:
            return {
                title: 'Completion Execute Run',
                description: 'completion queue에서 즉시 실행 query에 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '즉시 AI 제안',
                priority: 'high',
            };
    }
}

function toRun(event: SearchLearningActivityEvent): SearchLearningOpsCompletionActivityRun | null {
    const parsed = parseCompletionContext(event.context);
    if (!parsed) {
        return null;
    }

    const meta = resolveRunMeta(parsed.action);
    return {
        id: event.id,
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

export function buildSearchLearningOpsCompletionActivity(
    events: SearchLearningActivityEvent[]
): SearchLearningOpsCompletionActivitySummary {
    const runs = events.map(toRun).filter((run): run is SearchLearningOpsCompletionActivityRun => Boolean(run));
    const recentRuns = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
        totalRuns: runs.length,
        executeRuns: runs.filter((run) => run.action === 'execute_now').length,
        reviewRuns: runs.filter((run) => run.action === 'review_now').length,
        uniqueQueries: new Set(runs.flatMap((run) => run.queries)).size,
        recentRuns: recentRuns.slice(0, 6),
    };
}
