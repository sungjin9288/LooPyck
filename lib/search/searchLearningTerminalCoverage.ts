import type { SearchLearningImpactClusterRollup } from './searchLearningImpact.ts';
import type { SearchQualityCoverageSummary } from './searchQualityCoverage.ts';

export type SearchLearningTerminalCoverageTone = 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';

export type SearchLearningTerminalCoverageFocus = {
    id: string;
    title: string;
    label: string;
    summary: string;
    tone: SearchLearningTerminalCoverageTone;
    count: number;
};

export type SearchLearningTerminalCoverage = {
    qualityLabel: 'strong' | 'mixed' | 'weak';
    coverageScore: number;
    uncoveredQueries: number;
    uncoveredClusters: number;
    improvedClusters: number;
    needsAttentionClusters: number;
    awaitingClusters: number;
    focusAreas: SearchLearningTerminalCoverageFocus[];
};

function clampPercent(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildSearchLearningTerminalCoverage(
    coverage: SearchQualityCoverageSummary,
    clusterRollup: SearchLearningImpactClusterRollup
): SearchLearningTerminalCoverage {
    const coverageScore = clampPercent(
        coverage.fullCoverageRate * 55
        + coverage.naverCoverageRate * 25
        + clusterRollup.improvedRate * 20
    );

    const qualityLabel =
        coverageScore >= 80
            ? 'strong'
            : coverageScore >= 55
                ? 'mixed'
                : 'weak';

    const uncoveredClusters = coverage.clusters.filter((cluster) => cluster.uncoveredQueries.length > 0).length;

    const focusAreas: SearchLearningTerminalCoverageFocus[] = [
        {
            id: 'coverage_gap',
            title: 'Coverage Gap',
            label:
                coverage.uncoveredQueries.length === 0
                    ? 'covered'
                    : coverage.uncoveredQueries.length <= 6
                        ? 'watch'
                        : 'critical',
            summary:
                coverage.uncoveredQueries.length === 0
                    ? 'curated 패션 검색어 평가셋이 현재 모두 커버되고 있습니다.'
                    : `curated 평가셋에서 ${coverage.uncoveredQueries.length}개 query가 아직 미커버 상태입니다.`,
            tone:
                coverage.uncoveredQueries.length === 0
                    ? 'emerald'
                    : coverage.uncoveredQueries.length <= 6
                        ? 'amber'
                        : 'rose',
            count: coverage.uncoveredQueries.length,
        },
        {
            id: 'cluster_quality',
            title: 'Cluster Quality',
            label:
                clusterRollup.noImprovement === 0
                    ? 'stable'
                    : clusterRollup.noImprovement <= clusterRollup.improved
                        ? 'mixed'
                        : 'needs_tuning',
            summary:
                clusterRollup.noImprovement === 0
                    ? 'semantic cluster 기준으로 재학습이 필요한 묶음이 거의 없습니다.'
                    : `semantic cluster ${clusterRollup.noImprovement}개가 아직 개선 없이 남아 있습니다.`,
            tone:
                clusterRollup.noImprovement === 0
                    ? 'emerald'
                    : clusterRollup.noImprovement <= clusterRollup.improved
                        ? 'amber'
                        : 'rose',
            count: clusterRollup.noImprovement,
        },
        {
            id: 'validation_flow',
            title: 'Validation Flow',
            label:
                clusterRollup.awaitingSamples === 0
                    ? 'validated'
                    : clusterRollup.awaitingSamples <= clusterRollup.improved
                        ? 'sampling'
                        : 'backlog',
            summary:
                clusterRollup.awaitingSamples === 0
                    ? '승인된 cluster는 대부분 검증까지 완료된 상태입니다.'
                    : `승인된 cluster ${clusterRollup.awaitingSamples}개가 아직 sample을 더 모아야 합니다.`,
            tone:
                clusterRollup.awaitingSamples === 0
                    ? 'emerald'
                    : clusterRollup.awaitingSamples <= clusterRollup.improved
                        ? 'sky'
                        : 'amber',
            count: clusterRollup.awaitingSamples,
        },
    ];

    return {
        qualityLabel,
        coverageScore,
        uncoveredQueries: coverage.uncoveredQueries.length,
        uncoveredClusters,
        improvedClusters: clusterRollup.improved,
        needsAttentionClusters: clusterRollup.noImprovement,
        awaitingClusters: clusterRollup.awaitingSamples,
        focusAreas,
    };
}
