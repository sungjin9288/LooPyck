import assert from 'node:assert/strict';
import test from 'node:test';

import { serializeVariantCandidatesForFirestore } from '../lib/server/firestoreProductSerialization.ts';

function assertNoUndefined(value: unknown, path: string = 'record'): void {
    assert.notEqual(value, undefined, `${path} must not contain undefined`);
    if (Array.isArray(value)) {
        value.forEach((entry, index) => assertNoUndefined(entry, `${path}[${index}]`));
        return;
    }
    if (value && typeof value === 'object') {
        Object.entries(value).forEach(([key, entry]) => assertNoUndefined(entry, `${path}.${key}`));
    }
}

test('stored product records normalize nested variant candidate optionals for Firestore', () => {
    const variantCandidates = serializeVariantCandidatesForFirestore([
        {
            label: '블랙/M',
            variantSku: 'SKU-BLACK-M',
            price: 39900,
        },
    ]);

    assert.deepEqual(variantCandidates, [
        {
            label: '블랙/M',
            variantId: null,
            variantSku: 'SKU-BLACK-M',
            color: null,
            size: null,
            price: 39900,
            stockStatus: null,
        },
    ]);
    assertNoUndefined(variantCandidates);
});

test('stored product records drop invalid candidates and cap nested arrays at 24', () => {
    const variantCandidates = Array.from({ length: 30 }, (_, index) => ({
        label: index === 0 ? '   ' : `옵션 ${index}`,
        variantId: `variant-${index}`,
    }));
    const storedCandidates = serializeVariantCandidatesForFirestore(variantCandidates);

    assert.equal(Array.isArray(storedCandidates), true);
    assert.equal(storedCandidates?.length, 24);
    assert.equal((storedCandidates as Array<{ label: string }>)[0].label, '옵션 1');
    assertNoUndefined(storedCandidates);
});
