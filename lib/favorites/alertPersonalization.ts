import type { AlertInboxItem } from '../../hooks/useAlertInbox.ts';
import type { Product } from '../../types/product';
import type { RecommendedSnoozePreset } from './alertRecommendations.ts';
import { isFavoriteAlertSnoozed, type AlertPriority } from './alertState.ts';

export type AlertBehaviorMode = 'instant' | 'balanced' | 'batch';
export type AlertTuningModeSettings = {
    defaultSnoozeHours: number;
    targetDiscountRate: number;
    recommendedByPriority: Record<AlertPriority, number>;
};

export type AlertTuningModeOverride = Partial<{
    defaultSnoozeHours: number;
    targetDiscountRate: number;
    recommendedByPriority: Partial<Record<AlertPriority, number>>;
}>;

export type AlertTuningConfig = {
    modes: Record<AlertBehaviorMode, AlertTuningModeSettings>;
    sourceOverrides?: Record<string, Partial<Record<AlertBehaviorMode, AlertTuningModeOverride>>>;
    sourceRollouts?: Record<string, number>;
};

export type AlertBehaviorProfile = {
    mode: AlertBehaviorMode;
    summary: string;
    detail: string;
    defaultSnoozeHours: number;
    targetDiscountRate: number;
    recommendedByPriority: Record<AlertPriority, number>;
    unreadRate: number;
    snoozeShare: number;
    avgReadLatencyMinutes: number;
    activeTargets: number;
};

export type AlertBehaviorProfileSnapshot = AlertBehaviorProfile;

export type AlertTargetSuggestion = {
    suggestedPrice?: number;
    discountRate: number;
    label: string;
    reason: string;
    isExistingTarget: boolean;
};

export const DEFAULT_ALERT_TUNING_CONFIG: AlertTuningConfig = {
    modes: {
        instant: {
            defaultSnoozeHours: 24,
            targetDiscountRate: 3,
            recommendedByPriority: {
                critical: 24,
                high: 24,
                medium: 72,
            },
        },
        balanced: {
            defaultSnoozeHours: 72,
            targetDiscountRate: 5,
            recommendedByPriority: {
                critical: 24,
                high: 72,
                medium: 168,
            },
        },
        batch: {
            defaultSnoozeHours: 168,
            targetDiscountRate: 8,
            recommendedByPriority: {
                critical: 72,
                high: 168,
                medium: 336,
            },
        },
    },
    sourceOverrides: {},
    sourceRollouts: {},
};

export type AlertTuningOverrideState = {
    source: string | null;
    hasOverride: boolean;
    rolloutPercentage: number;
    rolloutBucket: number | null;
    enabled: boolean;
};

function hoursLabel(hours: number): string {
    if (hours % 24 === 0) {
        const days = hours / 24;
        return `${days}d`;
    }

    return `${hours}h`;
}

function computeMode(args: {
    unreadRate: number;
    snoozeShare: number;
    avgReadLatencyMinutes: number;
}): AlertBehaviorMode {
    if (args.avgReadLatencyMinutes >= 180 || args.unreadRate >= 50 || args.snoozeShare >= 45) {
        return 'batch';
    }

    if (args.avgReadLatencyMinutes > 0 && args.avgReadLatencyMinutes <= 45 && args.unreadRate <= 15 && args.snoozeShare <= 15) {
        return 'instant';
    }

    return 'balanced';
}

