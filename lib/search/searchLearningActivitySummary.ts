import type { SearchLearningActivityEvent, SearchLearningActivityType } from './queryLearning.ts';

export type SearchLearningActivityEntryLike = SearchLearningActivityEvent;

export type SearchLearningActivityContextSummary = {
    context: string;
    count: number;
    lastSeenAt: string;
    types: SearchLearningActivityType[];
    entryIds: string[];
    queries: string[];
};

export type SearchLearningActivityQuerySummary = {
    query: string;
    count: number;
    lastSeenAt: string;
    entryIds: string[];
    types: SearchLearningActivityType[];
};

export type SearchLearningActivitySummary = {
    total: number;
    seeded: number;
    generated: number;
    reviewed: number;
    approvedReviews: number;
    ignoredReviews: number;
    uniqueActors: number;
    topContexts: SearchLearningActivityContextSummary[];
    topGeneratedContexts: SearchLearningActivityContextSummary[];
    topReviewContexts: SearchLearningActivityContextSummary[];
    topQueries: SearchLearningActivityQuerySummary[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function sortByCountThenRecent<T extends { count: number; lastSeenAt: string }>(items: T[]): T[] {
    return [...items].sort((left, right) => {
        if (right.count !== left.count) {
            return right.count - left.count;
        }
        return right.lastSeenAt.localeCompare(left.lastSeenAt);
    });
}

export function buildSearchLearningActivitySummary(
    events: SearchLearningActivityEntryLike[]
): SearchLearningActivitySummary {
    const contextMap = new Map<string, SearchLearningActivityContextSummary>();
    const queryMap = new Map<string, SearchLearningActivityQuerySummary>();
    const actorUids = new Set<string>();

    let seeded = 0;
    let generated = 0;
    let reviewed = 0;
    let approvedReviews = 0;
    let ignoredReviews = 0;

    for (const event of events) {
        if (event.actorUid) {
            actorUids.add(event.actorUid);
        }

        if (event.type === 'seed_queries') {
            seeded += event.count;
        } else if (event.type === 'generate_suggestions') {
            generated += event.count;
        } else if (event.type === 'review_entries') {
            reviewed += event.count;
            if (event.reviewedStatus === 'approved') {
                approvedReviews += event.count;
            } else if (event.reviewedStatus === 'ignored') {
                ignoredReviews += event.count;
            }
        }

        if (event.context) {
            const existingContext = contextMap.get(event.context);
            const nextContext: SearchLearningActivityContextSummary = existingContext
                ? {
                    ...existingContext,
                    count: existingContext.count + event.count,
                    lastSeenAt: existingContext.lastSeenAt > event.createdAt ? existingContext.lastSeenAt : event.createdAt,
                    types: uniqueOrdered([...existingContext.types, event.type]) as SearchLearningActivityType[],
                    entryIds: uniqueOrdered([...existingContext.entryIds, ...event.entryIds]).slice(0, 24),
                    queries: uniqueOrdered([...existingContext.queries, ...event.queries]).slice(0, 12),
                }
                : {
                    context: event.context,
                    count: event.count,
                    lastSeenAt: event.createdAt,
                    types: [event.type],
                    entryIds: uniqueOrdered(event.entryIds).slice(0, 24),
                    queries: uniqueOrdered(event.queries).slice(0, 12),
                };
            contextMap.set(event.context, nextContext);
        }

        for (const query of event.queries) {
            const existingQuery = queryMap.get(query);
            const nextQuery: SearchLearningActivityQuerySummary = existingQuery
                ? {
                    ...existingQuery,
                    count: existingQuery.count + 1,
                    lastSeenAt: existingQuery.lastSeenAt > event.createdAt ? existingQuery.lastSeenAt : event.createdAt,
                    entryIds: uniqueOrdered([...existingQuery.entryIds, ...event.entryIds]).slice(0, 24),
                    types: uniqueOrdered([...existingQuery.types, event.type]) as SearchLearningActivityType[],
                }
                : {
                    query,
                    count: 1,
                    lastSeenAt: event.createdAt,
                    entryIds: uniqueOrdered(event.entryIds).slice(0, 24),
                    types: [event.type],
                };
            queryMap.set(query, nextQuery);
        }
    }

    const topContexts = sortByCountThenRecent(Array.from(contextMap.values())).slice(0, 6);

    return {
        total: events.length,
        seeded,
        generated,
        reviewed,
        approvedReviews,
        ignoredReviews,
        uniqueActors: actorUids.size,
        topContexts,
        topGeneratedContexts: topContexts.filter((entry) => entry.types.includes('generate_suggestions')).slice(0, 3),
        topReviewContexts: topContexts.filter((entry) => entry.types.includes('review_entries')).slice(0, 3),
        topQueries: sortByCountThenRecent(Array.from(queryMap.values())).slice(0, 6),
    };
}
