import test from 'node:test';
import assert from 'node:assert/strict';
import {
    buildAlertRolloutRecommendations,
    buildAlertTuningSuggestions,
    buildRecommendedSnoozePresets,
} from '../lib/favorites/alertRecommendations.ts';

test('critical alert recommends short snooze presets first', () => {
    const presets = buildRecommendedSnoozePresets({
        priority: 'critical',
        isReached: true,
    });

    assert.equal(presets[0]?.hours, 24);
    assert.equal(presets[0]?.emphasis, 'recommended');
    assert.equal(presets[1]?.hours, 72);
});

test('medium alert recommends longer snooze presets', () => {
    const presets = buildRecommendedSnoozePresets({
        priority: 'medium',
        isReached: false,
    });

    assert.equal(presets[0]?.hours, 168);
    assert.equal(presets[1]?.hours, 336);
});

test('alert tuning suggestions prioritize unread and latency issues', () => {
    const suggestions = buildAlertTuningSuggestions([
        {
            source: 'MUSINSA',
            unreadRate: 68,
            archivedRate: 18,
            activeTargets: 10,
            snoozedTargets: 2,
            avgReadLatencyMinutes: 280,
            criticalAlerts: 1,
            highAlerts: 2,
            recentCritical: [],
            recentUnread: [{ id: '1' }],
        },
        {
            source: '29CM',
            unreadRate: 10,
            archivedRate: 12,
            activeTargets: 8,
            snoozedTargets: 1,
            avgReadLatencyMinutes: 20,
            criticalAlerts: 0,
            highAlerts: 1,
            recentCritical: [],
            recentUnread: [],
        },
    ]);

    assert.equal(suggestions[0]?.source, 'MUSINSA');
    assert.equal(suggestions[0]?.severity, 'high');
    assert.equal(suggestions[0]?.recommendedSnoozeHours, 72);
    assert.equal(suggestions[1]?.severity, 'low');
});

test('alert rollout recommendations suggest decrease on clear regression', () => {
    const recommendations = buildAlertRolloutRecommendations([
        {
            source: 'MUSINSA',
            rolloutPercentage: 75,
            experiment: {
                users: 8,
                alerts: 16,
                unreadRate: 48,
                snoozedTargetRate: 28,
                avgReadLatencyMinutes: 120,
            },
            control: {
                users: 8,
                alerts: 14,
                unreadRate: 30,
                snoozedTargetRate: 10,
                avgReadLatencyMinutes: 55,
            },
            delta: {
                unreadRate: 18,
                snoozedTargetRate: 18,
                avgReadLatencyMinutes: 65,
            },
        },
    ]);

    assert.equal(recommendations[0]?.action, 'decrease');
    assert.equal(recommendations[0]?.recommendedRolloutPercentage, 50);
});

test('alert rollout recommendations suggest increase on clear improvement', () => {
    const recommendations = buildAlertRolloutRecommendations([
        {
            source: '29CM',
            rolloutPercentage: 50,
            experiment: {
                users: 10,
                alerts: 20,
                unreadRate: 18,
                snoozedTargetRate: 12,
                avgReadLatencyMinutes: 30,
            },
            control: {
                users: 9,
                alerts: 18,
                unreadRate: 29,
                snoozedTargetRate: 17,
                avgReadLatencyMinutes: 44,
            },
            delta: {
                unreadRate: -11,
                snoozedTargetRate: -5,
                avgReadLatencyMinutes: -14,
            },
        },
    ]);

    assert.equal(recommendations[0]?.action, 'increase');
    assert.equal(recommendations[0]?.recommendedRolloutPercentage, 75);
});

test('alert rollout recommendations hold when sample is too small', () => {
    const recommendations = buildAlertRolloutRecommendations([
        {
            source: 'ABLY',
            rolloutPercentage: 25,
            experiment: {
                users: 1,
                alerts: 2,
                unreadRate: 10,
                snoozedTargetRate: 0,
                avgReadLatencyMinutes: 20,
            },
            control: {
                users: 2,
                alerts: 3,
                unreadRate: 20,
                snoozedTargetRate: 10,
                avgReadLatencyMinutes: 30,
            },
            delta: {
                unreadRate: -10,
                snoozedTargetRate: -10,
                avgReadLatencyMinutes: -10,
            },
        },
    ]);

    assert.equal(recommendations[0]?.action, 'collect_more');
    assert.equal(recommendations[0]?.recommendedRolloutPercentage, 25);
});
