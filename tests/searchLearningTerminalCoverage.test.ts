import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalCoverage } from '../lib/search/searchLearningTerminalCoverage.ts';
import type { SearchLearningImpactClusterRollup } from '../lib/search/searchLearningImpact.ts';
import type { SearchQualityCoverageSummary } from '../lib/search/searchQualityCoverage.ts';

function createCoverage(
    overrides: Partial<SearchQualityCoverageSummary> = {}
): SearchQualityCoverageSummary {
    return {
        totalQueries: 20,
        globalTargetQueries: 12,
        naverCovered: 18,
        globalCovered: 10,
        fullyCovered: 16,
        naverCoverageRate: 0.9,
        globalCoverageRate: 10 / 12,
        fullCoverageRate: 0.8,
        uncoveredQueries: [],
        clusters: [],
        ...overrides,
    };
}

function createClusterRollup(
    overrides: Partial<SearchLearningImpactClusterRollup> = {}
): SearchLearningImpactClusterRollup {
    return {
        tracked: 8,
        measured: 6,
        awaitingSamples: 1,
        improved: 4,
        noImprovement: 1,
        improvedRate: 4 / 6,
        topImproved: [],
        topNeedsAttention: [],
        topAwaitingSamples: [],
        ...overrides,
    };
}

test('terminal coverage becomes strong when coverage and cluster impact are healthy', () => {
    const summary = buildSearchLearningTerminalCoverage(
        createCoverage(),
        createClusterRollup()
    );

    assert.equal(summary.qualityLabel, 'strong');
    assert.ok(summary.coverageScore >= 80);
    assert.equal(summary.uncoveredQueries, 0);
    assert.equal(summary.needsAttentionClusters, 1);
    assert.equal(summary.focusAreas[0]?.label, 'covered');
    assert.equal(summary.focusAreas[1]?.label, 'mixed');
    assert.equal(summary.focusAreas[2]?.label, 'sampling');
});

test('terminal coverage becomes weak when uncovered queries and no-improvement clusters pile up', () => {
    const summary = buildSearchLearningTerminalCoverage(
        createCoverage({
            naverCoverageRate: 0.35,
            globalCoverageRate: 0.2,
            fullCoverageRate: 0.15,
            uncoveredQueries: [
                {
                    query: '운동용 후드',
                    naverMatched: [],
                    naverMissing: ['후드집업'],
                    globalMatched: [],
                    globalMissing: ['hoodie'],
                },
                {
                    query: '러닝 자켓',
                    naverMatched: [],
                    naverMissing: ['바람막이'],
                    globalMatched: [],
                    globalMissing: ['running jacket'],
                },
                {
                    query: '등산 바지',
                    naverMatched: [],
                    naverMissing: ['아웃도어 팬츠'],
                    globalMatched: [],
                    globalMissing: ['hiking pants'],
                },
                {
                    query: '트레이닝 팬츠',
                    naverMatched: [],
                    naverMissing: ['조거 팬츠'],
                    globalMatched: [],
                    globalMissing: ['track pants'],
                },
                {
                    query: '남자 후드',
                    naverMatched: [],
                    naverMissing: ['남성 후드집업'],
                    globalMatched: [],
                    globalMissing: ['mens hoodie'],
                },
                {
                    query: '러닝화',
                    naverMatched: [],
                    naverMissing: ['러닝 슈즈'],
                    globalMatched: [],
                    globalMissing: ['running shoes'],
                },
                {
                    query: '미니 크로스백',
                    naverMatched: [],
                    naverMissing: ['미니백'],
                    globalMatched: [],
                    globalMissing: ['crossbody bag'],
                },
            ],
            clusters: [
                {
                    clusterId: 'hoodies',
                    clusterLabel: '후드/후드집업',
                    totalQueries: 4,
                    globalTargetQueries: 4,
                    naverCovered: 1,
                    globalCovered: 0,
                    fullyCovered: 0,
                    naverCoverageRate: 0.25,
                    globalCoverageRate: 0,
                    fullCoverageRate: 0,
                    uncoveredQueries: [
                        {
                            query: '운동용 후드',
                            naverMatched: [],
                            naverMissing: ['후드집업'],
                            globalMatched: [],
                            globalMissing: ['hoodie'],
                        },
                    ],
                },
                {
                    clusterId: 'running',
                    clusterLabel: '러닝',
                    totalQueries: 3,
                    globalTargetQueries: 3,
                    naverCovered: 0,
                    globalCovered: 0,
                    fullyCovered: 0,
                    naverCoverageRate: 0,
                    globalCoverageRate: 0,
                    fullCoverageRate: 0,
                    uncoveredQueries: [
                        {
                            query: '러닝 자켓',
                            naverMatched: [],
                            naverMissing: ['바람막이'],
                            globalMatched: [],
                            globalMissing: ['running jacket'],
                        },
                    ],
                },
            ],
        }),
        createClusterRollup({
            improved: 1,
            noImprovement: 5,
            awaitingSamples: 4,
            measured: 6,
            improvedRate: 1 / 6,
        })
    );

    assert.equal(summary.qualityLabel, 'weak');
    assert.ok(summary.coverageScore < 55);
    assert.equal(summary.uncoveredQueries, 7);
    assert.equal(summary.uncoveredClusters, 2);
    assert.equal(summary.focusAreas[0]?.label, 'critical');
    assert.equal(summary.focusAreas[1]?.label, 'needs_tuning');
    assert.equal(summary.focusAreas[2]?.label, 'backlog');
});
