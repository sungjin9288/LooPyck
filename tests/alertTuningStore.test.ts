import test from 'node:test';
import assert from 'node:assert/strict';
import {
    resolveAlertTuningHistorySnapshot,
    summarizeAlertTuningChange,
} from '../lib/server/alertTuningStore.ts';

test('summarizeAlertTuningChange includes source override modifications', () => {
    const summary = summarizeAlertTuningChange(
        {
            modes: {
                instant: { defaultSnoozeHours: 24, targetDiscountRate: 3, recommendedByPriority: { critical: 24, high: 24, medium: 72 } },
                balanced: { defaultSnoozeHours: 72, targetDiscountRate: 5, recommendedByPriority: { critical: 24, high: 72, medium: 168 } },
                batch: { defaultSnoozeHours: 168, targetDiscountRate: 8, recommendedByPriority: { critical: 72, high: 168, medium: 336 } },
            },
            sourceOverrides: {
                MUSINSA: {
                    balanced: {
                        defaultSnoozeHours: 48,
                        targetDiscountRate: 4,
                    },
                },
            },
            sourceRollouts: {
                MUSINSA: 100,
            },
        },
        {
            modes: {
                instant: { defaultSnoozeHours: 24, targetDiscountRate: 3, recommendedByPriority: { critical: 24, high: 24, medium: 72 } },
                balanced: { defaultSnoozeHours: 72, targetDiscountRate: 5, recommendedByPriority: { critical: 24, high: 72, medium: 168 } },
                batch: { defaultSnoozeHours: 168, targetDiscountRate: 8, recommendedByPriority: { critical: 72, high: 168, medium: 336 } },
            },
            sourceOverrides: {
                MUSINSA: {
                    balanced: {
                        defaultSnoozeHours: 60,
                        targetDiscountRate: 6,
                    },
                },
            },
            sourceRollouts: {
                MUSINSA: 35,
            },
        }
    );

    assert.match(summary, /MUSINSA\/balanced/);
    assert.match(summary, /rollout/);
});

test('resolveAlertTuningHistorySnapshot supports configSnapshot and legacy config payloads', () => {
    const configSnapshot = resolveAlertTuningHistorySnapshot({
        configSnapshot: {
            modes: {
                instant: { defaultSnoozeHours: 12, targetDiscountRate: 2, recommendedByPriority: { critical: 6, high: 12, medium: 24 } },
                balanced: { defaultSnoozeHours: 36, targetDiscountRate: 4, recommendedByPriority: { critical: 12, high: 36, medium: 72 } },
                batch: { defaultSnoozeHours: 96, targetDiscountRate: 7, recommendedByPriority: { critical: 48, high: 96, medium: 168 } },
            },
        },
    });
    assert.equal(configSnapshot?.modes.instant.defaultSnoozeHours, 12);
    assert.equal(configSnapshot?.modes.batch.targetDiscountRate, 7);

    const legacyConfig = resolveAlertTuningHistorySnapshot({
        config: {
            modes: {
                instant: { defaultSnoozeHours: 24, targetDiscountRate: 3, recommendedByPriority: { critical: 24, high: 24, medium: 72 } },
                balanced: { defaultSnoozeHours: 72, targetDiscountRate: 5, recommendedByPriority: { critical: 24, high: 72, medium: 168 } },
                batch: { defaultSnoozeHours: 168, targetDiscountRate: 8, recommendedByPriority: { critical: 72, high: 168, medium: 336 } },
            },
        },
    });
    assert.equal(legacyConfig?.modes.balanced.defaultSnoozeHours, 72);

    const missing = resolveAlertTuningHistorySnapshot({
        summary: 'no snapshot',
    });
    assert.equal(missing, null);
});
