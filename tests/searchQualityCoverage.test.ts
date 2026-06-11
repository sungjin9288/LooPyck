import assert from 'node:assert/strict';
import test from 'node:test';
import { analyzeFashionQuery, buildSourceAwareSearchPlan } from '../lib/search/fashionQueryAssistant.ts';
import { buildSearchQualityCoverageSummary } from '../lib/search/searchQualityCoverage.ts';
import { SEARCH_QUALITY_DATASET, type SearchQualityDatasetEntry } from '../lib/search/searchQualityDataset.ts';

function normalizeSearchText(text: string): string {
    return text
        .toLowerCase()
        .replace(/[()[\]{}|/\\,.;:_+*?!~`"'“”‘’<>-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function hasCandidateCoverage(expected: string[], planned: string[]): boolean {
    const normalizedPlanned = planned.map((query) => normalizeSearchText(query));

    return expected.some((candidate) => {
        const normalizedCandidate = normalizeSearchText(candidate);
        return normalizedPlanned.some((plannedQuery) =>
            plannedQuery === normalizedCandidate || plannedQuery.includes(normalizedCandidate)
        );
    });
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

function evaluateCoverageEntry({ query, expectedNaver, expectedGlobal }: SearchQualityDatasetEntry) {
    const analysis = analyzeFashionQuery(query);
    const plan = buildSourceAwareSearchPlan(analysis);
    const naverCandidates = uniqueOrdered(plan.NAVER || []);
    const globalCandidates = uniqueOrdered([...(plan.FARFETCH || []), ...(plan.SSENSE || [])]);

    return {
        query,
        expectedGlobalCount: expectedGlobal?.length ?? 0,
        allowed: analysis.allowed,
        naverCandidates,
        globalCandidates,
        hasNaverCoverage: hasCandidateCoverage(expectedNaver, naverCandidates),
        hasGlobalCoverage: expectedGlobal && expectedGlobal.length > 0
            ? hasCandidateCoverage(expectedGlobal, globalCandidates)
            : true,
    };
}

function evaluateDatasetCoverage() {
    return SEARCH_QUALITY_DATASET.map((entry) => evaluateCoverageEntry(entry));
}

test('curated search-quality dataset keeps source-aware coverage candidates across core channels', () => {
    const rows = evaluateDatasetCoverage();

    rows.forEach((row) => {
        assert.equal(row.allowed, true, `${row.query} should remain an allowed fashion query`);
        assert.ok(row.naverCandidates.length >= 1, `${row.query} should keep at least one NAVER candidate`);
        assert.ok(row.hasNaverCoverage, `${row.query} should cover an expected NAVER candidate`);

        if (row.expectedGlobalCount > 0) {
            assert.ok(row.globalCandidates.length >= 1, `${row.query} should keep at least one global candidate`);
            assert.ok(row.hasGlobalCoverage, `${row.query} should cover an expected global candidate`);
        }
    });
});

test('search quality coverage summary stays aligned with curated dataset metrics', () => {
    const rows = evaluateDatasetCoverage();
    const summary = buildSearchQualityCoverageSummary();
    const globalTargetQueries = rows.filter((row) => row.expectedGlobalCount > 0).length;
    const naverCovered = rows.filter((row) => row.hasNaverCoverage).length;
    const globalCovered = rows.filter((row) => row.hasGlobalCoverage && row.expectedGlobalCount > 0).length;
    const fullyCovered = rows.filter((row) => row.hasNaverCoverage && row.hasGlobalCoverage).length;
    const uncoveredRows = rows.filter((row) => !row.hasNaverCoverage || !row.hasGlobalCoverage);

    assert.equal(summary.totalQueries, rows.length);
    assert.equal(summary.globalTargetQueries, globalTargetQueries);
    assert.equal(summary.naverCovered, naverCovered);
    assert.equal(summary.globalCovered, globalCovered);
    assert.equal(summary.fullyCovered, fullyCovered);
    assert.equal(summary.uncoveredQueries.length, Math.min(12, uncoveredRows.length));
    assert.ok(summary.naverCoverageRate >= 0.8);
    assert.ok(summary.globalCoverageRate >= 0.7);
    assert.ok(summary.fullCoverageRate >= 0.7);
});

test('coverage summary preserves representative cluster metadata and uncovered issue shape', () => {
    const summary = buildSearchQualityCoverageSummary();
    const hoodieCluster = summary.clusters.find((cluster) => cluster.clusterId === 'hoodie_training');

    assert.ok(summary.clusters.length > 0);
    assert.ok(hoodieCluster);
    assert.equal(hoodieCluster?.clusterLabel, '후드/후드집업');
    assert.ok((hoodieCluster?.totalQueries ?? 0) >= 2);

    summary.uncoveredQueries.forEach((issue) => {
        assert.ok(issue.query.length > 0);
        assert.ok(issue.naverMissing.length > 0 || issue.globalMissing.length > 0);
    });
});
