import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildFallbackSearchLearningSuggestion,
    generateSearchLearningSuggestions,
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
