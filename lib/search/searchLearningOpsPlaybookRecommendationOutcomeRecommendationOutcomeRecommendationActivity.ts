import type { SearchLearningActivityEvent } from './queryLearning.ts';
import type { SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.ts';

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRun = {
    id: string;
    outcomeId: string;
    action: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction;
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

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivitySummary = {
    totalRuns: number;
    reviewRuns: number;
    retrainRuns: number;
    uniqueQueries: number;
    recentRuns: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRun[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function parseRecommendationContext(
    context: string | null
): { outcomeId: string; action: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction } | null {
    if (!context) {
        return null;
    }

    if (context.startsWith('ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_')) {
        return {
            outcomeId: context.slice('ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_'.length),
            action: 'review_now',
        };
    }

    if (context.startsWith('ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_')) {
        return {
            outcomeId: context.slice('ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_'.length),
            action: 'retrain_now',
        };
    }

    return null;
}

function resolveRunMeta(
    action: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction
): Pick<
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRun,
    'title' | 'description' | 'actionLabel' | 'priority'
> {
    switch (action) {
        case 'review_now':
            return {
                title: 'Outcome Recommendation Outcome Recommendation Review Run',
                description: 'outcome recommendation outcome recommendation queue에서 review pending query를 즉시 승인한 실행 기록입니다.',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
            };
        default:
            return {
                title: 'Outcome Recommendation Outcome Recommendation Retrain Run',
                description: 'outcome recommendation outcome recommendation queue에서 개선이 약한 query에 재학습 AI 제안을 생성한 실행 기록입니다.',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
            };
    }
}

function toRun(event: SearchLearningActivityEvent): SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRun | null {
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

export function buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity(
    events: SearchLearningActivityEvent[]
): SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivitySummary {
    const runs = events
        .map(toRun)
        .filter((run): run is SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRun => Boolean(run));
    const recentRuns = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
        totalRuns: runs.length,
        reviewRuns: runs.filter((run) => run.action === 'review_now').length,
        retrainRuns: runs.filter((run) => run.action === 'retrain_now').length,
        uniqueQueries: new Set(runs.flatMap((run) => run.queries)).size,
        recentRuns: recentRuns.slice(0, 6),
    };
}
