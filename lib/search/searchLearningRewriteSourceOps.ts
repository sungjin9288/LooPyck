import type { ProductSource } from '../api/types.ts';
import type {
    SearchLearningRewriteSourceDraft,
    SearchLearningRewriteSourceDraftAction,
} from './searchLearningRewriteSourceDrafts.ts';

export type SearchLearningRewriteSourceOpsItem = {
    id: string;
    source: ProductSource;
    action: SearchLearningRewriteSourceDraftAction;
    draftCount: number;
    clusterCount: number;
    entryIds: string[];
    queryCount: number;
    measured: number;
    improved: number;
    noImprovement: number;
    awaitingSamples: number;
    avgImprovedRate: number;
    topClusters: string[];
    topQueries: string[];
};

export type SearchLearningRewriteSourceOpsSummary = {
    trackedSources: number;
    promoteSources: number;
    holdSources: number;
    rollbackSources: number;
    awaitingSources: number;
    topPromote: SearchLearningRewriteSourceOpsItem[];
    topRollback: SearchLearningRewriteSourceOpsItem[];
    topAwaiting: SearchLearningRewriteSourceOpsItem[];
};

function actionPriority(action: SearchLearningRewriteSourceDraftAction): number {
    switch (action) {
        case 'rollback':
            return 4;
        case 'promote':
            return 3;
        case 'hold':
            return 2;
        case 'awaiting_samples':
        default:
            return 1;
    }
}

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

export function buildSearchLearningRewriteSourceOps(
    drafts: SearchLearningRewriteSourceDraft[]
): SearchLearningRewriteSourceOpsItem[] {
    const grouped = new Map<string, SearchLearningRewriteSourceOpsItem>();

    drafts.forEach((draft) => {
        const key = `${draft.source}:${draft.action}`;
        const current = grouped.get(key) || {
            id: key,
            source: draft.source,
            action: draft.action,
            draftCount: 0,
            clusterCount: 0,
            entryIds: [],
            queryCount: 0,
            measured: 0,
            improved: 0,
            noImprovement: 0,
            awaitingSamples: 0,
            avgImprovedRate: 0,
            topClusters: [],
            topQueries: [],
        };

        current.draftCount += 1;
        current.clusterCount = uniqueOrdered([...current.topClusters, draft.clusterLabel]).length;
        current.entryIds = uniqueOrdered([...current.entryIds, ...draft.entryIds]);
        current.queryCount += draft.queryCount;
        current.measured += draft.measured;
        current.improved += draft.improved;
        current.noImprovement += draft.noImprovement;
        current.awaitingSamples += draft.awaitingSamples;
        current.topClusters = uniqueOrdered([...current.topClusters, draft.clusterLabel]).slice(0, 5);
        current.topQueries = uniqueOrdered([...current.topQueries, ...draft.queries]).slice(0, 8);
        current.avgImprovedRate = current.measured > 0 ? current.improved / current.measured : 0;

        grouped.set(key, current);
    });

    return Array.from(grouped.values()).sort((left, right) =>
        actionPriority(right.action) - actionPriority(left.action)
        || right.noImprovement - left.noImprovement
        || right.improved - left.improved
        || right.queryCount - left.queryCount
        || left.source.localeCompare(right.source)
    );
}

export function buildSearchLearningRewriteSourceOpsSummary(
    items: SearchLearningRewriteSourceOpsItem[]
): SearchLearningRewriteSourceOpsSummary {
    return {
        trackedSources: items.length,
        promoteSources: items.filter((entry) => entry.action === 'promote').length,
        holdSources: items.filter((entry) => entry.action === 'hold').length,
        rollbackSources: items.filter((entry) => entry.action === 'rollback').length,
        awaitingSources: items.filter((entry) => entry.action === 'awaiting_samples').length,
        topPromote: items.filter((entry) => entry.action === 'promote').slice(0, 4),
        topRollback: items.filter((entry) => entry.action === 'rollback').slice(0, 4),
        topAwaiting: items.filter((entry) => entry.action === 'awaiting_samples').slice(0, 4),
    };
}
