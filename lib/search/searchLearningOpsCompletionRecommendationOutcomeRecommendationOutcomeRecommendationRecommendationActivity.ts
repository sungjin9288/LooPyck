import type { SearchLearningActivityEvent } from './queryLearningTypes.ts';
import type { SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction } from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.ts';

export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRun = {
    id: string;
    outcomeId: string;
    action: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction;
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

export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivitySummary = {
    totalRuns: number;
    reviewRuns: number;
    retrainRuns: number;
    uniqueQueries: number;
    recentRuns: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRun[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function parseRecommendationContext(
    context: string | null
): {
    outcomeId: string;
    action: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction;
} | null {
    if (!context) {
        return null;
    }

    if (context.startsWith('completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_review_')) {
        return {
            outcomeId: context.slice(
                'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_review_'.length
            ),
            action: 'review_now',
        };
    }

    if (context.startsWith('completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_retrain_')) {
        return {
            outcomeId: context.slice(
                'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_retrain_'.length
            ),
            action: 'retrain_now',
        };
    }

    return null;
}

function resolveRunMeta(
    action: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction
): Pick<
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRun,
    'title' | 'description' | 'actionLabel' | 'priority'
> {
    switch (action) {
        case 'review_now':
            return {
                title: 'Completion Outcome Recommendation Outcome Recommendation Outcome Recommendation Review Run',
                description:
                    'completion recommendation outcome recommendation outcome recommendation recommendation queue에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            };
        default:
            return {
                title: 'Completion Outcome Recommendation Outcome Recommendation Outcome Recommendation Retrain Run',
                description:
                    'completion recommendation outcome recommendation outcome recommendation recommendation queue에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            };
    }
}

function toRun(
    event: SearchLearningActivityEvent
): SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRun | null {
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

export function buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity(
    events: SearchLearningActivityEvent[]
): SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivitySummary {
    const runs = events
        .map(toRun)
        .filter(
            (run): run is SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRun =>
                Boolean(run)
        );
    const recentRuns = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
        totalRuns: runs.length,
        reviewRuns: runs.filter((run) => run.action === 'review_now').length,
        retrainRuns: runs.filter((run) => run.action === 'retrain_now').length,
        uniqueQueries: new Set(runs.flatMap((run) => run.queries)).size,
        recentRuns: recentRuns.slice(0, 6),
    };
}
