import { analyzeFashionQuery, buildSourceAwareSearchPlan } from './fashionQueryAssistant.ts';
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

export function buildSearchQualityCoverageSummary(): SearchQualityCoverageSummary {
    const issues: SearchQualityCoverageIssue[] = [];
    let naverCovered = 0;
    let globalCovered = 0;
    let fullyCovered = 0;
    let globalTargetQueries = 0;

    SEARCH_QUALITY_DATASET.forEach(({ query, expectedNaver, expectedGlobal }) => {
        const analysis = analyzeFashionQuery(query);
        const plan = buildSourceAwareSearchPlan(analysis);
        const naverQueries = uniqueOrdered(plan.NAVER || []);
        const globalQueries = uniqueOrdered([...(plan.FARFETCH || []), ...(plan.SSENSE || [])]);

        const naverCoverage = collectMatches(expectedNaver, naverQueries);
        const hasNaverCoverage = naverCoverage.matched.length > 0;
        if (hasNaverCoverage) {
            naverCovered += 1;
        }

        let hasGlobalCoverage = true;
        let globalCoverage = { matched: [] as string[], missing: [] as string[] };
        if (expectedGlobal && expectedGlobal.length > 0) {
            globalTargetQueries += 1;
            globalCoverage = collectMatches(expectedGlobal, globalQueries);
            hasGlobalCoverage = globalCoverage.matched.length > 0;
            if (hasGlobalCoverage) {
                globalCovered += 1;
            }
        }

        if (hasNaverCoverage && hasGlobalCoverage) {
            fullyCovered += 1;
        }

        if (!hasNaverCoverage || !hasGlobalCoverage) {
            issues.push({
                query,
                naverMatched: naverCoverage.matched,
                naverMissing: naverCoverage.missing,
                globalMatched: globalCoverage.matched,
                globalMissing: globalCoverage.missing,
            });
        }
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
    };
}
