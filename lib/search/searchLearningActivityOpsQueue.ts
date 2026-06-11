import type {
    SearchLearningActivityEvent,
    SearchLearningApprovalBaseline,
    SearchLearningStatus,
    SearchLearningSuggestion,
} from './queryLearningTypes.ts';
import {
    buildSearchLearningActivityRecommendations,
    type SearchLearningActivityRecommendationAction,
} from './searchLearningActivityRecommendations.ts';

export type SearchLearningActivityOpsQueueEntryLike = {
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

export type SearchLearningActivityOpsQueuePriority =
    | 'critical'
    | 'high'
    | 'medium'
    | 'low';

export type SearchLearningActivityOpsQueueItem = {
    id: string;
    action: SearchLearningActivityRecommendationAction;
    title: string;
    description: string;
    context: string | null;
    count: number;
    entryIds: string[];
    queries: string[];
    lastSeenAt: string;
    urgencyScore: number;
    priority: SearchLearningActivityOpsQueuePriority;
    actionLabel: string;
    repeatedQueryCount: number;
    zeroResultCount: number;
    lowFitCount: number;
};

export type SearchLearningActivityOpsQueueSummary = {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    topItems: SearchLearningActivityOpsQueueItem[];
    topCritical: SearchLearningActivityOpsQueueItem[];
    topHigh: SearchLearningActivityOpsQueueItem[];
};

function countQueries(events: SearchLearningActivityEvent[]): Map<string, number> {
    const counts = new Map<string, number>();

    for (const event of events) {
        for (const query of event.queries) {
            counts.set(query, (counts.get(query) || 0) + 1);
        }
    }

    return counts;
}

function resolveActionBaseScore(action: SearchLearningActivityRecommendationAction): number {
    switch (action) {
        case 'review_pending':
            return 320;
        case 'generate_needed':
            return 220;
        case 'awaiting_samples':
            return 120;
        default:
            return 0;
    }
}

function resolvePriority(score: number): SearchLearningActivityOpsQueuePriority {
    if (score >= 340) {
        return 'critical';
    }

    if (score >= 250) {
        return 'high';
    }

    if (score >= 150) {
        return 'medium';
    }

    return 'low';
}

function resolveActionLabel(action: SearchLearningActivityRecommendationAction): string {
    switch (action) {
        case 'review_pending':
            return '즉시 승인';
        case 'generate_needed':
            return '즉시 AI 제안';
        case 'awaiting_samples':
            return '표본 수집 대상 선택';
        default:
            return 'query 선택';
    }
}

function uniqueEntryIds(entryIds: string[]): string[] {
    return Array.from(new Set(entryIds.filter(Boolean)));
}

function sortQueue(items: SearchLearningActivityOpsQueueItem[]): SearchLearningActivityOpsQueueItem[] {
    return [...items].sort((left, right) => {
        if (right.urgencyScore !== left.urgencyScore) {
            return right.urgencyScore - left.urgencyScore;
        }

        if (right.count !== left.count) {
            return right.count - left.count;
        }

        return right.lastSeenAt.localeCompare(left.lastSeenAt);
    });
}

export function buildSearchLearningActivityOpsQueue(
    events: SearchLearningActivityEvent[],
    entries: SearchLearningActivityOpsQueueEntryLike[]
): SearchLearningActivityOpsQueueSummary {
    const recommendations = buildSearchLearningActivityRecommendations(events, entries);
    const queryCounts = countQueries(events);
    const entryMap = new Map(entries.map((entry) => [entry.id, entry]));

    const queue = [
        ...recommendations.topReviewPending,
        ...recommendations.topGenerateNeeded,
        ...recommendations.topAwaitingSamples,
    ].map((item) => {
        const relatedEntries = uniqueEntryIds(item.entryIds)
            .map((entryId) => entryMap.get(entryId))
            .filter((entry): entry is SearchLearningActivityOpsQueueEntryLike => Boolean(entry));

        const repeatedQueryCount = item.queries.reduce((total, query) => {
            const count = queryCounts.get(query) || 0;
            return total + Math.max(count - 1, 0);
        }, 0);
        const zeroResultCount = relatedEntries.reduce((total, entry) => total + entry.zeroResultCount, 0);
        const lowFitCount = relatedEntries.reduce((total, entry) => total + entry.lowFitCount, 0);
        const urgencyScore =
            resolveActionBaseScore(item.action) +
            item.count * 12 +
            repeatedQueryCount * 8 +
            zeroResultCount * 4 +
            lowFitCount * 2;

        return {
            ...item,
            repeatedQueryCount,
            zeroResultCount,
            lowFitCount,
            urgencyScore,
            priority: resolvePriority(urgencyScore),
            actionLabel: resolveActionLabel(item.action),
        };
    });

    const sorted = sortQueue(queue);
    const critical = sorted.filter((item) => item.priority === 'critical');
    const high = sorted.filter((item) => item.priority === 'high');
    const medium = sorted.filter((item) => item.priority === 'medium');
    const low = sorted.filter((item) => item.priority === 'low');

    return {
        total: sorted.length,
        critical: critical.length,
        high: high.length,
        medium: medium.length,
        low: low.length,
        topItems: sorted.slice(0, 6),
        topCritical: critical.slice(0, 3),
        topHigh: high.slice(0, 3),
    };
}
