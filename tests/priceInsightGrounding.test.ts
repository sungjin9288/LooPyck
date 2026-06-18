import assert from 'node:assert/strict';
import test from 'node:test';

import { computePriceVerdict } from '../lib/product/priceVerdict.ts';
import { buildPriceGroundingBlock } from '../lib/ai/priceInsightGrounding.ts';

function points(...prices: number[]) {
    return prices.map((price, index) => ({ price, capturedAt: index + 1 }));
}

test('insufficient history yields a conservative, non-fabricating instruction', () => {
    const verdict = computePriceVerdict(points(50000), 50000); // 1 sample < MIN_SAMPLE_SIZE
    const block = buildPriceGroundingBlock(verdict);

    assert.equal(verdict.level, 'insufficient');
    assert.ok(block.includes('부족'), 'should state data is insufficient');
    assert.ok(/단정/.test(block), 'should tell the model not to assert a price judgment');
    // must NOT print fake statistics when there is no data
    assert.equal(block.includes('역대 최저가'), false);
});

test('grounded verdict injects the real collected statistics', () => {
    const verdict = computePriceVerdict(points(40000, 42000, 45000, 48000, 50000), 41000);
    const block = buildPriceGroundingBlock(verdict);

    assert.notEqual(verdict.level, 'insufficient');
    assert.ok(block.includes('40,000'), 'should include the real lowest price');
    assert.ok(block.includes('50,000'), 'should include the real highest price');
    assert.ok(block.includes(verdict.label), 'should include the deterministic verdict label');
    assert.ok(/추측하지/.test(block), 'should forbid guessing when real data exists');
});

test('expensive current price is described as above average', () => {
    const verdict = computePriceVerdict(points(40000, 42000, 45000, 48000, 50000), 60000);
    const block = buildPriceGroundingBlock(verdict);

    assert.equal(verdict.level, 'high');
    assert.ok(block.includes('높'), 'should describe the current price as above average');
});

test('block is plain numeric text with no prompt-control characters', () => {
    const verdict = computePriceVerdict(points(40000, 42000, 45000), 41000);
    const block = buildPriceGroundingBlock(verdict);
    // the grounding block is built from numbers/labels only — no backticks or fences
    assert.equal(block.includes('```'), false);
});
