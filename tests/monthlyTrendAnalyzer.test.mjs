import test from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMonthlyFashionTrends, getMsUntilNextMonthStartKST, getSeoulMonthKey } from '../lib/trends/monthlyTrendAnalyzer.ts';

test('same month returns stable trend snapshot', () => {
    const earlyMonth = new Date('2026-02-03T01:00:00.000Z');
    const lateMonth = new Date('2026-02-24T13:00:00.000Z');

    const snapshotA = analyzeMonthlyFashionTrends(earlyMonth);
    const snapshotB = analyzeMonthlyFashionTrends(lateMonth);

    assert.equal(snapshotA.monthKey, snapshotB.monthKey);
    assert.deepEqual(
        snapshotA.styles.map(style => style.id),
        snapshotB.styles.map(style => style.id),
    );
    assert.deepEqual(snapshotA.risingKeywords, snapshotB.risingKeywords);
});

test('month key changes when crossing month boundary (KST)', () => {
    const febInKst = new Date('2026-02-28T14:59:59.000Z'); // 2026-02-28 23:59:59 KST
    const marInKst = new Date('2026-02-28T15:00:01.000Z'); // 2026-03-01 00:00:01 KST

    const febKey = getSeoulMonthKey(febInKst);
    const marKey = getSeoulMonthKey(marInKst);

    assert.equal(febKey, '2026-02');
    assert.equal(marKey, '2026-03');
});

test('rising keywords are deduplicated case-insensitively', () => {
    const snapshot = analyzeMonthlyFashionTrends(new Date('2026-11-12T12:00:00.000Z'));
    const lowered = snapshot.risingKeywords.map(keyword => keyword.toLowerCase());
    assert.equal(new Set(lowered).size, lowered.length);
});

test('monthly refresh delay near month boundary is short', () => {
    const justBeforeBoundary = new Date('2026-02-28T14:59:30.000Z'); // 23:59:30 KST
    const delayMs = getMsUntilNextMonthStartKST(justBeforeBoundary);

    assert.ok(delayMs >= 30_000 && delayMs < 31_000);
});
