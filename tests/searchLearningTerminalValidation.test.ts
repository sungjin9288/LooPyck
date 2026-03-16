import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalValidation } from '../lib/search/searchLearningTerminalValidation.ts';
import type { SearchLearningTerminalCoverage } from '../lib/search/searchLearningTerminalCoverage.ts';
import type { SearchLearningTerminalHandoff } from '../lib/search/searchLearningTerminalHandoff.ts';
import type { SearchLearningTerminalOverview } from '../lib/search/searchLearningTerminalOverview.ts';
import type { SearchLearningTerminalWorkflowSummary } from '../lib/search/searchLearningTerminalWorkflow.ts';

function createOverview(
    overrides: Partial<SearchLearningTerminalOverview> = {}
): SearchLearningTerminalOverview {
    return {
        status: 'action',
        headline: 'action',
        summary: 'summary',
        nextStep: 'next',
        primaryLane: 'review',
        healthScore: 64,
        coverageScore: 58,
        actionLoad: 7,
        watchCount: 3,
        spotlights: [],
        ...overrides,
    };
}

function createHandoff(
    overrides: Partial<SearchLearningTerminalHandoff> = {}
): SearchLearningTerminalHandoff {
    return {
        status: 'action',
        headline: 'handoff',
        current: {
            id: 'current',
            label: 'now',
            title: 'Review Pending',
            summary: 'review pending first',
            tone: 'amber',
            action: {
                id: 'review',
                kind: 'review_now',
                title: 'Review Pending',
                description: 'approve now',
                count: 3,
                entryIds: ['entry-1', 'entry-2'],
                tone: 'emerald',
                actionLabel: 'review pending 선택',
            },
        },
        next: {
            id: 'next',
            label: 'next',
            title: 'Generate Needed',
            summary: 'generate follow-up',
            tone: 'sky',
            action: {
                id: 'generate',
                kind: 'generate_now',
                title: 'Generate Needed',
                description: 'generate now',
                count: 2,
                entryIds: ['entry-3'],
                tone: 'sky',
                actionLabel: 'generate needed AI 제안',
            },
        },
        followUp: {
            id: 'follow',
            label: 'follow-up',
            title: 'Observe',
            summary: 'observe',
            tone: 'slate',
            action: null,
        },
        ...overrides,
    };
}

function createWorkflow(
    overrides: Partial<SearchLearningTerminalWorkflowSummary> = {}
): SearchLearningTerminalWorkflowSummary {
    return {
        state: 'action_required',
        pending: 4,
        drafts: 2,
        reviewNow: 3,
        generateNow: 2,
        retrainNow: 1,
        sampleCollection: 0,
        observe: 1,
        improved: 1,
        noImprovement: 3,
        awaitingSamples: 1,
        topActions: [createHandoff().current.action!],
        ...overrides,
    };
}

function createCoverage(
    overrides: Partial<SearchLearningTerminalCoverage> = {}
): SearchLearningTerminalCoverage {
    return {
        qualityLabel: 'weak',
        coverageScore: 42,
        uncoveredQueries: 6,
        uncoveredClusters: 2,
        improvedClusters: 1,
        needsAttentionClusters: 3,
        awaitingClusters: 1,
        focusAreas: [],
        ...overrides,
    };
}

test('terminal validation flags attention when workflow and coverage need action', () => {
    const validation = buildSearchLearningTerminalValidation(
        createOverview(),
        createHandoff(),
        createWorkflow(),
        createCoverage(),
        {
            trackedSearches: 5,
            observedSources: 2,
            productOpens: 3,
        }
    );

    assert.equal(validation.status, 'attention');
    assert.equal(validation.checks.total, 5);
    assert.equal(validation.checks.attention, 3);
    assert.match(validation.headline, /운영 액션/);
    assert.match(validation.nextStep, /Coverage Validation|Workflow Loop|Impact Tracking/);
});

test('terminal validation settles into ready when signals and impact are healthy', () => {
    const validation = buildSearchLearningTerminalValidation(
        createOverview({ status: 'stable', primaryLane: 'stable' }),
        createHandoff({
            status: 'stable',
            current: {
                id: 'current',
                label: 'now',
                title: 'Observe',
                summary: 'observe only',
                tone: 'emerald',
                action: null,
            },
            next: {
                id: 'next',
                label: 'next',
                title: 'Follow-up',
                summary: 'follow-up',
                tone: 'slate',
                action: null,
            },
        }),
        createWorkflow({
            state: 'monitoring',
            pending: 0,
            drafts: 0,
            reviewNow: 0,
            generateNow: 0,
            retrainNow: 0,
            sampleCollection: 0,
            observe: 4,
            improved: 5,
            noImprovement: 1,
            awaitingSamples: 0,
            topActions: [],
        }),
        createCoverage({
            qualityLabel: 'strong',
            coverageScore: 91,
            uncoveredQueries: 0,
            uncoveredClusters: 0,
        }),
        {
            trackedSearches: 12,
            observedSources: 4,
            productOpens: 8,
        }
    );

    assert.equal(validation.status, 'ready');
    assert.equal(validation.checks.ready, 5);
    assert.match(validation.nextStep, /대표 검색어를 다시 검색|terminal overview/i);
    assert.equal(validation.items.find((item) => item.id === 'search_signals')?.status, 'ready');
});

test('terminal validation stays pending when no production search signals exist yet', () => {
    const validation = buildSearchLearningTerminalValidation(
        createOverview({ status: 'monitoring' }),
        createHandoff({
            status: 'monitoring',
            current: {
                id: 'current',
                label: 'now',
                title: 'Observe',
                summary: 'observe only',
                tone: 'sky',
                action: null,
            },
        }),
        createWorkflow({
            state: 'monitoring',
            pending: 0,
            drafts: 0,
            reviewNow: 0,
            generateNow: 0,
            retrainNow: 0,
            sampleCollection: 0,
            observe: 2,
            improved: 0,
            noImprovement: 0,
            awaitingSamples: 0,
            topActions: [],
        }),
        createCoverage({
            qualityLabel: 'mixed',
            coverageScore: 67,
            uncoveredQueries: 2,
            uncoveredClusters: 1,
        }),
        {
            trackedSearches: 0,
            observedSources: 0,
            productOpens: 0,
        }
    );

    assert.equal(validation.status, 'pending');
    assert.equal(validation.items.find((item) => item.id === 'search_signals')?.status, 'pending');
    assert.equal(validation.items.find((item) => item.id === 'impact')?.status, 'pending');
});
