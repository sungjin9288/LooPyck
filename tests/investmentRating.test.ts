import assert from 'node:assert/strict';
import test from 'node:test';

import { getInvestmentRatingPresentation } from '../lib/product/investmentRating.ts';

test('STRONG BUY stays an explicit strong recommendation', () => {
    assert.equal(getInvestmentRatingPresentation('STRONG BUY').label, '적극 추천');
});

test('BUY is not downgraded to a score-derived WATCH label', () => {
    assert.equal(getInvestmentRatingPresentation('BUY').label, '추천');
});

test('HOLD remains a neutral hold recommendation', () => {
    assert.equal(getInvestmentRatingPresentation('HOLD').label, '보류');
});

test('WAIT is presented as a wait state', () => {
    assert.equal(getInvestmentRatingPresentation('WAIT').label, '기다림');
});
