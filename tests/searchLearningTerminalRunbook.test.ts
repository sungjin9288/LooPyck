import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalRunbook } from '../lib/searchLearning/searchLearningTerminalRunbook.ts';
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

test('terminal runbook prioritizes immediate action when workflow requires it', () => {
    const workflow = createWorkflow({
        state: 'action_required',
        drafts: 2,
        reviewNow: 4,
        generateNow: 3,
        topActions: [
            {
                id: 'terminal_review_now',
                kind: 'review_now',
                title: 'Review Pending',
                description: '즉시 승인 가능한 query를 먼저 처리합니다.',
                count: 4,
                entryIds: ['a', 'b', 'c', 'd'],
                tone: 'emerald',
                actionLabel: 'review pending 선택',
            },
        ],
    });

    const runbook = buildSearchLearningTerminalRunbook(workflow);

    assert.equal(runbook.stateLabel, 'Action Required');
    assert.equal(runbook.primaryAction?.kind, 'review_now');
    assert.match(runbook.headline, /Review Pending/);
    assert.equal(runbook.steps[0]?.title, 'Review Pending');
    assert.equal(runbook.steps[1]?.title, 'Draft Review');
    assert.match(runbook.followUp, /Impact/);
});

test('terminal runbook switches to sampling guidance when only samples remain', () => {
    const workflow = createWorkflow({
        state: 'sampling',
        sampleCollection: 5,
        awaitingSamples: 5,
        topActions: [
            {
                id: 'terminal_sample_collection',
                kind: 'sample_collection',
                title: 'Sample Collection',
                description: '표본 부족 query를 다시 관찰 대상으로 올립니다.',
                count: 5,
                entryIds: ['x', 'y'],
                tone: 'amber',
                actionLabel: '표본 수집 선택',
            },
        ],
    });

    const runbook = buildSearchLearningTerminalRunbook(workflow);

    assert.equal(runbook.stateLabel, 'Sampling');
    assert.equal(runbook.primaryAction?.kind, 'sample_collection');
    assert.match(runbook.summary, /sample collection 5건/);
    assert.equal(runbook.steps[1]?.title, 'Sample Collection');
});

test('terminal runbook produces stable guidance without primary actions', () => {
    const runbook = buildSearchLearningTerminalRunbook(createWorkflow());

    assert.equal(runbook.stateLabel, 'Stable');
    assert.equal(runbook.primaryAction, null);
    assert.match(runbook.headline, /긴급한 search-learning triage 항목이 없습니다/);
    assert.equal(runbook.steps.length, 3);
});
