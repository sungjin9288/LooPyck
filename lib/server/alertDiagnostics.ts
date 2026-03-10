import { FieldPath, Timestamp } from 'firebase-admin/firestore';
import {
    parseAlertBehaviorProfileSnapshot,
    resolveAlertTuningConfig,
    resolveAlertTuningOverrideState,
    type AlertBehaviorMode,
    type AlertTuningConfig,
} from '../favorites/alertPersonalization.ts';
import { deriveAlertPriority, isFavoriteAlertSnoozed, type AlertPriority } from '../favorites/alertState.ts';
import { getAdminDb } from './firebaseAdmin.ts';

const MAX_RECENT_ALERTS = 180;
const MAX_FAVORITES = 800;
const MAX_ALERT_PERSONAS = 400;

type AlertDoc = {
    archivedAt?: Timestamp | Date | number | null;
    createdAt?: Timestamp | Date | number | null;
    currentPrice?: number | null;
    mallName?: string | null;
    message?: string | null;
    priority?: AlertPriority | null;
    productId?: string | null;
    read?: boolean | null;
    readAt?: Timestamp | Date | number | null;
    source?: string | null;
    targetPrice?: number | null;
    title?: string | null;
    variantLabel?: string | null;
};

type FavoriteDoc = {
    alertSnoozedUntil?: number | null;
    source?: string | null;
    targetPrice?: number | null;
};

type AlertPersonaDoc = {
    profile?: unknown;
    updatedAt?: Timestamp | Date | number | null;
};

export type AlertDiagnosticsSourceSummary = {
    source: string;
    alerts: number;
    unreadCount: number;
    archivedCount: number;
    highPriorityCount: number;
    criticalPriorityCount: number;
    activeTargets: number;
    snoozedTargets: number;
    avgReadLatencyMinutes: number;
    lastSeenAt: string | null;
};

export type AlertDiagnosticsRecentEvent = {
    id: string;
    title: string;
    source: string;
    mallName?: string;
    priority: AlertPriority;
    read: boolean;
    archived: boolean;
    currentPrice?: number;
    targetPrice?: number;
    generatedAt: string;
    variantLabel?: string;
    productId?: string;
};

export type AlertDiagnosticsSummary = {
    trackedAlerts: number;
    unreadCount: number;
    archivedCount: number;
    activeTargets: number;
    snoozedTargets: number;
    criticalPriorityCount: number;
    highPriorityCount: number;
    avgReadLatencyMinutes: number;
    lastUpdatedAt: string | null;
    sources: AlertDiagnosticsSourceSummary[];
};

export type AlertDiagnosticsSourceDrilldown = {
    source: string;
    unreadRate: number;
    archivedRate: number;
    activeTargets: number;
    snoozedTargets: number;
    avgReadLatencyMinutes: number;
    criticalAlerts: number;
    highAlerts: number;
    topMalls: Array<{ name: string; count: number }>;
    topVariants: Array<{ label: string; count: number }>;
    recentCritical: AlertDiagnosticsRecentEvent[];
    recentUnread: AlertDiagnosticsRecentEvent[];
};

export type AlertPersonaModeSummary = {
    mode: AlertBehaviorMode;
    count: number;
    share: number;
    avgDefaultSnoozeHours: number;
    avgUnreadRate: number;
    avgReadLatencyMinutes: number;
};

export type AlertPersonaRecentProfile = {
    userKey: string;
    mode: AlertBehaviorMode;
    summary: string;
    defaultSnoozeHours: number;
    unreadRate: number;
    snoozeShare: number;
    avgReadLatencyMinutes: number;
    updatedAt: string | null;
};

export type AlertPersonaSummary = {
    trackedProfiles: number;
    dominantMode: AlertBehaviorMode | null;
    avgDefaultSnoozeHours: number;
    avgUnreadRate: number;
    avgReadLatencyMinutes: number;
    lastUpdatedAt: string | null;
    modes: AlertPersonaModeSummary[];
};

export type AlertRolloutCohortSummary = {
    users: number;
    alerts: number;
    unreadCount: number;
    unreadRate: number;
    activeTargets: number;
    snoozedTargets: number;
    snoozedTargetRate: number;
    criticalAlerts: number;
    highAlerts: number;
    avgReadLatencyMinutes: number;
};

