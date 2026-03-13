import type {
    SearchLearningOpsCompletionItem,
    SearchLearningOpsCompletionSummary,
} from './searchLearningOpsCompletionSummary.ts';

export type SearchLearningOpsCompletionActionType =
    | 'execute_now'
    | 'review_now'
    | 'collect_samples'
    | 'observe_now';

export type SearchLearningOpsCompletionAction = {
    id: string;
    type: SearchLearningOpsCompletionActionType;
    title: string;
    description: string;
    reason: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    actionLabel: string;
    state: SearchLearningOpsCompletionItem['state'];
    entryIds: string[];
    queries: string[];
    recommendationIds: string[];
    queryCount: number;
};

export type SearchLearningOpsCompletionActionSummary = {
    total: number;
    executeNow: number;
    reviewNow: number;
    collectSamples: number;
    observeNow: number;
    critical: number;
    highPriority: number;
    topActions: SearchLearningOpsCompletionAction[];
    topExecuteNow: SearchLearningOpsCompletionAction[];
    topReviewNow: SearchLearningOpsCompletionAction[];
    topCollectSamples: SearchLearningOpsCompletionAction[];
    topObserveNow: SearchLearningOpsCompletionAction[];
};

function unique(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
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

function buildAction(
    id: string,
    type: SearchLearningOpsCompletionActionType,
    title: string,
    description: string,
    reason: string,
    priority: SearchLearningOpsCompletionAction['priority'],
    actionLabel: string,
    items: SearchLearningOpsCompletionItem[]
): SearchLearningOpsCompletionAction | null {
    if (items.length === 0) {
        return null;
    }

    const entryIds = unique(items.flatMap((item) => item.entryIds));
    const queries = unique(items.flatMap((item) => item.queries));
    const recommendationIds = unique(items.map((item) => item.recommendationId));

    return {
        id,
        type,
        title,
        description,
        reason,
        priority,
        actionLabel,
        state: items[0].state,
        entryIds,
        queries,
        recommendationIds,
        queryCount: queries.length,
    };
}

function sortActions(actions: SearchLearningOpsCompletionAction[]): SearchLearningOpsCompletionAction[] {
    return [...actions].sort((left, right) => {
        const priorityDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        return right.queryCount - left.queryCount;
    });
}

export function buildSearchLearningOpsCompletionActions(
    summary: SearchLearningOpsCompletionSummary
): SearchLearningOpsCompletionActionSummary {
    const actions = sortActions(
        [
            buildAction(
                'completion_execute_now',
                'execute_now',
                'Completion Execute Now',
                '즉시 실행 상태의 terminal item들을 한 번에 재학습 AI 제안으로 보냅니다.',
                `${summary.executeNow}개의 즉시 실행 항목이 남아 있습니다.`,
                summary.executeNow >= 2 ? 'critical' : 'high',
                '즉시 AI 제안',
                summary.topImmediate.filter((item) => item.state === 'action_required')
            ),
            buildAction(
                'completion_review_now',
                'review_now',
                'Completion Review Now',
                'review 대기 terminal item들을 한 번에 승인 루프로 넘깁니다.',
                `${summary.needsReview}개의 review 대기 항목이 남아 있습니다.`,
                summary.needsReview >= 2 ? 'critical' : 'high',
                '즉시 승인',
                summary.topImmediate.filter((item) => item.state === 'review_required')
            ),
            buildAction(
                'completion_collect_samples',
                'collect_samples',
                'Completion Sample Collection',
                '표본 수집이 필요한 terminal item을 queue로 모아 추가 검색 샘플을 수집합니다.',
                `${summary.sampleCollection}개의 표본 수집 항목이 남아 있습니다.`,
                'medium',
                '표본 수집 대상 선택',
                summary.topSampling
            ),
            buildAction(
                'completion_observe_now',
                'observe_now',
                'Completion Observe',
                '관찰 상태 또는 안정화 신호가 있는 terminal item을 queue로 모아 최종 확인합니다.',
                `${summary.observe}개의 관찰 항목과 ${summary.validated}개의 validated 신호가 있습니다.`,
                'low',
                '개선 query 선택',
                summary.topObserve
            ),
        ].filter((action): action is SearchLearningOpsCompletionAction => Boolean(action))
    );

    return {
        total: actions.length,
        executeNow: actions.filter((action) => action.type === 'execute_now').length,
        reviewNow: actions.filter((action) => action.type === 'review_now').length,
        collectSamples: actions.filter((action) => action.type === 'collect_samples').length,
        observeNow: actions.filter((action) => action.type === 'observe_now').length,
        critical: actions.filter((action) => action.priority === 'critical').length,
        highPriority: actions.filter((action) => action.priority === 'high').length,
        topActions: actions.slice(0, 4),
        topExecuteNow: actions.filter((action) => action.type === 'execute_now'),
        topReviewNow: actions.filter((action) => action.type === 'review_now'),
        topCollectSamples: actions.filter((action) => action.type === 'collect_samples'),
        topObserveNow: actions.filter((action) => action.type === 'observe_now'),
    };
}
