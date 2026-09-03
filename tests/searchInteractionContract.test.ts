import assert from 'node:assert/strict';
import test from 'node:test';

import { parseSearchInteractionPayload } from '../lib/search/searchInteractionContract.ts';

test('normalizes a valid suggestion click and requires its selected query', () => {
    const result = parseSearchInteractionPayload({
        type: 'suggestion_click',
        query: '  남자\n  후드  ',
        selectedQuery: '  남자 후드티  ',
        context: 'results_refinement',
    });

    assert.deepEqual(result, {
        ok: true,
        data: {
            type: 'suggestion_click',
            query: '남자 후드',
            selectedQuery: '남자 후드티',
            source: undefined,
            productId: undefined,
            productIds: undefined,
            productTitle: undefined,
            brand: undefined,
            context: 'results_refinement',
        },
    });
    assert.deepEqual(
        parseSearchInteractionPayload({ type: 'suggestion_click', query: '후드' }),
        { ok: false, error: 'selected_query_required' }
    );
});

test('normalizes and deduplicates a valid product impression batch', () => {
    const result = parseSearchInteractionPayload({
        type: 'product_impression',
        query: '스니커즈',
        productIds: [' product-1 ', 'product-1', 'product-2\u0000'],
        context: 'search_results:badges=shipping+benefit',
    });

    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.deepEqual(result.data.productIds, ['product-1', 'product-2']);
});

test('rejects product impressions without IDs or a recognized badge cohort', () => {
    assert.deepEqual(
        parseSearchInteractionPayload({
            type: 'product_impression',
            query: '스니커즈',
            productIds: [],
            context: 'search_results:badges=none',
        }),
        { ok: false, error: 'invalid_product_impression' }
    );
    assert.deepEqual(
        parseSearchInteractionPayload({
            type: 'product_impression',
            query: '스니커즈',
            productIds: ['product-1'],
            context: 'search_results:badges=unknown',
        }),
        { ok: false, error: 'invalid_product_impression' }
    );
});

test('accepts a product open only with product identity and badge cohort', () => {
    const valid = parseSearchInteractionPayload({
        type: 'product_open',
        query: '후드',
        source: 'MUSINSA',
        productId: 'musinsa-1',
        context: 'search_results:badges=shipping',
    });
    assert.equal(valid.ok, true);

    assert.deepEqual(
        parseSearchInteractionPayload({
            type: 'product_open',
            query: '후드',
            context: 'search_results:badges=shipping',
        }),
        { ok: false, error: 'invalid_product_open' }
    );
});

test('rejects a product open with a non-cohort context', () => {
    assert.deepEqual(
        parseSearchInteractionPayload({
            type: 'product_open',
            query: '후드',
            productId: 'musinsa-1',
            context: 'product_modal',
        }),
        { ok: false, error: 'invalid_product_open' }
    );
});

test('accepts a store click only with a known source and product identity', () => {
    const valid = parseSearchInteractionPayload({
        type: 'store_click',
        query: '상품명',
        source: '29CM',
        productId: '29cm-1',
        context: 'product_modal',
    });
    assert.equal(valid.ok, true);

    assert.deepEqual(
        parseSearchInteractionPayload({
            type: 'store_click',
            query: '상품명',
            source: 'UNKNOWN',
            productId: 'unknown-1',
        }),
        { ok: false, error: 'invalid_store_click' }
    );
});

test('rejects unsupported types, blank queries, and oversized queries', () => {
    assert.deepEqual(
        parseSearchInteractionPayload({ type: 'unknown', query: '후드' }),
        { ok: false, error: 'invalid_base_fields' }
    );
    assert.deepEqual(
        parseSearchInteractionPayload({ type: 'suggestion_click', query: ' ', selectedQuery: '후드' }),
        { ok: false, error: 'invalid_base_fields' }
    );
    assert.deepEqual(
        parseSearchInteractionPayload({
            type: 'suggestion_click',
            query: '가'.repeat(61),
            selectedQuery: '후드',
        }),
        { ok: false, error: 'invalid_base_fields' }
    );
});