export type AlertRolloutSourceSummary = {
    source: string;
    rolloutPercentage: number;
    experiment: AlertRolloutCohortSummary;
    control: AlertRolloutCohortSummary;
    delta: {
        unreadRate: number;
        snoozedTargetRate: number;
        avgReadLatencyMinutes: number;
    };
};

export type AlertRolloutTrendPoint = {
    day: string;
    experimentAlerts: number;
    controlAlerts: number;
    experimentUnreadRate: number;
    controlUnreadRate: number;
    experimentAvgReadLatencyMinutes: number;
    controlAvgReadLatencyMinutes: number;
};

export type AlertRolloutTrend = {
    source: string;
    rolloutPercentage: number;
    points: AlertRolloutTrendPoint[];
};

type AlertSourceState = {
    source: string;
    alerts: number;
    unreadCount: number;
    archivedCount: number;
    highPriorityCount: number;
    criticalPriorityCount: number;
    activeTargets: number;
    snoozedTargets: number;
    totalReadLatencyMinutes: number;
    readLatencySamples: number;
    lastSeenAt: string | null;
};

type AlertRolloutAlertSignal = {
    source: string;
    userId: string;
    read: boolean;
    priority: AlertPriority;
    readLatencyMinutes?: number;
    generatedAt?: string;
};

type AlertRolloutFavoriteSignal = {
    source: string;
    userId: string;
    snoozed: boolean;
};

function toMillis(value: Timestamp | Date | number | null | undefined): number | undefined {
    if (value instanceof Timestamp) {
        return value.toMillis();
    }

    if (value instanceof Date) {
        return value.getTime();
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    return undefined;
}

function toIso(value: Timestamp | Date | number | null | undefined): string | null {
    const millis = toMillis(value);
    return typeof millis === 'number' ? new Date(millis).toISOString() : null;
}

function safeSource(value?: string | null): string {
    return value && value.trim() ? value.trim() : 'UNKNOWN';
}

function sortSources(entries: AlertDiagnosticsSourceSummary[]): AlertDiagnosticsSourceSummary[] {
    return [...entries].sort((left, right) => {
        const alertDiff = right.alerts - left.alerts;
        if (alertDiff !== 0) return alertDiff;
        return left.source.localeCompare(right.source);
    });
}

function countBy(values: string[], limit: number): Array<{ name: string; count: number }> {
    const counts = new Map<string, number>();
    values.forEach((value) => {
        const normalized = value.trim();
        if (!normalized) {
            return;
        }
        counts.set(normalized, (counts.get(normalized) || 0) + 1);
    });

    return Array.from(counts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name))
        .slice(0, limit);
}

function userKeyFromPath(path: string): string {
    const raw = userIdFromPath(path);
    return raw.length > 8 ? `${raw.slice(0, 4)}...${raw.slice(-4)}` : raw;
}

function userIdFromPath(path: string): string {
    const segments = path.split('/');
    const usersIndex = segments.indexOf('users');
    return usersIndex >= 0 ? segments[usersIndex + 1] || 'unknown' : 'unknown';
}

function createRolloutCohortState() {
    return {
        users: new Set<string>(),
        alerts: 0,
        unreadCount: 0,
        activeTargets: 0,
        snoozedTargets: 0,
        criticalAlerts: 0,
        highAlerts: 0,
        totalReadLatencyMinutes: 0,
        readLatencySamples: 0,
    };
}

function toRolloutCohortSummary(state: ReturnType<typeof createRolloutCohortState>): AlertRolloutCohortSummary {
    return {
        users: state.users.size,
        alerts: state.alerts,
        unreadCount: state.unreadCount,
        unreadRate: state.alerts > 0 ? Math.round((state.unreadCount / state.alerts) * 1000) / 10 : 0,
        activeTargets: state.activeTargets,
        snoozedTargets: state.snoozedTargets,
        snoozedTargetRate: state.activeTargets > 0 ? Math.round((state.snoozedTargets / state.activeTargets) * 1000) / 10 : 0,
        criticalAlerts: state.criticalAlerts,
        highAlerts: state.highAlerts,
        avgReadLatencyMinutes: state.readLatencySamples > 0
            ? Math.round(state.totalReadLatencyMinutes / state.readLatencySamples)
            : 0,
    };
}

function createRolloutTrendState() {
    return {
        experiment: {
            alerts: 0,
            unreadCount: 0,
            totalReadLatencyMinutes: 0,
            readLatencySamples: 0,
        },
        control: {
            alerts: 0,
            unreadCount: 0,
            totalReadLatencyMinutes: 0,
            readLatencySamples: 0,
        },
    };
}

