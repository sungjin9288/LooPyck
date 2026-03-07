import test from 'node:test';
import assert from 'node:assert/strict';
import type { AlertInboxItem } from '../hooks/useAlertInbox.ts';
import type { Product } from '../types/product';
import {
    DEFAULT_ALERT_TUNING_CONFIG,
    applyAlertTuningOverrideToProfile,
    areAlertBehaviorProfilesEqual,
    buildAlertBehaviorProfile,
    buildPersonalizedSnoozePresets,
    buildPersonalizedTargetSuggestion,
    parseAlertTuningConfig,
    parseAlertBehaviorProfileSnapshot,
    resolveAlertTuningOverrideState,
    toAlertBehaviorProfileSnapshot,
} from '../lib/favorites/alertPersonalization.ts';

function alert(overrides: Partial<AlertInboxItem> = {}): AlertInboxItem {
    return {
        createdAt: overrides.createdAt || 1_000,
        id: overrides.id || 'alert-1',
        message: overrides.message || '가격 알림',
        read: overrides.read ?? false,
        title: overrides.title || '가격 알림',
        type: overrides.type || 'alert',
        archivedAt: overrides.archivedAt,
        currentPrice: overrides.currentPrice,
        deepLink: overrides.deepLink,
        favoriteId: overrides.favoriteId,
        link: overrides.link,
        mallName: overrides.mallName,
        priority: overrides.priority,
        productId: overrides.productId,
        readAt: overrides.readAt,
        source: overrides.source,
        targetPrice: overrides.targetPrice,
        variantKey: overrides.variantKey,
        variantLabel: overrides.variantLabel,
        cheapestLink: overrides.cheapestLink,
        cheapestMall: overrides.cheapestMall,
        cheapestPrice: overrides.cheapestPrice,
    };
}

function favorite(overrides: Partial<Product> = {}): Product {
    return {
        favoriteId: overrides.favoriteId,
        title: overrides.title || '테스트 상품',
        link: overrides.link || 'https://example.com/item',
        image: overrides.image || 'https://example.com/item.jpg',
        lprice: overrides.lprice || '129000',
        hprice: overrides.hprice || '129000',
        mallName: overrides.mallName || '무신사',
        productId: overrides.productId || 'item-1',
        productType: overrides.productType || '1',
        brand: overrides.brand || '테스트',
        maker: overrides.maker || '',
        category1: overrides.category1 || '상의',
        category2: overrides.category2 || '후드',
        category3: overrides.category3 || '',
        category4: overrides.category4 || '',
        source: overrides.source || 'MUSINSA',
        variantKey: overrides.variantKey,
        variantLabel: overrides.variantLabel,
        targetPrice: overrides.targetPrice,
        alertSnoozedUntil: overrides.alertSnoozedUntil,
    };
}

test('buildAlertBehaviorProfile returns batch mode for slow unread-heavy pattern', () => {
    const profile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: false }),
            alert({ id: 'alert-2', read: false }),
            alert({ id: 'alert-3', read: true, readAt: 1_000 + 240 * 60_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000, alertSnoozedUntil: Date.now() + 60_000 }),
            favorite({ favoriteId: 'fav-2', targetPrice: 100000 }),
        ],
    });

    assert.equal(profile.mode, 'batch');
    assert.equal(profile.defaultSnoozeHours, 168);
});

test('buildAlertBehaviorProfile returns instant mode for quick clean pattern', () => {
    const profile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: true, readAt: 1_000 + 20 * 60_000 }),
            alert({ id: 'alert-2', read: true, createdAt: 2_000, readAt: 2_000 + 25 * 60_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000 }),
        ],
    });

    assert.equal(profile.mode, 'instant');
    assert.equal(profile.defaultSnoozeHours, 24);
});

