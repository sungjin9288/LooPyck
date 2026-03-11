import { getSemanticFashionClusterLabel, resolveSemanticFashionExpansion } from './fashionOntology.ts';

export type SearchLearningImpactBaseline = {
    approvedAt: string;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
};

export type SearchLearningImpactEntryLike = {
    id: string;
    query: string;
    status: 'pending' | 'approved' | 'ignored';
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
    approvalBaseline: SearchLearningImpactBaseline | null;
};

export type SearchLearningImpactOutcome = 'improved' | 'unchanged' | 'regressed' | 'awaiting_samples';

export type SearchLearningImpactMetrics = {
    entryId: string;
    query: string;
    approvedAt: string;
    postApprovalSamples: number;
    beforeLowFitRate: number | null;
    afterLowFitRate: number | null;
    beforeZeroRate: number | null;
    afterZeroRate: number | null;
    improvementScore: number;
    outcome: SearchLearningImpactOutcome;
};

export type SearchLearningImpactSummary = {
    approvedTracked: number;
    measured: number;
    awaitingSamples: number;
    improved: number;
    unchanged: number;
    regressed: number;
    noImprovement: number;
    improvedRate: number;
    topImproved: SearchLearningImpactMetrics[];
    topNeedsAttention: SearchLearningImpactMetrics[];
    topAwaitingSamples: SearchLearningImpactMetrics[];
};

export type SearchLearningImpactClusterSummary = {
    clusterId: string;
    clusterLabel: string;
    queryCount: number;
    measured: number;
    improved: number;
    noImprovement: number;
    awaitingSamples: number;
    improvedRate: number;
    entryIds: string[];
    topQuery: string | null;
};

function rate(count: number, total: number): number | null {
    if (total <= 0) {
        return null;
    }

    return count / total;
}

function numericDelta(before: number | null, after: number | null): number {
    if (before === null || after === null) {
        return 0;
    }

    return before - after;
}

function resolveImpactCluster(entry: Pick<SearchLearningImpactEntryLike, 'query'>): { clusterId: string; clusterLabel: string } {
    const semantic = resolveSemanticFashionExpansion(entry.query);
    const primaryClusterId = semantic.matchedClusterIds[0];
    if (primaryClusterId) {
        return {
            clusterId: primaryClusterId,
            clusterLabel: getSemanticFashionClusterLabel(primaryClusterId),
        };
    }

    const primaryCategory = semantic.categories[0];
    if (primaryCategory) {
        return {
            clusterId: `category:${primaryCategory}`,
            clusterLabel: primaryCategory,
        };
    }

    return {
        clusterId: 'other',
        clusterLabel: '기타 패션 검색어',
    };
}

export function buildSearchLearningImpact(entry: SearchLearningImpactEntryLike): SearchLearningImpactMetrics | null {
    const baseline = entry.approvalBaseline;
    if (!baseline || entry.status !== 'approved') {
        return null;
    }

    const postApprovalSamples = Math.max(entry.occurrenceCount - baseline.occurrenceCount, 0);
    const postApprovalLowFit = Math.max(entry.lowFitCount - baseline.lowFitCount, 0);
    const postApprovalZero = Math.max(entry.zeroResultCount - baseline.zeroResultCount, 0);
    const beforeLowFitRate = rate(baseline.lowFitCount, baseline.occurrenceCount);
    const afterLowFitRate = rate(postApprovalLowFit, postApprovalSamples);
    const beforeZeroRate = rate(baseline.zeroResultCount, baseline.occurrenceCount);
    const afterZeroRate = rate(postApprovalZero, postApprovalSamples);

    if (postApprovalSamples === 0) {
        return {
            entryId: entry.id,
            query: entry.query,
            approvedAt: baseline.approvedAt,
            postApprovalSamples,
            beforeLowFitRate,
            afterLowFitRate,
            beforeZeroRate,
            afterZeroRate,
            improvementScore: 0,
            outcome: 'awaiting_samples',
        };
    }

    const improvementScore = numericDelta(beforeLowFitRate, afterLowFitRate) + numericDelta(beforeZeroRate, afterZeroRate);
    const epsilon = 0.0001;
    const outcome: SearchLearningImpactOutcome =
        improvementScore > epsilon
            ? 'improved'
            : improvementScore < -epsilon
                ? 'regressed'
                : 'unchanged';

    return {
        entryId: entry.id,
        query: entry.query,
        approvedAt: baseline.approvedAt,
        postApprovalSamples,
        beforeLowFitRate,
        afterLowFitRate,
        beforeZeroRate,
        afterZeroRate,
        improvementScore,
        outcome,
    };
}

