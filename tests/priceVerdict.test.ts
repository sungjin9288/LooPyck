import assert from 'node:assert/strict';
import test from 'node:test';

import { computePriceVerdict } from '../lib/product/priceVerdict.ts';

function pts(prices: number[]) {
    return prices.map((price, index) => ({ price, capturedAt: 1000 + index }));
}

test('insufficient verdict when fewer than 3 usable points', () => {
    const verdict = computePriceVerdict(pts([10000, 11000]), 10000);
    assert.equal(verdict.level, 'insufficient');
    assert.equal(verdict.sampleSize, 2);
    assert.ok(verdict.label.length > 0);
    assert.ok(verdict.reason.length > 0);
});

test('great_deal when current sits at the historical low', () => {
    const verdict = computePriceVerdict(pts([10000, 12000, 11000, 13000, 9000]), 9000);
    assert.equal(verdict.level, 'great_deal');
    assert.equal(verdict.lowest, 9000);
    assert.equal(verdict.highest, 13000);
    assert.equal(verdict.average, 11000);
    assert.equal(verdict.vsLowestPct, 0);
    assert.equal(verdict.percentile, 0);
});

test('good when clearly below the historical average', () => {
    const verdict = computePriceVerdict(pts([10000, 12000, 11000, 13000, 9000]), 9500);
    assert.equal(verdict.level, 'good');
    assert.ok(verdict.vsAveragePct < -5);
    assert.equal(verdict.percentile, 20);
});

test('fair around the historical average', () => {
    const verdict = computePriceVerdict(pts([10000, 12000, 11000, 13000, 9000]), 11000);
    assert.equal(verdict.level, 'fair');
    assert.equal(verdict.average, 11000);
    assert.equal(verdict.vsAveragePct, 0);
});

test('high when above the historical average', () => {
    const verdict = computePriceVerdict(pts([10000, 12000, 11000, 13000, 9000]), 13000);
    assert.equal(verdict.level, 'high');
    assert.ok(verdict.vsAveragePct > 0);
    assert.equal(verdict.percentile, 80);
});

test('flat history reads as fair, never a deal', () => {
    const verdict = computePriceVerdict(pts([10000, 10000, 10000, 10000]), 10000);
    assert.equal(verdict.level, 'fair');
    assert.equal(verdict.lowest, verdict.highest);
});

test('invalid current price falls back to insufficient', () => {
    const verdict = computePriceVerdict(pts([10000, 11000, 12000]), 0);
    assert.equal(verdict.level, 'insufficient');
});

test('non-finite points are ignored before judging', () => {
    const raw = [
        { price: 10000, capturedAt: 1 },
        { price: Number.NaN, capturedAt: 2 },
        { price: 11000, capturedAt: 3 },
        { price: 9000, capturedAt: 4 },
    ];
    const verdict = computePriceVerdict(raw, 9000);
    assert.equal(verdict.sampleSize, 3);
    assert.equal(verdict.level, 'great_deal');
});

test('within 2 percent of the low still counts as a great_deal', () => {
    const verdict = computePriceVerdict(pts([9000, 9500, 11000, 13000]), 9100);
    assert.equal(verdict.level, 'great_deal');
    assert.ok(verdict.vsLowestPct > 0 && verdict.vsLowestPct <= 2);
});