function cloneTuningConfig(config: AlertTuningConfig): AlertTuningConfig {
    const sourceOverrides = Object.fromEntries(
        Object.entries(config.sourceOverrides || {}).map(([source, modes]) => [
            source,
            {
                instant: modes.instant ? {
                    defaultSnoozeHours: modes.instant.defaultSnoozeHours,
                    targetDiscountRate: modes.instant.targetDiscountRate,
                    recommendedByPriority: modes.instant.recommendedByPriority ? { ...modes.instant.recommendedByPriority } : undefined,
                } : undefined,
                balanced: modes.balanced ? {
                    defaultSnoozeHours: modes.balanced.defaultSnoozeHours,
                    targetDiscountRate: modes.balanced.targetDiscountRate,
                    recommendedByPriority: modes.balanced.recommendedByPriority ? { ...modes.balanced.recommendedByPriority } : undefined,
                } : undefined,
                batch: modes.batch ? {
                    defaultSnoozeHours: modes.batch.defaultSnoozeHours,
                    targetDiscountRate: modes.batch.targetDiscountRate,
                    recommendedByPriority: modes.batch.recommendedByPriority ? { ...modes.batch.recommendedByPriority } : undefined,
                } : undefined,
            },
        ])
    );

    return {
        modes: {
            instant: {
                defaultSnoozeHours: config.modes.instant.defaultSnoozeHours,
                targetDiscountRate: config.modes.instant.targetDiscountRate,
                recommendedByPriority: { ...config.modes.instant.recommendedByPriority },
            },
            balanced: {
                defaultSnoozeHours: config.modes.balanced.defaultSnoozeHours,
                targetDiscountRate: config.modes.balanced.targetDiscountRate,
                recommendedByPriority: { ...config.modes.balanced.recommendedByPriority },
            },
            batch: {
                defaultSnoozeHours: config.modes.batch.defaultSnoozeHours,
                targetDiscountRate: config.modes.batch.targetDiscountRate,
                recommendedByPriority: { ...config.modes.batch.recommendedByPriority },
            },
        },
        sourceOverrides,
        sourceRollouts: Object.fromEntries(
            Object.entries(config.sourceRollouts || {}).map(([source, percentage]) => [source, percentage])
        ),
    };
}

function isValidPriorityMap(value: unknown): value is Record<AlertPriority, number> {
    if (!value || typeof value !== 'object') {
        return false;
    }

    const map = value as Record<string, unknown>;
    return typeof map.critical === 'number'
        && typeof map.high === 'number'
        && typeof map.medium === 'number';
}

function parseModeSettings(value: unknown, fallback: AlertTuningModeSettings): AlertTuningModeSettings {
    if (!value || typeof value !== 'object') {
        return {
            defaultSnoozeHours: fallback.defaultSnoozeHours,
            targetDiscountRate: fallback.targetDiscountRate,
            recommendedByPriority: { ...fallback.recommendedByPriority },
        };
    }

    const data = value as Record<string, unknown>;
    return {
        defaultSnoozeHours: typeof data.defaultSnoozeHours === 'number' ? data.defaultSnoozeHours : fallback.defaultSnoozeHours,
        targetDiscountRate: typeof data.targetDiscountRate === 'number' ? data.targetDiscountRate : fallback.targetDiscountRate,
        recommendedByPriority: isValidPriorityMap(data.recommendedByPriority)
            ? {
                critical: data.recommendedByPriority.critical,
                high: data.recommendedByPriority.high,
                medium: data.recommendedByPriority.medium,
            }
            : { ...fallback.recommendedByPriority },
    };
}

function clampRolloutPercentage(value: unknown, fallback: number): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) {
        return fallback;
    }

    return Math.min(100, Math.max(0, Math.round(value * 10) / 10));
}

