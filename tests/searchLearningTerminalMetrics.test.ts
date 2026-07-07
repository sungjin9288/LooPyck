import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalMetrics } from '../lib/searchLearning/searchLearningTerminalMetrics.ts';
import type { SearchLearningActivityEvent } from '../lib/search/queryLearningTypes.ts';
import type { SearchLearningTerminalAlertSummary } from '../lib/searchLearning/searchLearningTerminalAlerts.ts';
import type { SearchLearningTerminalHealth } from '../lib/searchLearning/searchLearningTerminalHealth.ts';
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

function createHealth(overrides: Partial<SearchLearningTerminalHealth> = {}): SearchLearningTerminalHealth {
    return {
        score: 82,
        label: 'monitoring',
        summary: 'monitoring',
        blockers: [],
        nextCheck: 'observe impact',
        ...overrides,
    };
}

function createAlerts(overrides: Partial<SearchLearningTerminalAlertSummary> = {}): SearchLearningTerminalAlertSummary {
    return {
        total: 2,
        critical: 1,
        warning: 1,
        info: 0,
        success: 0,
        topAlerts: [],
        ...overrides,
    };
}

function createEvent(overrides: Partial<SearchLearningActivityEvent>): SearchLearningActivityEvent {
    return {
        id: overrides.id || 'event-1',
        type: overrides.type || 'seed_queries',
        context: overrides.context || 'seed:terminal',
        reviewedStatus: overrides.reviewedStatus,
        actorUid: overrides.actorUid || 'uid-1',
        count: overrides.count ?? 1,
        entryIds: overrides.entryIds || ['entry-1'],
        queries: overrides.queries || ['남자 후드'],
        createdAt: overrides.createdAt || '2026-03-15T10:00:00.000Z',
    };
}

test('terminal metrics aggregates recent activity into 7-day trend', () => {
    const metrics = buildSearchLearningTerminalMetrics(
        createWorkflow({
            drafts: 2,
            reviewNow: 3,
            generateNow: 4,
            retrainNow: 1,
            sampleCollection: 2,
        }),
        createHealth({ score: 76 }),
        createAlerts({ critical: 2, warning: 1, total: 3 }),
        [
            createEvent({
                id: 'seed',
                type: 'seed_queries',
                count: 2,
                createdAt: '2026-03-13T10:00:00.000Z',
            }),
            createEvent({
                id: 'generate',
                type: 'generate_suggestions',
                count: 3,
                createdAt: '2026-03-14T10:00:00.000Z',
            }),
            createEvent({
                id: 'review-approved',
                type: 'review_entries',
                reviewedStatus: 'approved',
                count: 4,
                createdAt: '2026-03-15T10:00:00.000Z',
            }),
            createEvent({
                id: 'review-ignored',
                type: 'review_entries',
                reviewedStatus: 'ignored',
                count: 1,
                createdAt: '2026-03-15T12:00:00.000Z',
            }),
            createEvent({
                id: 'old-seed',
                type: 'seed_queries',
                count: 9,
                createdAt: '2026-03-01T10:00:00.000Z',
            }),
        ]
    );

    assert.equal(metrics.healthScore, 76);
    assert.equal(metrics.criticalAlerts, 2);
    assert.equal(metrics.backlogPressure, 8);
    assert.equal(metrics.actionLoad, 10);
    assert.equal(metrics.activeDays, 3);
    assert.equal(metrics.recentGenerated, 3);
    assert.equal(metrics.recentReviewed, 5);
    assert.equal(metrics.recentApproved, 4);
    assert.equal(metrics.recentIgnored, 1);
    assert.equal(metrics.trend.length, 7);
    assert.equal(metrics.trend[0]?.day, '2026-03-09');
    assert.equal(metrics.trend[6]?.day, '2026-03-15');
    assert.equal(metrics.trend[4]?.seeded, 2);
    assert.equal(metrics.trend[5]?.generated, 3);
    assert.equal(metrics.trend[6]?.reviewed, 5);
  });

test('terminal metrics handles empty activity without errors', () => {
    const metrics = buildSearchLearningTerminalMetrics(
        createWorkflow(),
        createHealth({ score: 95, label: 'healthy' }),
        createAlerts({ critical: 0, warning: 0, success: 1, total: 1 }),
        []
    );

    assert.equal(metrics.healthScore, 95);
    assert.equal(metrics.backlogPressure, 0);
    assert.equal(metrics.actionLoad, 0);
    assert.equal(metrics.activeDays, 0);
    assert.equal(metrics.recentGenerated, 0);
    assert.equal(metrics.recentReviewed, 0);
    assert.equal(metrics.recentApproved, 0);
    assert.equal(metrics.recentIgnored, 0);
    assert.equal(metrics.trend.length, 7);
});
