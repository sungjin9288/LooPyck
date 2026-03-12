import type {
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome,
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeStatus,
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeSummary,
} from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.ts';

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction =
    | 'review_now'
    | 'retrain_now'
    | 'collect_samples'
    | 'observe';

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation = {
    id: string;
    outcomeId: string;
    title: string;
    description: string;
    reason: string;
    action: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction;
    actionLabel: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    outcomeStatus: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeStatus;
    createdAt: string;
    entryIds: string[];
    queries: string[];
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
    readyReviewCount: number;
};

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationSummary = {
    total: number;
    reviewNow: number;
    retrainNow: number;
    collectSamples: number;
    observe: number;
    critical: number;
    highPriority: number;
    topReviewNow: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation[];
    topRetrainNow: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation[];
    topCollectSamples: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation[];
    topObserve: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation[];
};

function classifyOutcome(
    outcome: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome
): Pick<
    SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation,
    'action' | 'actionLabel' | 'priority' | 'description' | 'reason'
> {
    switch (outcome.status) {
        case 'ready_review':
            return {
                action: 'review_now',
                actionLabel: 'review 즉시 승인',
                priority: outcome.readyReviewCount >= 2 ? 'critical' : 'high',
                description: '후속 outcome이 review 가능한 draft로 이어져 지금 바로 승인 루프로 넘길 수 있습니다.',
                reason: `${outcome.readyReviewCount}개의 query가 후속 outcome 단계에서 review 대기 상태입니다.`,
            };
        case 'needs_attention':
            return {
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                priority: outcome.noImprovementCount >= 2 ? 'critical' : 'high',
                description: '후속 outcome 이후에도 개선이 약한 query가 남아 있어 추가 재학습이 필요합니다.',
                reason: `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
            };
        case 'awaiting_samples':
            return {
                action: 'collect_samples',
                actionLabel: '표본 수집 대상 선택',
                priority: 'medium',
                description: '후속 outcome은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.',
                reason: `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
            };
        default:
            return {
                action: 'observe',
                actionLabel: '개선 query 선택',
                priority: 'low',
                description: '후속 outcome이 안정적으로 개선 상태를 유지하고 있어 관찰 대상으로 넘기면 됩니다.',
                reason: `${outcome.improvedCount}개의 query가 개선 상태를 유지하고 있습니다.`,
            };
    }
}

function priorityWeight(
    priority: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation['priority']
): number {
    switch (priority) {
        case 'critical':
            return 4;
        case 'high':
            return 3;
        case 'medium':
            return 2;
        default:
            return 1;
    }
}

function sortRecommendations(
    items: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation[]
): SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation[] {
    return [...items].sort((left, right) => {
        const weightDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
        if (weightDiff !== 0) {
            return weightDiff;
        }

        if (right.noImprovementCount !== left.noImprovementCount) {
            return right.noImprovementCount - left.noImprovementCount;
        }

        if (right.readyReviewCount !== left.readyReviewCount) {
            return right.readyReviewCount - left.readyReviewCount;
        }

        if (right.awaitingSamplesCount !== left.awaitingSamplesCount) {
            return right.awaitingSamplesCount - left.awaitingSamplesCount;
        }

        return right.createdAt.localeCompare(left.createdAt);
    });
}

function toRecommendation(
    outcome: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome
): SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation {
    const classification = classifyOutcome(outcome);

    return {
        id: `playbook_recommendation_outcome_recommendation_outcome_recommendation:${outcome.id}`,
        outcomeId: outcome.outcomeId,
        title: outcome.title,
        description: classification.description,
        reason: classification.reason,
        action: classification.action,
        actionLabel: classification.actionLabel,
        priority: classification.priority,
        outcomeStatus: outcome.status,
        createdAt: outcome.createdAt,
        entryIds: outcome.entryIds,
        queries: outcome.queries,
        improvedCount: outcome.improvedCount,
        noImprovementCount: outcome.noImprovementCount,
        awaitingSamplesCount: outcome.awaitingSamplesCount,
        readyReviewCount: outcome.readyReviewCount,
    };
}

export function buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations(
    outcomes: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeSummary
): SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationSummary {
    const recommendations = sortRecommendations(
        [
            ...outcomes.topReadyReview,
            ...outcomes.topNeedsAttention,
            ...outcomes.topAwaitingSamples,
            ...outcomes.topValidated,
        ].map(toRecommendation)
    );

    const reviewNow = recommendations.filter((item) => item.action === 'review_now');
    const retrainNow = recommendations.filter((item) => item.action === 'retrain_now');
    const collectSamples = recommendations.filter((item) => item.action === 'collect_samples');
    const observe = recommendations.filter((item) => item.action === 'observe');

    return {
        total: recommendations.length,
        reviewNow: reviewNow.length,
        retrainNow: retrainNow.length,
        collectSamples: collectSamples.length,
        observe: observe.length,
        critical: recommendations.filter((item) => item.priority === 'critical').length,
        highPriority: recommendations.filter((item) => item.priority === 'high').length,
        topReviewNow: reviewNow.slice(0, 4),
        topRetrainNow: retrainNow.slice(0, 4),
        topCollectSamples: collectSamples.slice(0, 4),
        topObserve: observe.slice(0, 4),
    };
}