export function parseAlertTuningConfig(value: unknown): AlertTuningConfig | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const root = value as Record<string, unknown>;
    const modes = (root.modes && typeof root.modes === 'object') ? root.modes as Record<string, unknown> : root;

    const sourceOverridesRaw = root.sourceOverrides && typeof root.sourceOverrides === 'object'
        ? root.sourceOverrides as Record<string, unknown>
        : {};
    const sourceRolloutsRaw = root.sourceRollouts && typeof root.sourceRollouts === 'object'
        ? root.sourceRollouts as Record<string, unknown>
        : {};

    const sourceOverrides = Object.fromEntries(
        Object.entries(sourceOverridesRaw).map(([source, modeValue]) => {
            const modeRoot = modeValue && typeof modeValue === 'object' ? modeValue as Record<string, unknown> : {};
            return [
                source.toUpperCase(),
                {
                    instant: modeRoot.instant && typeof modeRoot.instant === 'object' ? modeRoot.instant as AlertTuningModeOverride : undefined,
                    balanced: modeRoot.balanced && typeof modeRoot.balanced === 'object' ? modeRoot.balanced as AlertTuningModeOverride : undefined,
                    batch: modeRoot.batch && typeof modeRoot.batch === 'object' ? modeRoot.batch as AlertTuningModeOverride : undefined,
                },
            ];
        })
    );

    return {
        modes: {
            instant: parseModeSettings(modes.instant, DEFAULT_ALERT_TUNING_CONFIG.modes.instant),
            balanced: parseModeSettings(modes.balanced, DEFAULT_ALERT_TUNING_CONFIG.modes.balanced),
            batch: parseModeSettings(modes.batch, DEFAULT_ALERT_TUNING_CONFIG.modes.batch),
        },
        sourceOverrides,
        sourceRollouts: Object.fromEntries(
            Object.entries(sourceRolloutsRaw).map(([source, percentage]) => [
                source.toUpperCase(),
                clampRolloutPercentage(percentage, 100),
            ])
        ),
    };
}

export function resolveAlertTuningConfig(value?: unknown): AlertTuningConfig {
    return cloneTuningConfig(parseAlertTuningConfig(value) || DEFAULT_ALERT_TUNING_CONFIG);
}

function normalizeSourceKey(source?: string | null): string | null {
    if (!source || !source.trim()) {
        return null;
    }

    return source.trim().toUpperCase();
}

function computeStableRolloutBucket(source: string, userKey: string): number {
    const seed = `${source}:${userKey}`;
    let hash = 0;
    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash * 31 + seed.charCodeAt(index)) % 10000;
    }

    return Math.abs(hash % 10000) / 100;
}

export function resolveAlertTuningOverrideState(
    configInput: unknown,
    source?: string | null,
    userKey?: string | null
): AlertTuningOverrideState {
    const sourceKey = normalizeSourceKey(source);
    if (!sourceKey) {
        return {
            source: null,
            hasOverride: false,
            rolloutPercentage: 0,
            rolloutBucket: null,
            enabled: false,
        };
    }

    const config = resolveAlertTuningConfig(configInput);
    const hasOverride = Boolean(config.sourceOverrides?.[sourceKey]);
    const rolloutPercentage = clampRolloutPercentage(
        config.sourceRollouts?.[sourceKey],
        hasOverride ? 100 : 0
    );

    if (!hasOverride) {
        return {
            source: sourceKey,
            hasOverride: false,
            rolloutPercentage: 0,
            rolloutBucket: null,
            enabled: false,
        };
    }

    if (rolloutPercentage >= 100) {
        return {
            source: sourceKey,
            hasOverride: true,
            rolloutPercentage: 100,
            rolloutBucket: userKey ? computeStableRolloutBucket(sourceKey, userKey) : null,
            enabled: true,
        };
    }

    if (rolloutPercentage <= 0 || !userKey) {
        return {
            source: sourceKey,
            hasOverride: true,
            rolloutPercentage,
            rolloutBucket: userKey ? computeStableRolloutBucket(sourceKey, userKey) : null,
            enabled: false,
        };
    }

    const rolloutBucket = computeStableRolloutBucket(sourceKey, userKey);
    return {
        source: sourceKey,
        hasOverride: true,
        rolloutPercentage,
        rolloutBucket,
        enabled: rolloutBucket < rolloutPercentage,
    };
}

