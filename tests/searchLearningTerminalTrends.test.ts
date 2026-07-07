import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalTrends } from '../lib/searchLearning/searchLearningTerminalTrends.ts';
import type { SearchLearningTerminalMetrics } from '../lib/searchLearning/searchLearningTerminalMetrics.ts';
import type { SearchLearningTerminalWorkflowSummary } from '../lib/searchLearning/searchLearningTerminalWorkflow.ts';

function createWorkflow(
    overrides: Partial<SearchLearningTerminalWorkflowSummary> = {}
): SearchLearningTerminalWorkflowSummary {
    return {
        state: 'stable',
        pending: 0,
        drafts: 0,
        reviewNow: 0,
        generateNow: 0,
        retrainNow: 0,
        sampleCollection: 0,
        observe: 0,
        improved: 0,
        noImprovement: 0,
        awaitingSamples: 0,
        topActions: [],
        ...overrides,
    };
}

function createMetrics(
    overrides: Partial<SearchLearningTerminalMetrics> = {}
): SearchLearningTerminalMetrics {
    return {
        healthScore: 80,
        criticalAlerts: 1,
        backlogPressure: 5,
        actionLoad: 6,
        activeDays: 4,
        recentGenerated: 8,
        recentReviewed: 10,
        recentApproved: 8,
        recentIgnored: 2,
        trend: [
            { day: '2026-03-09', seeded: 0, generated: 1, reviewed: 1, approved: 1, ignored: 0 },
            { day: '2026-03-10', seeded: 1, generated: 1, reviewed: 1, approved: 1, ignored: 0 },
            { day: '2026-03-11', seeded: 0, generated: 1, reviewed: 1, approved: 1, ignored: 0 },
            { day: '2026-03-12', seeded: 2, generated: 2, reviewed: 2, approved: 2, ignored: 0 },
            { day: '2026-03-13', seeded: 3, generated: 3, reviewed: 3, approved: 2, ignored: 1 },
            { day: '2026-03-14', seeded: 3, generated: 3, reviewed: 4, approved: 3, ignored: 1 },
            { day: '2026-03-15', seeded: 4, generated: 4, reviewed: 5, approved: 4, ignored: 1 },
        ],
        ...overrides,
    };
}

test('terminal trends identify accelerating pace and healthy approvals', () => {
    const trends = buildSearchLearningTerminalTrends(
        createWorkflow({ reviewNow: 2, drafts: 1, retrainNow: 1, observe: 5, improved: 6 }),
        createMetrics()
    );

    assert.equal(trends.paceLabel, 'accelerating');
    assert.equal(trends.backlogLabel, 'falling');
    assert.equal(trends.approvalLabel, 'healthy');
    assert.equal(trends.focusAreas.length, 3);
    assert.equal(trends.focusAreas[0]?.id, 'activity_pace');
});

test('terminal trends identify weak approval quality and rising backlog', () => {
    const trends = buildSearchLearningTerminalTrends(
        createWorkflow({ reviewNow: 8, drafts: 5, retrainNow: 4, observe: 1, improved: 1 }),
        createMetrics({
            trend: [
                { day: '2026-03-09', seeded: 1, generated: 2, reviewed: 6, approved: 1, ignored: 5 },
                { day: '2026-03-10', seeded: 1, generated: 1, reviewed: 5, approved: 1, ignored: 4 },
                { day: '2026-03-11', seeded: 1, generated: 1, reviewed: 4, approved: 1, ignored: 3 },
                { day: '2026-03-12', seeded: 1, generated: 1, reviewed: 3, approved: 0, ignored: 3 },
                { day: '2026-03-13', seeded: 0, generated: 0, reviewed: 2, approved: 0, ignored: 2 },
                { day: '2026-03-14', seeded: 0, generated: 0, reviewed: 1, approved: 0, ignored: 1 },
                { day: '2026-03-15', seeded: 0, generated: 0, reviewed: 1, approved: 0, ignored: 1 },
            ],
        })
    );

    assert.equal(trends.approvalLabel, 'needs_attention');
    assert.equal(trends.backlogLabel, 'rising');
    assert.match(trends.focusAreas[2]?.summary || '', /승인율이 낮아/);
});

test('terminal trends handle idle metrics with no reviews', () => {
    const trends = buildSearchLearningTerminalTrends(
        createWorkflow(),
        createMetrics({
            trend: Array.from({ length: 7 }, (_, index) => ({
                day: `2026-03-${String(9 + index).padStart(2, '0')}`,
                seeded: 0,
                generated: 0,
                reviewed: 0,
                approved: 0,
                ignored: 0,
            })),
            recentReviewed: 0,
            recentApproved: 0,
            recentIgnored: 0,
        })
    );

    assert.equal(trends.paceLabel, 'idle');
    assert.equal(trends.approvalLabel, 'awaiting_reviews');
});