export function buildAlertRolloutTrends(
    alerts: AlertRolloutAlertSignal[],
    tuningConfigInput?: unknown
): AlertRolloutTrend[] {
    const tuningConfig = resolveAlertTuningConfig(tuningConfigInput);
    const sources = Object.keys(tuningConfig.sourceOverrides || {});
    if (sources.length === 0) {
        return [];
    }

    const sourceStates = new Map<string, {
        rolloutPercentage: number;
        byDay: Map<string, ReturnType<typeof createRolloutTrendState>>;
    }>();

    sources.forEach((source) => {
        const rolloutState = resolveAlertTuningOverrideState(tuningConfig, source, 'preview');
        sourceStates.set(source, {
            rolloutPercentage: rolloutState.rolloutPercentage,
            byDay: new Map<string, ReturnType<typeof createRolloutTrendState>>(),
        });
    });

    alerts.forEach((alert) => {
        const sourceState = sourceStates.get(alert.source);
        if (!sourceState || !alert.generatedAt) {
            return;
        }

        const day = alert.generatedAt.slice(0, 10);
        const rolloutState = resolveAlertTuningOverrideState(tuningConfig, alert.source, alert.userId);
        const trendState = sourceState.byDay.get(day) || createRolloutTrendState();
        const cohort = rolloutState.enabled ? trendState.experiment : trendState.control;
        cohort.alerts += 1;
        cohort.unreadCount += alert.read ? 0 : 1;
        if (typeof alert.readLatencyMinutes === 'number' && Number.isFinite(alert.readLatencyMinutes) && alert.readLatencyMinutes >= 0) {
            cohort.totalReadLatencyMinutes += alert.readLatencyMinutes;
            cohort.readLatencySamples += 1;
        }
        sourceState.byDay.set(day, trendState);
    });

    return Array.from(sourceStates.entries())
        .map(([source, state]) => ({
            source,
            rolloutPercentage: state.rolloutPercentage,
            points: Array.from(state.byDay.entries())
                .sort((left, right) => left[0].localeCompare(right[0]))
                .slice(-7)
                .map(([day, pointState]) => ({
                    day,
                    experimentAlerts: pointState.experiment.alerts,
                    controlAlerts: pointState.control.alerts,
                    experimentUnreadRate: pointState.experiment.alerts > 0
                        ? Math.round((pointState.experiment.unreadCount / pointState.experiment.alerts) * 1000) / 10
                        : 0,
                    controlUnreadRate: pointState.control.alerts > 0
                        ? Math.round((pointState.control.unreadCount / pointState.control.alerts) * 1000) / 10
                        : 0,
                    experimentAvgReadLatencyMinutes: pointState.experiment.readLatencySamples > 0
                        ? Math.round(pointState.experiment.totalReadLatencyMinutes / pointState.experiment.readLatencySamples)
                        : 0,
                    controlAvgReadLatencyMinutes: pointState.control.readLatencySamples > 0
                        ? Math.round(pointState.control.totalReadLatencyMinutes / pointState.control.readLatencySamples)
                        : 0,
                })),
        }))
        .filter((entry) => entry.points.length > 0)
        .sort((left, right) => right.points.length - left.points.length || left.source.localeCompare(right.source));
}