export function buildSearchLearningImpactSummary(entries: SearchLearningImpactEntryLike[]): SearchLearningImpactSummary {
    const impacts = entries
        .map((entry) => buildSearchLearningImpact(entry))
        .filter((impact): impact is SearchLearningImpactMetrics => Boolean(impact));

    const awaitingSamples = impacts.filter((impact) => impact.outcome === 'awaiting_samples');
    const measured = impacts.filter((impact) => impact.outcome !== 'awaiting_samples');
    const improved = measured.filter((impact) => impact.outcome === 'improved');
    const unchanged = measured.filter((impact) => impact.outcome === 'unchanged');
    const regressed = measured.filter((impact) => impact.outcome === 'regressed');
    const noImprovement = [...regressed, ...unchanged];

    return {
        approvedTracked: impacts.length,
        measured: measured.length,
        awaitingSamples: awaitingSamples.length,
        improved: improved.length,
        unchanged: unchanged.length,
        regressed: regressed.length,
        noImprovement: noImprovement.length,
        improvedRate: measured.length > 0 ? improved.length / measured.length : 0,
        topImproved: improved
            .sort((left, right) => right.improvementScore - left.improvementScore)
            .slice(0, 5),
        topNeedsAttention: noImprovement
            .sort((left, right) => left.improvementScore - right.improvementScore)
            .slice(0, 5),
        topAwaitingSamples: awaitingSamples
            .sort((left, right) => right.approvedAt.localeCompare(left.approvedAt))
            .slice(0, 5),
    };
}

export function buildSearchLearningImpactClusterSummaries(entries: SearchLearningImpactEntryLike[]): SearchLearningImpactClusterSummary[] {
    const impacts = entries
        .map((entry) => buildSearchLearningImpact(entry))
        .filter((impact): impact is SearchLearningImpactMetrics => Boolean(impact));

    const clusters = new Map<string, SearchLearningImpactClusterSummary>();

    impacts.forEach((impact) => {
        const { clusterId, clusterLabel } = resolveImpactCluster({ query: impact.query });
        const current = clusters.get(clusterId) || {
            clusterId,
            clusterLabel,
            queryCount: 0,
            measured: 0,
            improved: 0,
            noImprovement: 0,
            awaitingSamples: 0,
            improvedRate: 0,
            entryIds: [],
            topQuery: null,
        };

        current.queryCount += 1;
        current.entryIds = Array.from(new Set([...current.entryIds, impact.entryId]));
        if (impact.outcome === 'awaiting_samples') {
            current.awaitingSamples += 1;
        } else {
            current.measured += 1;
            if (impact.outcome === 'improved') {
                current.improved += 1;
            } else {
                current.noImprovement += 1;
            }
        }

        if (!current.topQuery || impact.postApprovalSamples > 0) {
            current.topQuery = impact.query;
        }

        clusters.set(clusterId, current);
    });

    return Array.from(clusters.values())
        .map((cluster) => ({
            ...cluster,
            improvedRate: cluster.measured > 0 ? cluster.improved / cluster.measured : 0,
        }))
        .sort((left, right) => {
            if (right.noImprovement !== left.noImprovement) {
                return right.noImprovement - left.noImprovement;
            }
            if (right.awaitingSamples !== left.awaitingSamples) {
                return right.awaitingSamples - left.awaitingSamples;
            }
            return right.queryCount - left.queryCount;
        });
}