function mergePriorityMap(
    base: Record<AlertPriority, number>,
    override?: Partial<Record<AlertPriority, number>>
): Record<AlertPriority, number> {
    return {
        critical: typeof override?.critical === 'number' ? override.critical : base.critical,
        high: typeof override?.high === 'number' ? override.high : base.high,
        medium: typeof override?.medium === 'number' ? override.medium : base.medium,
    };
}

export function resolveAlertTuningModeSettings(
    configInput: unknown,
    mode: AlertBehaviorMode,
    source?: string | null,
    userKey?: string | null
): AlertTuningModeSettings {
    const config = resolveAlertTuningConfig(configInput);
    const base = config.modes[mode];
    const overrideState = resolveAlertTuningOverrideState(config, source, userKey);
    const override = overrideState.enabled && overrideState.source
        ? config.sourceOverrides?.[overrideState.source]?.[mode]
        : undefined;

    return {
        defaultSnoozeHours: typeof override?.defaultSnoozeHours === 'number'
            ? override.defaultSnoozeHours
            : base.defaultSnoozeHours,
        targetDiscountRate: typeof override?.targetDiscountRate === 'number'
            ? override.targetDiscountRate
            : base.targetDiscountRate,
        recommendedByPriority: mergePriorityMap(base.recommendedByPriority, override?.recommendedByPriority),
    };
}

function profileConfig(
    mode: AlertBehaviorMode,
    tuningConfig: AlertTuningConfig,
    source?: string | null
): Pick<AlertBehaviorProfile, 'summary' | 'detail' | 'defaultSnoozeHours' | 'targetDiscountRate' | 'recommendedByPriority'> {
    const settings = resolveAlertTuningModeSettings(tuningConfig, mode, source);

    switch (mode) {
        case 'instant':
            return {
                summary: '빠른 대응형',
                detail: '도착한 알림을 비교적 빠르게 확인하는 패턴입니다.',
                defaultSnoozeHours: settings.defaultSnoozeHours,
                targetDiscountRate: settings.targetDiscountRate,
                recommendedByPriority: { ...settings.recommendedByPriority },
            };
        case 'batch':
            return {
                summary: '배치 확인형',
                detail: '알림을 모아서 확인하는 경향이 있어 긴 스누즈가 더 잘 맞습니다.',
                defaultSnoozeHours: settings.defaultSnoozeHours,
                targetDiscountRate: settings.targetDiscountRate,
                recommendedByPriority: { ...settings.recommendedByPriority },
            };
        case 'balanced':
        default:
            return {
                summary: '균형 확인형',
                detail: '짧은 알림과 긴 알림을 섞어서 확인하는 안정적인 패턴입니다.',
                defaultSnoozeHours: settings.defaultSnoozeHours,
                targetDiscountRate: settings.targetDiscountRate,
                recommendedByPriority: { ...settings.recommendedByPriority },
            };
    }
}

export function buildAlertBehaviorProfile(args: {
    alerts: AlertInboxItem[];
    favorites: Product[];
}, tuningConfigInput?: unknown, source?: string | null): AlertBehaviorProfile {
    const tuningConfig = resolveAlertTuningConfig(tuningConfigInput);
    const activeAlerts = args.alerts.filter((alert) => !alert.archivedAt);
    const unreadAlerts = activeAlerts.filter((alert) => !alert.read);
    const readLatencies = activeAlerts.flatMap((alert) => {
        if (!alert.read || typeof alert.readAt !== 'number' || typeof alert.createdAt !== 'number' || alert.readAt < alert.createdAt) {
            return [];
        }

        return [Math.round((alert.readAt - alert.createdAt) / 60_000)];
    });
    const avgReadLatencyMinutes = readLatencies.length > 0
        ? Math.round(readLatencies.reduce((sum, value) => sum + value, 0) / readLatencies.length)
        : 0;

    const alertTargets = args.favorites.filter((favorite) => typeof favorite.targetPrice === 'number' && favorite.targetPrice > 0);
    const snoozedTargets = alertTargets.filter((favorite) => isFavoriteAlertSnoozed(favorite)).length;
    const unreadRate = activeAlerts.length > 0
        ? Math.round((unreadAlerts.length / activeAlerts.length) * 1000) / 10
        : 0;
    const snoozeShare = alertTargets.length > 0
        ? Math.round((snoozedTargets / alertTargets.length) * 1000) / 10
        : 0;
    const mode = computeMode({
        unreadRate,
        snoozeShare,
        avgReadLatencyMinutes,
    });
    const config = profileConfig(mode, tuningConfig, source);

    return {
        ...config,
        mode,
        unreadRate,
        snoozeShare,
        avgReadLatencyMinutes,
        activeTargets: alertTargets.length,
    };
}

