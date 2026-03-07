import test from 'node:test';
import assert from 'node:assert/strict';
import { buildVariantHistoryIdentity, buildVariantHistoryStorageKey } from '../lib/product/variantHistory.ts';

test('variant history identity uses actual variant identifiers', () => {
    const identity = buildVariantHistoryIdentity({
        source: 'MUSINSA',
        id: 'item-1',
        variantId: 'VARIANT_001',
        variantSku: 'SKU-001',
    });

    assert.ok(identity.variantKey);
    assert.equal(identity.variantLabel, 'SKU SKU-001 · Variant VARIANT_001');
    assert.ok(identity.variantSignature?.includes('variant:variant_001'));
    assert.ok(identity.variantSignature?.includes('sku:SKU-001'));
});

test('variant history identity returns empty when no identifiers exist', () => {
    const identity = buildVariantHistoryIdentity({
        source: '29CM',
        id: 'item-2',
        variantId: undefined,
        variantSku: undefined,
    });

    assert.equal(identity.variantKey, undefined);
    assert.equal(identity.variantLabel, undefined);
    assert.equal(identity.variantSignature, undefined);
});

test('variant history storage key includes source, id and variant key', () => {
    assert.equal(
        buildVariantHistoryStorageKey('SSF', 'item-3', 'var_abc123'),
        'SSF:item-3:var_abc123'
    );
});
