'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { DEFAULT_ALERT_TUNING_CONFIG, type AlertBehaviorMode, type AlertTuningConfig } from '@/lib/favorites/alertPersonalization';
import { buildAlertRolloutRecommendations, buildAlertTuningSuggestions } from '@/lib/favorites/alertRecommendations';
import { primeAlertTuningSettings } from '@/hooks/useAlertTuningSettings';
import { pushAppNotification } from '@/lib/core/notifications';

type SourceSummary = {
    source: string;
    collectionMode: 'api' | 'direct' | 'classified';
    searches: number;
    successCount: number;
    directHits: number;
    fallbackHits: number;
    emptyHits: number;
    totalItems: number;
    avgLatencyMs: number;
    successRate: number;
    lastSeenAt: string;
    lastStrategy: string;
    lastFallbackReason?: string;
};

type RecentSnapshot = {
    query: string;
    effectiveQuery?: string;
    page: number;
    sort: string;
    generatedAt: string;
    queryIntent?: string;
    resultQuality?: 'strong' | 'mixed' | 'weak';
    exactMatchCount?: number;
    strongMatchCount?: number;
    suggestedQueries?: string[];
    totalProducts: number;
    directSourceCount: number;
    fallbackSourceCount: number;
    sources: Array<{
        source: string;
        finalCount: number;
        strategy: string;
        fallbackReason?: string;
        requestedQueries?: string[];
        resolvedQuery?: string;
    }>;
};

type RecentInteraction = {
    type: 'suggestion_click' | 'product_open' | 'store_click';
    query: string;
    generatedAt: string;
    selectedQuery?: string;
    source?: string;
    productId?: string;
    productTitle?: string;
    brand?: string;
    context?: string;
};

type SourceDrilldownItem = {
    query: string;
    effectiveQuery?: string;
    generatedAt: string;
    totalProducts: number;
    finalCount: number;
    strategy: string;
    fallbackReason?: string;
    requestedQueries?: string[];
    resolvedQuery?: string;
};

type SourceTrendPoint = {
    day: string;
    samples: number;
    successSamples: number;
    directSamples: number;
    fallbackSamples: number;
    emptySamples: number;
    totalItems: number;
    successRate: number;
};

type PdpSourceSummary = {
    source: string;
    requests: number;
    cacheHits: number;
    fetchAttempts: number;
    fetchSuccesses: number;
    parseSuccesses: number;
    unsupportedCount: number;
    avgLatencyMs: number;
    cacheHitRate: number;
    fetchSuccessRate: number;
    parseSuccessRate: number;
    lastSeenAt: string;
    lastStrategy: 'cache_hit' | 'fetched' | 'stale_cache_refreshed' | 'fetch_failed' | 'parse_empty' | 'unsupported';
    lastReason?: string;
};

type PdpRecentEvent = {
    source: string;
    strategy: 'cache_hit' | 'fetched' | 'stale_cache_refreshed' | 'fetch_failed' | 'parse_empty' | 'unsupported';
    generatedAt: string;
    durationMs: number;
    cacheHit: boolean;
    fetchAttempted: boolean;
    fetchSucceeded: boolean;
    parseSucceeded: boolean;
    reason?: string;
    productId?: string;
    queryContext?: string;
};

