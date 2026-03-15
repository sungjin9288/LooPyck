import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalHandoff } from '../lib/search/searchLearningTerminalHandoff.ts';
import type { SearchLearningTerminalOverview } from '../lib/search/searchLearningTerminalOverview.ts';
import type { SearchLearningTerminalPrioritySummary } from '../lib/search/searchLearningTerminalPriorities.ts';
import type { SearchLearningTerminalRunbook } from '../lib/search/searchLearningTerminalRunbook.ts';

function createOverview(overrides: Partial<SearchLearningTerminalOverview> = {}): SearchLearningTerminalOverview {
    return {
        status: 'critical',
        headline: 'critical headline',
        summary: 'overview summary',
        nextStep: 'generate needed AI 제안으로 6개 query를 먼저 처리하세요.',
        primaryLane: 'coverage',
        healthScore: 42,
        coverageScore: 41,
        actionLoad: 9,
        watchCount: 3,
        spotlights: [],
        ...overrides,
    };
}

function createPriorities(
    overrides: Partial<SearchLearningTerminalPrioritySummary> = {}
): SearchLearningTerminalPrioritySummary {
    return {
        status: 'critical',
        headline: 'priority headline',
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
            {
                id: 'retrain',
                source: 'watchlist',
                severity: 'high',
                title: 'Retrain Cluster',
                summary: '재학습 후보를 바로 처리합니다.',
                count: 2,
                lane: 'retrain',
                action: {
                    id: 'retrain',
                    kind: 'retrain_now',
                    title: 'Retrain Needed',
                    description: '재학습',
                    count: 2,
                    entryIds: ['c'],
                    tone: 'rose',
                    actionLabel: 'retrain AI 제안',
                },
            },
        ],
        ...overrides,
    };
}

function createRunbook(overrides: Partial<SearchLearningTerminalRunbook> = {}): SearchLearningTerminalRunbook {
    return {
        state: 'action_required',
        stateLabel: 'Action Required',
        headline: 'runbook headline',
        summary: 'runbook summary',
        primaryAction: {
            id: 'review',
            kind: 'review_now',
            title: 'Review Pending',
            description: 'review pending',
            count: 4,
            entryIds: ['x'],
            tone: 'emerald',
            actionLabel: 'review pending 선택',
        },
        steps: [
            { id: 'step1', title: 'Review Pending', description: 'step1', tone: 'emerald' },
            { id: 'step2', title: 'Draft Review', description: 'step2', tone: 'sky' },
            { id: 'step3', title: 'Impact Check', description: 'step3', tone: 'slate' },
        ],
        followUp: 'impact를 다시 확인합니다.',
        ...overrides,
    };
}

test('terminal handoff prioritizes now/next/follow-up from priorities and runbook', () => {
    const handoff = buildSearchLearningTerminalHandoff(
        createOverview(),
        createPriorities(),
        createRunbook()
    );

    assert.equal(handoff.status, 'critical');
    assert.match(handoff.headline, /지금 바로 실행할 일/);
    assert.equal(handoff.current.label, 'now');
    assert.equal(handoff.current.action?.kind, 'generate_now');
    assert.equal(handoff.next.action?.kind, 'retrain_now');
    assert.equal(handoff.followUp.title, 'Impact Check');
});

test('terminal handoff falls back to runbook and stable follow-up when priorities are empty', () => {
    const handoff = buildSearchLearningTerminalHandoff(
        createOverview({ status: 'stable', nextStep: '새 low-fit/0건 query가 생길 때만 terminal workflow를 다시 시작하면 됩니다.' }),
        createPriorities({ status: 'stable', critical: 0, high: 0, medium: 0, low: 0, priorities: [] }),
        createRunbook({
            state: 'stable',
            primaryAction: null,
            steps: [
                { id: 'step1', title: 'Stable State', description: 'stable state', tone: 'slate' },
                { id: 'step2', title: 'Keep Terminal Loop Short', description: 'keep short', tone: 'slate' },
                { id: 'step3', title: 'Follow-up', description: 'follow-up', tone: 'slate' },
            ],
            followUp: '새 low-fit query를 기다립니다.',
        })
    );

    assert.equal(handoff.status, 'stable');
    assert.equal(handoff.current.action, null);
    assert.equal(handoff.current.title, 'Terminal Current Action');
    assert.equal(handoff.next.title, 'Keep Terminal Loop Short');
    assert.match(handoff.followUp.summary, /새 low-fit query/);
});