test('buildPersonalizedSnoozePresets uses profile priority defaults', () => {
    const profile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: false }),
            alert({ id: 'alert-2', read: false }),
            alert({ id: 'alert-3', read: true, readAt: 1_000 + 240 * 60_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000, alertSnoozedUntil: Date.now() + 60_000 }),
            favorite({ favoriteId: 'fav-2', targetPrice: 100000 }),
        ],
    });

    const presets = buildPersonalizedSnoozePresets({
        priority: 'high',
        isReached: false,
        profile,
    });

    assert.equal(presets[0]?.hours, 168);
    assert.equal(presets[1]?.hours, 336);
});

test('buildPersonalizedTargetSuggestion keeps existing lower target when already tracking', () => {
    const profile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: true, readAt: 1_000 + 20 * 60_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000 }),
        ],
    });

    const suggestion = buildPersonalizedTargetSuggestion({
        currentPrice: 129000,
        targetPrice: 115000,
        profile,
    });

    assert.equal(suggestion.suggestedPrice, 115000);
    assert.equal(suggestion.isExistingTarget, true);
});

test('buildPersonalizedTargetSuggestion follows profile mode discount', () => {
    const profile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: false }),
            alert({ id: 'alert-2', read: false }),
            alert({ id: 'alert-3', read: true, readAt: 1_000 + 240 * 60_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000, alertSnoozedUntil: Date.now() + 60_000 }),
            favorite({ favoriteId: 'fav-2', targetPrice: 100000 }),
        ],
    });

    const suggestion = buildPersonalizedTargetSuggestion({
        currentPrice: 129000,
        profile,
    });

    assert.equal(profile.mode, 'batch');
    assert.equal(suggestion.suggestedPrice, 118000);
    assert.equal(suggestion.discountRate, 8);
    assert.equal(suggestion.isExistingTarget, false);
});

test('alert behavior snapshot round-trips through parser', () => {
    const profile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: true, readAt: 1_000 + 20 * 60_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000 }),
        ],
    });

    const snapshot = toAlertBehaviorProfileSnapshot(profile);
    const parsed = parseAlertBehaviorProfileSnapshot(snapshot);

    assert.deepEqual(parsed, snapshot);
    assert.equal(areAlertBehaviorProfilesEqual(snapshot, snapshot), true);
    assert.equal(areAlertBehaviorProfilesEqual(snapshot, profile), true);
});

test('alert behavior parser rejects wrapped profile payloads', () => {
    const profile = buildAlertBehaviorProfile({
        alerts: [alert({ read: false })],
        favorites: [favorite({ targetPrice: 100000 })],
    });

    assert.equal(parseAlertBehaviorProfileSnapshot({ profile: toAlertBehaviorProfileSnapshot(profile) }), null);
});

test('custom alert tuning config overrides mode defaults', () => {
    const customConfig = parseAlertTuningConfig({
        modes: {
            instant: DEFAULT_ALERT_TUNING_CONFIG.modes.instant,
            balanced: {
                defaultSnoozeHours: 96,
                targetDiscountRate: 7,
                recommendedByPriority: {
                    critical: 36,
                    high: 96,
                    medium: 192,
                },
            },
            batch: DEFAULT_ALERT_TUNING_CONFIG.modes.batch,
        },
    });

    const profile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: true, readAt: 1_000 + 60 * 60_000 }),
            alert({ id: 'alert-2', read: true, createdAt: 2_000, readAt: 2_000 + 80 * 60_000 }),
            alert({ id: 'alert-3', read: false, createdAt: 3_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000 }),
        ],
    }, customConfig);

    assert.equal(profile.mode, 'balanced');
    assert.equal(profile.defaultSnoozeHours, 96);
    assert.equal(profile.targetDiscountRate, 7);
    assert.equal(profile.recommendedByPriority.high, 96);
});

