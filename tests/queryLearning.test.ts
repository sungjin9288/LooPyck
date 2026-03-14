import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildFallbackSearchLearningSuggestion,
    generateSearchLearningSuggestions,
    loadSearchLearningActivity,
    loadApprovedSearchLearningRewritePlan,
    mergeLearnedQueriesIntoPlan,
    recordSearchLearningCandidate,
    reviewSearchLearningEntries,
    resetSearchLearningEntries,
    seedSearchLearningEntries,
    loadSearchLearningQueue,
} from '../lib/search/queryLearning.ts';
import { analyzeFashionQuery } from '../lib/search/fashionQueryAssistant.ts';
import {
    buildSearchLearningRewritePacks,
    buildSearchLearningRewritePlanForAnalysis,
} from '../lib/search/searchLearningRewritePacks.ts';
import {
    buildSearchLearningImpactClusterRollup,
    buildSearchLearningImpactClusterSummaries,
    buildSearchLearningImpactSummary,
} from '../lib/search/searchLearningImpact.ts';
import {
    buildSearchLearningRewriteRecommendationSummary,
    buildSearchLearningRewriteRecommendations,
} from '../lib/search/searchLearningRewriteRecommendations.ts';
import {
    buildSearchLearningRewriteSourceDraftSummary,
    buildSearchLearningRewriteSourceDrafts,
} from '../lib/search/searchLearningRewriteSourceDrafts.ts';
import {
    buildSearchLearningRewriteSourceOps,
    buildSearchLearningRewriteSourceOpsSummary,
} from '../lib/search/searchLearningRewriteSourceOps.ts';
import {
    buildSearchLearningRewriteSourceActionDrafts,
    buildSearchLearningRewriteSourceActionDraftSummary,
} from '../lib/search/searchLearningRewriteSourceActionDrafts.ts';
import {
    buildSearchLearningRewriteSourceActionReviewQueue,
    buildSearchLearningRewriteSourceActionReviewSummary,
} from '../lib/search/searchLearningRewriteSourceActionReview.ts';
import {
    buildSearchLearningRewriteSourceApprovalQueue,
    buildSearchLearningRewriteSourceApprovalQueueSummary,
    type SearchLearningRewriteSourceApprovalQueueItem,
} from '../lib/search/searchLearningRewriteSourceApprovalQueue.ts';
import {
    buildSearchLearningRewriteSourceApprovalActivity,
    buildSearchLearningRewriteSourceApprovalActivitySummary,
} from '../lib/search/searchLearningRewriteSourceApprovalActivity.ts';
import { buildSearchLearningActivitySummary } from '../lib/search/searchLearningActivitySummary.ts';
import { buildSearchLearningActivityRecommendations } from '../lib/search/searchLearningActivityRecommendations.ts';
import { buildSearchLearningActivityOpsQueue } from '../lib/search/searchLearningActivityOpsQueue.ts';
import { buildSearchLearningActivityFollowups } from '../lib/search/searchLearningActivityFollowups.ts';
import { buildSearchLearningOpsCenter } from '../lib/search/searchLearningOpsCenter.ts';
import { buildSearchLearningOpsPlaybooks } from '../lib/search/searchLearningOpsPlaybooks.ts';
import { buildSearchLearningOpsPlaybookActivity } from '../lib/search/searchLearningOpsPlaybookActivity.ts';
import { buildSearchLearningOpsPlaybookOutcomes } from '../lib/search/searchLearningOpsPlaybookOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendations } from '../lib/search/searchLearningOpsPlaybookRecommendations.ts';
import { buildSearchLearningOpsPlaybookRecommendationQueue } from '../lib/search/searchLearningOpsPlaybookRecommendationQueue.ts';
import { buildSearchLearningOpsPlaybookRecommendationActivity } from '../lib/search/searchLearningOpsPlaybookRecommendationActivity.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomes } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations } from '../lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.ts';
import { buildSearchLearningOpsCompletionSummary } from '../lib/search/searchLearningOpsCompletionSummary.ts';
import { buildSearchLearningOpsCompletionActions } from '../lib/search/searchLearningOpsCompletionActions.ts';
import { buildSearchLearningOpsCompletionActivity } from '../lib/search/searchLearningOpsCompletionActivity.ts';
import { buildSearchLearningOpsCompletionOutcomes } from '../lib/search/searchLearningOpsCompletionOutcomes.ts';
import { buildSearchLearningOpsCompletionRecommendations } from '../lib/search/searchLearningOpsCompletionRecommendations.ts';
import { buildSearchLearningOpsCompletionRecommendationQueue } from '../lib/search/searchLearningOpsCompletionRecommendationQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationActivity } from '../lib/search/searchLearningOpsCompletionRecommendationActivity.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomes } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendations } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueue } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationActivity } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.ts';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes } from '../lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.ts';
import { buildSearchLearningOpsCompletionQueue } from '../lib/search/searchLearningOpsCompletionQueue.ts';

test('fallback search learning suggestion broadens sports hoodie query into fashion keywords', () => {
    const suggestion = buildFallbackSearchLearningSuggestion({
        query: '운동용 후드',
        suggestedQueries: [],
    });

    assert.equal(suggestion.categoryHint, '후드집업');
    assert.ok(suggestion.suggestedQueries.includes('후드집업'));
    assert.ok(suggestion.suggestedQueries.includes('운동용 후드집업'));
});

test('merge learned queries appends approved candidates to existing search plan', () => {
    const merged = mergeLearnedQueriesIntoPlan(
        {
            NAVER: ['운동용 후드', '후드집업'],
            MUSINSA: ['운동용 후드'],
        },
        ['스포츠 후드집업', '트레이닝 후드집업']
    );

    assert.deepEqual(merged.NAVER, ['운동용 후드', '후드집업', '스포츠 후드집업', '트레이닝 후드집업']);
    assert.deepEqual(merged.MUSINSA, ['운동용 후드', '스포츠 후드집업', '트레이닝 후드집업']);
});

test('approved search learning entries build source-aware rewrite packs by semantic cluster', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:00:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업', '트레이닝 후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    const updated = await loadSearchLearningQueue(10);
    const packs = buildSearchLearningRewritePacks(updated.entries);
    const hoodiePack = packs.find((pack) => pack.clusterId === 'hoodie_training');

    assert.ok(hoodiePack);
    assert.equal(hoodiePack?.clusterLabel, '후드/후드집업');
    assert.ok(hoodiePack?.commonQueries.includes('후드집업'));
    assert.ok((hoodiePack?.sourceQueries.NAVER || []).includes('후드집업'));
    assert.ok((hoodiePack?.sourceQueries.FARFETCH || []).includes('zip hoodie'));
});

test('semantic rewrite packs merge into current query analysis automatically', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:05:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업', '트레이닝 후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    const updated = await loadSearchLearningQueue(10);
    const packs = buildSearchLearningRewritePacks(updated.entries);
    const plan = buildSearchLearningRewritePlanForAnalysis(analyzeFashionQuery('남자 후드'), packs);

    assert.ok((plan.NAVER || []).includes('후드집업'));
    assert.ok((plan.MUSINSA || []).includes('후드집업'));
    assert.ok((plan.FARFETCH || []).includes('zip hoodie'));
});

test('approved semantic rewrite plan can be loaded from search learning storage', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:10:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    const learnedPlan = await loadApprovedSearchLearningRewritePlan(analyzeFashionQuery('남자 후드'));

    assert.ok((learnedPlan.NAVER || []).includes('후드집업'));
    assert.ok((learnedPlan.FARFETCH || []).includes('zip hoodie'));
});

test('rewrite pack recommendations classify promote and rollback candidates from cluster impact', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:20:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });
    recordSearchLearningCandidate({
        query: '등산 바지',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:21:00.000Z',
        effectiveQuery: '등산 바지',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 0,
        strongMatchCount: 1,
        suggestedQueries: ['카고 팬츠'],
        totalProducts: 4,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:25:00.000Z',
        effectiveQuery: '운동용 후드집업',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 2,
        strongMatchCount: 4,
        suggestedQueries: ['후드집업'],
        totalProducts: 18,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [],
    });
    recordSearchLearningCandidate({
        query: '등산 바지',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:26:00.000Z',
        effectiveQuery: '등산 팬츠',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 0,
        strongMatchCount: 1,
        suggestedQueries: ['카고 팬츠'],
        totalProducts: 3,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const updated = await loadSearchLearningQueue(10);
    const recommendations = buildSearchLearningRewriteRecommendations(
        buildSearchLearningRewritePacks(updated.entries),
        buildSearchLearningImpactClusterSummaries(updated.entries)
    );
    const summary = buildSearchLearningRewriteRecommendationSummary(recommendations);

    assert.equal(summary.promote, 1);
    assert.equal(summary.rollback, 1);
    assert.equal(summary.topPromote[0]?.clusterId, 'hoodie_training');
    assert.equal(summary.topRollback[0]?.clusterId, 'other');
});

test('source rewrite drafts expand rewrite pack recommendations into source-level actions', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:00:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업', '트레이닝 후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T11:10:00.000Z',
        effectiveQuery: '후드집업',
        queryIntent: 'fashion',
        resultQuality: 'strong',
        exactMatchCount: 2,
        strongMatchCount: 2,
        suggestedQueries: ['후드집업'],
        totalProducts: 12,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [],
    });

    const updated = await loadSearchLearningQueue(10);
    const packs = buildSearchLearningRewritePacks(updated.entries);
    const recommendations = buildSearchLearningRewriteRecommendations(
        packs,
        buildSearchLearningImpactClusterSummaries(updated.entries)
    );
    const drafts = buildSearchLearningRewriteSourceDrafts(recommendations, packs);
    const summary = buildSearchLearningRewriteSourceDraftSummary(drafts);
    const naverDraft = drafts.find((entry) => entry.source === 'NAVER');

    assert.ok(drafts.length > 0);
    assert.equal(summary.tracked, drafts.length);
    assert.ok(drafts.every((entry) => ['promote', 'hold', 'rollback', 'awaiting_samples'].includes(entry.action)));
    assert.ok(naverDraft);
    assert.ok((naverDraft?.queries.length || 0) > 0);
    assert.ok((naverDraft?.queries || []).some((query) => query.includes('후드')));
});

test('source rewrite ops summarize promote and rollback drafts by source', () => {
    const ops = buildSearchLearningRewriteSourceOps([
        {
            id: 'hoodie_training:NAVER',
            clusterId: 'hoodie_training',
            clusterLabel: '후드/후드집업',
            source: 'NAVER',
            action: 'promote',
            reason: 'good',
            entryIds: ['entry-1'],
            queries: ['후드집업', '운동용 후드'],
            queryCount: 2,
            measured: 3,
            improved: 2,
            noImprovement: 0,
            awaitingSamples: 0,
            improvedRate: 2 / 3,
            beforeLowFitRate: 1,
            afterLowFitRate: 0.2,
            beforeZeroRate: 1,
            afterZeroRate: 0,
            topQuery: '운동용 후드',
        },
        {
            id: 'hoodie_training:MUSINSA',
            clusterId: 'hoodie_training',
            clusterLabel: '후드/후드집업',
            source: 'MUSINSA',
            action: 'promote',
            reason: 'good',
            entryIds: ['entry-1'],
            queries: ['후드집업'],
            queryCount: 1,
            measured: 3,
            improved: 2,
            noImprovement: 0,
            awaitingSamples: 0,
            improvedRate: 2 / 3,
            beforeLowFitRate: 1,
            afterLowFitRate: 0.2,
            beforeZeroRate: 1,
            afterZeroRate: 0,
            topQuery: '운동용 후드',
        },
        {
            id: 'other:NAVER',
            clusterId: 'other',
            clusterLabel: '기타 패션 검색어',
            source: 'NAVER',
            action: 'rollback',
            reason: 'bad',
            entryIds: ['entry-2'],
            queries: ['등산 바지'],
            queryCount: 1,
            measured: 2,
            improved: 0,
            noImprovement: 2,
            awaitingSamples: 0,
            improvedRate: 0,
            beforeLowFitRate: 0.5,
            afterLowFitRate: 0.5,
            beforeZeroRate: 0.5,
            afterZeroRate: 0.5,
            topQuery: '등산 바지',
        },
    ]);

    const summary = buildSearchLearningRewriteSourceOpsSummary(ops);
    const naverPromote = ops.find((entry) => entry.id === 'NAVER:promote');
    const naverRollback = ops.find((entry) => entry.id === 'NAVER:rollback');

    assert.equal(summary.trackedSources, 3);
    assert.equal(summary.promoteSources, 2);
    assert.equal(summary.rollbackSources, 1);
    assert.ok(naverPromote);
    assert.equal(naverPromote?.draftCount, 1);
    assert.ok((naverPromote?.topQueries || []).includes('후드집업'));
    assert.ok(naverRollback);
    assert.equal(naverRollback?.noImprovement, 2);
});

test('source action drafts derive direct ops actions from source summaries', () => {
    const ops = buildSearchLearningRewriteSourceOps([
        {
            id: 'NAVER:promote',
            clusterId: 'hoodie_training',
            clusterLabel: '후드/후드집업',
            source: 'NAVER',
            action: 'promote',
            reason: 'good',
            entryIds: ['entry-1'],
            queries: ['후드집업'],
            queryCount: 1,
            measured: 4,
            improved: 3,
            noImprovement: 0,
            awaitingSamples: 0,
            improvedRate: 0.75,
            beforeLowFitRate: 1,
            afterLowFitRate: 0.2,
            beforeZeroRate: 1,
            afterZeroRate: 0,
            topQuery: '운동용 후드',
        },
        {
            id: 'NAVER:rollback',
            clusterId: 'other',
            clusterLabel: '기타 패션 검색어',
            source: 'NAVER',
            action: 'rollback',
            reason: 'bad',
            entryIds: ['entry-2'],
            queries: ['등산 바지'],
            queryCount: 1,
            measured: 2,
            improved: 0,
            noImprovement: 2,
            awaitingSamples: 0,
            improvedRate: 0,
            beforeLowFitRate: 0.5,
            afterLowFitRate: 0.5,
            beforeZeroRate: 0.5,
            afterZeroRate: 0.5,
            topQuery: '등산 바지',
        },
    ]);

    const drafts = buildSearchLearningRewriteSourceActionDrafts(ops);
    const summary = buildSearchLearningRewriteSourceActionDraftSummary(drafts);

    assert.equal(summary.total, 2);
    assert.equal(summary.promoteConfirm, 1);
    assert.equal(summary.rollbackRegenerate, 1);
    assert.equal(drafts.find((entry) => entry.action === 'promote_confirm')?.title, '승격 유지 확인');
    assert.equal(drafts.find((entry) => entry.action === 'rollback_regenerate')?.title, 'AI 재생성 필요');
});

test('source action review queue highlights approved entries with fresh AI suggestions', () => {
    const drafts = buildSearchLearningRewriteSourceActionDrafts([
        {
            id: 'NAVER:rollback',
            source: 'NAVER',
            action: 'rollback',
            draftCount: 1,
            clusterCount: 1,
            entryIds: ['entry-1', 'entry-2'],
            queryCount: 2,
            measured: 2,
            improved: 0,
            noImprovement: 2,
            awaitingSamples: 0,
            avgImprovedRate: 0,
            topClusters: ['후드/후드집업'],
            topQueries: ['운동용 후드', '남자 후드'],
        },
    ]);

    const reviewQueue = buildSearchLearningRewriteSourceActionReviewQueue(drafts, [
        {
            id: 'entry-1',
            query: '운동용 후드',
            normalizedQuery: '운동용 후드',
            effectiveQuery: '운동용 후드',
            queryIntent: 'fashion',
            status: 'approved',
            occurrenceCount: 4,
            lowFitCount: 3,
            zeroResultCount: 2,
            lastResultQuality: 'weak',
            lastTotalProducts: 0,
            suggestedQueries: ['후드집업'],
            approvedQueries: ['후드집업'],
            aiSuggestion: {
                normalizedQuery: '운동용 후드',
                categoryHint: '후드집업',
                suggestedQueries: ['트레이닝 후드집업', '운동용 후드집업'],
                rationale: '운동 modifier를 추가합니다.',
                model: 'heuristic',
                generatedAt: '2026-03-11T10:00:00.000Z',
            },
            approvalBaseline: {
                approvedAt: '2026-03-11T09:00:00.000Z',
                occurrenceCount: 3,
                lowFitCount: 3,
                zeroResultCount: 2,
            },
            lastSeenAt: '2026-03-11T10:00:00.000Z',
            reviewedAt: '2026-03-11T09:00:00.000Z',
            reviewedBy: 'admin-user',
            createdAt: '2026-03-11T08:00:00.000Z',
            updatedAt: '2026-03-11T10:00:00.000Z',
        },
        {
            id: 'entry-2',
            query: '남자 후드',
            normalizedQuery: '남자 후드',
            effectiveQuery: '남자 후드',
            queryIntent: 'fashion',
            status: 'approved',
            occurrenceCount: 2,
            lowFitCount: 2,
            zeroResultCount: 1,
            lastResultQuality: 'weak',
            lastTotalProducts: 0,
            suggestedQueries: ['남성 후드집업'],
            approvedQueries: ['남성 후드집업'],
            aiSuggestion: null,
            approvalBaseline: {
                approvedAt: '2026-03-11T09:00:00.000Z',
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 2,
            },
            lastSeenAt: '2026-03-11T10:00:00.000Z',
            reviewedAt: '2026-03-11T09:00:00.000Z',
            reviewedBy: 'admin-user',
            createdAt: '2026-03-11T08:00:00.000Z',
            updatedAt: '2026-03-11T10:00:00.000Z',
        },
    ]);
    const summary = buildSearchLearningRewriteSourceActionReviewSummary(reviewQueue);

    assert.equal(summary.readyReview, 1);
    assert.equal(summary.generationNeeded, 0);
    assert.equal(summary.topReadyReview[0]?.readyReviewCount, 1);
    assert.equal(reviewQueue[0]?.reviewState, 'ready_review');
    assert.deepEqual(reviewQueue[0]?.readyReviewEntryIds, ['entry-1']);
});

