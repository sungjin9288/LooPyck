import type { SearchAggregationDiagnostics } from '../api/realtimeAggregator.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';
import type {
    SearchLearningActivityType,
    SearchLearningApprovalBaseline,
    SearchLearningEntry,
    SearchLearningSuggestion,
} from '../search/queryLearningTypes.ts';

export function normalizeSearchLearningQuery(query: string): string {
    return normalizeTitle(query)
        .toLowerCase()
        .replace(/[()[\]{}|/\\,.;:_+*?!~`"'“”‘’<>-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

export function uniqueOrdered(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        if (!value || seen.has(value)) {
            return false;
        }
        seen.add(value);
        return true;
    });
}

export function buildSearchLearningDocId(query: string): string {
    return normalizeSearchLearningQuery(query).replace(/[^\w:-]/g, '_').slice(0, 180);
}

export function buildSearchLearningActivityId(type: SearchLearningActivityType, timestamp: string): string {
    return `${type}:${timestamp}:${Math.random().toString(36).slice(2, 8)}`;
}

function buildEntryFromSnapshot(snapshot: SearchAggregationDiagnostics): SearchLearningEntry {
    const normalizedQuery = normalizeSearchLearningQuery(snapshot.query);
    return {
        id: buildSearchLearningDocId(snapshot.query),
        query: snapshot.query,
        normalizedQuery,
        effectiveQuery: snapshot.effectiveQuery || normalizedQuery,
        queryIntent: snapshot.queryIntent || null,
        status: 'pending',
        occurrenceCount: 1,
        lowFitCount: snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed' ? 1 : 0,
        zeroResultCount: snapshot.totalProducts === 0 ? 1 : 0,
        lastResultQuality: snapshot.resultQuality || null,
        lastTotalProducts: snapshot.totalProducts,
        suggestedQueries: snapshot.suggestedQueries || [],
        approvedQueries: [],
        aiSuggestion: null,
        approvalBaseline: null,
        lastSeenAt: snapshot.generatedAt,
        reviewedAt: null,
        reviewedBy: null,
        createdAt: snapshot.generatedAt,
        updatedAt: snapshot.generatedAt,
    };
}

export function shouldRecordSnapshot(snapshot: SearchAggregationDiagnostics): boolean {
    return snapshot.totalProducts === 0 || snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed';
}

export function mergeEntry(
    existing: SearchLearningEntry | undefined,
    snapshot: SearchAggregationDiagnostics
): SearchLearningEntry {
    if (!existing) {
        return buildEntryFromSnapshot(snapshot);
    }

    return {
        ...existing,
        query: snapshot.query,
        effectiveQuery: snapshot.effectiveQuery || existing.effectiveQuery,
        queryIntent: snapshot.queryIntent || existing.queryIntent,
        occurrenceCount: existing.occurrenceCount + 1,
        lowFitCount: existing.lowFitCount + (snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed' ? 1 : 0),
        zeroResultCount: existing.zeroResultCount + (snapshot.totalProducts === 0 ? 1 : 0),
        lastResultQuality: snapshot.resultQuality || existing.lastResultQuality,
        lastTotalProducts: snapshot.totalProducts,
        suggestedQueries: uniqueOrdered([...(existing.suggestedQueries || []), ...(snapshot.suggestedQueries || [])]).slice(0, 8),
        lastSeenAt: snapshot.generatedAt,
        updatedAt: snapshot.generatedAt,
    };
}

export function buildApprovalBaseline(
    entry: Pick<SearchLearningEntry, 'occurrenceCount' | 'lowFitCount' | 'zeroResultCount'>,
    approvedAt: string
): SearchLearningApprovalBaseline {
    return {
        approvedAt,
        occurrenceCount: entry.occurrenceCount,
        lowFitCount: entry.lowFitCount,
        zeroResultCount: entry.zeroResultCount,
    };
}

export function parseApprovalBaseline(raw: Record<string, unknown> | null | undefined): SearchLearningApprovalBaseline | null {
    if (!raw) {
        return null;
    }

    return {
        approvedAt: typeof raw.approvedAt === 'string' ? raw.approvedAt : new Date(0).toISOString(),
        occurrenceCount: typeof raw.occurrenceCount === 'number' ? raw.occurrenceCount : 0,
        lowFitCount: typeof raw.lowFitCount === 'number' ? raw.lowFitCount : 0,
        zeroResultCount: typeof raw.zeroResultCount === 'number' ? raw.zeroResultCount : 0,
    };
}

export function serializeApprovalBaseline(baseline: SearchLearningApprovalBaseline | null): Record<string, unknown> | null {
    if (!baseline) {
        return null;
    }

    return {
        approvedAt: baseline.approvedAt,
        occurrenceCount: baseline.occurrenceCount,
        lowFitCount: baseline.lowFitCount,
        zeroResultCount: baseline.zeroResultCount,
    };
}

export function serializeSuggestion(suggestion: SearchLearningSuggestion | null): Record<string, unknown> | null {
    if (!suggestion) {
        return null;
    }

    return {
        ...suggestion,
        categoryHint: suggestion.categoryHint || null,
    };
}

export function parseSuggestion(raw: Record<string, unknown> | null | undefined): SearchLearningSuggestion | null {
    if (!raw) {
        return null;
    }

    return {
        normalizedQuery: typeof raw.normalizedQuery === 'string' ? raw.normalizedQuery : '',
        categoryHint: typeof raw.categoryHint === 'string' ? raw.categoryHint : null,
        suggestedQueries: Array.isArray(raw.suggestedQueries)
            ? raw.suggestedQueries.filter((entry): entry is string => typeof entry === 'string')
            : [],
        rationale: typeof raw.rationale === 'string' ? raw.rationale : '',
        model: raw.model === 'gemini' ? 'gemini' : 'heuristic',
        generatedAt: typeof raw.generatedAt === 'string' ? raw.generatedAt : new Date(0).toISOString(),
    };
}

export function parseEntry(id: string, raw: Record<string, unknown>): SearchLearningEntry {
    return {
        id,
        query: typeof raw.query === 'string' ? raw.query : '',
        normalizedQuery: typeof raw.normalizedQuery === 'string' ? raw.normalizedQuery : '',
        effectiveQuery: typeof raw.effectiveQuery === 'string' ? raw.effectiveQuery : '',
        queryIntent: typeof raw.queryIntent === 'string' ? raw.queryIntent as SearchLearningEntry['queryIntent'] : null,
        status: raw.status === 'approved' || raw.status === 'ignored' ? raw.status : 'pending',
        occurrenceCount: typeof raw.occurrenceCount === 'number' ? raw.occurrenceCount : 0,
        lowFitCount: typeof raw.lowFitCount === 'number' ? raw.lowFitCount : 0,
        zeroResultCount: typeof raw.zeroResultCount === 'number' ? raw.zeroResultCount : 0,
        lastResultQuality: typeof raw.lastResultQuality === 'string' ? raw.lastResultQuality as SearchLearningEntry['lastResultQuality'] : null,
        lastTotalProducts: typeof raw.lastTotalProducts === 'number' ? raw.lastTotalProducts : 0,
        suggestedQueries: Array.isArray(raw.suggestedQueries) ? raw.suggestedQueries.filter((entry): entry is string => typeof entry === 'string') : [],
        approvedQueries: Array.isArray(raw.approvedQueries) ? raw.approvedQueries.filter((entry): entry is string => typeof entry === 'string') : [],
        aiSuggestion: parseSuggestion(typeof raw.aiSuggestion === 'object' && raw.aiSuggestion ? raw.aiSuggestion as Record<string, unknown> : null),
        approvalBaseline: parseApprovalBaseline(typeof raw.approvalBaseline === 'object' && raw.approvalBaseline ? raw.approvalBaseline as Record<string, unknown> : null),
        lastSeenAt: typeof raw.lastSeenAt === 'string' ? raw.lastSeenAt : new Date(0).toISOString(),
        reviewedAt: typeof raw.reviewedAt === 'string' ? raw.reviewedAt : null,
        reviewedBy: typeof raw.reviewedBy === 'string' ? raw.reviewedBy : null,
        createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : null,
        updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : null,
    };
}

export function serializeEntry(entry: SearchLearningEntry): Record<string, unknown> {
    return {
        query: entry.query,
        normalizedQuery: entry.normalizedQuery,
        effectiveQuery: entry.effectiveQuery,
        queryIntent: entry.queryIntent || null,
        status: entry.status,
        occurrenceCount: entry.occurrenceCount,
        lowFitCount: entry.lowFitCount,
        zeroResultCount: entry.zeroResultCount,
        lastResultQuality: entry.lastResultQuality || null,
        lastTotalProducts: entry.lastTotalProducts,
        suggestedQueries: entry.suggestedQueries,
        approvedQueries: entry.approvedQueries,
        aiSuggestion: serializeSuggestion(entry.aiSuggestion),
        approvalBaseline: serializeApprovalBaseline(entry.approvalBaseline),
        lastSeenAt: entry.lastSeenAt,
        reviewedAt: entry.reviewedAt,
        reviewedBy: entry.reviewedBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
    };
}
