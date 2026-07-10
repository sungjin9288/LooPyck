import type { AlertTuningConfig } from '@/lib/favorites/alertPersonalization';
import type {
    SearchLearningActivityEvent,
    SearchLearningEntry,
} from '@/lib/search/queryLearningTypes';
export type {
    SearchLearningActivityEvent,
    SearchLearningEntry,
    SearchLearningSuggestion,
} from '@/lib/search/queryLearningTypes';

export type SourceSummary = {
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
    /** 최근 최대 20회의 0/1 결과(오래된 것 먼저) — lifetime successRate와 별개로 "지금" 상태를 반영 */
    recentOutcomes?: number[];
};

export type RecentSnapshot = {
    query: string;
    effectiveQuery?: string;
    page: number;
    sort: string;
    generatedAt: string;
    queryIntent?: string;
    resultQuality?: 'strong' | 'mixed' | 'weak';
    exactMatchCount?: number;
    strongMatchCount?: number;
    totalGroups?: number;
    comparableGroupCount?: number;
    compareReadyGroupCount?: number;
    spreadCapturedGroupCount?: number;
    capturedPriceSpreadTotal?: number;
    maxCapturedPriceSpread?: number;
    verifiedOptionGroupCount?: number;
    preciseOptionGroupCount?: number;
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

export type RecentInteraction = {
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

export type SourceDrilldownItem = {
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

export type SourceTrendPoint = {
    day: string;
    samples: number;
    successSamples: number;
    directSamples: number;
    fallbackSamples: number;
    emptySamples: number;
    totalItems: number;
    successRate: number;
};

export type PdpSourceSummary = {
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

export type PdpRecentEvent = {
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

export type AlertSourceSummary = {
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

export type AlertSourceDrilldown = {
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

export type AlertRecentEvent = {
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

export type AlertPersonaModeSummary = {
    mode: 'instant' | 'balanced' | 'batch';
    count: number;
    share: number;
    avgDefaultSnoozeHours: number;
    avgUnreadRate: number;
    avgReadLatencyMinutes: number;
};

export type AlertPersonaRecentProfile = {
    userKey: string;
    mode: 'instant' | 'balanced' | 'batch';
    summary: string;
    defaultSnoozeHours: number;
    unreadRate: number;
    snoozeShare: number;
    avgReadLatencyMinutes: number;
    updatedAt: string | null;
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

export type AlertTuningHistoryEntry = {
    id: string;
    updatedAt: string | null;
    updatedBy: string | null;
    summary: string;
    restorable: boolean;
};

export type AlertTuningApprovalRequest = {
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

export type ApprovalQueueSummary = {
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

export type AlertTuningAuditEvent = {
    id: string;
    type:
        | 'request_created'
        | 'approval_recorded'
        | 'second_approval_required'
        | 'request_approved'
        | 'request_rejected'
        | 'request_expired'
        | 'config_saved'
        | 'config_rolled_back'
        | 'sla_digest'
        | 'webhook_dispatched'
        | 'webhook_failed';
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

export type AlertTuningReminderDigestItem = {
    requestId: string;
    source: string;
    title: string;
    status: AlertTuningApprovalRequest['status'];
    createdAt: string | null;
    expiresAt: string | null;
    ageHours: number;
    proposedRolloutPercentage: number;
};

export type AlertTuningReminderDigest = {
    generatedAt: string;
    openCount: number;
    overdueCount: number;
    expiringSoonCount: number;
    expiredCount: number;
    oldestOpenAt: string | null;
    overdueRequests: AlertTuningReminderDigestItem[];
    expiringSoonRequests: AlertTuningReminderDigestItem[];
};

export type AlertTuningAuditInboxSummary = {
    total: number;
    unreadCount: number;
    criticalUnreadCount: number;
    warningUnreadCount: number;
};

export type AlertTuningWebhookConfig = {
    configured: boolean;
    format: 'generic' | 'slack' | 'discord' | null;
    targetLabel: string | null;
};

export type SearchDiagnosticsFetchTelemetry = {
    lastStartedAt: string | null;
    lastCompletedAt: string | null;
    lastSuccessfulAt: string | null;
    lastErrorAt: string | null;
    lastDurationMs: number | null;
    averageDurationMs: number;
    requestCount: number;
    successCount: number;
    failureCount: number;
    consecutiveFailures: number;
    recentErrors: Array<{
        message: string;
        at: string;
    }>;
};

export type SourceHealthEntry = {
    source: string;
    status: 'healthy' | 'degraded' | 'failing' | 'never_direct' | 'no_data' | 'disabled';
    reason: string;
    consecutiveEmptyHits: number;
    lastDirectHitAt?: string;
    /** 최근 표본(최대 20회) 중 성공 비율(0..1). 표본이 없으면 null/undefined — 상태 판정에는 미사용,
     *  lifetime successRate와 달리 되살아난 소스를 즉시 반영하는 정보성 지표 */
    recentWindowRate?: number | null;
};

export type DiagnosticsResponse = {
    summary: {
        trackedSearches: number;
        lastUpdatedAt: string | null;
        sources: SourceSummary[];
    };
    sourceHealth?: SourceHealthEntry[];
    failingSources?: SourceHealthEntry[];
    recent: RecentSnapshot[];
    recentInteractions: RecentInteraction[];
    quality: {
        strong: number;
        mixed: number;
        weak: number;
        lowFitShare: number;
        avgStrongMatches: number;
        avgExactMatches: number;
        compareReadyRatio: number;
        priceSpreadCaptureRate: number;
        optionMatchPrecision: number;
        avgCapturedPriceSpread: number;
        maxCapturedPriceSpread: number;
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
    searchLearningActivity: {
        events: SearchLearningActivityEvent[];
        storage: 'memory' | 'firestore';
    };
    searchQualityCoverage: {
        totalQueries: number;
        globalTargetQueries: number;
        naverCovered: number;
        globalCovered: number;
        fullyCovered: number;
        naverCoverageRate: number;
        globalCoverageRate: number;
        fullCoverageRate: number;
        uncoveredQueries: Array<{
            query: string;
            naverMatched: string[];
            naverMissing: string[];
            globalMatched: string[];
            globalMissing: string[];
        }>;
        clusters: Array<{
            clusterId: string;
            clusterLabel: string;
            totalQueries: number;
            globalTargetQueries: number;
            naverCovered: number;
            globalCovered: number;
            fullyCovered: number;
            naverCoverageRate: number;
            globalCoverageRate: number;
            fullCoverageRate: number;
            uncoveredQueries: Array<{
                query: string;
                naverMatched: string[];
                naverMissing: string[];
                globalMatched: string[];
                globalMissing: string[];
            }>;
        }>;
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

export type SearchDiagnosticsDashboardProps = {
    scope?: 'full' | 'ops';
};
