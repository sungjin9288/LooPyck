import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalAlerts } from '../lib/search/searchLearningTerminalAlerts.ts';
import type { SearchLearningTerminalWorkflowSummary } from '../lib/search/searchLearningTerminalWorkflow.ts';

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

test('terminal alerts elevate review backlog as critical', () => {
    const summary = buildSearchLearningTerminalAlerts(
        createWorkflow({
            state: 'action_required',
            reviewNow: 6,
            topActions: [
                {
                    id: 'terminal_review_now',
                    kind: 'review_now',
                    title: 'Review Pending',
                    description: '즉시 승인 가능한 query를 먼저 처리합니다.',
                    count: 6,
                    entryIds: ['a', 'b'],
                    tone: 'emerald',
                    actionLabel: 'review pending 선택',
                },
            ],
        })
    );

    assert.equal(summary.critical, 1);
    assert.equal(summary.topAlerts[0]?.id, 'review_now');
    assert.equal(summary.topAlerts[0]?.severity, 'critical');
});

test('terminal alerts expose sample collection as warning', () => {
    const summary = buildSearchLearningTerminalAlerts(
        createWorkflow({
            state: 'sampling',
            sampleCollection: 4,
            topActions: [
                {
                    id: 'terminal_sample_collection',
                    kind: 'sample_collection',
                    title: 'Sample Collection',
                    description: '표본 부족 query를 다시 관찰 대상으로 올립니다.',
                    count: 4,
                    entryIds: ['x'],
                    tone: 'amber',
                    actionLabel: '표본 수집 선택',
                },
            ],
        })
    );

    assert.equal(summary.warning, 1);
    assert.equal(summary.topAlerts[0]?.id, 'sample_collection');
});

test('terminal alerts emit stable success when no action remains', () => {
    const summary = buildSearchLearningTerminalAlerts(createWorkflow({ improved: 3 }));

    assert.equal(summary.success, 1);
    assert.equal(summary.topAlerts[0]?.id, 'stable');
    assert.equal(summary.topAlerts[0]?.action, null);
});
