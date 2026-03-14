import type {
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationSummary,
} from './searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.ts';

export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueState =
    | 'execute_now'
    | 'needs_review'
    | 'sample_collection'
    | 'observe';

export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem = {
    id: string;
    recommendationId: string;
    title: string;
    description: string;
    reason: string;
    queueState: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueState;
    action: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction;
    actionLabel: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    outcomeStatus: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation['outcomeStatus'];
    createdAt: string;
    entryIds: string[];
    queries: string[];
    readyReviewCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
};

export type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueSummary = {
    total: number;
    executeNow: number;
    needsReview: number;
    sampleCollection: number;
    observe: number;
    urgent: number;
    topExecuteNow: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem[];
    topNeedsReview: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem[];
    topSampleCollection: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem[];
    topObserve: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem[];
};

function resolveQueueState(
    action: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction
): SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueState {
    switch (action) {
        case 'retrain_now':
            return 'execute_now';
        case 'review_now':
            return 'needs_review';
        case 'collect_samples':
            return 'sample_collection';
        default:
            return 'observe';
    }
}

function stateWeight(
    state: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueState
): number {
    switch (state) {
        case 'execute_now':
            return 4;
        case 'needs_review':
            return 3;
        case 'sample_collection':
            return 2;
        default:
            return 1;
    }
}

function priorityWeight(
    priority: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation['priority']
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

function toQueueItem(
    recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation
): SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem {
    return {
        id: `completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_queue:${recommendation.id}`,
        recommendationId: recommendation.id,
        title: recommendation.title,
        description: recommendation.description,
        reason: recommendation.reason,
        queueState: resolveQueueState(recommendation.action),
        action: recommendation.action,
        actionLabel: recommendation.actionLabel,
        priority: recommendation.priority,
        outcomeStatus: recommendation.outcomeStatus,
        createdAt: recommendation.createdAt,
        entryIds: recommendation.entryIds,
        queries: recommendation.queries,
        readyReviewCount: recommendation.readyReviewCount,
        noImprovementCount: recommendation.noImprovementCount,
        awaitingSamplesCount: recommendation.awaitingSamplesCount,
    };
}

function sortQueue(
    items: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem[]
): SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem[] {
    return [...items].sort((left, right) => {
        const stateDiff = stateWeight(right.queueState) - stateWeight(left.queueState);
        if (stateDiff !== 0) {
            return stateDiff;
        }

        const priorityDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
        if (priorityDiff !== 0) {
            return priorityDiff;
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

export function buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue(
    summary: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationSummary
): SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueSummary {
    const queue = sortQueue(
        [
            ...summary.topReviewNow,
            ...summary.topRetrainNow,
            ...summary.topCollectSamples,
            ...summary.topObserve,
        ].map(toQueueItem)
    );

    return {
        total: queue.length,
        executeNow: queue.filter((item) => item.queueState === 'execute_now').length,
        needsReview: queue.filter((item) => item.queueState === 'needs_review').length,
        sampleCollection: queue.filter((item) => item.queueState === 'sample_collection').length,
        observe: queue.filter((item) => item.queueState === 'observe').length,
        urgent: queue.filter((item) => item.queueState === 'execute_now' || item.queueState === 'needs_review').length,
        topExecuteNow: queue.filter((item) => item.queueState === 'execute_now').slice(0, 4),
        topNeedsReview: queue.filter((item) => item.queueState === 'needs_review').slice(0, 4),
        topSampleCollection: queue.filter((item) => item.queueState === 'sample_collection').slice(0, 4),
        topObserve: queue.filter((item) => item.queueState === 'observe').slice(0, 4),
    };
}
