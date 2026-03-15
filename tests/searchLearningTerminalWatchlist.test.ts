import assert from 'node:assert/strict';
import test from 'node:test';
import { buildSearchLearningTerminalWatchlist } from '../lib/search/searchLearningTerminalWatchlist.ts';
import type { SearchLearningImpactSummary } from '../lib/search/searchLearningImpact.ts';
import type { SearchLearningOpsCenterSummary } from '../lib/search/searchLearningOpsCenter.ts';
import type { SearchLearningTerminalWorkflowSummary } from '../lib/search/searchLearningTerminalWorkflow.ts';

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
        sampleCollection: 1,
        observe: 2,
        improved: 3,
        noImprovement: 1,
        awaitingSamples: 1,
        topActions: [
            {
                id: 'terminal_review_now',
                kind: 'review_now',
                title: 'Review Pending',
                description: '즉시 승인 가능한 query를 먼저 처리합니다.',
                count: 3,
                entryIds: ['entry-review-1', 'entry-review-2', 'entry-review-3'],
                tone: 'emerald',
                actionLabel: 'review pending 선택',
            },
            {
                id: 'terminal_retrain_now',
                kind: 'retrain_now',
                title: 'Retrain Needed',
                description: '재학습이 필요한 query입니다.',
                count: 1,
                entryIds: ['entry-retrain-1'],
                tone: 'rose',
                actionLabel: 'retrain AI 제안',
            },
        ],
        ...overrides,
    };
}

function createOpsCenter(
    overrides: Partial<SearchLearningOpsCenterSummary> = {}
): SearchLearningOpsCenterSummary {
    return {
        urgentNow: 2,
        reviewPending: 3,
        generateNeeded: 2,
        sampleCollection: 1,
        retrainNeeded: 1,
        validated: 2,
        reviewPendingEntryIds: ['entry-review-1', 'entry-review-2'],
        generateNeededEntryIds: ['entry-generate-1', 'entry-generate-2'],
        sampleCollectionEntryIds: ['entry-sample-1'],
        retrainNeededEntryIds: ['entry-retrain-1'],
        validatedEntryIds: ['entry-valid-1', 'entry-valid-2'],
        topUrgentNow: [
            {
                id: 'ops-review',
                source: 'ops_queue',
                title: 'Review Pending',
                description: '즉시 review가 필요한 query입니다.',
                context: 'context:review',
                entryIds: ['entry-review-1', 'entry-review-2'],
                queries: ['남자 후드', '운동용 후드'],
                lastSeenAt: '2026-03-15T10:00:00.000Z',
                priority: 'critical',
                action: 'approve_now',
                actionLabel: '즉시 승인',
                metricLabel: 'score 92',
            },
            {
                id: 'ops-generate',
                source: 'ops_queue',
                title: 'Generate Needed',
                description: 'AI 생성이 필요한 query입니다.',
                context: 'context:generate',
                entryIds: ['entry-generate-1'],
                queries: ['러닝 자켓'],
                lastSeenAt: '2026-03-15T09:00:00.000Z',
                priority: 'high',
                action: 'generate_now',
                actionLabel: '즉시 AI 제안',
                metricLabel: 'score 80',
            },
        ],
        topRetrainNeeded: [
            {
                id: 'followup-retrain',
                source: 'followup',
                title: 'Retrain Needed',
                description: '개선이 없는 query입니다.',
                context: 'followup:retrain',
                entryIds: ['entry-retrain-1'],
                queries: ['트레이닝 팬츠'],
                lastSeenAt: '2026-03-15T08:00:00.000Z',
                priority: 'high',
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                metricLabel: 'no-improvement 3',
            },
        ],
        topValidated: [
            {
                id: 'followup-valid',
                source: 'followup',
                title: 'Validated',
                description: '개선이 확인된 query입니다.',
                context: 'followup:validated',
                entryIds: ['entry-valid-1'],
                queries: ['와이드 팬츠'],
                lastSeenAt: '2026-03-15T07:00:00.000Z',
                priority: 'low',
                action: 'select_queries',
                actionLabel: '개선 query 선택',
                metricLabel: 'improved 2',
            },
        ],
        ...overrides,
    };
}

