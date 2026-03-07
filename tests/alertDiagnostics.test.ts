import test from 'node:test';
import assert from 'node:assert/strict';
import type {
    AlertDiagnosticsRecentEvent,
    AlertDiagnosticsSourceSummary,
    AlertPersonaRecentProfile,
} from '../lib/server/alertDiagnostics.ts';
import {
    buildAlertPersonaSummary,
    buildAlertRolloutSummaries,
    buildAlertRolloutTrends,
    buildAlertSourceDrilldowns,
} from '../lib/server/alertDiagnostics.ts';
import {
    DEFAULT_ALERT_TUNING_CONFIG,
    resolveAlertTuningOverrideState,
} from '../lib/favorites/alertPersonalization.ts';

const sourceSummary: AlertDiagnosticsSourceSummary = {
    source: 'MUSINSA',
    alerts: 4,
    unreadCount: 2,
    archivedCount: 1,
    highPriorityCount: 1,
    criticalPriorityCount: 1,
    activeTargets: 5,
    snoozedTargets: 2,
    avgReadLatencyMinutes: 11,
    lastSeenAt: '2026-03-07T00:00:00.000Z',
};

function event(overrides: Partial<AlertDiagnosticsRecentEvent> = {}): AlertDiagnosticsRecentEvent {
    return {
        id: overrides.id || 'alert-1',
        title: overrides.title || '가격 알림',
        source: overrides.source || 'MUSINSA',
        priority: overrides.priority || 'medium',
        read: overrides.read ?? false,
        archived: overrides.archived ?? false,
        generatedAt: overrides.generatedAt || '2026-03-07T00:00:00.000Z',
        mallName: overrides.mallName,
        currentPrice: overrides.currentPrice,
        targetPrice: overrides.targetPrice,
        variantLabel: overrides.variantLabel,
        productId: overrides.productId,
    };
}

test('buildAlertSourceDrilldowns aggregates top malls, variants and queue samples', () => {
    const result = buildAlertSourceDrilldowns([
        event({ id: '1', priority: 'critical', mallName: '무신사', variantLabel: '블랙 / M', read: false }),
        event({ id: '2', priority: 'high', mallName: '무신사', variantLabel: '블랙 / M', read: true }),
        event({ id: '3', priority: 'medium', mallName: '29CM', variantLabel: '블랙 / L', read: false }),
        event({ id: '4', source: '29CM', priority: 'critical', mallName: '29CM', read: false }),
    ], [sourceSummary]);

    assert.equal(result.length, 1);
    assert.equal(result[0]?.source, 'MUSINSA');
    assert.equal(result[0]?.unreadRate, 50);
    assert.equal(result[0]?.archivedRate, 25);
    assert.equal(result[0]?.topMalls[0]?.name, '무신사');
    assert.equal(result[0]?.topVariants[0]?.label, '블랙 / M');
    assert.equal(result[0]?.recentCritical.length, 1);
    assert.equal(result[0]?.recentUnread.length, 2);
});

function persona(overrides: Partial<AlertPersonaRecentProfile> = {}): AlertPersonaRecentProfile {
    return {
        userKey: overrides.userKey || 'user...0001',
        mode: overrides.mode || 'balanced',
        summary: overrides.summary || '균형 확인형',
        defaultSnoozeHours: overrides.defaultSnoozeHours ?? 72,
        unreadRate: overrides.unreadRate ?? 18,
        snoozeShare: overrides.snoozeShare ?? 12,
        avgReadLatencyMinutes: overrides.avgReadLatencyMinutes ?? 34,
        updatedAt: overrides.updatedAt || '2026-03-07T00:00:00.000Z',
    };
}

test('buildAlertPersonaSummary aggregates dominant mode and averages', () => {
    const summary = buildAlertPersonaSummary([
        persona({ mode: 'batch', defaultSnoozeHours: 168, unreadRate: 52, avgReadLatencyMinutes: 240, updatedAt: '2026-03-07T03:00:00.000Z' }),
        persona({ userKey: 'user...0002', mode: 'batch', defaultSnoozeHours: 168, unreadRate: 48, avgReadLatencyMinutes: 180, updatedAt: '2026-03-07T02:00:00.000Z' }),
        persona({ userKey: 'user...0003', mode: 'instant', defaultSnoozeHours: 24, unreadRate: 4, avgReadLatencyMinutes: 15, updatedAt: '2026-03-07T01:00:00.000Z' }),
    ]);

    assert.equal(summary.trackedProfiles, 3);
    assert.equal(summary.dominantMode, 'batch');
    assert.equal(summary.avgDefaultSnoozeHours, 120);
    assert.equal(summary.modes.find((entry) => entry.mode === 'batch')?.count, 2);
    assert.equal(summary.modes.find((entry) => entry.mode === 'batch')?.share, 66.7);
    assert.equal(summary.lastUpdatedAt, '2026-03-07T03:00:00.000Z');
});