test('source override applies per-source target discount and snooze defaults', () => {
    const config = parseAlertTuningConfig({
        modes: DEFAULT_ALERT_TUNING_CONFIG.modes,
        sourceOverrides: {
            MUSINSA: {
                balanced: {
                    defaultSnoozeHours: 48,
                    targetDiscountRate: 4,
                    recommendedByPriority: {
                        high: 48,
                    },
                },
            },
        },
        sourceRollouts: {
            MUSINSA: 100,
        },
    });

    const baseProfile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: true, readAt: 1_000 + 60 * 60_000 }),
            alert({ id: 'alert-2', read: true, createdAt: 2_000, readAt: 2_000 + 80 * 60_000 }),
            alert({ id: 'alert-3', read: false, createdAt: 3_000 }),
        ],
        favorites: [
            favorite({ targetPrice: 100000 }),
        ],
    }, config);
    const sourceProfile = applyAlertTuningOverrideToProfile(baseProfile, config, 'MUSINSA');

    assert.equal(sourceProfile.defaultSnoozeHours, 48);
    assert.equal(sourceProfile.targetDiscountRate, 4);
    assert.equal(sourceProfile.recommendedByPriority.high, 48);
    assert.equal(sourceProfile.recommendedByPriority.critical, 24);
});

test('source override is skipped when rollout is disabled for all users', () => {
    const config = parseAlertTuningConfig({
        modes: DEFAULT_ALERT_TUNING_CONFIG.modes,
        sourceOverrides: {
            MUSINSA: {
                batch: {
                    defaultSnoozeHours: 48,
                    targetDiscountRate: 4,
                },
            },
        },
        sourceRollouts: {
            MUSINSA: 0,
        },
    });

    const baseProfile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: true, readAt: 1_000 + 60 * 60_000 }),
            alert({ id: 'alert-2', read: false, createdAt: 2_000 }),
        ],
        favorites: [favorite({ targetPrice: 100000 })],
    }, config);
    const sourceProfile = applyAlertTuningOverrideToProfile(baseProfile, config, 'MUSINSA', 'user-rollout-off');

    assert.equal(sourceProfile.defaultSnoozeHours, baseProfile.defaultSnoozeHours);
    assert.equal(sourceProfile.targetDiscountRate, baseProfile.targetDiscountRate);
});

test('source override rollout assigns stable active and control groups', () => {
    const config = parseAlertTuningConfig({
        modes: DEFAULT_ALERT_TUNING_CONFIG.modes,
        sourceOverrides: {
            MUSINSA: {
                batch: {
                    defaultSnoozeHours: 48,
                    targetDiscountRate: 4,
                },
            },
        },
        sourceRollouts: {
            MUSINSA: 35,
        },
    });

    const activeKey = Array.from({ length: 500 }, (_, index) => `rollout-active-${index}`)
        .find((candidate) => resolveAlertTuningOverrideState(config, 'MUSINSA', candidate).enabled);
    const controlKey = Array.from({ length: 500 }, (_, index) => `rollout-control-${index}`)
        .find((candidate) => !resolveAlertTuningOverrideState(config, 'MUSINSA', candidate).enabled);

    assert.ok(activeKey);
    assert.ok(controlKey);

    const activeState = resolveAlertTuningOverrideState(config, 'MUSINSA', activeKey);
    const controlState = resolveAlertTuningOverrideState(config, 'MUSINSA', controlKey);
    assert.equal(activeState.enabled, true);
    assert.equal(controlState.enabled, false);
    assert.equal(resolveAlertTuningOverrideState(config, 'MUSINSA', activeKey).rolloutBucket, activeState.rolloutBucket);

    const baseProfile = buildAlertBehaviorProfile({
        alerts: [
            alert({ read: true, readAt: 1_000 + 60 * 60_000 }),
            alert({ id: 'alert-2', read: false, createdAt: 2_000 }),
        ],
        favorites: [favorite({ targetPrice: 100000 })],
    }, config);

    const activeProfile = applyAlertTuningOverrideToProfile(baseProfile, config, 'MUSINSA', activeKey);
    const controlProfile = applyAlertTuningOverrideToProfile(baseProfile, config, 'MUSINSA', controlKey);
    assert.equal(activeProfile.defaultSnoozeHours, 48);
    assert.equal(controlProfile.defaultSnoozeHours, baseProfile.defaultSnoozeHours);
});