function createImpactSummary(
    overrides: Partial<SearchLearningImpactSummary> = {}
): SearchLearningImpactSummary {
    return {
        approvedTracked: 3,
        measured: 2,
        awaitingSamples: 1,
        improved: 1,
        unchanged: 0,
        regressed: 1,
        noImprovement: 1,
        improvedRate: 0.5,
        topImproved: [],
        topNeedsAttention: [
            {
                entryId: 'entry-impact-retrain',
                query: '등산 바지',
                approvedAt: '2026-03-15T06:00:00.000Z',
                postApprovalSamples: 4,
                beforeSampleCount: 6,
                beforeLowFitCount: 4,
                beforeZeroCount: 2,
                afterLowFitCount: 3,
                afterZeroCount: 2,
                beforeLowFitRate: 0.66,
                afterLowFitRate: 0.75,
                beforeZeroRate: 0.33,
                afterZeroRate: 0.5,
                improvementScore: -0.26,
                outcome: 'regressed',
            },
        ],
        topAwaitingSamples: [
            {
                entryId: 'entry-impact-sample',
                query: '러닝 슈즈',
                approvedAt: '2026-03-15T05:00:00.000Z',
                postApprovalSamples: 0,
                beforeSampleCount: 5,
                beforeLowFitCount: 2,
                beforeZeroCount: 1,
                afterLowFitCount: 0,
                afterZeroCount: 0,
                beforeLowFitRate: 0.4,
                afterLowFitRate: null,
                beforeZeroRate: 0.2,
                afterZeroRate: null,
                improvementScore: 0,
                outcome: 'awaiting_samples',
            },
        ],
        ...overrides,
    };
}

test('terminal watchlist prioritizes urgent and retrain items', () => {
    const watchlist = buildSearchLearningTerminalWatchlist(
        createWorkflow(),
        createOpsCenter(),
        createImpactSummary()
    );

    assert.equal(watchlist.total > 0, true);
    assert.equal(watchlist.items[0]?.priority, 'critical');
    assert.equal(watchlist.items[0]?.action.kind, 'review_now');
    assert.ok(watchlist.items.some((item) => item.action.kind === 'retrain_now'));
    assert.ok(watchlist.items.some((item) => item.action.kind === 'sample_collection'));
  });

test('terminal watchlist deduplicates repeated entry ids across sources', () => {
    const watchlist = buildSearchLearningTerminalWatchlist(
        createWorkflow({
            topActions: [
                {
                    id: 'terminal_review_now',
                    kind: 'review_now',
                    title: 'Review Pending',
                    description: '즉시 승인 가능한 query를 먼저 처리합니다.',
                    count: 2,
                    entryIds: ['entry-review-1', 'entry-review-2'],
                    tone: 'emerald',
                    actionLabel: 'review pending 선택',
                },
            ],
        }),
        createOpsCenter(),
        createImpactSummary()
    );

    const flattenedIds = watchlist.items.flatMap((item) => item.entryIds);
    assert.equal(new Set(flattenedIds).size, flattenedIds.length);
});

test('terminal watchlist returns empty state when there are no actionable entries', () => {
    const watchlist = buildSearchLearningTerminalWatchlist(
        createWorkflow({ topActions: [], reviewNow: 0, drafts: 0, retrainNow: 0, sampleCollection: 0 }),
        createOpsCenter({
            topUrgentNow: [],
            topRetrainNeeded: [],
            topValidated: [],
        }),
        createImpactSummary({
            topNeedsAttention: [],
            topAwaitingSamples: [],
        })
    );

    assert.equal(watchlist.total, 0);
    assert.equal(watchlist.items.length, 0);
});
