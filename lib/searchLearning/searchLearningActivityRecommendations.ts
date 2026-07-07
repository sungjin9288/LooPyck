import type {
    SearchLearningActivityEvent,
    SearchLearningApprovalBaseline,
    SearchLearningStatus,
    SearchLearningSuggestion,
} from '../search/queryLearningTypes.ts';
import { buildSearchLearningImpact } from './searchLearningImpact.ts';

export type SearchLearningActivityRecommendationAction =
    | 'review_pending'
    | 'generate_needed'
    | 'awaiting_samples';

export type SearchLearningActivityRecommendation = {
    id: string;
    action: SearchLearningActivityRecommendationAction;
    title: string;
    description: string;
    context: string | null;
    count: number;
    entryIds: string[];
    queries: string[];
    lastSeenAt: string;
};

export type SearchLearningActivityRecommendationEntryLike = {
    id: string;
    query: string;
    status: SearchLearningStatus;
    aiSuggestion: SearchLearningSuggestion | null;
    approvalBaseline: SearchLearningApprovalBaseline | null;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
    [key: string]: unknown;
};

export type SearchLearningActivityRecommendationSummary = {
    reviewPending: number;
    generateNeeded: number;
    awaitingSamples: number;
    topReviewPending: SearchLearningActivityRecommendation[];
    topGenerateNeeded: SearchLearningActivityRecommendation[];
    topAwaitingSamples: SearchLearningActivityRecommendation[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function hasDraftSuggestion(suggestion: SearchLearningSuggestion | null | undefined): boolean {
    return Boolean(suggestion && suggestion.suggestedQueries.length > 0);
}

function entryNeedsSamples(entry: SearchLearningActivityRecommendationEntryLike): boolean {
    const impact = buildSearchLearningImpact(entry);
    return impact?.outcome === 'awaiting_samples';
}

function sortRecommendations(items: SearchLearningActivityRecommendation[]): SearchLearningActivityRecommendation[] {
    return [...items].sort((left, right) => {
        if (right.count !== left.count) {
            return right.count - left.count;
        }
        return right.lastSeenAt.localeCompare(left.lastSeenAt);
    });
}

export function buildSearchLearningActivityRecommendations(
    events: SearchLearningActivityEvent[],
    entries: SearchLearningActivityRecommendationEntryLike[]
): SearchLearningActivityRecommendationSummary {
    const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
    const reviewPendingMap = new Map<string, SearchLearningActivityRecommendation>();
    const generateNeededMap = new Map<string, SearchLearningActivityRecommendation>();
    const awaitingSamplesMap = new Map<string, SearchLearningActivityRecommendation>();

    for (const event of events) {
        const relatedEntries = event.entryIds
            .map((entryId) => entryMap.get(entryId))
            .filter((entry): entry is SearchLearningActivityRecommendationEntryLike => Boolean(entry));

        if (relatedEntries.length === 0) {
            continue;
        }

        if (event.type === 'generate_suggestions') {
            const pendingDrafts = relatedEntries.filter((entry) => entry.status === 'pending' && hasDraftSuggestion(entry.aiSuggestion));
            if (pendingDrafts.length > 0) {
                const key = `review:${event.context || event.id}`;
                reviewPendingMap.set(key, {
                    id: key,
                    action: 'review_pending',
                    title: event.context ? `${event.context} draft review` : 'Draft review pending',
                    description: 'AI 제안이 생성됐지만 아직 승인/보류되지 않은 query입니다.',
                    context: event.context,
                    count: pendingDrafts.length,
                    entryIds: uniqueOrdered(pendingDrafts.map((entry) => entry.id)).slice(0, 24),
                    queries: uniqueOrdered(pendingDrafts.map((entry) => entry.query)).slice(0, 12),
                    lastSeenAt: event.createdAt,
                });
            }
        }

        if (event.type === 'seed_queries') {
            const ungenerated = relatedEntries.filter((entry) => entry.status === 'pending' && !hasDraftSuggestion(entry.aiSuggestion));
            if (ungenerated.length > 0) {
                const key = `generate:${event.context || event.id}`;
                generateNeededMap.set(key, {
                    id: key,
                    action: 'generate_needed',
                    title: event.context ? `${event.context} AI generation needed` : 'AI generation needed',
                    description: '큐에 추가됐지만 아직 AI 제안이 생성되지 않은 query입니다.',
                    context: event.context,
                    count: ungenerated.length,
                    entryIds: uniqueOrdered(ungenerated.map((entry) => entry.id)).slice(0, 24),
                    queries: uniqueOrdered(ungenerated.map((entry) => entry.query)).slice(0, 12),
                    lastSeenAt: event.createdAt,
                });
            }
        }

        if (event.type === 'review_entries' && event.reviewedStatus === 'approved') {
            const awaiting = relatedEntries.filter((entry) => entry.status === 'approved' && entryNeedsSamples(entry));
            if (awaiting.length > 0) {
                const key = `awaiting:${event.context || event.id}`;
                awaitingSamplesMap.set(key, {
                    id: key,
                    action: 'awaiting_samples',
                    title: event.context ? `${event.context} sample follow-up` : 'Awaiting post-approval samples',
                    description: '승인 후 효과 측정을 위해 실제 검색 표본을 더 모아야 하는 query입니다.',
                    context: event.context,
                    count: awaiting.length,
                    entryIds: uniqueOrdered(awaiting.map((entry) => entry.id)).slice(0, 24),
                    queries: uniqueOrdered(awaiting.map((entry) => entry.query)).slice(0, 12),
                    lastSeenAt: event.createdAt,
                });
            }
        }
    }

    const reviewPending = sortRecommendations(Array.from(reviewPendingMap.values()));
    const generateNeeded = sortRecommendations(Array.from(generateNeededMap.values()));
    const awaitingSamples = sortRecommendations(Array.from(awaitingSamplesMap.values()));

    return {
        reviewPending: reviewPending.length,
        generateNeeded: generateNeeded.length,
        awaitingSamples: awaitingSamples.length,
        topReviewPending: reviewPending.slice(0, 4),
        topGenerateNeeded: generateNeeded.slice(0, 4),
        topAwaitingSamples: awaitingSamples.slice(0, 4),
    };
}