export function buildAlertRolloutSummaries(
    alerts: AlertRolloutAlertSignal[],
    favorites: AlertRolloutFavoriteSignal[],
    tuningConfigInput?: unknown
): AlertRolloutSourceSummary[] {
    const tuningConfig = resolveAlertTuningConfig(tuningConfigInput);
    const sources = Object.keys(tuningConfig.sourceOverrides || {});
    if (sources.length === 0) {
        return [];
    }

    const sourceStates = new Map<string, {
        rolloutPercentage: number;
        experiment: ReturnType<typeof createRolloutCohortState>;
        control: ReturnType<typeof createRolloutCohortState>;
    }>();

    sources.forEach((source) => {
        const rolloutState = resolveAlertTuningOverrideState(tuningConfig, source, 'preview');
        sourceStates.set(source, {
            rolloutPercentage: rolloutState.rolloutPercentage,
            experiment: createRolloutCohortState(),
            control: createRolloutCohortState(),
        });
    });

    alerts.forEach((alert) => {
        const state = sourceStates.get(alert.source);
        if (!state) {
            return;
        }

        const rolloutState = resolveAlertTuningOverrideState(tuningConfig, alert.source, alert.userId);
        const cohort = rolloutState.enabled ? state.experiment : state.control;
        cohort.users.add(alert.userId);
        cohort.alerts += 1;
        cohort.unreadCount += alert.read ? 0 : 1;
        cohort.criticalAlerts += alert.priority === 'critical' ? 1 : 0;
        cohort.highAlerts += alert.priority === 'high' ? 1 : 0;
        if (typeof alert.readLatencyMinutes === 'number' && Number.isFinite(alert.readLatencyMinutes) && alert.readLatencyMinutes >= 0) {
            cohort.totalReadLatencyMinutes += alert.readLatencyMinutes;
            cohort.readLatencySamples += 1;
        }
    });

    favorites.forEach((favorite) => {
        const state = sourceStates.get(favorite.source);
        if (!state) {
            return;
        }

        const rolloutState = resolveAlertTuningOverrideState(tuningConfig, favorite.source, favorite.userId);
        const cohort = rolloutState.enabled ? state.experiment : state.control;
        cohort.users.add(favorite.userId);
        cohort.activeTargets += 1;
        cohort.snoozedTargets += favorite.snoozed ? 1 : 0;
    });

    return Array.from(sourceStates.entries())
        .map(([source, state]) => {
            const experiment = toRolloutCohortSummary(state.experiment);
            const control = toRolloutCohortSummary(state.control);
            return {
                source,
                rolloutPercentage: state.rolloutPercentage,
                experiment,
                control,
                delta: {
                    unreadRate: Math.round((experiment.unreadRate - control.unreadRate) * 10) / 10,
                    snoozedTargetRate: Math.round((experiment.snoozedTargetRate - control.snoozedTargetRate) * 10) / 10,
                    avgReadLatencyMinutes: experiment.avgReadLatencyMinutes - control.avgReadLatencyMinutes,
                },
            } satisfies AlertRolloutSourceSummary;
        })
        .sort((left, right) => {
            const sampleDiff = (right.experiment.alerts + right.control.alerts) - (left.experiment.alerts + left.control.alerts);
            if (sampleDiff !== 0) {
                return sampleDiff;
            }
            return left.source.localeCompare(right.source);
        });
}

export function buildAlertPersonaSummary(profiles: AlertPersonaRecentProfile[]): AlertPersonaSummary {
    const modeOrder: AlertBehaviorMode[] = ['instant', 'balanced', 'batch'];
    const modeState = new Map<AlertBehaviorMode, {
        count: number;
        totalDefaultSnoozeHours: number;
        totalUnreadRate: number;
        totalReadLatencyMinutes: number;
    }>();
    modeOrder.forEach((mode) => {
        modeState.set(mode, {
            count: 0,
            totalDefaultSnoozeHours: 0,
            totalUnreadRate: 0,
            totalReadLatencyMinutes: 0,
        });
    });

    let totalDefaultSnoozeHours = 0;
    let totalUnreadRate = 0;
    let totalReadLatencyMinutes = 0;

    profiles.forEach((profile) => {
        totalDefaultSnoozeHours += profile.defaultSnoozeHours;
        totalUnreadRate += profile.unreadRate;
        totalReadLatencyMinutes += profile.avgReadLatencyMinutes;
        const current = modeState.get(profile.mode)!;
        current.count += 1;
        current.totalDefaultSnoozeHours += profile.defaultSnoozeHours;
        current.totalUnreadRate += profile.unreadRate;
        current.totalReadLatencyMinutes += profile.avgReadLatencyMinutes;
    });

    const trackedProfiles = profiles.length;
    const modes = modeOrder.map((mode) => {
        const current = modeState.get(mode)!;
        return {
            mode,
            count: current.count,
            share: trackedProfiles > 0 ? Math.round((current.count / trackedProfiles) * 1000) / 10 : 0,
            avgDefaultSnoozeHours: current.count > 0 ? Math.round(current.totalDefaultSnoozeHours / current.count) : 0,
            avgUnreadRate: current.count > 0 ? Math.round((current.totalUnreadRate / current.count) * 10) / 10 : 0,
            avgReadLatencyMinutes: current.count > 0 ? Math.round(current.totalReadLatencyMinutes / current.count) : 0,
        };
    });

    const dominantMode = modes
        .filter((entry) => entry.count > 0)
        .sort((left, right) => right.count - left.count)[0]?.mode || null;

    return {
        trackedProfiles,
        dominantMode,
        avgDefaultSnoozeHours: trackedProfiles > 0 ? Math.round(totalDefaultSnoozeHours / trackedProfiles) : 0,
        avgUnreadRate: trackedProfiles > 0 ? Math.round((totalUnreadRate / trackedProfiles) * 10) / 10 : 0,
        avgReadLatencyMinutes: trackedProfiles > 0 ? Math.round(totalReadLatencyMinutes / trackedProfiles) : 0,
        lastUpdatedAt: profiles[0]?.updatedAt || null,
        modes,
    };
}

