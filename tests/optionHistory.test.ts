import test from 'node:test';
import assert from 'node:assert/strict';
import { buildOptionHistoryIdentity, buildOptionHistoryStorageKey } from '../lib/product/optionHistory.ts';

test('option history key is stable regardless of option order', () => {
    const first = buildOptionHistoryIdentity({
        source: 'MUSINSA',
        id: 'item-1',
        optionSummary: '색상 블랙 · 사이즈 M, L',
        colorOptions: ['블랙', '화이트'],
        sizeOptions: ['M', 'L'],
        optionValues: ['블랙/M', '블랙/L'],
    });
    const second = buildOptionHistoryIdentity({
        source: 'MUSINSA',
        id: 'item-1',
        optionSummary: '색상 블랙 · 사이즈 M, L',
        colorOptions: ['화이트', '블랙'],
        sizeOptions: ['L', 'M'],
        optionValues: ['블랙/L', '블랙/M'],
    });

    assert.equal(first.optionKey, second.optionKey);
    assert.equal(first.optionSignature, second.optionSignature);
    assert.equal(first.optionLabel, '색상 블랙 · 사이즈 M, L');
});

test('option history can fall back to summary only', () => {
    const identity = buildOptionHistoryIdentity({
        source: '29CM',
        id: 'item-2',
        optionSummary: '옵션 네이비/FREE',
        colorOptions: undefined,
        sizeOptions: undefined,
        optionValues: undefined,
    });

    assert.ok(identity.optionKey);
    assert.equal(identity.optionLabel, '옵션 네이비/FREE');
    assert.ok(identity.optionSignature?.startsWith('summary:'));
});

test('option history prefers actual variant and sku identifiers when present', () => {
    const identity = buildOptionHistoryIdentity({
        source: 'SSF',
        id: 'item-variant',
        variantId: 'VAR_001',
        variantSku: 'SKU-001',
        optionSummary: '색상 블랙 · 사이즈 M',
        colorOptions: ['블랙'],
        sizeOptions: ['M'],
        optionValues: ['블랙/M'],
    });

    assert.ok(identity.optionSignature?.includes('variant:var_001'));
    assert.ok(identity.optionSignature?.includes('sku:SKU-001'));
    assert.equal(identity.optionLabel, '색상 블랙 · 사이즈 M');
});

test('option history storage key includes source, id and option key', () => {
    assert.equal(
        buildOptionHistoryStorageKey('SSF', 'item-3', 'opt_abc123'),
        'SSF:item-3:opt_abc123'
    );
});

test('missing option signals produce no option history identity', () => {
    const identity = buildOptionHistoryIdentity({
        source: 'COUPANG',
        id: 'item-4',
        optionSummary: undefined,
        colorOptions: undefined,
        sizeOptions: undefined,
        optionValues: undefined,
    });

    assert.equal(identity.optionKey, undefined);
    assert.equal(identity.optionLabel, undefined);
});