test('buildAlertRolloutSummaries compares experiment and control cohorts by source', () => {
    const config = {
        modes: DEFAULT_ALERT_TUNING_CONFIG.modes,
        sourceOverrides: {
            MUSINSA: {
                balanced: {
                    defaultSnoozeHours: 48,
                    targetDiscountRate: 4,
                },
            },
        },
        sourceRollouts: {
            MUSINSA: 50,
        },
    };
    const expUser = Array.from({ length: 200 }, (_, index) => `exp-${index}`)
        .find((candidate) => resolveAlertTuningOverrideState(config, 'MUSINSA', candidate).enabled);
    const ctrlUser = Array.from({ length: 200 }, (_, index) => `ctrl-${index}`)
        .find((candidate) => !resolveAlertTuningOverrideState(config, 'MUSINSA', candidate).enabled);

    assert.ok(expUser);
    assert.ok(ctrlUser);

    const rollout = buildAlertRolloutSummaries(
        [
            { source: 'MUSINSA', userId: expUser!, read: false, priority: 'critical' },
            { source: 'MUSINSA', userId: expUser!, read: true, priority: 'high', readLatencyMinutes: 20 },
            { source: 'MUSINSA', userId: ctrlUser!, read: false, priority: 'medium' },
            { source: 'MUSINSA', userId: ctrlUser!, read: true, priority: 'high', readLatencyMinutes: 90 },
        ],
        [
            { source: 'MUSINSA', userId: expUser!, snoozed: false },
            { source: 'MUSINSA', userId: ctrlUser!, snoozed: true },
        ],
        config
    );

    const musinsa = rollout.find((entry) => entry.source === 'MUSINSA');
    assert.ok(musinsa);
    assert.equal(musinsa?.rolloutPercentage, 50);
    assert.equal(musinsa?.experiment.users, 1);
    assert.equal(musinsa?.control.users, 1);
    assert.equal(musinsa?.experiment.alerts, 2);
    assert.equal(musinsa?.control.alerts, 2);
    assert.equal(musinsa?.experiment.avgReadLatencyMinutes, 20);
    assert.equal(musinsa?.control.avgReadLatencyMinutes, 90);
});

test('buildAlertRolloutTrends groups experiment and control metrics by day', () => {
    const config = {
        modes: DEFAULT_ALERT_TUNING_CONFIG.modes,
        sourceOverrides: {
            MUSINSA: {
                balanced: {
                    defaultSnoozeHours: 48,
                    targetDiscountRate: 4,
                },
            },
        },
        sourceRollouts: {
            MUSINSA: 50,
        },
    };
    const expUser = Array.from({ length: 200 }, (_, index) => `trend-exp-${index}`)
        .find((candidate) => resolveAlertTuningOverrideState(config, 'MUSINSA', candidate).enabled);
    const ctrlUser = Array.from({ length: 200 }, (_, index) => `trend-ctrl-${index}`)
        .find((candidate) => !resolveAlertTuningOverrideState(config, 'MUSINSA', candidate).enabled);

    assert.ok(expUser);
    assert.ok(ctrlUser);

    const trends = buildAlertRolloutTrends(
        [
            { source: 'MUSINSA', userId: expUser!, read: false, priority: 'critical', generatedAt: '2026-03-05T10:00:00.000Z' },
            { source: 'MUSINSA', userId: expUser!, read: true, priority: 'high', readLatencyMinutes: 20, generatedAt: '2026-03-05T12:00:00.000Z' },
            { source: 'MUSINSA', userId: ctrlUser!, read: true, priority: 'high', readLatencyMinutes: 80, generatedAt: '2026-03-05T13:00:00.000Z' },
            { source: 'MUSINSA', userId: ctrlUser!, read: false, priority: 'medium', generatedAt: '2026-03-06T09:00:00.000Z' },
        ],
        config
    );

    const musinsa = trends.find((entry) => entry.source === 'MUSINSA');
    assert.ok(musinsa);
    assert.equal(musinsa?.points.length, 2);
    assert.equal(musinsa?.points[0]?.day, '2026-03-05');
    assert.equal(musinsa?.points[0]?.experimentAlerts, 2);
    assert.equal(musinsa?.points[0]?.controlAlerts, 1);
    assert.equal(musinsa?.points[0]?.experimentUnreadRate, 50);
    assert.equal(musinsa?.points[0]?.controlAvgReadLatencyMinutes, 80);
    assert.equal(musinsa?.points[1]?.day, '2026-03-06');
    assert.equal(musinsa?.points[1]?.controlAlerts, 1);
});
