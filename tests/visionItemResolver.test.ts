import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveItemQueries, groupResolvedItems } from '../lib/search/visionItemResolver.ts';
import type { VisionItem } from '../lib/ai/visionItemNormalizer.ts';

function item(overrides: Partial<VisionItem>): VisionItem {
    return {
        category: overrides.category || '상의',
        label: overrides.label || '아이템',
        description: overrides.description || '설명',
        searchKeywords: overrides.searchKeywords || ['니트'],
    };
}

test('a fashion item resolves to its normalized query', () => {
    const resolved = resolveItemQueries([
        item({ category: '하의', label: '와이드 데님 팬츠', searchKeywords: ['와이드 데님 팬츠'] }),
    ]);

    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].category, '하의');
    assert.equal(resolved[0].label, '와이드 데님 팬츠');
    assert.ok(resolved[0].query.length > 0);
});

test('a blocked item (all keywords and label non-fashion) is dropped', () => {
    const resolved = resolveItemQueries([
        item({ category: '기타', label: '아이폰', searchKeywords: ['아이폰'] }),
    ]);

    assert.equal(resolved.length, 0);
});

test('falls back to the label when keywords are all blocked but label is a valid fashion term', () => {
    const resolved = resolveItemQueries([
        item({ category: '상의', label: '니트 가디건', searchKeywords: ['아이폰'] }),
    ]);

    assert.equal(resolved.length, 1);
    assert.equal(resolved[0].label, '니트 가디건');
});

test('dedupes two items that resolve to the same query', () => {
    const resolved = resolveItemQueries([
        item({ category: '상의', label: '후드집업 A', searchKeywords: ['후드집업'] }),
        item({ category: '상의', label: '후드집업 B', searchKeywords: ['후드집업'] }),
    ]);

    assert.equal(resolved.length, 1);
});

test('groupResolvedItems groups by category in first-seen order', () => {
    const grouped = groupResolvedItems([
        { category: '하의', label: '슬랙스', query: '슬랙스' },
        { category: '상의', label: '니트', query: '니트' },
        { category: '하의', label: '데님', query: '데님' },
    ]);

    assert.deepEqual(grouped.map((group) => group.category), ['하의', '상의']);
    assert.equal(grouped[0].items.length, 2);
    assert.equal(grouped[1].items.length, 1);
});
