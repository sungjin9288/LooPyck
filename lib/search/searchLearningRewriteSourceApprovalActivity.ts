import type {
    SearchLearningRewriteSourceApprovalDecision,
    SearchLearningRewriteSourceApprovalQueueItem,
} from './searchLearningRewriteSourceApprovalQueue.ts';

export type SearchLearningRewriteSourceApprovalActivityKind =
    | 'review_approve'
    | 'rollback_generate'
    | 'promote_watch'
    | 'observe_more';

export type SearchLearningRewriteSourceApprovalActivityPriority =
    | 'urgent'
    | 'high'
    | 'medium'
    | 'low';

export type SearchLearningRewriteSourceApprovalActivityItem = {
    id: string;
    source: string;
    kind: SearchLearningRewriteSourceApprovalActivityKind;
    priority: SearchLearningRewriteSourceApprovalActivityPriority;
    title: string;
    description: string;
    entryIds: string[];
    primaryEntryIds: string[];
    topClusters: string[];
    topQueries: string[];
    decision: SearchLearningRewriteSourceApprovalDecision;
    readyReviewCount: number;
    generationNeededCount: number;
    stableCount: number;
};

export type SearchLearningRewriteSourceApprovalActivitySummary = {
    total: number;
    urgent: number;
    high: number;
    medium: number;
    low: number;
    reviewApprove: number;
    rollbackGenerate: number;
    promoteWatch: number;
    observeMore: number;
    topReviewApprove: SearchLearningRewriteSourceApprovalActivityItem[];
    topRollbackGenerate: SearchLearningRewriteSourceApprovalActivityItem[];
    topPromoteWatch: SearchLearningRewriteSourceApprovalActivityItem[];
    topObserveMore: SearchLearningRewriteSourceApprovalActivityItem[];
};

function resolveActivity(queueItem: SearchLearningRewriteSourceApprovalQueueItem): {
    kind: SearchLearningRewriteSourceApprovalActivityKind;
    priority: SearchLearningRewriteSourceApprovalActivityPriority;
    title: string;
    description: string;
} {
    switch (queueItem.decision) {
        case 'review_pending':
            return {
                kind: 'review_approve',
                priority: 'urgent',
                title: '즉시 승인 대기',
                description: '이미 생성된 AI rewrite draft가 있으므로 승인만 하면 source action을 바로 진전시킬 수 있습니다.',
            };
        case 'rollback_candidate':
            return {
                kind: 'rollback_generate',
                priority: queueItem.generationNeededCount > 0 ? 'urgent' : 'high',
                title: 'Rollback 재생성',
                description: queueItem.generationNeededCount > 0
                    ? 'rollback 후보이며 아직 review할 draft가 없어 AI 제안을 다시 생성해야 합니다.'
                    : 'rollback 후보이므로 관련 rewrite를 재검토하거나 새 draft로 교체해야 합니다.',
            };
        case 'promote_candidate':
            return {
                kind: 'promote_watch',
                priority: 'medium',
                title: '승격 관찰',
                description: '지표가 안정적이므로 유지/확대 후보로 두고 추가 표본만 관찰하면 됩니다.',
            };
        case 'observe_pending':
        default:
            return {
                kind: 'observe_more',
                priority: 'low',
                title: '표본 추가 수집',
                description: '즉시 승격/rollback보다 실제 검색 표본을 더 쌓아 판단하는 편이 안전합니다.',
            };
    }
}

function priorityRank(priority: SearchLearningRewriteSourceApprovalActivityPriority): number {
    switch (priority) {
        case 'urgent':
            return 4;
        case 'high':
            return 3;
        case 'medium':
            return 2;
        case 'low':
        default:
            return 1;
    }
}

export function buildSearchLearningRewriteSourceApprovalActivity(
    queue: SearchLearningRewriteSourceApprovalQueueItem[]
): SearchLearningRewriteSourceApprovalActivityItem[] {
    return queue
        .map((queueItem) => {
            const resolved = resolveActivity(queueItem);
            return {
                id: `${queueItem.id}:activity`,
                source: queueItem.source,
                kind: resolved.kind,
                priority: resolved.priority,
                title: resolved.title,
                description: resolved.description,
                entryIds: queueItem.entryIds,
                primaryEntryIds: queueItem.primaryEntryIds,
                topClusters: queueItem.topClusters,
                topQueries: queueItem.topQueries,
                decision: queueItem.decision,
                readyReviewCount: queueItem.readyReviewCount,
                generationNeededCount: queueItem.generationNeededCount,
                stableCount: queueItem.stableCount,
            } satisfies SearchLearningRewriteSourceApprovalActivityItem;
        })
        .sort((left, right) =>
            priorityRank(right.priority) - priorityRank(left.priority)
            || right.readyReviewCount - left.readyReviewCount
            || right.generationNeededCount - left.generationNeededCount
            || left.source.localeCompare(right.source)
        );
}

export function buildSearchLearningRewriteSourceApprovalActivitySummary(
    items: SearchLearningRewriteSourceApprovalActivityItem[]
): SearchLearningRewriteSourceApprovalActivitySummary {
    return {
        total: items.length,
        urgent: items.filter((item) => item.priority === 'urgent').length,
        high: items.filter((item) => item.priority === 'high').length,
        medium: items.filter((item) => item.priority === 'medium').length,
        low: items.filter((item) => item.priority === 'low').length,
        reviewApprove: items.filter((item) => item.kind === 'review_approve').length,
        rollbackGenerate: items.filter((item) => item.kind === 'rollback_generate').length,
        promoteWatch: items.filter((item) => item.kind === 'promote_watch').length,
        observeMore: items.filter((item) => item.kind === 'observe_more').length,
        topReviewApprove: items.filter((item) => item.kind === 'review_approve').slice(0, 4),
        topRollbackGenerate: items.filter((item) => item.kind === 'rollback_generate').slice(0, 4),
        topPromoteWatch: items.filter((item) => item.kind === 'promote_watch').slice(0, 4),
        topObserveMore: items.filter((item) => item.kind === 'observe_more').slice(0, 4),
    };
}