test('source approval queue promotes stable actions and flags rollback candidates', () => {
    const drafts = buildSearchLearningRewriteSourceActionDrafts([
        {
            id: 'NAVER:promote',
            source: 'NAVER',
            action: 'promote',
            draftCount: 1,
            clusterCount: 1,
            entryIds: ['entry-1'],
            queryCount: 1,
            measured: 4,
            improved: 3,
            noImprovement: 0,
            awaitingSamples: 0,
            avgImprovedRate: 0.75,
            topClusters: ['후드/후드집업'],
            topQueries: ['운동용 후드'],
        },
        {
            id: 'MUSINSA:rollback',
            source: 'MUSINSA',
            action: 'rollback',
            draftCount: 1,
            clusterCount: 1,
            entryIds: ['entry-2'],
            queryCount: 1,
            measured: 3,
            improved: 0,
            noImprovement: 3,
            awaitingSamples: 0,
            avgImprovedRate: 0,
            topClusters: ['트레이닝/조거 팬츠'],
            topQueries: ['트레이닝 팬츠'],
        },
    ]);

    const reviewQueue = buildSearchLearningRewriteSourceActionReviewQueue(drafts, [
        {
            id: 'NAVER:promote:review',
            source: 'NAVER',
            action: 'promote_confirm',
            title: '승격 유지 확인',
            reviewState: 'stable_followup',
            reason: 'stable',
            entryIds: ['entry-1'],
            readyReviewEntryIds: [],
            generationNeededEntryIds: [],
            readyReviewCount: 0,
            generationNeededCount: 0,
            stableCount: 1,
            topClusters: ['후드/후드집업'],
            topQueries: ['운동용 후드'],
        },
        {
            id: 'MUSINSA:rollback:review',
            source: 'MUSINSA',
            action: 'rollback_regenerate',
            title: 'AI 재생성 필요',
            reviewState: 'generation_needed',
            reason: 'regen',
            entryIds: ['entry-2'],
            readyReviewEntryIds: [],
            generationNeededEntryIds: ['entry-2'],
            readyReviewCount: 0,
            generationNeededCount: 1,
            stableCount: 0,
            topClusters: ['트레이닝/조거 팬츠'],
            topQueries: ['트레이닝 팬츠'],
        },
    ]);

    const queue = buildSearchLearningRewriteSourceApprovalQueue(drafts, reviewQueue);
    const summary = buildSearchLearningRewriteSourceApprovalQueueSummary(queue);

    assert.equal(summary.total, 2);
    assert.equal(summary.promoteCandidates, 1);
    assert.equal(summary.rollbackCandidates, 1);
    assert.equal(queue.find((entry) => entry.source === 'NAVER')?.decision, 'promote_candidate');
    assert.equal(queue.find((entry) => entry.source === 'MUSINSA')?.decision, 'rollback_candidate');
});

test('source approval activity prioritizes review and rollback actions into a single ops feed', () => {
    const approvalQueue: SearchLearningRewriteSourceApprovalQueueItem[] = [
        {
            id: 'NAVER:approval',
            source: 'NAVER',
            action: 'promote_confirm',
            decision: 'review_pending',
            title: '리뷰 우선 처리',
            reason: '이미 생성된 AI rewrite 제안이 있어 운영자가 먼저 review/approve 해야 합니다.',
            entryIds: ['entry-1'],
            primaryEntryIds: ['entry-1'],
            reviewState: 'ready_review',
            readyReviewCount: 1,
            generationNeededCount: 0,
            stableCount: 0,
            topClusters: ['후드/후드집업'],
            topQueries: ['운동용 후드'],
        },
        {
            id: 'MUSINSA:approval',
            source: 'MUSINSA',
            action: 'rollback_regenerate',
            decision: 'rollback_candidate',
            title: 'Rollback 후보',
            reason: 'rollback 후보이며 아직 review할 draft가 없어 AI 제안을 다시 생성해야 합니다.',
            entryIds: ['entry-2'],
            primaryEntryIds: ['entry-2'],
            reviewState: 'generation_needed',
            readyReviewCount: 0,
            generationNeededCount: 1,
            stableCount: 0,
            topClusters: ['트레이닝/조거 팬츠'],
            topQueries: ['트레이닝 팬츠'],
        },
        {
            id: 'SSF:approval',
            source: 'SSF',
            action: 'hold_review',
            decision: 'observe_pending',
            title: '관측 대기',
            reason: '즉시 승격/rollback보다 추가 표본 관측이 우선입니다.',
            entryIds: ['entry-3'],
            primaryEntryIds: ['entry-3'],
            reviewState: 'stable_followup',
            readyReviewCount: 0,
            generationNeededCount: 0,
            stableCount: 1,
            topClusters: ['러닝 자켓/바람막이'],
            topQueries: ['러닝 자켓'],
        },
    ];
    const activity = buildSearchLearningRewriteSourceApprovalActivity(approvalQueue);
    const summary = buildSearchLearningRewriteSourceApprovalActivitySummary(activity);

    assert.equal(summary.total, 3);
    assert.equal(summary.urgent, 2);
    assert.equal(summary.medium, 0);
    assert.equal(summary.low, 1);
    assert.equal(summary.reviewApprove, 1);
    assert.equal(summary.rollbackGenerate, 1);
    assert.equal(summary.observeMore, 1);
    assert.equal(activity[0]?.kind, 'review_approve');
    assert.equal(activity[0]?.priority, 'urgent');
    assert.equal(activity.find((entry) => entry.source === 'MUSINSA')?.kind, 'rollback_generate');
    assert.equal(activity.find((entry) => entry.source === 'SSF')?.kind, 'observe_more');
});

test('query learning queue records low-fit snapshots in memory', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T12:00:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업', '집업 후드'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 0,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    assert.equal(queue.entries.length, 1);
    assert.equal(queue.entries[0]?.status, 'pending');
    assert.equal(queue.entries[0]?.zeroResultCount, 1);
    assert.equal(queue.summary.pending, 1);
});

test('bulk review approves queued search learning entries with learned queries', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T12:10:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업', '트레이닝 후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    const entry = queue.entries[0];

    assert.ok(entry);

    const reviewed = await reviewSearchLearningEntries([entry.id], 'approved', 'admin-user');
    assert.equal(reviewed.length, 1);
    assert.equal(reviewed[0]?.status, 'approved');
    assert.equal(reviewed[0]?.reviewedBy, 'admin-user');
    assert.ok(reviewed[0]?.approvalBaseline);
    assert.equal(reviewed[0]?.approvalBaseline?.occurrenceCount, 1);
    assert.ok(reviewed[0]?.approvedQueries.includes('후드집업'));
    assert.ok(reviewed[0]?.approvedQueries.includes('트레이닝 후드집업'));
});

test('approval baseline stays fixed while post-approval observations accumulate', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T13:00:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    const entry = queue.entries[0];
    assert.ok(entry);

    const [approved] = await reviewSearchLearningEntries([entry.id], 'approved', 'admin-user');
    assert.ok(approved?.approvalBaseline);

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T13:05:00.000Z',
        effectiveQuery: '운동용 후드집업',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 1,
        strongMatchCount: 2,
        suggestedQueries: ['후드집업'],
        totalProducts: 12,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [],
    });

    const updated = await loadSearchLearningQueue(10);
    const approvedEntry = updated.entries.find((current) => current.id === entry.id);

    assert.ok(approvedEntry?.approvalBaseline);
    assert.equal(approvedEntry?.approvalBaseline?.occurrenceCount, 1);
    assert.equal(approvedEntry?.occurrenceCount, 2);
    assert.equal(approvedEntry?.status, 'approved');
});

test('search learning impact summary separates improved queries from no-improvement queries', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T14:00:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    recordSearchLearningCandidate({
        query: '등산 바지',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T14:01:00.000Z',
        effectiveQuery: '등산 바지',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 0,
        strongMatchCount: 1,
        suggestedQueries: ['등산 팬츠'],
        totalProducts: 4,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T14:05:00.000Z',
        effectiveQuery: '운동용 후드집업',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 2,
        strongMatchCount: 4,
        suggestedQueries: ['후드집업'],
        totalProducts: 18,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [],
    });

    recordSearchLearningCandidate({
        query: '등산 바지',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T14:06:00.000Z',
        effectiveQuery: '등산 팬츠',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 0,
        strongMatchCount: 1,
        suggestedQueries: ['등산 팬츠'],
        totalProducts: 3,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const updated = await loadSearchLearningQueue(10);
    const summary = buildSearchLearningImpactSummary(updated.entries);

    assert.equal(summary.approvedTracked, 2);
    assert.equal(summary.improved, 1);
    assert.equal(summary.noImprovement, 1);
    assert.equal(summary.awaitingSamples, 0);
    assert.equal(summary.topImproved[0]?.query, '운동용 후드');
    assert.equal(summary.topNeedsAttention[0]?.query, '등산 바지');
    assert.equal(summary.topAwaitingSamples.length, 0);
});

test('search learning impact summary tracks approved queries waiting for new samples', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '러닝 자켓',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T15:00:00.000Z',
        effectiveQuery: '러닝 자켓',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['러닝 재킷'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    const updated = await loadSearchLearningQueue(10);
    const summary = buildSearchLearningImpactSummary(updated.entries);

    assert.equal(summary.approvedTracked, 1);
    assert.equal(summary.awaitingSamples, 1);
    assert.equal(summary.measured, 0);
    assert.equal(summary.topAwaitingSamples[0]?.query, '러닝 자켓');
});

test('search learning impact cluster summaries group related fashion queries', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T16:00:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    recordSearchLearningCandidate({
        query: '남자 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T16:01:00.000Z',
        effectiveQuery: '남자 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['남성 후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T16:05:00.000Z',
        effectiveQuery: '운동용 후드집업',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 1,
        strongMatchCount: 2,
        suggestedQueries: ['후드집업'],
        totalProducts: 12,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [],
    });

    const updated = await loadSearchLearningQueue(10);
    const clusters = buildSearchLearningImpactClusterSummaries(updated.entries);
    const hoodieCluster = clusters.find((cluster) => cluster.clusterId === 'hoodie_training');

    assert.ok(hoodieCluster);
    assert.equal(hoodieCluster?.clusterLabel, '후드/후드집업');
    assert.equal(hoodieCluster?.queryCount, 2);
    assert.equal(hoodieCluster?.improved, 1);
    assert.equal(hoodieCluster?.awaitingSamples, 1);
    assert.equal(hoodieCluster?.entryIds.length, 2);
});