export function buildAlertSourceDrilldowns(
    recent: AlertDiagnosticsRecentEvent[],
    summaries: AlertDiagnosticsSourceSummary[]
): AlertDiagnosticsSourceDrilldown[] {
    return summaries.map((summary) => {
        const sourceEvents = recent.filter((entry) => entry.source === summary.source);

        return {
            source: summary.source,
            unreadRate: summary.alerts > 0 ? Math.round((summary.unreadCount / summary.alerts) * 1000) / 10 : 0,
            archivedRate: summary.alerts > 0 ? Math.round((summary.archivedCount / summary.alerts) * 1000) / 10 : 0,
            activeTargets: summary.activeTargets,
            snoozedTargets: summary.snoozedTargets,
            avgReadLatencyMinutes: summary.avgReadLatencyMinutes,
            criticalAlerts: summary.criticalPriorityCount,
            highAlerts: summary.highPriorityCount,
            topMalls: countBy(sourceEvents.map((entry) => entry.mallName).filter(Boolean) as string[], 5),
            topVariants: countBy(sourceEvents.map((entry) => entry.variantLabel).filter(Boolean) as string[], 5)
                .map((entry) => ({ label: entry.name, count: entry.count })),
            recentCritical: sourceEvents.filter((entry) => entry.priority === 'critical').slice(0, 6),
            recentUnread: sourceEvents.filter((entry) => !entry.read && !entry.archived).slice(0, 6),
        };
    });
}

