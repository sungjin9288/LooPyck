import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchSort } from '../types/searchSort.ts';

test('normalizeSearchSort keeps allowed values', () => {
    assert.equal(normalizeSearchSort('sim'), 'sim');
    assert.equal(normalizeSearchSort('asc'), 'asc');
    assert.equal(normalizeSearchSort('dsc'), 'dsc');
});

test('normalizeSearchSort falls back to sim for invalid values', () => {
    assert.equal(normalizeSearchSort('latest'), 'sim');
    assert.equal(normalizeSearchSort(''), 'sim');
    assert.equal(normalizeSearchSort(null), 'sim');
    assert.equal(normalizeSearchSort(undefined), 'sim');
});
