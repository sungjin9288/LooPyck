import type { SearchLearningImpactClusterSummary } from './searchLearningImpact.ts';
import type { SearchLearningRewritePack } from './searchLearningRewritePacks.ts';

export type SearchLearningRewriteRecommendationType =
    | 'promote'
    | 'hold'
    | 'rollback'
    | 'awaiting_samples';

export type SearchLearningRewriteRecommendation = {
    clusterId: string;
    clusterLabel: string;
    recommendation: SearchLearningRewriteRecommendationType;
    reason: string;
    entryIds: string[];
    sourceCount: number;
    commonQueries: string[];
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

export type SearchLearningRewriteRecommendationSummary = {
    tracked: number;
    promote: number;
    hold: number;
    rollback: number;
    awaitingSamples: number;
    topPromote: SearchLearningRewriteRecommendation[];
    topRollback: SearchLearningRewriteRecommendation[];
    topAwaiting: SearchLearningRewriteRecommendation[];
};

function resolveRecommendation(
    pack: SearchLearningRewritePack,
    impact: SearchLearningImpactClusterSummary | undefined
): SearchLearningRewriteRecommendation {
    if (!impact || impact.measured === 0) {
        return {
            clusterId: pack.clusterId,
            clusterLabel: pack.clusterLabel,
            recommendation: 'awaiting_samples',
            reason: '승인된 rewrite pack은 있지만 승인 이후 새 검색 표본이 아직 부족합니다.',
            entryIds: pack.entryIds,
            sourceCount: pack.sourceCount,
            commonQueries: pack.commonQueries,
            measured: impact?.measured || 0,
            improved: impact?.improved || 0,
            noImprovement: impact?.noImprovement || 0,
            awaitingSamples: impact?.awaitingSamples || pack.entryCount,
            improvedRate: impact?.improvedRate || 0,
            beforeLowFitRate: impact?.beforeLowFitRate ?? null,
            afterLowFitRate: impact?.afterLowFitRate ?? null,
            beforeZeroRate: impact?.beforeZeroRate ?? null,
            afterZeroRate: impact?.afterZeroRate ?? null,
            topQuery: impact?.topQuery || pack.commonQueries[0] || null,
        };
    }

    if (impact.noImprovement > 0 && impact.improved === 0) {
        return {
            clusterId: pack.clusterId,
            clusterLabel: pack.clusterLabel,
            recommendation: 'rollback',
            reason: '승인 후에도 low-fit/zero-result가 개선되지 않아 rewrite pack 조정 또는 rollback이 필요합니다.',
            entryIds: pack.entryIds,
            sourceCount: pack.sourceCount,
            commonQueries: pack.commonQueries,
            measured: impact.measured,
            improved: impact.improved,
            noImprovement: impact.noImprovement,
            awaitingSamples: impact.awaitingSamples,
            improvedRate: impact.improvedRate,
            beforeLowFitRate: impact.beforeLowFitRate,
            afterLowFitRate: impact.afterLowFitRate,
            beforeZeroRate: impact.beforeZeroRate,
            afterZeroRate: impact.afterZeroRate,
            topQuery: impact.topQuery,
        };
    }

    if (impact.improved > 0 && impact.improvedRate >= 0.6) {
        return {
            clusterId: pack.clusterId,
            clusterLabel: pack.clusterLabel,
            recommendation: 'promote',
            reason: '승인 후 개선률이 높아 cluster-level rewrite pack으로 안정적으로 유지할 수 있습니다.',
            entryIds: pack.entryIds,
            sourceCount: pack.sourceCount,
            commonQueries: pack.commonQueries,
            measured: impact.measured,
            improved: impact.improved,
            noImprovement: impact.noImprovement,
            awaitingSamples: impact.awaitingSamples,
            improvedRate: impact.improvedRate,
            beforeLowFitRate: impact.beforeLowFitRate,
            afterLowFitRate: impact.afterLowFitRate,
            beforeZeroRate: impact.beforeZeroRate,
            afterZeroRate: impact.afterZeroRate,
            topQuery: impact.topQuery,
        };
    }

    return {
        clusterId: pack.clusterId,
        clusterLabel: pack.clusterLabel,
        recommendation: 'hold',
        reason: '일부 개선은 있지만 표본이 더 필요합니다. 현재 rewrite pack을 유지하면서 추가 관측이 필요합니다.',
        entryIds: pack.entryIds,
        sourceCount: pack.sourceCount,
        commonQueries: pack.commonQueries,
        measured: impact.measured,
        improved: impact.improved,
        noImprovement: impact.noImprovement,
        awaitingSamples: impact.awaitingSamples,
        improvedRate: impact.improvedRate,
        beforeLowFitRate: impact.beforeLowFitRate,
        afterLowFitRate: impact.afterLowFitRate,
        beforeZeroRate: impact.beforeZeroRate,
        afterZeroRate: impact.afterZeroRate,
        topQuery: impact.topQuery,
    };
}

export function buildSearchLearningRewriteRecommendations(
    packs: SearchLearningRewritePack[],
    impactClusters: SearchLearningImpactClusterSummary[]
): SearchLearningRewriteRecommendation[] {
    return packs
        .map((pack) => resolveRecommendation(pack, impactClusters.find((cluster) => cluster.clusterId === pack.clusterId)))
        .sort((left, right) => {
            const priority = (value: SearchLearningRewriteRecommendationType) => {
                switch (value) {
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
            };

            return priority(right.recommendation) - priority(left.recommendation)
                || right.noImprovement - left.noImprovement
                || right.improved - left.improved
                || right.awaitingSamples - left.awaitingSamples;
        });
}

export function buildSearchLearningRewriteRecommendationSummary(
    recommendations: SearchLearningRewriteRecommendation[]
): SearchLearningRewriteRecommendationSummary {
    return {
        tracked: recommendations.length,
        promote: recommendations.filter((entry) => entry.recommendation === 'promote').length,
        hold: recommendations.filter((entry) => entry.recommendation === 'hold').length,
        rollback: recommendations.filter((entry) => entry.recommendation === 'rollback').length,
        awaitingSamples: recommendations.filter((entry) => entry.recommendation === 'awaiting_samples').length,
        topPromote: recommendations.filter((entry) => entry.recommendation === 'promote').slice(0, 4),
        topRollback: recommendations.filter((entry) => entry.recommendation === 'rollback').slice(0, 4),
        topAwaiting: recommendations.filter((entry) => entry.recommendation === 'awaiting_samples').slice(0, 4),
    };
}
