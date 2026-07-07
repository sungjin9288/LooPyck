import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalChecklist } from '../lib/searchLearning/searchLearningTerminalChecklist.ts';
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
        score: 100,
        label: 'healthy',
        summary: 'stable',
        blockers: [],
        nextCheck: 'none',
        ...overrides,
    };
}

test('terminal checklist marks backlog-heavy items as active', () => {
    const checklist = buildSearchLearningTerminalChecklist(
        createWorkflow({ reviewNow: 5, drafts: 4, generateNow: 1 }),
        createHealth({ label: 'warning', score: 60 })
    );

    const review = checklist.items.find((item) => item.id === 'review_now');
    const drafts = checklist.items.find((item) => item.id === 'draft_review');
    const generate = checklist.items.find((item) => item.id === 'generate_now');

    assert.equal(review?.status, 'active');
    assert.equal(drafts?.status, 'active');
    assert.equal(generate?.status, 'open');
    assert.ok(checklist.active >= 2);
});

test('terminal checklist marks completed items as done in healthy state', () => {
    const checklist = buildSearchLearningTerminalChecklist(
        createWorkflow({ improved: 6 }),
        createHealth({ label: 'healthy', score: 94 })
    );

    assert.equal(checklist.open, 0);
    assert.equal(checklist.active, 0);
    assert.equal(checklist.completed, checklist.items.length);
});

test('terminal checklist keeps observe active when monitoring remains', () => {
    const checklist = buildSearchLearningTerminalChecklist(
        createWorkflow({ observe: 3 }),
        createHealth({ label: 'monitoring', score: 78 })
    );

    const observe = checklist.items.find((item) => item.id === 'observe');
    assert.equal(observe?.status, 'active');
  });
