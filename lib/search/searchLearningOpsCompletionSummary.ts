import type {
    OpsChainActivitySummary,
    OpsChainOutcomeSummary,
    OpsChainQueueItem,
    OpsChainQueueSummary,
} from './searchLearningOpsChain.ts';

export type SearchLearningOpsCompletionState =
    | 'action_required'
    | 'review_required'
    | 'sampling'
    | 'monitoring'
    | 'stable';

export type SearchLearningOpsCompletionItem = {
    id: string;
    recommendationId: string;
    title: string;
    description: string;
    reason: string;
    state: SearchLearningOpsCompletionState;
    priority: OpsChainQueueItem['priority'];
    actionLabel: string;
    queueState: OpsChainQueueItem['queueState'];
    entryIds: string[];
    queries: string[];
    createdAt: string;
    outcomeStatus: OpsChainQueueItem['outcomeStatus'];
};

export type SearchLearningOpsCompletionSummary = {
    state: SearchLearningOpsCompletionState;
    total: number;
    executeNow: number;
    needsReview: number;
    sampleCollection: number;
    observe: number;
    validated: number;
    recentRuns: number;
    stableSignals: number;
    immediateCount: number;
    topImmediate: SearchLearningOpsCompletionItem[];
    topSampling: SearchLearningOpsCompletionItem[];
    topObserve: SearchLearningOpsCompletionItem[];
};

function resolveState(
    queue: OpsChainQueueSummary,
    outcomes: OpsChainOutcomeSummary
): SearchLearningOpsCompletionState {
    if (queue.executeNow > 0) {
        return 'action_required';
    }

    if (queue.needsReview > 0) {
        return 'review_required';
    }

    if (queue.sampleCollection > 0 || outcomes.awaitingSamples > 0) {
        return 'sampling';
    }

    if (queue.observe > 0) {
        return 'monitoring';
    }

    return 'stable';
}

function toCompletionItem(
    item: OpsChainQueueItem
): SearchLearningOpsCompletionItem {
    const state: SearchLearningOpsCompletionState =
        item.queueState === 'execute_now'
            ? 'action_required'
            : item.queueState === 'needs_review'
                ? 'review_required'
                : item.queueState === 'sample_collection'
                    ? 'sampling'
                    : 'monitoring';

    return {
        id: `completion:${item.id}`,
        recommendationId: item.recommendationId,
        title: item.title,
        description: item.description,
        reason: item.reason,
        state,
        priority: item.priority,
        actionLabel: item.actionLabel,
        queueState: item.queueState,
        entryIds: item.entryIds,
        queries: item.queries,
        createdAt: item.createdAt,
        outcomeStatus: item.outcomeStatus,
    };
}

export function buildSearchLearningOpsCompletionSummary(
    queue: OpsChainQueueSummary,
    outcomes: OpsChainOutcomeSummary,
    activity: OpsChainActivitySummary
): SearchLearningOpsCompletionSummary {
    return {
        state: resolveState(queue, outcomes),
        total: queue.total,
        executeNow: queue.executeNow,
        needsReview: queue.needsReview,
        sampleCollection: queue.sampleCollection,
        observe: queue.observe,
        validated: outcomes.validated,
        recentRuns: activity.totalRuns,
        stableSignals: outcomes.validated + queue.observe,
        immediateCount: queue.executeNow + queue.needsReview,
        topImmediate: [...queue.topExecuteNow, ...queue.topNeedsReview].slice(0, 6).map(toCompletionItem),
        topSampling: queue.topSampleCollection.map(toCompletionItem),
        topObserve: queue.topObserve.map(toCompletionItem),
    };
}
