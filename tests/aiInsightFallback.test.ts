import assert from 'node:assert/strict';
import test from 'node:test';

import { buildAiInsightFallback } from '../lib/ai/aiInsightFallback.ts';
import { computePriceVerdict } from '../lib/product/priceVerdict.ts';

function verdict(prices: number[], currentPrice: number) {
    return computePriceVerdict(
        prices.map((price, index) => ({ price, capturedAt: index + 1 })),
        currentPrice
    );
}

test('fallback preserves a grounded great-deal verdict without fabricating trend keywords', () => {
    const result = buildAiInsightFallback(verdict([40000, 45000, 50000, 55000], 40000));

    assert.equal(result.analysisSource, 'fallback');
    assert.equal(result.insight.ratingEN, 'STRONG BUY');
    assert.equal(result.trend.label, '트렌드 분석 대기');
    assert.deepEqual(result.trend.keywords, []);
});

test('fallback recommends waiting when the current price is high', () => {
    const result = buildAiInsightFallback(verdict([40000, 42000, 45000, 48000], 60000));

    assert.equal(result.insight.ratingEN, 'WAIT');
    assert.match(result.insight.reason, /높/);
});

test('fallback stays conservative when price history is insufficient', () => {
    const result = buildAiInsightFallback(verdict([50000], 50000));

    assert.equal(result.insight.ratingEN, 'HOLD');
    assert.equal(result.insight.score, 50);
    assert.match(result.insight.reasoning[1].note, /현재 수집 1회/);
});

test('fallback output stays within the public AI insight response bounds', () => {
    const result = buildAiInsightFallback(verdict([40000, 42000, 45000], 41000));

    assert.ok(result.insight.advice.length <= 40);
    assert.ok(result.insight.reason.length <= 240);
    assert.ok(result.insight.reasoning.length >= 1 && result.insight.reasoning.length <= 5);
    assert.ok(result.insight.reasoning.every((item) => item.factor.length <= 30 && item.note.length <= 80));
});
