import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalHealth } from '../lib/searchLearning/searchLearningTerminalHealth.ts';
import type { SearchLearningTerminalAlertSummary } from '../lib/searchLearning/searchLearningTerminalAlerts.ts';
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

function createAlerts(overrides: Partial<SearchLearningTerminalAlertSummary> = {}): SearchLearningTerminalAlertSummary {
    return {
        total: 0,
        critical: 0,
        warning: 0,
        info: 0,
        success: 1,
        topAlerts: [],
        ...overrides,
    };
}

test('terminal health becomes critical when review backlog is high', () => {
    const health = buildSearchLearningTerminalHealth(
        createWorkflow({ reviewNow: 8, drafts: 3, retrainNow: 4 }),
        createAlerts({ total: 3, critical: 2, warning: 1, success: 0 })
    );

    assert.equal(health.label, 'critical');
    assert.ok(health.score < 45);
    assert.ok(health.blockers.some((entry) => entry.includes('즉시 review')));
});

test('terminal health becomes monitoring when urgent blockers are gone but observe remains', () => {
    const health = buildSearchLearningTerminalHealth(
        createWorkflow({ observe: 6, improved: 5, awaitingSamples: 2 }),
        createAlerts({ total: 1, info: 1, success: 0 })
    );

    assert.equal(health.label, 'monitoring');
    assert.ok(health.score >= 70);
    assert.match(health.nextCheck, /impact/);
});

test('terminal health becomes healthy in stable state', () => {
    const health = buildSearchLearningTerminalHealth(
        createWorkflow({ improved: 7 }),
        createAlerts({ total: 1, success: 1 })
    );

    assert.equal(health.label, 'healthy');
    assert.ok(health.score >= 90);
    assert.equal(health.blockers.length, 0);
});
