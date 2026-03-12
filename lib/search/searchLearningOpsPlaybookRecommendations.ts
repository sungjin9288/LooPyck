import type {
    SearchLearningOpsPlaybookOutcome,
    SearchLearningOpsPlaybookOutcomeStatus,
    SearchLearningOpsPlaybookOutcomeSummary,
} from './searchLearningOpsPlaybookOutcomes.ts';

export type SearchLearningOpsPlaybookRecommendationAction =
    | 'review_now'
    | 'retrain_now'
    | 'collect_samples'
    | 'observe';

export type SearchLearningOpsPlaybookRecommendation = {
    id: string;
    outcomeId: string;
    playbookId: string;
    title: string;
    description: string;
    reason: string;
    action: SearchLearningOpsPlaybookRecommendationAction;
    actionLabel: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    outcomeStatus: SearchLearningOpsPlaybookOutcomeStatus;
    createdAt: string;
    entryIds: string[];
    queries: string[];
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
    readyReviewCount: number;
};

export type SearchLearningOpsPlaybookRecommendationSummary = {
    total: number;
    reviewNow: number;
    retrainNow: number;
    collectSamples: number;
    observe: number;
    critical: number;
    highPriority: number;
    topReviewNow: SearchLearningOpsPlaybookRecommendation[];
    topRetrainNow: SearchLearningOpsPlaybookRecommendation[];
    topCollectSamples: SearchLearningOpsPlaybookRecommendation[];
    topObserve: SearchLearningOpsPlaybookRecommendation[];
};

function classifyOutcome(
    outcome: SearchLearningOpsPlaybookOutcome
): Pick<SearchLearningOpsPlaybookRecommendation, 'action' | 'actionLabel' | 'priority' | 'description' | 'reason'> {
    switch (outcome.status) {
        case 'ready_review':
            return {
                action: 'review_now',
                actionLabel: 'review 즉시 승인',
                priority: outcome.readyReviewCount >= 3 ? 'critical' : 'high',
                description: 'playbook 실행으로 review 가능한 draft가 쌓여 있어 바로 승인 루프로 넘길 수 있습니다.',
                reason: `${outcome.readyReviewCount}개의 review 대기 query가 승인 가능한 상태입니다.`,
            };
        case 'needs_attention':
            return {
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                priority: outcome.noImprovementCount >= 2 ? 'critical' : 'high',
                description: 'playbook 실행 후에도 개선되지 않은 query가 남아 있어 즉시 재학습 액션이 필요합니다.',
                reason: `${outcome.noImprovementCount}개의 query가 여전히 개선되지 않아 retrain이 필요합니다.`,
            };
        case 'awaiting_samples':
            return {
                action: 'collect_samples',
                actionLabel: '표본 수집 대상 선택',
                priority: 'medium',
                description: 'playbook은 실행됐지만 표본이 부족해 결과를 더 관찰해야 합니다.',
                reason: `${outcome.awaitingSamplesCount || outcome.entryIds.length}개의 query가 추가 샘플을 기다리고 있습니다.`,
            };
        default:
            return {
                action: 'observe',
                actionLabel: '개선 query 선택',
                priority: 'low',
                description: '개선된 batch지만 안정화 여부를 계속 확인해야 하므로 관찰 대상으로 유지합니다.',
                reason: `${outcome.improvedCount}개의 query가 개선 상태로 관찰 중입니다.`,
            };
    }
}

function priorityWeight(priority: SearchLearningOpsPlaybookRecommendation['priority']): number {
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
    items: SearchLearningOpsPlaybookRecommendation[]
): SearchLearningOpsPlaybookRecommendation[] {
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
    outcome: SearchLearningOpsPlaybookOutcome
): SearchLearningOpsPlaybookRecommendation {
    const classification = classifyOutcome(outcome);
    return {
        id: `playbook_recommendation:${outcome.id}`,
        outcomeId: outcome.id,
        playbookId: outcome.playbookId,
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

export function buildSearchLearningOpsPlaybookRecommendations(
    outcomes: SearchLearningOpsPlaybookOutcomeSummary
): SearchLearningOpsPlaybookRecommendationSummary {
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
