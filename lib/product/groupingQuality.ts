import type { GroupedProduct, UnifiedProduct } from '../api/types.ts';
import { groupProducts } from './productMatching.ts';

export type GroupingQualityEntry = {
    product: UnifiedProduct;
    expectedGroupId: string;
};

export type GroupingQualityThresholds = {
    minimumSamples: number;
    minimumPositivePairs: number;
    minimumPrecision: number;
    minimumRecall: number;
    minimumF1: number;
};

export type GroupingQualityMismatch = {
    type: 'false_merge' | 'false_split';
    leftProductId: string;
    rightProductId: string;
    leftExpectedGroupId: string;
    rightExpectedGroupId: string;
    leftPredictedGroupId: string;
    rightPredictedGroupId: string;
};

export type GroupingQualityResult = {
    sampleCount: number;
    pairCount: number;
    expectedPositivePairs: number;
    predictedPositivePairs: number;
    confusion: {
        truePositive: number;
        falsePositive: number;
        falseNegative: number;
        trueNegative: number;
    };
    precision: number;
    recall: number;
    f1: number;
    mismatches: GroupingQualityMismatch[];
};

function divideOrPerfect(numerator: number, denominator: number): number {
    return denominator === 0 ? 1 : numerator / denominator;
}

function roundMetric(value: number): number {
    return Math.round(value * 10000) / 10000;
}

function buildPredictedMembership(
    entries: GroupingQualityEntry[],
    predictedGroups: GroupedProduct[],
): Map<string, string> {
    const expectedProductIds = new Set<string>();
    entries.forEach(({ product }) => {
        if (expectedProductIds.has(product.id)) {
            throw new Error(`duplicate benchmark product id: ${product.id}`);
        }
        expectedProductIds.add(product.id);
    });

    const membership = new Map<string, string>();
    predictedGroups.forEach((group) => {
        group.variants.forEach((product) => {
            if (!expectedProductIds.has(product.id)) {
                throw new Error(`unexpected predicted membership: ${product.id}`);
            }
            if (membership.has(product.id)) {
                throw new Error(`duplicate predicted membership: ${product.id}`);
            }
            membership.set(product.id, group.groupKey);
        });
    });

    const missingProductIds = entries
        .map(({ product }) => product.id)
        .filter((productId) => !membership.has(productId));
    if (missingProductIds.length > 0) {
        throw new Error(`missing predicted membership: ${missingProductIds.join(', ')}`);
    }

    return membership;
}

export function evaluateGroupingQuality(
    entries: GroupingQualityEntry[],
    predictedGroups: GroupedProduct[],
): GroupingQualityResult {
    const predictedMembership = buildPredictedMembership(entries, predictedGroups);
    const confusion = {
        truePositive: 0,
        falsePositive: 0,
        falseNegative: 0,
        trueNegative: 0,
    };
    const mismatches: GroupingQualityMismatch[] = [];

    for (let leftIndex = 0; leftIndex < entries.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < entries.length; rightIndex += 1) {
            const left = entries[leftIndex];
            const right = entries[rightIndex];
            const leftPredictedGroupId = predictedMembership.get(left.product.id) as string;
            const rightPredictedGroupId = predictedMembership.get(right.product.id) as string;
            const expectedSame = left.expectedGroupId === right.expectedGroupId;
            const predictedSame = leftPredictedGroupId === rightPredictedGroupId;

            if (expectedSame && predictedSame) {
                confusion.truePositive += 1;
                continue;
            }
            if (!expectedSame && predictedSame) {
                confusion.falsePositive += 1;
                mismatches.push({
                    type: 'false_merge',
                    leftProductId: left.product.id,
                    rightProductId: right.product.id,
                    leftExpectedGroupId: left.expectedGroupId,
                    rightExpectedGroupId: right.expectedGroupId,
                    leftPredictedGroupId,
                    rightPredictedGroupId,
                });
                continue;
            }
            if (expectedSame && !predictedSame) {
                confusion.falseNegative += 1;
                mismatches.push({
                    type: 'false_split',
                    leftProductId: left.product.id,
                    rightProductId: right.product.id,
                    leftExpectedGroupId: left.expectedGroupId,
                    rightExpectedGroupId: right.expectedGroupId,
                    leftPredictedGroupId,
                    rightPredictedGroupId,
                });
                continue;
            }

            confusion.trueNegative += 1;
        }
    }

    const expectedPositivePairs = confusion.truePositive + confusion.falseNegative;
    const predictedPositivePairs = confusion.truePositive + confusion.falsePositive;
    const precision = divideOrPerfect(confusion.truePositive, predictedPositivePairs);
    const recall = divideOrPerfect(confusion.truePositive, expectedPositivePairs);
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);

    return {
        sampleCount: entries.length,
        pairCount: (entries.length * (entries.length - 1)) / 2,
        expectedPositivePairs,
        predictedPositivePairs,
        confusion,
        precision: roundMetric(precision),
        recall: roundMetric(recall),
        f1: roundMetric(f1),
        mismatches,
    };
}

export function benchmarkProductGrouping(entries: GroupingQualityEntry[]): GroupingQualityResult {
    return evaluateGroupingQuality(entries, groupProducts(entries.map(({ product }) => product)));
}

export function evaluateGroupingQualityThresholds(
    result: GroupingQualityResult,
    thresholds: GroupingQualityThresholds,
): string[] {
    const violations: string[] = [];

    if (result.sampleCount < thresholds.minimumSamples) violations.push('insufficient-samples');
    if (result.expectedPositivePairs < thresholds.minimumPositivePairs) violations.push('insufficient-positive-pairs');
    if (result.precision < thresholds.minimumPrecision) violations.push('precision-below-threshold');
    if (result.recall < thresholds.minimumRecall) violations.push('recall-below-threshold');
    if (result.f1 < thresholds.minimumF1) violations.push('f1-below-threshold');

    return violations;
}