test('search learning impact cluster rollup summarizes improved and weak semantic groups', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T17:00:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: ['후드집업'],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    recordSearchLearningCandidate({
        query: '등산 바지',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T17:01:00.000Z',
        effectiveQuery: '등산 바지',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 0,
        strongMatchCount: 1,
        suggestedQueries: ['카고 팬츠'],
        totalProducts: 4,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    await reviewSearchLearningEntries(queue.entries.map((entry) => entry.id), 'approved', 'admin-user');

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T17:05:00.000Z',
        effectiveQuery: '운동용 후드집업',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 1,
        strongMatchCount: 3,
        suggestedQueries: ['후드집업'],
        totalProducts: 10,
        directSourceCount: 1,
        fallbackSourceCount: 0,
        sources: [],
    });

    recordSearchLearningCandidate({
        query: '등산 바지',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T17:06:00.000Z',
        effectiveQuery: '등산 팬츠',
        queryIntent: 'fashion',
        resultQuality: 'mixed',
        exactMatchCount: 0,
        strongMatchCount: 1,
        suggestedQueries: ['카고 팬츠'],
        totalProducts: 3,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const updated = await loadSearchLearningQueue(10);
    const rollup = buildSearchLearningImpactClusterRollup(updated.entries);

    assert.equal(rollup.tracked, 2);
    assert.equal(rollup.improved, 1);
    assert.equal(rollup.noImprovement, 1);
    assert.equal(rollup.awaitingSamples, 0);
    assert.equal(rollup.topImproved[0]?.clusterId, 'hoodie_training');
    assert.equal(rollup.topNeedsAttention[0]?.clusterId, 'other');
});

test('bulk suggestion generation attaches AI or heuristic suggestions to selected queue entries', async () => {
    resetSearchLearningEntries();

    recordSearchLearningCandidate({
        query: '운동용 후드',
        page: 1,
        sort: 'sim',
        generatedAt: '2026-03-10T12:20:00.000Z',
        effectiveQuery: '운동용 후드',
        queryIntent: 'fashion',
        resultQuality: 'weak',
        exactMatchCount: 0,
        strongMatchCount: 0,
        suggestedQueries: [],
        totalProducts: 0,
        directSourceCount: 0,
        fallbackSourceCount: 1,
        sources: [],
    });

    const queue = await loadSearchLearningQueue(10);
    const entry = queue.entries[0];

    assert.ok(entry);

    const updated = await generateSearchLearningSuggestions([entry.id]);
    assert.equal(updated.length, 1);
    assert.ok(updated[0]?.aiSuggestion);
    assert.ok(updated[0]?.aiSuggestion?.suggestedQueries.includes('후드집업'));
});

test('search learning activity records seed, generate and review operations', async () => {
    resetSearchLearningEntries();

    const seeded = await seedSearchLearningEntries(['운동용 후드'], {
        context: 'coverage_seed',
        actorUid: 'admin-user',
    });
    assert.equal(seeded.length, 1);

    const generated = await generateSearchLearningSuggestions([seeded[0]!.id], {
        context: 'bulk_generate',
        actorUid: 'admin-user',
    });
    assert.equal(generated.length, 1);

    const reviewed = await reviewSearchLearningEntries(
        [seeded[0]!.id],
        'approved',
        'admin-user',
        { context: 'bulk_approve' }
    );
    assert.equal(reviewed.length, 1);

    const activity = await loadSearchLearningActivity(10);
    assert.equal(activity.events.length, 3);
    assert.equal(activity.events[0]?.type, 'review_entries');
    assert.equal(activity.events[0]?.context, 'bulk_approve');
    assert.equal(activity.events[1]?.type, 'generate_suggestions');
    assert.equal(activity.events[1]?.context, 'bulk_generate');
    assert.equal(activity.events[2]?.type, 'seed_queries');
    assert.equal(activity.events[2]?.context, 'coverage_seed');
});

test('search learning activity summary aggregates contexts and repeated queries', () => {
    const summary = buildSearchLearningActivitySummary([
        {
            id: 'seed-1',
            type: 'seed_queries',
            context: 'coverage_seed',
            reviewedStatus: null,
            actorUid: 'admin-a',
            count: 2,
            entryIds: ['q1', 'q2'],
            queries: ['운동용 후드', '트레이닝 팬츠'],
            createdAt: '2026-03-11T10:00:00.000Z',
        },
        {
            id: 'generate-1',
            type: 'generate_suggestions',
            context: 'bulk_generate',
            reviewedStatus: null,
            actorUid: 'admin-a',
            count: 1,
            entryIds: ['q1'],
            queries: ['운동용 후드'],
            createdAt: '2026-03-11T10:02:00.000Z',
        },
        {
            id: 'review-1',
            type: 'review_entries',
            context: 'bulk_approve',
            reviewedStatus: 'approved',
            actorUid: 'admin-b',
            count: 1,
            entryIds: ['q1'],
            queries: ['운동용 후드'],
            createdAt: '2026-03-11T10:03:00.000Z',
        },
    ]);

    assert.equal(summary.total, 3);
    assert.equal(summary.seeded, 2);
    assert.equal(summary.generated, 1);
    assert.equal(summary.reviewed, 1);
    assert.equal(summary.approvedReviews, 1);
    assert.equal(summary.ignoredReviews, 0);
    assert.equal(summary.uniqueActors, 2);
    assert.equal(summary.topContexts[0]?.context, 'coverage_seed');
    assert.equal(summary.topGeneratedContexts[0]?.context, 'bulk_generate');
    assert.equal(summary.topReviewContexts[0]?.context, 'bulk_approve');
    assert.equal(summary.topQueries[0]?.query, '운동용 후드');
    assert.equal(summary.topQueries[0]?.count, 3);
});

test('search learning activity recommendations highlight review, generation and sample follow-up actions', () => {
    const recommendations = buildSearchLearningActivityRecommendations(
        [
            {
                id: 'seed-1',
                type: 'seed_queries',
                context: 'coverage_seed',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['seed-entry'],
                queries: ['트레이닝 팬츠'],
                createdAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'generate-1',
                type: 'generate_suggestions',
                context: 'bulk_generate',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['draft-entry'],
                queries: ['운동용 후드'],
                createdAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'review-1',
                type: 'review_entries',
                context: 'bulk_approve',
                reviewedStatus: 'approved',
                actorUid: 'admin-b',
                count: 1,
                entryIds: ['approved-entry'],
                queries: ['러닝 자켓'],
                createdAt: '2026-03-11T10:02:00.000Z',
            },
        ],
        [
            {
                id: 'seed-entry',
                query: '트레이닝 팬츠',
                normalizedQuery: '트레이닝 팬츠',
                effectiveQuery: '트레이닝 팬츠',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: [],
                approvedQueries: [],
                aiSuggestion: null,
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:00:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:00:00.000Z',
                updatedAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'draft-entry',
                query: '운동용 후드',
                normalizedQuery: '운동용 후드',
                effectiveQuery: '운동용 후드집업',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: ['후드집업'],
                approvedQueries: [],
                aiSuggestion: {
                    normalizedQuery: '후드집업',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업', '트레이닝 후드집업'],
                    rationale: '후드/후디 카테고리로 확장합니다.',
                    model: 'heuristic',
                    generatedAt: '2026-03-11T10:01:00.000Z',
                },
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:01:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:01:00.000Z',
                updatedAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'approved-entry',
                query: '러닝 자켓',
                normalizedQuery: '러닝 자켓',
                effectiveQuery: '러닝 자켓',
                queryIntent: 'fashion',
                status: 'approved',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: ['바람막이'],
                approvedQueries: ['바람막이'],
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-11T10:02:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                lastSeenAt: '2026-03-11T10:02:00.000Z',
                reviewedAt: '2026-03-11T10:02:00.000Z',
                reviewedBy: 'admin-b',
                createdAt: '2026-03-11T10:00:00.000Z',
                updatedAt: '2026-03-11T10:02:00.000Z',
            },
        ]
    );

    assert.equal(recommendations.reviewPending, 1);
    assert.equal(recommendations.generateNeeded, 1);
    assert.equal(recommendations.awaitingSamples, 1);
    assert.equal(recommendations.topReviewPending[0]?.queries[0], '운동용 후드');
    assert.equal(recommendations.topGenerateNeeded[0]?.queries[0], '트레이닝 팬츠');
    assert.equal(recommendations.topAwaitingSamples[0]?.queries[0], '러닝 자켓');
});

test('search learning activity ops queue prioritizes review, generation and sample follow-up actions', () => {
    const queue = buildSearchLearningActivityOpsQueue(
        [
            {
                id: 'seed-1',
                type: 'seed_queries',
                context: 'coverage_seed',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 2,
                entryIds: ['seed-entry'],
                queries: ['트레이닝 팬츠', '트레이닝 팬츠'],
                createdAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'generate-1',
                type: 'generate_suggestions',
                context: 'bulk_generate',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 2,
                entryIds: ['draft-entry'],
                queries: ['운동용 후드', '운동용 후드'],
                createdAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'review-1',
                type: 'review_entries',
                context: 'bulk_approve',
                reviewedStatus: 'approved',
                actorUid: 'admin-b',
                count: 1,
                entryIds: ['approved-entry'],
                queries: ['러닝 자켓'],
                createdAt: '2026-03-11T10:02:00.000Z',
            },
        ],
        [
            {
                id: 'seed-entry',
                query: '트레이닝 팬츠',
                normalizedQuery: '트레이닝 팬츠',
                effectiveQuery: '트레이닝 팬츠',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 2,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: [],
                approvedQueries: [],
                aiSuggestion: null,
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:00:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:00:00.000Z',
                updatedAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'draft-entry',
                query: '운동용 후드',
                normalizedQuery: '운동용 후드',
                effectiveQuery: '운동용 후드집업',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 4,
                lowFitCount: 3,
                zeroResultCount: 2,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: [],
                approvedQueries: [],
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업', '트레이닝 후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-11T10:01:00.000Z',
                },
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:01:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:01:00.000Z',
                updatedAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'approved-entry',
                query: '러닝 자켓',
                normalizedQuery: '러닝 자켓',
                effectiveQuery: '러닝 자켓',
                queryIntent: 'fashion',
                status: 'approved',
                occurrenceCount: 2,
                lowFitCount: 1,
                zeroResultCount: 0,
                lastResultQuality: 'mixed',
                lastTotalProducts: 4,
                suggestedQueries: ['바람막이'],
                approvedQueries: ['바람막이'],
                aiSuggestion: {
                    normalizedQuery: '러닝 자켓',
                    categoryHint: '바람막이',
                    suggestedQueries: ['바람막이'],
                    rationale: 'running jacket',
                    model: 'heuristic',
                    generatedAt: '2026-03-11T10:02:00.000Z',
                },
                approvalBaseline: {
                    approvedAt: '2026-03-11T09:50:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 1,
                    zeroResultCount: 0,
                },
                lastSeenAt: '2026-03-11T10:02:00.000Z',
                reviewedAt: '2026-03-11T09:50:00.000Z',
                reviewedBy: 'admin-b',
                createdAt: '2026-03-11T09:40:00.000Z',
                updatedAt: '2026-03-11T10:02:00.000Z',
            },
        ]
    );

    assert.equal(queue.total, 3);
    assert.equal(queue.critical, 1);
    assert.equal(queue.topItems[0]?.action, 'review_pending');
    assert.equal(queue.topItems[0]?.priority, 'critical');
    assert.equal(queue.topItems[0]?.actionLabel, '즉시 승인');
    assert.equal(queue.topItems[1]?.action, 'generate_needed');
    assert.equal(queue.topItems[1]?.actionLabel, '즉시 AI 제안');
    assert.equal(queue.topItems[2]?.action, 'awaiting_samples');
    assert.equal(queue.topItems[2]?.actionLabel, '표본 수집 대상 선택');
});

test('search learning activity followups separate retrain, awaiting and validated approvals', () => {
    const followups = buildSearchLearningActivityFollowups(
        [
            {
                id: 'review-1',
                type: 'review_entries',
                context: 'bulk_approve',
                reviewedStatus: 'approved',
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['needs-retrain'],
                queries: ['운동용 후드'],
                createdAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'review-2',
                type: 'review_entries',
                context: 'bulk_approve',
                reviewedStatus: 'approved',
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['awaiting-entry'],
                queries: ['러닝 자켓'],
                createdAt: '2026-03-11T10:02:00.000Z',
            },
            {
                id: 'review-3',
                type: 'review_entries',
                context: 'bulk_approve',
                reviewedStatus: 'approved',
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['validated-entry'],
                queries: ['트레이닝 팬츠'],
                createdAt: '2026-03-11T10:03:00.000Z',
            },
        ],
        [
            {
                id: 'needs-retrain',
                query: '운동용 후드',
                normalizedQuery: '운동용 후드',
                effectiveQuery: '운동용 후드집업',
                queryIntent: 'fashion',
                status: 'approved',
                occurrenceCount: 5,
                lowFitCount: 4,
                zeroResultCount: 3,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: [],
                approvedQueries: ['후드집업'],
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    rationale: 'hoodie',
                    suggestedQueries: ['후드집업'],
                    model: 'heuristic',
                    generatedAt: '2026-03-11T09:50:00.000Z',
                },
                approvalBaseline: {
                    approvedAt: '2026-03-11T09:50:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 1,
                    zeroResultCount: 0,
                },
                lastSeenAt: '2026-03-11T10:01:00.000Z',
                reviewedAt: '2026-03-11T09:50:00.000Z',
                reviewedBy: 'admin-a',
                createdAt: '2026-03-11T09:40:00.000Z',
                updatedAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'awaiting-entry',
                query: '러닝 자켓',
                normalizedQuery: '러닝 자켓',
                effectiveQuery: '바람막이',
                queryIntent: 'fashion',
                status: 'approved',
                occurrenceCount: 2,
                lowFitCount: 1,
                zeroResultCount: 0,
                lastResultQuality: 'mixed',
                lastTotalProducts: 4,
                suggestedQueries: [],
                approvedQueries: ['바람막이'],
                aiSuggestion: {
                    normalizedQuery: '러닝 자켓',
                    categoryHint: '바람막이',
                    rationale: 'running jacket',
                    suggestedQueries: ['바람막이'],
                    model: 'heuristic',
                    generatedAt: '2026-03-11T09:45:00.000Z',
                },
                approvalBaseline: {
                    approvedAt: '2026-03-11T09:45:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 1,
                    zeroResultCount: 0,
                },
                lastSeenAt: '2026-03-11T10:02:00.000Z',
                reviewedAt: '2026-03-11T09:45:00.000Z',
                reviewedBy: 'admin-a',
                createdAt: '2026-03-11T09:40:00.000Z',
                updatedAt: '2026-03-11T10:02:00.000Z',
            },
            {
                id: 'validated-entry',
                query: '트레이닝 팬츠',
                normalizedQuery: '트레이닝 팬츠',
                effectiveQuery: '조거 팬츠',
                queryIntent: 'fashion',
                status: 'approved',
                occurrenceCount: 5,
                lowFitCount: 1,
                zeroResultCount: 0,
                lastResultQuality: 'strong',
                lastTotalProducts: 8,
                suggestedQueries: [],
                approvedQueries: ['조거 팬츠'],
                aiSuggestion: {
                    normalizedQuery: '트레이닝 팬츠',
                    categoryHint: '조거 팬츠',
                    rationale: 'training pants',
                    suggestedQueries: ['조거 팬츠'],
                    model: 'heuristic',
                    generatedAt: '2026-03-11T09:40:00.000Z',
                },
                approvalBaseline: {
                    approvedAt: '2026-03-11T09:40:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 1,
                    zeroResultCount: 0,
                },
                lastSeenAt: '2026-03-11T10:03:00.000Z',
                reviewedAt: '2026-03-11T09:40:00.000Z',
                reviewedBy: 'admin-a',
                createdAt: '2026-03-11T09:35:00.000Z',
                updatedAt: '2026-03-11T10:03:00.000Z',
            },
        ]
    );

    assert.equal(followups.retrainNeeded, 1);
    assert.equal(followups.awaitingSamples, 1);
    assert.equal(followups.validated, 1);
    assert.equal(followups.topRetrainNeeded[0]?.queries[0], '운동용 후드');
    assert.equal(followups.topAwaitingSamples[0]?.queries[0], '러닝 자켓');
    assert.equal(followups.topValidated[0]?.queries[0], '트레이닝 팬츠');
});

test('search learning ops center combines activity actions into one triage summary', () => {
    const recommendations = buildSearchLearningActivityRecommendations(
        [
            {
                id: 'seed-1',
                type: 'seed_queries',
                context: 'coverage_seed',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['seed-entry'],
                queries: ['트레이닝 팬츠'],
                createdAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'generate-1',
                type: 'generate_suggestions',
                context: 'bulk_generate',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['draft-entry'],
                queries: ['운동용 후드'],
                createdAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'review-1',
                type: 'review_entries',
                context: 'bulk_approve',
                reviewedStatus: 'approved',
                actorUid: 'admin-b',
                count: 1,
                entryIds: ['approved-entry'],
                queries: ['러닝 자켓'],
                createdAt: '2026-03-11T10:02:00.000Z',
            },
        ],
        [
            {
                id: 'seed-entry',
                query: '트레이닝 팬츠',
                normalizedQuery: '트레이닝 팬츠',
                effectiveQuery: '트레이닝 팬츠',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: [],
                approvedQueries: [],
                aiSuggestion: null,
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:00:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:00:00.000Z',
                updatedAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'draft-entry',
                query: '운동용 후드',
                normalizedQuery: '운동용 후드',
                effectiveQuery: '운동용 후드',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: ['후드집업'],
                approvedQueries: [],
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: '후드집업으로 확장',
                    model: 'heuristic',
                    generatedAt: '2026-03-11T10:01:00.000Z',
                },
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:01:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:01:00.000Z',
                updatedAt: '2026-03-11T10:01:00.000Z',
            },
            {
                id: 'approved-entry',
                query: '러닝 자켓',
                normalizedQuery: '러닝 자켓',
                effectiveQuery: '러닝 자켓',
                queryIntent: 'fashion',
                status: 'approved',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: ['러닝 재킷'],
                approvedQueries: ['러닝 재킷'],
                aiSuggestion: {
                    normalizedQuery: '러닝 자켓',
                    categoryHint: '러닝 재킷',
                    suggestedQueries: ['러닝 재킷'],
                    rationale: '러닝 재킷으로 정규화',
                    model: 'heuristic',
                    generatedAt: '2026-03-11T10:02:00.000Z',
                },
                approvalBaseline: {
                    approvedAt: '2026-03-11T10:02:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                lastSeenAt: '2026-03-11T10:02:00.000Z',
                reviewedAt: '2026-03-11T10:02:00.000Z',
                reviewedBy: 'admin-b',
                createdAt: '2026-03-11T10:02:00.000Z',
                updatedAt: '2026-03-11T10:02:00.000Z',
            },
        ]
    );
    const opsQueue = buildSearchLearningActivityOpsQueue(
        [
            {
                id: 'seed-1',
                type: 'seed_queries',
                context: 'coverage_seed',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['seed-entry'],
                queries: ['트레이닝 팬츠'],
                createdAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'generate-1',
                type: 'generate_suggestions',
                context: 'bulk_generate',
                reviewedStatus: null,
                actorUid: 'admin-a',
                count: 1,
                entryIds: ['draft-entry'],
                queries: ['운동용 후드'],
                createdAt: '2026-03-11T10:01:00.000Z',
            },
        ],
        [
            {
                id: 'seed-entry',
                query: '트레이닝 팬츠',
                normalizedQuery: '트레이닝 팬츠',
                effectiveQuery: '트레이닝 팬츠',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: [],
                approvedQueries: [],
                aiSuggestion: null,
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:00:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:00:00.000Z',
                updatedAt: '2026-03-11T10:00:00.000Z',
            },
            {
                id: 'draft-entry',
                query: '운동용 후드',
                normalizedQuery: '운동용 후드',
                effectiveQuery: '운동용 후드',
                queryIntent: 'fashion',
                status: 'pending',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: ['후드집업'],
                approvedQueries: [],
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: '후드집업으로 확장',
                    model: 'heuristic',
                    generatedAt: '2026-03-11T10:01:00.000Z',
                },
                approvalBaseline: null,
                lastSeenAt: '2026-03-11T10:01:00.000Z',
                reviewedAt: null,
                reviewedBy: null,
                createdAt: '2026-03-11T10:01:00.000Z',
                updatedAt: '2026-03-11T10:01:00.000Z',
            },
        ]
    );
    const followups = buildSearchLearningActivityFollowups(
        [
            {
                id: 'review-1',
                type: 'review_entries',
                context: 'bulk_approve',
                reviewedStatus: 'approved',
                actorUid: 'admin-b',
                count: 1,
                entryIds: ['approved-entry'],
                queries: ['러닝 자켓'],
                createdAt: '2026-03-11T10:02:00.000Z',
            },
        ],
        [
            {
                id: 'approved-entry',
                query: '러닝 자켓',
                normalizedQuery: '러닝 자켓',
                effectiveQuery: '러닝 자켓',
                queryIntent: 'fashion',
                status: 'approved',
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
                lastResultQuality: 'weak',
                lastTotalProducts: 0,
                suggestedQueries: ['러닝 재킷'],
                approvedQueries: ['러닝 재킷'],
                aiSuggestion: {
                    normalizedQuery: '러닝 자켓',
                    categoryHint: '러닝 재킷',
                    suggestedQueries: ['러닝 재킷'],
                    rationale: '러닝 재킷으로 정규화',
                    model: 'heuristic',
                    generatedAt: '2026-03-11T10:02:00.000Z',
                },
                approvalBaseline: {
                    approvedAt: '2026-03-11T10:02:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                lastSeenAt: '2026-03-11T10:02:00.000Z',
                reviewedAt: '2026-03-11T10:02:00.000Z',
                reviewedBy: 'admin-b',
                createdAt: '2026-03-11T10:02:00.000Z',
                updatedAt: '2026-03-11T10:02:00.000Z',
            },
        ]
    );

    const opsCenter = buildSearchLearningOpsCenter(recommendations, opsQueue, followups);

    assert.equal(opsCenter.urgentNow, 1);
    assert.equal(opsCenter.reviewPending, 1);
    assert.equal(opsCenter.generateNeeded, 1);
    assert.equal(opsCenter.sampleCollection, 1);
    assert.equal(opsCenter.validated, 0);
    assert.equal(opsCenter.reviewPendingEntryIds[0], 'draft-entry');
    assert.equal(opsCenter.generateNeededEntryIds[0], 'seed-entry');
    assert.equal(opsCenter.sampleCollectionEntryIds[0], 'approved-entry');
    assert.equal(opsCenter.topUrgentNow[0]?.title, 'bulk_generate draft review');
    assert.equal(opsCenter.topValidated.length, 0);
});

