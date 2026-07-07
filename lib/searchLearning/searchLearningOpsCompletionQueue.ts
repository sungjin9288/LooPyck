import type {
    SearchLearningOpsCompletionAction,
    SearchLearningOpsCompletionActionSummary,
    SearchLearningOpsCompletionActionType,
} from './searchLearningOpsCompletionActions.ts';

export type SearchLearningOpsCompletionQueueState =
    | 'execute_now'
    | 'needs_review'
    | 'sample_collection'
    | 'observe';

export type SearchLearningOpsCompletionQueueItem = {
    id: string;
    actionId: string;
    title: string;
    description: string;
    reason: string;
    queueState: SearchLearningOpsCompletionQueueState;
    actionType: SearchLearningOpsCompletionActionType;
    actionLabel: string;
    priority: SearchLearningOpsCompletionAction['priority'];
    entryIds: string[];
    queries: string[];
    recommendationIds: string[];
    queryCount: number;
};

export type SearchLearningOpsCompletionQueueSummary = {
    total: number;
    executeNow: number;
    needsReview: number;
    sampleCollection: number;
    observe: number;
    urgent: number;
    topItems: SearchLearningOpsCompletionQueueItem[];
    topExecuteNow: SearchLearningOpsCompletionQueueItem[];
    topNeedsReview: SearchLearningOpsCompletionQueueItem[];
    topSampleCollection: SearchLearningOpsCompletionQueueItem[];
    topObserve: SearchLearningOpsCompletionQueueItem[];
};

function resolveQueueState(
    actionType: SearchLearningOpsCompletionActionType
): SearchLearningOpsCompletionQueueState {
    switch (actionType) {
        case 'execute_now':
            return 'execute_now';
        case 'review_now':
            return 'needs_review';
        case 'collect_samples':
            return 'sample_collection';
        default:
            return 'observe';
    }
}

function stateWeight(state: SearchLearningOpsCompletionQueueState): number {
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

function priorityWeight(priority: SearchLearningOpsCompletionAction['priority']): number {
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
    action: SearchLearningOpsCompletionAction
): SearchLearningOpsCompletionQueueItem {
    return {
        id: `completion_queue:${action.id}`,
        actionId: action.id,
        title: action.title,
        description: action.description,
        reason: action.reason,
        queueState: resolveQueueState(action.type),
        actionType: action.type,
        actionLabel: action.actionLabel,
        priority: action.priority,
        entryIds: action.entryIds,
        queries: action.queries,
        recommendationIds: action.recommendationIds,
        queryCount: action.queryCount,
    };
}

function sortQueue(items: SearchLearningOpsCompletionQueueItem[]): SearchLearningOpsCompletionQueueItem[] {
    return [...items].sort((left, right) => {
        const stateDiff = stateWeight(right.queueState) - stateWeight(left.queueState);
        if (stateDiff !== 0) {
            return stateDiff;
        }

        const priorityDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        return right.queryCount - left.queryCount;
    });
}

export function buildSearchLearningOpsCompletionQueue(
    actions: SearchLearningOpsCompletionActionSummary
): SearchLearningOpsCompletionQueueSummary {
    const queue = sortQueue(actions.topActions.map(toQueueItem));

    return {
        total: queue.length,
        executeNow: queue.filter((item) => item.queueState === 'execute_now').length,
        needsReview: queue.filter((item) => item.queueState === 'needs_review').length,
        sampleCollection: queue.filter((item) => item.queueState === 'sample_collection').length,
        observe: queue.filter((item) => item.queueState === 'observe').length,
        urgent: queue.filter((item) => item.queueState === 'execute_now' || item.queueState === 'needs_review').length,
        topItems: queue.slice(0, 6),
        topExecuteNow: queue.filter((item) => item.queueState === 'execute_now').slice(0, 4),
        topNeedsReview: queue.filter((item) => item.queueState === 'needs_review').slice(0, 4),
        topSampleCollection: queue.filter((item) => item.queueState === 'sample_collection').slice(0, 4),
        topObserve: queue.filter((item) => item.queueState === 'observe').slice(0, 4),
    };
}
