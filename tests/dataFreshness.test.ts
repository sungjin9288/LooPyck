import assert from 'node:assert/strict';
import test from 'node:test';
import {
    getFreshnessBadgeClassName,
    summarizeDetailFreshness,
    summarizePriceHistoryFreshness,
} from '../lib/product/dataFreshness.ts';

test('detail freshness marks recent PDP detail as fresh', () => {
    const nowMs = Date.parse('2026-03-23T12:00:00.000Z');
    const freshness = summarizeDetailFreshness('2026-03-23T09:30:00.000Z', nowMs);

    assert.equal(freshness.status, 'fresh');
    assert.equal(freshness.shortLabel, '2시간 전 확인');
    assert.equal(freshness.detailLabel, '3. 23. 18:30 기준');
});

test('detail freshness marks old PDP detail as stale', () => {
    const nowMs = Date.parse('2026-03-23T12:00:00.000Z');
    const freshness = summarizeDetailFreshness('2026-03-19T09:30:00.000Z', nowMs);

    assert.equal(freshness.status, 'stale');
    assert.equal(freshness.shortLabel, '4일 전 확인');
});

test('price history freshness uses collection-specific fallback label', () => {
    const freshness = summarizePriceHistoryFreshness(undefined, Date.parse('2026-03-23T12:00:00.000Z'));

    assert.equal(freshness.status, 'unknown');
    assert.equal(freshness.shortLabel, '가격 이력 수집 대기');
});

test('freshness badge classes expose tone styles', () => {
    assert.match(getFreshnessBadgeClassName('fresh'), /emerald/);
    assert.match(getFreshnessBadgeClassName('aging'), /amber/);
    assert.match(getFreshnessBadgeClassName('stale'), /rose/);
    assert.match(getFreshnessBadgeClassName('unknown'), /slate/);
});
