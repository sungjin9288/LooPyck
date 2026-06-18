import assert from 'node:assert/strict';
import test from 'node:test';

import { MoodEngine } from '../lib/ai/moodEngine.ts';

test('expandMoods returns concrete keywords for a matched mood', () => {
    const keywords = MoodEngine.expandMoods('올드머니룩 추천', { season: '가을' });
    assert.ok(keywords.length > 0);
    assert.ok(keywords.includes('캐시미어 니트'), 'old-money mood should expand to its items');
});

test('expandMoods does NOT corrupt a literal product query (the original bug)', () => {
    // No mood term present — must return [] so the literal query is preserved.
    assert.deepEqual(MoodEngine.expandMoods('나이키 에어포스', { season: '가을' }), []);
    assert.deepEqual(MoodEngine.expandMoods('스톤아일랜드 맨투맨', { season: '여름' }), []);
});

test('expandMoods enriches a seasonless mood query with the current season item', () => {
    const keywords = MoodEngine.expandMoods('데이트룩', { season: '겨울' });
    assert.ok(keywords.includes('패딩'), 'should prepend the winter signature item');
});

test('expandMoods does not double-inject season when the query already names one', () => {
    const keywords = MoodEngine.expandMoods('가을 데이트룩', { season: '겨울' });
    // query already mentions 가을 → must not pull in winter (패딩)
    assert.equal(keywords.includes('패딩'), false);
});

test('analyze preserves a literal query instead of replacing it with season keywords', () => {
    // Regression guard for the old behavior where literal queries became "트렌치코트".
    assert.equal(MoodEngine.analyze('나이키 에어포스'), '나이키 에어포스');
});

test('getMoods exposes the supported mood vocabulary', () => {
    const moods = MoodEngine.getMoods();
    assert.ok(moods.includes('올드머니'));
    assert.ok(moods.length >= 20);
});