export async function loadAlertDiagnostics(limit: number = 20, tuningConfigInput?: AlertTuningConfig | null): Promise<{
    summary: AlertDiagnosticsSummary;
    recent: AlertDiagnosticsRecentEvent[];
    drilldown: AlertDiagnosticsSourceDrilldown[];
    personas: {
        summary: AlertPersonaSummary;
        recent: AlertPersonaRecentProfile[];
    };
    rollout: AlertRolloutSourceSummary[];
    rolloutTrends: AlertRolloutTrend[];
    storage: 'firestore' | 'unavailable';
}> {
    const db = getAdminDb();
    if (!db) {
        return {
            summary: {
                trackedAlerts: 0,
                unreadCount: 0,
                archivedCount: 0,
                activeTargets: 0,
                snoozedTargets: 0,
                criticalPriorityCount: 0,
                highPriorityCount: 0,
                avgReadLatencyMinutes: 0,
                lastUpdatedAt: null,
                sources: [],
            },
            recent: [],
            drilldown: [],
            personas: {
                summary: {
                    trackedProfiles: 0,
                    dominantMode: null,
                    avgDefaultSnoozeHours: 0,
                    avgUnreadRate: 0,
                    avgReadLatencyMinutes: 0,
                    lastUpdatedAt: null,
                    modes: [
                        { mode: 'instant', count: 0, share: 0, avgDefaultSnoozeHours: 0, avgUnreadRate: 0, avgReadLatencyMinutes: 0 },
                        { mode: 'balanced', count: 0, share: 0, avgDefaultSnoozeHours: 0, avgUnreadRate: 0, avgReadLatencyMinutes: 0 },
                        { mode: 'batch', count: 0, share: 0, avgDefaultSnoozeHours: 0, avgUnreadRate: 0, avgReadLatencyMinutes: 0 },
                    ],
                },
                recent: [],
            },
            rollout: [],
            rolloutTrends: [],
            storage: 'unavailable',
        };
    }

    const [alertsSnap, favoritesSnap, personasSnap] = await Promise.all([
        db.collectionGroup('alerts').limit(MAX_RECENT_ALERTS).get(),
        db.collectionGroup('favorites').limit(MAX_FAVORITES).get(),
        db.collectionGroup('preferences').where(FieldPath.documentId(), '==', 'alertPersona').limit(MAX_ALERT_PERSONAS).get(),
    ]);

    const sourceMap = new Map<string, AlertSourceState>();
    let unreadCount = 0;
    let archivedCount = 0;
    let criticalPriorityCount = 0;
    let highPriorityCount = 0;
    let totalReadLatencyMinutes = 0;
    let readLatencySamples = 0;
    const rolloutAlertSignals: AlertRolloutAlertSignal[] = [];
    const rolloutFavoriteSignals: AlertRolloutFavoriteSignal[] = [];

    const sortedAlertDocs = [...alertsSnap.docs].sort((left, right) => {
        const leftData = left.data() as AlertDoc;
        const rightData = right.data() as AlertDoc;
        const leftCreatedAt = toMillis(leftData.createdAt) ?? 0;
        const rightCreatedAt = toMillis(rightData.createdAt) ?? 0;
        return rightCreatedAt - leftCreatedAt;
    });

    const recent: AlertDiagnosticsRecentEvent[] = sortedAlertDocs.map((doc) => {
        const data = doc.data() as AlertDoc;
        const priority = data.priority === 'critical' || data.priority === 'high' || data.priority === 'medium'
            ? data.priority
            : deriveAlertPriority({
                currentPrice: typeof data.currentPrice === 'number' ? data.currentPrice : undefined,
                targetPrice: typeof data.targetPrice === 'number' ? data.targetPrice : undefined,
            });
        const source = safeSource(data.source);
        const createdAtIso = toIso(data.createdAt) || new Date().toISOString();
        const read = Boolean(data.read);
        const archived = Boolean(data.archivedAt);
        const current = sourceMap.get(source) || {
            source,
            alerts: 0,
            unreadCount: 0,
            archivedCount: 0,
            highPriorityCount: 0,
            criticalPriorityCount: 0,
            activeTargets: 0,
            snoozedTargets: 0,
            totalReadLatencyMinutes: 0,
            readLatencySamples: 0,
            lastSeenAt: null,
        };

        current.alerts += 1;
        current.unreadCount += read ? 0 : 1;
        current.archivedCount += archived ? 1 : 0;
        current.highPriorityCount += priority === 'high' ? 1 : 0;
        current.criticalPriorityCount += priority === 'critical' ? 1 : 0;
        current.lastSeenAt = createdAtIso;
        sourceMap.set(source, current);

        unreadCount += read ? 0 : 1;
        archivedCount += archived ? 1 : 0;
        criticalPriorityCount += priority === 'critical' ? 1 : 0;
        highPriorityCount += priority === 'high' ? 1 : 0;

        const createdAt = toMillis(data.createdAt);
        const readAt = toMillis(data.readAt);
        if (read && typeof createdAt === 'number' && typeof readAt === 'number' && readAt >= createdAt) {
            const latencyMinutes = Math.round((readAt - createdAt) / 60_000);
            totalReadLatencyMinutes += latencyMinutes;
            readLatencySamples += 1;
            current.totalReadLatencyMinutes += latencyMinutes;
            current.readLatencySamples += 1;
            rolloutAlertSignals.push({
                source,
                userId: userIdFromPath(doc.ref.path),
                read,
                priority,
                readLatencyMinutes: latencyMinutes,
                generatedAt: createdAtIso,
            });
        } else {
            rolloutAlertSignals.push({
                source,
                userId: userIdFromPath(doc.ref.path),
                read,
                priority,
                generatedAt: createdAtIso,
            });
        }

        return {
            id: doc.id,
            title: data.title || '가격 알림',
            source,
            mallName: data.mallName || undefined,
            priority,
            read,
            archived,
            currentPrice: typeof data.currentPrice === 'number' ? data.currentPrice : undefined,
            targetPrice: typeof data.targetPrice === 'number' ? data.targetPrice : undefined,
            generatedAt: createdAtIso,
            variantLabel: data.variantLabel || undefined,
            productId: data.productId || undefined,
        };
    }).slice(0, Math.max(1, Math.min(limit, MAX_RECENT_ALERTS)));

    let activeTargets = 0;
    let snoozedTargets = 0;

    favoritesSnap.docs.forEach((doc) => {
        const data = doc.data() as FavoriteDoc;
        const targetPrice = Number(data.targetPrice);
        if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
            return;
        }

        activeTargets += 1;
        const source = safeSource(data.source);
        rolloutFavoriteSignals.push({
            source,
            userId: userIdFromPath(doc.ref.path),
            snoozed: isFavoriteAlertSnoozed({ alertSnoozedUntil: typeof data.alertSnoozedUntil === 'number' ? data.alertSnoozedUntil : undefined }),
        });
        if (isFavoriteAlertSnoozed({ alertSnoozedUntil: typeof data.alertSnoozedUntil === 'number' ? data.alertSnoozedUntil : undefined })) {
            snoozedTargets += 1;
            const current = sourceMap.get(source) || {
                source,
                alerts: 0,
                unreadCount: 0,
                archivedCount: 0,
                highPriorityCount: 0,
                criticalPriorityCount: 0,
                activeTargets: 0,
                snoozedTargets: 0,
                totalReadLatencyMinutes: 0,
                readLatencySamples: 0,
                lastSeenAt: null,
            };
            current.activeTargets += 1;
            current.snoozedTargets += 1;
            sourceMap.set(source, current);
        } else {
            const current = sourceMap.get(source) || {
                source,
                alerts: 0,
                unreadCount: 0,
                archivedCount: 0,
                highPriorityCount: 0,
                criticalPriorityCount: 0,
                activeTargets: 0,
                snoozedTargets: 0,
                totalReadLatencyMinutes: 0,
                readLatencySamples: 0,
                lastSeenAt: null,
            };
            current.activeTargets += 1;
            sourceMap.set(source, current);
        }
    });

    const sourceSummaries = sortSources(Array.from(sourceMap.values()).map((entry) => ({
        source: entry.source,
        alerts: entry.alerts,
        unreadCount: entry.unreadCount,
        archivedCount: entry.archivedCount,
        highPriorityCount: entry.highPriorityCount,
        criticalPriorityCount: entry.criticalPriorityCount,
        activeTargets: entry.activeTargets,
        snoozedTargets: entry.snoozedTargets,
        avgReadLatencyMinutes: entry.readLatencySamples > 0
            ? Math.round(entry.totalReadLatencyMinutes / entry.readLatencySamples)
            : 0,
        lastSeenAt: entry.lastSeenAt,
    })));

    const recentProfiles = personasSnap.docs
        .map((doc) => {
            const data = doc.data() as AlertPersonaDoc;
            const profile = parseAlertBehaviorProfileSnapshot(data.profile ?? data);
            if (!profile) {
                return null;
            }

            return {
                userKey: userKeyFromPath(doc.ref.path),
                mode: profile.mode,
                summary: profile.summary,
                defaultSnoozeHours: profile.defaultSnoozeHours,
                unreadRate: profile.unreadRate,
                snoozeShare: profile.snoozeShare,
                avgReadLatencyMinutes: profile.avgReadLatencyMinutes,
                updatedAt: toIso(data.updatedAt),
            } satisfies AlertPersonaRecentProfile;
        })
        .filter((entry): entry is AlertPersonaRecentProfile => Boolean(entry))
        .sort((left, right) => {
            const leftTime = left.updatedAt ? new Date(left.updatedAt).getTime() : 0;
            const rightTime = right.updatedAt ? new Date(right.updatedAt).getTime() : 0;
            return rightTime - leftTime;
        });

    return {
        summary: {
            trackedAlerts: alertsSnap.size,
            unreadCount,
            archivedCount,
            activeTargets,
            snoozedTargets,
            criticalPriorityCount,
            highPriorityCount,
            avgReadLatencyMinutes: readLatencySamples > 0 ? Math.round(totalReadLatencyMinutes / readLatencySamples) : 0,
            lastUpdatedAt: recent[0]?.generatedAt || null,
            sources: sourceSummaries,
        },
        recent,
        drilldown: buildAlertSourceDrilldowns(recent, sourceSummaries),
        personas: {
            summary: buildAlertPersonaSummary(recentProfiles),
            recent: recentProfiles.slice(0, Math.max(1, Math.min(limit, 12))),
        },
        rollout: buildAlertRolloutSummaries(rolloutAlertSignals, rolloutFavoriteSignals, tuningConfigInput),
        rolloutTrends: buildAlertRolloutTrends(rolloutAlertSignals, tuningConfigInput),
        storage: 'firestore',
    };
}
