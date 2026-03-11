import type {
    SearchLearningRewriteSourceActionDraft,
    SearchLearningRewriteSourceActionType,
} from './searchLearningRewriteSourceActionDrafts.ts';
import type {
    SearchLearningRewriteSourceActionReviewItem,
    SearchLearningRewriteSourceActionReviewState,
} from './searchLearningRewriteSourceActionReview.ts';

export type SearchLearningRewriteSourceApprovalDecision =
    | 'promote_candidate'
    | 'rollback_candidate'
    | 'review_pending'
    | 'observe_pending';

export type SearchLearningRewriteSourceApprovalQueueItem = {
    id: string;
    source: string;
    action: SearchLearningRewriteSourceActionType;
    decision: SearchLearningRewriteSourceApprovalDecision;
    title: string;
    reason: string;
    entryIds: string[];
    primaryEntryIds: string[];
    reviewState: SearchLearningRewriteSourceActionReviewState;
    readyReviewCount: number;
    generationNeededCount: number;
    stableCount: number;
    topClusters: string[];
    topQueries: string[];
};

export type SearchLearningRewriteSourceApprovalQueueSummary = {
    total: number;
    promoteCandidates: number;
    rollbackCandidates: number;
    reviewPending: number;
    observePending: number;
    topPromoteCandidates: SearchLearningRewriteSourceApprovalQueueItem[];
    topRollbackCandidates: SearchLearningRewriteSourceApprovalQueueItem[];
    topReviewPending: SearchLearningRewriteSourceApprovalQueueItem[];
};

function priority(decision: SearchLearningRewriteSourceApprovalDecision): number {
    switch (decision) {
        case 'review_pending':
            return 4;
        case 'rollback_candidate':
            return 3;
        case 'promote_candidate':
            return 2;
        case 'observe_pending':
        default:
            return 1;
    }
}

function resolveDecision(
    draft: SearchLearningRewriteSourceActionDraft,
    review: SearchLearningRewriteSourceActionReviewItem | undefined
): {
    decision: SearchLearningRewriteSourceApprovalDecision;
    title: string;
    reason: string;
    primaryEntryIds: string[];
} {
    if (review?.reviewState === 'ready_review') {
        return {
            decision: 'review_pending',
            title: '리뷰 우선 처리',
            reason: '이미 생성된 AI rewrite 제안이 있어 운영자가 먼저 review/approve 해야 합니다.',
            primaryEntryIds: review.readyReviewEntryIds,
        };
    }

    if (draft.action === 'rollback_regenerate') {
        return {
            decision: 'rollback_candidate',
            title: 'Rollback 후보',
            reason: review?.generationNeededCount
                ? 'rollback 후보이며 새 AI 제안 생성부터 다시 돌리는 편이 안전합니다.'
                : 'rollback 후보이므로 관련 source rewrite를 재학습 우선순위로 올려야 합니다.',
            primaryEntryIds: review?.generationNeededEntryIds.length
                ? review.generationNeededEntryIds
                : draft.entryIds,
        };
    }

    if (draft.action === 'promote_confirm') {
        return {
            decision: 'promote_candidate',
            title: '승격 후보',
            reason: '지표가 안정적이므로 source rewrite를 유지/확대 후보로 볼 수 있습니다.',
            primaryEntryIds: draft.entryIds,
        };
    }

    return {
        decision: 'observe_pending',
        title: '관측 대기',
        reason: '즉시 승격/rollback보다 추가 표본 관측이 우선입니다.',
        primaryEntryIds: draft.entryIds,
    };
}

export function buildSearchLearningRewriteSourceApprovalQueue(
    drafts: SearchLearningRewriteSourceActionDraft[],
    reviewQueue: SearchLearningRewriteSourceActionReviewItem[]
): SearchLearningRewriteSourceApprovalQueueItem[] {
    const reviewMap = new Map(
        reviewQueue.map((entry) => [`${entry.source}:${entry.action}`, entry] as const)
    );

    return drafts
        .map((draft) => {
            const review = reviewMap.get(`${draft.source}:${draft.action}`);
            const resolved = resolveDecision(draft, review);
            return {
                id: `${draft.id}:approval`,
                source: draft.source,
                action: draft.action,
                decision: resolved.decision,
                title: resolved.title,
                reason: resolved.reason,
                entryIds: draft.entryIds,
                primaryEntryIds: resolved.primaryEntryIds,
                reviewState: review?.reviewState || 'stable_followup',
                readyReviewCount: review?.readyReviewCount || 0,
                generationNeededCount: review?.generationNeededCount || 0,
                stableCount: review?.stableCount || 0,
                topClusters: draft.topClusters,
                topQueries: draft.topQueries,
            } satisfies SearchLearningRewriteSourceApprovalQueueItem;
        })
        .sort((left, right) =>
            priority(right.decision) - priority(left.decision)
            || right.readyReviewCount - left.readyReviewCount
            || right.generationNeededCount - left.generationNeededCount
            || left.source.localeCompare(right.source)
        );
}

export function buildSearchLearningRewriteSourceApprovalQueueSummary(
    items: SearchLearningRewriteSourceApprovalQueueItem[]
): SearchLearningRewriteSourceApprovalQueueSummary {
    return {
        total: items.length,
        promoteCandidates: items.filter((entry) => entry.decision === 'promote_candidate').length,
        rollbackCandidates: items.filter((entry) => entry.decision === 'rollback_candidate').length,
        reviewPending: items.filter((entry) => entry.decision === 'review_pending').length,
        observePending: items.filter((entry) => entry.decision === 'observe_pending').length,
        topPromoteCandidates: items.filter((entry) => entry.decision === 'promote_candidate').slice(0, 4),
        topRollbackCandidates: items.filter((entry) => entry.decision === 'rollback_candidate').slice(0, 4),
        topReviewPending: items.filter((entry) => entry.decision === 'review_pending').slice(0, 4),
    };
}