test('search learning ops playbooks condense ops center actions into batch runbooks', () => {
    const playbooks = buildSearchLearningOpsPlaybooks({
        urgentNow: 3,
        reviewPending: 2,
        generateNeeded: 1,
        sampleCollection: 1,
        retrainNeeded: 1,
        validated: 4,
        reviewPendingEntryIds: ['draft-1', 'draft-2'],
        generateNeededEntryIds: ['seed-1'],
        sampleCollectionEntryIds: ['approved-1'],
        retrainNeededEntryIds: ['approved-2'],
        validatedEntryIds: ['stable-1', 'stable-2'],
        topUrgentNow: [],
        topRetrainNeeded: [],
        topValidated: [],
    });

    assert.equal(playbooks.readyBatches, 4);
    assert.equal(playbooks.urgentBatches, 3);
    assert.equal(playbooks.stableValidated, 4);
    assert.equal(playbooks.topPlaybooks[0]?.action, 'approve_batch');
    assert.equal(playbooks.topPlaybooks[1]?.action, 'retrain_batch');
    assert.equal(playbooks.topPlaybooks[2]?.action, 'generate_batch');
    assert.equal(playbooks.topPlaybooks[3]?.action, 'sample_batch');
});

test('search learning ops playbook activity summarizes executed batch runs', () => {
    const summary = buildSearchLearningOpsPlaybookActivity([
        {
            id: 'activity-approve',
            type: 'review_entries',
            context: 'ops_playbook_approve_approve',
            reviewedStatus: 'approved',
            actorUid: 'admin-a',
            count: 2,
            entryIds: ['draft-1', 'draft-2'],
            queries: ['운동용 후드', '남자 후드'],
            createdAt: '2026-03-12T09:10:00.000Z',
        },
        {
            id: 'activity-retrain',
            type: 'generate_suggestions',
            context: 'ops_playbook_generate_retrain',
            reviewedStatus: null,
            actorUid: 'admin-b',
            count: 1,
            entryIds: ['approved-1'],
            queries: ['트레이닝 팬츠'],
            createdAt: '2026-03-12T09:20:00.000Z',
        },
        {
            id: 'activity-generate',
            type: 'generate_suggestions',
            context: 'ops_playbook_generate_generate',
            reviewedStatus: null,
            actorUid: 'admin-c',
            count: 1,
            entryIds: ['seed-1'],
            queries: ['러닝 자켓'],
            createdAt: '2026-03-12T09:30:00.000Z',
        },
    ]);

    assert.equal(summary.totalRuns, 3);
    assert.equal(summary.approvalRuns, 1);
    assert.equal(summary.generationRuns, 1);
    assert.equal(summary.retrainRuns, 1);
    assert.equal(summary.uniqueQueries, 4);
    assert.equal(summary.recentRuns[0]?.playbookId, 'generate');
    assert.equal(summary.recentRuns[0]?.entryIds[0], 'seed-1');
    assert.equal(summary.recentRuns[1]?.action, 'retrain_batch');
});

test('search learning ops playbook outcomes classify review, retrain and validated batches', () => {
    const outcomes = buildSearchLearningOpsPlaybookOutcomes(
        [
            {
                id: 'run-ready',
                playbookId: 'generate',
                action: 'generate_batch',
                title: 'Generate Needed Batch',
                description: 'seed query suggestion batch',
                actionLabel: '즉시 AI 제안',
                priority: 'high',
                context: 'ops_playbook_generate_generate',
                count: 2,
                entryIds: ['pending-1', 'pending-2'],
                queries: ['운동용 후드', '남자 후드'],
                actorUid: 'admin-a',
                createdAt: '2026-03-12T09:10:00.000Z',
            },
            {
                id: 'run-retrain',
                playbookId: 'approve',
                action: 'approve_batch',
                title: 'Review Pending Batch',
                description: 'review batch',
                actionLabel: '즉시 승인',
                priority: 'critical',
                context: 'ops_playbook_approve_approve',
                count: 1,
                entryIds: ['approved-1'],
                queries: ['트레이닝 팬츠'],
                actorUid: 'admin-b',
                createdAt: '2026-03-12T09:20:00.000Z',
            },
            {
                id: 'run-valid',
                playbookId: 'approve',
                action: 'approve_batch',
                title: 'Review Pending Batch',
                description: 'review batch',
                actionLabel: '즉시 승인',
                priority: 'critical',
                context: 'ops_playbook_approve_approve',
                count: 1,
                entryIds: ['approved-2'],
                queries: ['러닝 자켓'],
                actorUid: 'admin-c',
                createdAt: '2026-03-12T09:30:00.000Z',
            },
        ],
        [
            {
                id: 'pending-1',
                query: '운동용 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T09:05:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
            {
                id: 'pending-2',
                query: '남자 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '남자 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['남성 후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T09:05:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
            {
                id: 'approved-1',
                query: '트레이닝 팬츠',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T08:00:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 2,
                    zeroResultCount: 1,
                },
                occurrenceCount: 4,
                lowFitCount: 4,
                zeroResultCount: 2,
            },
            {
                id: 'approved-2',
                query: '러닝 자켓',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T08:00:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 2,
                    zeroResultCount: 1,
                },
                occurrenceCount: 4,
                lowFitCount: 2,
                zeroResultCount: 1,
            },
        ]
    );

    assert.equal(outcomes.total, 3);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 1);
    assert.equal(outcomes.validated, 1);
    assert.equal(outcomes.topReadyReview[0]?.title, 'Generate Needed Batch');
    assert.equal(outcomes.topNeedsAttention[0]?.queries[0], '트레이닝 팬츠');
    assert.equal(outcomes.topValidated[0]?.queries[0], '러닝 자켓');
});

test('search learning ops playbook recommendations convert outcomes into next-action buckets', () => {
    const recommendations = buildSearchLearningOpsPlaybookRecommendations(
        buildSearchLearningOpsPlaybookOutcomes(
            [
                {
                    id: 'run-ready',
                    playbookId: 'generate',
                    action: 'generate_batch',
                    title: 'Generate Needed Batch',
                    description: 'seed query suggestion batch',
                    actionLabel: '즉시 AI 제안',
                    priority: 'high',
                    context: 'ops_playbook_generate_generate',
                    count: 3,
                    entryIds: ['pending-1', 'pending-2', 'pending-3'],
                    queries: ['운동용 후드', '남자 후드', '후드집업'],
                    actorUid: 'admin-a',
                    createdAt: '2026-03-12T09:10:00.000Z',
                },
                {
                    id: 'run-retrain',
                    playbookId: 'approve',
                    action: 'approve_batch',
                    title: 'Review Pending Batch',
                    description: 'review batch',
                    actionLabel: '즉시 승인',
                    priority: 'critical',
                    context: 'ops_playbook_approve_approve',
                    count: 2,
                    entryIds: ['approved-1', 'approved-2'],
                    queries: ['트레이닝 팬츠', '등산 바지'],
                    actorUid: 'admin-b',
                    createdAt: '2026-03-12T09:20:00.000Z',
                },
                {
                    id: 'run-awaiting',
                    playbookId: 'samples',
                    action: 'sample_batch',
                    title: 'Sample Collection Batch',
                    description: 'sample batch',
                    actionLabel: '표본 수집 대상 선택',
                    priority: 'medium',
                    context: 'ops_playbook_samples',
                    count: 1,
                    entryIds: ['approved-3'],
                    queries: ['러닝 자켓'],
                    actorUid: 'admin-c',
                    createdAt: '2026-03-12T09:30:00.000Z',
                },
            ],
            [
                {
                    id: 'pending-1',
                    query: '운동용 후드',
                    status: 'pending',
                    aiSuggestion: {
                        normalizedQuery: '운동용 후드',
                        categoryHint: '후드집업',
                        suggestedQueries: ['후드집업'],
                        rationale: 'hoodie',
                        model: 'heuristic',
                        generatedAt: '2026-03-12T09:05:00.000Z',
                    },
                    approvalBaseline: null,
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                {
                    id: 'pending-2',
                    query: '남자 후드',
                    status: 'pending',
                    aiSuggestion: {
                        normalizedQuery: '남자 후드',
                        categoryHint: '후드집업',
                        suggestedQueries: ['남성 후드집업'],
                        rationale: 'hoodie',
                        model: 'heuristic',
                        generatedAt: '2026-03-12T09:05:00.000Z',
                    },
                    approvalBaseline: null,
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                {
                    id: 'pending-3',
                    query: '후드집업',
                    status: 'pending',
                    aiSuggestion: {
                        normalizedQuery: '후드집업',
                        categoryHint: '후드집업',
                        suggestedQueries: ['후드 집업'],
                        rationale: 'hoodie',
                        model: 'heuristic',
                        generatedAt: '2026-03-12T09:05:00.000Z',
                    },
                    approvalBaseline: null,
                    occurrenceCount: 1,
                    lowFitCount: 0,
                    zeroResultCount: 0,
                },
                {
                    id: 'approved-1',
                    query: '트레이닝 팬츠',
                    status: 'approved',
                    aiSuggestion: null,
                    approvalBaseline: {
                        approvedAt: '2026-03-12T08:00:00.000Z',
                        occurrenceCount: 2,
                        lowFitCount: 2,
                        zeroResultCount: 1,
                    },
                    occurrenceCount: 4,
                    lowFitCount: 4,
                    zeroResultCount: 2,
                },
                {
                    id: 'approved-2',
                    query: '등산 바지',
                    status: 'approved',
                    aiSuggestion: null,
                    approvalBaseline: {
                        approvedAt: '2026-03-12T08:00:00.000Z',
                        occurrenceCount: 2,
                        lowFitCount: 2,
                        zeroResultCount: 1,
                    },
                    occurrenceCount: 4,
                    lowFitCount: 4,
                    zeroResultCount: 2,
                },
                {
                    id: 'approved-3',
                    query: '러닝 자켓',
                    status: 'approved',
                    aiSuggestion: null,
                    approvalBaseline: {
                        approvedAt: '2026-03-12T08:00:00.000Z',
                        occurrenceCount: 4,
                        lowFitCount: 2,
                        zeroResultCount: 1,
                    },
                    occurrenceCount: 6,
                    lowFitCount: 2,
                    zeroResultCount: 1,
                },
            ]
        )
    );

    assert.equal(recommendations.total, 3);
    assert.equal(recommendations.reviewNow, 1);
    assert.equal(recommendations.retrainNow, 1);
    assert.equal(recommendations.collectSamples, 0);
    assert.equal(recommendations.observe, 1);
    assert.equal(recommendations.critical, 2);
    assert.equal(recommendations.topReviewNow[0]?.actionLabel, 'review 즉시 승인');
    assert.equal(recommendations.topRetrainNow[0]?.action, 'retrain_now');
    assert.equal(recommendations.topObserve[0]?.queries[0], '러닝 자켓');
});

test('search learning ops playbook recommendation queue prioritizes execute and review items', () => {
    const queue = buildSearchLearningOpsPlaybookRecommendationQueue(
        buildSearchLearningOpsPlaybookRecommendations(
            buildSearchLearningOpsPlaybookOutcomes(
                [
                    {
                        id: 'run-ready',
                        playbookId: 'generate',
                        action: 'generate_batch',
                        title: 'Generate Needed Batch',
                        description: 'seed query suggestion batch',
                        actionLabel: '즉시 AI 제안',
                        priority: 'high',
                        context: 'ops_playbook_generate_generate',
                        count: 3,
                        entryIds: ['pending-1', 'pending-2', 'pending-3'],
                        queries: ['운동용 후드', '남자 후드', '후드집업'],
                        actorUid: 'admin-a',
                        createdAt: '2026-03-12T09:10:00.000Z',
                    },
                    {
                        id: 'run-retrain',
                        playbookId: 'approve',
                        action: 'approve_batch',
                        title: 'Review Pending Batch',
                        description: 'review batch',
                        actionLabel: '즉시 승인',
                        priority: 'critical',
                        context: 'ops_playbook_approve_approve',
                        count: 2,
                        entryIds: ['approved-1', 'approved-2'],
                        queries: ['트레이닝 팬츠', '등산 바지'],
                        actorUid: 'admin-b',
                        createdAt: '2026-03-12T09:20:00.000Z',
                    },
                    {
                        id: 'run-awaiting',
                        playbookId: 'samples',
                        action: 'sample_batch',
                        title: 'Sample Collection Batch',
                        description: 'sample batch',
                        actionLabel: '표본 수집 대상 선택',
                        priority: 'medium',
                        context: 'ops_playbook_samples',
                        count: 1,
                        entryIds: ['approved-3'],
                        queries: ['러닝 자켓'],
                        actorUid: 'admin-c',
                        createdAt: '2026-03-12T09:30:00.000Z',
                    },
                ],
                [
                    {
                        id: 'pending-1',
                        query: '운동용 후드',
                        status: 'pending',
                        aiSuggestion: {
                            normalizedQuery: '운동용 후드',
                            categoryHint: '후드집업',
                            suggestedQueries: ['후드집업'],
                            rationale: 'hoodie',
                            model: 'heuristic',
                            generatedAt: '2026-03-12T09:05:00.000Z',
                        },
                        approvalBaseline: null,
                        occurrenceCount: 1,
                        lowFitCount: 1,
                        zeroResultCount: 1,
                    },
                    {
                        id: 'pending-2',
                        query: '남자 후드',
                        status: 'pending',
                        aiSuggestion: {
                            normalizedQuery: '남자 후드',
                            categoryHint: '후드집업',
                            suggestedQueries: ['남성 후드집업'],
                            rationale: 'hoodie',
                            model: 'heuristic',
                            generatedAt: '2026-03-12T09:05:00.000Z',
                        },
                        approvalBaseline: null,
                        occurrenceCount: 1,
                        lowFitCount: 1,
                        zeroResultCount: 1,
                    },
                    {
                        id: 'pending-3',
                        query: '후드집업',
                        status: 'pending',
                        aiSuggestion: {
                            normalizedQuery: '후드집업',
                            categoryHint: '후드집업',
                            suggestedQueries: ['후드 집업'],
                            rationale: 'hoodie',
                            model: 'heuristic',
                            generatedAt: '2026-03-12T09:05:00.000Z',
                        },
                        approvalBaseline: null,
                        occurrenceCount: 1,
                        lowFitCount: 0,
                        zeroResultCount: 0,
                    },
                    {
                        id: 'approved-1',
                        query: '트레이닝 팬츠',
                        status: 'approved',
                        aiSuggestion: null,
                        approvalBaseline: {
                            approvedAt: '2026-03-12T08:00:00.000Z',
                            occurrenceCount: 2,
                            lowFitCount: 2,
                            zeroResultCount: 1,
                        },
                        occurrenceCount: 4,
                        lowFitCount: 4,
                        zeroResultCount: 2,
                    },
                    {
                        id: 'approved-2',
                        query: '등산 바지',
                        status: 'approved',
                        aiSuggestion: null,
                        approvalBaseline: {
                            approvedAt: '2026-03-12T08:00:00.000Z',
                            occurrenceCount: 2,
                            lowFitCount: 2,
                            zeroResultCount: 1,
                        },
                        occurrenceCount: 4,
                        lowFitCount: 4,
                        zeroResultCount: 2,
                    },
                    {
                        id: 'approved-3',
                        query: '러닝 자켓',
                        status: 'approved',
                        aiSuggestion: null,
                        approvalBaseline: {
                            approvedAt: '2026-03-12T08:00:00.000Z',
                            occurrenceCount: 4,
                            lowFitCount: 2,
                            zeroResultCount: 1,
                        },
                        occurrenceCount: 6,
                        lowFitCount: 2,
                        zeroResultCount: 1,
                    },
                ]
            )
        )
    );

    assert.equal(queue.total, 3);
    assert.equal(queue.executeNow, 1);
    assert.equal(queue.needsReview, 1);
    assert.equal(queue.sampleCollection, 0);
    assert.equal(queue.observe, 1);
    assert.equal(queue.urgent, 2);
    assert.equal(queue.topExecuteNow[0]?.queueState, 'execute_now');
    assert.equal(queue.topNeedsReview[0]?.action, 'review_now');
    assert.equal(queue.topObserve[0]?.queries[0], '러닝 자켓');
});

test('search learning ops playbook recommendation activity tracks review and retrain executions', () => {
    const activity = buildSearchLearningOpsPlaybookRecommendationActivity([
        {
            id: 'event-1',
            type: 'review_entries',
            context: 'ops_playbook_recommendation_review_playbook_outcome:ready-review',
            reviewedStatus: 'approved',
            actorUid: 'admin-a',
            count: 2,
            entryIds: ['entry-1', 'entry-2'],
            queries: ['운동용 후드', '남자 후드'],
            createdAt: '2026-03-12T10:00:00.000Z',
        },
        {
            id: 'event-2',
            type: 'generate_suggestions',
            context: 'ops_playbook_recommendation_retrain_playbook_outcome:needs-attention',
            reviewedStatus: null,
            actorUid: 'admin-b',
            count: 1,
            entryIds: ['entry-3'],
            queries: ['트레이닝 팬츠'],
            createdAt: '2026-03-12T10:05:00.000Z',
        },
        {
            id: 'event-3',
            type: 'seed_queries',
            context: 'coverage_seed',
            reviewedStatus: null,
            actorUid: 'admin-c',
            count: 1,
            entryIds: ['entry-4'],
            queries: ['러닝 자켓'],
            createdAt: '2026-03-12T10:06:00.000Z',
        },
    ]);

    assert.equal(activity.totalRuns, 2);
    assert.equal(activity.reviewRuns, 1);
    assert.equal(activity.retrainRuns, 1);
    assert.equal(activity.uniqueQueries, 3);
    assert.equal(activity.recentRuns[0]?.action, 'retrain_now');
    assert.equal(activity.recentRuns[1]?.action, 'review_now');
});

test('search learning ops playbook recommendation outcomes classify review and retrain follow-ups', () => {
    const outcomes = buildSearchLearningOpsPlaybookRecommendationOutcomes(
        [
            {
                id: 'event-1',
                outcomeId: 'playbook_outcome:ready-review',
                action: 'review_now',
                title: 'Recommendation Review Run',
                description: 'review run',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
                context: 'ops_playbook_recommendation_review_playbook_outcome:ready-review',
                count: 2,
                entryIds: ['entry-1', 'entry-2'],
                queries: ['운동용 후드', '남자 후드'],
                actorUid: 'admin-a',
                createdAt: '2026-03-12T10:00:00.000Z',
            },
            {
                id: 'event-2',
                outcomeId: 'playbook_outcome:needs-attention',
                action: 'retrain_now',
                title: 'Recommendation Retrain Run',
                description: 'retrain run',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
                context: 'ops_playbook_recommendation_retrain_playbook_outcome:needs-attention',
                count: 1,
                entryIds: ['entry-3'],
                queries: ['트레이닝 팬츠'],
                actorUid: 'admin-b',
                createdAt: '2026-03-12T10:05:00.000Z',
            },
        ],
        [
            {
                id: 'entry-1',
                query: '운동용 후드',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T09:00:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 2,
                    zeroResultCount: 1,
                },
                occurrenceCount: 4,
                lowFitCount: 2,
                zeroResultCount: 0,
            },
            {
                id: 'entry-2',
                query: '남자 후드',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T09:00:00.000Z',
                    occurrenceCount: 2,
                    lowFitCount: 2,
                    zeroResultCount: 1,
                },
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 1,
            },
            {
                id: 'entry-3',
                query: '트레이닝 팬츠',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '트레이닝 팬츠',
                    categoryHint: '트랙 팬츠',
                    suggestedQueries: ['트랙 팬츠'],
                    rationale: 'training pants',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T10:05:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
        ]
    );

    assert.equal(outcomes.total, 2);
    assert.equal(outcomes.validated, 0);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 0);
    assert.equal(outcomes.awaitingSamples, 1);
    assert.equal(outcomes.topAwaitingSamples[0]?.queries[0], '운동용 후드');
    assert.equal(outcomes.topReadyReview[0]?.queries[0], '트레이닝 팬츠');
});

