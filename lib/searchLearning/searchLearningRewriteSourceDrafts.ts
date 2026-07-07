import type { ProductSource } from '../api/types.ts';
import type {
    SearchLearningRewriteRecommendation,
    SearchLearningRewriteRecommendationType,
} from './searchLearningRewriteRecommendations.ts';
import type { SearchLearningRewritePack } from './searchLearningRewritePacks.ts';

export type SearchLearningRewriteSourceDraftAction = SearchLearningRewriteRecommendationType;

export type SearchLearningRewriteSourceDraft = {
    id: string;
    clusterId: string;
    clusterLabel: string;
    source: ProductSource;
    action: SearchLearningRewriteSourceDraftAction;
    reason: string;
    entryIds: string[];
    queries: string[];
    queryCount: number;
    measured: number;
    improved: number;
    noImprovement: number;
    awaitingSamples: number;
    improvedRate: number;
    beforeLowFitRate: number | null;
    afterLowFitRate: number | null;
    beforeZeroRate: number | null;
    afterZeroRate: number | null;
    topQuery: string | null;
};

export type SearchLearningRewriteSourceDraftSummary = {
    tracked: number;
    promote: number;
    hold: number;
    rollback: number;
    awaitingSamples: number;
    topPromote: SearchLearningRewriteSourceDraft[];
    topRollback: SearchLearningRewriteSourceDraft[];
    topAwaiting: SearchLearningRewriteSourceDraft[];
};

function priority(action: SearchLearningRewriteSourceDraftAction): number {
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

export function buildSearchLearningRewriteSourceDrafts(
    recommendations: SearchLearningRewriteRecommendation[],
    packs: SearchLearningRewritePack[]
): SearchLearningRewriteSourceDraft[] {
    return recommendations
        .flatMap((recommendation) => {
            const pack = packs.find((entry) => entry.clusterId === recommendation.clusterId);
            if (!pack) {
                return [];
            }

            return Object.entries(pack.sourceQueries)
                .map(([source, queries]) => {
                    const normalizedQueries = (queries || []).slice(0, 6);
                    if (normalizedQueries.length === 0) {
                        return null;
                    }

                    return {
                        id: `${recommendation.clusterId}:${source}`,
                        clusterId: recommendation.clusterId,
                        clusterLabel: recommendation.clusterLabel,
                        source: source as ProductSource,
                        action: recommendation.recommendation,
                        reason: recommendation.reason,
                        entryIds: recommendation.entryIds,
                        queries: normalizedQueries,
                        queryCount: normalizedQueries.length,
                        measured: recommendation.measured,
                        improved: recommendation.improved,
                        noImprovement: recommendation.noImprovement,
                        awaitingSamples: recommendation.awaitingSamples,
                        improvedRate: recommendation.improvedRate,
                        beforeLowFitRate: recommendation.beforeLowFitRate,
                        afterLowFitRate: recommendation.afterLowFitRate,
                        beforeZeroRate: recommendation.beforeZeroRate,
                        afterZeroRate: recommendation.afterZeroRate,
                        topQuery: recommendation.topQuery,
                    } satisfies SearchLearningRewriteSourceDraft;
                })
                .filter((entry): entry is SearchLearningRewriteSourceDraft => Boolean(entry));
        })
        .sort((left, right) =>
            priority(right.action) - priority(left.action)
            || right.noImprovement - left.noImprovement
            || right.improved - left.improved
            || right.queryCount - left.queryCount
            || left.source.localeCompare(right.source)
        );
}

export function buildSearchLearningRewriteSourceDraftSummary(
    drafts: SearchLearningRewriteSourceDraft[]
): SearchLearningRewriteSourceDraftSummary {
    return {
        tracked: drafts.length,
        promote: drafts.filter((entry) => entry.action === 'promote').length,
        hold: drafts.filter((entry) => entry.action === 'hold').length,
        rollback: drafts.filter((entry) => entry.action === 'rollback').length,
        awaitingSamples: drafts.filter((entry) => entry.action === 'awaiting_samples').length,
        topPromote: drafts.filter((entry) => entry.action === 'promote').slice(0, 6),
        topRollback: drafts.filter((entry) => entry.action === 'rollback').slice(0, 6),
        topAwaiting: drafts.filter((entry) => entry.action === 'awaiting_samples').slice(0, 6),
    };
}
