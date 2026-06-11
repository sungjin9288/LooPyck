import assert from 'node:assert/strict';
import test from 'node:test';
import { buildDebugConsoleModel } from '../components/admin/searchDiagnostics/debugConsoleModel.ts';
import type { PerformanceMetric } from '../lib/core/performanceMonitor.ts';
import type { DiagnosticsResponse, SearchDiagnosticsFetchTelemetry } from '../components/admin/searchDiagnostics/types.ts';
import { DEFAULT_ALERT_TUNING_CONFIG } from '../lib/favorites/alertPersonalization.ts';

function createFetchTelemetry(overrides: Partial<SearchDiagnosticsFetchTelemetry> = {}): SearchDiagnosticsFetchTelemetry {
    return {
        lastStartedAt: '2026-04-18T10:00:00.000Z',
        lastCompletedAt: '2026-04-18T10:00:01.000Z',
        lastSuccessfulAt: '2026-04-18T10:00:01.000Z',
        lastErrorAt: null,
        lastDurationMs: 180,
        averageDurationMs: 180,
        requestCount: 4,
        successCount: 4,
        failureCount: 0,
        consecutiveFailures: 0,
        recentErrors: [],
        ...overrides,
    };
}

function createMetric(durationMs: number, index: number): PerformanceMetric {
    return {
        operationName: 'admin:realtime-search-diagnostics',
        startTime: index,
        endTime: index + durationMs,
        durationMs,
        timestamp: `2026-04-18T10:00:0${index}.000Z`,
    };
}

function createDiagnosticsResponse(overrides: Partial<DiagnosticsResponse> = {}): DiagnosticsResponse {
    return {
        summary: {
            trackedSearches: 12,
            lastUpdatedAt: '2026-04-18T10:00:00.000Z',
            sources: [],
        },
        recent: [],
        recentInteractions: [],
        quality: {
            strong: 0,
            mixed: 0,
            weak: 0,
            lowFitShare: 0,
            avgStrongMatches: 0,
            avgExactMatches: 0,
            compareReadyRatio: 0,
            priceSpreadCaptureRate: 0,
            optionMatchPrecision: 0,
            avgCapturedPriceSpread: 0,
            maxCapturedPriceSpread: 0,
        },
        interactionSummary: {
            total: 0,
            suggestionClicks: 0,
            productOpens: 0,
            storeClicks: 0,
            topSelectedQueries: [],
            topOpenedBrands: [],
        },
        storage: 'firestore',
        searchLearning: {
            entries: [],
            summary: {
                total: 0,
                pending: 0,
                approved: 0,
                ignored: 0,
                zeroResult: 0,
            },
            storage: 'firestore',
        },
        searchLearningActivity: {
            events: [],
            storage: 'firestore',
        },
        searchQualityCoverage: {
            totalQueries: 0,
            globalTargetQueries: 0,
            naverCovered: 0,
            globalCovered: 0,
            fullyCovered: 0,
            naverCoverageRate: 0,
            globalCoverageRate: 0,
            fullCoverageRate: 0,
            uncoveredQueries: [],
            clusters: [],
        },
        pdp: {
            summary: {
                trackedEvents: 0,
                lastUpdatedAt: null,
                cacheHitRate: 0,
                fetchSuccessRate: 0,
                parseSuccessRate: 0,
                sources: [],
            },
            recent: [],
            storage: 'firestore',
        },
        alerts: {
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
                    modes: [],
                },
                recent: [],
            },
            rollout: [],
            rolloutTrends: [],
            storage: 'firestore',
        },
        alertTuning: {
            config: DEFAULT_ALERT_TUNING_CONFIG,
            updatedAt: null,
            updatedBy: null,
            storage: 'firestore',
            history: [],
        },
        alertTuningRequests: [],
        alertTuningAudit: [],
        alertTuningAuditInbox: {
            total: 0,
            unreadCount: 0,
            criticalUnreadCount: 0,
            warningUnreadCount: 0,
        },
        alertTuningDigest: {
            generatedAt: '2026-04-18T10:00:00.000Z',
            openCount: 0,
            overdueCount: 0,
            expiringSoonCount: 0,
            expiredCount: 0,
            oldestOpenAt: null,
            overdueRequests: [],
            expiringSoonRequests: [],
        },
        alertTuningWebhook: {
            configured: true,
            format: 'slack',
            targetLabel: 'ops',
        },
        ...overrides,
    };
}

