import test from 'node:test';
import assert from 'node:assert/strict';
import type { GroupedProduct, UnifiedProduct } from '../lib/api/types.ts';
import {
    benchmarkProductGrouping,
    evaluateGroupingQuality,
} from '../lib/product/groupingQuality.ts';
import {
    GROUPING_QUALITY_DATASET,
    GROUPING_QUALITY_THRESHOLDS,
} from '../lib/product/groupingQualityDataset.ts';

function product(id: string): UnifiedProduct {
    return {
        id,
        title: id,
        price: 100000,
        image: `https://example.com/${id}.jpg`,
        link: `https://example.com/${id}`,
        mallName: id,
        source: 'MUSINSA',
    };
}

function group(key: string, variants: UnifiedProduct[]): GroupedProduct {
    return {
        groupKey: key,
        representative: variants[0],
        variants,
        lowestPrice: 100000,
        highestPrice: 100000,
        mallCount: variants.length,
        matchConfidence: variants.length > 1 ? 0.9 : 1,
        matchStrategy: variants.length > 1 ? 'token' : 'single',
    };
}

test('grouping quality reports perfect pairwise precision and recall', () => {
    const alphaOne = product('alpha-1');
    const alphaTwo = product('alpha-2');
    const beta = product('beta');
    const gamma = product('gamma');
    const result = evaluateGroupingQuality(
        [
            { product: alphaOne, expectedGroupId: 'alpha' },
            { product: alphaTwo, expectedGroupId: 'alpha' },
            { product: beta, expectedGroupId: 'beta' },
            { product: gamma, expectedGroupId: 'gamma' },
        ],
        [group('alpha', [alphaOne, alphaTwo]), group('beta', [beta]), group('gamma', [gamma])],
    );

    assert.deepEqual(result.confusion, {
        truePositive: 1,
        falsePositive: 0,
        falseNegative: 0,
        trueNegative: 5,
    });
    assert.equal(result.precision, 1);
    assert.equal(result.recall, 1);
    assert.equal(result.f1, 1);
    assert.deepEqual(result.mismatches, []);
});

test('grouping quality distinguishes false merges from false splits', () => {
    const alphaOne = product('alpha-1');
    const alphaTwo = product('alpha-2');
    const beta = product('beta');
    const gamma = product('gamma');
    const result = evaluateGroupingQuality(
        [
            { product: alphaOne, expectedGroupId: 'alpha' },
            { product: alphaTwo, expectedGroupId: 'alpha' },
            { product: beta, expectedGroupId: 'beta' },
            { product: gamma, expectedGroupId: 'gamma' },
        ],
        [group('wrong-merge', [alphaOne, beta]), group('alpha-split', [alphaTwo]), group('gamma', [gamma])],
    );

    assert.deepEqual(result.confusion, {
        truePositive: 0,
        falsePositive: 1,
        falseNegative: 1,
        trueNegative: 4,
    });
    assert.equal(result.precision, 0);
    assert.equal(result.recall, 0);
    assert.equal(result.f1, 0);
    assert.deepEqual(
        result.mismatches.map(({ type }) => type).sort(),
        ['false_merge', 'false_split'],
    );
});

test('grouping quality rejects incomplete or duplicate predicted membership', () => {
    const alpha = product('alpha');
    const beta = product('beta');
    const entries = [
        { product: alpha, expectedGroupId: 'alpha' },
        { product: beta, expectedGroupId: 'beta' },
    ];

    assert.throws(
        () => evaluateGroupingQuality(entries, [group('alpha', [alpha])]),
        /missing predicted membership: beta/,
    );
    assert.throws(
        () => evaluateGroupingQuality(entries, [group('one', [alpha]), group('two', [alpha, beta])]),
        /duplicate predicted membership: alpha/,
    );
});

test('curated production grouping benchmark meets the reviewed quality floor', () => {
    const result = benchmarkProductGrouping(GROUPING_QUALITY_DATASET);

    assert.ok(result.sampleCount >= GROUPING_QUALITY_THRESHOLDS.minimumSamples);
    assert.ok(result.expectedPositivePairs >= GROUPING_QUALITY_THRESHOLDS.minimumPositivePairs);
    assert.ok(result.precision >= GROUPING_QUALITY_THRESHOLDS.minimumPrecision);
    assert.ok(result.recall >= GROUPING_QUALITY_THRESHOLDS.minimumRecall);
    assert.ok(result.f1 >= GROUPING_QUALITY_THRESHOLDS.minimumF1);
});
