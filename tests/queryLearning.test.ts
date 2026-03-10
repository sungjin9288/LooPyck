import assert from 'node:assert/strict';
import test from 'node:test';
import {
    buildFallbackSearchLearningSuggestion,
    generateSearchLearningSuggestions,
    mergeLearnedQueriesIntoPlan,
    recordSearchLearningCandidate,
    reviewSearchLearningEntries,
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
    assert.ok(reviewed[0]?.approvedQueries.includes('후드집업'));
    assert.ok(reviewed[0]?.approvedQueries.includes('트레이닝 후드집업'));
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
