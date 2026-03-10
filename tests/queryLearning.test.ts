import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildFallbackSearchLearningSuggestion,
    mergeLearnedQueriesIntoPlan,
    recordSearchLearningCandidate,
    resetSearchLearningEntries,
    loadSearchLearningQueue,
} from '../lib/search/queryLearning.ts';

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
