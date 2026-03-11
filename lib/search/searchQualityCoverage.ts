import { analyzeFashionQuery, buildSourceAwareSearchPlan } from './fashionQueryAssistant.ts';
import { getSemanticFashionClusterLabel, resolveSemanticFashionExpansion } from './fashionOntology.ts';
import { SEARCH_QUALITY_DATASET } from './searchQualityDataset.ts';

export type SearchQualityCoverageIssue = {
    query: string;
    naverMatched: string[];
    naverMissing: string[];
    globalMatched: string[];
    globalMissing: string[];
};

export type SearchQualityCoverageSummary = {
    totalQueries: number;
    globalTargetQueries: number;
    naverCovered: number;
    globalCovered: number;
    fullyCovered: number;
    naverCoverageRate: number;
    globalCoverageRate: number;
    fullCoverageRate: number;
    uncoveredQueries: SearchQualityCoverageIssue[];
    clusters: SearchQualityCoverageClusterSummary[];
};

export type SearchQualityCoverageClusterSummary = {
    clusterId: string;
    clusterLabel: string;
    totalQueries: number;
    globalTargetQueries: number;
    naverCovered: number;
    globalCovered: number;
    fullyCovered: number;
    naverCoverageRate: number;
    globalCoverageRate: number;
    fullCoverageRate: number;
    uncoveredQueries: SearchQualityCoverageIssue[];
};

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

function normalizeSearchText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[()[\]{}|/\\,.;:_+*?!~`"'“”‘’<>-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function collectMatches(expected: string[], planned: string[]): { matched: string[]; missing: string[] } {
    const normalizedPlanned = planned.map((query) => normalizeSearchText(query));
    const matched: string[] = [];
    const missing: string[] = [];

    expected.forEach((candidate) => {
        const normalizedCandidate = normalizeSearchText(candidate);
        const covered = normalizedPlanned.some((plannedQuery) =>
            plannedQuery === normalizedCandidate || plannedQuery.includes(normalizedCandidate)
        );

        if (covered) {
            matched.push(candidate);
            return;
        }

        missing.push(candidate);
    });

    return {
        matched: uniqueOrdered(matched),
        missing: uniqueOrdered(missing),
    };
}

function resolveCoverageCluster(query: string): { clusterId: string; clusterLabel: string } {
    const semantic = resolveSemanticFashionExpansion(query);
    const clusterId = semantic.matchedClusterIds[0];
    if (clusterId) {
        return {
            clusterId,
            clusterLabel: getSemanticFashionClusterLabel(clusterId),
        };
    }

    return {
        clusterId: 'other',
        clusterLabel: '기타 패션 검색어',
    };
}

export function buildSearchQualityCoverageSummary(): SearchQualityCoverageSummary {
    const issues: SearchQualityCoverageIssue[] = [];
    const clusterMap = new Map<string, SearchQualityCoverageClusterSummary>();
    let naverCovered = 0;
    let globalCovered = 0;
    let fullyCovered = 0;
    let globalTargetQueries = 0;

    SEARCH_QUALITY_DATASET.forEach(({ query, expectedNaver, expectedGlobal }) => {
        const { clusterId, clusterLabel } = resolveCoverageCluster(query);
        const cluster = clusterMap.get(clusterId) || {
            clusterId,
            clusterLabel,
            totalQueries: 0,
            globalTargetQueries: 0,
            naverCovered: 0,
            globalCovered: 0,
            fullyCovered: 0,
            naverCoverageRate: 0,
            globalCoverageRate: 0,
            fullCoverageRate: 0,
            uncoveredQueries: [],
        };
        cluster.totalQueries += 1;
        const analysis = analyzeFashionQuery(query);
        const plan = buildSourceAwareSearchPlan(analysis);
        const naverQueries = uniqueOrdered(plan.NAVER || []);
        const globalQueries = uniqueOrdered([...(plan.FARFETCH || []), ...(plan.SSENSE || [])]);

        const naverCoverage = collectMatches(expectedNaver, naverQueries);
        const hasNaverCoverage = naverCoverage.matched.length > 0;
        if (hasNaverCoverage) {
            naverCovered += 1;
            cluster.naverCovered += 1;
        }

        let hasGlobalCoverage = true;
        let globalCoverage = { matched: [] as string[], missing: [] as string[] };
        if (expectedGlobal && expectedGlobal.length > 0) {
            globalTargetQueries += 1;
            cluster.globalTargetQueries += 1;
            globalCoverage = collectMatches(expectedGlobal, globalQueries);
            hasGlobalCoverage = globalCoverage.matched.length > 0;
            if (hasGlobalCoverage) {
                globalCovered += 1;
                cluster.globalCovered += 1;
            }
        }

        if (hasNaverCoverage && hasGlobalCoverage) {
            fullyCovered += 1;
            cluster.fullyCovered += 1;
        }

        if (!hasNaverCoverage || !hasGlobalCoverage) {
            const issue = {
                query,
                naverMatched: naverCoverage.matched,
                naverMissing: naverCoverage.missing,
                globalMatched: globalCoverage.matched,
                globalMissing: globalCoverage.missing,
            };
            issues.push(issue);
            cluster.uncoveredQueries.push(issue);
        }

        clusterMap.set(clusterId, cluster);
    });

    const clusters = Array.from(clusterMap.values())
        .map((cluster) => ({
            ...cluster,
            naverCoverageRate: cluster.totalQueries > 0 ? cluster.naverCovered / cluster.totalQueries : 0,
            globalCoverageRate: cluster.globalTargetQueries > 0 ? cluster.globalCovered / cluster.globalTargetQueries : 0,
            fullCoverageRate: cluster.totalQueries > 0 ? cluster.fullyCovered / cluster.totalQueries : 0,
            uncoveredQueries: cluster.uncoveredQueries.slice(0, 6),
        }))
        .sort((left, right) => {
            const uncoveredDiff = right.uncoveredQueries.length - left.uncoveredQueries.length;
            if (uncoveredDiff !== 0) {
                return uncoveredDiff;
            }

            const coverageDiff = left.fullCoverageRate - right.fullCoverageRate;
            if (coverageDiff !== 0) {
                return coverageDiff;
            }

            return right.totalQueries - left.totalQueries;
        });

    return {
        totalQueries: SEARCH_QUALITY_DATASET.length,
        globalTargetQueries,
        naverCovered,
        globalCovered,
        fullyCovered,
        naverCoverageRate: SEARCH_QUALITY_DATASET.length > 0 ? naverCovered / SEARCH_QUALITY_DATASET.length : 0,
        globalCoverageRate: globalTargetQueries > 0 ? globalCovered / globalTargetQueries : 0,
        fullCoverageRate: SEARCH_QUALITY_DATASET.length > 0 ? fullyCovered / SEARCH_QUALITY_DATASET.length : 0,
        uncoveredQueries: issues.slice(0, 12),
        clusters,
    };
}