export function buildPersonalizedSnoozePresets(args: {
    priority: AlertPriority;
    isReached: boolean;
    isSnoozed?: boolean;
    profile: AlertBehaviorProfile;
}): RecommendedSnoozePreset[] {
    if (args.isSnoozed) {
        return [];
    }

    const firstHours = args.profile.recommendedByPriority[args.priority];
    const secondHours = Math.max(firstHours * 2, args.priority === 'critical' ? 72 : firstHours + 72);
    const contextReason = args.isReached
        ? `${args.profile.summary} 패턴 기준으로 도달 직후 재확인 간격을 조정했습니다.`
        : `${args.profile.summary} 패턴 기준으로 기본 재확인 간격을 추천합니다.`;

    return [
        {
            hours: firstHours,
            label: hoursLabel(firstHours),
            reason: `${contextReason} 현재는 ${hoursLabel(firstHours)}가 가장 적합합니다.`,
            emphasis: 'recommended',
        },
        {
            hours: secondHours,
            label: hoursLabel(secondHours),
            reason: `${args.profile.detail} 더 길게 비우려면 ${hoursLabel(secondHours)}까지 늘릴 수 있습니다.`,
            emphasis: 'secondary',
        },
    ];
}

export function toAlertBehaviorProfileSnapshot(profile: AlertBehaviorProfile): AlertBehaviorProfileSnapshot {
    return {
        mode: profile.mode,
        summary: profile.summary,
        detail: profile.detail,
        defaultSnoozeHours: profile.defaultSnoozeHours,
        targetDiscountRate: profile.targetDiscountRate,
        recommendedByPriority: {
            critical: profile.recommendedByPriority.critical,
            high: profile.recommendedByPriority.high,
            medium: profile.recommendedByPriority.medium,
        },
        unreadRate: profile.unreadRate,
        snoozeShare: profile.snoozeShare,
        avgReadLatencyMinutes: profile.avgReadLatencyMinutes,
        activeTargets: profile.activeTargets,
    };
}

export function parseAlertBehaviorProfileSnapshot(value: unknown, tuningConfigInput?: unknown): AlertBehaviorProfileSnapshot | null {
    if (!value || typeof value !== 'object') {
        return null;
    }

    const data = value as Record<string, unknown>;
    const tuningConfig = resolveAlertTuningConfig(tuningConfigInput);
    const recommended = data.recommendedByPriority;
    if (
        (data.mode !== 'instant' && data.mode !== 'balanced' && data.mode !== 'batch') ||
        typeof data.summary !== 'string' ||
        typeof data.detail !== 'string' ||
        typeof data.defaultSnoozeHours !== 'number' ||
        !recommended ||
        typeof recommended !== 'object'
    ) {
        return null;
    }

    const recommendedByPriority = recommended as Record<string, unknown>;
    if (
        typeof recommendedByPriority.critical !== 'number' ||
        typeof recommendedByPriority.high !== 'number' ||
        typeof recommendedByPriority.medium !== 'number' ||
        typeof data.unreadRate !== 'number' ||
        typeof data.snoozeShare !== 'number' ||
        typeof data.avgReadLatencyMinutes !== 'number' ||
        typeof data.activeTargets !== 'number'
    ) {
        return null;
    }

    return {
        mode: data.mode,
        summary: data.summary,
        detail: data.detail,
        defaultSnoozeHours: data.defaultSnoozeHours,
        targetDiscountRate: typeof data.targetDiscountRate === 'number'
            ? data.targetDiscountRate
            : tuningConfig.modes[data.mode].targetDiscountRate,
        recommendedByPriority: {
            critical: recommendedByPriority.critical,
            high: recommendedByPriority.high,
            medium: recommendedByPriority.medium,
        },
        unreadRate: data.unreadRate,
        snoozeShare: data.snoozeShare,
        avgReadLatencyMinutes: data.avgReadLatencyMinutes,
        activeTargets: data.activeTargets,
    };
}

