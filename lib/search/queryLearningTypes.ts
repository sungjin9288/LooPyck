import type { SearchAggregationDiagnostics } from '../api/realtimeAggregator.ts';

export type SearchLearningStatus = 'pending' | 'approved' | 'ignored';

export type SearchLearningSuggestion = {
    normalizedQuery: string;
    categoryHint: string | null;
    suggestedQueries: string[];
    rationale: string;
    model: 'heuristic' | 'gemini';
    generatedAt: string;
};

export type SearchLearningApprovalBaseline = {
    approvedAt: string;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
};

export type SearchLearningEntry = {
    id: string;
    query: string;
    normalizedQuery: string;
    effectiveQuery: string;
    queryIntent: SearchAggregationDiagnostics['queryIntent'] | null;
    status: SearchLearningStatus;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
    lastResultQuality: SearchAggregationDiagnostics['resultQuality'] | null;
    lastTotalProducts: number;
    suggestedQueries: string[];
    approvedQueries: string[];
    aiSuggestion: SearchLearningSuggestion | null;
    approvalBaseline: SearchLearningApprovalBaseline | null;
    lastSeenAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

export type SearchLearningActivityType =
    | 'seed_queries'
    | 'generate_suggestions'
    | 'review_entries';

export type SearchLearningActivityEvent = {
    id: string;
    type: SearchLearningActivityType;
    context: string | null;
    reviewedStatus: SearchLearningStatus | null;
    actorUid: string | null;
    count: number;
    entryIds: string[];
    queries: string[];
    createdAt: string;
};

export type SearchLearningActivityFeed = {
    events: SearchLearningActivityEvent[];
    storage: 'memory' | 'firestore';
};

export type SearchLearningQueue = {
    entries: SearchLearningEntry[];
    summary: {
        total: number;
        pending: number;
        approved: number;
        ignored: number;
        zeroResult: number;
    };
    storage: 'memory' | 'firestore';
};
