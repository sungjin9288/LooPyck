import type { PerformanceMetric } from '@/lib/core/performanceMonitor';
import type { DiagnosticsResponse, SearchDiagnosticsFetchTelemetry } from './types';

export type DebugConsoleStatus = 'healthy' | 'degraded' | 'critical';

type DebugConsoleStorageBadge = {
    label: string;
    value: string;
    tone: DebugConsoleStatus | 'neutral';
};

type DebugConsoleIssue = {
    tone: DebugConsoleStatus;
    message: string;
};

export type DebugConsoleModel = {
    status: DebugConsoleStatus;
    statusLabel: string;
    summary: string;
    fetchSuccessRate: number;
    storageBadges: DebugConsoleStorageBadge[];
    issues: DebugConsoleIssue[];
    recentOperations: PerformanceMetric[];
    recentErrors: SearchDiagnosticsFetchTelemetry['recentErrors'];
    requestCount: number;
    successCount: number;
    failureCount: number;
    averageDurationMs: number;
    lastDurationMs: number | null;
    isFetching: boolean;
};

type BuildDebugConsoleModelParams = {
    data: DiagnosticsResponse | null;
    error: string | null;
    isFetching: boolean;
    fetchTelemetry: SearchDiagnosticsFetchTelemetry;
    metrics: PerformanceMetric[];
};

function storageTone(value: string | null | undefined): DebugConsoleStorageBadge['tone'] {
    if (!value) {
        return 'neutral';
    }

    if (value === 'firestore') {
        return 'healthy';
    }

    if (value === 'unavailable') {
        return 'critical';
    }

    return 'degraded';
}

function storageLabel(value: string | null | undefined): string {
    if (!value) {
        return 'unknown';
    }

    return value;
}

function statusLabel(status: DebugConsoleStatus): string {
    switch (status) {
        case 'critical':
            return 'critical';
        case 'degraded':
            return 'degraded';
        default:
            return 'healthy';
    }
}

export function buildDebugConsoleModel({
    data,
    error,
    isFetching,
    fetchTelemetry,
    metrics,
}: BuildDebugConsoleModelParams): DebugConsoleModel {
    const issues: DebugConsoleIssue[] = [];
    const storageBadges: DebugConsoleStorageBadge[] = [
        {
            label: 'Search',
            value: storageLabel(data?.storage),
            tone: storageTone(data?.storage),
        },
        {
            label: 'Learning',
            value: storageLabel(data?.searchLearning.storage),
            tone: storageTone(data?.searchLearning.storage),
        },
        {
            label: 'Activity',
            value: storageLabel(data?.searchLearningActivity.storage),
            tone: storageTone(data?.searchLearningActivity.storage),
        },
        {
            label: 'Alerts',
            value: storageLabel(data?.alerts.storage),
            tone: storageTone(data?.alerts.storage),
        },
        {
            label: 'Alert Tuning',
            value: storageLabel(data?.alertTuning.storage),
            tone: storageTone(data?.alertTuning.storage),
        },
        {
            label: 'Webhook',
            value: data?.alertTuningWebhook.configured ? storageLabel(data.alertTuningWebhook.format) : 'disabled',
            tone: data?.alertTuningWebhook.configured ? 'healthy' : 'degraded',
        },
    ];

    if (error) {
        issues.push({ tone: 'critical', message: error });
    }

    if (fetchTelemetry.consecutiveFailures > 0) {
        issues.push({
            tone: fetchTelemetry.consecutiveFailures > 1 ? 'critical' : 'degraded',
            message: `진단 polling 연속 실패 ${fetchTelemetry.consecutiveFailures}회`,
        });
    }

    if (fetchTelemetry.averageDurationMs > 1000) {
        issues.push({
            tone: 'critical',
            message: `진단 polling 평균 지연 ${fetchTelemetry.averageDurationMs}ms`,
        });
    } else if (fetchTelemetry.averageDurationMs > 500) {
        issues.push({
            tone: 'degraded',
            message: `진단 polling 평균 지연 ${fetchTelemetry.averageDurationMs}ms`,
        });
    }

    if ((data?.alertTuningDigest.overdueCount || 0) > 0) {
        issues.push({
            tone: 'degraded',
            message: `승인 요청 SLA 초과 ${data?.alertTuningDigest.overdueCount || 0}건`,
        });
    }

    if (data?.alerts.storage === 'unavailable') {
        issues.push({
            tone: 'critical',
            message: 'Alert diagnostics storage unavailable 상태입니다.',
        });
    }

    const degradedStorageBadges = storageBadges.filter((badge) => badge.tone === 'degraded');
    if (degradedStorageBadges.length > 0) {
        issues.push({
            tone: 'degraded',
            message: `${degradedStorageBadges.map((badge) => `${badge.label}:${badge.value}`).join(', ')} storage가 fallback 상태입니다.`,
        });
    }

    const fetchSuccessRate = fetchTelemetry.requestCount > 0
        ? Math.round((fetchTelemetry.successCount / fetchTelemetry.requestCount) * 100)
        : 100;

    let status: DebugConsoleStatus = 'healthy';
    if (issues.some((issue) => issue.tone === 'critical')) {
        status = 'critical';
    } else if (issues.length > 0) {
        status = 'degraded';
    }

    const summary = status === 'healthy'
        ? 'admin diagnostics polling과 storage 상태가 정상입니다.'
        : status === 'critical'
            ? '진단 fetch 또는 storage 경로에 즉시 확인이 필요한 문제가 있습니다.'
            : 'fallback storage 또는 지연 증가가 감지됐습니다.';

    return {
        status,
        statusLabel: statusLabel(status),
        summary,
        fetchSuccessRate,
        storageBadges,
        issues,
        recentOperations: metrics.slice(0, 8),
        recentErrors: fetchTelemetry.recentErrors,
        requestCount: fetchTelemetry.requestCount,
        successCount: fetchTelemetry.successCount,
        failureCount: fetchTelemetry.failureCount,
        averageDurationMs: fetchTelemetry.averageDurationMs,
        lastDurationMs: fetchTelemetry.lastDurationMs,
        isFetching,
    };
}
