import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalPriorities } from '../lib/searchLearning/searchLearningTerminalPriorities.ts';
import type { SearchLearningTerminalAlertSummary } from '../lib/searchLearning/searchLearningTerminalAlerts.ts';
import type { SearchLearningTerminalCoverage } from '../lib/searchLearning/searchLearningTerminalCoverage.ts';
import type { SearchLearningTerminalHealth } from '../lib/searchLearning/searchLearningTerminalHealth.ts';
import type { SearchLearningTerminalWatchlist } from '../lib/searchLearning/searchLearningTerminalWatchlist.ts';
import type {
    SearchLearningTerminalWorkflowAction,
    SearchLearningTerminalWorkflowSummary,
} from '../lib/searchLearning/searchLearningTerminalWorkflow.ts';

function createAction(
    overrides: Partial<SearchLearningTerminalWorkflowAction>
): SearchLearningTerminalWorkflowAction {
    return {
        id: overrides.id || 'action-1',
        kind: overrides.kind || 'review_now',
        title: overrides.title || 'Review Pending',
        description: overrides.description || '즉시 review가 필요한 query입니다.',
        count: overrides.count ?? 3,
        entryIds: overrides.entryIds || ['entry-1', 'entry-2'],
        tone: overrides.tone || 'emerald',
        actionLabel: overrides.actionLabel || 'review pending 선택',
    };
}

function createWorkflow(
    overrides: Partial<SearchLearningTerminalWorkflowSummary> = {}
): SearchLearningTerminalWorkflowSummary {
    return {
        state: 'action_required',
        pending: 0,
        drafts: 0,
        reviewNow: 3,
        generateNow: 2,
        retrainNow: 1,
        sampleCollection: 0,
        observe: 0,
        improved: 1,
        noImprovement: 1,
        awaitingSamples: 0,
        topActions: [
            createAction({ id: 'review', kind: 'review_now', count: 3 }),
            createAction({ id: 'generate', kind: 'generate_now', count: 2, tone: 'sky', actionLabel: 'generate needed AI 제안' }),
            createAction({ id: 'retrain', kind: 'retrain_now', count: 1, tone: 'rose', actionLabel: 'retrain AI 제안' }),
        ],
        ...overrides,
    };
}

function createHealth(overrides: Partial<SearchLearningTerminalHealth> = {}): SearchLearningTerminalHealth {
    return {
        score: 42,
        label: 'critical',
        summary: 'critical',
        blockers: ['즉시 review 3건', 'coverage gap'],
        nextCheck: 'run terminal workflow',
        ...overrides,
    };
}

function createAlerts(
    overrides: Partial<SearchLearningTerminalAlertSummary> = {}
): SearchLearningTerminalAlertSummary {
    return {
        total: 2,
        critical: 1,
        warning: 1,
        info: 0,
        success: 0,
        topAlerts: [
            {
                id: 'review_now',
                severity: 'critical',
                title: 'Immediate Review Backlog',
                description: '즉시 승인 가능한 query가 남아 있습니다.',
                count: 3,
                action: createAction({ id: 'review-alert', kind: 'review_now', count: 3 }),
            },
            {
                id: 'retrain_now',
                severity: 'warning',
                title: 'Retrain Candidates',
                description: '재학습이 필요한 query가 남아 있습니다.',
                count: 1,
                action: createAction({ id: 'retrain-alert', kind: 'retrain_now', count: 1, tone: 'rose' }),
            },
        ],
        ...overrides,
    };
}

function createCoverage(
    overrides: Partial<SearchLearningTerminalCoverage> = {}
): SearchLearningTerminalCoverage {
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

function createWatchlist(
    overrides: Partial<SearchLearningTerminalWatchlist> = {}
): SearchLearningTerminalWatchlist {
    return {
        total: 1,
        critical: 1,
        high: 0,
        medium: 0,
        low: 0,
        items: [
            {
                id: 'watch-review',
                source: 'impact',
                priority: 'critical',
                title: '후드 query retrain',
                description: 'impact가 계속 낮습니다.',
                queries: ['남자 후드'],
                entryIds: ['entry-3'],
                count: 1,
                metricLabel: 'improvement -0.2',
                action: createAction({ id: 'watch-retrain', kind: 'retrain_now', count: 1, tone: 'rose' }),
            },
        ],
        ...overrides,
    };
}

test('terminal priorities elevates coverage and critical review work first', () => {
    const summary = buildSearchLearningTerminalPriorities(
        createWorkflow(),
        createHealth(),
        createAlerts(),
        createCoverage(),
        createWatchlist()
    );

    assert.equal(summary.status, 'critical');
    assert.match(summary.headline, /blocker/);
    assert.ok(summary.critical >= 1);
    assert.equal(summary.priorities[0]?.source, 'coverage');
    assert.equal(summary.priorities[0]?.severity, 'critical');
    assert.equal(summary.priorities[0]?.lane, 'coverage');
    assert.ok(summary.priorities.some((item) => item.lane === 'review'));
});

test('terminal priorities falls back to stable observe lane when no urgent work remains', () => {
    const observeAction = createAction({
        id: 'observe',
        kind: 'observe',
        title: 'Observe Winners',
        description: '개선 query를 계속 지켜봅니다.',
        count: 2,
        tone: 'slate',
        actionLabel: '개선 query 선택',
    });

    const summary = buildSearchLearningTerminalPriorities(
        createWorkflow({
            state: 'stable',
            reviewNow: 0,
            generateNow: 0,
            retrainNow: 0,
            sampleCollection: 0,
            observe: 2,
            topActions: [observeAction],
        }),
        createHealth({ score: 96, label: 'healthy', blockers: [] }),
        createAlerts({ total: 1, critical: 0, warning: 0, info: 0, success: 1, topAlerts: [] }),
        createCoverage({
            qualityLabel: 'strong',
            coverageScore: 88,
            uncoveredQueries: 0,
            uncoveredClusters: 0,
            needsAttentionClusters: 0,
        }),
        createWatchlist({ total: 0, critical: 0, items: [] })
    );

    assert.equal(summary.status, 'stable');
    assert.match(summary.headline, /긴급 우선순위가 없습니다/);
    assert.equal(summary.priorities.length, 1);
    assert.equal(summary.priorities[0]?.lane, 'observe');
    assert.equal(summary.priorities[0]?.severity, 'low');
});