export function areAlertBehaviorProfilesEqual(
    left?: AlertBehaviorProfileSnapshot | null,
    right?: AlertBehaviorProfileSnapshot | null
): boolean {
    if (!left || !right) {
        return false;
    }

    return JSON.stringify(toAlertBehaviorProfileSnapshot(left)) === JSON.stringify(toAlertBehaviorProfileSnapshot(right));
}

export function applyAlertTuningOverrideToProfile(
    profile: AlertBehaviorProfile,
    tuningConfigInput?: unknown,
    source?: string | null,
    userKey?: string | null
): AlertBehaviorProfile {
    const overrideState = resolveAlertTuningOverrideState(tuningConfigInput, source, userKey);
    if (!overrideState.enabled || !overrideState.source) {
        return profile;
    }

    const settings = resolveAlertTuningModeSettings(tuningConfigInput, profile.mode, overrideState.source, userKey);
    return {
        ...profile,
        defaultSnoozeHours: settings.defaultSnoozeHours,
        targetDiscountRate: settings.targetDiscountRate,
        recommendedByPriority: settings.recommendedByPriority,
    };
}

function roundPriceToThousand(price: number): number {
    return Math.max(1000, Math.floor(price / 1000) * 1000);
}

export function buildPersonalizedTargetSuggestion(args: {
    currentPrice?: number;
    targetPrice?: number;
    profile: AlertBehaviorProfile;
}): AlertTargetSuggestion {
    const currentPrice = typeof args.currentPrice === 'number' && Number.isFinite(args.currentPrice)
        ? args.currentPrice
        : undefined;
    const targetPrice = typeof args.targetPrice === 'number' && Number.isFinite(args.targetPrice)
        ? args.targetPrice
        : undefined;

    if (currentPrice && targetPrice && targetPrice > 0 && targetPrice < currentPrice) {
        const discountRate = Math.max(0, Math.round(((currentPrice - targetPrice) / currentPrice) * 1000) / 10);
        return {
            suggestedPrice: targetPrice,
            discountRate,
            label: '현재 추적 목표가 유지',
            reason: `이미 현재가 대비 ${discountRate}% 낮은 목표가를 추적 중입니다.`,
            isExistingTarget: true,
        };
    }

    if (!currentPrice || currentPrice <= 0) {
        return {
            suggestedPrice: targetPrice && targetPrice > 0 ? targetPrice : undefined,
            discountRate: 0,
            label: targetPrice && targetPrice > 0 ? '현재 목표가 사용' : '추천 목표가 없음',
            reason: '현재가 정보가 부족해 개인화 추천 목표가를 계산하지 못했습니다.',
            isExistingTarget: Boolean(targetPrice && targetPrice > 0),
        };
    }

    const discountRate = args.profile.targetDiscountRate;
    const suggestedPrice = roundPriceToThousand(currentPrice * (1 - discountRate / 100));

    return {
        suggestedPrice,
        discountRate,
        label: `${args.profile.summary} 추천 목표가`,
        reason: `${args.profile.summary} 패턴 기준으로 현재가에서 ${discountRate}% 내려간 지점을 먼저 추적하는 편이 적합합니다.`,
        isExistingTarget: false,
    };
}