type AlertSourceSummary = {
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

type AlertSourceDrilldown = {
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
    recentCritical: AlertRecentEvent[];
    recentUnread: AlertRecentEvent[];
};

type AlertRecentEvent = {
    id: string;
    title: string;
    source: string;
    mallName?: string;
    priority: 'critical' | 'high' | 'medium';
    read: boolean;
    archived: boolean;
    currentPrice?: number;
    targetPrice?: number;
    generatedAt: string;
    variantLabel?: string;
    productId?: string;
};

type AlertPersonaModeSummary = {
    mode: 'instant' | 'balanced' | 'batch';
    count: number;
    share: number;
    avgDefaultSnoozeHours: number;
    avgUnreadRate: number;
    avgReadLatencyMinutes: number;
};

type AlertPersonaRecentProfile = {
    userKey: string;
    mode: 'instant' | 'balanced' | 'batch';
    summary: string;
    defaultSnoozeHours: number;
    unreadRate: number;
    snoozeShare: number;
    avgReadLatencyMinutes: number;
    updatedAt: string | null;
};

type AlertRolloutCohortSummary = {
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

type AlertRolloutSourceSummary = {
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

type AlertRolloutTrendPoint = {
    day: string;
    experimentAlerts: number;
    controlAlerts: number;
    experimentUnreadRate: number;
    controlUnreadRate: number;
    experimentAvgReadLatencyMinutes: number;
    controlAvgReadLatencyMinutes: number;
};

type AlertRolloutTrend = {
    source: string;
    rolloutPercentage: number;
    points: AlertRolloutTrendPoint[];
};

type AlertTuningHistoryEntry = {
    id: string;
    updatedAt: string | null;
    updatedBy: string | null;
    summary: string;
    restorable: boolean;
};

type AlertTuningApprovalRequest = {
    id: string;
    source: string;
    currentRolloutPercentage: number;
    proposedRolloutPercentage: number;
    title: string;
    description: string;
    status: 'pending' | 'pending_second_approval' | 'approved' | 'rejected' | 'expired';
    requiredApprovals: number;
    approvalCount: number;
    approvals: Array<{
        uid: string;
        note: string | null;
        approvedAt: string | null;
    }>;
    createdAt: string | null;
    createdBy: string | null;
    requestNote: string | null;
    resolvedAt: string | null;
    resolvedBy: string | null;
    resolutionNote: string | null;
};

type ApprovalQueueSummary = {
    openCount: number;
    pendingCount: number;
    secondApprovalCount: number;
    approvedCount: number;
    rejectedCount: number;
    expiredCount: number;
    overdueCount: number;
    expiringSoonCount: number;
    avgOpenAgeHours: number;
    maxOpenAgeHours: number;
    avgResolutionHours: number;
    withinSlaRate: number;
    oldestOpenAt: string | null;
};

type AlertTuningAuditEvent = {
    id: string;
    type: 'request_created' | 'approval_recorded' | 'second_approval_required' | 'request_approved' | 'request_rejected' | 'request_expired' | 'config_saved' | 'config_rolled_back' | 'sla_digest' | 'webhook_dispatched' | 'webhook_failed';
    level: 'info' | 'success' | 'warning' | 'critical';
    title: string;
    message: string;
    createdAt: string | null;
    source: string | null;
    requestId: string | null;
    actorUid: string | null;
    note: string | null;
    historyId: string | null;
    read: boolean;
    readAt: string | null;
};

type AlertTuningReminderDigestItem = {
    requestId: string;
    source: string;
    title: string;
    status: AlertTuningApprovalRequest['status'];
    createdAt: string | null;
    expiresAt: string | null;
    ageHours: number;
    proposedRolloutPercentage: number;
};

type AlertTuningReminderDigest = {
    generatedAt: string;
    openCount: number;
    overdueCount: number;
    expiringSoonCount: number;
    expiredCount: number;
    oldestOpenAt: string | null;
    overdueRequests: AlertTuningReminderDigestItem[];
    expiringSoonRequests: AlertTuningReminderDigestItem[];
};

type AlertTuningAuditInboxSummary = {
    total: number;
    unreadCount: number;
    criticalUnreadCount: number;
    warningUnreadCount: number;
};

type AlertTuningWebhookConfig = {
    configured: boolean;
    format: 'generic' | 'slack' | 'discord' | null;
    targetLabel: string | null;
};

type SearchLearningSuggestion = {
    normalizedQuery: string;
    categoryHint: string | null;
    suggestedQueries: string[];
    rationale: string;
    model: 'heuristic' | 'gemini';
    generatedAt: string;
};

type SearchLearningEntry = {
    id: string;
    query: string;
    normalizedQuery: string;
    effectiveQuery: string;
    queryIntent: string | null;
    status: 'pending' | 'approved' | 'ignored';
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
    lastResultQuality: 'strong' | 'mixed' | 'weak' | null;
    lastTotalProducts: number;
    suggestedQueries: string[];
    approvedQueries: string[];
    aiSuggestion: SearchLearningSuggestion | null;
    lastSeenAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

type DiagnosticsResponse = {
    summary: {
        trackedSearches: number;
        lastUpdatedAt: string | null;
        sources: SourceSummary[];
    };
    recent: RecentSnapshot[];
    recentInteractions: RecentInteraction[];
    quality: {
        strong: number;
        mixed: number;
        weak: number;
        lowFitShare: number;
        avgStrongMatches: number;
        avgExactMatches: number;
    };
    interactionSummary: {
        total: number;
        suggestionClicks: number;
        productOpens: number;
        storeClicks: number;
        topSelectedQueries: Array<{ query: string; count: number }>;
        topOpenedBrands: Array<{ brand: string; count: number }>;
    };
    storage: 'memory' | 'firestore';
    searchLearning: {
        entries: SearchLearningEntry[];
        summary: {
            total: number;
            pending: number;
            approved: number;
            ignored: number;
            zeroResult: number;
        };
        storage: 'memory' | 'firestore';
    };
    pdp: {
        summary: {
            trackedEvents: number;
            lastUpdatedAt: string | null;
            cacheHitRate: number;
            fetchSuccessRate: number;
            parseSuccessRate: number;
            sources: PdpSourceSummary[];
        };
        recent: PdpRecentEvent[];
        storage: 'memory' | 'firestore';
    };
    alerts: {
        summary: {
            trackedAlerts: number;
            unreadCount: number;
            archivedCount: number;
            activeTargets: number;
            snoozedTargets: number;
            criticalPriorityCount: number;
            highPriorityCount: number;
            avgReadLatencyMinutes: number;
            lastUpdatedAt: string | null;
            sources: AlertSourceSummary[];
        };
        recent: AlertRecentEvent[];
        drilldown: AlertSourceDrilldown[];
        personas: {
            summary: {
                trackedProfiles: number;
                dominantMode: 'instant' | 'balanced' | 'batch' | null;
                avgDefaultSnoozeHours: number;
                avgUnreadRate: number;
                avgReadLatencyMinutes: number;
                lastUpdatedAt: string | null;
                modes: AlertPersonaModeSummary[];
            };
            recent: AlertPersonaRecentProfile[];
        };
        rollout: AlertRolloutSourceSummary[];
        rolloutTrends: AlertRolloutTrend[];
        storage: 'firestore' | 'unavailable';
    };
    alertTuning: {
        config: AlertTuningConfig;
        updatedAt: string | null;
        updatedBy: string | null;
        storage: 'firestore' | 'default';
        history: AlertTuningHistoryEntry[];
    };
    alertTuningRequests: AlertTuningApprovalRequest[];
    alertTuningAudit: AlertTuningAuditEvent[];
    alertTuningAuditInbox: AlertTuningAuditInboxSummary;
    alertTuningDigest: AlertTuningReminderDigest;
    alertTuningWebhook: AlertTuningWebhookConfig;
    error?: string;
};

type SearchDiagnosticsDashboardProps = {
    scope?: 'full' | 'ops';
};

async function parseJsonResponseSafely(response: Response) {
    const raw = await response.text();
    if (!raw.trim()) {
        return null;
    }

    try {
        return JSON.parse(raw) as DiagnosticsResponse | { error?: string };
    } catch {
        throw new Error(`진단 API 응답을 해석하지 못했습니다. status=${response.status}`);
    }
}

function buildLowFitQueries(recent: RecentSnapshot[]): Array<{ query: string; quality: string; generatedAt: string; suggestedQueries: string[]; totalProducts: number }> {
    return recent
        .filter((snapshot) => snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed')
        .map((snapshot) => ({
            query: snapshot.query,
            quality: snapshot.resultQuality || 'weak',
            generatedAt: snapshot.generatedAt,
            suggestedQueries: snapshot.suggestedQueries || [],
            totalProducts: snapshot.totalProducts,
        }))
        .slice(0, 10);
}

function searchLearningStatusLabel(status: SearchLearningEntry['status']): string {
    switch (status) {
        case 'approved':
            return '승인됨';
        case 'ignored':
            return '보류';
        default:
            return '검토 대기';
    }
}

function searchLearningStatusClass(status: SearchLearningEntry['status']): string {
    switch (status) {
        case 'approved':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'ignored':
            return 'bg-slate-700/60 text-slate-300';
        default:
            return 'bg-amber-500/15 text-amber-200';
    }
}

function formatTime(value: string | null | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function strategyLabel(strategy: string): string {
    switch (strategy) {
        case 'direct':
            return '직접 수집';
        case 'direct_preferred_over_naver':
            return '직접 우선';
        case 'naver_classified_fallback':
            return 'Naver fallback';
        case 'classified_naver':
            return 'Naver 분류';
        case 'api':
            return 'API';
        default:
            return '미스';
    }
}

function collectionModeLabel(mode: SourceSummary['collectionMode']): string {
    switch (mode) {
        case 'api':
            return 'API';
        case 'direct':
            return 'DIRECT';
        default:
            return 'CLASSIFIED';
    }
}

function collectionModeClass(mode: SourceSummary['collectionMode']): string {
    switch (mode) {
        case 'api':
            return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
        case 'direct':
            return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
        default:
            return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
    }
}

function interactionLabel(type: RecentInteraction['type']): string {
    switch (type) {
        case 'suggestion_click':
            return '추천 클릭';
        case 'product_open':
            return '상품 열람';
        default:
            return '쇼핑몰 이동';
    }
}

function pdpStrategyLabel(strategy: PdpRecentEvent['strategy']): string {
    switch (strategy) {
        case 'cache_hit':
            return '캐시 히트';
        case 'fetched':
            return '실시간 수집';
        case 'stale_cache_refreshed':
            return '캐시 갱신';
        case 'fetch_failed':
            return 'fetch 실패';
        case 'parse_empty':
            return 'parse 실패';
        default:
            return '미지원';
    }
}

function alertPriorityLabel(priority: AlertRecentEvent['priority']): string {
    switch (priority) {
        case 'critical':
            return '긴급';
        case 'high':
            return '높음';
        default:
            return '기본';
    }
}

function alertPriorityClass(priority: AlertRecentEvent['priority']): string {
    switch (priority) {
        case 'critical':
            return 'bg-rose-500/15 text-rose-200';
        case 'high':
            return 'bg-amber-500/15 text-amber-200';
        default:
            return 'bg-slate-700/60 text-slate-200';
    }
}

function alertPersonaModeLabel(mode: AlertPersonaRecentProfile['mode'] | null | undefined): string {
    switch (mode) {
        case 'instant':
            return '빠른 대응형';
        case 'batch':
            return '배치 확인형';
        case 'balanced':
            return '균형 확인형';
        default:
            return '미확인';
    }
}

function alertPersonaModeClass(mode: AlertPersonaRecentProfile['mode'] | null | undefined): string {
    switch (mode) {
        case 'instant':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'batch':
            return 'bg-amber-500/15 text-amber-200';
        case 'balanced':
            return 'bg-sky-500/15 text-sky-200';
        default:
            return 'bg-slate-700/60 text-slate-200';
    }
}

function formatSnoozeHours(hours: number): string {
    if (!Number.isFinite(hours) || hours <= 0) {
        return '-';
    }

    if (hours % 24 === 0) {
        return `${Math.round(hours / 24)}d`;
    }

    return `${hours}h`;
}

function tuningSeverityClass(severity: 'high' | 'medium' | 'low'): string {
    switch (severity) {
        case 'high':
            return 'bg-rose-500/15 text-rose-200';
        case 'medium':
            return 'bg-amber-500/15 text-amber-200';
        default:
            return 'bg-emerald-500/15 text-emerald-200';
    }
}

function rolloutDeltaClass(value: number, direction: 'lower_better' | 'higher_better' = 'lower_better'): string {
    if (value === 0) {
        return 'text-slate-300';
    }

    const positive = direction === 'higher_better' ? value > 0 : value < 0;
    return positive ? 'text-emerald-300' : 'text-rose-300';
}

function rolloutActionLabel(action: 'increase' | 'hold' | 'decrease' | 'collect_more'): string {
    switch (action) {
        case 'increase':
            return '확대 추천';
        case 'decrease':
            return '축소 추천';
        case 'collect_more':
            return '표본 대기';
        default:
            return '유지 추천';
    }
}

function approvalStatusClass(status: AlertTuningApprovalRequest['status']): string {
    switch (status) {
        case 'approved':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'rejected':
            return 'bg-rose-500/15 text-rose-200';
        case 'expired':
            return 'bg-slate-500/20 text-slate-300';
        case 'pending_second_approval':
            return 'bg-sky-500/15 text-sky-200';
        default:
            return 'bg-amber-500/15 text-amber-200';
    }
}

function approvalStatusLabel(status: AlertTuningApprovalRequest['status']): string {
    switch (status) {
        case 'approved':
            return 'APPROVED';
        case 'rejected':
            return 'REJECTED';
        case 'expired':
            return 'EXPIRED';
        case 'pending_second_approval':
            return 'SECOND APPROVAL';
        default:
            return 'PENDING';
    }
}

function auditLevelClass(level: AlertTuningAuditEvent['level']): string {
    switch (level) {
        case 'success':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'warning':
            return 'bg-amber-500/15 text-amber-200';
        case 'critical':
            return 'bg-rose-500/15 text-rose-200';
        default:
            return 'bg-slate-500/20 text-slate-300';
    }
}

function auditTypeLabel(type: AlertTuningAuditEvent['type']): string {
    switch (type) {
        case 'request_created':
            return 'REQUEST';
        case 'approval_recorded':
            return 'APPROVAL';
        case 'second_approval_required':
            return 'SECOND APPROVAL';
        case 'request_approved':
            return 'APPROVED';
        case 'request_rejected':
            return 'REJECTED';
        case 'request_expired':
            return 'EXPIRED';
        case 'config_saved':
            return 'CONFIG SAVE';
        case 'config_rolled_back':
            return 'ROLLBACK';
        case 'sla_digest':
            return 'DIGEST';
        case 'webhook_dispatched':
            return 'WEBHOOK OK';
        case 'webhook_failed':
            return 'WEBHOOK FAIL';
        default:
            return 'AUDIT';
    }
}

function notificationTypeForAudit(level: AlertTuningAuditEvent['level']): 'info' | 'success' | 'alert' {
    if (level === 'success') return 'success';
    if (level === 'warning' || level === 'critical') return 'alert';
    return 'info';
}

function webhookFormatLabel(format: AlertTuningWebhookConfig['format']): string {
    switch (format) {
        case 'slack':
            return 'Slack';
        case 'discord':
            return 'Discord';
        case 'generic':
            return 'Generic JSON';
        default:
            return 'Not Configured';
    }
}

function buildClientAuditInboxSummary(events: AlertTuningAuditEvent[]): AlertTuningAuditInboxSummary {
    const unread = events.filter((event) => !event.read);
    return {
        total: events.length,
        unreadCount: unread.length,
        criticalUnreadCount: unread.filter((event) => event.level === 'critical').length,
        warningUnreadCount: unread.filter((event) => event.level === 'warning').length,
    };
}

function toMillisFromIso(value: string | null | undefined): number | null {
    if (!value) return null;
    const millis = Date.parse(value);
    return Number.isFinite(millis) ? millis : null;
}

function requestAgeHours(createdAt: string | null | undefined): number | null {
    const createdAtMs = toMillisFromIso(createdAt);
    if (createdAtMs === null) return null;
    return Math.max(0, (Date.now() - createdAtMs) / 3_600_000);
}

function requestExpiresAt(createdAt: string | null | undefined): string | null {
    const createdAtMs = toMillisFromIso(createdAt);
    if (createdAtMs === null) return null;
    return new Date(createdAtMs + 48 * 3_600_000).toISOString();
}

function formatHours(value: number): string {
    if (!Number.isFinite(value)) return '-';
    if (value >= 10) return `${Math.round(value)}h`;
    return `${value.toFixed(1)}h`;
}

function buildApprovalQueueSummary(requests: AlertTuningApprovalRequest[]): ApprovalQueueSummary {
    const openRequests = requests.filter((request) => request.status === 'pending' || request.status === 'pending_second_approval');
    const openAges = openRequests
        .map((request) => requestAgeHours(request.createdAt))
        .filter((value): value is number => value !== null);
    const resolutionHours = requests
        .filter((request) => request.status === 'approved' || request.status === 'rejected' || request.status === 'expired')
        .map((request) => {
            const createdAtMs = toMillisFromIso(request.createdAt);
            const resolvedAtMs = toMillisFromIso(request.resolvedAt);
            if (createdAtMs === null || resolvedAtMs === null) return null;
            return Math.max(0, (resolvedAtMs - createdAtMs) / 3_600_000);
        })
        .filter((value): value is number => value !== null);
    const withinSlaResolvedCount = resolutionHours.filter((hours) => hours <= 24).length;

    return {
        openCount: openRequests.length,
        pendingCount: requests.filter((request) => request.status === 'pending').length,
        secondApprovalCount: requests.filter((request) => request.status === 'pending_second_approval').length,
        approvedCount: requests.filter((request) => request.status === 'approved').length,
        rejectedCount: requests.filter((request) => request.status === 'rejected').length,
        expiredCount: requests.filter((request) => request.status === 'expired').length,
        overdueCount: openAges.filter((hours) => hours >= 24).length,
        expiringSoonCount: openAges.filter((hours) => hours >= 18 && hours < 48).length,
        avgOpenAgeHours: openAges.length > 0 ? Number((openAges.reduce((sum, hours) => sum + hours, 0) / openAges.length).toFixed(1)) : 0,
        maxOpenAgeHours: openAges.length > 0 ? Number(Math.max(...openAges).toFixed(1)) : 0,
        avgResolutionHours: resolutionHours.length > 0 ? Number((resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length).toFixed(1)) : 0,
        withinSlaRate: resolutionHours.length > 0 ? Number(((withinSlaResolvedCount / resolutionHours.length) * 100).toFixed(1)) : 0,
        oldestOpenAt: openRequests
            .map((request) => request.createdAt)
            .filter((value): value is string => Boolean(value))
            .sort((left, right) => left.localeCompare(right))[0] || null,
    };
}

function isFailureStrategy(strategy: string): boolean {
    return strategy === 'empty' || strategy === 'naver_classified_fallback' || strategy === 'classified_naver';
}

function isDirectStrategy(strategy: string): boolean {
    return strategy === 'direct' || strategy === 'direct_preferred_over_naver';
}

function isFallbackStrategy(strategy: string): boolean {
    return strategy === 'naver_classified_fallback' || strategy === 'classified_naver';
}

function buildSourceDrilldown(recent: RecentSnapshot[], source: string): {
    samples: SourceDrilldownItem[];
    failureSamples: SourceDrilldownItem[];
    fallbackSamples: SourceDrilldownItem[];
    directSamples: SourceDrilldownItem[];
    successSamples: SourceDrilldownItem[];
} {
    const samples = recent.flatMap((snapshot) => {
        const match = snapshot.sources.find((entry) => entry.source === source);
        if (!match) return [];

        return [{
            query: snapshot.query,
            effectiveQuery: snapshot.effectiveQuery,
            generatedAt: snapshot.generatedAt,
            totalProducts: snapshot.totalProducts,
            finalCount: match.finalCount,
            strategy: match.strategy,
            fallbackReason: match.fallbackReason,
            requestedQueries: match.requestedQueries,
            resolvedQuery: match.resolvedQuery,
        }];
    });

    return {
        samples,
        failureSamples: samples.filter((sample) => isFailureStrategy(sample.strategy)),
        fallbackSamples: samples.filter((sample) => isFallbackStrategy(sample.strategy)),
        directSamples: samples.filter((sample) => isDirectStrategy(sample.strategy)),
        successSamples: samples.filter((sample) => sample.finalCount > 0),
    };
}

function dayLabel(value: string): string {
    return new Date(value).toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
    });
}

function buildSourceTrend(recent: RecentSnapshot[], source: string): SourceTrendPoint[] {
    const drilldown = buildSourceDrilldown(recent, source);
    const grouped = new Map<string, Omit<SourceTrendPoint, 'successRate'>>();

    drilldown.samples.forEach((sample) => {
        const day = dayLabel(sample.generatedAt);
        const current = grouped.get(day) || {
            day,
            samples: 0,
            successSamples: 0,
            directSamples: 0,
            fallbackSamples: 0,
            emptySamples: 0,
            totalItems: 0,
        };

        current.samples += 1;
        current.successSamples += sample.finalCount > 0 ? 1 : 0;
        current.directSamples += isDirectStrategy(sample.strategy) ? 1 : 0;
        current.fallbackSamples += isFallbackStrategy(sample.strategy) ? 1 : 0;
        current.emptySamples += sample.strategy === 'empty' ? 1 : 0;
        current.totalItems += sample.finalCount;
        grouped.set(day, current);
    });

    return Array.from(grouped.values())
        .map((entry) => ({
            ...entry,
            successRate: entry.samples > 0
                ? Math.round((entry.successSamples / entry.samples) * 100)
                : 0,
        }))
        .sort((left, right) => left.day.localeCompare(right.day))
        .slice(-7);
}

export default function SearchDiagnosticsDashboard({ scope = 'full' }: SearchDiagnosticsDashboardProps) {
    const { user, loading } = useUser();
    const [data, setData] = useState<DiagnosticsResponse | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
    const [alertTuningDraft, setAlertTuningDraft] = useState<AlertTuningConfig | null>(null);
    const [isTuningDirty, setIsTuningDirty] = useState(false);
    const [isSavingTuning, setIsSavingTuning] = useState(false);
    const [rollbackingHistoryId, setRollbackingHistoryId] = useState<string | null>(null);
    const [processingRequestId, setProcessingRequestId] = useState<string | null>(null);
    const [tuningMessage, setTuningMessage] = useState<string | null>(null);
    const [selectedOverrideSource, setSelectedOverrideSource] = useState<string | null>(null);
    const [queuedRequestNotes, setQueuedRequestNotes] = useState<Record<string, string>>({});
    const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});
    const [markingAuditId, setMarkingAuditId] = useState<string | null>(null);
    const [runningReminderDigest, setRunningReminderDigest] = useState(false);
    const [processingSearchLearningId, setProcessingSearchLearningId] = useState<string | null>(null);
    const [searchLearningMessage, setSearchLearningMessage] = useState<string | null>(null);
    const seenAuditEventIds = useRef<Set<string>>(new Set());
    const auditFeedHydrated = useRef(false);

    useEffect(() => {
        if (!user || user.isAnonymous) {
            setData(null);
            setError(null);
            setIsAdminAuthorized(null);
            return;
        }

        let cancelled = false;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const fetchDiagnostics = async (): Promise<boolean> => {
            setIsFetching(true);
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/realtime-search/diagnostics?include=recent&limit=60', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                });
                const payload = await parseJsonResponseSafely(response);

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403 || response.status === 503) {
                        if (!cancelled) {
                            setIsAdminAuthorized(false);
                            setData(null);
                        }
                    }
                    const message = payload && typeof payload === 'object' && typeof payload.error === 'string'
                        ? payload.error
                        : `진단 데이터를 불러오지 못했습니다. status=${response.status}`;
                    throw new Error(message);
                }

                if (!payload) {
                    throw new Error('진단 API가 비어 있는 응답을 반환했습니다.');
                }

                if (!cancelled) {
                    setIsAdminAuthorized(true);
                    setData(payload as DiagnosticsResponse);
                    setError(null);
                }
                return true;
            } catch (fetchError) {
                if (!cancelled) {
                    setError(fetchError instanceof Error ? fetchError.message : '진단 데이터를 불러오지 못했습니다.');
                }
                return false;
            } finally {
                if (!cancelled) {
                    setIsFetching(false);
                }
            }
        };

        void (async () => {
            const shouldPoll = await fetchDiagnostics();
            if (!cancelled && shouldPoll) {
                intervalId = setInterval(() => {
                    void fetchDiagnostics();
                }, 15_000);
            }
        })();

        return () => {
            cancelled = true;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [user]);

    useEffect(() => {
        const firstSource = data?.summary.sources[0]?.source || null;
        if (!firstSource) return;
        if (!selectedSource || !data?.summary.sources.some((entry) => entry.source === selectedSource)) {
            setSelectedSource(firstSource);
        }
    }, [data, selectedSource]);

    useEffect(() => {
        if (data?.alertTuning?.config && !isTuningDirty) {
            setAlertTuningDraft(data.alertTuning.config);
        }
    }, [data?.alertTuning, isTuningDirty]);

    useEffect(() => {
        if (!user) {
            seenAuditEventIds.current.clear();
            auditFeedHydrated.current = false;
            return;
        }

        const auditEvents = data?.alertTuningAudit || [];
        if (!auditFeedHydrated.current) {
            auditEvents.forEach((event) => {
                seenAuditEventIds.current.add(event.id);
            });
            auditFeedHydrated.current = true;
            return;
        }

        auditEvents
            .slice()
            .reverse()
            .forEach((event) => {
                if (seenAuditEventIds.current.has(event.id)) {
                    return;
                }

                seenAuditEventIds.current.add(event.id);
                if (event.level === 'info') {
                    return;
                }

                pushAppNotification({
                    title: event.title,
                    message: event.message,
                    type: notificationTypeForAudit(event.level),
                });
            });
    }, [data?.alertTuningAudit, user]);

    const availableOverrideSources = Array.from(new Set([
        ...(data?.summary.sources.map((entry) => entry.source) || []),
        ...(data?.alerts.summary.sources.map((entry) => entry.source) || []),
        ...Object.keys((alertTuningDraft || data?.alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG).sourceOverrides || {}),
        ...Object.keys((alertTuningDraft || data?.alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG).sourceRollouts || {}),
    ])).sort((left, right) => left.localeCompare(right));

    useEffect(() => {
        if (!availableOverrideSources.length) {
            setSelectedOverrideSource(null);
            return;
        }

        if (!selectedOverrideSource || !availableOverrideSources.includes(selectedOverrideSource)) {
            setSelectedOverrideSource(availableOverrideSources[0]);
        }
    }, [availableOverrideSources, selectedOverrideSource]);

    if (loading) {
        return <div className="min-h-screen bg-slate-950 text-slate-200 p-8">Loading...</div>;
    }

    if (!user || user.isAnonymous) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
                <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Only</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Sign In Required</h1>
                    <p className="mt-3 text-sm text-slate-400">
                        {user?.isAnonymous
                            ? '현재 익명 로그인 상태입니다. 홈 화면에서 Google 로그인 후 다시 시도하세요.'
                            : '관리자 진단 화면을 보려면 먼저 로그인해야 합니다.'}
                    </p>
                </div>
            </div>
        );
    }

    if (isAdminAuthorized === false) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
                <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Only</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Access Denied</h1>
                    <p className="mt-3 text-sm text-slate-400">{error || '관리자 권한이 필요합니다.'}</p>
                </div>
            </div>
        );
    }

    if (isAdminAuthorized === null && isFetching && !data) {
        return <div className="min-h-screen bg-slate-950 text-slate-200 p-8">Loading...</div>;
    }

    const summary = data?.summary;
    const searchLearning = data?.searchLearning;
    const searchLearningEntries = searchLearning?.entries || [];
    const totalSources = summary?.sources.length || 0;
    const directSources = summary?.sources.filter((entry) => entry.collectionMode === 'direct').length || 0;
    const fallbackSources = summary?.sources.filter((entry) => entry.fallbackHits > 0).length || 0;
    const selectedSummary = summary?.sources.find((entry) => entry.source === selectedSource) || null;
    const drilldown = buildSourceDrilldown(data?.recent || [], selectedSource || '');
    const trendPoints = buildSourceTrend(data?.recent || [], selectedSource || '');
    const recentSnapshots = (data?.recent || []).slice(0, 12);
    const lowFitQueries = buildLowFitQueries(data?.recent || []);
    const recentInteractions = (data?.recentInteractions || []).slice(0, 12);
    const pdpSummary = data?.pdp.summary;
    const selectedPdpSummary = pdpSummary?.sources.find((entry) => entry.source === selectedSource)
        || pdpSummary?.sources[0]
        || null;
    const recentPdpEvents = (data?.pdp.recent || []).slice(0, 16);
    const pdpFailures = recentPdpEvents.filter((entry) => entry.strategy === 'fetch_failed' || entry.strategy === 'parse_empty');
    const pdpSelectedEvents = recentPdpEvents.filter((entry) => !selectedPdpSummary || entry.source === selectedPdpSummary.source);
    const alertSummary = data?.alerts.summary;
    const selectedAlertSummary = alertSummary?.sources.find((entry) => entry.source === selectedSource)
        || alertSummary?.sources[0]
        || null;
    const alertDrilldown = data?.alerts.drilldown || [];
    const selectedAlertDrilldown = alertDrilldown.find((entry) => entry.source === selectedAlertSummary?.source)
        || alertDrilldown[0]
        || null;
    const alertSuggestions = buildAlertTuningSuggestions(alertDrilldown);
    const selectedAlertSuggestion = alertSuggestions.find((entry) => entry.source === selectedAlertDrilldown?.source)
        || null;
    const recentAlertEvents = (data?.alerts.recent || []).slice(0, 16);
    const selectedAlertEvents = recentAlertEvents.filter((entry) => !selectedAlertSummary || entry.source === selectedAlertSummary.source);
    const alertPersonaSummary = data?.alerts.personas.summary;
    const alertPersonaRecent = data?.alerts.personas.recent || [];
    const alertRollout = data?.alerts.rollout || [];
    const alertRolloutTrends = data?.alerts.rolloutTrends || [];
    const rolloutRecommendations = buildAlertRolloutRecommendations(alertRollout);
    const alertTuning = data?.alertTuning;
    const alertTuningRequests = data?.alertTuningRequests || [];
    const alertTuningAudit = data?.alertTuningAudit || [];
    const alertTuningAuditInbox = data?.alertTuningAuditInbox || buildClientAuditInboxSummary(alertTuningAudit);
    const alertTuningDigest = data?.alertTuningDigest || {
        generatedAt: new Date(0).toISOString(),
        openCount: 0,
        overdueCount: 0,
        expiringSoonCount: 0,
        expiredCount: 0,
        oldestOpenAt: null,
        overdueRequests: [],
        expiringSoonRequests: [],
    };
    const alertTuningWebhook = data?.alertTuningWebhook || {
        configured: false,
        format: null,
        targetLabel: null,
    };
    const approvalQueueSummary = buildApprovalQueueSummary(alertTuningRequests);
    const draftTuning = alertTuningDraft || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
    const currentOverrideSource = selectedOverrideSource || availableOverrideSources[0] || null;
    const currentSourceOverride = currentOverrideSource
        ? draftTuning.sourceOverrides?.[currentOverrideSource]
        : undefined;
    const currentSourceRollout = currentOverrideSource
        ? draftTuning.sourceRollouts?.[currentOverrideSource] ?? 100
        : 100;
    const openApprovalRequests = alertTuningRequests.filter((entry) => entry.status === 'pending' || entry.status === 'pending_second_approval');
    const quickRollbackEntries = (alertTuning?.history || []).filter((entry) => entry.restorable).slice(0, 3);
    const isOpsOnly = scope === 'ops';

    function updateAlertTuningMode(
        mode: AlertBehaviorMode,
        field: 'defaultSnoozeHours' | 'targetDiscountRate' | AlertRecentEvent['priority'],
        value: number
    ) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            const nextMode = { ...base.modes[mode] };

            if (field === 'defaultSnoozeHours' || field === 'targetDiscountRate') {
                (nextMode[field] as number) = value;
            } else {
                nextMode.recommendedByPriority = {
                    ...nextMode.recommendedByPriority,
                    [field]: value,
                };
            }

            return {
                ...base,
                modes: {
                    ...base.modes,
                    [mode]: nextMode,
                },
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(null);
    }

    function updateSourceAlertTuningMode(
        source: string,
        mode: AlertBehaviorMode,
        field: 'defaultSnoozeHours' | 'targetDiscountRate' | AlertRecentEvent['priority'],
        value: number
    ) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            const existingSource = base.sourceOverrides?.[source] || {};
            const nextMode = {
                defaultSnoozeHours: existingSource[mode]?.defaultSnoozeHours ?? base.modes[mode].defaultSnoozeHours,
                targetDiscountRate: existingSource[mode]?.targetDiscountRate ?? base.modes[mode].targetDiscountRate,
                recommendedByPriority: {
                    ...base.modes[mode].recommendedByPriority,
                    ...(existingSource[mode]?.recommendedByPriority || {}),
                },
            };

            if (field === 'defaultSnoozeHours' || field === 'targetDiscountRate') {
                nextMode[field] = value;
            } else {
                nextMode.recommendedByPriority = {
                    ...nextMode.recommendedByPriority,
                    [field]: value,
                };
            }

            return {
                ...base,
                sourceOverrides: {
                    ...(base.sourceOverrides || {}),
                    [source]: {
                        ...existingSource,
                        [mode]: nextMode,
                    },
                },
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(null);
    }

    function updateSourceRolloutPercentage(source: string, value: number) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            return {
                ...base,
                sourceRollouts: {
                    ...(base.sourceRollouts || {}),
                    [source]: Math.min(100, Math.max(0, Math.round(value * 10) / 10)),
                },
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(null);
    }

    async function queueRecommendedSourceRolloutRequest(recommendation: {
        source: string;
        currentRolloutPercentage: number;
        recommendedRolloutPercentage: number;
        title: string;
        description: string;
    }) {
        if (!user) {
            return;
        }

        setProcessingRequestId(recommendation.source);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/requests', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    source: recommendation.source,
                    currentRolloutPercentage: recommendation.currentRolloutPercentage,
                    proposedRolloutPercentage: recommendation.recommendedRolloutPercentage,
                    title: recommendation.title,
                    description: recommendation.description,
                    requestNote: queuedRequestNotes[recommendation.source] || '',
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'approval request 생성에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                alertTuningRequests: payload.requests || [],
            } : current);
            setQueuedRequestNotes((current) => {
                const next = { ...current };
                delete next[recommendation.source];
                return next;
            });
            setTuningMessage(`${recommendation.source} rollout approval request를 생성했습니다.`);
        } catch (requestError) {
            setTuningMessage(requestError instanceof Error ? requestError.message : 'approval request 생성에 실패했습니다.');
        } finally {
            setProcessingRequestId(null);
        }
    }

    async function handleResolveApprovalRequest(requestId: string, action: 'approve' | 'reject') {
        if (!user) {
            return;
        }

        setProcessingRequestId(requestId);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/requests', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId,
                    action,
                    resolutionNote: resolutionNotes[requestId] || '',
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'approval request 처리에 실패했습니다.');
            }

            if (payload.alertTuning) {
                primeAlertTuningSettings(payload.alertTuning);
            }
            setData((current) => current ? {
                ...current,
                alertTuning: payload.alertTuning || current.alertTuning,
                alertTuningRequests: payload.requests || [],
            } : current);
            if (payload.alertTuning && !isTuningDirty) {
                setAlertTuningDraft(payload.alertTuning.config);
            }
            setResolutionNotes((current) => {
                const next = { ...current };
                delete next[requestId];
                return next;
            });
            setTuningMessage(action === 'approve' ? 'approval request를 승인해 rollout 설정에 반영했습니다.' : 'approval request를 거절했습니다.');
        } catch (resolveError) {
            setTuningMessage(resolveError instanceof Error ? resolveError.message : 'approval request 처리에 실패했습니다.');
        } finally {
            setProcessingRequestId(null);
        }
    }

    async function handleMarkAuditEventsRead(eventIds: string[], markAll = false) {
        if (!user || (eventIds.length === 0 && !markAll)) {
            return;
        }

        setMarkingAuditId(markAll ? '__all__' : eventIds[0] || null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/audit', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(markAll ? { markAll: true } : { eventIds }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'audit inbox 업데이트에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                alertTuningAudit: payload.events || [],
                alertTuningAuditInbox: payload.inbox || current.alertTuningAuditInbox,
            } : current);
        } catch (auditError) {
            setTuningMessage(auditError instanceof Error ? auditError.message : 'audit inbox 업데이트에 실패했습니다.');
        } finally {
            setMarkingAuditId(null);
        }
    }

    async function handleRunReminderDigest() {
        if (!user) {
            return;
        }

        setRunningReminderDigest(true);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning/reminders', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'approval reminder digest 실행에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                alertTuningDigest: payload.digest || current.alertTuningDigest,
                alertTuningAudit: payload.auditEvents || current.alertTuningAudit,
                alertTuningAuditInbox: buildClientAuditInboxSummary(payload.auditEvents || current.alertTuningAudit),
            } : current);
            const formatLabel = webhookFormatLabel(payload.dispatch?.format || alertTuningWebhook.format);
            setTuningMessage(payload.dispatch?.configured
                ? payload.dispatch?.delivered
                    ? `approval reminder digest를 생성하고 ${formatLabel} webhook으로 dispatch했습니다.`
                    : `approval reminder digest를 생성했지만 ${formatLabel} webhook delivery는 실패했습니다.`
                : 'approval reminder digest를 생성했습니다. webhook은 아직 설정되지 않았습니다.');
        } catch (digestError) {
            setTuningMessage(digestError instanceof Error ? digestError.message : 'approval reminder digest 실행에 실패했습니다.');
        } finally {
            setRunningReminderDigest(false);
        }
    }

    function handleRemoveSourceOverride(source: string) {
        setAlertTuningDraft((current) => {
            const base = current || alertTuning?.config || DEFAULT_ALERT_TUNING_CONFIG;
            const nextOverrides = { ...(base.sourceOverrides || {}) };
            const nextRollouts = { ...(base.sourceRollouts || {}) };
            delete nextOverrides[source];
            delete nextRollouts[source];
            return {
                ...base,
                sourceOverrides: nextOverrides,
                sourceRollouts: nextRollouts,
            };
        });
        setIsTuningDirty(true);
        setTuningMessage(`${source} source override를 제거했습니다. 저장하면 반영됩니다.`);
    }

    async function handleSaveAlertTuning() {
        if (!user || !draftTuning) {
            return;
        }

        setIsSavingTuning(true);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ config: draftTuning }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || '알림 튜닝 설정 저장에 실패했습니다.');
            }

            primeAlertTuningSettings(payload);
            setData((current) => current ? {
                ...current,
                alertTuning: payload,
            } : current);
            setAlertTuningDraft(payload.config);
            setIsTuningDirty(false);
            setTuningMessage('알림 튜닝 설정을 저장했습니다.');
        } catch (saveError) {
            setTuningMessage(saveError instanceof Error ? saveError.message : '알림 튜닝 설정 저장에 실패했습니다.');
        } finally {
            setIsSavingTuning(false);
        }
    }

    async function handleRollbackAlertTuning(historyId: string) {
        if (!user || !historyId) {
            return;
        }

        setRollbackingHistoryId(historyId);
        setTuningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/alert-tuning', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rollbackHistoryId: historyId }),
            });
            const payload = await response.json();

            if (!response.ok) {
                throw new Error(payload.error || '알림 튜닝 설정 복원에 실패했습니다.');
            }

            primeAlertTuningSettings(payload);
            setData((current) => current ? {
                ...current,
                alertTuning: payload,
            } : current);
            setAlertTuningDraft(payload.config);
            setIsTuningDirty(false);
            setTuningMessage('선택한 설정 이력으로 복원했습니다.');
        } catch (rollbackError) {
            setTuningMessage(rollbackError instanceof Error ? rollbackError.message : '알림 튜닝 설정 복원에 실패했습니다.');
        } finally {
            setRollbackingHistoryId(null);
        }
    }

    async function handleGenerateSearchLearningSuggestion(entryId: string) {
        if (!user) {
            return;
        }

        setProcessingSearchLearningId(entryId);
        setSearchLearningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/search-learning', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'generate',
                    entryId,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || 'AI 검색 제안 생성에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                searchLearning: {
                    ...current.searchLearning,
                    entries: current.searchLearning.entries.map((entry) => (
                        entry.id === entryId ? (payload.entry || entry) : entry
                    )),
                },
            } : current);
            setSearchLearningMessage('AI 검색어 제안을 생성했습니다.');
        } catch (suggestionError) {
            setSearchLearningMessage(suggestionError instanceof Error ? suggestionError.message : 'AI 검색 제안 생성에 실패했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleReviewSearchLearningEntry(entry: SearchLearningEntry, action: 'approve' | 'ignore') {
        if (!user) {
            return;
        }

        setProcessingSearchLearningId(entry.id);
        setSearchLearningMessage(null);
        try {
            const token = await user.getIdToken();
            const approvedQueries = action === 'approve'
                ? (entry.aiSuggestion?.suggestedQueries.length
                    ? entry.aiSuggestion.suggestedQueries
                    : entry.suggestedQueries)
                : [];
            const response = await fetch('/api/search-learning', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    entryId: entry.id,
                    approvedQueries,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || '검색 학습 검토 저장에 실패했습니다.');
            }

            setData((current) => current ? {
                ...current,
                searchLearning: {
                    ...current.searchLearning,
                    entries: current.searchLearning.entries.map((currentEntry) => (
                        currentEntry.id === entry.id ? (payload.entry || currentEntry) : currentEntry
                    )),
                },
            } : current);
            setSearchLearningMessage(action === 'approve' ? '학습 query를 승인했습니다.' : '학습 query를 보류 처리했습니다.');
        } catch (reviewError) {
            setSearchLearningMessage(reviewError instanceof Error ? reviewError.message : '검색 학습 검토 저장에 실패했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    function handleResetAlertTuning() {
        setAlertTuningDraft(DEFAULT_ALERT_TUNING_CONFIG);
        setIsTuningDirty(true);
        setTuningMessage('기본 알림 튜닝값으로 되돌렸습니다. 저장하면 전체에 반영됩니다.');
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">
                            {isOpsOnly ? 'Alert Ops' : 'Search Ops'}
                        </p>
                        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
                            {isOpsOnly ? 'Alert Ops Control Tower' : 'Realtime Search Diagnostics'}
                        </h1>
                        <p className="mt-3 text-sm text-slate-400">
                            {isOpsOnly
                                ? 'approval queue, audit inbox, rollout tuning, webhook reminder 상태를 운영 기준으로 추적합니다.'
                                : '소스별 직접 수집 성공률과 Naver fallback 상태를 추적합니다.'}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs">
                            <a
                                href="/admin"
                                className={`rounded-full px-4 py-2 font-bold ${!isOpsOnly ? 'bg-slate-100 text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                            >
                                Full Diagnostics
                            </a>
                            <a
                                href="/admin/ops"
                                className={`rounded-full px-4 py-2 font-bold ${isOpsOnly ? 'bg-slate-100 text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                            >
                                Ops Console
                            </a>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                        {!isOpsOnly && (
                            <>
                                <div>Search storage: <span className="font-semibold text-slate-200">{data?.storage || 'memory'}</span></div>
                                <div className="mt-1">PDP storage: <span className="font-semibold text-slate-200">{data?.pdp.storage || 'memory'}</span></div>
                            </>
                        )}
                        <div className="mt-1">Alert storage: <span className="font-semibold text-slate-200">{data?.alerts.storage || 'unavailable'}</span></div>
                        <div className="mt-1">
                            Webhook: <span className="font-semibold text-slate-200">{webhookFormatLabel(alertTuningWebhook.format)}</span>
                        </div>
                        {alertTuningWebhook.targetLabel && (
                            <div className="mt-1">Target: <span className="font-semibold text-slate-200">{alertTuningWebhook.targetLabel}</span></div>
                        )}
                        <div className="mt-1">Last updated: <span className="font-semibold text-slate-200">{formatTime(summary?.lastUpdatedAt)}</span></div>
                        <div className="mt-1">{isFetching ? 'Refreshing...' : 'Auto refresh 15s'}</div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                    </div>
                )}

                {isOpsOnly ? (
                    <section className="grid gap-4 md:grid-cols-4">
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Open Requests</p>
                            <p className="mt-2 text-4xl font-black tracking-tight text-white">{approvalQueueSummary.openCount}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Audit Unread</p>
                            <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{alertTuningAuditInbox.unreadCount}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Over SLA</p>
                            <p className="mt-2 text-4xl font-black tracking-tight text-rose-300">{approvalQueueSummary.overdueCount}</p>
                        </div>
                        <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Rollout Sources</p>
                            <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{alertRollout.length}</p>
                        </div>
                    </section>
                ) : (
                    <>
                        <section className="grid gap-4 md:grid-cols-4">
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Tracked Searches</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-white">{summary?.trackedSearches ?? 0}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Observed Sources</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-white">{totalSources}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Direct-capable Sources</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{directSources}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Fallback Sources</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{fallbackSources}</p>
                            </div>
                        </section>

                        <section className="mt-8 grid gap-4 lg:grid-cols-4">
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Strong Fit</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{data?.quality.strong ?? 0}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Low-fit Share</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{data?.quality.lowFitShare ?? 0}%</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Suggestion Clicks</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{data?.interactionSummary.suggestionClicks ?? 0}</p>
                            </div>
                            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Product Opens</p>
                                <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{data?.interactionSummary.productOpens ?? 0}</p>
                            </div>
                        </section>
                    </>
                )}

                {!isOpsOnly && (
                    <>
                        <section className="mt-8 grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Events</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-white">{pdpSummary?.trackedEvents ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Cache Hit</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{pdpSummary?.cacheHitRate ?? 0}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Fetch Success</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{pdpSummary?.fetchSuccessRate ?? 0}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Parse Success</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{pdpSummary?.parseSuccessRate ?? 0}%</p>
                    </div>
                        </section>

                        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">PDP Enrichment Sources</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    캐시 재사용률과 live fetch/parse 성공률을 소스별로 추적합니다.
                                </p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <div>Last PDP update</div>
                                <div className="mt-1 font-semibold text-slate-200">{formatTime(pdpSummary?.lastUpdatedAt)}</div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {(pdpSummary?.sources || []).map((entry) => {
                                const isSelected = selectedPdpSummary?.source === entry.source;
                                return (
                                    <button
                                        key={`pdp_${entry.source}`}
                                        type="button"
                                        onClick={() => setSelectedSource(entry.source)}
                                        className={`w-full rounded-2xl border p-4 text-left transition-colors ${isSelected ? 'border-sky-500/40 bg-slate-900/90' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{entry.source}</p>
                                                <p className="mt-2 text-xs text-slate-400">
                                                    req {entry.requests} · avg {entry.avgLatencyMs}ms · unsupported {entry.unsupportedCount}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {pdpStrategyLabel(entry.lastStrategy)}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                cache <span className="font-semibold text-emerald-200">{entry.cacheHitRate}%</span>
                                            </div>
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                fetch <span className="font-semibold text-sky-200">{entry.fetchSuccessRate}%</span>
                                            </div>
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                parse <span className="font-semibold text-violet-200">{entry.parseSuccessRate}%</span>
                                            </div>
                                        </div>
                                        {entry.lastReason && (
                                            <p className="mt-3 text-xs text-amber-200">{entry.lastReason}</p>
                                        )}
                                    </button>
                                );
                            })}
                            {(pdpSummary?.sources || []).length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    PDP enrichment 진단 데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">PDP Recent Events</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            {selectedPdpSummary
                                ? `${selectedPdpSummary.source} 기준 recent cache/fetch/parse 흐름입니다.`
                                : '최근 PDP enrichment 이벤트입니다.'}
                        </p>
                        <div className="mt-4 space-y-3">
                            {(pdpSelectedEvents.length > 0 ? pdpSelectedEvents : pdpFailures).slice(0, 10).map((entry) => (
                                <div key={`${entry.generatedAt}_${entry.source}_${entry.productId || entry.strategy}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{entry.source}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.strategy === 'fetch_failed' || entry.strategy === 'parse_empty' ? 'bg-rose-500/15 text-rose-200' : entry.strategy === 'cache_hit' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-sky-500/15 text-sky-200'}`}>
                                            {pdpStrategyLabel(entry.strategy)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                        <span className="rounded-full border border-slate-800 px-2 py-1">latency {entry.durationMs}ms</span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1">{entry.cacheHit ? 'cache' : 'live'}</span>
                                        {entry.fetchAttempted && (
                                            <span className="rounded-full border border-slate-800 px-2 py-1">
                                                fetch {entry.fetchSucceeded ? 'ok' : 'fail'}
                                            </span>
                                        )}
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            parse {entry.parseSucceeded ? 'ok' : 'miss'}
                                        </span>
                                    </div>
                                    {(entry.reason || entry.productId || entry.queryContext) && (
                                        <div className="mt-3 text-xs text-slate-400">
                                            {entry.reason && <div>reason: <span className="text-amber-200">{entry.reason}</span></div>}
                                            {entry.productId && <div>product: <span className="text-slate-200">{entry.productId}</span></div>}
                                            {entry.queryContext && <div>query: <span className="text-slate-200">{entry.queryContext}</span></div>}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {recentPdpEvents.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 PDP enrichment 이벤트가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                        </section>
                    </>
                )}

                <section className="mt-8 grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Alert Events</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-white">{alertSummary?.trackedAlerts ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Unread Alerts</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{alertSummary?.unreadCount ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Snoozed Targets</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{alertSummary?.snoozedTargets ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Avg Read Latency</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{alertSummary?.avgReadLatencyMinutes ?? 0}m</p>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Synced Personas</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-white">{alertPersonaSummary?.trackedProfiles ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Dominant Mode</p>
                        <p className="mt-2 text-2xl font-black tracking-tight text-emerald-300">
                            {alertPersonaModeLabel(alertPersonaSummary?.dominantMode)}
                        </p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Avg Default Snooze</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">
                            {formatSnoozeHours(alertPersonaSummary?.avgDefaultSnoozeHours ?? 0)}
                        </p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Persona Unread</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{alertPersonaSummary?.avgUnreadRate ?? 0}%</p>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">Alert Persona Distribution</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    사용자별 저장된 alert persona 분포와 기본 스누즈 성향입니다.
                                </p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <div>Last persona sync</div>
                                <div className="mt-1 font-semibold text-slate-200">{formatTime(alertPersonaSummary?.lastUpdatedAt)}</div>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-3">
                            {(alertPersonaSummary?.modes || []).map((entry) => (
                                <div key={`persona_mode_${entry.mode}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{alertPersonaModeLabel(entry.mode)}</p>
                                            <p className="mt-2 text-xs text-slate-400">
                                                profiles {entry.count} · share {entry.share}%
                                            </p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPersonaModeClass(entry.mode)}`}>
                                            {entry.mode.toUpperCase()}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            snooze <span className="font-semibold text-sky-200">{formatSnoozeHours(entry.avgDefaultSnoozeHours)}</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            unread <span className="font-semibold text-amber-200">{entry.avgUnreadRate}%</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            read <span className="font-semibold text-violet-200">{entry.avgReadLatencyMinutes}m</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(alertPersonaSummary?.modes || []).length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    저장된 alert persona가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Recent Synced Personas</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            최근 저장된 사용자 alert persona 샘플입니다.
                        </p>
                        <div className="mt-4 space-y-3">
                            {alertPersonaRecent.slice(0, 10).map((entry) => (
                                <div key={`${entry.userKey}_${entry.updatedAt || entry.mode}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.updatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{entry.userKey}</p>
                                            <p className="mt-1 text-xs text-slate-400">{entry.summary}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPersonaModeClass(entry.mode)}`}>
                                            {alertPersonaModeLabel(entry.mode)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                        <span className="rounded-full border border-slate-800 px-2 py-1">snooze {formatSnoozeHours(entry.defaultSnoozeHours)}</span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1">unread {entry.unreadRate}%</span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1">snoozed {entry.snoozeShare}%</span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1">read {entry.avgReadLatencyMinutes}m</span>
                                    </div>
                                </div>
                            ))}
                            {alertPersonaRecent.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 동기화된 alert persona가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Recommended Rollout Actions</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                experiment/control 비교를 바탕으로 source별 rollout 확대, 유지, 축소를 추천합니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Recommendation count: <span className="font-semibold text-slate-200">{rolloutRecommendations.length}</span></div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {rolloutRecommendations.map((recommendation) => {
                            const pendingRequest = openApprovalRequests.find((entry) =>
                                entry.source === recommendation.source
                                && entry.proposedRolloutPercentage === recommendation.recommendedRolloutPercentage
                            );
                            return (
                                <div key={`rollout_recommendation_${recommendation.source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{recommendation.source}</p>
                                            <p className="mt-2 text-sm text-slate-200">{recommendation.title}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${tuningSeverityClass(recommendation.severity)}`}>
                                            {rolloutActionLabel(recommendation.action)}
                                        </span>
                                    </div>

                                    <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>

                                    <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            current {recommendation.currentRolloutPercentage}%
                                        </span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1 text-slate-200">
                                            recommended {recommendation.recommendedRolloutPercentage}%
                                        </span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            exp {recommendation.experimentAlerts}
                                        </span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            ctrl {recommendation.controlAlerts}
                                        </span>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        <label className="block">
                                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Request Note</span>
                                            <textarea
                                                value={queuedRequestNotes[recommendation.source] || ''}
                                                onChange={(event) => setQueuedRequestNotes((current) => ({
                                                    ...current,
                                                    [recommendation.source]: event.target.value,
                                                }))}
                                                maxLength={280}
                                                placeholder="왜 이 rollout 변경이 필요한지 남겨두면 approval queue에서 바로 볼 수 있습니다."
                                                className="mt-2 min-h-[84px] w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600"
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => void queueRecommendedSourceRolloutRequest(recommendation)}
                                            disabled={Boolean(pendingRequest) || processingRequestId === recommendation.source}
                                            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
                                        >
                                            {pendingRequest
                                                ? '이미 pending queue'
                                                : processingRequestId === recommendation.source
                                                    ? '요청 생성 중...'
                                                    : 'approval queue에 추가'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {rolloutRecommendations.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                rollout recommendation을 계산할 source override 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Rollout Approval Queue</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                추천 rollout 변경을 queue에 쌓고, 24h SLA와 48h auto-expire 정책 아래에서 approve/reject로 운영 반영 여부를 결정합니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Open: <span className="font-semibold text-slate-200">{approvalQueueSummary.openCount}</span></div>
                            <div className="mt-1">Recent requests: <span className="font-semibold text-slate-200">{alertTuningRequests.length}</span></div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Pending</p>
                            <p className="mt-2 text-2xl font-black text-white">{approvalQueueSummary.pendingCount}</p>
                            <p className="mt-2 text-xs text-slate-400">1st approval 대기</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Second Approval</p>
                            <p className="mt-2 text-2xl font-black text-sky-200">{approvalQueueSummary.secondApprovalCount}</p>
                            <p className="mt-2 text-xs text-slate-400">2nd approver 대기</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Over SLA</p>
                            <p className="mt-2 text-2xl font-black text-amber-200">{approvalQueueSummary.overdueCount}</p>
                            <p className="mt-2 text-xs text-slate-400">24h 초과 open request</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Expiring Soon</p>
                            <p className="mt-2 text-2xl font-black text-orange-200">{approvalQueueSummary.expiringSoonCount}</p>
                            <p className="mt-2 text-xs text-slate-400">48h auto-expire 임박</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Avg Resolve</p>
                            <p className="mt-2 text-2xl font-black text-white">{formatHours(approvalQueueSummary.avgResolutionHours)}</p>
                            <p className="mt-2 text-xs text-slate-400">resolved mean turnaround</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Within SLA</p>
                            <p className="mt-2 text-2xl font-black text-emerald-200">{approvalQueueSummary.withinSlaRate}%</p>
                            <p className="mt-2 text-xs text-slate-400">resolved within 24h</p>
                        </div>
                    </div>

                    <div className="mt-4 space-y-3">
                        {approvalQueueSummary.oldestOpenAt && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-4 py-3 text-xs text-slate-400">
                                Oldest open request: <span className="font-semibold text-slate-200">{formatTime(approvalQueueSummary.oldestOpenAt)}</span>
                                <span className="ml-3">Max open age: <span className="font-semibold text-slate-200">{formatHours(approvalQueueSummary.maxOpenAgeHours)}</span></span>
                                <span className="ml-3">Expired total: <span className="font-semibold text-slate-200">{approvalQueueSummary.expiredCount}</span></span>
                            </div>
                        )}
                        {alertTuningRequests.map((request) => (
                            <div key={`approval_request_${request.id}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{request.source}</p>
                                        <p className="mt-2 text-sm text-slate-200">{request.title}</p>
                                        <p className="mt-2 text-xs leading-6 text-slate-400">{request.description}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${approvalStatusClass(request.status)}`}>
                                        {approvalStatusLabel(request.status)}
                                    </span>
                                </div>

                                <div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                    <span className="rounded-full border border-slate-800 px-2 py-1">
                                        current {request.currentRolloutPercentage}%
                                    </span>
                                    <span className="rounded-full border border-slate-800 px-2 py-1 text-slate-200">
                                        proposed {request.proposedRolloutPercentage}%
                                    </span>
                                    <span className="rounded-full border border-slate-800 px-2 py-1">
                                        approvals {request.approvalCount}/{request.requiredApprovals}
                                    </span>
                                    {requestAgeHours(request.createdAt) !== null && (
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            age {formatHours(requestAgeHours(request.createdAt) || 0)}
                                        </span>
                                    )}
                                    {request.status === 'pending' || request.status === 'pending_second_approval' ? (
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            expires {formatTime(requestExpiresAt(request.createdAt))}
                                        </span>
                                    ) : null}
                                    <span className="rounded-full border border-slate-800 px-2 py-1">
                                        created {formatTime(request.createdAt)}
                                    </span>
                                    <span className="rounded-full border border-slate-800 px-2 py-1">
                                        by {request.createdBy || 'system'}
                                    </span>
                                    {request.resolvedAt && (
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            resolved {formatTime(request.resolvedAt)}
                                        </span>
                                    )}
                                </div>

                                {(request.status === 'pending' || request.status === 'pending_second_approval') && (requestAgeHours(request.createdAt) || 0) >= 24 && (
                                    <div className="mt-4 rounded-2xl border border-amber-700/30 bg-amber-500/10 p-3 text-xs text-amber-200">
                                        SLA 초과 request입니다. 48h를 넘기면 system이 auto-expire 처리합니다.
                                    </div>
                                )}

                                {request.requestNote && (
                                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-6 text-slate-300">
                                        <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">Request Note</p>
                                        <p className="mt-2">{request.requestNote}</p>
                                    </div>
                                )}

                                {request.approvals.length > 0 && (
                                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-6 text-slate-300">
                                        <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">Approval Trail</p>
                                        <div className="mt-2 space-y-2">
                                            {request.approvals.map((approval, index) => (
                                                <div key={`${request.id}_approval_${approval.uid}_${index}`} className="rounded-xl border border-slate-800/80 bg-slate-950/60 px-3 py-2">
                                                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400">
                                                        <span className="text-slate-200">{approval.uid}</span>
                                                        <span>{formatTime(approval.approvedAt)}</span>
                                                    </div>
                                                    {approval.note && (
                                                        <p className="mt-2 text-xs text-slate-300">{approval.note}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {request.resolutionNote && (
                                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/60 p-3 text-xs leading-6 text-slate-300">
                                        <p className="font-semibold uppercase tracking-[0.14em] text-slate-500">Resolution Note</p>
                                        <p className="mt-2">{request.resolutionNote}</p>
                                    </div>
                                )}

                                {request.status === 'pending' || request.status === 'pending_second_approval' ? (
                                    <div className="mt-4 space-y-3">
                                        <label className="block">
                                            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Decision Note</span>
                                            <textarea
                                                value={resolutionNotes[request.id] || ''}
                                                onChange={(event) => setResolutionNotes((current) => ({
                                                    ...current,
                                                    [request.id]: event.target.value,
                                                }))}
                                                maxLength={280}
                                                placeholder="approve note는 approval trail에 남고, reject note는 필수입니다."
                                                className="mt-2 min-h-[84px] w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600"
                                            />
                                        </label>
                                        {request.status === 'pending_second_approval' && (
                                            <p className="text-[11px] text-sky-300">
                                                1차 승인이 완료됐습니다. 다른 approver의 second approval이 들어와야 rollout이 실제 적용됩니다.
                                            </p>
                                        )}
                                        {request.createdBy === user.uid && (
                                            <p className="text-[11px] text-amber-300">
                                                다중 admin 설정이면 request 생성자는 self-approve가 차단됩니다.
                                            </p>
                                        )}
                                        {request.approvals.some((approval) => approval.uid === user.uid) && (
                                            <p className="text-[11px] text-amber-300">
                                                이미 approve한 request입니다. 같은 관리자는 두 번 approve할 수 없습니다.
                                            </p>
                                        )}
                                        <div className="flex flex-wrap gap-3">
                                            <button
                                                type="button"
                                                onClick={() => void handleResolveApprovalRequest(request.id, 'approve')}
                                                disabled={Boolean(processingRequestId)}
                                                className="rounded-full border border-emerald-700/40 px-4 py-2 text-xs font-bold text-emerald-200 disabled:opacity-40"
                                            >
                                                {processingRequestId === request.id
                                                    ? '처리 중...'
                                                    : request.status === 'pending_second_approval'
                                                        ? 'Second Approve'
                                                        : 'Approve'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleResolveApprovalRequest(request.id, 'reject')}
                                                disabled={Boolean(processingRequestId)}
                                                className="rounded-full border border-rose-700/40 px-4 py-2 text-xs font-bold text-rose-200 disabled:opacity-40"
                                            >
                                                {processingRequestId === request.id ? '처리 중...' : 'Reject'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-4 text-xs text-slate-500">
                                        {request.resolvedBy ? `resolved by ${request.resolvedBy}` : 'resolved'}
                                    </div>
                                )}
                            </div>
                        ))}
                        {alertTuningRequests.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                아직 생성된 rollout approval request가 없습니다.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Queue Ops Feed</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                audit trail, reminder digest, quick rollback CTA를 한 화면에서 봅니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Audit events: <span className="font-semibold text-slate-200">{alertTuningAudit.length}</span></div>
                            <div className="mt-1">Unread: <span className="font-semibold text-amber-200">{alertTuningAuditInbox.unreadCount}</span></div>
                            <div className="mt-1">Digest: <span className="font-semibold text-slate-200">{formatTime(alertTuningDigest.generatedAt)}</span></div>
                            <div className="mt-1">Webhook: <span className="font-semibold text-slate-200">{webhookFormatLabel(alertTuningWebhook.format)}</span></div>
                            {alertTuningWebhook.targetLabel && (
                                <div className="mt-1">Target: <span className="font-semibold text-slate-200">{alertTuningWebhook.targetLabel}</span></div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => void handleMarkAuditEventsRead([], true)}
                            disabled={alertTuningAuditInbox.unreadCount === 0 || Boolean(markingAuditId)}
                            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
                        >
                            {markingAuditId === '__all__' ? '처리 중...' : 'Mark All Read'}
                        </button>
                        <button
                            type="button"
                            onClick={() => void handleRunReminderDigest()}
                            disabled={runningReminderDigest}
                            className="rounded-full border border-sky-700/40 px-4 py-2 text-xs font-bold text-sky-200 disabled:opacity-40"
                        >
                            {runningReminderDigest ? 'Digest 실행 중...' : 'Run Digest Now'}
                        </button>
                        <div className="rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-400">
                            critical unread <span className="font-semibold text-rose-200">{alertTuningAuditInbox.criticalUnreadCount}</span>
                        </div>
                        <div className="rounded-full border border-slate-800 px-4 py-2 text-xs text-slate-400">
                            warning unread <span className="font-semibold text-amber-200">{alertTuningAuditInbox.warningUnreadCount}</span>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                        <div className="space-y-4">
                            <div className="grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Digest Open</p>
                                    <p className="mt-2 text-2xl font-black text-white">{alertTuningDigest.openCount}</p>
                                    <p className="mt-2 text-xs text-slate-400">current open approval requests</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Digest Overdue</p>
                                    <p className="mt-2 text-2xl font-black text-amber-200">{alertTuningDigest.overdueCount}</p>
                                    <p className="mt-2 text-xs text-slate-400">SLA를 넘긴 request</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Expired</p>
                                    <p className="mt-2 text-2xl font-black text-rose-200">{alertTuningDigest.expiredCount}</p>
                                    <p className="mt-2 text-xs text-slate-400">auto-expire 누적</p>
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Overdue Requests</p>
                                            <p className="mt-2 text-xs text-slate-400">24h를 초과한 open request</p>
                                        </div>
                                        <span className="rounded-full border border-amber-700/30 bg-amber-500/10 px-3 py-1 text-[11px] font-bold text-amber-200">
                                            {alertTuningDigest.overdueRequests.length}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {alertTuningDigest.overdueRequests.map((entry) => (
                                            <div key={`digest_overdue_${entry.requestId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                    <p className="font-semibold text-white">{entry.source}</p>
                                                    <span className="rounded-full border border-slate-800 px-2 py-1 text-[10px] text-slate-300">
                                                        {approvalStatusLabel(entry.status)}
                                                    </span>
                                                </div>
                                                <p className="mt-2 text-slate-400">{entry.title}</p>
                                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                                    <span>age {formatHours(entry.ageHours)}</span>
                                                    <span>expires {formatTime(entry.expiresAt)}</span>
                                                    <span>rollout {entry.proposedRolloutPercentage}%</span>
                                                </div>
                                            </div>
                                        ))}
                                        {alertTuningDigest.overdueRequests.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                                현재 overdue approval request가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">Quick Rollback CTA</p>
                                            <p className="mt-2 text-xs text-slate-400">최근 restorable tuning history를 바로 복원합니다.</p>
                                        </div>
                                        <span className="rounded-full border border-slate-800 px-3 py-1 text-[11px] font-bold text-slate-300">
                                            {quickRollbackEntries.length} ready
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {quickRollbackEntries.map((entry) => (
                                            <div key={`quick_rollback_${entry.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{formatTime(entry.updatedAt)}</p>
                                                        <p className="mt-2 text-sm text-slate-200">{entry.summary}</p>
                                                        {entry.updatedBy && (
                                                            <p className="mt-1 text-xs text-slate-500">{entry.updatedBy}</p>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleRollbackAlertTuning(entry.id)}
                                                        disabled={isSavingTuning || Boolean(rollbackingHistoryId)}
                                                        className="rounded-full border border-amber-700/40 px-3 py-2 text-[11px] font-bold text-amber-200 disabled:opacity-40"
                                                    >
                                                        {rollbackingHistoryId === entry.id ? '복원 중...' : 'Quick Rollback'}
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        {quickRollbackEntries.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                                즉시 복원 가능한 tuning history가 아직 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">Recent Audit Feed</p>
                                    <p className="mt-2 text-xs text-slate-400">approval lifecycle, digest, rollback 이벤트를 추적합니다.</p>
                                </div>
                            </div>
                            <div className="mt-4 space-y-3">
                                {alertTuningAudit.map((event) => (
                                    <div key={`audit_event_${event.id}`} className={`rounded-2xl border p-3 ${event.read ? 'border-slate-800 bg-slate-950/70' : 'border-sky-700/30 bg-sky-500/5'}`}>
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{event.title}</p>
                                                <p className="mt-2 text-xs leading-6 text-slate-400">{event.message}</p>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {!event.read && (
                                                    <span className="rounded-full border border-sky-700/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-200">
                                                        UNREAD
                                                    </span>
                                                )}
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${auditLevelClass(event.level)}`}>
                                                    {auditTypeLabel(event.type)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                                            <span>{formatTime(event.createdAt)}</span>
                                            {event.source && <span>{event.source}</span>}
                                            {event.actorUid && <span>{event.actorUid}</span>}
                                            {event.requestId && <span>request {event.requestId.slice(0, 8)}</span>}
                                            {event.readAt && <span>read {formatTime(event.readAt)}</span>}
                                        </div>
                                        {event.note && (
                                            <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
                                                {event.note}
                                            </div>
                                        )}
                                        {!event.read && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleMarkAuditEventsRead([event.id])}
                                                    disabled={Boolean(markingAuditId)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-[11px] font-bold text-slate-200 disabled:opacity-40"
                                                >
                                                    {markingAuditId === event.id ? '처리 중...' : 'Mark Read'}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {alertTuningAudit.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                        아직 기록된 approval audit event가 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Alert Rollout Performance</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                source override가 적용된 실험군과 control 그룹의 unread, snooze, 읽음 지연을 비교합니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Tracked rollouts: <span className="font-semibold text-slate-200">{alertRollout.length}</span></div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {alertRollout.map((entry) => (
                            <div key={`alert_rollout_${entry.source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{entry.source}</p>
                                        <p className="mt-2 text-xs text-slate-400">rollout {entry.rolloutPercentage}%</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                        <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
                                            experiment {entry.experiment.users} users
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300">
                                            control {entry.control.users} users
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">Experiment</p>
                                        <div className="mt-3 space-y-2 text-sm text-slate-200">
                                            <div>alerts {entry.experiment.alerts} · unread {entry.experiment.unreadRate}%</div>
                                            <div>targets {entry.experiment.activeTargets} · snoozed {entry.experiment.snoozedTargetRate}%</div>
                                            <div>read latency {entry.experiment.avgReadLatencyMinutes}m</div>
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">Control</p>
                                        <div className="mt-3 space-y-2 text-sm text-slate-200">
                                            <div>alerts {entry.control.alerts} · unread {entry.control.unreadRate}%</div>
                                            <div>targets {entry.control.activeTargets} · snoozed {entry.control.snoozedTargetRate}%</div>
                                            <div>read latency {entry.control.avgReadLatencyMinutes}m</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-2xl bg-slate-950/70 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Unread Delta</p>
                                        <p className={`mt-2 text-lg font-black ${rolloutDeltaClass(entry.delta.unreadRate, 'lower_better')}`}>
                                            {entry.delta.unreadRate > 0 ? '+' : ''}{entry.delta.unreadRate}%
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">experiment - control</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-950/70 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Snooze Delta</p>
                                        <p className={`mt-2 text-lg font-black ${rolloutDeltaClass(entry.delta.snoozedTargetRate, 'lower_better')}`}>
                                            {entry.delta.snoozedTargetRate > 0 ? '+' : ''}{entry.delta.snoozedTargetRate}%
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">experiment - control</p>
                                    </div>
                                    <div className="rounded-2xl bg-slate-950/70 p-4">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Latency Delta</p>
                                        <p className={`mt-2 text-lg font-black ${rolloutDeltaClass(entry.delta.avgReadLatencyMinutes, 'lower_better')}`}>
                                            {entry.delta.avgReadLatencyMinutes > 0 ? '+' : ''}{entry.delta.avgReadLatencyMinutes}m
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">experiment - control</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {alertRollout.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                비교 가능한 rollout source가 없습니다. source override와 rollout 비율이 저장되면 여기에 실험군/대조군 비교가 표시됩니다.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Alert Rollout Trends</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                source별로 최근 7일 동안 experiment/control unread와 읽음 지연 추이를 봅니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Trend sources: <span className="font-semibold text-slate-200">{alertRolloutTrends.length}</span></div>
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 xl:grid-cols-2">
                        {alertRolloutTrends.map((entry) => (
                            <div key={`alert_rollout_trend_${entry.source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{entry.source}</p>
                                        <p className="mt-2 text-xs text-slate-400">rollout {entry.rolloutPercentage}% · last {entry.points.length} days</p>
                                    </div>
                                </div>

                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full text-left text-xs text-slate-300">
                                        <thead className="text-slate-500">
                                            <tr>
                                                <th className="pb-2 pr-4 font-semibold">Day</th>
                                                <th className="pb-2 pr-4 font-semibold">Exp</th>
                                                <th className="pb-2 pr-4 font-semibold">Ctrl</th>
                                                <th className="pb-2 pr-4 font-semibold">Unread Δ</th>
                                                <th className="pb-2 font-semibold">Latency Δ</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {entry.points.map((point) => {
                                                const unreadDelta = Math.round((point.experimentUnreadRate - point.controlUnreadRate) * 10) / 10;
                                                const latencyDelta = point.experimentAvgReadLatencyMinutes - point.controlAvgReadLatencyMinutes;
                                                return (
                                                    <tr key={`${entry.source}_${point.day}`} className="border-t border-slate-800/80 align-top">
                                                        <td className="py-2 pr-4 font-semibold text-slate-200">{point.day.slice(5)}</td>
                                                        <td className="py-2 pr-4">
                                                            <div>{point.experimentAlerts} alerts</div>
                                                            <div className="text-[11px] text-slate-500">unread {point.experimentUnreadRate}% · {point.experimentAvgReadLatencyMinutes}m</div>
                                                        </td>
                                                        <td className="py-2 pr-4">
                                                            <div>{point.controlAlerts} alerts</div>
                                                            <div className="text-[11px] text-slate-500">unread {point.controlUnreadRate}% · {point.controlAvgReadLatencyMinutes}m</div>
                                                        </td>
                                                        <td className={`py-2 pr-4 font-bold ${rolloutDeltaClass(unreadDelta, 'lower_better')}`}>
                                                            {unreadDelta > 0 ? '+' : ''}{unreadDelta}%
                                                        </td>
                                                        <td className={`py-2 font-bold ${rolloutDeltaClass(latencyDelta, 'lower_better')}`}>
                                                            {latencyDelta > 0 ? '+' : ''}{latencyDelta}m
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ))}
                        {alertRolloutTrends.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                rollout trend를 계산할 최근 alert 이벤트가 아직 충분하지 않습니다.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Alert Tuning Settings</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                persona별 기본 스누즈, 목표가 할인율, 우선순위별 재확인 시간을 직접 조정합니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Storage: <span className="font-semibold text-slate-200">{alertTuning?.storage || 'default'}</span></div>
                            <div className="mt-1">Updated: <span className="font-semibold text-slate-200">{formatTime(alertTuning?.updatedAt)}</span></div>
                            {alertTuning?.updatedBy && (
                                <div className="mt-1">By: <span className="font-semibold text-slate-200">{alertTuning.updatedBy}</span></div>
                            )}
                        </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-3">
                        {(['instant', 'balanced', 'batch'] as AlertBehaviorMode[]).map((mode) => {
                            const modeSettings = draftTuning.modes[mode];
                            return (
                                <div key={`alert_tuning_${mode}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{alertPersonaModeLabel(mode)}</p>
                                            <p className="mt-2 text-xs text-slate-400">{mode.toUpperCase()} preset</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPersonaModeClass(mode)}`}>
                                            {mode.toUpperCase()}
                                        </span>
                                    </div>

                                    <div className="mt-4 grid gap-3">
                                        <label className="text-xs text-slate-400">
                                            기본 스누즈 시간
                                            <input
                                                type="number"
                                                min={1}
                                                value={modeSettings.defaultSnoozeHours}
                                                onChange={(event) => updateAlertTuningMode(mode, 'defaultSnoozeHours', Math.max(1, Number(event.target.value) || 0))}
                                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                            />
                                        </label>
                                        <label className="text-xs text-slate-400">
                                            추천 목표가 할인율 (%)
                                            <input
                                                type="number"
                                                min={1}
                                                max={50}
                                                step={0.5}
                                                value={modeSettings.targetDiscountRate}
                                                onChange={(event) => updateAlertTuningMode(mode, 'targetDiscountRate', Math.max(1, Number(event.target.value) || 0))}
                                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                            />
                                        </label>
                                        <div className="grid gap-3 sm:grid-cols-3">
                                            {(['critical', 'high', 'medium'] as AlertRecentEvent['priority'][]).map((priority) => (
                                                <label key={`${mode}_${priority}`} className="text-xs text-slate-400">
                                                    {alertPriorityLabel(priority)}
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={modeSettings.recommendedByPriority[priority]}
                                                        onChange={(event) => updateAlertTuningMode(mode, priority, Math.max(1, Number(event.target.value) || 0))}
                                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                                    />
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <h3 className="text-sm font-bold text-white">Source Override Settings</h3>
                                <p className="mt-2 text-xs text-slate-400">
                                    source별로 기본 스누즈와 할인율을 따로 조정하고, rollout 비율로 일부 사용자군에만 적용할 수 있습니다.
                                </p>
                            </div>
                            {currentOverrideSource && currentSourceOverride && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveSourceOverride(currentOverrideSource)}
                                    className="rounded-full border border-rose-700/40 px-4 py-2 text-xs font-bold text-rose-200"
                                >
                                    {currentOverrideSource} override 제거
                                </button>
                            )}
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                            {availableOverrideSources.map((source) => (
                                <button
                                    key={`override_source_${source}`}
                                    type="button"
                                    onClick={() => setSelectedOverrideSource(source)}
                                    className={`rounded-full px-4 py-2 text-xs font-bold ${
                                        currentOverrideSource === source
                                            ? 'bg-slate-100 text-slate-950'
                                            : 'border border-slate-700 text-slate-300'
                                    }`}
                                >
                                    {source}
                                    {draftTuning.sourceOverrides?.[source] ? ' · override' : ''}
                                    {draftTuning.sourceOverrides?.[source] ? ` · ${draftTuning.sourceRollouts?.[source] ?? 100}%` : ''}
                                </button>
                            ))}
                            {availableOverrideSources.length === 0 && (
                                <div className="text-xs text-slate-500">override 가능한 source 데이터가 없습니다.</div>
                            )}
                        </div>

                        {currentOverrideSource && (
                            <div className="mt-4 space-y-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{currentOverrideSource} rollout</p>
                                            <p className="mt-2 text-xs text-slate-400">
                                                선택한 source override를 전체 사용자 중 몇 %에 적용할지 설정합니다. 100이면 전체 적용, 0이면 control 그룹 유지입니다.
                                            </p>
                                        </div>
                                        <label className="text-xs text-slate-400">
                                            Rollout (%)
                                            <input
                                                type="number"
                                                min={0}
                                                max={100}
                                                step={5}
                                                value={currentSourceRollout}
                                                onChange={(event) => updateSourceRolloutPercentage(currentOverrideSource, Number(event.target.value) || 0)}
                                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400 md:w-40"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div className="grid gap-4 lg:grid-cols-3">
                                {(['instant', 'balanced', 'batch'] as AlertBehaviorMode[]).map((mode) => {
                                    const sourceMode = currentSourceOverride?.[mode];
                                    const effectiveMode = {
                                        defaultSnoozeHours: sourceMode?.defaultSnoozeHours ?? draftTuning.modes[mode].defaultSnoozeHours,
                                        targetDiscountRate: sourceMode?.targetDiscountRate ?? draftTuning.modes[mode].targetDiscountRate,
                                        recommendedByPriority: {
                                            ...draftTuning.modes[mode].recommendedByPriority,
                                            ...(sourceMode?.recommendedByPriority || {}),
                                        },
                                    };

                                    return (
                                        <div key={`override_${currentOverrideSource}_${mode}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{currentOverrideSource} · {alertPersonaModeLabel(mode)}</p>
                                                    <p className="mt-2 text-xs text-slate-400">
                                                        {sourceMode ? 'custom override' : 'using global default'}
                                                    </p>
                                                </div>
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPersonaModeClass(mode)}`}>
                                                    {mode.toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="mt-4 grid gap-3">
                                                <label className="text-xs text-slate-400">
                                                    기본 스누즈 시간
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={effectiveMode.defaultSnoozeHours}
                                                        onChange={(event) => updateSourceAlertTuningMode(currentOverrideSource, mode, 'defaultSnoozeHours', Math.max(1, Number(event.target.value) || 0))}
                                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                                    />
                                                </label>
                                                <label className="text-xs text-slate-400">
                                                    추천 목표가 할인율 (%)
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        max={50}
                                                        step={0.5}
                                                        value={effectiveMode.targetDiscountRate}
                                                        onChange={(event) => updateSourceAlertTuningMode(currentOverrideSource, mode, 'targetDiscountRate', Math.max(1, Number(event.target.value) || 0))}
                                                        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                                    />
                                                </label>
                                                <div className="grid gap-3 sm:grid-cols-3">
                                                    {(['critical', 'high', 'medium'] as AlertRecentEvent['priority'][]).map((priority) => (
                                                        <label key={`${currentOverrideSource}_${mode}_${priority}`} className="text-xs text-slate-400">
                                                            {alertPriorityLabel(priority)}
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                value={effectiveMode.recommendedByPriority[priority]}
                                                                onChange={(event) => updateSourceAlertTuningMode(currentOverrideSource, mode, priority, Math.max(1, Number(event.target.value) || 0))}
                                                                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-2 text-sm font-semibold text-slate-100 outline-none focus:border-sky-400"
                                                            />
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => void handleSaveAlertTuning()}
                            disabled={isSavingTuning || Boolean(rollbackingHistoryId) || !isTuningDirty}
                            className="rounded-full bg-slate-100 px-5 py-3 text-sm font-bold text-slate-950 disabled:opacity-40"
                        >
                            {isSavingTuning ? '저장 중...' : '설정 저장'}
                        </button>
                        <button
                            type="button"
                            onClick={handleResetAlertTuning}
                            disabled={isSavingTuning || Boolean(rollbackingHistoryId)}
                            className="rounded-full border border-slate-700 px-5 py-3 text-sm font-bold text-slate-300 disabled:opacity-40"
                        >
                            기본값으로 되돌리기
                        </button>
                        {tuningMessage && (
                            <p className={`text-sm ${tuningMessage.includes('실패') ? 'text-rose-300' : 'text-emerald-300'}`}>
                                {tuningMessage}
                            </p>
                        )}
                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
                        <h3 className="text-sm font-bold text-white">Recent Tuning Changes</h3>
                        <div className="mt-4 space-y-3">
                            {(alertTuning?.history || []).map((entry) => (
                                <div key={`tuning_history_${entry.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.updatedAt)}</p>
                                            <p className="mt-2 text-sm font-semibold text-white">{entry.summary}</p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {entry.updatedBy || 'system'}
                                            </span>
                                            {entry.restorable ? (
                                                <button
                                                    type="button"
                                                    onClick={() => void handleRollbackAlertTuning(entry.id)}
                                                    disabled={isSavingTuning || Boolean(rollbackingHistoryId)}
                                                    className="rounded-full border border-emerald-700/40 px-3 py-1 text-[11px] font-bold text-emerald-200 disabled:opacity-40"
                                                >
                                                    {rollbackingHistoryId === entry.id ? '복원 중...' : '이 버전으로 복원'}
                                                </button>
                                            ) : (
                                                <span className="rounded-full border border-slate-800 px-3 py-1 text-[10px] font-bold text-slate-500">
                                                    snapshot 없음
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {(alertTuning?.history || []).length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                    저장된 설정 변경 이력이 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-white">Recommended Alert Tuning</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                unread, 읽음 지연, 스누즈 비중을 기준으로 source별 권장 조치를 계산합니다.
                            </p>
                        </div>
                        {selectedAlertSuggestion && (
                            <span className={`inline-flex rounded-full px-3 py-2 text-xs font-bold ${tuningSeverityClass(selectedAlertSuggestion.severity)}`}>
                                {selectedAlertSuggestion.source} · {selectedAlertSuggestion.severity.toUpperCase()}
                            </span>
                        )}
                    </div>

                    <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        {alertSuggestions.slice(0, 6).map((suggestion) => (
                            <div key={`tuning_${suggestion.source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{suggestion.source}</p>
                                        <p className="mt-2 text-sm text-slate-200">{suggestion.title}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${tuningSeverityClass(suggestion.severity)}`}>
                                        {suggestion.severity.toUpperCase()}
                                    </span>
                                </div>
                                <p className="mt-3 text-xs leading-6 text-slate-400">{suggestion.description}</p>
                                {suggestion.recommendedSnoozeHours && (
                                    <div className="mt-3 text-xs text-sky-200">
                                        권장 기본 스누즈: {suggestion.recommendedSnoozeHours >= 24
                                            ? `${Math.round(suggestion.recommendedSnoozeHours / 24)}d`
                                            : `${suggestion.recommendedSnoozeHours}h`}
                                    </div>
                                )}
                            </div>
                        ))}
                        {alertSuggestions.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                권장 조치를 계산할 alert tuning 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">Alert Ops Summary</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    소스별 알림 발생 수, 우선순위 분포, 스누즈 상태를 함께 봅니다.
                                </p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <div>Last alert update</div>
                                <div className="mt-1 font-semibold text-slate-200">{formatTime(alertSummary?.lastUpdatedAt)}</div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {(alertSummary?.sources || []).map((entry) => {
                                const isSelected = selectedAlertSummary?.source === entry.source;

                                return (
                                    <button
                                        key={`alert_${entry.source}`}
                                        type="button"
                                        onClick={() => setSelectedSource(entry.source)}
                                        className={`w-full rounded-2xl border p-4 text-left transition-colors ${isSelected ? 'border-sky-500/40 bg-slate-900/90' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{entry.source}</p>
                                                <p className="mt-2 text-xs text-slate-400">
                                                    alerts {entry.alerts} · unread {entry.unreadCount} · archived {entry.archivedCount}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                snoozed {entry.snoozedTargets}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                critical <span className="font-semibold text-rose-200">{entry.criticalPriorityCount}</span>
                                            </div>
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                high <span className="font-semibold text-amber-200">{entry.highPriorityCount}</span>
                                            </div>
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                targets <span className="font-semibold text-sky-200">{entry.activeTargets}</span>
                                            </div>
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                read <span className="font-semibold text-violet-200">{entry.avgReadLatencyMinutes}m</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 text-[11px] text-slate-500">
                                            last seen {formatTime(entry.lastSeenAt)}
                                        </div>
                                    </button>
                                );
                            })}
                            {(alertSummary?.sources || []).length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 알림 운영 데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Recent Alert Events</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            {selectedAlertSummary
                                ? `${selectedAlertSummary.source} 기준 recent alert 흐름입니다.`
                                : '최근 가격 알림 이벤트입니다.'}
                        </p>
                        <div className="mt-4 space-y-3">
                            {selectedAlertEvents.slice(0, 10).map((entry) => (
                                <div key={`${entry.id}_${entry.generatedAt}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{entry.title}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPriorityClass(entry.priority)}`}>
                                                {alertPriorityLabel(entry.priority)}
                                            </span>
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.read ? 'bg-slate-700/60 text-slate-200' : 'bg-amber-500/15 text-amber-200'}`}>
                                                {entry.read ? 'read' : 'unread'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                        <span className="rounded-full border border-slate-800 px-2 py-1">{entry.source}</span>
                                        {entry.mallName && <span className="rounded-full border border-slate-800 px-2 py-1">{entry.mallName}</span>}
                                        {entry.variantLabel && <span className="rounded-full border border-slate-800 px-2 py-1">{entry.variantLabel}</span>}
                                        {entry.archived && <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-200">archived</span>}
                                    </div>
                                    <div className="mt-3 text-xs text-slate-400">
                                        {typeof entry.currentPrice === 'number' && <div>current: <span className="text-slate-200">{entry.currentPrice.toLocaleString()}원</span></div>}
                                        {typeof entry.targetPrice === 'number' && <div>target: <span className="text-slate-200">{entry.targetPrice.toLocaleString()}원</span></div>}
                                        {entry.productId && <div>product: <span className="text-slate-200">{entry.productId}</span></div>}
                                    </div>
                                </div>
                            ))}
                            {selectedAlertEvents.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 알림 이벤트가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Alert Source Drill-down</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            {selectedAlertDrilldown
                                ? `${selectedAlertDrilldown.source} 알림 품질과 대응 우선순위를 바로 확인합니다.`
                                : '선택한 source의 alert drill-down 데이터가 없습니다.'}
                        </p>

                        {selectedAlertDrilldown ? (
                            <>
                                {selectedAlertSuggestion && (
                                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recommended Action</p>
                                                <p className="mt-2 text-sm font-semibold text-white">{selectedAlertSuggestion.title}</p>
                                            </div>
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${tuningSeverityClass(selectedAlertSuggestion.severity)}`}>
                                                {selectedAlertSuggestion.severity.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-xs leading-6 text-slate-400">{selectedAlertSuggestion.description}</p>
                                    </div>
                                )}

                                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Unread Rate</p>
                                        <p className="mt-2 text-3xl font-black text-amber-300">{selectedAlertDrilldown.unreadRate}%</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Archived Rate</p>
                                        <p className="mt-2 text-3xl font-black text-sky-300">{selectedAlertDrilldown.archivedRate}%</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Snooze Share</p>
                                        <p className="mt-2 text-3xl font-black text-violet-300">
                                            {selectedAlertDrilldown.activeTargets > 0
                                                ? Math.round((selectedAlertDrilldown.snoozedTargets / selectedAlertDrilldown.activeTargets) * 1000) / 10
                                                : 0}%
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Read Latency</p>
                                        <p className="mt-2 text-3xl font-black text-emerald-300">{selectedAlertDrilldown.avgReadLatencyMinutes}m</p>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <h3 className="text-sm font-bold text-white">Top Malls</h3>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedAlertDrilldown.topMalls.map((entry) => (
                                                <span key={`${selectedAlertDrilldown.source}_${entry.name}`} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200">
                                                    {entry.name} · {entry.count}
                                                </span>
                                            ))}
                                            {selectedAlertDrilldown.topMalls.length === 0 && (
                                                <span className="text-sm text-slate-500">mall 샘플이 없습니다.</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <h3 className="text-sm font-bold text-white">Top Variants</h3>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {selectedAlertDrilldown.topVariants.map((entry) => (
                                                <span key={`${selectedAlertDrilldown.source}_${entry.label}`} className="rounded-full border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200">
                                                    {entry.label} · {entry.count}
                                                </span>
                                            ))}
                                            {selectedAlertDrilldown.topVariants.length === 0 && (
                                                <span className="text-sm text-slate-500">variant 샘플이 없습니다.</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                drill-down 데이터가 없습니다.
                            </div>
                        )}
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Alert Tuning Queue</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            최근 critical alert와 unread backlog를 같이 봅니다.
                        </p>

                        <div className="mt-4 grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h3 className="text-sm font-bold text-white">Critical Alerts</h3>
                                <div className="mt-3 space-y-3">
                                    {(selectedAlertDrilldown?.recentCritical || []).map((entry) => (
                                        <div key={`critical_${entry.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold text-white">{entry.title}</p>
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPriorityClass(entry.priority)}`}>
                                                    {alertPriorityLabel(entry.priority)}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-400">
                                                <div>{formatTime(entry.generatedAt)}</div>
                                                {entry.mallName && <div>mall: <span className="text-slate-200">{entry.mallName}</span></div>}
                                                {typeof entry.currentPrice === 'number' && typeof entry.targetPrice === 'number' && (
                                                    <div>gap: <span className="text-rose-200">{(entry.currentPrice - entry.targetPrice).toLocaleString()}원</span></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {(selectedAlertDrilldown?.recentCritical || []).length === 0 && (
                                        <div className="text-sm text-slate-500">최근 critical alert가 없습니다.</div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h3 className="text-sm font-bold text-white">Unread Backlog</h3>
                                <div className="mt-3 space-y-3">
                                    {(selectedAlertDrilldown?.recentUnread || []).map((entry) => (
                                        <div key={`unread_${entry.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold text-white">{entry.title}</p>
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${alertPriorityClass(entry.priority)}`}>
                                                    {alertPriorityLabel(entry.priority)}
                                                </span>
                                            </div>
                                            <div className="mt-2 text-xs text-slate-400">
                                                <div>{formatTime(entry.generatedAt)}</div>
                                                {entry.variantLabel && <div>variant: <span className="text-slate-200">{entry.variantLabel}</span></div>}
                                                {entry.mallName && <div>mall: <span className="text-slate-200">{entry.mallName}</span></div>}
                                            </div>
                                        </div>
                                    ))}
                                    {(selectedAlertDrilldown?.recentUnread || []).length === 0 && (
                                        <div className="text-sm text-slate-500">현재 unread backlog가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {!isOpsOnly && (
                    <>
                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Queue</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        low-fit 또는 0건 검색어를 저장하고, AI 제안 후 승인된 검색어를 다음 검색부터 확장어로 사용합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearning?.summary.total ?? 0}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                                        pending {searchLearning?.summary.pending ?? 0}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                                        approved {searchLearning?.summary.approved ?? 0}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200">
                                        zero-result {searchLearning?.summary.zeroResult ?? 0}
                                    </span>
                                </div>
                            </div>
                            {searchLearningMessage && (
                                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                                    {searchLearningMessage}
                                </div>
                            )}
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningEntries.slice(0, 8).map((entry) => (
                                    <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.lastSeenAt)}</p>
                                                <p className="mt-1 text-sm font-semibold text-white">{entry.query}</p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    normalized {entry.normalizedQuery || '-'} · fit {entry.lastResultQuality || '-'} · products {entry.lastTotalProducts}
                                                </p>
                                            </div>
                                            <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${searchLearningStatusClass(entry.status)}`}>
                                                {searchLearningStatusLabel(entry.status)}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                                            <span className="rounded-full border border-slate-800 px-2 py-1">occurrence {entry.occurrenceCount}</span>
                                            <span className="rounded-full border border-slate-800 px-2 py-1">low-fit {entry.lowFitCount}</span>
                                            <span className="rounded-full border border-slate-800 px-2 py-1">zero {entry.zeroResultCount}</span>
                                        </div>
                                        {entry.aiSuggestion && (
                                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                                                        AI Suggestion · {entry.aiSuggestion.model}
                                                    </p>
                                                    {entry.aiSuggestion.categoryHint && (
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                                                            {entry.aiSuggestion.categoryHint}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-xs leading-6 text-slate-400">{entry.aiSuggestion.rationale}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {entry.aiSuggestion.suggestedQueries.map((query) => (
                                                        <span key={`${entry.id}_${query}`} className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {entry.approvedQueries.length > 0 && (
                                            <div className="mt-4">
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Approved Queries</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {entry.approvedQueries.map((query) => (
                                                        <span key={`${entry.id}_approved_${query}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => handleGenerateSearchLearningSuggestion(entry.id)}
                                                disabled={processingSearchLearningId === entry.id}
                                                className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {processingSearchLearningId === entry.id ? '생성 중...' : 'AI 제안 생성'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReviewSearchLearningEntry(entry, 'approve')}
                                                disabled={processingSearchLearningId === entry.id}
                                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                승인
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleReviewSearchLearningEntry(entry, 'ignore')}
                                                disabled={processingSearchLearningId === entry.id}
                                                className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                보류
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {searchLearningEntries.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                        아직 저장된 학습 대상 query가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Low-fit Queries</h2>
                        <div className="mt-4 space-y-3">
                            {lowFitQueries.map((entry) => (
                                <div key={`${entry.generatedAt}_${entry.query}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{entry.query}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.quality === 'weak' ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-500/15 text-amber-200'}`}>
                                            {entry.quality}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-xs text-slate-400">totalProducts {entry.totalProducts}</div>
                                    {entry.suggestedQueries.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {entry.suggestedQueries.map((suggestion) => (
                                                <span key={`${entry.generatedAt}_${suggestion}`} className="rounded-full border border-slate-800 px-2 py-1 text-[11px] text-slate-300">
                                                    {suggestion}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {lowFitQueries.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 low-fit query가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Interaction Signals</h2>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Suggested Queries</p>
                                <div className="mt-3 space-y-2">
                                    {(data?.interactionSummary.topSelectedQueries || []).map((entry) => (
                                        <div key={entry.query} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                                            <span>{entry.query}</span>
                                            <span className="font-semibold text-sky-200">{entry.count}</span>
                                        </div>
                                    ))}
                                    {(data?.interactionSummary.topSelectedQueries || []).length === 0 && (
                                        <div className="text-sm text-slate-500">추천 클릭 데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Opened Brands</p>
                                <div className="mt-3 space-y-2">
                                    {(data?.interactionSummary.topOpenedBrands || []).map((entry) => (
                                        <div key={entry.brand} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                                            <span>{entry.brand}</span>
                                            <span className="font-semibold text-violet-200">{entry.count}</span>
                                        </div>
                                    ))}
                                    {(data?.interactionSummary.topOpenedBrands || []).length === 0 && (
                                        <div className="text-sm text-slate-500">상품 열람 데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {recentInteractions.map((entry) => (
                                <div key={`${entry.generatedAt}_${entry.type}_${entry.productId || entry.selectedQuery || entry.query}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{interactionLabel(entry.type)}</p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {entry.context || 'general'}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-xs text-slate-400">
                                        <div>query: <span className="text-slate-200">{entry.query}</span></div>
                                        {entry.selectedQuery && <div>selected: <span className="text-sky-200">{entry.selectedQuery}</span></div>}
                                        {entry.productTitle && <div>product: <span className="text-slate-200">{entry.productTitle}</span></div>}
                                        {entry.brand && <div>brand: <span className="text-slate-200">{entry.brand}</span></div>}
                                        {entry.source && <div>source: <span className="text-slate-200">{entry.source}</span></div>}
                                    </div>
                                </div>
                            ))}
                            {recentInteractions.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 interaction 데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                        </section>

                        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="text-lg font-bold text-white">Source Summary</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Source</th>
                                    <th className="px-5 py-3">Success</th>
                                    <th className="px-5 py-3">Avg Latency</th>
                                    <th className="px-5 py-3">Direct</th>
                                    <th className="px-5 py-3">Fallback</th>
                                    <th className="px-5 py-3">Empty</th>
                                    <th className="px-5 py-3">Last Strategy</th>
                                    <th className="px-5 py-3">Last Seen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(summary?.sources || []).map((entry) => {
                                    const isSelected = selectedSource === entry.source;
                                    return (
                                    <tr
                                        key={entry.source}
                                        className={`border-t border-slate-800 text-slate-200 transition-colors ${isSelected ? 'bg-slate-900/80' : 'hover:bg-slate-900/40'}`}
                                    >
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSource(entry.source)}
                                                className="text-left"
                                            >
                                                <div className="font-semibold text-white">{entry.source}</div>
                                            </button>
                                            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${collectionModeClass(entry.collectionMode)}`}>
                                                {collectionModeLabel(entry.collectionMode)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">{entry.successRate}%</td>
                                        <td className="px-5 py-4">{entry.avgLatencyMs}ms</td>
                                        <td className="px-5 py-4">{entry.directHits}</td>
                                        <td className="px-5 py-4 text-amber-300">{entry.fallbackHits}</td>
                                        <td className="px-5 py-4 text-rose-300">{entry.emptyHits}</td>
                                        <td className="px-5 py-4">
                                            <div>{strategyLabel(entry.lastStrategy)}</div>
                                            {entry.lastFallbackReason && (
                                                <div className="mt-1 text-xs text-slate-500">{entry.lastFallbackReason}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-400">{formatTime(entry.lastSeenAt)}</td>
                                    </tr>
                                )})}
                                {(summary?.sources || []).length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                                            수집된 진단 데이터가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="text-lg font-bold text-white">Source Drill-down</h2>
                    </div>
                    {selectedSummary ? (
                        <div className="p-5">
                            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-black tracking-tight text-white">{selectedSummary.source}</h3>
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.16em] ${collectionModeClass(selectedSummary.collectionMode)}`}>
                                            {collectionModeLabel(selectedSummary.collectionMode)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">
                                        최근 실패 샘플 query, source별 resolved query, fallback reason을 바로 확인할 수 있습니다.
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                        <div>Direct Hits</div>
                                        <div className="mt-1 text-lg font-bold text-emerald-300">{selectedSummary.directHits}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                        <div>Fallback Hits</div>
                                        <div className="mt-1 text-lg font-bold text-amber-300">{selectedSummary.fallbackHits}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                        <div>Empty Hits</div>
                                        <div className="mt-1 text-lg font-bold text-rose-300">{selectedSummary.emptyHits}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <h4 className="text-sm font-bold text-white">Failure / Fallback Samples</h4>
                                    <div className="mt-4 space-y-3">
                                        {drilldown.failureSamples.slice(0, 8).map((sample) => (
                                            <div key={`${sample.generatedAt}_${sample.query}_${sample.strategy}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(sample.generatedAt)}</p>
                                                        <p className="mt-1 text-sm font-semibold text-white">{sample.query}</p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                        {strategyLabel(sample.strategy)}
                                                    </span>
                                                </div>
                                                <div className="mt-3 text-xs text-slate-400">
                                                    <div>finalCount: {sample.finalCount}</div>
                                                    {sample.resolvedQuery && <div>resolved: <span className="text-sky-200">{sample.resolvedQuery}</span></div>}
                                                    {sample.requestedQueries && sample.requestedQueries.length > 1 && (
                                                        <div>candidates: <span className="text-slate-300">{sample.requestedQueries.join(' / ')}</span></div>
                                                    )}
                                                    <div>reason: <span className="text-amber-200">{sample.fallbackReason || 'none'}</span></div>
                                                </div>
                                            </div>
                                        ))}
                                        {drilldown.failureSamples.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                                최근 window에서 failure / fallback 샘플이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <h4 className="text-sm font-bold text-white">Successful Samples</h4>
                                    <div className="mt-4 space-y-3">
                                        {drilldown.successSamples.slice(0, 8).map((sample) => (
                                            <div key={`${sample.generatedAt}_${sample.query}_${sample.strategy}_activity`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(sample.generatedAt)}</p>
                                                        <p className="mt-1 text-sm font-semibold text-white">{sample.query}</p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                        {strategyLabel(sample.strategy)}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                                                    <span className="rounded-full border border-slate-800 px-2 py-1">final {sample.finalCount}</span>
                                                    <span className="rounded-full border border-slate-800 px-2 py-1">total {sample.totalProducts}</span>
                                                    {sample.resolvedQuery && (
                                                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-200">
                                                            resolved {sample.resolvedQuery}
                                                        </span>
                                                    )}
                                                    {sample.fallbackReason && (
                                                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-200">
                                                            {sample.fallbackReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {drilldown.successSamples.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                                최근 성공 샘플이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h4 className="text-sm font-bold text-white">Recent Daily Trend</h4>
                                <div className="mt-4 space-y-3">
                                    {trendPoints.map((point) => (
                                        <div key={`${selectedSummary.source}_${point.day}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{point.day}</p>
                                                    <p className="mt-1 text-sm text-slate-300">{point.samples} samples · {point.totalItems} items</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-white">{point.successRate}%</p>
                                                    <p className="text-[11px] text-slate-500">success rate</p>
                                                </div>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                                                <div
                                                    className="h-full bg-emerald-400"
                                                    style={{ width: `${point.samples > 0 ? (point.directSamples / point.samples) * 100 : 0}%` }}
                                                />
                                                <div
                                                    className="h-full bg-amber-400"
                                                    style={{ width: `${point.samples > 0 ? (point.fallbackSamples / point.samples) * 100 : 0}%`, marginTop: '-0.75rem' }}
                                                />
                                                <div
                                                    className="h-full bg-rose-400"
                                                    style={{ width: `${point.samples > 0 ? (point.emptySamples / point.samples) * 100 : 0}%`, marginTop: '-0.75rem' }}
                                                />
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                                <span className="rounded-full border border-slate-800 px-2 py-1 text-emerald-300">direct {point.directSamples}</span>
                                                <span className="rounded-full border border-slate-800 px-2 py-1 text-amber-300">fallback {point.fallbackSamples}</span>
                                                <span className="rounded-full border border-slate-800 px-2 py-1 text-rose-300">empty {point.emptySamples}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {trendPoints.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                            최근 추이 데이터가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 text-sm text-slate-500">선택된 소스가 없습니다.</div>
                    )}
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="text-lg font-bold text-white">Recent Searches</h2>
                    </div>
                    <div className="grid gap-4 p-5 lg:grid-cols-2">
                        {recentSnapshots.map((snapshot) => (
                            <article key={`${snapshot.generatedAt}_${snapshot.query}_${snapshot.page}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{formatTime(snapshot.generatedAt)}</p>
                                        <h3 className="mt-2 text-lg font-bold text-white">{snapshot.query}</h3>
                                        <p className="mt-1 text-sm text-slate-400">
                                            page {snapshot.page} · {snapshot.sort} · {snapshot.totalProducts} products
                                        </p>
                                        {snapshot.effectiveQuery && snapshot.effectiveQuery !== snapshot.query && (
                                            <p className="mt-1 text-xs text-sky-200">effective {snapshot.effectiveQuery}</p>
                                        )}
                                    </div>
                                    <div className="text-right text-xs text-slate-400">
                                        <div>Direct {snapshot.directSourceCount}</div>
                                        <div>Fallback {snapshot.fallbackSourceCount}</div>
                                        {snapshot.resultQuality && <div>Fit {snapshot.resultQuality}</div>}
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {snapshot.sources
                                        .filter((source) => source.finalCount > 0)
                                        .map((source) => (
                                            <span key={`${snapshot.generatedAt}_${source.source}`} className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
                                                {source.source} · {strategyLabel(source.strategy)} · {source.finalCount}
                                            </span>
                                        ))}
                                </div>
                            </article>
                        ))}
                        {(data?.recent || []).length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-500">
                                최근 검색 진단 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
