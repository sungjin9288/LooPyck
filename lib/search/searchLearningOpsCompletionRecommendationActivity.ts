import type { SearchLearningActivityEvent } from './queryLearning.ts';
import type { SearchLearningOpsCompletionRecommendationAction } from './searchLearningOpsCompletionRecommendations.ts';

export type SearchLearningOpsCompletionRecommendationRun = {
    id: string;
    outcomeId: string;
    action: SearchLearningOpsCompletionRecommendationAction;
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

export type SearchLearningOpsCompletionRecommendationActivitySummary = {
    totalRuns: number;
    reviewRuns: number;
    retrainRuns: number;
    uniqueQueries: number;
    recentRuns: SearchLearningOpsCompletionRecommendationRun[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function parseRecommendationContext(
    context: string | null
): { outcomeId: string; action: SearchLearningOpsCompletionRecommendationAction } | null {
    if (!context) {
        return null;
    }

    if (context.startsWith('completion_recommendation_review_')) {
        return {
            outcomeId: context.slice('completion_recommendation_review_'.length),
            action: 'review_now',
        };
    }

    if (context.startsWith('completion_recommendation_retrain_')) {
        return {
            outcomeId: context.slice('completion_recommendation_retrain_'.length),
            action: 'retrain_now',
        };
    }

    return null;
}

function resolveRunMeta(
    action: SearchLearningOpsCompletionRecommendationAction
): Pick<SearchLearningOpsCompletionRecommendationRun, 'title' | 'description' | 'actionLabel' | 'priority'> {
    switch (action) {
        case 'review_now':
            return {
                title: 'Completion Recommendation Review Run',
                description: 'completion recommendation에서 review 가능한 draft를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            };
        default:
            return {
                title: 'Completion Recommendation Retrain Run',
                description: 'completion recommendation에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            };
    }
}

function toRun(event: SearchLearningActivityEvent): SearchLearningOpsCompletionRecommendationRun | null {
    const parsed = parseRecommendationContext(event.context);
    if (!parsed) {
        return null;
    }

    const meta = resolveRunMeta(parsed.action);
    return {
        id: event.id,
        outcomeId: parsed.outcomeId,
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

export function buildSearchLearningOpsCompletionRecommendationActivity(
    events: SearchLearningActivityEvent[]
): SearchLearningOpsCompletionRecommendationActivitySummary {
    const runs = events.map(toRun).filter((run): run is SearchLearningOpsCompletionRecommendationRun => Boolean(run));
    const recentRuns = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
        totalRuns: runs.length,
        reviewRuns: runs.filter((run) => run.action === 'review_now').length,
        retrainRuns: runs.filter((run) => run.action === 'retrain_now').length,
        uniqueQueries: new Set(runs.flatMap((run) => run.queries)).size,
        recentRuns: recentRuns.slice(0, 6),
    };
}