test('debug console model stays healthy when storage and polling are stable', () => {
    const model = buildDebugConsoleModel({
        data: createDiagnosticsResponse(),
        error: null,
        isFetching: false,
        fetchTelemetry: createFetchTelemetry(),
        metrics: [createMetric(180, 1), createMetric(220, 2)],
    });

    assert.equal(model.status, 'healthy');
    assert.equal(model.fetchSuccessRate, 100);
    assert.equal(model.issues.length, 0);
    assert.equal(model.storageBadges.find((entry) => entry.label === 'Alerts')?.tone, 'healthy');
});

test('debug console model degrades when fallback storage and slow polling are present', () => {
    const model = buildDebugConsoleModel({
        data: createDiagnosticsResponse({
            storage: 'memory',
            searchLearning: {
                entries: [],
                summary: {
                    total: 0,
                    pending: 0,
                    approved: 0,
                    ignored: 0,
                    zeroResult: 0,
                },
                storage: 'memory',
            },
            alertTuning: {
                config: DEFAULT_ALERT_TUNING_CONFIG,
                updatedAt: null,
                updatedBy: null,
                storage: 'default',
                history: [],
            },
            alertTuningWebhook: {
                configured: false,
                format: null,
                targetLabel: null,
            },
            alertTuningDigest: {
                generatedAt: '2026-04-18T10:00:00.000Z',
                openCount: 1,
                overdueCount: 2,
                expiringSoonCount: 0,
                expiredCount: 0,
                oldestOpenAt: null,
                overdueRequests: [],
                expiringSoonRequests: [],
            },
        }),
        error: null,
        isFetching: true,
        fetchTelemetry: createFetchTelemetry({
            averageDurationMs: 640,
            lastDurationMs: 700,
        }),
        metrics: [createMetric(640, 1)],
    });

    assert.equal(model.status, 'degraded');
    assert.ok(model.issues.some((entry) => entry.message.includes('평균 지연 640ms')));
    assert.ok(model.issues.some((entry) => entry.message.includes('storage가 fallback 상태')));
    assert.equal(model.storageBadges.find((entry) => entry.label === 'Webhook')?.tone, 'degraded');
});

test('debug console model becomes critical on alert storage outage or fetch error', () => {
    const model = buildDebugConsoleModel({
        data: createDiagnosticsResponse({
            alerts: {
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
                        modes: [],
                    },
                    recent: [],
                },
                rollout: [],
                rolloutTrends: [],
                storage: 'unavailable',
            },
        }),
        error: '진단 API timeout',
        isFetching: false,
        fetchTelemetry: createFetchTelemetry({
            requestCount: 5,
            successCount: 3,
            failureCount: 2,
            consecutiveFailures: 2,
            averageDurationMs: 1200,
            recentErrors: [{ message: '진단 API timeout', at: '2026-04-18T10:05:00.000Z' }],
        }),
        metrics: Array.from({ length: 12 }, (_, index) => createMetric(1200, index)),
    });

    assert.equal(model.status, 'critical');
    assert.equal(model.fetchSuccessRate, 60);
    assert.equal(model.recentOperations.length, 8);
    assert.ok(model.issues.some((entry) => entry.message.includes('storage unavailable')));
    assert.ok(model.issues.some((entry) => entry.message.includes('연속 실패 2회')));
    assert.equal(model.recentErrors[0]?.message, '진단 API timeout');
});
