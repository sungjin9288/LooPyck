import type {
    SearchLearningRewriteSourceActionDraft,
    SearchLearningRewriteSourceActionType,
} from './searchLearningRewriteSourceActionDrafts.ts';

type SearchLearningReviewEntryLike = {
    id: string;
    source?: string;
    action?: SearchLearningRewriteSourceActionType;
    title?: string;
    reviewState?: SearchLearningRewriteSourceActionReviewState;
    reason?: string;
    entryIds?: string[];
    readyReviewEntryIds?: string[];
    generationNeededEntryIds?: string[];
    readyReviewCount?: number;
    generationNeededCount?: number;
    stableCount?: number;
    topClusters?: string[];
    topQueries?: string[];
    query?: string;
    normalizedQuery?: string;
    effectiveQuery?: string;
    queryIntent?: 'pending' | 'unknown' | 'fashion' | 'mixed' | 'non_fashion' | string | null;
    status?: 'pending' | 'approved' | 'ignored';
    approvedQueries?: string[];
    aiSuggestion?: {
        normalizedQuery?: string;
        categoryHint?: string | null;
        suggestedQueries: string[];
        rationale?: string;
        model?: 'heuristic' | 'gemini';
        generatedAt?: string;
    } | null;
    occurrenceCount?: number;
    lowFitCount?: number;
    zeroResultCount?: number;
    lastResultQuality?: 'strong' | 'mixed' | 'weak' | null;
    lastTotalProducts?: number;
    suggestedQueries?: string[];
    approvalBaseline?: {
        approvedAt: string;
        occurrenceCount: number;
        lowFitCount: number;
        zeroResultCount: number;
    } | null;
    lastSeenAt?: string;
    reviewedAt?: string | null;
    reviewedBy?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
};

export type SearchLearningRewriteSourceActionReviewState =
    | 'ready_review'
    | 'generation_needed'
    | 'stable_followup';

export type SearchLearningRewriteSourceActionReviewItem = {
    id: string;
    source: string;
    action: SearchLearningRewriteSourceActionType;
    title: string;
    reviewState: SearchLearningRewriteSourceActionReviewState;
    reason: string;
    entryIds: string[];
    readyReviewEntryIds: string[];
    generationNeededEntryIds: string[];
    readyReviewCount: number;
    generationNeededCount: number;
    stableCount: number;
    topClusters: string[];
    topQueries: string[];
};

export type SearchLearningRewriteSourceActionReviewSummary = {
    total: number;
    readyReview: number;
    generationNeeded: number;
    stableFollowup: number;
    topReadyReview: SearchLearningRewriteSourceActionReviewItem[];
    topGenerationNeeded: SearchLearningRewriteSourceActionReviewItem[];
    topStableFollowup: SearchLearningRewriteSourceActionReviewItem[];
};

function uniqueOrdered(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        if (!value || seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

function reviewPriority(state: SearchLearningRewriteSourceActionReviewState): number {
    switch (state) {
        case 'ready_review':
            return 3;
        case 'generation_needed':
            return 2;
        case 'stable_followup':
        default:
            return 1;
    }
}

function actionNeedsGeneration(action: SearchLearningRewriteSourceActionType): boolean {
    return action === 'rollback_regenerate';
}

function entryNeedsReview(entry: SearchLearningReviewEntryLike): boolean {
    const suggestionQueries = uniqueOrdered(entry.aiSuggestion?.suggestedQueries || []);
    if (suggestionQueries.length === 0) {
        return false;
    }

    if (entry.status === 'pending') {
        return true;
    }

    if (entry.status !== 'approved') {
        return false;
    }

    const approvedQueries = new Set(entry.approvedQueries || []);
    return suggestionQueries.some((query) => !approvedQueries.has(query));
}

function buildReason(
    draft: SearchLearningRewriteSourceActionDraft,
    state: SearchLearningRewriteSourceActionReviewState
): string {
    switch (state) {
        case 'ready_review':
            return 'AI가 새 rewrite 제안을 만들었으므로 바로 검토/승인할 수 있습니다.';
        case 'generation_needed':
            return actionNeedsGeneration(draft.action)
                ? 'rollback 후보이지만 아직 review할 제안이 없어 AI 재생성을 먼저 돌려야 합니다.'
                : '추가 검토 전 실제 운영 데이터를 더 모으거나 수동 제안을 생성해야 합니다.';
        case 'stable_followup':
        default:
            return '현재는 새 제안이 없고 기존 approved rewrite를 유지하면서 follow-up 관측만 보면 됩니다.';
    }
}

export function buildSearchLearningRewriteSourceActionReviewQueue(
    drafts: SearchLearningRewriteSourceActionDraft[],
    entries: SearchLearningReviewEntryLike[]
): SearchLearningRewriteSourceActionReviewItem[] {
    const entryMap = new Map(entries.map((entry) => [entry.id, entry] satisfies [string, SearchLearningReviewEntryLike]));

    return drafts
        .map((draft) => {
            const relatedEntries = draft.entryIds
                .map((entryId) => entryMap.get(entryId))
                .filter((entry): entry is SearchLearningReviewEntryLike => Boolean(entry));

            const readyReviewEntries = relatedEntries.filter(entryNeedsReview);
            const generationNeededEntries = actionNeedsGeneration(draft.action)
                ? relatedEntries.filter((entry) => !entryNeedsReview(entry))
                : [];
            const stableEntries = relatedEntries.filter((entry) =>
                !readyReviewEntries.some((candidate) => candidate.id === entry.id)
                && !generationNeededEntries.some((candidate) => candidate.id === entry.id)
            );

            const reviewState: SearchLearningRewriteSourceActionReviewState = readyReviewEntries.length > 0
                ? 'ready_review'
                : generationNeededEntries.length > 0
                    ? 'generation_needed'
                    : 'stable_followup';

            return {
                id: `${draft.id}:review`,
                source: draft.source,
                action: draft.action,
                title: draft.title,
                reviewState,
                reason: buildReason(draft, reviewState),
                entryIds: draft.entryIds,
                readyReviewEntryIds: readyReviewEntries.map((entry) => entry.id),
                generationNeededEntryIds: generationNeededEntries.map((entry) => entry.id),
                readyReviewCount: readyReviewEntries.length,
                generationNeededCount: generationNeededEntries.length,
                stableCount: stableEntries.length,
                topClusters: draft.topClusters,
                topQueries: draft.topQueries,
            } satisfies SearchLearningRewriteSourceActionReviewItem;
        })
        .sort((left, right) =>
            reviewPriority(right.reviewState) - reviewPriority(left.reviewState)
            || right.readyReviewCount - left.readyReviewCount
            || right.generationNeededCount - left.generationNeededCount
            || left.source.localeCompare(right.source)
        );
}

export function buildSearchLearningRewriteSourceActionReviewSummary(
    items: SearchLearningRewriteSourceActionReviewItem[]
): SearchLearningRewriteSourceActionReviewSummary {
    return {
        total: items.length,
        readyReview: items.filter((entry) => entry.reviewState === 'ready_review').length,
        generationNeeded: items.filter((entry) => entry.reviewState === 'generation_needed').length,
        stableFollowup: items.filter((entry) => entry.reviewState === 'stable_followup').length,
        topReadyReview: items.filter((entry) => entry.reviewState === 'ready_review').slice(0, 4),
        topGenerationNeeded: items.filter((entry) => entry.reviewState === 'generation_needed').slice(0, 4),
        topStableFollowup: items.filter((entry) => entry.reviewState === 'stable_followup').slice(0, 4),
    };
}
