import assert from 'node:assert/strict';
import test from 'node:test';

import { buildCompareEntrySearchHref } from '../components/landing/compareEntryHref.ts';
import { getMatchStrategyLabel } from '../lib/product/matchStrategyLabel.ts';

test('buildCompareEntrySearchHref omits default sim sort and preserves query encoding', () => {
    const href = buildCompareEntrySearchHref('남자 후드');

    assert.equal(href, '/?q=%EB%82%A8%EC%9E%90+%ED%9B%84%EB%93%9C');
    assert.equal(href.includes('sort='), false);
});

test('buildCompareEntrySearchHref keeps explicit non-default sort', () => {
    const href = buildCompareEntrySearchHref('스니커즈 세일', 'asc');

    assert.equal(href, '/?q=%EC%8A%A4%EB%8B%88%EC%BB%A4%EC%A6%88+%EC%84%B8%EC%9D%BC&sort=asc');
});

test('getMatchStrategyLabel covers shared compare workflow labels', () => {
    assert.equal(getMatchStrategyLabel('single'), '단일 상품 기준');
    assert.equal(getMatchStrategyLabel('model'), '모델명 기준');
    assert.equal(getMatchStrategyLabel('brand_model'), '브랜드+모델명 기준');
    assert.equal(getMatchStrategyLabel('brand_token'), '브랜드+핵심 토큰 기준');
    assert.equal(getMatchStrategyLabel('token'), '핵심 토큰 기준');
    assert.equal(getMatchStrategyLabel(undefined), '핵심 토큰 기준');
});
