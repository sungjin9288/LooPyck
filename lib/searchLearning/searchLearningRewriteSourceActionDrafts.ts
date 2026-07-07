import type { SearchLearningRewriteSourceOpsItem } from './searchLearningRewriteSourceOps.ts';

export type SearchLearningRewriteSourceActionType =
    | 'promote_confirm'
    | 'rollback_regenerate'
    | 'awaiting_observe'
    | 'hold_review';

export type SearchLearningRewriteSourceActionDraft = {
    id: string;
    source: string;
    action: SearchLearningRewriteSourceActionType;
    title: string;
    reason: string;
    entryIds: string[];
    queryCount: number;
    measured: number;
    improved: number;
    noImprovement: number;
    awaitingSamples: number;
    topClusters: string[];
    topQueries: string[];
};

export type SearchLearningRewriteSourceActionDraftSummary = {
    total: number;
    promoteConfirm: number;
    rollbackRegenerate: number;
    awaitingObserve: number;
    holdReview: number;
    topPromoteConfirm: SearchLearningRewriteSourceActionDraft[];
    topRollbackRegenerate: SearchLearningRewriteSourceActionDraft[];
    topAwaitingObserve: SearchLearningRewriteSourceActionDraft[];
};

function resolveAction(item: SearchLearningRewriteSourceOpsItem): {
    action: SearchLearningRewriteSourceActionType;
    title: string;
    reason: string;
} {
    switch (item.action) {
        case 'promote':
            return {
                action: 'promote_confirm',
                title: '승격 유지 확인',
                reason: '개선률이 높아 현재 source rewrite를 유지하면서 추가 관측만 확인하면 됩니다.',
            };
        case 'rollback':
            return {
                action: 'rollback_regenerate',
                title: 'AI 재생성 필요',
                reason: 'rollback 후보이므로 관련 query를 다시 학습시켜 새 draft를 만드는 편이 안전합니다.',
            };
        case 'awaiting_samples':
            return {
                action: 'awaiting_observe',
                title: '샘플 관측 대기',
                reason: '새 검색 표본이 적어 우선 선택해 두고 실제 검색을 더 모아야 합니다.',
            };
        case 'hold':
        default:
            return {
                action: 'hold_review',
                title: '유지 후 검토',
                reason: '일부 개선은 있어 즉시 rollback보다 유지하면서 추가 검토가 필요합니다.',
            };
    }
}

function priority(action: SearchLearningRewriteSourceActionType): number {
    switch (action) {
        case 'rollback_regenerate':
            return 4;
        case 'promote_confirm':
            return 3;
        case 'hold_review':
            return 2;
        case 'awaiting_observe':
        default:
            return 1;
    }
}

export function buildSearchLearningRewriteSourceActionDrafts(
    items: SearchLearningRewriteSourceOpsItem[]
): SearchLearningRewriteSourceActionDraft[] {
    return items
        .map((item) => {
            const resolved = resolveAction(item);
            return {
                id: `${item.id}:${resolved.action}`,
                source: item.source,
                action: resolved.action,
                title: resolved.title,
                reason: resolved.reason,
                entryIds: item.entryIds,
                queryCount: item.queryCount,
                measured: item.measured,
                improved: item.improved,
                noImprovement: item.noImprovement,
                awaitingSamples: item.awaitingSamples,
                topClusters: item.topClusters,
                topQueries: item.topQueries,
            } satisfies SearchLearningRewriteSourceActionDraft;
        })
        .sort((left, right) =>
            priority(right.action) - priority(left.action)
            || right.noImprovement - left.noImprovement
            || right.improved - left.improved
            || right.queryCount - left.queryCount
            || left.source.localeCompare(right.source)
        );
}

export function buildSearchLearningRewriteSourceActionDraftSummary(
    drafts: SearchLearningRewriteSourceActionDraft[]
): SearchLearningRewriteSourceActionDraftSummary {
    return {
        total: drafts.length,
        promoteConfirm: drafts.filter((entry) => entry.action === 'promote_confirm').length,
        rollbackRegenerate: drafts.filter((entry) => entry.action === 'rollback_regenerate').length,
        awaitingObserve: drafts.filter((entry) => entry.action === 'awaiting_observe').length,
        holdReview: drafts.filter((entry) => entry.action === 'hold_review').length,
        topPromoteConfirm: drafts.filter((entry) => entry.action === 'promote_confirm').slice(0, 4),
        topRollbackRegenerate: drafts.filter((entry) => entry.action === 'rollback_regenerate').slice(0, 4),
        topAwaitingObserve: drafts.filter((entry) => entry.action === 'awaiting_observe').slice(0, 4),
    };
}