test('search learning ops playbook recommendation outcome recommendations convert follow-ups into actions', () => {
    const summary = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations(
        buildSearchLearningOpsPlaybookRecommendationOutcomes(
            [
                {
                    id: 'event-1',
                    outcomeId: 'playbook_outcome:ready-review',
                    action: 'review_now',
                    title: 'Recommendation Review Run',
                    description: 'review run',
                    actionLabel: 'review 즉시 승인',
                    priority: 'critical',
                    context: 'ops_playbook_recommendation_review_playbook_outcome:ready-review',
                    count: 2,
                    entryIds: ['entry-1', 'entry-2'],
                    queries: ['운동용 후드', '남자 후드'],
                    actorUid: 'admin-a',
                    createdAt: '2026-03-12T10:00:00.000Z',
                },
                {
                    id: 'event-2',
                    outcomeId: 'playbook_outcome:needs-attention',
                    action: 'retrain_now',
                    title: 'Recommendation Retrain Run',
                    description: 'retrain run',
                    actionLabel: '재학습 AI 제안',
                    priority: 'high',
                    context: 'ops_playbook_recommendation_retrain_playbook_outcome:needs-attention',
                    count: 1,
                    entryIds: ['entry-3'],
                    queries: ['트레이닝 팬츠'],
                    actorUid: 'admin-b',
                    createdAt: '2026-03-12T10:05:00.000Z',
                },
            ],
            [
                {
                    id: 'entry-1',
                    query: '운동용 후드',
                    status: 'approved',
                    aiSuggestion: null,
                    approvalBaseline: {
                        approvedAt: '2026-03-12T09:00:00.000Z',
                        occurrenceCount: 2,
                        lowFitCount: 2,
                        zeroResultCount: 1,
                    },
                    occurrenceCount: 2,
                    lowFitCount: 2,
                    zeroResultCount: 1,
                },
                {
                    id: 'entry-2',
                    query: '남자 후드',
                    status: 'pending',
                    aiSuggestion: {
                        normalizedQuery: '남자 후드',
                        categoryHint: '후드집업',
                        suggestedQueries: ['남성 후드집업'],
                        rationale: 'gender alias',
                        model: 'heuristic',
                        generatedAt: '2026-03-12T10:00:00.000Z',
                    },
                    approvalBaseline: null,
                    occurrenceCount: 2,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                {
                    id: 'entry-3',
                    query: '트레이닝 팬츠',
                    status: 'approved',
                    aiSuggestion: null,
                    approvalBaseline: {
                        approvedAt: '2026-03-12T09:00:00.000Z',
                        occurrenceCount: 1,
                        lowFitCount: 1,
                        zeroResultCount: 1,
                    },
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
            ]
        )
    );

    assert.equal(summary.total, 2);
    assert.equal(summary.reviewNow, 1);
    assert.equal(summary.retrainNow, 0);
    assert.equal(summary.collectSamples, 1);
    assert.equal(summary.observe, 0);
    assert.equal(summary.critical, 0);
    assert.equal(summary.highPriority, 1);
    assert.equal(summary.topReviewNow[0]?.action, 'review_now');
    assert.equal(summary.topCollectSamples[0]?.action, 'collect_samples');
});

test('search learning ops playbook recommendation outcome recommendation queue prioritizes review and sample collection', () => {
    const queue = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue(
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations(
            buildSearchLearningOpsPlaybookRecommendationOutcomes(
                [
                    {
                        id: 'event-1',
                        outcomeId: 'playbook_outcome:ready-review',
                        action: 'review_now',
                        title: 'Recommendation Review Run',
                        description: 'review run',
                        actionLabel: 'review 즉시 승인',
                        priority: 'critical',
                        context: 'ops_playbook_recommendation_review_playbook_outcome:ready-review',
                        count: 2,
                        entryIds: ['entry-1', 'entry-2'],
                        queries: ['운동용 후드', '남자 후드'],
                        actorUid: 'admin-a',
                        createdAt: '2026-03-12T10:00:00.000Z',
                    },
                    {
                        id: 'event-2',
                        outcomeId: 'playbook_outcome:awaiting',
                        action: 'observe',
                        title: 'Recommendation Observe Run',
                        description: 'observe run',
                        actionLabel: '개선 query 선택',
                        priority: 'high',
                        context: 'ops_playbook_recommendation_review_playbook_outcome:awaiting',
                        count: 1,
                        entryIds: ['entry-3'],
                        queries: ['러닝 자켓'],
                        actorUid: 'admin-b',
                        createdAt: '2026-03-12T10:05:00.000Z',
                    },
                ],
                [
                    {
                        id: 'entry-1',
                        query: '운동용 후드',
                        status: 'pending',
                        aiSuggestion: {
                            normalizedQuery: '운동용 후드',
                            categoryHint: '후드집업',
                            suggestedQueries: ['후드집업'],
                            rationale: 'hoodie',
                            model: 'heuristic',
                            generatedAt: '2026-03-12T10:00:00.000Z',
                        },
                        approvalBaseline: null,
                        occurrenceCount: 2,
                        lowFitCount: 1,
                        zeroResultCount: 1,
                    },
                    {
                        id: 'entry-2',
                        query: '남자 후드',
                        status: 'approved',
                        aiSuggestion: null,
                        approvalBaseline: {
                            approvedAt: '2026-03-12T09:00:00.000Z',
                            occurrenceCount: 2,
                            lowFitCount: 2,
                            zeroResultCount: 1,
                        },
                        occurrenceCount: 2,
                        lowFitCount: 2,
                        zeroResultCount: 1,
                    },
                    {
                        id: 'entry-3',
                        query: '러닝 자켓',
                        status: 'approved',
                        aiSuggestion: null,
                        approvalBaseline: {
                            approvedAt: '2026-03-12T09:00:00.000Z',
                            occurrenceCount: 1,
                            lowFitCount: 0,
                            zeroResultCount: 0,
                        },
                        occurrenceCount: 1,
                        lowFitCount: 0,
                        zeroResultCount: 0,
                    },
                ]
            )
        )
    );

    assert.equal(queue.total, 2);
    assert.equal(queue.executeNow, 0);
    assert.equal(queue.needsReview, 1);
    assert.equal(queue.sampleCollection, 1);
    assert.equal(queue.observe, 0);
    assert.equal(queue.urgent, 1);
    assert.equal(queue.topNeedsReview[0]?.action, 'review_now');
    assert.equal(queue.topSampleCollection[0]?.action, 'collect_samples');
});

test('search learning ops playbook recommendation outcome recommendation activity tracks review and retrain executions', () => {
    const activity = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity([
        {
            id: 'activity-1',
            type: 'review_entries',
            context: 'ops_playbook_recommendation_outcome_recommendation_review_playbook_outcome:ready-review',
            reviewedStatus: 'approved',
            count: 2,
            entryIds: ['entry-1', 'entry-2'],
            queries: ['운동용 후드', '남자 후드'],
            actorUid: 'admin-a',
            createdAt: '2026-03-12T10:00:00.000Z',
        },
        {
            id: 'activity-2',
            type: 'generate_suggestions',
            context: 'ops_playbook_recommendation_outcome_recommendation_retrain_playbook_outcome:needs-attention',
            reviewedStatus: null,
            count: 1,
            entryIds: ['entry-3'],
            queries: ['트레이닝 팬츠', '조거 팬츠'],
            actorUid: 'admin-b',
            createdAt: '2026-03-12T10:05:00.000Z',
        },
    ]);

    assert.equal(activity.totalRuns, 2);
    assert.equal(activity.reviewRuns, 1);
    assert.equal(activity.retrainRuns, 1);
    assert.equal(activity.uniqueQueries, 4);
    assert.equal(activity.recentRuns[0]?.action, 'retrain_now');
    assert.equal(activity.recentRuns[0]?.outcomeId, 'playbook_outcome:needs-attention');
    assert.equal(activity.recentRuns[1]?.action, 'review_now');
});

test('search learning ops playbook recommendation outcome recommendation outcomes classify review and retrain runs', () => {
    const outcomes = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes(
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity([
            {
                id: 'activity-1',
                type: 'review_entries',
                context: 'ops_playbook_recommendation_outcome_recommendation_review_playbook_outcome:ready-review',
                reviewedStatus: 'approved',
                count: 1,
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                actorUid: 'admin-a',
                createdAt: '2026-03-12T10:00:00.000Z',
            },
            {
                id: 'activity-2',
                type: 'generate_suggestions',
                context: 'ops_playbook_recommendation_outcome_recommendation_retrain_playbook_outcome:needs-attention',
                reviewedStatus: null,
                count: 1,
                entryIds: ['entry-2'],
                queries: ['트레이닝 팬츠'],
                actorUid: 'admin-b',
                createdAt: '2026-03-12T10:05:00.000Z',
            },
        ]).recentRuns,
        [
            {
                id: 'entry-1',
                query: '운동용 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T10:00:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 2,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
            {
                id: 'entry-2',
                query: '트레이닝 팬츠',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T09:00:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 2,
            },
        ]
    );

    assert.equal(outcomes.total, 2);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 1);
    assert.equal(outcomes.awaitingSamples, 0);
    assert.equal(outcomes.validated, 0);
    assert.equal(outcomes.topReadyReview[0]?.status, 'ready_review');
    assert.equal(outcomes.topNeedsAttention[0]?.status, 'needs_attention');
});

test('search learning ops playbook recommendation outcome recommendation outcome recommendations classify next actions', () => {
    const recommendations = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations({
        total: 4,
        readyReview: 1,
        needsAttention: 1,
        awaitingSamples: 1,
        validated: 1,
        topReadyReview: [
            {
                id: 'outcome-1',
                outcomeId: 'hoodie-review',
                title: 'Outcome Review',
                action: 'review_now',
                context: 'ctx:review',
                createdAt: '2026-03-12T10:10:00.000Z',
                queries: ['운동용 후드'],
                entryIds: ['entry-1'],
                status: 'ready_review',
                description: 'ready',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topNeedsAttention: [
            {
                id: 'outcome-2',
                outcomeId: 'pants-retrain',
                title: 'Outcome Retrain',
                action: 'retrain_now',
                context: 'ctx:retrain',
                createdAt: '2026-03-12T10:09:00.000Z',
                queries: ['트레이닝 팬츠'],
                entryIds: ['entry-2'],
                status: 'needs_attention',
                description: 'retrain',
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topAwaitingSamples: [
            {
                id: 'outcome-3',
                outcomeId: 'runner-awaiting',
                title: 'Outcome Awaiting',
                action: 'collect_samples',
                context: 'ctx:awaiting',
                createdAt: '2026-03-12T10:08:00.000Z',
                queries: ['러닝 자켓'],
                entryIds: ['entry-3'],
                status: 'awaiting_samples',
                description: 'awaiting',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 1,
                readyReviewCount: 0,
            },
        ],
        topValidated: [
            {
                id: 'outcome-4',
                outcomeId: 'validated',
                title: 'Outcome Validated',
                action: 'observe',
                context: 'ctx:validated',
                createdAt: '2026-03-12T10:07:00.000Z',
                queries: ['와이드 팬츠'],
                entryIds: ['entry-4'],
                status: 'validated',
                description: 'validated',
                improvedCount: 2,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(recommendations.total, 4);
    assert.equal(recommendations.reviewNow, 1);
    assert.equal(recommendations.retrainNow, 1);
    assert.equal(recommendations.collectSamples, 1);
    assert.equal(recommendations.observe, 1);
    assert.equal(recommendations.topReviewNow[0]?.action, 'review_now');
    assert.equal(recommendations.topRetrainNow[0]?.action, 'retrain_now');
});

test('search learning ops playbook recommendation outcome recommendation outcome recommendation queue prioritizes execute and review items', () => {
    const queue = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue({
        total: 4,
        reviewNow: 1,
        retrainNow: 1,
        collectSamples: 1,
        observe: 1,
        critical: 1,
        highPriority: 1,
        topReviewNow: [
            {
                id: 'recommendation-1',
                outcomeId: 'hoodie-review',
                title: 'Review Recommendation',
                description: 'review',
                reason: 'ready review',
                action: 'review_now',
                actionLabel: 'review 즉시 승인',
                priority: 'high',
                outcomeStatus: 'ready_review',
                createdAt: '2026-03-12T10:10:00.000Z',
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topRetrainNow: [
            {
                id: 'recommendation-2',
                outcomeId: 'pants-retrain',
                title: 'Retrain Recommendation',
                description: 'retrain',
                reason: 'needs attention',
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                priority: 'critical',
                outcomeStatus: 'needs_attention',
                createdAt: '2026-03-12T10:11:00.000Z',
                entryIds: ['entry-2'],
                queries: ['트레이닝 팬츠'],
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topCollectSamples: [
            {
                id: 'recommendation-3',
                outcomeId: 'runner-awaiting',
                title: 'Collect Samples Recommendation',
                description: 'awaiting',
                reason: 'samples',
                action: 'collect_samples',
                actionLabel: '표본 수집 대상 선택',
                priority: 'medium',
                outcomeStatus: 'awaiting_samples',
                createdAt: '2026-03-12T10:09:00.000Z',
                entryIds: ['entry-3'],
                queries: ['러닝 자켓'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 1,
                readyReviewCount: 0,
            },
        ],
        topObserve: [
            {
                id: 'recommendation-4',
                outcomeId: 'validated',
                title: 'Observe Recommendation',
                description: 'observe',
                reason: 'validated',
                action: 'observe',
                actionLabel: '개선 query 선택',
                priority: 'low',
                outcomeStatus: 'validated',
                createdAt: '2026-03-12T10:08:00.000Z',
                entryIds: ['entry-4'],
                queries: ['와이드 팬츠'],
                improvedCount: 2,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(queue.total, 4);
    assert.equal(queue.executeNow, 1);
    assert.equal(queue.needsReview, 1);
    assert.equal(queue.sampleCollection, 1);
    assert.equal(queue.observe, 1);
    assert.equal(queue.urgent, 2);
    assert.equal(queue.topExecuteNow[0]?.queueState, 'execute_now');
    assert.equal(queue.topNeedsReview[0]?.queueState, 'needs_review');
});

test('search learning ops completion summary collapses deepest queue into terminal state', () => {
    const queue = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue({
        total: 4,
        reviewNow: 1,
        retrainNow: 1,
        collectSamples: 1,
        observe: 1,
        critical: 1,
        highPriority: 1,
        topReviewNow: [
            {
                id: 'recommendation-1',
                outcomeId: 'hoodie-review',
                title: 'Review Recommendation',
                description: 'review',
                reason: 'ready review',
                action: 'review_now',
                actionLabel: 'review 즉시 승인',
                priority: 'high',
                outcomeStatus: 'ready_review',
                createdAt: '2026-03-12T10:10:00.000Z',
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topRetrainNow: [
            {
                id: 'recommendation-2',
                outcomeId: 'pants-retrain',
                title: 'Retrain Recommendation',
                description: 'retrain',
                reason: 'needs attention',
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                priority: 'critical',
                outcomeStatus: 'needs_attention',
                createdAt: '2026-03-12T10:11:00.000Z',
                entryIds: ['entry-2'],
                queries: ['트레이닝 팬츠'],
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topCollectSamples: [
            {
                id: 'recommendation-3',
                outcomeId: 'runner-awaiting',
                title: 'Collect Samples Recommendation',
                description: 'awaiting',
                reason: 'samples',
                action: 'collect_samples',
                actionLabel: '표본 수집 대상 선택',
                priority: 'medium',
                outcomeStatus: 'awaiting_samples',
                createdAt: '2026-03-12T10:09:00.000Z',
                entryIds: ['entry-3'],
                queries: ['러닝 자켓'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 1,
                readyReviewCount: 0,
            },
        ],
        topObserve: [
            {
                id: 'recommendation-4',
                outcomeId: 'validated',
                title: 'Observe Recommendation',
                description: 'observe',
                reason: 'validated',
                action: 'observe',
                actionLabel: '개선 query 선택',
                priority: 'low',
                outcomeStatus: 'validated',
                createdAt: '2026-03-12T10:08:00.000Z',
                entryIds: ['entry-4'],
                queries: ['와이드 팬츠'],
                improvedCount: 2,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    const outcomes = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes(
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity([
            {
                id: 'activity-1',
                type: 'review_entries',
                context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_outcome:ready-review',
                reviewedStatus: 'approved',
                count: 1,
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                actorUid: 'admin-a',
                createdAt: '2026-03-12T10:20:00.000Z',
            },
            {
                id: 'activity-2',
                type: 'generate_suggestions',
                context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_outcome:needs-attention',
                reviewedStatus: null,
                count: 1,
                entryIds: ['entry-2'],
                queries: ['트레이닝 팬츠'],
                actorUid: 'admin-b',
                createdAt: '2026-03-12T10:25:00.000Z',
            },
        ]).recentRuns,
        [
            {
                id: 'entry-1',
                query: '운동용 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T10:20:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 2,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
            {
                id: 'entry-2',
                query: '트레이닝 팬츠',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T09:00:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 2,
            },
        ]
    );

    const activity = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity([
        {
            id: 'activity-1',
            type: 'review_entries',
            context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_outcome:review',
            reviewedStatus: 'approved',
            count: 2,
            entryIds: ['entry-1', 'entry-2'],
            queries: ['운동용 후드', '남자 후드'],
            actorUid: 'admin-a',
            createdAt: '2026-03-12T10:20:00.000Z',
        },
        {
            id: 'activity-2',
            type: 'generate_suggestions',
            context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_outcome:retrain',
            reviewedStatus: null,
            count: 1,
            entryIds: ['entry-3'],
            queries: ['트레이닝 팬츠', '조거 팬츠'],
            actorUid: 'admin-b',
            createdAt: '2026-03-12T10:25:00.000Z',
        },
    ]);

    const summary = buildSearchLearningOpsCompletionSummary(queue, outcomes, activity);

    assert.equal(summary.state, 'action_required');
    assert.equal(summary.immediateCount, 2);
    assert.equal(summary.sampleCollection, 1);
    assert.equal(summary.observe, 1);
    assert.equal(summary.validated, 0);
    assert.equal(summary.recentRuns, 2);
    assert.equal(summary.topImmediate.length, 2);
    assert.equal(summary.topImmediate[0]?.recommendationId, 'recommendation-2');
    assert.equal(summary.topImmediate[1]?.recommendationId, 'recommendation-1');
});

test('search learning ops completion actions collapse terminal states into batch actions', () => {
    const actions = buildSearchLearningOpsCompletionActions({
        state: 'action_required',
        total: 4,
        executeNow: 1,
        needsReview: 1,
        sampleCollection: 1,
        observe: 1,
        validated: 1,
        recentRuns: 2,
        stableSignals: 2,
        immediateCount: 2,
        topImmediate: [
            {
                id: 'completion-1',
                recommendationId: 'recommendation-1',
                title: 'Immediate Execute',
                description: 'execute',
                reason: 'execute reason',
                state: 'action_required',
                priority: 'critical',
                actionLabel: '즉시 AI 제안',
                queueState: 'execute_now',
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                createdAt: '2026-03-12T10:10:00.000Z',
                outcomeStatus: 'needs_attention',
            },
            {
                id: 'completion-2',
                recommendationId: 'recommendation-2',
                title: 'Immediate Review',
                description: 'review',
                reason: 'review reason',
                state: 'review_required',
                priority: 'high',
                actionLabel: '즉시 승인',
                queueState: 'needs_review',
                entryIds: ['entry-2'],
                queries: ['남자 후드'],
                createdAt: '2026-03-12T10:09:00.000Z',
                outcomeStatus: 'ready_review',
            },
        ],
        topSampling: [
            {
                id: 'completion-3',
                recommendationId: 'recommendation-3',
                title: 'Sampling',
                description: 'sampling',
                reason: 'sampling reason',
                state: 'sampling',
                priority: 'medium',
                actionLabel: '표본 수집 대상 선택',
                queueState: 'sample_collection',
                entryIds: ['entry-3'],
                queries: ['러닝 자켓'],
                createdAt: '2026-03-12T10:08:00.000Z',
                outcomeStatus: 'awaiting_samples',
            },
        ],
        topObserve: [
            {
                id: 'completion-4',
                recommendationId: 'recommendation-4',
                title: 'Observe',
                description: 'observe',
                reason: 'observe reason',
                state: 'monitoring',
                priority: 'low',
                actionLabel: '개선 query 선택',
                queueState: 'observe',
                entryIds: ['entry-4'],
                queries: ['와이드 팬츠'],
                createdAt: '2026-03-12T10:07:00.000Z',
                outcomeStatus: 'validated',
            },
        ],
    });

    assert.equal(actions.total, 4);
    assert.equal(actions.executeNow, 1);
    assert.equal(actions.reviewNow, 1);
    assert.equal(actions.collectSamples, 1);
    assert.equal(actions.observeNow, 1);
    assert.equal(actions.critical, 0);
    assert.equal(actions.highPriority, 2);
    assert.equal(actions.topActions[0]?.type, 'execute_now');
    assert.equal(actions.topActions[1]?.type, 'review_now');
});

test('search learning ops completion queue prioritizes execute and review actions first', () => {
    const queue = buildSearchLearningOpsCompletionQueue({
        total: 4,
        executeNow: 1,
        reviewNow: 1,
        collectSamples: 1,
        observeNow: 1,
        critical: 1,
        highPriority: 1,
        topActions: [
            {
                id: 'action-execute',
                type: 'execute_now',
                title: 'Execute Hoodie Retrain',
                description: 'execute',
                reason: 'hoodie retrain',
                priority: 'critical',
                actionLabel: '즉시 AI 제안',
                state: 'action_required',
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                recommendationIds: ['rec-1'],
                queryCount: 1,
            },
            {
                id: 'action-review',
                type: 'review_now',
                title: 'Review Hoodie Approval',
                description: 'review',
                reason: 'hoodie review',
                priority: 'high',
                actionLabel: '즉시 승인',
                state: 'review_required',
                entryIds: ['entry-2'],
                queries: ['남자 후드'],
                recommendationIds: ['rec-2'],
                queryCount: 1,
            },
            {
                id: 'action-sample',
                type: 'collect_samples',
                title: 'Sample Runner Jacket',
                description: 'sample',
                reason: 'runner jacket sample',
                priority: 'medium',
                actionLabel: '표본 수집 대상 선택',
                state: 'sampling',
                entryIds: ['entry-3'],
                queries: ['러닝 자켓'],
                recommendationIds: ['rec-3'],
                queryCount: 1,
            },
            {
                id: 'action-observe',
                type: 'observe_now',
                title: 'Observe Wide Pants',
                description: 'observe',
                reason: 'wide pants stable',
                priority: 'low',
                actionLabel: '개선 query 선택',
                state: 'monitoring',
                entryIds: ['entry-4'],
                queries: ['와이드 팬츠'],
                recommendationIds: ['rec-4'],
                queryCount: 1,
            },
        ],
        topExecuteNow: [],
        topReviewNow: [],
        topCollectSamples: [],
        topObserveNow: [],
    });

    assert.equal(queue.total, 4);
    assert.equal(queue.urgent, 2);
    assert.equal(queue.topItems[0]?.queueState, 'execute_now');
    assert.equal(queue.topItems[1]?.queueState, 'needs_review');
    assert.equal(queue.topItems[2]?.queueState, 'sample_collection');
    assert.equal(queue.topItems[3]?.queueState, 'observe');
});

test('search learning ops completion activity tracks execute and review runs', () => {
    const activity = buildSearchLearningOpsCompletionActivity([
        {
            id: 'activity-1',
            type: 'generate_suggestions',
            context: 'completion_execute_generate',
            reviewedStatus: null,
            actorUid: 'admin-1',
            count: 2,
            entryIds: ['entry-1', 'entry-2'],
            queries: ['운동용 후드', '남자 후드'],
            createdAt: '2026-03-12T10:40:00.000Z',
        },
        {
            id: 'activity-2',
            type: 'review_entries',
            context: 'completion_review_approve',
            reviewedStatus: 'approved',
            actorUid: 'admin-2',
            count: 1,
            entryIds: ['entry-3'],
            queries: ['러닝 자켓'],
            createdAt: '2026-03-12T10:41:00.000Z',
        },
        {
            id: 'activity-3',
            type: 'generate_suggestions',
            context: 'other_context',
            reviewedStatus: null,
            actorUid: 'admin-3',
            count: 1,
            entryIds: ['entry-4'],
            queries: ['와이드 팬츠'],
            createdAt: '2026-03-12T10:42:00.000Z',
        },
    ]);

    assert.equal(activity.totalRuns, 2);
    assert.equal(activity.executeRuns, 1);
    assert.equal(activity.reviewRuns, 1);
    assert.equal(activity.uniqueQueries, 3);
    assert.equal(activity.recentRuns[0]?.action, 'review_now');
    assert.equal(activity.recentRuns[1]?.action, 'execute_now');
});

test('search learning ops completion outcomes classify review and retrain follow-ups', () => {
    const outcomes = buildSearchLearningOpsCompletionOutcomes(
        [
            {
                id: 'run-1',
                action: 'execute_now',
                title: 'Completion Execute Run',
                description: 'execute',
                actionLabel: '즉시 AI 제안',
                priority: 'high',
                context: 'completion_execute_generate',
                count: 1,
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                actorUid: 'admin-1',
                createdAt: '2026-03-12T10:40:00.000Z',
            },
            {
                id: 'run-2',
                action: 'review_now',
                title: 'Completion Review Run',
                description: 'review',
                actionLabel: '즉시 승인',
                priority: 'critical',
                context: 'completion_review_approve',
                count: 1,
                entryIds: ['entry-2'],
                queries: ['트레이닝 팬츠'],
                actorUid: 'admin-2',
                createdAt: '2026-03-12T10:41:00.000Z',
            },
        ],
        [
            {
                id: 'entry-1',
                query: '운동용 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '후드집업',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T10:42:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
            {
                id: 'entry-2',
                query: '트레이닝 팬츠',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T09:00:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 2,
            },
        ]
    );

    assert.equal(outcomes.total, 2);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 1);
    assert.equal(outcomes.awaitingSamples, 0);
    assert.equal(outcomes.validated, 0);
    assert.equal(outcomes.topReadyReview[0]?.status, 'ready_review');
    assert.equal(outcomes.topNeedsAttention[0]?.status, 'needs_attention');
});

test('search learning ops completion recommendations classify review, retrain, sample, and observe follow-ups', () => {
    const recommendations = buildSearchLearningOpsCompletionRecommendations({
        total: 4,
        readyReview: 1,
        needsAttention: 1,
        awaitingSamples: 1,
        validated: 1,
        topReadyReview: [
            {
                id: 'completion_outcome:review',
                runId: 'run-review',
                title: 'Completion Review Outcome',
                action: 'review_now',
                context: 'completion_review_approve',
                createdAt: '2026-03-12T10:50:00.000Z',
                queries: ['운동용 후드'],
                entryIds: ['entry-review'],
                status: 'ready_review',
                description: 'review ready',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topNeedsAttention: [
            {
                id: 'completion_outcome:retrain',
                runId: 'run-retrain',
                title: 'Completion Retrain Outcome',
                action: 'execute_now',
                context: 'completion_execute_generate',
                createdAt: '2026-03-12T10:49:00.000Z',
                queries: ['트레이닝 팬츠'],
                entryIds: ['entry-retrain'],
                status: 'needs_attention',
                description: 'needs attention',
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topAwaitingSamples: [
            {
                id: 'completion_outcome:samples',
                runId: 'run-samples',
                title: 'Completion Sample Outcome',
                action: 'execute_now',
                context: 'completion_collect',
                createdAt: '2026-03-12T10:48:00.000Z',
                queries: ['러닝 자켓'],
                entryIds: ['entry-samples'],
                status: 'awaiting_samples',
                description: 'awaiting samples',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 2,
                readyReviewCount: 0,
            },
        ],
        topValidated: [
            {
                id: 'completion_outcome:observe',
                runId: 'run-observe',
                title: 'Completion Observe Outcome',
                action: 'review_now',
                context: 'completion_observe',
                createdAt: '2026-03-12T10:47:00.000Z',
                queries: ['와이드 팬츠'],
                entryIds: ['entry-observe'],
                status: 'validated',
                description: 'validated',
                improvedCount: 3,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(recommendations.total, 4);
    assert.equal(recommendations.reviewNow, 1);
    assert.equal(recommendations.retrainNow, 1);
    assert.equal(recommendations.collectSamples, 1);
    assert.equal(recommendations.observe, 1);
    assert.equal(recommendations.topReviewNow[0]?.action, 'review_now');
    assert.equal(recommendations.topRetrainNow[0]?.action, 'retrain_now');
    assert.equal(recommendations.topCollectSamples[0]?.action, 'collect_samples');
    assert.equal(recommendations.topObserve[0]?.action, 'observe');
});

test('search learning ops completion recommendation queue prioritizes execute and review items', () => {
    const queue = buildSearchLearningOpsCompletionRecommendationQueue({
        total: 4,
        reviewNow: 1,
        retrainNow: 1,
        collectSamples: 1,
        observe: 1,
        critical: 1,
        highPriority: 1,
        topReviewNow: [
            {
                id: 'completion_recommendation:review',
                outcomeId: 'completion_outcome:review',
                title: 'Completion Review Recommendation',
                description: 'review pending',
                reason: '1 review pending',
                action: 'review_now',
                actionLabel: 'review 즉시 승인',
                priority: 'high',
                outcomeStatus: 'ready_review',
                createdAt: '2026-03-12T10:55:00.000Z',
                entryIds: ['entry-review'],
                queries: ['운동용 후드'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topRetrainNow: [
            {
                id: 'completion_recommendation:retrain',
                outcomeId: 'completion_outcome:retrain',
                title: 'Completion Retrain Recommendation',
                description: 'retrain',
                reason: '2 no improvement',
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                priority: 'critical',
                outcomeStatus: 'needs_attention',
                createdAt: '2026-03-12T10:56:00.000Z',
                entryIds: ['entry-retrain'],
                queries: ['트레이닝 팬츠'],
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topCollectSamples: [
            {
                id: 'completion_recommendation:samples',
                outcomeId: 'completion_outcome:samples',
                title: 'Completion Sample Recommendation',
                description: 'samples',
                reason: 'awaiting samples',
                action: 'collect_samples',
                actionLabel: '표본 수집 대상 선택',
                priority: 'medium',
                outcomeStatus: 'awaiting_samples',
                createdAt: '2026-03-12T10:54:00.000Z',
                entryIds: ['entry-samples'],
                queries: ['러닝 자켓'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 2,
                readyReviewCount: 0,
            },
        ],
        topObserve: [
            {
                id: 'completion_recommendation:observe',
                outcomeId: 'completion_outcome:observe',
                title: 'Completion Observe Recommendation',
                description: 'observe',
                reason: 'validated',
                action: 'observe',
                actionLabel: '개선 query 선택',
                priority: 'low',
                outcomeStatus: 'validated',
                createdAt: '2026-03-12T10:53:00.000Z',
                entryIds: ['entry-observe'],
                queries: ['와이드 팬츠'],
                improvedCount: 3,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(queue.total, 4);
    assert.equal(queue.executeNow, 1);
    assert.equal(queue.needsReview, 1);
    assert.equal(queue.sampleCollection, 1);
    assert.equal(queue.observe, 1);
    assert.equal(queue.urgent, 2);
    assert.equal(queue.topExecuteNow[0]?.action, 'retrain_now');
    assert.equal(queue.topNeedsReview[0]?.action, 'review_now');
});

test('search learning ops completion recommendation activity tracks review and retrain executions', () => {
    const activity = buildSearchLearningOpsCompletionRecommendationActivity([
        {
            id: 'activity-review',
            type: 'review_entries',
            context: 'completion_recommendation_review_completion_outcome:review',
            reviewedStatus: 'approved',
            count: 2,
            entryIds: ['entry-1', 'entry-2'],
            queries: ['운동용 후드', '남자 후드'],
            actorUid: 'admin-a',
            createdAt: '2026-03-12T11:10:00.000Z',
        },
        {
            id: 'activity-retrain',
            type: 'generate_suggestions',
            context: 'completion_recommendation_retrain_completion_outcome:retrain',
            reviewedStatus: null,
            count: 1,
            entryIds: ['entry-3'],
            queries: ['트레이닝 팬츠', '조거 팬츠'],
            actorUid: 'admin-b',
            createdAt: '2026-03-12T11:12:00.000Z',
        },
    ]);

    assert.equal(activity.totalRuns, 2);
    assert.equal(activity.reviewRuns, 1);
    assert.equal(activity.retrainRuns, 1);
    assert.equal(activity.uniqueQueries, 4);
    assert.equal(activity.recentRuns[0]?.action, 'retrain_now');
    assert.equal(activity.recentRuns[1]?.action, 'review_now');
});

test('search learning ops completion recommendation outcomes classify ready review and needs attention states', () => {
    const outcomes = buildSearchLearningOpsCompletionRecommendationOutcomes(
        [
            {
                id: 'activity-review',
                outcomeId: 'completion_outcome:review',
                action: 'review_now',
                title: 'Completion Recommendation Review Run',
                description: 'review',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
                context: 'completion_recommendation_review_completion_outcome:review',
                count: 1,
                entryIds: ['entry-ready'],
                queries: ['운동용 후드'],
                actorUid: 'admin-a',
                createdAt: '2026-03-12T11:20:00.000Z',
            },
            {
                id: 'activity-retrain',
                outcomeId: 'completion_outcome:retrain',
                action: 'retrain_now',
                title: 'Completion Recommendation Retrain Run',
                description: 'retrain',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
                context: 'completion_recommendation_retrain_completion_outcome:retrain',
                count: 1,
                entryIds: ['entry-attention'],
                queries: ['트레이닝 팬츠'],
                actorUid: 'admin-b',
                createdAt: '2026-03-12T11:25:00.000Z',
            },
        ],
        [
            {
                id: 'entry-ready',
                query: '운동용 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업', '트레이닝 후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T11:19:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 1,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
            {
                id: 'entry-attention',
                query: '트레이닝 팬츠',
                status: 'approved',
                aiSuggestion: {
                    normalizedQuery: '트레이닝 팬츠',
                    categoryHint: '트랙 팬츠',
                    suggestedQueries: ['트랙 팬츠'],
                    rationale: 'track pants',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T11:24:00.000Z',
                },
                approvalBaseline: {
                    approvedAt: '2026-03-12T10:00:00.000Z',
                    occurrenceCount: 5,
                    lowFitCount: 1,
                    zeroResultCount: 0,
                },
                occurrenceCount: 7,
                lowFitCount: 3,
                zeroResultCount: 2,
            },
        ]
    );

    assert.equal(outcomes.total, 2);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 1);
    assert.equal(outcomes.awaitingSamples, 0);
    assert.equal(outcomes.validated, 0);
    assert.equal(outcomes.topReadyReview[0]?.status, 'ready_review');
    assert.equal(outcomes.topNeedsAttention[0]?.status, 'needs_attention');
});

test('search learning ops completion recommendation outcome recommendations classify next actions', () => {
    const recommendations = buildSearchLearningOpsCompletionRecommendationOutcomeRecommendations({
        total: 4,
        readyReview: 1,
        needsAttention: 1,
        awaitingSamples: 1,
        validated: 1,
        topReadyReview: [
            {
                id: 'completion-reco-outcome-ready',
                activityId: 'activity-ready',
                title: 'Completion Recommendation Outcome Ready',
                action: 'review_now',
                context: 'completion_recommendation_review_ready',
                createdAt: '2026-03-12T12:00:00.000Z',
                queries: ['운동용 후드'],
                entryIds: ['entry-ready'],
                status: 'ready_review',
                description: 'ready',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 2,
            },
        ],
        topNeedsAttention: [
            {
                id: 'completion-reco-outcome-attention',
                activityId: 'activity-attention',
                title: 'Completion Recommendation Outcome Attention',
                action: 'retrain_now',
                context: 'completion_recommendation_retrain_attention',
                createdAt: '2026-03-12T12:02:00.000Z',
                queries: ['트레이닝 팬츠'],
                entryIds: ['entry-attention'],
                status: 'needs_attention',
                description: 'attention',
                improvedCount: 0,
                noImprovementCount: 3,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topAwaitingSamples: [
            {
                id: 'completion-reco-outcome-awaiting',
                activityId: 'activity-awaiting',
                title: 'Completion Recommendation Outcome Awaiting',
                action: 'retrain_now',
                context: 'completion_recommendation_retrain_awaiting',
                createdAt: '2026-03-12T12:03:00.000Z',
                queries: ['러닝 자켓'],
                entryIds: ['entry-awaiting'],
                status: 'awaiting_samples',
                description: 'awaiting',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 2,
                readyReviewCount: 0,
            },
        ],
        topValidated: [
            {
                id: 'completion-reco-outcome-validated',
                activityId: 'activity-validated',
                title: 'Completion Recommendation Outcome Validated',
                action: 'review_now',
                context: 'completion_recommendation_review_validated',
                createdAt: '2026-03-12T12:04:00.000Z',
                queries: ['와이드 팬츠'],
                entryIds: ['entry-validated'],
                status: 'validated',
                description: 'validated',
                improvedCount: 3,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(recommendations.total, 4);
    assert.equal(recommendations.reviewNow, 1);
    assert.equal(recommendations.retrainNow, 1);
    assert.equal(recommendations.collectSamples, 1);
    assert.equal(recommendations.observe, 1);
    assert.equal(recommendations.topReviewNow[0]?.action, 'review_now');
    assert.equal(recommendations.topRetrainNow[0]?.action, 'retrain_now');
});

test('search learning ops completion recommendation outcome recommendation queue prioritizes execute and review items', () => {
    const queue = buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueue({
        total: 4,
        reviewNow: 1,
        retrainNow: 1,
        collectSamples: 1,
        observe: 1,
        critical: 2,
        highPriority: 1,
        topReviewNow: [
            {
                id: 'completion-reco-outcome-recommendation-review',
                outcomeId: 'completion-reco-outcome-ready',
                title: 'Completion Recommendation Outcome Review',
                description: 'review',
                reason: 'ready',
                action: 'review_now',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
                outcomeStatus: 'ready_review',
                createdAt: '2026-03-12T12:10:00.000Z',
                entryIds: ['entry-review'],
                queries: ['운동용 후드'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 2,
            },
        ],
        topRetrainNow: [
            {
                id: 'completion-reco-outcome-recommendation-retrain',
                outcomeId: 'completion-reco-outcome-attention',
                title: 'Completion Recommendation Outcome Retrain',
                description: 'retrain',
                reason: 'attention',
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                priority: 'critical',
                outcomeStatus: 'needs_attention',
                createdAt: '2026-03-12T12:11:00.000Z',
                entryIds: ['entry-retrain'],
                queries: ['트레이닝 팬츠'],
                improvedCount: 0,
                noImprovementCount: 3,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topCollectSamples: [
            {
                id: 'completion-reco-outcome-recommendation-samples',
                outcomeId: 'completion-reco-outcome-awaiting',
                title: 'Completion Recommendation Outcome Samples',
                description: 'samples',
                reason: 'awaiting',
                action: 'collect_samples',
                actionLabel: '표본 수집 대상 선택',
                priority: 'medium',
                outcomeStatus: 'awaiting_samples',
                createdAt: '2026-03-12T12:12:00.000Z',
                entryIds: ['entry-samples'],
                queries: ['러닝 자켓'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 2,
                readyReviewCount: 0,
            },
        ],
        topObserve: [
            {
                id: 'completion-reco-outcome-recommendation-observe',
                outcomeId: 'completion-reco-outcome-validated',
                title: 'Completion Recommendation Outcome Observe',
                description: 'observe',
                reason: 'validated',
                action: 'observe',
                actionLabel: '개선 query 선택',
                priority: 'low',
                outcomeStatus: 'validated',
                createdAt: '2026-03-12T12:13:00.000Z',
                entryIds: ['entry-observe'],
                queries: ['와이드 팬츠'],
                improvedCount: 3,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(queue.total, 4);
    assert.equal(queue.executeNow, 1);
    assert.equal(queue.needsReview, 1);
    assert.equal(queue.sampleCollection, 1);
    assert.equal(queue.observe, 1);
    assert.equal(queue.urgent, 2);
    assert.equal(queue.topExecuteNow[0]?.action, 'retrain_now');
    assert.equal(queue.topNeedsReview[0]?.action, 'review_now');
});

test('search learning ops completion recommendation outcome recommendation activity tracks review and retrain executions', () => {
    const summary = buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationActivity([
        {
            id: 'activity_review',
            type: 'review_entries',
            entryIds: ['entry_review'],
            queries: ['남자 후드'],
            reviewedStatus: null,
            count: 1,
            actorUid: 'admin_review',
            createdAt: '2026-03-14T10:00:00.000Z',
            context: 'completion_recommendation_outcome_review_completion_recommendation_outcome:run_review',
        },
        {
            id: 'activity_retrain',
            type: 'generate_suggestions',
            entryIds: ['entry_retrain'],
            queries: ['운동용 후드', '트레이닝 후디'],
            reviewedStatus: null,
            count: 2,
            actorUid: 'admin_retrain',
            createdAt: '2026-03-14T10:05:00.000Z',
            context: 'completion_recommendation_outcome_retrain_completion_recommendation_outcome:run_retrain',
        },
    ]);

    assert.equal(summary.totalRuns, 2);
    assert.equal(summary.reviewRuns, 1);
    assert.equal(summary.retrainRuns, 1);
    assert.equal(summary.uniqueQueries, 3);
    assert.equal(summary.recentRuns[0]?.action, 'retrain_now');
    assert.equal(summary.recentRuns[1]?.action, 'review_now');
});

test('search learning ops completion recommendation outcome recommendation outcomes classify review and retrain runs', () => {
    const outcomes = buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes(
        [
            {
                id: 'run-review',
                outcomeId: 'outcome-review',
                action: 'review_now',
                title: 'Completion Outcome Recommendation Review Run',
                description: 'review run',
                actionLabel: 'review 즉시 승인',
                priority: 'critical',
                context: 'completion_recommendation_outcome_review_outcome-review',
                count: 1,
                entryIds: ['entry-ready'],
                queries: ['운동용 후드'],
                actorUid: 'admin-review',
                createdAt: '2026-03-14T11:00:00.000Z',
            },
            {
                id: 'run-retrain',
                outcomeId: 'outcome-retrain',
                action: 'retrain_now',
                title: 'Completion Outcome Recommendation Retrain Run',
                description: 'retrain run',
                actionLabel: '재학습 AI 제안',
                priority: 'high',
                context: 'completion_recommendation_outcome_retrain_outcome-retrain',
                count: 1,
                entryIds: ['entry-attention'],
                queries: ['남자 후드'],
                actorUid: 'admin-retrain',
                createdAt: '2026-03-14T11:05:00.000Z',
            },
        ],
        [
            {
                id: 'entry-ready',
                query: '운동용 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: 'ready',
                    model: 'heuristic',
                    generatedAt: '2026-03-14T10:59:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 3,
                lowFitCount: 2,
                zeroResultCount: 1,
            },
            {
                id: 'entry-attention',
                query: '남자 후드',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-14T10:50:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 2,
            },
        ]
    );

    assert.equal(outcomes.total, 2);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 1);
    assert.equal(outcomes.awaitingSamples, 0);
    assert.equal(outcomes.validated, 0);
    assert.equal(outcomes.topReadyReview[0]?.status, 'ready_review');
    assert.equal(outcomes.topNeedsAttention[0]?.status, 'needs_attention');
});

test('search learning ops completion recommendation outcome recommendation outcome recommendations classify next actions', () => {
    const recommendations = buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations({
        total: 4,
        readyReview: 1,
        needsAttention: 1,
        awaitingSamples: 1,
        validated: 1,
        topReadyReview: [
            {
                id: 'outcome-1',
                outcomeId: 'hoodie-review',
                title: 'Completion Outcome Recommendation Outcome Review',
                action: 'review_now',
                context: 'ctx:review',
                createdAt: '2026-03-12T10:30:00.000Z',
                queries: ['운동용 후드'],
                entryIds: ['entry-1'],
                status: 'ready_review',
                description: 'ready',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topNeedsAttention: [
            {
                id: 'outcome-2',
                outcomeId: 'pants-retrain',
                title: 'Completion Outcome Recommendation Outcome Retrain',
                action: 'retrain_now',
                context: 'ctx:retrain',
                createdAt: '2026-03-12T10:29:00.000Z',
                queries: ['트레이닝 팬츠'],
                entryIds: ['entry-2'],
                status: 'needs_attention',
                description: 'retrain',
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topAwaitingSamples: [
            {
                id: 'outcome-3',
                outcomeId: 'runner-awaiting',
                title: 'Completion Outcome Recommendation Outcome Samples',
                action: 'collect_samples',
                context: 'ctx:awaiting',
                createdAt: '2026-03-12T10:28:00.000Z',
                queries: ['러닝 자켓'],
                entryIds: ['entry-3'],
                status: 'awaiting_samples',
                description: 'awaiting',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 1,
                readyReviewCount: 0,
            },
        ],
        topValidated: [
            {
                id: 'outcome-4',
                outcomeId: 'validated',
                title: 'Completion Outcome Recommendation Outcome Observe',
                action: 'observe',
                context: 'ctx:validated',
                createdAt: '2026-03-12T10:27:00.000Z',
                queries: ['와이드 팬츠'],
                entryIds: ['entry-4'],
                status: 'validated',
                description: 'validated',
                improvedCount: 2,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(recommendations.total, 4);
    assert.equal(recommendations.reviewNow, 1);
    assert.equal(recommendations.retrainNow, 1);
    assert.equal(recommendations.collectSamples, 1);
    assert.equal(recommendations.observe, 1);
    assert.equal(recommendations.topReviewNow[0]?.action, 'review_now');
    assert.equal(recommendations.topRetrainNow[0]?.action, 'retrain_now');
});

test('search learning ops completion recommendation outcome recommendation outcome recommendation queue prioritizes execute and review items', () => {
    const queue = buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue({
        total: 4,
        reviewNow: 1,
        retrainNow: 1,
        collectSamples: 1,
        observe: 1,
        critical: 1,
        highPriority: 1,
        topReviewNow: [
            {
                id: 'reco-1',
                outcomeId: 'hoodie-review',
                title: 'Outcome Recommendation Outcome Recommendation Review',
                description: 'review',
                reason: 'review reason',
                action: 'review_now',
                actionLabel: 'review 즉시 승인',
                priority: 'high',
                outcomeStatus: 'ready_review',
                createdAt: '2026-03-12T10:30:00.000Z',
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topRetrainNow: [
            {
                id: 'reco-2',
                outcomeId: 'pants-retrain',
                title: 'Outcome Recommendation Outcome Recommendation Retrain',
                description: 'retrain',
                reason: 'retrain reason',
                action: 'retrain_now',
                actionLabel: '재학습 AI 제안',
                priority: 'critical',
                outcomeStatus: 'needs_attention',
                createdAt: '2026-03-12T10:29:00.000Z',
                entryIds: ['entry-2'],
                queries: ['트레이닝 팬츠'],
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topCollectSamples: [
            {
                id: 'reco-3',
                outcomeId: 'runner-awaiting',
                title: 'Outcome Recommendation Outcome Recommendation Samples',
                description: 'samples',
                reason: 'samples reason',
                action: 'collect_samples',
                actionLabel: '표본 수집 대상 선택',
                priority: 'medium',
                outcomeStatus: 'awaiting_samples',
                createdAt: '2026-03-12T10:28:00.000Z',
                entryIds: ['entry-3'],
                queries: ['러닝 자켓'],
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 1,
                readyReviewCount: 0,
            },
        ],
        topObserve: [
            {
                id: 'reco-4',
                outcomeId: 'validated',
                title: 'Outcome Recommendation Outcome Recommendation Observe',
                description: 'observe',
                reason: 'observe reason',
                action: 'observe',
                actionLabel: '개선 query 선택',
                priority: 'low',
                outcomeStatus: 'validated',
                createdAt: '2026-03-12T10:27:00.000Z',
                entryIds: ['entry-4'],
                queries: ['와이드 팬츠'],
                improvedCount: 2,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(queue.total, 4);
    assert.equal(queue.executeNow, 1);
    assert.equal(queue.needsReview, 1);
    assert.equal(queue.sampleCollection, 1);
    assert.equal(queue.observe, 1);
    assert.equal(queue.urgent, 2);
    assert.equal(queue.topExecuteNow[0]?.queueState, 'execute_now');
    assert.equal(queue.topNeedsReview[0]?.queueState, 'needs_review');
});

test('search learning ops completion recommendation outcome recommendation outcome recommendation activity tracks review and retrain executions', () => {
    const activity = buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity([
        {
            id: 'activity-1',
            type: 'review_entries',
            context: 'completion_recommendation_outcome_recommendation_outcome_review_outcome:review',
            reviewedStatus: 'approved',
            count: 2,
            entryIds: ['entry-1', 'entry-2'],
            queries: ['운동용 후드', '남자 후드'],
            actorUid: 'admin-a',
            createdAt: '2026-03-12T10:20:00.000Z',
        },
        {
            id: 'activity-2',
            type: 'generate_suggestions',
            context: 'completion_recommendation_outcome_recommendation_outcome_retrain_outcome:retrain',
            reviewedStatus: null,
            count: 1,
            entryIds: ['entry-3'],
            queries: ['트레이닝 팬츠', '조거 팬츠'],
            actorUid: 'admin-b',
            createdAt: '2026-03-12T10:25:00.000Z',
        },
    ]);

    assert.equal(activity.totalRuns, 2);
    assert.equal(activity.reviewRuns, 1);
    assert.equal(activity.retrainRuns, 1);
    assert.equal(activity.uniqueQueries, 4);
    assert.equal(activity.recentRuns[0]?.action, 'retrain_now');
    assert.equal(activity.recentRuns[0]?.outcomeId, 'outcome:retrain');
    assert.equal(activity.recentRuns[1]?.action, 'review_now');
});

test('search learning ops completion recommendation outcome recommendation outcome recommendation outcomes classify review, retrain and validated follow-ups', () => {
    const outcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes(
            [
                {
                    id: 'activity-ready',
                    outcomeId: 'outcome:review',
                    action: 'review_now',
                    title: 'Outcome Recommendation Outcome Recommendation Outcome Review',
                    description: 'review run',
                    actionLabel: 'review 즉시 승인',
                    priority: 'critical',
                    context: 'completion_recommendation_outcome_recommendation_outcome_review_outcome:review',
                    count: 2,
                    entryIds: ['draft-entry', 'approved-entry'],
                    queries: ['운동용 후드', '러닝 자켓'],
                    actorUid: 'admin-a',
                    createdAt: '2026-03-12T10:30:00.000Z',
                },
                {
                    id: 'activity-retrain',
                    outcomeId: 'outcome:retrain',
                    action: 'retrain_now',
                    title: 'Outcome Recommendation Outcome Recommendation Outcome Retrain',
                    description: 'retrain run',
                    actionLabel: '재학습 AI 제안',
                    priority: 'high',
                    context: 'completion_recommendation_outcome_recommendation_outcome_retrain_outcome:retrain',
                    count: 1,
                    entryIds: ['regressed-entry'],
                    queries: ['트레이닝 팬츠'],
                    actorUid: 'admin-b',
                    createdAt: '2026-03-12T10:35:00.000Z',
                },
            ],
            [
                {
                    id: 'draft-entry',
                    query: '운동용 후드',
                    status: 'pending',
                    occurrenceCount: 2,
                    lowFitCount: 2,
                    zeroResultCount: 1,
                    aiSuggestion: {
                        normalizedQuery: '운동용 후드',
                        categoryHint: '후드집업',
                        suggestedQueries: ['후드집업'],
                        rationale: '후드집업으로 확장',
                        model: 'heuristic',
                        generatedAt: '2026-03-12T10:28:00.000Z',
                    },
                    approvalBaseline: null,
                },
                {
                    id: 'approved-entry',
                    query: '러닝 자켓',
                    status: 'approved',
                    occurrenceCount: 3,
                    lowFitCount: 1,
                    zeroResultCount: 0,
                    aiSuggestion: {
                        normalizedQuery: '러닝 자켓',
                        categoryHint: '러닝 재킷',
                        suggestedQueries: ['러닝 재킷'],
                        rationale: '러닝 재킷으로 정규화',
                        model: 'heuristic',
                        generatedAt: '2026-03-12T10:29:00.000Z',
                    },
                    approvalBaseline: {
                        approvedAt: '2026-03-12T10:20:00.000Z',
                        occurrenceCount: 1,
                        lowFitCount: 1,
                        zeroResultCount: 0,
                    },
                },
                {
                    id: 'regressed-entry',
                    query: '트레이닝 팬츠',
                    status: 'approved',
                    occurrenceCount: 4,
                    lowFitCount: 3,
                    zeroResultCount: 2,
                    aiSuggestion: {
                        normalizedQuery: '트레이닝 팬츠',
                        categoryHint: '조거 팬츠',
                        suggestedQueries: ['조거 팬츠'],
                        rationale: '조거 팬츠로 확장',
                        model: 'heuristic',
                        generatedAt: '2026-03-12T10:31:00.000Z',
                    },
                    approvalBaseline: {
                        approvedAt: '2026-03-12T10:15:00.000Z',
                        occurrenceCount: 1,
                        lowFitCount: 0,
                        zeroResultCount: 0,
                    },
                },
            ]
        );

    assert.equal(outcomes.total, 2);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 1);
    assert.equal(outcomes.awaitingSamples, 0);
    assert.equal(outcomes.validated, 0);
    assert.equal(outcomes.topReadyReview[0]?.status, 'ready_review');
    assert.equal(outcomes.topReadyReview[0]?.readyReviewCount, 1);
    assert.equal(outcomes.topNeedsAttention[0]?.status, 'needs_attention');
    assert.equal(outcomes.topNeedsAttention[0]?.noImprovementCount, 1);
});

test('search learning ops playbook recommendation outcome recommendation outcome recommendation activity tracks review and retrain executions', () => {
    const activity = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity([
        {
            id: 'activity-1',
            type: 'review_entries',
            context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_outcome:review',
            reviewedStatus: 'approved',
            count: 2,
            entryIds: ['entry-1', 'entry-2'],
            queries: ['운동용 후드', '남자 후드'],
            actorUid: 'admin-a',
            createdAt: '2026-03-12T10:20:00.000Z',
        },
        {
            id: 'activity-2',
            type: 'generate_suggestions',
            context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_outcome:retrain',
            reviewedStatus: null,
            count: 1,
            entryIds: ['entry-3'],
            queries: ['트레이닝 팬츠', '조거 팬츠'],
            actorUid: 'admin-b',
            createdAt: '2026-03-12T10:25:00.000Z',
        },
    ]);

    assert.equal(activity.totalRuns, 2);
    assert.equal(activity.reviewRuns, 1);
    assert.equal(activity.retrainRuns, 1);
    assert.equal(activity.uniqueQueries, 4);
    assert.equal(activity.recentRuns[0]?.action, 'retrain_now');
    assert.equal(activity.recentRuns[0]?.outcomeId, 'outcome:retrain');
    assert.equal(activity.recentRuns[1]?.action, 'review_now');
});

test('search learning ops playbook recommendation outcome recommendation outcome recommendation outcomes classify review and retrain runs', () => {
    const outcomes = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes(
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity([
            {
                id: 'activity-1',
                type: 'review_entries',
                context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_outcome:ready-review',
                reviewedStatus: 'approved',
                count: 1,
                entryIds: ['entry-1'],
                queries: ['운동용 후드'],
                actorUid: 'admin-a',
                createdAt: '2026-03-12T10:20:00.000Z',
            },
            {
                id: 'activity-2',
                type: 'generate_suggestions',
                context: 'ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_outcome:needs-attention',
                reviewedStatus: null,
                count: 1,
                entryIds: ['entry-2'],
                queries: ['트레이닝 팬츠'],
                actorUid: 'admin-b',
                createdAt: '2026-03-12T10:25:00.000Z',
            },
        ]).recentRuns,
        [
            {
                id: 'entry-1',
                query: '운동용 후드',
                status: 'pending',
                aiSuggestion: {
                    normalizedQuery: '운동용 후드',
                    categoryHint: '후드집업',
                    suggestedQueries: ['후드집업'],
                    rationale: 'hoodie',
                    model: 'heuristic',
                    generatedAt: '2026-03-12T10:20:00.000Z',
                },
                approvalBaseline: null,
                occurrenceCount: 2,
                lowFitCount: 1,
                zeroResultCount: 1,
            },
            {
                id: 'entry-2',
                query: '트레이닝 팬츠',
                status: 'approved',
                aiSuggestion: null,
                approvalBaseline: {
                    approvedAt: '2026-03-12T09:00:00.000Z',
                    occurrenceCount: 1,
                    lowFitCount: 1,
                    zeroResultCount: 1,
                },
                occurrenceCount: 2,
                lowFitCount: 2,
                zeroResultCount: 2,
            },
        ]
    );

    assert.equal(outcomes.total, 2);
    assert.equal(outcomes.readyReview, 1);
    assert.equal(outcomes.needsAttention, 1);
    assert.equal(outcomes.awaitingSamples, 0);
    assert.equal(outcomes.validated, 0);
    assert.equal(outcomes.topReadyReview[0]?.status, 'ready_review');
    assert.equal(outcomes.topNeedsAttention[0]?.status, 'needs_attention');
});

test('search learning ops playbook recommendation outcome recommendation outcome recommendation recommendations classify next actions', () => {
    const recommendations = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations({
        total: 4,
        readyReview: 1,
        needsAttention: 1,
        awaitingSamples: 1,
        validated: 1,
        topReadyReview: [
            {
                id: 'outcome-1',
                outcomeId: 'hoodie-review',
                title: 'Outcome Recommendation Review',
                action: 'review_now',
                context: 'ctx:review',
                createdAt: '2026-03-12T10:30:00.000Z',
                queries: ['운동용 후드'],
                entryIds: ['entry-1'],
                status: 'ready_review',
                description: 'ready',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 1,
            },
        ],
        topNeedsAttention: [
            {
                id: 'outcome-2',
                outcomeId: 'pants-retrain',
                title: 'Outcome Recommendation Retrain',
                action: 'retrain_now',
                context: 'ctx:retrain',
                createdAt: '2026-03-12T10:29:00.000Z',
                queries: ['트레이닝 팬츠'],
                entryIds: ['entry-2'],
                status: 'needs_attention',
                description: 'retrain',
                improvedCount: 0,
                noImprovementCount: 2,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
        topAwaitingSamples: [
            {
                id: 'outcome-3',
                outcomeId: 'runner-awaiting',
                title: 'Outcome Recommendation Samples',
                action: 'collect_samples',
                context: 'ctx:awaiting',
                createdAt: '2026-03-12T10:28:00.000Z',
                queries: ['러닝 자켓'],
                entryIds: ['entry-3'],
                status: 'awaiting_samples',
                description: 'awaiting',
                improvedCount: 0,
                noImprovementCount: 0,
                awaitingSamplesCount: 1,
                readyReviewCount: 0,
            },
        ],
        topValidated: [
            {
                id: 'outcome-4',
                outcomeId: 'validated',
                title: 'Outcome Recommendation Observe',
                action: 'observe',
                context: 'ctx:validated',
                createdAt: '2026-03-12T10:27:00.000Z',
                queries: ['와이드 팬츠'],
                entryIds: ['entry-4'],
                status: 'validated',
                description: 'validated',
                improvedCount: 2,
                noImprovementCount: 0,
                awaitingSamplesCount: 0,
                readyReviewCount: 0,
            },
        ],
    });

    assert.equal(recommendations.total, 4);
    assert.equal(recommendations.reviewNow, 1);
    assert.equal(recommendations.retrainNow, 1);
    assert.equal(recommendations.collectSamples, 1);
    assert.equal(recommendations.observe, 1);
    assert.equal(recommendations.topReviewNow[0]?.action, 'review_now');
    assert.equal(recommendations.topRetrainNow[0]?.action, 'retrain_now');
});

test('coverage seed adds missing queries directly into search learning queue', async () => {
    resetSearchLearningEntries();

    const updated = await seedSearchLearningEntries(['운동용 후드', '트레이닝 팬츠']);

    assert.equal(updated.length, 2);
    assert.equal(updated[0]?.status, 'pending');
    assert.equal(updated[0]?.lastResultQuality, 'weak');

    const queue = await loadSearchLearningQueue(10);
    assert.equal(queue.summary.pending, 2);
    assert.ok(queue.entries.some((entry) => entry.query === '운동용 후드'));
    assert.ok(queue.entries.some((entry) => entry.query === '트레이닝 팬츠'));
});
