import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalOverview } from '../lib/searchLearning/searchLearningTerminalOverview.ts';
import type { SearchLearningTerminalCoverage } from '../lib/searchLearning/searchLearningTerminalCoverage.ts';
import type { SearchLearningTerminalHealth } from '../lib/searchLearning/searchLearningTerminalHealth.ts';
import type { SearchLearningTerminalMetrics } from '../lib/searchLearning/searchLearningTerminalMetrics.ts';
import type { SearchLearningTerminalPrioritySummary } from '../lib/searchLearning/searchLearningTerminalPriorities.ts';
import type { SearchLearningTerminalTrends } from '../lib/searchLearning/searchLearningTerminalTrends.ts';
import type { SearchLearningTerminalWorkflowSummary } from '../lib/searchLearning/searchLearningTerminalWorkflow.ts';

function createWorkflow(
    overrides: Partial<SearchLearningTerminalWorkflowSummary> = {}
): SearchLearningTerminalWorkflowSummary {
    return {
        state: 'action_required',
        pending: 0,
        drafts: 2,
        reviewNow: 4,
        generateNow: 2,
        retrainNow: 1,
        sampleCollection: 0,
        observe: 0,
        improved: 1,
        noImprovement: 1,
        awaitingSamples: 0,
        topActions: [],
        ...overrides,
    };
}

function createHealth(overrides: Partial<SearchLearningTerminalHealth> = {}): SearchLearningTerminalHealth {
    return {
        score: 43,
        label: 'critical',
        summary: '즉시 처리할 backlog가 큽니다.',
        blockers: ['즉시 review 4건'],
        nextCheck: 'run alerts',
        ...overrides,
    };
}

function createPriorities(
    overrides: Partial<SearchLearningTerminalPrioritySummary> = {}
): SearchLearningTerminalPrioritySummary {
    return {
        status: 'critical',
        headline: 'critical',
        critical: 1,
        high: 1,
        medium: 0,
        low: 0,
        priorities: [
            {
                id: 'coverage',
                source: 'coverage',
                severity: 'critical',
                title: 'Coverage Gap First',
                summary: 'coverage gap을 먼저 메워야 합니다.',
                count: 6,
                lane: 'coverage',
                action: {
                    id: 'generate',
                    kind: 'generate_now',
                    title: 'Generate Needed',
                    description: 'AI suggestion 생성',
                    count: 6,
                    entryIds: ['a', 'b'],
                    tone: 'sky',
                    actionLabel: 'generate needed AI 제안',
                },
            },
        ],
        ...overrides,
    };
}

function createMetrics(overrides: Partial<SearchLearningTerminalMetrics> = {}): SearchLearningTerminalMetrics {
    return {
        healthScore: 43,
        criticalAlerts: 2,
        backlogPressure: 8,
        actionLoad: 9,
        activeDays: 4,
        recentGenerated: 5,
        recentReviewed: 3,
        recentApproved: 2,
        recentIgnored: 1,
        trend: [],
        ...overrides,
    };
}

function createCoverage(overrides: Partial<SearchLearningTerminalCoverage> = {}): SearchLearningTerminalCoverage {
    return {
        qualityLabel: 'weak',
        coverageScore: 41,
        uncoveredQueries: 6,
        uncoveredClusters: 2,
        improvedClusters: 1,
        needsAttentionClusters: 3,
        awaitingClusters: 1,
        focusAreas: [],
        ...overrides,
    };
}

function createTrends(overrides: Partial<SearchLearningTerminalTrends> = {}): SearchLearningTerminalTrends {
    return {
        paceLabel: 'slowing',
        backlogLabel: 'rising',
        approvalLabel: 'needs_attention',
        focusAreas: [
            {
                id: 'activity_pace',
                title: 'Activity Pace',
                label: 'slowing',
                summary: '최근 activity가 줄어들고 있습니다.',
                tone: 'amber',
                count: 4,
            },
        ],
        ...overrides,
    };
}

test('terminal overview highlights critical lane and next step', () => {
    const overview = buildSearchLearningTerminalOverview(
        createWorkflow(),
        createHealth(),
        createPriorities(),
        createMetrics(),
        createCoverage(),
        createTrends()
    );

    assert.equal(overview.status, 'critical');
    assert.equal(overview.primaryLane, 'coverage');
    assert.match(overview.headline, /가장 급한 lane/);
    assert.match(overview.nextStep, /generate needed AI 제안/);
    assert.equal(overview.spotlights.length, 3);
});

test('terminal overview settles into stable mode when no priority remains', () => {
    const overview = buildSearchLearningTerminalOverview(
        createWorkflow({ state: 'stable', reviewNow: 0, drafts: 0, generateNow: 0, retrainNow: 0, topActions: [] }),
        createHealth({ score: 96, label: 'healthy', summary: 'stable' }),
        createPriorities({ status: 'stable', critical: 0, high: 0, medium: 0, low: 0, priorities: [] }),
        createMetrics({ actionLoad: 0 }),
        createCoverage({ qualityLabel: 'strong', coverageScore: 90, uncoveredQueries: 0, uncoveredClusters: 0 }),
        createTrends({ paceLabel: 'steady', focusAreas: [{ id: 'activity_pace', title: 'Activity Pace', label: 'steady', summary: '안정적입니다.', tone: 'sky', count: 2 }] })
    );

    assert.equal(overview.status, 'stable');
    assert.equal(overview.primaryLane, 'stable');
    assert.match(overview.headline, /안정 상태/);
    assert.match(overview.nextStep, /새 low-fit\/0건 query/);
});
