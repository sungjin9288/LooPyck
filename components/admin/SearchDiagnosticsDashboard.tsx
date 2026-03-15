'use client';

import { useEffect, useRef, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { DEFAULT_ALERT_TUNING_CONFIG, type AlertBehaviorMode, type AlertTuningConfig } from '@/lib/favorites/alertPersonalization';
import { buildAlertRolloutRecommendations, buildAlertTuningSuggestions } from '@/lib/favorites/alertRecommendations';
import {
    buildSearchLearningImpact,
    buildSearchLearningImpactClusterRollup,
    buildSearchLearningImpactClusterSummaries,
    buildSearchLearningImpactSummary,
} from '@/lib/search/searchLearningImpact';
import { buildSearchLearningRewritePacks } from '@/lib/search/searchLearningRewritePacks';
import {
    buildSearchLearningRewriteRecommendationSummary,
    buildSearchLearningRewriteRecommendations,
} from '@/lib/search/searchLearningRewriteRecommendations';
import {
    buildSearchLearningRewriteSourceDrafts,
    buildSearchLearningRewriteSourceDraftSummary,
} from '@/lib/search/searchLearningRewriteSourceDrafts';
import {
    buildSearchLearningRewriteSourceOps,
    buildSearchLearningRewriteSourceOpsSummary,
} from '@/lib/search/searchLearningRewriteSourceOps';
import {
    buildSearchLearningRewriteSourceActionDrafts,
    buildSearchLearningRewriteSourceActionDraftSummary,
} from '@/lib/search/searchLearningRewriteSourceActionDrafts';
import {
    buildSearchLearningRewriteSourceActionReviewQueue,
    buildSearchLearningRewriteSourceActionReviewSummary,
} from '@/lib/search/searchLearningRewriteSourceActionReview';
import {
    buildSearchLearningRewriteSourceApprovalQueue,
    buildSearchLearningRewriteSourceApprovalQueueSummary,
} from '@/lib/search/searchLearningRewriteSourceApprovalQueue';
import {
    buildSearchLearningRewriteSourceApprovalActivity,
    buildSearchLearningRewriteSourceApprovalActivitySummary,
} from '@/lib/search/searchLearningRewriteSourceApprovalActivity';
import { buildSearchLearningActivitySummary } from '@/lib/search/searchLearningActivitySummary';
import { buildSearchLearningActivityRecommendations } from '@/lib/search/searchLearningActivityRecommendations';
import {
    buildSearchLearningActivityOpsQueue,
    type SearchLearningActivityOpsQueueItem,
} from '@/lib/search/searchLearningActivityOpsQueue';
import { buildSearchLearningActivityFollowups } from '@/lib/search/searchLearningActivityFollowups';
import {
    buildSearchLearningOpsCenter,
    type SearchLearningOpsCenterItem,
} from '@/lib/search/searchLearningOpsCenter';
import { buildSearchLearningOpsPlaybooks, type SearchLearningOpsPlaybook } from '@/lib/search/searchLearningOpsPlaybooks';
import { buildSearchLearningOpsPlaybookActivity } from '@/lib/search/searchLearningOpsPlaybookActivity';
import {
    buildSearchLearningOpsPlaybookOutcomes,
    type SearchLearningOpsPlaybookOutcome,
} from '@/lib/search/searchLearningOpsPlaybookOutcomes';
import {
    buildSearchLearningOpsPlaybookRecommendations,
    type SearchLearningOpsPlaybookRecommendation,
} from '@/lib/search/searchLearningOpsPlaybookRecommendations';
import { buildSearchLearningOpsPlaybookRecommendationQueue } from '@/lib/search/searchLearningOpsPlaybookRecommendationQueue';
import { buildSearchLearningOpsPlaybookRecommendationActivity } from '@/lib/search/searchLearningOpsPlaybookRecommendationActivity';
import {
    buildSearchLearningOpsPlaybookRecommendationOutcomes,
    type SearchLearningOpsPlaybookRecommendationOutcome,
} from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomes';
import {
    buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations,
    type SearchLearningOpsPlaybookRecommendationOutcomeRecommendation,
} from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendations';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue } from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity } from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes } from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes';
import {
    buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
    type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation,
} from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue } from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity } from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity';
import { buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes } from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes';
import {
    buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
} from '@/lib/search/searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations';
import { buildSearchLearningOpsCompletionSummary } from '@/lib/search/searchLearningOpsCompletionSummary';
import {
    buildSearchLearningOpsCompletionActions,
    type SearchLearningOpsCompletionAction,
} from '@/lib/search/searchLearningOpsCompletionActions';
import { buildSearchLearningOpsCompletionActivity } from '@/lib/search/searchLearningOpsCompletionActivity';
import { buildSearchLearningOpsCompletionOutcomes } from '@/lib/search/searchLearningOpsCompletionOutcomes';
import {
    buildSearchLearningOpsCompletionRecommendations,
    type SearchLearningOpsCompletionRecommendation,
} from '@/lib/search/searchLearningOpsCompletionRecommendations';
import {
    buildSearchLearningOpsCompletionRecommendationQueue,
    type SearchLearningOpsCompletionRecommendationQueueItem,
} from '@/lib/search/searchLearningOpsCompletionRecommendationQueue';
import { buildSearchLearningOpsCompletionRecommendationActivity } from '@/lib/search/searchLearningOpsCompletionRecommendationActivity';
import { buildSearchLearningOpsCompletionRecommendationOutcomes } from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomes';
import {
    buildSearchLearningOpsCompletionRecommendationOutcomeRecommendations,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendation,
} from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendations';
import {
    buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueue,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem,
} from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationActivity } from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes } from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes';
import {
    buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation,
} from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations';
import {
    buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem,
} from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity } from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes } from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes';
import {
    buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
} from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations';
import {
    buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem,
} from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity } from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity';
import { buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes } from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes';
import {
    buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation,
} from '@/lib/search/searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations';
import {
    buildSearchLearningOpsCompletionQueue,
    type SearchLearningOpsCompletionQueueItem,
} from '@/lib/search/searchLearningOpsCompletionQueue';
import {
    buildSearchLearningTerminalWorkflow,
    type SearchLearningTerminalWorkflowAction,
} from '@/lib/search/searchLearningTerminalWorkflow';
import { buildSearchLearningTerminalAlerts } from '@/lib/search/searchLearningTerminalAlerts';
import { buildSearchLearningTerminalHealth } from '@/lib/search/searchLearningTerminalHealth';
import { buildSearchLearningTerminalChecklist } from '@/lib/search/searchLearningTerminalChecklist';
import { buildSearchLearningTerminalRunbook } from '@/lib/search/searchLearningTerminalRunbook';
import { buildSearchLearningTerminalMetrics } from '@/lib/search/searchLearningTerminalMetrics';
import { buildSearchLearningTerminalTrends } from '@/lib/search/searchLearningTerminalTrends';
import { buildSearchLearningTerminalWatchlist } from '@/lib/search/searchLearningTerminalWatchlist';
import { buildSearchLearningTerminalCoverage } from '@/lib/search/searchLearningTerminalCoverage';
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
    approvalBaseline: {
        approvedAt: string;
        occurrenceCount: number;
        lowFitCount: number;
        zeroResultCount: number;
    } | null;
    lastSeenAt: string;
    reviewedAt: string | null;
    reviewedBy: string | null;
    createdAt: string | null;
    updatedAt: string | null;
};

type SearchLearningActivityEvent = {
    id: string;
    type: 'seed_queries' | 'generate_suggestions' | 'review_entries';
    context: string | null;
    reviewedStatus: 'pending' | 'approved' | 'ignored' | null;
    actorUid: string | null;
    count: number;
    entryIds: string[];
    queries: string[];
    createdAt: string;
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

function summarizeSearchLearningEntries(entries: SearchLearningEntry[]): DiagnosticsResponse['searchLearning']['summary'] {
    return {
        total: entries.length,
        pending: entries.filter((entry) => entry.status === 'pending').length,
        approved: entries.filter((entry) => entry.status === 'approved').length,
        ignored: entries.filter((entry) => entry.status === 'ignored').length,
        zeroResult: entries.filter((entry) => entry.zeroResultCount > 0).length,
    };
}

function searchLearningActivityLabel(event: SearchLearningActivityEvent): string {
    switch (event.type) {
        case 'seed_queries':
            return '큐 추가';
        case 'generate_suggestions':
            return 'AI 제안 생성';
        case 'review_entries':
            return event.reviewedStatus === 'approved' ? '승인' : '보류';
        default:
            return '활동';
    }
}

function searchLearningActivityClass(event: SearchLearningActivityEvent): string {
    switch (event.type) {
        case 'seed_queries':
            return 'bg-amber-500/15 text-amber-200';
        case 'generate_suggestions':
            return 'bg-cyan-500/15 text-cyan-200';
        case 'review_entries':
            return event.reviewedStatus === 'approved'
                ? 'bg-emerald-500/15 text-emerald-200'
                : 'bg-slate-700/60 text-slate-200';
        default:
            return 'bg-slate-700/60 text-slate-200';
    }
}

function mergeSearchLearningEntries(
    currentEntries: SearchLearningEntry[],
    updatedEntries: SearchLearningEntry[]
): SearchLearningEntry[] {
    const updatedMap = new Map(updatedEntries.map((entry) => [entry.id, entry]));
    const merged = currentEntries.map((entry) => updatedMap.get(entry.id) || entry);
    const existingIds = new Set(currentEntries.map((entry) => entry.id));

    updatedEntries.forEach((entry) => {
        if (!existingIds.has(entry.id)) {
            merged.unshift(entry);
        }
    });

    return merged.sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
}

function mergeSearchLearningActivityEvents(
    currentEvents: SearchLearningActivityEvent[],
    incomingEvents: SearchLearningActivityEvent[]
): SearchLearningActivityEvent[] {
    const next = [...incomingEvents, ...currentEvents];
    const seen = new Set<string>();
    return next.filter((event) => {
        if (seen.has(event.id)) {
            return false;
        }
        seen.add(event.id);
        return true;
    }).sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 20);
}

function formatPercent(value: number | null): string {
    if (value === null || Number.isNaN(value)) {
        return '-';
    }

    return `${Math.round(value * 100)}%`;
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
    const [selectedSearchLearningIds, setSelectedSearchLearningIds] = useState<string[]>([]);
    const [showAdvancedSearchLearningChain, setShowAdvancedSearchLearningChain] = useState(false);
    const [showAdvancedPlaybookChain, setShowAdvancedPlaybookChain] = useState(false);
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
    const searchLearningActivity = data?.searchLearningActivity?.events || [];
    const searchLearningActivitySummary = buildSearchLearningActivitySummary(searchLearningActivity);
    const searchLearningActivityRecommendations = buildSearchLearningActivityRecommendations(
        searchLearningActivity,
        searchLearningEntries
    );
    const searchLearningActivityOpsQueue = buildSearchLearningActivityOpsQueue(
        searchLearningActivity,
        searchLearningEntries
    );
    const searchLearningActivityFollowups = buildSearchLearningActivityFollowups(
        searchLearningActivity,
        searchLearningEntries
    );
    const searchLearningOpsCenter = buildSearchLearningOpsCenter(
        searchLearningActivityRecommendations,
        searchLearningActivityOpsQueue,
        searchLearningActivityFollowups
    );
    const searchLearningOpsPlaybooks = buildSearchLearningOpsPlaybooks(searchLearningOpsCenter);
    const searchLearningOpsPlaybookActivity = buildSearchLearningOpsPlaybookActivity(searchLearningActivity);
    const searchLearningOpsPlaybookOutcomes = buildSearchLearningOpsPlaybookOutcomes(
        searchLearningOpsPlaybookActivity.recentRuns,
        searchLearningEntries
    );
    const searchLearningOpsPlaybookRecommendations = buildSearchLearningOpsPlaybookRecommendations(
        searchLearningOpsPlaybookOutcomes
    );
    const searchLearningOpsPlaybookRecommendationQueue = buildSearchLearningOpsPlaybookRecommendationQueue(
        searchLearningOpsPlaybookRecommendations
    );
    const searchLearningOpsPlaybookRecommendationActivity = buildSearchLearningOpsPlaybookRecommendationActivity(
        searchLearningActivity
    );
    const searchLearningOpsPlaybookRecommendationOutcomes = buildSearchLearningOpsPlaybookRecommendationOutcomes(
        searchLearningOpsPlaybookRecommendationActivity.recentRuns,
        searchLearningEntries
    );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendations = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendations(
        searchLearningOpsPlaybookRecommendationOutcomes
    );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue(
        searchLearningOpsPlaybookRecommendationOutcomeRecommendations
    );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity(
        searchLearningActivity
    );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes = buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes(
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.recentRuns,
        searchLearningEntries
    );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity(searchLearningActivity);
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns,
            searchLearningEntries
        );
    const searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations =
        buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations(
            searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsCompletionSummary = buildSearchLearningOpsCompletionSummary(
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
        searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity
    );
    const searchLearningOpsCompletionActions = buildSearchLearningOpsCompletionActions(
        searchLearningOpsCompletionSummary
    );
    const searchLearningOpsCompletionActivity = buildSearchLearningOpsCompletionActivity(
        searchLearningActivity
    );
    const searchLearningOpsCompletionOutcomes = buildSearchLearningOpsCompletionOutcomes(
        searchLearningOpsCompletionActivity.recentRuns,
        searchLearningEntries
    );
    const searchLearningOpsCompletionRecommendations = buildSearchLearningOpsCompletionRecommendations(
        searchLearningOpsCompletionOutcomes
    );
    const searchLearningOpsCompletionRecommendationQueue = buildSearchLearningOpsCompletionRecommendationQueue(
        searchLearningOpsCompletionRecommendations
    );
    const searchLearningOpsCompletionRecommendationActivity = buildSearchLearningOpsCompletionRecommendationActivity(
        searchLearningActivity
    );
    const searchLearningOpsCompletionRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationActivity.recentRuns,
            searchLearningEntries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendations(
            searchLearningOpsCompletionRecommendationOutcomes
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueue(
            searchLearningOpsCompletionRecommendationOutcomeRecommendations
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationActivity(searchLearningActivity);
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.recentRuns,
            searchLearningEntries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity(searchLearningActivity);
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns,
            searchLearningEntries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity(
            searchLearningActivity
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.recentRuns,
            searchLearningEntries
        );
    const searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations =
        buildSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations(
            searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes
        );
    const searchLearningOpsCompletionQueue = buildSearchLearningOpsCompletionQueue(
        searchLearningOpsCompletionActions
    );
    const searchLearningDraftEntries = searchLearningEntries.filter((entry) =>
        entry.status === 'pending' && entry.aiSuggestion && entry.aiSuggestion.suggestedQueries.length > 0
    );
    const searchLearningImpactSummary = buildSearchLearningImpactSummary(searchLearningEntries);
    const searchLearningTerminalWorkflow = buildSearchLearningTerminalWorkflow(
        searchLearningEntries,
        searchLearningDraftEntries,
        searchLearningOpsCenter,
        searchLearningOpsCompletionSummary,
        searchLearningImpactSummary
    );
    const searchLearningTerminalAlerts = buildSearchLearningTerminalAlerts(searchLearningTerminalWorkflow);
    const searchLearningTerminalHealth = buildSearchLearningTerminalHealth(
        searchLearningTerminalWorkflow,
        searchLearningTerminalAlerts
    );
    const searchLearningTerminalChecklist = buildSearchLearningTerminalChecklist(
        searchLearningTerminalWorkflow,
        searchLearningTerminalHealth
    );
    const searchLearningTerminalRunbook = buildSearchLearningTerminalRunbook(searchLearningTerminalWorkflow);
    const searchLearningTerminalMetrics = buildSearchLearningTerminalMetrics(
        searchLearningTerminalWorkflow,
        searchLearningTerminalHealth,
        searchLearningTerminalAlerts,
        searchLearningActivity
    );
    const searchLearningTerminalTrends = buildSearchLearningTerminalTrends(
        searchLearningTerminalWorkflow,
        searchLearningTerminalMetrics
    );
    const searchLearningTerminalWatchlist = buildSearchLearningTerminalWatchlist(
        searchLearningTerminalWorkflow,
        searchLearningOpsCenter,
        searchLearningImpactSummary
    );
    const searchLearningTerminalMetricsMaxDailyTotal = Math.max(
        1,
        ...searchLearningTerminalMetrics.trend.map((point) => point.seeded + point.generated + point.reviewed)
    );
    const searchLearningImpactClusterRollup = buildSearchLearningImpactClusterRollup(searchLearningEntries);
    const searchLearningImpactClusters = buildSearchLearningImpactClusterSummaries(searchLearningEntries).slice(0, 6);
    const searchLearningTerminalCoverage = buildSearchLearningTerminalCoverage(
        data?.searchQualityCoverage || {
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
        searchLearningImpactClusterRollup
    );
    const searchLearningRewritePacks = buildSearchLearningRewritePacks(searchLearningEntries).slice(0, 6);
    const searchLearningRewriteRecommendations = buildSearchLearningRewriteRecommendations(
        buildSearchLearningRewritePacks(searchLearningEntries),
        buildSearchLearningImpactClusterSummaries(searchLearningEntries)
    );
    const searchLearningRewriteRecommendationSummary = buildSearchLearningRewriteRecommendationSummary(searchLearningRewriteRecommendations);
    const searchLearningRewriteSourceDrafts = buildSearchLearningRewriteSourceDrafts(
        searchLearningRewriteRecommendations,
        searchLearningRewritePacks
    );
    const searchLearningRewriteSourceDraftSummary = buildSearchLearningRewriteSourceDraftSummary(searchLearningRewriteSourceDrafts);
    const searchLearningRewriteSourceOps = buildSearchLearningRewriteSourceOps(searchLearningRewriteSourceDrafts);
    const searchLearningRewriteSourceOpsSummary = buildSearchLearningRewriteSourceOpsSummary(searchLearningRewriteSourceOps);
    const searchLearningRewriteSourceActionDrafts = buildSearchLearningRewriteSourceActionDrafts(searchLearningRewriteSourceOps);
    const searchLearningRewriteSourceActionDraftSummary = buildSearchLearningRewriteSourceActionDraftSummary(searchLearningRewriteSourceActionDrafts);
    const searchLearningRewriteSourceActionReviewQueue = buildSearchLearningRewriteSourceActionReviewQueue(
        searchLearningRewriteSourceActionDrafts,
        searchLearningEntries
    );
    const searchLearningRewriteSourceActionReviewSummary = buildSearchLearningRewriteSourceActionReviewSummary(
        searchLearningRewriteSourceActionReviewQueue
    );
    const searchLearningRewriteSourceApprovalQueue = buildSearchLearningRewriteSourceApprovalQueue(
        searchLearningRewriteSourceActionDrafts,
        searchLearningRewriteSourceActionReviewQueue
    );
    const searchLearningRewriteSourceApprovalQueueSummary = buildSearchLearningRewriteSourceApprovalQueueSummary(
        searchLearningRewriteSourceApprovalQueue
    );
    const searchLearningRewriteSourceApprovalActivity = buildSearchLearningRewriteSourceApprovalActivity(
        searchLearningRewriteSourceApprovalQueue
    );
    const searchLearningRewriteSourceApprovalActivitySummary = buildSearchLearningRewriteSourceApprovalActivitySummary(
        searchLearningRewriteSourceApprovalActivity
    );
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
                    context: 'single_generate',
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
                    summary: summarizeSearchLearningEntries(
                        current.searchLearning.entries.map((entry) => (
                            entry.id === entryId ? (payload.entry || entry) : entry
                        ))
                    ),
                },
                searchLearningActivity: {
                    ...current.searchLearningActivity,
                    events: payload.activity
                        ? mergeSearchLearningActivityEvents(current.searchLearningActivity.events, [payload.activity as SearchLearningActivityEvent])
                        : current.searchLearningActivity.events,
                },
            } : current);
            setSearchLearningMessage('AI 검색어 제안을 생성했습니다.');
        } catch (suggestionError) {
            setSearchLearningMessage(suggestionError instanceof Error ? suggestionError.message : 'AI 검색 제안 생성에 실패했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleBulkGenerateSearchLearningSuggestions() {
        if (!user || selectedSearchLearningIds.length === 0) {
            return;
        }

        await handleBulkGenerateSearchLearningSuggestionsForIds(
            selectedSearchLearningIds,
            'bulk_generate',
            (count) => `${count}개의 학습 query에 AI 제안을 생성했습니다.`,
            '검색 학습 AI 제안을 일괄 생성하지 못했습니다.'
        );
    }

    async function handleBulkGenerateSearchLearningSuggestionsForIds(
        entryIds: string[],
        processingKey: string,
        successMessage: (count: number) => string,
        fallbackErrorMessage: string
    ) {
        if (!user || entryIds.length === 0) {
            return;
        }

        setProcessingSearchLearningId(processingKey);
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
                    action: 'bulk_generate',
                    entryIds,
                    context: processingKey,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || fallbackErrorMessage);
            }

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            setData((current) => {
                if (!current) {
                    return current;
                }

                const entries = mergeSearchLearningEntries(current.searchLearning.entries, updatedEntries);
                return {
                    ...current,
                    searchLearning: {
                        ...current.searchLearning,
                        entries,
                        summary: summarizeSearchLearningEntries(entries),
                    },
                    searchLearningActivity: {
                        ...current.searchLearningActivity,
                        events: payload.activity
                            ? mergeSearchLearningActivityEvents(current.searchLearningActivity.events, [payload.activity as SearchLearningActivityEvent])
                            : current.searchLearningActivity.events,
                    },
                };
            });
            setSearchLearningMessage(successMessage(updatedEntries.length));
        } catch (bulkError) {
            setSearchLearningMessage(bulkError instanceof Error ? bulkError.message : fallbackErrorMessage);
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleSeedCoverageQueries() {
        if (!user || !data || data.searchQualityCoverage.uncoveredQueries.length === 0) {
            return;
        }

        setProcessingSearchLearningId('seed_queries');
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
                    action: 'seed_queries',
                    queries: data.searchQualityCoverage.uncoveredQueries.map((entry) => entry.query),
                    context: 'coverage_seed',
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || '미커버 query를 학습 큐에 추가하지 못했습니다.');
            }

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            setData((current) => {
                if (!current) {
                    return current;
                }

                const entries = mergeSearchLearningEntries(current.searchLearning.entries, updatedEntries);
                return {
                    ...current,
                    searchLearning: {
                        ...current.searchLearning,
                        entries,
                        summary: summarizeSearchLearningEntries(entries),
                    },
                    searchLearningActivity: {
                        ...current.searchLearningActivity,
                        events: payload.activity
                            ? mergeSearchLearningActivityEvents(current.searchLearningActivity.events, [payload.activity as SearchLearningActivityEvent])
                            : current.searchLearningActivity.events,
                    },
                };
            });
            setSearchLearningMessage(`${updatedEntries.length}개의 미커버 query를 학습 큐에 추가했습니다.`);
        } catch (seedError) {
            setSearchLearningMessage(seedError instanceof Error ? seedError.message : '미커버 query를 학습 큐에 추가하지 못했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleSeedCoverageClusterQueries(clusterId: string, clusterLabel: string, queries: string[]) {
        if (!user || queries.length === 0) {
            return;
        }

        setProcessingSearchLearningId(`seed_cluster_${clusterId}`);
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
                    action: 'seed_queries',
                    queries,
                    context: `coverage_cluster_seed:${clusterId}`,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || `${clusterLabel} query를 학습 큐에 추가하지 못했습니다.`);
            }

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            setData((current) => {
                if (!current) {
                    return current;
                }

                const entries = mergeSearchLearningEntries(current.searchLearning.entries, updatedEntries);
                return {
                    ...current,
                    searchLearning: {
                        ...current.searchLearning,
                        entries,
                        summary: summarizeSearchLearningEntries(entries),
                    },
                    searchLearningActivity: {
                        ...current.searchLearningActivity,
                        events: payload.activity
                            ? mergeSearchLearningActivityEvents(current.searchLearningActivity.events, [payload.activity as SearchLearningActivityEvent])
                            : current.searchLearningActivity.events,
                    },
                };
            });
            setSearchLearningMessage(`${clusterLabel} 클러스터의 ${updatedEntries.length}개 query를 학습 큐에 추가했습니다.`);
        } catch (seedError) {
            setSearchLearningMessage(seedError instanceof Error ? seedError.message : `${clusterLabel} query를 학습 큐에 추가하지 못했습니다.`);
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    function toggleSearchLearningSelection(entryId: string) {
        setSelectedSearchLearningIds((current) => (
            current.includes(entryId)
                ? current.filter((id) => id !== entryId)
                : [...current, entryId]
        ));
    }

    function selectPendingSearchLearningEntries() {
        setSelectedSearchLearningIds(searchLearningEntries
            .filter((entry) => entry.status === 'pending')
            .map((entry) => entry.id)
            .slice(0, 24));
    }

    function selectDraftSearchLearningEntries() {
        setSelectedSearchLearningIds(searchLearningDraftEntries.map((entry) => entry.id).slice(0, 24));
        setSearchLearningMessage(`${Math.min(searchLearningDraftEntries.length, 24)}개의 AI draft query를 선택했습니다.`);
    }

    async function handleSearchLearningTerminalAction(action: SearchLearningTerminalWorkflowAction) {
        switch (action.kind) {
            case 'draft_review':
                selectDraftSearchLearningEntries();
                return;
            case 'review_now':
                selectSearchLearningEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`);
                return;
            case 'generate_now':
                await handleBulkGenerateSearchLearningSuggestionsForIds(
                    action.entryIds,
                    'terminal_generate_now',
                    (count) => `${count}개의 terminal generate query에 AI 제안을 생성했습니다.`,
                    'terminal generate query AI 제안 생성에 실패했습니다.'
                );
                return;
            case 'retrain_now':
                await handleBulkGenerateSearchLearningSuggestionsForIds(
                    action.entryIds,
                    'terminal_retrain_now',
                    (count) => `${count}개의 terminal retrain query에 AI 제안을 생성했습니다.`,
                    'terminal retrain query AI 제안 생성에 실패했습니다.'
                );
                return;
            case 'sample_collection':
                selectSearchLearningEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`);
                return;
            default:
                selectSearchLearningEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`);
        }
    }

    function selectSearchLearningEntries(entryIds: string[], message: string) {
        const nextIds = Array.from(new Set(entryIds.filter(Boolean))).slice(0, 24);
        setSelectedSearchLearningIds(nextIds);
        setSearchLearningMessage(message);
    }

    function selectImpactNoImprovementEntries() {
        selectSearchLearningEntries(
            searchLearningImpactSummary.topNeedsAttention.map((impact) => impact.entryId),
            `${searchLearningImpactSummary.topNeedsAttention.length}개의 개선 없음 query를 선택했습니다.`
        );
    }

    function selectImpactImprovedEntries() {
        selectSearchLearningEntries(
            searchLearningImpactSummary.topImproved.map((impact) => impact.entryId),
            `${searchLearningImpactSummary.topImproved.length}개의 개선 query를 선택했습니다.`
        );
    }

    function selectImpactAwaitingEntries() {
        selectSearchLearningEntries(
            searchLearningImpactSummary.topAwaitingSamples.map((impact) => impact.entryId),
            `${searchLearningImpactSummary.topAwaitingSamples.length}개의 샘플 대기 query를 선택했습니다.`
        );
    }

    function selectImpactClusterEntries(entryIds: string[], clusterLabel: string) {
        selectSearchLearningEntries(
            entryIds,
            `${clusterLabel} 클러스터의 ${entryIds.length}개 query를 선택했습니다.`
        );
    }

    function selectImpactClusters(
        clusters: Array<{ entryIds: string[] }>,
        message: string
    ) {
        selectSearchLearningEntries(
            clusters.flatMap((cluster) => cluster.entryIds),
            message
        );
    }

    async function handleGenerateSourceRollbackDraftSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningRewriteSourceActionDraftSummary.topRollbackRegenerate.flatMap((draft) => draft.entryIds),
            'source_ops_rollback_generate',
            (count) => `${count}개의 rollback source ops query에 AI 제안을 재생성했습니다.`,
            'rollback source ops query AI 제안을 재생성하지 못했습니다.'
        );
    }

    async function handleGenerateSourceActionReviewSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningRewriteSourceActionReviewSummary.topGenerationNeeded.flatMap((entry) => entry.generationNeededEntryIds),
            'source_action_review_generate',
            (count) => `${count}개의 source action review query에 AI 제안을 생성했습니다.`,
            'source action review query AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleApproveSourceActionReviewSuggestions() {
        await handleBulkReviewSearchLearningForIds(
            searchLearningRewriteSourceActionReviewSummary.topReadyReview.flatMap((entry) => entry.readyReviewEntryIds),
            'bulk_approve',
            'source_action_review_approve',
            (count) => `${count}개의 source action review query를 일괄 승인했습니다.`,
            'source action review 승인에 실패했습니다.'
        );
    }

    async function handleGenerateSourceApprovalRollbackSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningRewriteSourceApprovalQueueSummary.topRollbackCandidates.flatMap((entry) => entry.primaryEntryIds),
            'source_approval_rollback_generate',
            (count) => `${count}개의 rollback approval 후보 query에 AI 제안을 생성했습니다.`,
            'rollback approval 후보 query AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleApproveSourceApprovalReviewPending() {
        await handleBulkReviewSearchLearningForIds(
            searchLearningRewriteSourceApprovalQueueSummary.topReviewPending.flatMap((entry) => entry.primaryEntryIds),
            'bulk_approve',
            'source_approval_review_approve',
            (count) => `${count}개의 review pending source approval query를 승인했습니다.`,
            'review pending source approval 승인에 실패했습니다.'
        );
    }

    async function handleSearchLearningOpsCompletionAction(action: SearchLearningOpsCompletionAction) {
        switch (action.type) {
            case 'execute_now':
                await handleBulkGenerateSearchLearningSuggestionsForIds(
                    action.entryIds,
                    'completion_execute_generate',
                    (count) => `${count}개의 completion execute query에 AI 제안을 생성했습니다.`,
                    'completion execute query AI 제안을 생성하지 못했습니다.'
                );
                return;
            case 'review_now':
                await handleBulkReviewSearchLearningForIds(
                    action.entryIds,
                    'bulk_approve',
                    'completion_review_approve',
                    (count) => `${count}개의 completion review query를 승인했습니다.`,
                    'completion review 승인에 실패했습니다.'
                );
                return;
            case 'collect_samples':
                selectSearchLearningEntries(action.entryIds, `${action.title}의 ${action.entryIds.length}개 query를 선택했습니다.`);
                return;
            default:
                selectSearchLearningEntries(action.entryIds, `${action.title}의 ${action.entryIds.length}개 개선 query를 선택했습니다.`);
        }
    }

    async function handleSearchLearningOpsCompletionQueueItem(item: SearchLearningOpsCompletionQueueItem) {
        const action = searchLearningOpsCompletionActions.topActions.find((candidate) => candidate.id === item.actionId);
        if (action) {
            await handleSearchLearningOpsCompletionAction(action);
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsCompletionRecommendation(
        recommendation: SearchLearningOpsCompletionRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `completion_recommendation_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation query를 승인했습니다.`,
                'completion recommendation review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `completion_recommendation_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation query에 재학습 AI 제안을 생성했습니다.`,
                'completion recommendation 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} completion recommendation query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsCompletionRecommendationQueueItem(
        item: SearchLearningOpsCompletionRecommendationQueueItem
    ) {
        const recommendation = [
            ...searchLearningOpsCompletionRecommendations.topReviewNow,
            ...searchLearningOpsCompletionRecommendations.topRetrainNow,
            ...searchLearningOpsCompletionRecommendations.topCollectSamples,
            ...searchLearningOpsCompletionRecommendations.topObserve,
        ].find((candidate) => candidate.id === item.recommendationId);

        if (recommendation) {
            await handleSearchLearningOpsCompletionRecommendation(recommendation);
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendation(
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `completion_recommendation_outcome_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation outcome query를 승인했습니다.`,
                'completion recommendation outcome review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `completion_recommendation_outcome_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation outcome query에 재학습 AI 제안을 생성했습니다.`,
                'completion recommendation outcome 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} completion recommendation outcome query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation(
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `completion_recommendation_outcome_recommendation_outcome_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation outcome recommendation outcome query를 승인했습니다.`,
                'completion recommendation outcome recommendation outcome review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `completion_recommendation_outcome_recommendation_outcome_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation outcome recommendation outcome query에 재학습 AI 제안을 생성했습니다.`,
                'completion recommendation outcome recommendation outcome 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} completion recommendation outcome recommendation outcome query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation(
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `completion_recommendation_outcome_recommendation_outcome_recommendation_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation outcome recommendation outcome recommendation query를 승인했습니다.`,
                'completion recommendation outcome recommendation outcome recommendation review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `completion_recommendation_outcome_recommendation_outcome_recommendation_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 completion recommendation outcome recommendation outcome recommendation query에 재학습 AI 제안을 생성했습니다.`,
                'completion recommendation outcome recommendation outcome recommendation 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} completion recommendation outcome recommendation outcome recommendation query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation(
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_recommendation_review_${recommendation.outcomeId}`,
                (count) =>
                    `${count}개의 completion recommendation outcome recommendation outcome recommendation recommendation query를 승인했습니다.`,
                'completion recommendation outcome recommendation outcome recommendation recommendation review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_recommendation_retrain_${recommendation.outcomeId}`,
                (count) =>
                    `${count}개의 completion recommendation outcome recommendation outcome recommendation recommendation query에 재학습 AI 제안을 생성했습니다.`,
                'completion recommendation outcome recommendation outcome recommendation recommendation 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} completion recommendation outcome recommendation outcome recommendation recommendation query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem(
        item: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem
    ) {
        const recommendation = [
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topReviewNow,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topRetrainNow,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topCollectSamples,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topObserve,
        ].find((candidate) => candidate.id === item.recommendationId);

        if (recommendation) {
            if (recommendation.action === 'review_now') {
                const reviewableIds = recommendation.entryIds.filter((entryId) => {
                    const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                    return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
                });

                await handleBulkReviewSearchLearningForIds(
                    reviewableIds,
                    'bulk_approve',
                    `completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_review_${recommendation.outcomeId}`,
                    (count) =>
                        `${count}개의 completion recommendation outcome recommendation outcome recommendation recommendation query를 승인했습니다.`,
                    'completion recommendation outcome recommendation outcome recommendation recommendation review 승인에 실패했습니다.'
                );
                return;
            }

            if (recommendation.action === 'retrain_now') {
                await handleBulkGenerateSearchLearningSuggestionsForIds(
                    recommendation.entryIds,
                    `completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_retrain_${recommendation.outcomeId}`,
                    (count) =>
                        `${count}개의 completion recommendation outcome recommendation outcome recommendation recommendation query에 재학습 AI 제안을 생성했습니다.`,
                    'completion recommendation outcome recommendation outcome recommendation recommendation 재학습 AI 제안 생성에 실패했습니다.'
                );
                return;
            }

            selectSearchLearningEntries(
                recommendation.entryIds,
                `${recommendation.title} completion recommendation outcome recommendation outcome recommendation recommendation query를 선택했습니다.`
            );
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem(
        item: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem
    ) {
        const recommendation = [
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
        ].find((candidate) => candidate.id === item.recommendationId);

        if (recommendation) {
            await handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation(recommendation);
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem(
        item: SearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem
    ) {
        const recommendation = [
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topReviewNow,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topRetrainNow,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topCollectSamples,
            ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topObserve,
        ].find((candidate) => candidate.id === item.recommendationId);

        if (recommendation) {
            await handleSearchLearningOpsCompletionRecommendationOutcomeRecommendation(recommendation);
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`);
    }

    async function handleGenerateImpactNoImprovementSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactSummary.topNeedsAttention.map((impact) => impact.entryId),
            'impact_no_improvement_generate',
            (count) => `${count}개의 개선 없음 query에 재학습 AI 제안을 생성했습니다.`,
            '개선 없음 query 재학습 AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleGenerateImpactAwaitingSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactSummary.topAwaitingSamples.map((impact) => impact.entryId),
            'impact_awaiting_generate',
            (count) => `${count}개의 샘플 대기 query에 AI 제안을 생성했습니다.`,
            '샘플 대기 query AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleGenerateImpactNoImprovementClusterSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactClusterRollup.topNeedsAttention.flatMap((cluster) => cluster.entryIds),
            'impact_cluster_no_improvement_generate',
            (count) => `${count}개의 개선 없음 클러스터 query에 재학습 AI 제안을 생성했습니다.`,
            '개선 없음 클러스터 재학습 AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleGenerateImpactAwaitingClusterSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactClusterRollup.topAwaitingSamples.flatMap((cluster) => cluster.entryIds),
            'impact_cluster_awaiting_generate',
            (count) => `${count}개의 샘플 대기 클러스터 query에 AI 제안을 생성했습니다.`,
            '샘플 대기 클러스터 AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleActivityOpsQueueItemAction(item: SearchLearningActivityOpsQueueItem) {
        if (item.action === 'review_pending') {
            await handleBulkReviewSearchLearningForIds(
                item.entryIds,
                'bulk_approve',
                `activity_ops_review_${item.id}`,
                (count) => `${count}개의 activity review query를 승인했습니다.`,
                'activity review query 승인에 실패했습니다.'
            );
            return;
        }

        if (item.action === 'generate_needed') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                item.entryIds,
                `activity_ops_generate_${item.id}`,
                (count) => `${count}개의 activity query에 AI 제안을 생성했습니다.`,
                'activity query AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleActivityFollowupAction(entryIds: string[], action: 'retrain_needed' | 'awaiting_samples' | 'validated', title: string) {
        if (action === 'retrain_needed') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                entryIds,
                `activity_followup_retrain_${title}`,
                (count) => `${count}개의 follow-up query에 AI 제안을 생성했습니다.`,
                'follow-up query AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(entryIds, `${title}의 ${entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsCenterAction(item: SearchLearningOpsCenterItem) {
        if (item.action === 'approve_now') {
            await handleBulkReviewSearchLearningForIds(
                item.entryIds,
                'bulk_approve',
                `ops_center_review_${item.id}`,
                (count) => `${count}개의 ops center query를 즉시 승인했습니다.`,
                'ops center query 즉시 승인에 실패했습니다.'
            );
            return;
        }

        if (item.action === 'generate_now' || item.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                item.entryIds,
                `ops_center_generate_${item.id}`,
                (count) => `${count}개의 ops center query에 AI 제안을 생성했습니다.`,
                'ops center query AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsPlaybookAction(playbook: SearchLearningOpsPlaybook) {
        if (playbook.action === 'approve_batch') {
            await handleBulkReviewSearchLearningForIds(
                playbook.entryIds,
                'bulk_approve',
                `ops_playbook_approve_${playbook.id}`,
                (count) => `${count}개의 search learning playbook query를 승인했습니다.`,
                'search learning playbook 승인에 실패했습니다.'
            );
            return;
        }

        if (playbook.action === 'generate_batch' || playbook.action === 'retrain_batch') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                playbook.entryIds,
                `ops_playbook_generate_${playbook.id}`,
                (count) => `${count}개의 search learning playbook query에 AI 제안을 생성했습니다.`,
                'search learning playbook AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(playbook.entryIds, `${playbook.title}의 ${playbook.entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsPlaybookOutcomeAction(outcome: SearchLearningOpsPlaybookOutcome) {
        if (outcome.status === 'ready_review') {
            const reviewableIds = outcome.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `ops_playbook_outcome_review_${outcome.id}`,
                (count) => `${count}개의 playbook outcome query를 승인했습니다.`,
                'playbook outcome review 승인에 실패했습니다.'
            );
            return;
        }

        if (outcome.status === 'needs_attention') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                outcome.entryIds,
                `ops_playbook_outcome_retrain_${outcome.id}`,
                (count) => `${count}개의 playbook outcome query에 재학습 AI 제안을 생성했습니다.`,
                'playbook outcome 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsPlaybookRecommendationAction(
        recommendation: SearchLearningOpsPlaybookRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `ops_playbook_recommendation_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 playbook recommendation query를 승인했습니다.`,
                'playbook recommendation review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `ops_playbook_recommendation_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 playbook recommendation query에 재학습 AI 제안을 생성했습니다.`,
                'playbook recommendation 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} recommendation query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeAction(
        outcome: SearchLearningOpsPlaybookRecommendationOutcome
    ) {
        if (outcome.status === 'ready_review') {
            const reviewableIds = outcome.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `ops_playbook_recommendation_outcome_review_${outcome.outcomeId}`,
                (count) => `${count}개의 recommendation outcome query를 승인했습니다.`,
                'recommendation outcome review 승인에 실패했습니다.'
            );
            return;
        }

        if (outcome.status === 'needs_attention') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                outcome.entryIds,
                `ops_playbook_recommendation_outcome_retrain_${outcome.outcomeId}`,
                (count) => `${count}개의 recommendation outcome query에 재학습 AI 제안을 생성했습니다.`,
                'recommendation outcome 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(outcome.entryIds, `${outcome.title} recommendation outcome query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction(
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `ops_playbook_recommendation_outcome_recommendation_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 recommendation outcome recommendation query를 승인했습니다.`,
                'recommendation outcome recommendation review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `ops_playbook_recommendation_outcome_recommendation_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 recommendation outcome recommendation query에 재학습 AI 제안을 생성했습니다.`,
                'recommendation outcome recommendation 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} recommendation outcome recommendation query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction(
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 recommendation outcome recommendation outcome recommendation query를 승인했습니다.`,
                'recommendation outcome recommendation outcome recommendation review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 recommendation outcome recommendation outcome recommendation query에 재학습 AI 제안을 생성했습니다.`,
                'recommendation outcome recommendation outcome recommendation 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} recommendation outcome recommendation outcome recommendation query를 선택했습니다.`
        );
    }

    async function handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction(
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation
    ) {
        if (recommendation.action === 'review_now') {
            const reviewableIds = recommendation.entryIds.filter((entryId) => {
                const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
                return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
            });

            await handleBulkReviewSearchLearningForIds(
                reviewableIds,
                'bulk_approve',
                `ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_recommendation_review_${recommendation.outcomeId}`,
                (count) => `${count}개의 recommendation outcome recommendation outcome recommendation recommendation query를 승인했습니다.`,
                'recommendation outcome recommendation outcome recommendation recommendation review 승인에 실패했습니다.'
            );
            return;
        }

        if (recommendation.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                recommendation.entryIds,
                `ops_playbook_recommendation_outcome_recommendation_outcome_recommendation_recommendation_retrain_${recommendation.outcomeId}`,
                (count) => `${count}개의 recommendation outcome recommendation outcome recommendation recommendation query에 재학습 AI 제안을 생성했습니다.`,
                'recommendation outcome recommendation outcome recommendation recommendation 재학습 AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(
            recommendation.entryIds,
            `${recommendation.title} recommendation outcome recommendation outcome recommendation recommendation query를 선택했습니다.`
        );
    }

    function clearSearchLearningSelection() {
        setSelectedSearchLearningIds([]);
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
                    context: `single_review:${action}`,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || '검색 학습 검토 저장에 실패했습니다.');
            }

            setData((current) => {
                if (!current) {
                    return current;
                }

                const entries = current.searchLearning.entries.map((currentEntry) => (
                    currentEntry.id === entry.id ? (payload.entry || currentEntry) : currentEntry
                ));

                return {
                    ...current,
                    searchLearning: {
                        ...current.searchLearning,
                        entries,
                        summary: summarizeSearchLearningEntries(entries),
                    },
                    searchLearningActivity: {
                        ...current.searchLearningActivity,
                        events: payload.activity
                            ? mergeSearchLearningActivityEvents(current.searchLearningActivity.events, [payload.activity as SearchLearningActivityEvent])
                            : current.searchLearningActivity.events,
                    },
                };
            });
            setSelectedSearchLearningIds((current) => current.filter((id) => id !== entry.id));
            setSearchLearningMessage(action === 'approve' ? '학습 query를 승인했습니다.' : '학습 query를 보류 처리했습니다.');
        } catch (reviewError) {
            setSearchLearningMessage(reviewError instanceof Error ? reviewError.message : '검색 학습 검토 저장에 실패했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleBulkReviewSearchLearning(action: 'bulk_approve' | 'bulk_ignore') {
        if (!user || selectedSearchLearningIds.length === 0) {
            return;
        }

        await handleBulkReviewSearchLearningForIds(
            selectedSearchLearningIds,
            action,
            action,
            action === 'bulk_approve'
                ? (count) => `${count}개의 학습 query를 일괄 승인했습니다.`
                : `${selectedSearchLearningIds.length}개의 학습 query를 일괄 보류 처리했습니다.`,
            '검색 학습 일괄 검토 저장에 실패했습니다.'
        );
    }

    async function handleBulkReviewSearchLearningForIds(
        entryIds: string[],
        action: 'bulk_approve' | 'bulk_ignore',
        processingKey: string,
        successMessage: string | ((count: number) => string),
        fallbackErrorMessage: string
    ) {
        if (!user || entryIds.length === 0) {
            return;
        }

        setProcessingSearchLearningId(processingKey);
        setSearchLearningMessage(null);
        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/search-learning', {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action,
                    entryIds,
                    context: processingKey,
                }),
            });
            const payload = await response.json();
            if (!response.ok) {
                throw new Error(payload.error || fallbackErrorMessage);
            }

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            setData((current) => {
                if (!current) {
                    return current;
                }

                const updatedMap = new Map(updatedEntries.map((entry) => [entry.id, entry]));
                const entries = current.searchLearning.entries.map((entry) => updatedMap.get(entry.id) || entry);
                return {
                    ...current,
                    searchLearning: {
                        ...current.searchLearning,
                        entries,
                        summary: summarizeSearchLearningEntries(entries),
                    },
                };
            });
            setSelectedSearchLearningIds((current) => current.filter((id) => !entryIds.includes(id)));
            setSearchLearningMessage(typeof successMessage === 'function' ? successMessage(updatedEntries.length) : successMessage);
        } catch (bulkError) {
            setSearchLearningMessage(bulkError instanceof Error ? bulkError.message : fallbackErrorMessage);
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
                                    <h2 className="text-lg font-bold text-white">Search Quality Coverage</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        curated 패션 검색어 평가셋 기준으로 rewrite/semantic expansion이 얼마나 커버되는지 요약합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {data?.searchQualityCoverage.totalQueries ?? 0}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                                        NAVER {Math.round((data?.searchQualityCoverage.naverCoverageRate ?? 0) * 100)}%
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={handleSeedCoverageQueries}
                                    disabled={(data?.searchQualityCoverage.uncoveredQueries.length ?? 0) === 0 || processingSearchLearningId === 'seed_queries'}
                                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === 'seed_queries'
                                        ? '큐 적재 중...'
                                        : `미커버 query 큐 추가 (${data?.searchQualityCoverage.uncoveredQueries.length ?? 0})`}
                                </button>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">NAVER Coverage</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-300">
                                        {Math.round((data?.searchQualityCoverage.naverCoverageRate ?? 0) * 100)}%
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {data?.searchQualityCoverage.naverCovered ?? 0}/{data?.searchQualityCoverage.totalQueries ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Global Coverage</p>
                                    <p className="mt-3 text-3xl font-black text-sky-300">
                                        {Math.round((data?.searchQualityCoverage.globalCoverageRate ?? 0) * 100)}%
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {data?.searchQualityCoverage.globalCovered ?? 0}/{data?.searchQualityCoverage.globalTargetQueries ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Full Coverage</p>
                                    <p className="mt-3 text-3xl font-black text-violet-300">
                                        {Math.round((data?.searchQualityCoverage.fullCoverageRate ?? 0) * 100)}%
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        {data?.searchQualityCoverage.fullyCovered ?? 0}/{data?.searchQualityCoverage.totalQueries ?? 0}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Review</p>
                                    <p className="mt-3 text-3xl font-black text-amber-300">
                                        {data?.searchQualityCoverage.uncoveredQueries.length ?? 0}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        uncovered curated queries
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Source Approval Activity</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            source approval 흐름을 긴급 승인, rollback 재생성, 승격 관찰, 표본 추가 수집 순서로 한 번에 triage합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        activity {searchLearningRewriteSourceApprovalActivitySummary.total}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleApproveSourceApprovalReviewPending}
                                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topReviewApprove.length === 0 || processingSearchLearningId === 'source_approval_review_approve'}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'source_approval_review_approve'
                                            ? '승인 중...'
                                            : `긴급 review 승인 (${searchLearningRewriteSourceApprovalActivitySummary.topReviewApprove.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateSourceApprovalRollbackSuggestions}
                                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topRollbackGenerate.length === 0 || processingSearchLearningId === 'source_approval_rollback_generate'}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'source_approval_rollback_generate'
                                            ? '생성 중...'
                                            : `긴급 rollback AI 제안 (${searchLearningRewriteSourceApprovalActivitySummary.topRollbackGenerate.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.flatMap((item) => item.primaryEntryIds),
                                            `${searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.length}개의 승격 관찰 query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.length === 0}
                                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        승격 관찰 선택 ({searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.flatMap((item) => item.primaryEntryIds),
                                            `${searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.length}개의 표본 추가 수집 query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.length === 0}
                                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        표본 추가 수집 선택 ({searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.length})
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Urgent</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceApprovalActivitySummary.urgent}</p>
                                        <p className="mt-1 text-xs text-slate-400">즉시 승인 또는 rollback 재생성이 필요한 항목</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">High</p>
                                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceApprovalActivitySummary.high}</p>
                                        <p className="mt-1 text-xs text-slate-400">rollback 재검토처럼 우선순위가 높은 후속 액션</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Medium</p>
                                        <p className="mt-3 text-3xl font-black text-cyan-300">{searchLearningRewriteSourceApprovalActivitySummary.medium}</p>
                                        <p className="mt-1 text-xs text-slate-400">승격 관찰처럼 유지/확대 판단을 기다리는 항목</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Low</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceApprovalActivitySummary.low}</p>
                                        <p className="mt-1 text-xs text-slate-400">표본 추가 수집 위주로 보면 되는 항목</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {searchLearningRewriteSourceApprovalActivity.slice(0, 6).map((item) => {
                                        const toneClass =
                                            item.priority === 'urgent'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                : item.priority === 'high'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                                    : item.priority === 'medium'
                                                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
                                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{item.source}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.title} · review {item.readyReviewCount} · regenerate {item.generationNeededCount}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${toneClass}`}>
                                                        {item.priority}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topClusters.map((cluster) => (
                                                        <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {cluster}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topQueries.slice(0, 4).map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(
                                                        item.primaryEntryIds.length > 0 ? item.primaryEntryIds : item.entryIds,
                                                        `${item.source} / ${item.title} activity query를 선택했습니다.`
                                                    )}
                                                    className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    activity 선택
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {searchLearningRewriteSourceApprovalActivity.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            아직 source approval activity가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Source Approval Queue</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            source action과 review 상태를 합쳐 자동 승격 후보, rollback 후보, review pending 후보를 운영 승인 큐로 정리합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        queue {searchLearningRewriteSourceApprovalQueueSummary.total}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.flatMap((entry) => entry.primaryEntryIds),
                                            `${searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.length}개의 승격 후보 query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        승격 후보 선택 ({searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApproveSourceApprovalReviewPending}
                                        disabled={searchLearningRewriteSourceApprovalQueueSummary.topReviewPending.length === 0 || processingSearchLearningId === 'source_approval_review_approve'}
                                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'source_approval_review_approve'
                                            ? '승인 중...'
                                            : `review pending 승인 (${searchLearningRewriteSourceApprovalQueueSummary.topReviewPending.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateSourceApprovalRollbackSuggestions}
                                        disabled={searchLearningRewriteSourceApprovalQueueSummary.topRollbackCandidates.length === 0 || processingSearchLearningId === 'source_approval_rollback_generate'}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'source_approval_rollback_generate'
                                            ? '생성 중...'
                                            : `rollback 후보 AI 제안 (${searchLearningRewriteSourceApprovalQueueSummary.topRollbackCandidates.length})`}
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote Candidates</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceApprovalQueueSummary.promoteCandidates}</p>
                                        <p className="mt-1 text-xs text-slate-400">안정적으로 유지/확대 가능한 source action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback Candidates</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceApprovalQueueSummary.rollbackCandidates}</p>
                                        <p className="mt-1 text-xs text-slate-400">재생성 또는 rollback 재검토가 필요한 action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Pending</p>
                                        <p className="mt-3 text-3xl font-black text-cyan-300">{searchLearningRewriteSourceApprovalQueueSummary.reviewPending}</p>
                                        <p className="mt-1 text-xs text-slate-400">이미 AI draft가 있어 승인만 남은 action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe Pending</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceApprovalQueueSummary.observePending}</p>
                                        <p className="mt-1 text-xs text-slate-400">추가 표본 관측이 더 필요한 action</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {searchLearningRewriteSourceApprovalQueue.slice(0, 6).map((item) => {
                                        const toneClass =
                                            item.decision === 'promote_candidate'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                                : item.decision === 'rollback_candidate'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                    : item.decision === 'review_pending'
                                                        ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200'
                                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{item.source}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.title} · ready {item.readyReviewCount} · regenerate {item.generationNeededCount}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${toneClass}`}>
                                                        {item.decision}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.reason}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topClusters.map((cluster) => (
                                                        <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {cluster}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topQueries.slice(0, 4).map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(
                                                        item.primaryEntryIds.length > 0 ? item.primaryEntryIds : item.entryIds,
                                                        `${item.source} / ${item.title} approval query를 선택했습니다.`
                                                    )}
                                                    className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    approval queue 선택
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {searchLearningRewriteSourceApprovalQueue.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            아직 source approval queue가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Source Action Review Queue</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            source action에서 바로 review 가능한 AI draft와 아직 AI 생성이 필요한 항목을 분리해 운영 우선순위로 보여줍니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        queue {searchLearningRewriteSourceActionReviewSummary.total}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceActionReviewSummary.topReadyReview.flatMap((entry) => entry.readyReviewEntryIds),
                                            `${searchLearningRewriteSourceActionReviewSummary.topReadyReview.length}개의 source action review query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceActionReviewSummary.topReadyReview.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        review 선택 ({searchLearningRewriteSourceActionReviewSummary.topReadyReview.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleApproveSourceActionReviewSuggestions}
                                        disabled={searchLearningRewriteSourceActionReviewSummary.topReadyReview.length === 0 || processingSearchLearningId === 'source_action_review_approve'}
                                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'source_action_review_approve'
                                            ? '승인 중...'
                                            : `review 즉시 승인 (${searchLearningRewriteSourceActionReviewSummary.topReadyReview.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateSourceActionReviewSuggestions}
                                        disabled={searchLearningRewriteSourceActionReviewSummary.topGenerationNeeded.length === 0 || processingSearchLearningId === 'source_action_review_generate'}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'source_action_review_generate'
                                            ? '생성 중...'
                                            : `AI 제안 생성 (${searchLearningRewriteSourceActionReviewSummary.topGenerationNeeded.length})`}
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ready Review</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceActionReviewSummary.readyReview}</p>
                                        <p className="mt-1 text-xs text-slate-400">새 AI 제안이 있어 바로 승인 가능한 action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Generation Needed</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceActionReviewSummary.generationNeeded}</p>
                                        <p className="mt-1 text-xs text-slate-400">AI 제안 생성부터 다시 필요한 action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Stable Follow-up</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceActionReviewSummary.stableFollowup}</p>
                                        <p className="mt-1 text-xs text-slate-400">지금은 유지하면서 관측만 보면 되는 action</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {searchLearningRewriteSourceActionReviewQueue.slice(0, 6).map((item) => {
                                        const toneClass =
                                            item.reviewState === 'ready_review'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                                : item.reviewState === 'generation_needed'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-200';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{item.source}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {item.title} · review {item.readyReviewCount} · generation {item.generationNeededCount}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${toneClass}`}>
                                                        {item.reviewState}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.reason}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topClusters.map((cluster) => (
                                                        <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {cluster}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topQueries.slice(0, 4).map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(
                                                        item.reviewState === 'ready_review' ? item.readyReviewEntryIds : item.entryIds,
                                                        `${item.source} / ${item.title} review query를 선택했습니다.`
                                                    )}
                                                    className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    review queue 선택
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {searchLearningRewriteSourceActionReviewQueue.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            아직 source action review queue가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Source Action Drafts</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            source ops 결과를 실제 운영 액션으로 변환한 draft입니다. rollback 후보는 바로 AI 재생성을 실행할 수 있습니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        drafts {searchLearningRewriteSourceActionDraftSummary.total}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.length}개의 승격 유지 확인 query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        승격 유지 선택 ({searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateSourceRollbackDraftSuggestions}
                                        disabled={searchLearningRewriteSourceActionDraftSummary.topRollbackRegenerate.length === 0 || processingSearchLearningId === 'source_ops_rollback_generate'}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'source_ops_rollback_generate'
                                            ? '재생성 중...'
                                            : `rollback AI 재생성 (${searchLearningRewriteSourceActionDraftSummary.topRollbackRegenerate.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.length}개의 샘플 대기 query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.length === 0}
                                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        샘플 대기 선택 ({searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.length})
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote Confirm</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceActionDraftSummary.promoteConfirm}</p>
                                        <p className="mt-1 text-xs text-slate-400">유지 확인만 필요한 source action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback Regenerate</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceActionDraftSummary.rollbackRegenerate}</p>
                                        <p className="mt-1 text-xs text-slate-400">AI 재생성이 필요한 source action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Observe</p>
                                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceActionDraftSummary.awaitingObserve}</p>
                                        <p className="mt-1 text-xs text-slate-400">실제 표본을 더 모아야 하는 source action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold Review</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceActionDraftSummary.holdReview}</p>
                                        <p className="mt-1 text-xs text-slate-400">유지하며 추가 검토할 source action</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {searchLearningRewriteSourceActionDrafts.slice(0, 6).map((draft) => {
                                        const toneClass =
                                            draft.action === 'promote_confirm'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                                : draft.action === 'rollback_regenerate'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                    : draft.action === 'awaiting_observe'
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';

                                        return (
                                            <div key={draft.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{draft.source}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {draft.title} · measured {draft.measured} · queries {draft.queryCount}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${toneClass}`}>
                                                        {draft.action}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{draft.reason}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {draft.topClusters.map((cluster) => (
                                                        <span key={`${draft.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {cluster}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {draft.topQueries.slice(0, 4).map((query) => (
                                                        <span key={`${draft.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(draft.entryIds, `${draft.source} / ${draft.title} query를 선택했습니다.`)}
                                                    className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    action draft 선택
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {searchLearningRewriteSourceActionDrafts.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            아직 source action draft가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Source Rollout Ops Summary</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            source/action 조합별로 승격, rollback, 표본 대기 후보를 묶어 한 번에 triage합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        tracked {searchLearningRewriteSourceOpsSummary.trackedSources}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceOpsSummary.topPromote.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceOpsSummary.topPromote.length}개의 승격 source ops query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceOpsSummary.topPromote.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        승격 ops 선택 ({searchLearningRewriteSourceOpsSummary.topPromote.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceOpsSummary.topRollback.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceOpsSummary.topRollback.length}개의 rollback source ops query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceOpsSummary.topRollback.length === 0}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        rollback ops 선택 ({searchLearningRewriteSourceOpsSummary.topRollback.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceOpsSummary.topAwaiting.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceOpsSummary.topAwaiting.length}개의 표본 대기 source ops query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceOpsSummary.topAwaiting.length === 0}
                                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        표본 대기 ops 선택 ({searchLearningRewriteSourceOpsSummary.topAwaiting.length})
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceOpsSummary.promoteSources}</p>
                                        <p className="mt-1 text-xs text-slate-400">source/action 기준 승격 후보</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceOpsSummary.holdSources}</p>
                                        <p className="mt-1 text-xs text-slate-400">유지하며 표본 관측 중인 source/action</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceOpsSummary.rollbackSources}</p>
                                        <p className="mt-1 text-xs text-slate-400">source/action 기준 rollback 후보</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceOpsSummary.awaitingSources}</p>
                                        <p className="mt-1 text-xs text-slate-400">새 표본을 기다리는 source/action</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {searchLearningRewriteSourceOps.slice(0, 6).map((item) => {
                                        const toneClass =
                                            item.action === 'promote'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                                : item.action === 'rollback'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                    : item.action === 'awaiting_samples'
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{item.source}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            drafts {item.draftCount} · clusters {item.clusterCount} · measured {item.measured}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${toneClass}`}>
                                                        {item.action}
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Improved Rate</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">{Math.round(item.avgImprovedRate * 100)}%</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">{item.noImprovement}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topClusters.map((cluster) => (
                                                        <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {cluster}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.topQueries.slice(0, 4).map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(item.entryIds, `${item.source} / ${item.action} source ops query를 선택했습니다.`)}
                                                    className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    source ops 선택
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {searchLearningRewriteSourceOps.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            아직 source ops summary가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold text-white">Semantic Coverage Clusters</h3>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        top {(data?.searchQualityCoverage.clusters || []).slice(0, 6).length}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                                    {(data?.searchQualityCoverage.clusters || []).slice(0, 6).map((cluster) => (
                                        <div key={cluster.clusterId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        total {cluster.totalQueries} · uncovered {cluster.uncoveredQueries.length}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSeedCoverageClusterQueries(cluster.clusterId, cluster.clusterLabel, cluster.uncoveredQueries.map((entry) => entry.query))}
                                                    disabled={cluster.uncoveredQueries.length === 0 || processingSearchLearningId === `seed_cluster_${cluster.clusterId}`}
                                                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    {processingSearchLearningId === `seed_cluster_${cluster.clusterId}`
                                                        ? '큐 적재 중...'
                                                        : `큐 추가 (${cluster.uncoveredQueries.length})`}
                                                </button>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">NAVER</p>
                                                    <p className="mt-2 text-lg font-black text-emerald-300">{Math.round(cluster.naverCoverageRate * 100)}%</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Full</p>
                                                    <p className="mt-2 text-lg font-black text-violet-300">{Math.round(cluster.fullCoverageRate * 100)}%</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {cluster.uncoveredQueries.slice(0, 3).map((entry) => (
                                                    <span key={`${cluster.clusterId}_${entry.query}`} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
                                                        {entry.query}
                                                    </span>
                                                ))}
                                                {cluster.uncoveredQueries.length === 0 && (
                                                    <span className="text-xs text-slate-500">현재 uncovered query가 없습니다.</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {(data?.searchQualityCoverage.uncoveredQueries || []).slice(0, 6).map((entry) => (
                                    <div key={entry.query} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-sm font-semibold text-white">{entry.query}</p>
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">NAVER Missing</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {entry.naverMissing.length > 0 ? entry.naverMissing.map((query) => (
                                                        <span key={`${entry.query}_naver_${query}`} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
                                                            {query}
                                                        </span>
                                                    )) : (
                                                        <span className="text-xs text-slate-500">none</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Global Missing</p>
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    {entry.globalMissing.length > 0 ? entry.globalMissing.map((query) => (
                                                        <span key={`${entry.query}_global_${query}`} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100">
                                                            {query}
                                                        </span>
                                                    )) : (
                                                        <span className="text-xs text-slate-500">none</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(data?.searchQualityCoverage.uncoveredQueries || []).length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                        현재 curated 검색어 평가셋은 모두 커버되고 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Health</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        terminal workflow의 현재 건강 상태를 score와 blocker 기준으로 요약한 섹션입니다. 긴급도 판단은 여기서, 실제 액션은 아래 alerts/runbook에서 바로 시작하면 됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-200">
                                        score {searchLearningTerminalHealth.score}
                                    </span>
                                    <span className={`rounded-full border px-3 py-1 ${
                                        searchLearningTerminalHealth.label === 'critical'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : searchLearningTerminalHealth.label === 'warning'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : searchLearningTerminalHealth.label === 'monitoring'
                                                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                    }`}>
                                        {searchLearningTerminalHealth.label}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-sm font-semibold text-white">{searchLearningTerminalHealth.summary}</p>
                                    <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                                        {searchLearningTerminalHealth.nextCheck}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Blockers</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {searchLearningTerminalHealth.blockers.length > 0 ? (
                                            searchLearningTerminalHealth.blockers.map((blocker) => (
                                                <span
                                                    key={blocker}
                                                    className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200"
                                                >
                                                    {blocker}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                                                blocker 없음
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Metrics</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        최근 search-learning 운영량과 terminal backlog를 같이 보는 요약입니다. health 점수만 보지 않고 실제 review/generate/reviewed 추세가 살아 있는지 여기서 먼저 확인합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        active days {searchLearningTerminalMetrics.activeDays}/7
                                    </span>
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                                        backlog {searchLearningTerminalMetrics.backlogPressure}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        critical {searchLearningTerminalMetrics.criticalAlerts}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Action Load</p>
                                        <p className="mt-3 text-3xl font-black text-cyan-100">{searchLearningTerminalMetrics.actionLoad}</p>
                                        <p className="mt-2 text-xs text-slate-400">review/draft/generate/retrain이 몰린 현재 작업량</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recent Generated</p>
                                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningTerminalMetrics.recentGenerated}</p>
                                        <p className="mt-2 text-xs text-slate-400">최근 7일간 생성된 AI suggestion 수</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recent Reviewed</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalMetrics.recentReviewed}</p>
                                        <p className="mt-2 text-xs text-slate-400">최근 7일간 review에 들어간 query 수</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved / Ignored</p>
                                        <p className="mt-3 text-3xl font-black text-white">
                                            {searchLearningTerminalMetrics.recentApproved}
                                            <span className="mx-2 text-slate-500">/</span>
                                            <span className="text-slate-300">{searchLearningTerminalMetrics.recentIgnored}</span>
                                        </p>
                                        <p className="mt-2 text-xs text-slate-400">최근 7일간 승인과 무시 처리의 비율</p>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex flex-wrap gap-2 text-[11px]">
                                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                            generated {searchLearningTerminalMetrics.recentGenerated}
                                        </span>
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                            reviewed {searchLearningTerminalMetrics.recentReviewed}
                                        </span>
                                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                            approved {searchLearningTerminalMetrics.recentApproved}
                                        </span>
                                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                                            health score {searchLearningTerminalMetrics.healthScore}
                                        </span>
                                    </div>
                                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-7">
                                        {searchLearningTerminalMetrics.trend.map((point) => {
                                            const total = point.seeded + point.generated + point.reviewed;
                                            const relativeHeight = total > 0
                                                ? Math.max(18, Math.round((total / searchLearningTerminalMetricsMaxDailyTotal) * 100))
                                                : 8;
                                            return (
                                                <div key={point.day} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                                        {point.day.slice(5)}
                                                    </p>
                                                    <div className="mt-3 flex h-24 items-end">
                                                        <div
                                                            className="w-full rounded-2xl border border-cyan-500/30 bg-cyan-500/10"
                                                            style={{ height: `${relativeHeight}%` }}
                                                        />
                                                    </div>
                                                    <p className="mt-3 text-xl font-black text-white">{total}</p>
                                                    <div className="mt-2 space-y-1 text-[10px] text-slate-400">
                                                        <p>seed {point.seeded}</p>
                                                        <p>gen {point.generated}</p>
                                                        <p>review {point.reviewed}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Coverage</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        terminal surface에서 실제 검색 품질 상태를 보는 요약입니다. curated coverage와 semantic cluster impact를 같이 봐서 지금 품질 병목이 데이터 부족인지, coverage gap인지, retrain 이슈인지 바로 판단합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        score {searchLearningTerminalCoverage.coverageScore}
                                    </span>
                                    <span className={`rounded-full border px-3 py-1 ${
                                        searchLearningTerminalCoverage.qualityLabel === 'strong'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : searchLearningTerminalCoverage.qualityLabel === 'mixed'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                    }`}>
                                        {searchLearningTerminalCoverage.qualityLabel}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Coverage Score</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalCoverage.coverageScore}</p>
                                    <p className="mt-2 text-xs text-slate-400">coverage + impact를 합친 terminal 품질 점수</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Uncovered Queries</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningTerminalCoverage.uncoveredQueries}</p>
                                    <p className="mt-2 text-xs text-slate-400">curated 평가셋에서 아직 비는 query 수</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Uncovered Clusters</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningTerminalCoverage.uncoveredClusters}</p>
                                    <p className="mt-2 text-xs text-slate-400">semantic cluster 단위의 coverage 공백</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Improved Clusters</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalCoverage.improvedClusters}</p>
                                    <p className="mt-2 text-xs text-slate-400">impact 기준 개선 확인된 cluster 수</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Tuning</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningTerminalCoverage.needsAttentionClusters}</p>
                                    <p className="mt-2 text-xs text-slate-400">여전히 retrain/조정이 필요한 cluster 수</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                {searchLearningTerminalCoverage.focusAreas.map((item) => {
                                    const toneClass =
                                        item.tone === 'emerald'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.tone === 'sky'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : item.tone === 'amber'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : item.tone === 'rose'
                                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                        : 'border-slate-700 bg-slate-950/70 text-slate-200';

                                    return (
                                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
                                                        {item.label}
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {item.count}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Trends</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        최근 7일 메트릭을 `pace / backlog / approval quality` 관점으로 다시 압축한 섹션입니다. 오늘 어떤 lane를 먼저 밀어야 하는지 terminal surface에서 바로 판단할 수 있게 합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-100">
                                        pace {searchLearningTerminalTrends.paceLabel}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        backlog {searchLearningTerminalTrends.backlogLabel}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        approval {searchLearningTerminalTrends.approvalLabel}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                {searchLearningTerminalTrends.focusAreas.map((item) => {
                                    const toneClass =
                                        item.tone === 'emerald'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.tone === 'sky'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : item.tone === 'amber'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : item.tone === 'rose'
                                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                        : 'border-slate-700 bg-slate-950/70 text-slate-200';

                                    return (
                                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
                                                        {item.label}
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {item.count}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Watchlist</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        지금 바로 처리할 query를 `ops center + impact + workflow`에서 추려서 보여주는 terminal triage 목록입니다. health와 trend를 본 뒤 실제 액션은 여기서 바로 시작하면 됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        critical {searchLearningTerminalWatchlist.critical}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        high {searchLearningTerminalWatchlist.high}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        medium {searchLearningTerminalWatchlist.medium}
                                    </span>
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                                        total {searchLearningTerminalWatchlist.total}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {searchLearningTerminalWatchlist.items.map((item) => {
                                    const toneClass =
                                        item.priority === 'critical'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : item.priority === 'high'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : item.priority === 'medium'
                                                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                    : 'border-slate-700 bg-slate-950/70 text-slate-200';

                                    return (
                                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
                                                        {item.priority}
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {item.metricLabel}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {item.queries.length > 0 ? item.queries.map((query) => (
                                                    <span
                                                        key={`${item.id}:${query}`}
                                                        className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200"
                                                    >
                                                        {query}
                                                    </span>
                                                )) : (
                                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-300">
                                                        query 묶음 {item.count}건
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSearchLearningTerminalAction(item.action)}
                                                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100"
                                                >
                                                    {item.action.actionLabel}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        selectSearchLearningEntries(
                                                            item.entryIds,
                                                            `${item.title} query를 선택했습니다.`
                                                        )
                                                    }
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            {searchLearningTerminalWatchlist.items.length === 0 && (
                                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                                    terminal watchlist에 올릴 즉시 처리 query가 없습니다.
                                </div>
                            )}
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Checklist</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        terminal workflow에서 지금 남아 있는 운영 항목을 `done / open / active`로 바로 보는 체크리스트입니다. health가 나빠 보일 때 어떤 항목이 실제로 남았는지 여기서 확인하면 됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        done {searchLearningTerminalChecklist.completed}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        open {searchLearningTerminalChecklist.open}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        active {searchLearningTerminalChecklist.active}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {searchLearningTerminalChecklist.items.map((item) => {
                                    const toneClass =
                                        item.status === 'done'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.status === 'active'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                    return (
                                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
                                                        {item.status}
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {item.count}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Alerts</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        terminal workflow에서 지금 가장 긴급한 병목을 severity 기준으로 압축한 경보 레이어입니다. review backlog, draft backlog, retrain, sample collection을 먼저 봅니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        critical {searchLearningTerminalAlerts.critical}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        warning {searchLearningTerminalAlerts.warning}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        info {searchLearningTerminalAlerts.info}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        success {searchLearningTerminalAlerts.success}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {searchLearningTerminalAlerts.topAlerts.map((alert) => {
                                    const toneClass =
                                        alert.severity === 'critical'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : alert.severity === 'warning'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : alert.severity === 'info'
                                                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                    : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';

                                    return (
                                        <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
                                                        {alert.severity}
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-white">{alert.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {alert.count}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{alert.description}</p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {alert.action ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => void handleSearchLearningTerminalAction(alert.action)}
                                                            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100"
                                                        >
                                                            {alert.action.actionLabel}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                selectSearchLearningEntries(
                                                                    alert.action?.entryIds || [],
                                                                    `${alert.title} query를 선택했습니다.`
                                                                )
                                                            }
                                                            className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                        >
                                                            queue 선택
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-bold text-slate-300">
                                                        추가 액션 없음
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Runbook</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        지금 운영자가 가장 먼저 해야 할 action과, 그 다음 확인 순서를 세 단계로 압축한 runbook입니다. 깊은 chain을 다시 따라가기 전에 여기서 바로 시작하면 됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        {searchLearningTerminalRunbook.stateLabel}
                                    </span>
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                                        pending {searchLearningTerminalWorkflow.pending}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        drafts {searchLearningTerminalWorkflow.drafts}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                                <p className="text-lg font-bold text-white">{searchLearningTerminalRunbook.headline}</p>
                                <p className="mt-2 text-sm leading-7 text-slate-300">{searchLearningTerminalRunbook.summary}</p>
                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
                                    {searchLearningTerminalRunbook.followUp}
                                </p>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                {searchLearningTerminalRunbook.steps.map((step) => {
                                    const toneClass =
                                        step.tone === 'emerald'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : step.tone === 'sky'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : step.tone === 'rose'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                    : step.tone === 'amber'
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                        : 'border-slate-700 bg-slate-950/70 text-slate-200';

                                    return (
                                        <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
                                                {step.tone}
                                            </span>
                                            <p className="mt-3 text-sm font-semibold text-white">{step.title}</p>
                                            <p className="mt-2 text-xs leading-6 text-slate-400">{step.description}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {searchLearningTerminalRunbook.primaryAction ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void handleSearchLearningTerminalAction(searchLearningTerminalRunbook.primaryAction)}
                                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-100"
                                        >
                                            {searchLearningTerminalRunbook.primaryAction.actionLabel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                selectSearchLearningEntries(
                                                    searchLearningTerminalRunbook.primaryAction?.entryIds || [],
                                                    `${searchLearningTerminalRunbook.primaryAction?.title || 'Terminal Runbook'} query를 선택했습니다.`
                                                )
                                            }
                                            className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200"
                                        >
                                            queue 선택
                                        </button>
                                    </>
                                ) : (
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-xs font-bold text-slate-300">
                                        추가 액션 없음
                                    </span>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Terminal Command Center</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        `/admin`에서 실제로 먼저 처리할 search-learning 액션만 묶은 terminal 요약입니다. draft review, review pending, AI 생성, 재학습, 표본 수집을 여기서 바로 시작하고, 깊은 chain은 필요할 때만 펼치세요.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        state {searchLearningTerminalWorkflow.state}
                                    </span>
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                                        pending {searchLearningTerminalWorkflow.pending}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        drafts {searchLearningTerminalWorkflow.drafts}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        improved {searchLearningTerminalWorkflow.improved}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        tuning {searchLearningTerminalWorkflow.noImprovement}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Draft Review</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningTerminalWorkflow.drafts}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">AI draft가 이미 붙은 pending query</p>
                                </div>
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalWorkflow.reviewNow}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 query</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Generate Now</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningTerminalWorkflow.generateNow}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">AI suggestion이 필요한 query</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningTerminalWorkflow.retrainNow}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">승인 후에도 개선이 부족한 query</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningTerminalWorkflow.sampleCollection}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">추가 관찰이 필요한 query</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningTerminalWorkflow.topActions.map((action) => {
                                    const toneClass =
                                        action.tone === 'emerald'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : action.tone === 'sky'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : action.tone === 'rose'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                    : action.tone === 'amber'
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                        : 'border-slate-700 bg-slate-950/70 text-slate-200';

                                    return (
                                        <div key={action.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${toneClass}`}>
                                                        {action.kind}
                                                    </span>
                                                    <p className="mt-3 text-sm font-semibold text-white">{action.title}</p>
                                                    <p className="mt-1 text-xs text-slate-400">{action.description}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {action.count} queries
                                                </span>
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSearchLearningTerminalAction(action)}
                                                    className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                                >
                                                    {action.actionLabel}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningTerminalWorkflow.topActions.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        지금은 terminal workflow에서 즉시 처리할 항목이 없습니다. 실제 검색을 더 쌓거나 `Search Learning Queue`에서 새 draft를 생성하면 여기서 다시 triage할 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Advanced Playbook Chain</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        playbook recommendation의 깊은 outcome/recommendation 반복 체인은 기본 화면에서 숨깁니다. 일반 운영은 `Playbooks`, `Playbook Activity`, `Playbook Outcomes`, `Playbook Recommendations` 중심으로 처리하고, 상세 추적이 필요할 때만 아래 chain을 펼치세요.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedPlaybookChain((current) => !current)}
                                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200"
                                >
                                    {showAdvancedPlaybookChain ? 'Advanced Playbook Chain 접기' : 'Advanced Playbook Chain 펼치기'}
                                </button>
                            </div>
                        </section>

                        {showAdvancedPlaybookChain && (
                        <>
                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Activity</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        outcome recommendation outcome recommendation queue에서 실제로 실행된 review/retrain activity를 최근 이력으로 보여주고, 같은 recommendation을 다시 실행하거나 queue로 넘길 수 있게 합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        runs {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.retrainRuns}
                                    </span>
                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        queries {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'review_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
                                    const recommendation = [
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
                                    ].find((candidate) => candidate.outcomeId === run.outcomeId);

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.count} entries
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {formatTime(run.createdAt)} · {run.context}
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.priority}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {recommendation && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        동일 outcome recommendation outcome recommendation 실행
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 outcome recommendation outcome recommendation queue 실행 activity가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        outcome recommendation outcome recommendation activity가 실제로 review 가능한 draft로 이어졌는지, 재학습이 더 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        validated {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.validated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ready Review</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.readyReview}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.needsAttention}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Validated</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.validated}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topValidated,
                                ]
                                    .slice(0, 6)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {outcome.entryIds.length} queries
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(outcome.createdAt)} · {outcome.context}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 outcome recommendation outcome recommendation activity outcome이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        후속 outcome recommendation activity 결과를 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상을 바로 처리할 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.retrainNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        observe {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.reviewNow}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Retrain Now</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.retrainNow}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Collect Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.collectSamples}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.observe}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topReviewNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topRetrainNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topCollectSamples,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.action === 'review_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : recommendation.action === 'retrain_now'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : recommendation.action === 'collect_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.action}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(recommendation.createdAt)} · {recommendation.outcomeStatus}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {recommendation.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.title} recommendation query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 outcome recommendation outcome recommendation recommendation이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Queue</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        후속 outcome triage 추천을 `즉시 실행 / review / 표본 수집 / 관찰` 큐로 다시 정렬합니다. 운영자는 이 큐만 보고 우선순위 처리를 이어가면 됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.needsReview}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.sampleCollection}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        urgent {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.urgent}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topExecuteNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topNeedsReview,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topSampleCollection,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((item) => {
                                        const badgeClass = item.queueState === 'execute_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.queueState === 'needs_review'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : item.queueState === 'sample_collection'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-slate-700 bg-slate-950/70 text-slate-300';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.queueState}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(item.createdAt)} · {item.outcomeStatus}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {item.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const recommendation = [
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
                                                            ].find((candidate) => candidate.id === item.recommendationId);
                                                            if (recommendation) {
                                                                void handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction(recommendation);
                                                            }
                                                        }}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)
                                                        }
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 실행 가능한 outcome recommendation outcome recommendation queue가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>
                        </>
                        )}

                        <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Summary</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        현재 deepest search learning ops 체인을 한 번에 닫는 terminal summary입니다. 운영자는 여기서 즉시 실행, review, 표본 수집, 관찰, 안정화 상태를 바로 판단하면 됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        state {searchLearningOpsCompletionSummary.state}
                                    </span>
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionSummary.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        immediate {searchLearningOpsCompletionSummary.immediateCount}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        sampling {searchLearningOpsCompletionSummary.sampleCollection}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        stable signals {searchLearningOpsCompletionSummary.stableSignals}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Execute Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">
                                        {searchLearningOpsCompletionSummary.executeNow}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Review</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">
                                        {searchLearningOpsCompletionSummary.needsReview}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sample Collection</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">
                                        {searchLearningOpsCompletionSummary.sampleCollection}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe</p>
                                    <p className="mt-3 text-3xl font-black text-slate-100">
                                        {searchLearningOpsCompletionSummary.observe}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Validated</p>
                                    <p className="mt-3 text-3xl font-black text-cyan-100">
                                        {searchLearningOpsCompletionSummary.validated}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                {[
                                    ...searchLearningOpsCompletionSummary.topImmediate,
                                    ...searchLearningOpsCompletionSummary.topSampling,
                                    ...searchLearningOpsCompletionSummary.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((item) => {
                                        const badgeClass = item.state === 'action_required'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.state === 'review_required'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : item.state === 'sampling'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : item.state === 'monitoring'
                                                        ? 'border-slate-700 bg-slate-950/70 text-slate-300'
                                                        : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.state}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(item.createdAt)} · {item.outcomeStatus}
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const recommendation = [
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topReviewNow,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topRetrainNow,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topCollectSamples,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topObserve,
                                                            ].find((candidate) => candidate.id === item.recommendationId);
                                                            if (recommendation) {
                                                                void handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationAction(recommendation);
                                                            }
                                                        }}
                                                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title} terminal summary query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionSummary.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                        현재 search learning ops 체인은 안정 상태입니다. 새 action item이 생기면 여기에서 바로 노출됩니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Actions</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        terminal summary를 실제 batch 실행 단위로 다시 묶은 섹션입니다. 운영자는 여기서 즉시 AI 제안, 즉시 승인, 표본 수집, 관찰 액션을 바로 실행하면 됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionActions.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsCompletionActions.executeNow}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        review {searchLearningOpsCompletionActions.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionActions.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionActions.observeNow}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {searchLearningOpsCompletionActions.topActions.map((action) => {
                                    const badgeClass = action.type === 'execute_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : action.type === 'review_now'
                                            ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                            : action.type === 'collect_samples'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                    return (
                                        <div key={action.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {action.type}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {action.priority}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{action.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {action.queryCount} queries
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{action.description}</p>
                                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                {action.reason}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {action.queries.slice(0, 8).map((query) => (
                                                    <span key={`${action.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSearchLearningOpsCompletionAction(action)}
                                                    className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                                >
                                                    {action.actionLabel}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(action.entryIds, `${action.title}의 ${action.entryIds.length}개 query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionActions.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        현재 terminal completion action이 없습니다. 상단 `Completion Summary`가 stable이면 추가 조치가 필요하지 않습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Queue</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion action을 실제 운영 우선순위 큐로 다시 정렬한 섹션입니다. execute/review를 먼저 처리하고, sample/observe는 후순위로 바로 넘길 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionQueue.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        urgent {searchLearningOpsCompletionQueue.urgent}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsCompletionQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        review {searchLearningOpsCompletionQueue.needsReview}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionQueue.sampleCollection}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionQueue.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {searchLearningOpsCompletionQueue.topItems.map((item) => {
                                    const badgeClass = item.queueState === 'execute_now'
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                        : item.queueState === 'needs_review'
                                            ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                            : item.queueState === 'sample_collection'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                    return (
                                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {item.queueState}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {item.priority}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {item.queryCount} queries
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                {item.reason}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {item.queries.slice(0, 8).map((query) => (
                                                    <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => void handleSearchLearningOpsCompletionQueueItem(item)}
                                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                >
                                                    {item.actionLabel}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                                        현재 completion queue가 비어 있습니다. 상단 `Completion Actions`가 모두 소진되면 추가 우선순위 처리가 필요하지 않습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Advanced Search Learning Chain</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        completion workflow의 깊은 중간 단계는 기본 화면에서 숨깁니다. 일반 운영은 `Completion Summary`, `Completion Actions`, `Completion Queue`, terminal recommendations만으로 처리하고, 필요할 때만 아래 상세 chain을 펼치세요.
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAdvancedSearchLearningChain((current) => !current)}
                                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200"
                                >
                                    {showAdvancedSearchLearningChain ? 'Advanced Chain 접기' : 'Advanced Chain 펼치기'}
                                </button>
                            </div>
                        </section>

                        {showAdvancedSearchLearningChain && (
                        <>
                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Activity</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion queue에서 실제 실행된 `즉시 AI 제안 / 즉시 승인` 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 아래 queue로 넘길 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total runs {searchLearningOpsCompletionActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsCompletionActivity.executeRuns}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        review {searchLearningOpsCompletionActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        queries {searchLearningOpsCompletionActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {searchLearningOpsCompletionActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'execute_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.priority}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.count} items
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                {formatTime(run.createdAt)} · {run.context}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} 실행 query를 선택했습니다.`)}
                                                    className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                                        아직 completion activity가 없습니다. `Completion Queue`에서 액션을 실행하면 여기에 최근 이력이 쌓입니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어 보여줍니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        ready {searchLearningOpsCompletionOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        attention {searchLearningOpsCompletionOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionOutcomes.awaitingSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        validated {searchLearningOpsCompletionOutcomes.validated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[...searchLearningOpsCompletionOutcomes.topReadyReview, ...searchLearningOpsCompletionOutcomes.topNeedsAttention, ...searchLearningOpsCompletionOutcomes.topAwaitingSamples, ...searchLearningOpsCompletionOutcomes.topValidated]
                                    .slice(0, 8)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {outcome.action}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    improved {outcome.improvedCount} · no improvement {outcome.noImprovementCount} · awaiting {outcome.awaitingSamplesCount}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion outcome이 없습니다. `Completion Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion outcome을 바로 실행 가능한 triage 액션으로 다시 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendations.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendations.retrainNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendations.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendations.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendations.topReviewNow,
                                    ...searchLearningOpsCompletionRecommendations.topRetrainNow,
                                    ...searchLearningOpsCompletionRecommendations.topCollectSamples,
                                    ...searchLearningOpsCompletionRecommendations.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.action === 'review_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : recommendation.action === 'retrain_now'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : recommendation.action === 'collect_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.action}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendation(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.title} completion recommendation query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation이 없습니다. `Completion Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-teal-500/20 bg-teal-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Queue</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation을 실제 운영 우선순위로 다시 정렬합니다. execute, review, sample, observe 순으로 바로 처리할 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationQueue.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        execute {searchLearningOpsCompletionRecommendationQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationQueue.needsReview}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationQueue.sampleCollection}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationQueue.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationQueue.topExecuteNow,
                                    ...searchLearningOpsCompletionRecommendationQueue.topNeedsReview,
                                    ...searchLearningOpsCompletionRecommendationQueue.topSampleCollection,
                                    ...searchLearningOpsCompletionRecommendationQueue.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((item) => {
                                        const badgeClass = item.queueState === 'execute_now'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : item.queueState === 'needs_review'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                                : item.queueState === 'sample_collection'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.queueState}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationQueueItem(item)}
                                                        className="rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation queue가 없습니다. `Completion Recommendations`가 쌓이면 여기에서 운영 우선순위로 바로 처리할 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Activity</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation queue에서 실제로 실행된 review/retrain 이력을 모읍니다. 최근 실행 query를 다시 queue로 넘겨 후속 triage로 이어갈 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.retrainRuns}
                                    </span>
                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        queries {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total Runs</p>
                                    <p className="mt-3 text-3xl font-black text-white">
                                        {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.totalRuns}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Runs</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">
                                        {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.reviewRuns}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Retrain Runs</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">
                                        {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.retrainRuns}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Unique Queries</p>
                                    <p className="mt-3 text-3xl font-black text-slate-100">
                                        {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.uniqueQueries}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'review_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.priority}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {run.createdAt.slice(0, 16).replace('T', ' ')}
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.count} actions
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                                    className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-xs font-bold text-fuchsia-100"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 completion recommendation outcome recommendation activity가 없습니다. `Completion Recommendation Outcome Recommendation Queue`에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 볼 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>
                        </>
                        )}

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어봅니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        ready review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        needs attention {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        awaiting {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        validated {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.validated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topValidated,
                                ]
                                    .slice(0, 8)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {outcome.entryIds.length} queries
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome이 없습니다. `Completion Recommendation Outcome Recommendation Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-lime-500/20 bg-lime-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.retrainNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.action === 'review_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : recommendation.action === 'retrain_now'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : recommendation.action === 'collect_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.action}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation(recommendation)}
                                                        className="rounded-full border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs font-bold text-lime-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.title} completion recommendation outcome recommendation outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome recommendation이 없습니다. `Completion Recommendation Outcome Recommendation Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Queue</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        가장 최근 completion recommendation outcome recommendation outcome recommendation 액션을 `execute / review / sample / observe` 우선순위 큐로 정렬합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.needsReview}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.sampleCollection}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topExecuteNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topNeedsReview,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topSampleCollection,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((item) => {
                                        const badgeClass = item.queueState === 'execute_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.queueState === 'needs_review'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : item.queueState === 'sample_collection'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.queueState}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem(item)}
                                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome recommendation queue가 없습니다. `...Outcome Recommendations`가 쌓이면 여기에서 우선순위 큐로 정렬됩니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Activity</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation outcome recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        runs {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.retrainRuns}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        queries {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'review_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.priority}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.count} items
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                {formatTime(run.createdAt)} · {run.context}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} queue query를 선택했습니다.`)}
                                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                                        아직 completion recommendation outcome recommendation outcome recommendation activity가 없습니다. `...Queue`에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 볼 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation outcome recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어봅니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        ready review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        needs attention {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        awaiting {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        validated {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.validated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topValidated,
                                ]
                                    .slice(0, 8)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : outcome.status === 'needs_attention'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : outcome.status === 'awaiting_samples'
                                                ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                        <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {outcome.status}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {outcome.entryIds.length} queries
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {outcome.queries.map((query) => (
                                                    <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome recommendation outcomes가 없습니다. `...Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-lime-500/20 bg-lime-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation outcome recommendation outcomes를 다시 `review / retrain / sample / observe` 액션으로 분류해서 바로 실행할 수 있게 정리합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.retrainNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topReviewNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topRetrainNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topCollectSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.action === 'review_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : recommendation.action === 'retrain_now'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : recommendation.action === 'collect_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.action}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation(recommendation)}
                                                        className="rounded-full border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs font-bold text-lime-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.title} completion recommendation outcome recommendation outcome recommendation query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome recommendation recommendations가 없습니다. `...Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Queue</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        가장 최근 completion recommendation outcome recommendation outcome recommendation recommendation 액션을 `execute / review / sample / observe` 우선순위 큐로 정렬합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.needsReview}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.sampleCollection}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topExecuteNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topNeedsReview,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topSampleCollection,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((item) => {
                                        const badgeClass = item.queueState === 'execute_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.queueState === 'needs_review'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : item.queueState === 'sample_collection'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.queueState}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem(item)}
                                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome recommendation recommendation queue가 없습니다. `...Recommendations`가 쌓이면 여기에서 우선순위 큐로 정렬됩니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Activity</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation outcome recommendation recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 바로 queue로 넘길 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total runs {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.retrainRuns}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        queries {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'review_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.priority}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                                        아직 completion recommendation outcome recommendation outcome recommendation recommendation activity가 없습니다. queue에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 확인할 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        직전 recommendation recommendation activity가 실제로 review-ready, retrain-needed, sample pending, validated 중 어디로 이어졌는지 다시 묶어 보여줍니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        ready review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        needs attention {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        awaiting {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.awaitingSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        validated {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.validated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topReadyReview,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topNeedsAttention,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topAwaitingSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topValidated,
                                ]
                                    .slice(0, 8)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome recommendation recommendation outcomes가 없습니다. activity가 쌓이면 여기에서 후속 상태를 다시 확인할 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        terminal layer입니다. 직전 outcomes를 `review / retrain / collect samples / observe` 액션으로 다시 묶되, 여기서 더 깊은 queue 체인은 만들지 않고 운영 액션으로 바로 닫습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.retrainNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topReviewNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topRetrainNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topCollectSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.action === 'review_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : recommendation.action === 'retrain_now'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : recommendation.action === 'collect_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.action}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation(recommendation)}
                                                        className="rounded-full border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs font-bold text-lime-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.title} terminal recommendation query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation outcome recommendation recommendation recommendations가 없습니다. outcomes가 쌓이면 여기에서 terminal action으로 바로 닫을 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        {showAdvancedSearchLearningChain && (
                        <>
                        <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Activity</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 바로 queue로 넘길 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total runs {searchLearningOpsCompletionRecommendationActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationActivity.retrainRuns}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        queries {searchLearningOpsCompletionRecommendationActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {searchLearningOpsCompletionRecommendationActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'review_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.priority}
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.count} items
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                {formatTime(run.createdAt)} · {run.context}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsCompletionRecommendationActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                                        아직 completion recommendation activity가 없습니다. `Completion Recommendation Queue`에서 액션을 실행하면 여기에 최근 이력이 쌓입니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어 보여줍니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        ready {searchLearningOpsCompletionRecommendationOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        attention {searchLearningOpsCompletionRecommendationOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomes.awaitingSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        validated {searchLearningOpsCompletionRecommendationOutcomes.validated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomes.topReadyReview,
                                    ...searchLearningOpsCompletionRecommendationOutcomes.topNeedsAttention,
                                    ...searchLearningOpsCompletionRecommendationOutcomes.topAwaitingSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomes.topValidated,
                                ]
                                    .slice(0, 8)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {outcome.action}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    improved {outcome.improvedCount} · no improvement {outcome.noImprovementCount} · awaiting {outcome.awaitingSamplesCount}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} recommendation outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome이 없습니다. `Completion Recommendation Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-lime-500/20 bg-lime-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendations.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendations.retrainNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomeRecommendations.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationOutcomeRecommendations.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topReviewNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topRetrainNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topCollectSamples,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendations.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.action === 'review_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : recommendation.action === 'retrain_now'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : recommendation.action === 'collect_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.action}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationOutcomeRecommendation(recommendation)}
                                                        className="rounded-full border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs font-bold text-lime-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.title} completion recommendation outcome recommendation query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation이 없습니다. `Completion Recommendation Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-teal-500/20 bg-teal-500/5 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Queue</h2>
                                    <p className="mt-2 text-sm text-slate-300">
                                        completion recommendation outcome recommendation을 실제 운영 우선순위로 다시 정렬합니다. execute, review, sample, observe 순으로 바로 처리할 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        execute {searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.needsReview}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.sampleCollection}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                        observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.topExecuteNow,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.topNeedsReview,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.topSampleCollection,
                                    ...searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.topObserve,
                                ]
                                    .slice(0, 8)
                                    .map((item) => {
                                        const badgeClass = item.queueState === 'execute_now'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : item.queueState === 'needs_review'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                                : item.queueState === 'sample_collection'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.queueState}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem(item)}
                                                        className="rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                                        아직 completion recommendation outcome recommendation queue가 없습니다. `Completion Recommendation Outcome Recommendations`가 쌓이면 여기에서 운영 우선순위로 바로 처리할 수 있습니다.
                                    </div>
                                )}
                            </div>
                        </section>
                        </>
                        )}

                        {showAdvancedPlaybookChain && (
                        <>
                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        후속 outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상을 바로 처리할 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.retrainNow}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.reviewNow}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.collectSamples}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        observe {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.observe}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.reviewNow}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Retrain Now</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.retrainNow}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Collect Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.collectSamples}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">
                                        {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.observe}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.action === 'review_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : recommendation.action === 'retrain_now'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : recommendation.action === 'collect_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.action}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {recommendation.reason}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {recommendation.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span
                                                            key={`${recommendation.id}_${query}`}
                                                            className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200"
                                                        >
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => void handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationAction(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            selectSearchLearningEntries(
                                                                recommendation.entryIds,
                                                                `${recommendation.title} outcome recommendation outcome query를 선택했습니다.`
                                                            )
                                                        }
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 outcome recommendation outcome 후속 추천이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Activity</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        recommendation queue에서 실제로 실행된 review/retrain activity를 추적해서, 동일 outcome 재실행과 queue 후속 조치를 바로 이어갈 수 있습니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total runs {searchLearningOpsPlaybookRecommendationActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookRecommendationActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsPlaybookRecommendationActivity.retrainRuns}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        unique queries {searchLearningOpsPlaybookRecommendationActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Total Runs</p>
                                    <p className="mt-3 text-3xl font-black text-white">{searchLearningOpsPlaybookRecommendationActivity.totalRuns}</p>
                                    <p className="mt-1 text-xs text-slate-500">recommendation queue 실행 기록</p>
                                </div>
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Runs</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationActivity.reviewRuns}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 실행 횟수</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Runs</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendationActivity.retrainRuns}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">재학습 AI 제안 실행 횟수</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Unique Queries</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationActivity.uniqueQueries}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">activity가 다룬 query 수</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningOpsPlaybookRecommendationActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'review_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
                                    const recommendation = [
                                        ...searchLearningOpsPlaybookRecommendations.topReviewNow,
                                        ...searchLearningOpsPlaybookRecommendations.topRetrainNow,
                                        ...searchLearningOpsPlaybookRecommendations.topCollectSamples,
                                        ...searchLearningOpsPlaybookRecommendations.topObserve,
                                    ].find((candidate) => candidate.outcomeId === run.outcomeId);

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.entryIds.length} queries
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {formatTime(run.createdAt)}{run.actorUid ? ` · ${run.actorUid}` : ''}
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.actionLabel}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {recommendation && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchLearningOpsPlaybookRecommendationAction(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        동일 recommendation 실행
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsPlaybookRecommendationActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 recommendation queue 실행 activity가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        recommendation activity가 실제로 `review 가능 / 재학습 필요 / 표본 대기 / 안정화` 중 어디에 있는지 다시 분류해서 후속 triage를 바로 탈 수 있게 합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        attention {searchLearningOpsPlaybookRecommendationOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        awaiting {searchLearningOpsPlaybookRecommendationOutcomes.awaitingSamples}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Ready Review</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationOutcomes.readyReview}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 recommendation outcome</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Needs Attention</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendationOutcomes.needsAttention}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">재학습 또는 rewrite 조정 필요</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Awaiting Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationOutcomes.awaitingSamples}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 recommendation outcome</p>
                                </div>
                                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Validated</p>
                                    <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookRecommendationOutcomes.validated}</p>
                                    <p className="mt-1 text-xs text-slate-400">안정적으로 개선된 outcome</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomes.topReadyReview,
                                    ...searchLearningOpsPlaybookRecommendationOutcomes.topNeedsAttention,
                                    ...searchLearningOpsPlaybookRecommendationOutcomes.topAwaitingSamples,
                                    ...searchLearningOpsPlaybookRecommendationOutcomes.topValidated,
                                ]
                                    .slice(0, 6)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-slate-700 bg-slate-950/70 text-slate-300';
                                        const recommendation = [
                                            ...searchLearningOpsPlaybookRecommendations.topReviewNow,
                                            ...searchLearningOpsPlaybookRecommendations.topRetrainNow,
                                            ...searchLearningOpsPlaybookRecommendations.topCollectSamples,
                                            ...searchLearningOpsPlaybookRecommendations.topObserve,
                                        ].find((candidate) => candidate.outcomeId === outcome.outcomeId);

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {outcome.entryIds.length} queries
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(outcome.createdAt)} · {outcome.context}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {outcome.action}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Review</p>
                                                        <p className="mt-2 text-sm font-semibold text-emerald-100">{outcome.readyReviewCount}</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                                        <p className="mt-2 text-sm font-semibold text-rose-100">{outcome.noImprovementCount}</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                                        <p className="mt-2 text-sm font-semibold text-amber-100">{outcome.awaitingSamplesCount}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchLearningOpsPlaybookRecommendationOutcomeAction(outcome)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {outcome.status === 'ready_review'
                                                            ? 'review 즉시 승인'
                                                            : outcome.status === 'needs_attention'
                                                                ? '재학습 AI 제안'
                                                                : 'queue 선택'}
                                                    </button>
                                                    {recommendation && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSearchLearningOpsPlaybookRecommendationAction(recommendation)}
                                                            className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                        >
                                                            동일 recommendation 실행
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 평가 가능한 recommendation outcome이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        recommendation outcome을 다시 다음 액션으로 재분류해서, review 승인/재학습/표본 수집을 한 단계 더 자동화합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        critical {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.critical}
                                    </span>
                                    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-orange-100">
                                        high {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.highPriority}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.reviewNow}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 outcome recommendation</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Now</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.retrainNow}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">즉시 재학습할 outcome recommendation</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Collect Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.collectSamples}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 outcome recommendation</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Observe</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.observe}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">개선 상태를 관찰할 outcome recommendation</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topReviewNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topRetrainNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topCollectSamples,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.priority === 'critical'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : recommendation.priority === 'high'
                                                ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
                                                : recommendation.priority === 'medium'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.priority}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.action}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(recommendation.createdAt)} · {recommendation.outcomeStatus}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {recommendation.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(
                                                            recommendation.entryIds,
                                                            `${recommendation.title} recommendation outcome recommendation query를 선택했습니다.`
                                                        )}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 실행 가능한 recommendation outcome recommendation이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Queue</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        outcome recommendation을 다시 실행 우선순위 큐로 정렬해서, 지금 당장 처리할 항목과 관찰 대상으로 남길 항목을 분리합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        urgent {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.urgent}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.needsReview}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Execute Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.executeNow}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 재학습/실행할 항목</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Needs Review</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.needsReview}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">즉시 승인 review 대상</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Sample Collection</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.sampleCollection}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">추가 샘플이 필요한 항목</p>
                                </div>
                                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Observe</p>
                                    <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.observe}</p>
                                    <p className="mt-1 text-xs text-slate-400">개선 상태를 관찰할 항목</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topExecuteNow,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topNeedsReview,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topSampleCollection,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((item) => {
                                        const badgeClass = item.queueState === 'execute_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.queueState === 'needs_review'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : item.queueState === 'sample_collection'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-slate-700 bg-slate-950/70 text-slate-300';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.queueState}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(item.createdAt)} · {item.outcomeStatus}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {item.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const recommendation = [
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topReviewNow,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topRetrainNow,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topCollectSamples,
                                                                ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topObserve,
                                                            ].find((candidate) => candidate.id === item.recommendationId);
                                                            if (recommendation) {
                                                                void handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction(recommendation);
                                                            }
                                                        }}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 실행 가능한 recommendation outcome recommendation queue가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Activity</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        outcome recommendation queue에서 실제로 실행된 review/retrain activity를 최근 이력으로 보여주고, 같은 outcome을 다시 실행하거나 queue로 넘길 수 있게 합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        runs {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.reviewRuns}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.retrainRuns}
                                    </span>
                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        queries {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => {
                                    const badgeClass = run.action === 'review_now'
                                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
                                    const recommendation = [
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topReviewNow,
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topRetrainNow,
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topCollectSamples,
                                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topObserve,
                                    ].find((candidate) => candidate.outcomeId === run.outcomeId);

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.action}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.count} entries
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {formatTime(run.createdAt)} · {run.context}
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.priority}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                {recommendation && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        동일 outcome recommendation 실행
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 outcome recommendation queue 실행 activity가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        outcome recommendation activity가 실제로 review 가능한 draft로 이어졌는지, 재학습이 더 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        ready review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        needs attention {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        awaiting {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        validated {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.validated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                                    ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topValidated,
                                ]
                                    .slice(0, 6)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100';
                                        const recommendation = [
                                            ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topReviewNow,
                                            ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topRetrainNow,
                                            ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topCollectSamples,
                                            ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topObserve,
                                        ].find((candidate) => candidate.outcomeId === outcome.outcomeId);

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {outcome.action}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(outcome.createdAt)} · improved {outcome.improvedCount} · weak {outcome.noImprovementCount}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {outcome.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    {recommendation && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSearchLearningOpsPlaybookRecommendationOutcomeRecommendationAction(recommendation)}
                                                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                        >
                                                            동일 outcome recommendation 실행
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 outcome recommendation activity 후속 outcome이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Impact</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        승인된 학습 query가 실제로 low-fit/0건 비율을 얼마나 줄였는지 요약합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        tracked {searchLearningImpactSummary.approvedTracked}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                                        improved {searchLearningImpactSummary.improved}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200">
                                        needs attention {searchLearningImpactSummary.noImprovement}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved Tracked</p>
                                    <p className="mt-3 text-3xl font-black text-white">{searchLearningImpactSummary.approvedTracked}</p>
                                    <p className="mt-1 text-xs text-slate-400">baseline이 있는 승인 query</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Improved Queries</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningImpactSummary.improved}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        measured {searchLearningImpactSummary.measured} · success {Math.round(searchLearningImpactSummary.improvedRate * 100)}%
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">No Improvement</p>
                                    <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningImpactSummary.noImprovement}</p>
                                    <p className="mt-1 text-xs text-slate-400">
                                        unchanged {searchLearningImpactSummary.unchanged} · regressed {searchLearningImpactSummary.regressed}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningImpactSummary.awaitingSamples}</p>
                                    <p className="mt-1 text-xs text-slate-400">승인 후 새 관측이 아직 없는 query</p>
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={selectImpactNoImprovementEntries}
                                    disabled={searchLearningImpactSummary.topNeedsAttention.length === 0}
                                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    개선 없음 선택 ({searchLearningImpactSummary.topNeedsAttention.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={selectImpactAwaitingEntries}
                                    disabled={searchLearningImpactSummary.topAwaitingSamples.length === 0}
                                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    샘플 대기 선택 ({searchLearningImpactSummary.topAwaitingSamples.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={selectImpactImprovedEntries}
                                    disabled={searchLearningImpactSummary.topImproved.length === 0}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    개선 query 선택 ({searchLearningImpactSummary.topImproved.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateImpactNoImprovementSuggestions}
                                    disabled={searchLearningImpactSummary.topNeedsAttention.length === 0 || processingSearchLearningId === 'impact_no_improvement_generate'}
                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === 'impact_no_improvement_generate'
                                        ? '재학습 제안 생성 중...'
                                        : `개선 없음 AI 제안 (${searchLearningImpactSummary.topNeedsAttention.length})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleGenerateImpactAwaitingSuggestions}
                                    disabled={searchLearningImpactSummary.topAwaitingSamples.length === 0 || processingSearchLearningId === 'impact_awaiting_generate'}
                                    className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === 'impact_awaiting_generate'
                                        ? '샘플 대기 제안 생성 중...'
                                        : `샘플 대기 AI 제안 (${searchLearningImpactSummary.topAwaitingSamples.length})`}
                                </button>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-semibold text-white">Improved Since Approval</h3>
                                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                                            top {searchLearningImpactSummary.topImproved.length}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {searchLearningImpactSummary.topImproved.map((impact) => (
                                            <div key={`improved_${impact.entryId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{impact.query}</p>
                                                        <p className="mt-1 text-xs text-slate-500">since {formatTime(impact.approvedAt)} · new samples {impact.postApprovalSamples}</p>
                                                    </div>
                                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                                                        improved
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(impact.beforeLowFitRate)} → {formatPercent(impact.afterLowFitRate)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(impact.beforeZeroRate)} → {formatPercent(impact.afterZeroRate)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {searchLearningImpactSummary.topImproved.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                                아직 승인 후 개선이 확인된 query가 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-semibold text-white">Still Needs Tuning</h3>
                                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-200">
                                            top {searchLearningImpactSummary.topNeedsAttention.length}
                                        </span>
                                    </div>
                                    <div className="mt-4 space-y-3">
                                        {searchLearningImpactSummary.topNeedsAttention.map((impact) => (
                                            <div key={`attention_${impact.entryId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{impact.query}</p>
                                                        <p className="mt-1 text-xs text-slate-500">since {formatTime(impact.approvedAt)} · new samples {impact.postApprovalSamples}</p>
                                                    </div>
                                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${impact.outcome === 'regressed' ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-500/15 text-amber-200'}`}>
                                                        {impact.outcome === 'regressed' ? 'regressed' : 'unchanged'}
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(impact.beforeLowFitRate)} → {formatPercent(impact.afterLowFitRate)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(impact.beforeZeroRate)} → {formatPercent(impact.afterZeroRate)}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {searchLearningImpactSummary.topNeedsAttention.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                                승인 후에도 계속 개선이 없는 query는 아직 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {searchLearningImpactSummary.topAwaitingSamples.length > 0 && (
                                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <h3 className="text-sm font-semibold text-white">Awaiting Post-Approval Samples</h3>
                                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-200">
                                            top {searchLearningImpactSummary.topAwaitingSamples.length}
                                        </span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        {searchLearningImpactSummary.topAwaitingSamples.map((impact) => (
                                            <span key={`awaiting_${impact.entryId}`} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                                                {impact.query}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold text-white">Semantic Cluster Impact</h3>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        tracked {searchLearningImpactClusterRollup.tracked}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectImpactClusters(
                                            searchLearningImpactClusterRollup.topNeedsAttention,
                                            `${searchLearningImpactClusterRollup.topNeedsAttention.length}개의 개선 없음 semantic cluster query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningImpactClusterRollup.topNeedsAttention.length === 0}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        개선 없음 클러스터 선택 ({searchLearningImpactClusterRollup.topNeedsAttention.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateImpactNoImprovementClusterSuggestions}
                                        disabled={searchLearningImpactClusterRollup.topNeedsAttention.length === 0 || processingSearchLearningId === 'impact_cluster_no_improvement_generate'}
                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'impact_cluster_no_improvement_generate'
                                            ? '클러스터 제안 생성 중...'
                                            : `개선 없음 클러스터 AI 제안 (${searchLearningImpactClusterRollup.topNeedsAttention.length})`}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectImpactClusters(
                                            searchLearningImpactClusterRollup.topAwaitingSamples,
                                            `${searchLearningImpactClusterRollup.topAwaitingSamples.length}개의 샘플 대기 semantic cluster query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningImpactClusterRollup.topAwaitingSamples.length === 0}
                                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        샘플 대기 클러스터 선택 ({searchLearningImpactClusterRollup.topAwaitingSamples.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleGenerateImpactAwaitingClusterSuggestions}
                                        disabled={searchLearningImpactClusterRollup.topAwaitingSamples.length === 0 || processingSearchLearningId === 'impact_cluster_awaiting_generate'}
                                        className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {processingSearchLearningId === 'impact_cluster_awaiting_generate'
                                            ? '대기 클러스터 제안 생성 중...'
                                            : `샘플 대기 클러스터 AI 제안 (${searchLearningImpactClusterRollup.topAwaitingSamples.length})`}
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tracked Clusters</p>
                                        <p className="mt-3 text-3xl font-black text-white">{searchLearningImpactClusterRollup.tracked}</p>
                                        <p className="mt-1 text-xs text-slate-400">semantic cluster 단위 승인 영향</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Improved Clusters</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningImpactClusterRollup.improved}</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            measured {searchLearningImpactClusterRollup.measured} · success {Math.round(searchLearningImpactClusterRollup.improvedRate * 100)}%
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Tuning</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningImpactClusterRollup.noImprovement}</p>
                                        <p className="mt-1 text-xs text-slate-400">개선 없이 유지/회귀한 클러스터</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningImpactClusterRollup.awaitingSamples}</p>
                                        <p className="mt-1 text-xs text-slate-400">승인 후 새 검색 표본이 아직 없음</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className="text-sm font-semibold text-white">Improved Clusters</h4>
                                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                                                top {searchLearningImpactClusterRollup.topImproved.length}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {searchLearningImpactClusterRollup.topImproved.map((cluster) => (
                                                <div key={`cluster_improved_${cluster.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                queries {cluster.queryCount} · measured {cluster.measured} · 대표 {cluster.topQuery || '-'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                                            className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                                        >
                                                            선택
                                                        </button>
                                                    </div>
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                                {formatPercent(cluster.beforeLowFitRate)} → {formatPercent(cluster.afterLowFitRate)}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                                {formatPercent(cluster.beforeZeroRate)} → {formatPercent(cluster.afterZeroRate)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {searchLearningImpactClusterRollup.topImproved.length === 0 && (
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                                    아직 개선이 확인된 semantic cluster가 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className="text-sm font-semibold text-white">Clusters Still Needing Tuning</h4>
                                            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-200">
                                                top {searchLearningImpactClusterRollup.topNeedsAttention.length}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {searchLearningImpactClusterRollup.topNeedsAttention.map((cluster) => (
                                                <div key={`cluster_attention_${cluster.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                queries {cluster.queryCount} · measured {cluster.measured} · 대표 {cluster.topQuery || '-'}
                                                            </p>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                                            className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                                        >
                                                            선택
                                                        </button>
                                                    </div>
                                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                                {formatPercent(cluster.beforeLowFitRate)} → {formatPercent(cluster.afterLowFitRate)}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                                {formatPercent(cluster.beforeZeroRate)} → {formatPercent(cluster.afterZeroRate)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {searchLearningImpactClusterRollup.topNeedsAttention.length === 0 && (
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                                    아직 개선이 없는 semantic cluster는 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {searchLearningImpactClusterRollup.topAwaitingSamples.length > 0 && (
                                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h4 className="text-sm font-semibold text-white">Awaiting Cluster Samples</h4>
                                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-200">
                                                top {searchLearningImpactClusterRollup.topAwaitingSamples.length}
                                            </span>
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            {searchLearningImpactClusterRollup.topAwaitingSamples.map((cluster) => (
                                                <button
                                                    key={`cluster_awaiting_${cluster.clusterId}`}
                                                    type="button"
                                                    onClick={() => selectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
                                                >
                                                    {cluster.clusterLabel} · queries {cluster.queryCount}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold text-white">Semantic Cluster Triage</h3>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        top {searchLearningImpactClusters.length}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                                    {searchLearningImpactClusters.map((cluster) => (
                                        <div key={cluster.clusterId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        queries {cluster.queryCount} · measured {cluster.measured}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                                    className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                                >
                                                    선택
                                                </button>
                                            </div>
                                            <div className="mt-3 grid grid-cols-2 gap-3">
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Improved</p>
                                                    <p className="mt-2 text-lg font-black text-emerald-300">{cluster.improved}</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                                    <p className="mt-2 text-lg font-black text-rose-300">{cluster.noImprovement}</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                                    <p className="mt-2 text-lg font-black text-amber-300">{cluster.awaitingSamples}</p>
                                                </div>
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Improved Rate</p>
                                                    <p className="mt-2 text-lg font-black text-sky-300">{Math.round(cluster.improvedRate * 100)}%</p>
                                                </div>
                                            </div>
                                            <p className="mt-3 text-xs text-slate-500">
                                                대표 query: {cluster.topQuery || '-'}
                                            </p>
                                        </div>
                                    ))}
                                    {searchLearningImpactClusters.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            semantic cluster 기준으로 집계할 승인 query가 아직 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Approved Rewrite Packs</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            승인된 query를 semantic cluster 기준 source-aware rewrite pack으로 자동 승격합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        top {searchLearningRewritePacks.length}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                    {searchLearningRewritePacks.map((pack) => (
                                        <div key={`rewrite_pack_${pack.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{pack.clusterLabel}</p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        approved entries {pack.entryCount} · promoted queries {pack.approvedQueryCount} · active sources {pack.sourceCount}
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(pack.entryIds, `${pack.clusterLabel} rewrite pack query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                                >
                                                    선택
                                                </button>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {pack.commonQueries.slice(0, 6).map((query) => (
                                                    <span key={`${pack.clusterId}_${query}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {Object.entries(pack.sourceQueries)
                                                    .filter(([, queries]) => (queries || []).length > 0)
                                                    .slice(0, 3)
                                                    .map(([source, queries]) => (
                                                        <div key={`${pack.clusterId}_${source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{source}</p>
                                                            <div className="mt-2 flex flex-wrap gap-2">
                                                                {(queries || []).slice(0, 4).map((query) => (
                                                                    <span key={`${pack.clusterId}_${source}_${query}`} className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                                                                        {query}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                    {searchLearningRewritePacks.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                            아직 rewrite pack으로 승격된 승인 query가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Rewrite Pack Recommendations</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            semantic cluster impact를 기준으로 rewrite pack의 승격, 유지, rollback 후보를 자동 추천합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        tracked {searchLearningRewriteRecommendationSummary.tracked}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteRecommendationSummary.topPromote.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteRecommendationSummary.topPromote.length}개의 승격 후보 rewrite pack query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteRecommendationSummary.topPromote.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        승격 후보 선택 ({searchLearningRewriteRecommendationSummary.topPromote.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteRecommendationSummary.topRollback.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteRecommendationSummary.topRollback.length}개의 rollback 후보 rewrite pack query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteRecommendationSummary.topRollback.length === 0}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        rollback 후보 선택 ({searchLearningRewriteRecommendationSummary.topRollback.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteRecommendationSummary.topAwaiting.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteRecommendationSummary.topAwaiting.length}개의 표본 대기 rewrite pack query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteRecommendationSummary.topAwaiting.length === 0}
                                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        표본 대기 선택 ({searchLearningRewriteRecommendationSummary.topAwaiting.length})
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteRecommendationSummary.promote}</p>
                                        <p className="mt-1 text-xs text-slate-400">안정적으로 유지 가능한 rewrite pack</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteRecommendationSummary.hold}</p>
                                        <p className="mt-1 text-xs text-slate-400">유지하되 표본을 더 모을 rewrite pack</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteRecommendationSummary.rollback}</p>
                                        <p className="mt-1 text-xs text-slate-400">조정 또는 rollback이 필요한 pack</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteRecommendationSummary.awaitingSamples}</p>
                                        <p className="mt-1 text-xs text-slate-400">승인 후 새 표본이 아직 부족함</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {searchLearningRewriteRecommendations.slice(0, 6).map((recommendation) => {
                                        const toneClass =
                                            recommendation.recommendation === 'promote'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                                : recommendation.recommendation === 'rollback'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                    : recommendation.recommendation === 'awaiting_samples'
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';

                                        return (
                                            <div key={`rewrite_recommendation_${recommendation.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{recommendation.clusterLabel}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            measured {recommendation.measured} · improved {recommendation.improved} · no improvement {recommendation.noImprovement}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${toneClass}`}>
                                                        {recommendation.recommendation}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.reason}</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(recommendation.beforeLowFitRate)} → {formatPercent(recommendation.afterLowFitRate)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(recommendation.beforeZeroRate)} → {formatPercent(recommendation.afterZeroRate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.commonQueries.slice(0, 5).map((query) => (
                                                        <span key={`${recommendation.clusterId}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.clusterLabel} rewrite pack query를 선택했습니다.`)}
                                                    className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    관련 query 선택
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {searchLearningRewriteRecommendations.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            아직 추천할 rewrite pack이 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Source Rollout Drafts</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            rewrite pack recommendation을 source 단위 rollout draft로 쪼개서, mall별 query triage를 바로 실행합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        drafts {searchLearningRewriteSourceDraftSummary.tracked}
                                    </span>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceDraftSummary.topPromote.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceDraftSummary.topPromote.length}개의 승격 source draft query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceDraftSummary.topPromote.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        승격 source 선택 ({searchLearningRewriteSourceDraftSummary.topPromote.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceDraftSummary.topRollback.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceDraftSummary.topRollback.length}개의 rollback source draft query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceDraftSummary.topRollback.length === 0}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        rollback source 선택 ({searchLearningRewriteSourceDraftSummary.topRollback.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningRewriteSourceDraftSummary.topAwaiting.flatMap((entry) => entry.entryIds),
                                            `${searchLearningRewriteSourceDraftSummary.topAwaiting.length}개의 표본 대기 source draft query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningRewriteSourceDraftSummary.topAwaiting.length === 0}
                                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        표본 대기 source 선택 ({searchLearningRewriteSourceDraftSummary.topAwaiting.length})
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceDraftSummary.promote}</p>
                                        <p className="mt-1 text-xs text-slate-400">source 수준 승격 후보</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceDraftSummary.hold}</p>
                                        <p className="mt-1 text-xs text-slate-400">유지하면서 표본을 더 모을 source draft</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback</p>
                                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceDraftSummary.rollback}</p>
                                        <p className="mt-1 text-xs text-slate-400">조정이 필요한 source draft</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceDraftSummary.awaitingSamples}</p>
                                        <p className="mt-1 text-xs text-slate-400">새 표본을 기다리는 source draft</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {searchLearningRewriteSourceDrafts.slice(0, 6).map((draft) => {
                                        const toneClass =
                                            draft.action === 'promote'
                                                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                                                : draft.action === 'rollback'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-200'
                                                    : draft.action === 'awaiting_samples'
                                                        ? 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                                        : 'border-sky-500/30 bg-sky-500/10 text-sky-200';

                                        return (
                                            <div key={draft.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{draft.clusterLabel}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {draft.source} · measured {draft.measured} · queries {draft.queryCount}
                                                        </p>
                                                    </div>
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${toneClass}`}>
                                                        {draft.action}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{draft.reason}</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(draft.beforeLowFitRate)} → {formatPercent(draft.afterLowFitRate)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(draft.beforeZeroRate)} → {formatPercent(draft.afterZeroRate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {draft.queries.map((query) => (
                                                        <span key={`${draft.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(draft.entryIds, `${draft.clusterLabel} / ${draft.source} source draft query를 선택했습니다.`)}
                                                    className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    source draft 선택
                                                </button>
                                            </div>
                                        );
                                    })}
                                    {searchLearningRewriteSourceDrafts.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                                            아직 source rollout draft가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </section>
                        </>
                        )}

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbooks</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        승인, AI 생성, 재학습, 표본 수집을 배치 실행 단위로 묶은 빠른 운영 플레이북입니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        ready {searchLearningOpsPlaybooks.readyBatches}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        urgent {searchLearningOpsPlaybooks.urgentBatches}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        validated {searchLearningOpsPlaybooks.stableValidated}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ready Batches</p>
                                    <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybooks.readyBatches}</p>
                                    <p className="mt-1 text-xs text-slate-400">실행 가능한 playbook 수</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Urgent Batches</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybooks.urgentBatches}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">즉시 처리 권장 batch</p>
                                </div>
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Stable Validated</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybooks.stableValidated}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">안정 상태 승인 query</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningOpsPlaybooks.topPlaybooks.map((playbook) => {
                                    const badgeClass = playbook.priority === 'critical'
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                        : playbook.priority === 'high'
                                            ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
                                            : playbook.priority === 'medium'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : 'border-slate-700 bg-slate-950/70 text-slate-300';

                                    return (
                                        <div key={playbook.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {playbook.priority}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {playbook.queryCount} queries
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{playbook.title}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {playbook.action}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{playbook.description}</p>
                                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                {playbook.reason}
                                            </p>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleSearchLearningOpsPlaybookAction(playbook)}
                                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                >
                                                    {playbook.actionLabel}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(playbook.entryIds, `${playbook.title}의 ${playbook.entryIds.length}개 query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsPlaybooks.topPlaybooks.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 실행 가능한 search learning playbook이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Activity</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        배치 승인/AI 생성 플레이북이 실제로 얼마나 실행됐는지, 최근 어떤 query를 처리했는지 바로 다시 봅니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        runs {searchLearningOpsPlaybookActivity.totalRuns}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        approvals {searchLearningOpsPlaybookActivity.approvalRuns}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        unique queries {searchLearningOpsPlaybookActivity.uniqueQueries}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total Runs</p>
                                    <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookActivity.totalRuns}</p>
                                    <p className="mt-1 text-xs text-slate-400">기록된 playbook 실행 수</p>
                                </div>
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Approval Runs</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookActivity.approvalRuns}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">review pending batch 승인 실행</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Generate Runs</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookActivity.generationRuns}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">generate needed batch 실행</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Runs</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookActivity.retrainRuns}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">retrain batch 실행</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningOpsPlaybookActivity.recentRuns.map((run) => {
                                    const badgeClass = run.priority === 'critical'
                                        ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                        : run.priority === 'high'
                                            ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
                                            : 'border-sky-500/30 bg-sky-500/10 text-sky-100';
                                    const linkedPlaybook = searchLearningOpsPlaybooks.topPlaybooks.find((playbook) => playbook.id === run.playbookId);

                                    return (
                                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                            {run.priority}
                                                        </span>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                            {run.count} queries
                                                        </span>
                                                    </div>
                                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                                    <p className="mt-1 text-[11px] text-slate-500">
                                                        {formatTime(run.createdAt)} · {run.context}
                                                    </p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                    {run.action}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {run.queries.map((query) => (
                                                    <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="mt-4 flex flex-wrap gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => selectSearchLearningEntries(run.entryIds, `${run.title} 실행 query를 선택했습니다.`)}
                                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                >
                                                    queue 선택
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => linkedPlaybook && handleSearchLearningOpsPlaybookAction(linkedPlaybook)}
                                                    disabled={!linkedPlaybook}
                                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    같은 playbook 다시 실행
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                                {searchLearningOpsPlaybookActivity.recentRuns.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 기록된 search learning playbook activity가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Outcomes</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        실행된 playbook이 실제로 review 승인 대기인지, 재학습이 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookOutcomes.total}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        review {searchLearningOpsPlaybookOutcomes.readyReview}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        attention {searchLearningOpsPlaybookOutcomes.needsAttention}
                                    </span>
                                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                                        awaiting {searchLearningOpsPlaybookOutcomes.awaitingSamples}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Ready Review</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookOutcomes.readyReview}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">draft review/승인으로 바로 이어질 batch</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Needs Attention</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookOutcomes.needsAttention}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">재학습 또는 rewrite 보정이 필요한 batch</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Awaiting Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookOutcomes.awaitingSamples}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 batch</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Validated</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookOutcomes.validated}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">안정적으로 개선된 batch</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[...searchLearningOpsPlaybookOutcomes.topReadyReview, ...searchLearningOpsPlaybookOutcomes.topNeedsAttention, ...searchLearningOpsPlaybookOutcomes.topAwaitingSamples, ...searchLearningOpsPlaybookOutcomes.topValidated]
                                    .slice(0, 6)
                                    .map((outcome) => {
                                        const badgeClass = outcome.status === 'ready_review'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : outcome.status === 'needs_attention'
                                                ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                : outcome.status === 'awaiting_samples'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                        return (
                                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {outcome.status}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {outcome.entryIds.length} queries
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(outcome.createdAt)} · {outcome.context}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {outcome.action}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Review</p>
                                                        <p className="mt-2 text-sm font-semibold text-emerald-100">{outcome.readyReviewCount}</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                                        <p className="mt-2 text-sm font-semibold text-rose-100">{outcome.noImprovementCount}</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                                        <p className="mt-2 text-sm font-semibold text-amber-100">{outcome.awaitingSamplesCount}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {outcome.queries.map((query) => (
                                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchLearningOpsPlaybookOutcomeAction(outcome)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {outcome.status === 'ready_review'
                                                            ? 'review 즉시 승인'
                                                            : outcome.status === 'needs_attention'
                                                                ? '재학습 AI 제안'
                                                                : 'queue 선택'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        상세 queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookOutcomes.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 평가 가능한 search learning playbook outcome이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendations</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        playbook outcome을 바로 실행할 다음 액션으로 재분류해서, review 승인/재학습/표본 수집/관찰 흐름으로 곧바로 이어집니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendations.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        critical {searchLearningOpsPlaybookRecommendations.critical}
                                    </span>
                                    <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-orange-100">
                                        high {searchLearningOpsPlaybookRecommendations.highPriority}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendations.reviewNow}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 batch</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Now</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendations.retrainNow}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">즉시 재학습할 batch</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Collect Samples</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendations.collectSamples}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 batch</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Observe</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendations.observe}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">개선 상태를 관찰할 batch</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendations.topReviewNow,
                                    ...searchLearningOpsPlaybookRecommendations.topRetrainNow,
                                    ...searchLearningOpsPlaybookRecommendations.topCollectSamples,
                                    ...searchLearningOpsPlaybookRecommendations.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((recommendation) => {
                                        const badgeClass = recommendation.priority === 'critical'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : recommendation.priority === 'high'
                                                ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
                                                : recommendation.priority === 'medium'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                                        return (
                                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {recommendation.priority}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {recommendation.action}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(recommendation.createdAt)} · {recommendation.outcomeStatus}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {recommendation.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {recommendation.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {recommendation.queries.map((query) => (
                                                        <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleSearchLearningOpsPlaybookRecommendationAction(recommendation)}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {recommendation.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(recommendation.entryIds, `${recommendation.title} recommendation query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendations.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 실행 가능한 search learning playbook recommendation이 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Queue</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        recommendation을 다시 실행 우선순위 큐로 정렬해서, 지금 당장 처리할 배치와 관찰 대상으로 남길 배치를 분리합니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        total {searchLearningOpsPlaybookRecommendationQueue.total}
                                    </span>
                                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                        urgent {searchLearningOpsPlaybookRecommendationQueue.urgent}
                                    </span>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                        execute {searchLearningOpsPlaybookRecommendationQueue.executeNow}
                                    </span>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                        review {searchLearningOpsPlaybookRecommendationQueue.needsReview}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-4">
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Execute Now</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationQueue.executeNow}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 재학습/실행할 항목</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Needs Review</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationQueue.needsReview}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">즉시 승인 review 대상</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Sample Collection</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationQueue.sampleCollection}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">추가 샘플이 필요한 항목</p>
                                </div>
                                <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Observe</p>
                                    <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookRecommendationQueue.observe}</p>
                                    <p className="mt-1 text-xs text-slate-400">개선 상태를 관찰할 항목</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {[
                                    ...searchLearningOpsPlaybookRecommendationQueue.topExecuteNow,
                                    ...searchLearningOpsPlaybookRecommendationQueue.topNeedsReview,
                                    ...searchLearningOpsPlaybookRecommendationQueue.topSampleCollection,
                                    ...searchLearningOpsPlaybookRecommendationQueue.topObserve,
                                ]
                                    .slice(0, 6)
                                    .map((item) => {
                                        const badgeClass = item.queueState === 'execute_now'
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                                            : item.queueState === 'needs_review'
                                                ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                : item.queueState === 'sample_collection'
                                                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-100'
                                                    : 'border-slate-700 bg-slate-950/70 text-slate-300';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                {item.queueState}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.priority}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                        <p className="mt-1 text-[11px] text-slate-500">
                                                            {formatTime(item.createdAt)} · {item.outcomeStatus}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {item.entryIds.length} queries
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                                    {item.reason}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const recommendation = [
                                                                ...searchLearningOpsPlaybookRecommendations.topReviewNow,
                                                                ...searchLearningOpsPlaybookRecommendations.topRetrainNow,
                                                                ...searchLearningOpsPlaybookRecommendations.topCollectSamples,
                                                                ...searchLearningOpsPlaybookRecommendations.topObserve,
                                                            ].find((candidate) => candidate.id === item.recommendationId);
                                                            if (recommendation) {
                                                                handleSearchLearningOpsPlaybookRecommendationAction(recommendation);
                                                            }
                                                        }}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                {searchLearningOpsPlaybookRecommendationQueue.total === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 실행 가능한 search learning playbook recommendation queue가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Ops Center</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        최근 activity triage와 승인 후 follow-up을 한 번에 보고, 가장 먼저 처리할 검색 학습 액션으로 바로 이어집니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningOpsCenter.reviewPendingEntryIds,
                                            `${searchLearningOpsCenter.reviewPendingEntryIds.length}개의 review pending query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningOpsCenter.reviewPendingEntryIds.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        review pending 선택 ({searchLearningOpsCenter.reviewPendingEntryIds.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkGenerateSearchLearningSuggestionsForIds(
                                            searchLearningOpsCenter.generateNeededEntryIds,
                                            'ops_center_generate_needed',
                                            (count) => `${count}개의 ops center generate query에 AI 제안을 생성했습니다.`,
                                            'ops center generate query AI 제안 생성에 실패했습니다.'
                                        )}
                                        disabled={searchLearningOpsCenter.generateNeededEntryIds.length === 0}
                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        generate needed AI 제안 ({searchLearningOpsCenter.generateNeededEntryIds.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleBulkGenerateSearchLearningSuggestionsForIds(
                                            searchLearningOpsCenter.retrainNeededEntryIds,
                                            'ops_center_retrain_needed',
                                            (count) => `${count}개의 ops center retrain query에 AI 제안을 생성했습니다.`,
                                            'ops center retrain query AI 제안 생성에 실패했습니다.'
                                        )}
                                        disabled={searchLearningOpsCenter.retrainNeededEntryIds.length === 0}
                                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        retrain AI 제안 ({searchLearningOpsCenter.retrainNeededEntryIds.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningOpsCenter.sampleCollectionEntryIds,
                                            `${searchLearningOpsCenter.sampleCollectionEntryIds.length}개의 표본 수집 query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningOpsCenter.sampleCollectionEntryIds.length === 0}
                                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        표본 수집 선택 ({searchLearningOpsCenter.sampleCollectionEntryIds.length})
                                    </button>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Urgent Now</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsCenter.urgentNow}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">critical/high ops queue</p>
                                </div>
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Pending</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsCenter.reviewPending}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 후보</p>
                                </div>
                                <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Generate Needed</p>
                                    <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsCenter.generateNeeded}</p>
                                    <p className="mt-1 text-xs text-sky-100/70">즉시 AI 생성 후보</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Sample Collection</p>
                                    <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsCenter.sampleCollection}</p>
                                    <p className="mt-1 text-xs text-amber-100/70">추가 관찰 필요</p>
                                </div>
                                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Needed</p>
                                    <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsCenter.retrainNeeded}</p>
                                    <p className="mt-1 text-xs text-rose-100/70">follow-up 재학습 필요</p>
                                </div>
                                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Validated</p>
                                    <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsCenter.validated}</p>
                                    <p className="mt-1 text-xs text-emerald-100/70">개선 확인 activity</p>
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                {[
                                    {
                                        title: 'Urgent Now',
                                        entries: searchLearningOpsCenter.topUrgentNow,
                                        empty: '아직 즉시 처리할 ops item이 없습니다.',
                                    },
                                    {
                                        title: 'Retrain Needed',
                                        entries: searchLearningOpsCenter.topRetrainNeeded,
                                        empty: '아직 재학습 follow-up이 없습니다.',
                                    },
                                    {
                                        title: 'Validated',
                                        entries: searchLearningOpsCenter.topValidated,
                                        empty: '아직 개선 확인 activity가 없습니다.',
                                    },
                                ].map((group) => (
                                    <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                top {group.entries.length}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {group.entries.map((item) => {
                                                const badgeClass = item.priority === 'critical'
                                                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                                    : item.priority === 'high'
                                                        ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
                                                        : item.priority === 'medium'
                                                            ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                            : 'border-slate-700 bg-slate-950/70 text-slate-300';

                                                return (
                                                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="flex flex-wrap items-center gap-2">
                                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                                                        {item.priority}
                                                                    </span>
                                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                        {item.metricLabel}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {formatTime(item.lastSeenAt)}
                                                                    {item.context ? ` · ${item.context}` : ''}
                                                                </p>
                                                            </div>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                                {item.source}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {item.queries.slice(0, 4).map((query) => (
                                                                <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                                    {query}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSearchLearningOpsCenterAction(item)}
                                                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                            >
                                                                {item.actionLabel}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`)}
                                                                className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                            >
                                                                queue 선택
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {group.entries.length === 0 && (
                                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
                                                    {group.empty}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-white">Search Learning Activity</h2>
                                    <p className="mt-2 text-sm text-slate-400">
                                        queue 추가, AI 제안 생성, 승인/보류 같은 운영 액션이 최근 순서대로 기록됩니다.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-xs">
                                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                        storage {data?.searchLearningActivity.storage ?? 'memory'}
                                    </span>
                                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                                        events {searchLearningActivity.length}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningActivitySummary.topGeneratedContexts.flatMap((entry) => entry.entryIds),
                                            `${searchLearningActivitySummary.topGeneratedContexts.length}개의 생성 activity context query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningActivitySummary.topGeneratedContexts.length === 0}
                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        생성 activity 선택 ({searchLearningActivitySummary.topGeneratedContexts.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningActivitySummary.topReviewContexts.flatMap((entry) => entry.entryIds),
                                            `${searchLearningActivitySummary.topReviewContexts.length}개의 review activity context query를 선택했습니다.`
                                        )}
                                        disabled={searchLearningActivitySummary.topReviewContexts.length === 0}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        review activity 선택 ({searchLearningActivitySummary.topReviewContexts.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => selectSearchLearningEntries(
                                            searchLearningActivitySummary.topQueries.flatMap((entry) => entry.entryIds),
                                            `${searchLearningActivitySummary.topQueries.length}개의 반복 query activity를 선택했습니다.`
                                        )}
                                        disabled={searchLearningActivitySummary.topQueries.length === 0}
                                        className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        반복 query 선택 ({searchLearningActivitySummary.topQueries.length})
                                    </button>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Generated</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningActivitySummary.generated}</p>
                                        <p className="mt-1 text-xs text-slate-400">AI 제안 생성 수</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Seeded</p>
                                        <p className="mt-3 text-3xl font-black text-cyan-300">{searchLearningActivitySummary.seeded}</p>
                                        <p className="mt-1 text-xs text-slate-400">coverage/queue seed 수</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Reviewed</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningActivitySummary.reviewed}</p>
                                        <p className="mt-1 text-xs text-slate-400">review 처리 수</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningActivitySummary.approvedReviews}</p>
                                        <p className="mt-1 text-xs text-slate-400">승인된 review 수</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ignored</p>
                                        <p className="mt-3 text-3xl font-black text-slate-200">{searchLearningActivitySummary.ignoredReviews}</p>
                                        <p className="mt-1 text-xs text-slate-400">보류된 review 수</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actors</p>
                                        <p className="mt-3 text-3xl font-black text-violet-300">{searchLearningActivitySummary.uniqueActors}</p>
                                        <p className="mt-1 text-xs text-slate-400">활동 admin 수</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold text-white">Top Activity Contexts</h3>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                top {searchLearningActivitySummary.topContexts.length}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {searchLearningActivitySummary.topContexts.map((entry) => (
                                                <div key={entry.context} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">{entry.context}</p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {formatTime(entry.lastSeenAt)} · {entry.types.join(', ')}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                            {entry.count}건
                                                        </span>
                                                    </div>
                                                    <div className="mt-3 flex flex-wrap gap-2">
                                                        {entry.queries.slice(0, 4).map((query) => (
                                                            <span key={`${entry.context}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                                {query}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(entry.entryIds, `${entry.context} context의 ${entry.entryIds.length}개 query를 선택했습니다.`)}
                                                        className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        context query 선택
                                                    </button>
                                                </div>
                                            ))}
                                            {searchLearningActivitySummary.topContexts.length === 0 && (
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                                    아직 activity context가 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="text-sm font-semibold text-white">Repeated Activity Queries</h3>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                top {searchLearningActivitySummary.topQueries.length}
                                            </span>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            {searchLearningActivitySummary.topQueries.map((entry) => (
                                                <div key={entry.query} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-white">{entry.query}</p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {formatTime(entry.lastSeenAt)} · {entry.types.join(', ')}
                                                            </p>
                                                        </div>
                                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                            {entry.count}회
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(entry.entryIds, `${entry.query} activity의 ${entry.entryIds.length}개 query를 선택했습니다.`)}
                                                        className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        반복 query 선택
                                                    </button>
                                                </div>
                                            ))}
                                            {searchLearningActivitySummary.topQueries.length === 0 && (
                                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                                    아직 반복 activity query가 없습니다.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Activity Recommendations</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            최근 activity를 기준으로 바로 처리할 review, AI 생성, 표본 수집 대상을 추천합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        actionable {searchLearningActivityRecommendations.reviewPending + searchLearningActivityRecommendations.generateNeeded + searchLearningActivityRecommendations.awaitingSamples}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Pending</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningActivityRecommendations.reviewPending}</p>
                                        <p className="mt-1 text-xs text-slate-400">draft review가 남은 activity</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Generate Needed</p>
                                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningActivityRecommendations.generateNeeded}</p>
                                        <p className="mt-1 text-xs text-slate-400">AI suggestion이 아직 없는 seed activity</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningActivityRecommendations.awaitingSamples}</p>
                                        <p className="mt-1 text-xs text-slate-400">승인 후 실제 검색 표본이 더 필요한 activity</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {[
                                        {
                                            title: 'Review Pending',
                                            entries: searchLearningActivityRecommendations.topReviewPending,
                                            empty: '아직 review pending activity가 없습니다.',
                                            buttonLabel: 'review query 선택',
                                        },
                                        {
                                            title: 'Generate Needed',
                                            entries: searchLearningActivityRecommendations.topGenerateNeeded,
                                            empty: '아직 generate needed activity가 없습니다.',
                                            buttonLabel: 'AI 생성 대상 선택',
                                        },
                                        {
                                            title: 'Awaiting Samples',
                                            entries: searchLearningActivityRecommendations.topAwaitingSamples,
                                            empty: '아직 awaiting samples activity가 없습니다.',
                                            buttonLabel: '표본 수집 대상 선택',
                                        },
                                    ].map((group) => (
                                        <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                    top {group.entries.length}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {group.entries.map((entry) => (
                                                    <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-white">{entry.title}</p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {formatTime(entry.lastSeenAt)}
                                                                    {entry.context ? ` · ${entry.context}` : ''}
                                                                </p>
                                                            </div>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                                {entry.count}건
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-xs leading-6 text-slate-400">{entry.description}</p>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {entry.queries.slice(0, 4).map((query) => (
                                                                <span key={`${entry.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                                    {query}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => selectSearchLearningEntries(entry.entryIds, `${entry.title}의 ${entry.entryIds.length}개 query를 선택했습니다.`)}
                                                            className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                        >
                                                            {group.buttonLabel}
                                                        </button>
                                                    </div>
                                                ))}
                                                {group.entries.length === 0 && (
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                                        {group.empty}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Activity Ops Queue</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            최근 activity 추천을 긴급도 기준으로 다시 정렬해, 바로 생성·승인·표본 수집 액션으로 연결합니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        top {searchLearningActivityOpsQueue.topItems.length}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-4">
                                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Critical</p>
                                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningActivityOpsQueue.critical}</p>
                                        <p className="mt-1 text-xs text-rose-100/70">즉시 처리 권장</p>
                                    </div>
                                    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-200">High</p>
                                        <p className="mt-3 text-3xl font-black text-orange-100">{searchLearningActivityOpsQueue.high}</p>
                                        <p className="mt-1 text-xs text-orange-100/70">반복 실패/반복 생성 대상</p>
                                    </div>
                                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Medium</p>
                                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningActivityOpsQueue.medium}</p>
                                        <p className="mt-1 text-xs text-sky-100/70">추가 triage 필요</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Low</p>
                                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningActivityOpsQueue.low}</p>
                                        <p className="mt-1 text-xs text-slate-500">관찰 위주</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                    {searchLearningActivityOpsQueue.topItems.map((item) => {
                                        const priorityClasses = item.priority === 'critical'
                                            ? 'border-rose-500/30 bg-rose-500/10 text-rose-100'
                                            : item.priority === 'high'
                                                ? 'border-orange-500/30 bg-orange-500/10 text-orange-100'
                                                : item.priority === 'medium'
                                                    ? 'border-sky-500/30 bg-sky-500/10 text-sky-100'
                                                    : 'border-slate-700 bg-slate-950/70 text-slate-300';

                                        return (
                                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${priorityClasses}`}>
                                                                {item.priority}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                                score {item.urgencyScore}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                                {item.action}
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {formatTime(item.lastSeenAt)}
                                                            {item.context ? ` · ${item.context}` : ''}
                                                        </p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                        {item.count}건
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1">
                                                        repeated {item.repeatedQueryCount}
                                                    </span>
                                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1">
                                                        zero-result {item.zeroResultCount}
                                                    </span>
                                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1">
                                                        low-fit {item.lowFitCount}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {item.queries.slice(0, 5).map((query) => (
                                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                            {query}
                                                        </span>
                                                    ))}
                                                </div>
                                                <div className="mt-4 flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleActivityOpsQueueItemAction(item)}
                                                        disabled={processingSearchLearningId === `activity_ops_review_${item.id}` || processingSearchLearningId === `activity_ops_generate_${item.id}`}
                                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {item.actionLabel}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`)}
                                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                    >
                                                        queue 선택
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {searchLearningActivityOpsQueue.topItems.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500 xl:col-span-2">
                                            아직 activity ops queue가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-white">Activity Outcome Follow-up</h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            승인된 activity가 실제 검색 개선으로 이어졌는지 보고, 재학습 또는 추가 표본 수집으로 바로 이어집니다.
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        tracked {searchLearningActivityFollowups.retrainNeeded + searchLearningActivityFollowups.awaitingSamples + searchLearningActivityFollowups.validated}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-4 md:grid-cols-3">
                                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Needed</p>
                                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningActivityFollowups.retrainNeeded}</p>
                                        <p className="mt-1 text-xs text-rose-100/70">재학습 또는 rewrite 조정 필요</p>
                                    </div>
                                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Awaiting Samples</p>
                                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningActivityFollowups.awaitingSamples}</p>
                                        <p className="mt-1 text-xs text-amber-100/70">추가 검색 표본 관찰 필요</p>
                                    </div>
                                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Validated</p>
                                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningActivityFollowups.validated}</p>
                                        <p className="mt-1 text-xs text-emerald-100/70">개선 확인 또는 안정 상태</p>
                                    </div>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                                    {[
                                        {
                                            title: 'Retrain Needed',
                                            entries: searchLearningActivityFollowups.topRetrainNeeded,
                                            empty: '아직 재학습이 필요한 activity가 없습니다.',
                                            actionLabel: '재학습 AI 제안',
                                        },
                                        {
                                            title: 'Awaiting Samples',
                                            entries: searchLearningActivityFollowups.topAwaitingSamples,
                                            empty: '아직 표본 대기 activity가 없습니다.',
                                            actionLabel: '표본 수집 대상 선택',
                                        },
                                        {
                                            title: 'Validated',
                                            entries: searchLearningActivityFollowups.topValidated,
                                            empty: '아직 개선 확인 activity가 없습니다.',
                                            actionLabel: '개선 query 선택',
                                        },
                                    ].map((group) => (
                                        <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                    top {group.entries.length}
                                                </span>
                                            </div>
                                            <div className="mt-4 space-y-3">
                                                {group.entries.map((item) => (
                                                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                                                <p className="mt-1 text-xs text-slate-500">
                                                                    {formatTime(item.lastSeenAt)}
                                                                    {item.context ? ` · ${item.context}` : ''}
                                                                </p>
                                                            </div>
                                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                                {item.reviewedCount}건
                                                            </span>
                                                        </div>
                                                        <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                                                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                                                                improved {item.improvedCount}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                                                                no-improvement {item.noImprovementCount}
                                                            </span>
                                                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                                                                awaiting {item.awaitingSamplesCount}
                                                            </span>
                                                        </div>
                                                        <div className="mt-3 flex flex-wrap gap-2">
                                                            {item.queries.slice(0, 4).map((query) => (
                                                                <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                                    {query}
                                                                </span>
                                                            ))}
                                                        </div>
                                                        <div className="mt-4 flex flex-wrap gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleActivityFollowupAction(item.entryIds, item.action, item.title)}
                                                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                                            >
                                                                {group.actionLabel}
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`)}
                                                                className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                                            >
                                                                queue 선택
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                                {group.entries.length === 0 && (
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                                        {group.empty}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningActivity.slice(0, 8).map((event) => (
                                    <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{searchLearningActivityLabel(event)}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatTime(event.createdAt)}
                                                    {event.context ? ` · ${event.context}` : ''}
                                                    {event.actorUid ? ` · ${event.actorUid.slice(0, 8)}` : ''}
                                                </p>
                                            </div>
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${searchLearningActivityClass(event)}`}>
                                                {event.count}건
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {event.queries.slice(0, 4).map((query) => (
                                                <span key={`${event.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                    {query}
                                                </span>
                                            ))}
                                        </div>
                                        {event.entryIds.length > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => selectSearchLearningEntries(
                                                    event.entryIds,
                                                    `${searchLearningActivityLabel(event)} activity의 ${event.entryIds.length}개 query를 선택했습니다.`
                                                )}
                                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                            >
                                                activity query 선택
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {searchLearningActivity.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500 xl:col-span-2">
                                        아직 search learning activity가 없습니다.
                                    </div>
                                )}
                            </div>
                        </section>

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
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-200">
                                        drafts {searchLearningDraftEntries.length}
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
                            <div className="mt-4 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={selectPendingSearchLearningEntries}
                                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    pending 전체 선택
                                </button>
                                <button
                                    type="button"
                                    onClick={selectDraftSearchLearningEntries}
                                    disabled={searchLearningDraftEntries.length === 0}
                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    draft 전체 선택 ({searchLearningDraftEntries.length})
                                </button>
                                <button
                                    type="button"
                                    onClick={clearSearchLearningSelection}
                                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300"
                                >
                                    선택 해제
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBulkReviewSearchLearning('bulk_approve')}
                                    disabled={selectedSearchLearningIds.length === 0 || processingSearchLearningId === 'bulk_approve'}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === 'bulk_approve' ? '승인 중...' : `선택 승인 (${selectedSearchLearningIds.length})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleBulkGenerateSearchLearningSuggestions}
                                    disabled={selectedSearchLearningIds.length === 0 || processingSearchLearningId === 'bulk_generate'}
                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === 'bulk_generate' ? '생성 중...' : `선택 AI 제안 (${selectedSearchLearningIds.length})`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleBulkReviewSearchLearning('bulk_ignore')}
                                    disabled={selectedSearchLearningIds.length === 0 || processingSearchLearningId === 'bulk_ignore'}
                                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === 'bulk_ignore' ? '보류 중...' : `선택 보류 (${selectedSearchLearningIds.length})`}
                                </button>
                            </div>
                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-semibold text-white">Draft Review Queue</h3>
                                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-200">
                                        top {Math.min(searchLearningDraftEntries.length, 6)}
                                    </span>
                                </div>
                                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                    {searchLearningDraftEntries.slice(0, 6).map((entry) => (
                                        <div key={`draft_${entry.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="flex items-start gap-3">
                                                    <label className="mt-0.5 flex items-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSearchLearningIds.includes(entry.id)}
                                                            onChange={() => toggleSearchLearningSelection(entry.id)}
                                                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400 focus:ring-sky-400"
                                                        />
                                                    </label>
                                                    <div>
                                                        <p className="text-sm font-semibold text-white">{entry.query}</p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            fit {entry.lastResultQuality || '-'} · products {entry.lastTotalProducts} · seen {formatTime(entry.lastSeenAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-200">
                                                    draft
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {entry.aiSuggestion?.suggestedQueries.map((query) => (
                                                    <span key={`draft_${entry.id}_${query}`} className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                            {entry.aiSuggestion?.rationale && (
                                                <p className="mt-3 text-xs leading-6 text-slate-400">{entry.aiSuggestion.rationale}</p>
                                            )}
                                            <div className="mt-4 flex flex-wrap gap-2">
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
                                                    onClick={() => handleGenerateSearchLearningSuggestion(entry.id)}
                                                    disabled={processingSearchLearningId === entry.id}
                                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                >
                                                    재생성
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
                                    {searchLearningDraftEntries.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                            아직 AI draft가 생성된 pending query가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                                {searchLearningEntries.slice(0, 8).map((entry) => {
                                    const impact = buildSearchLearningImpact(entry);
                                    return (
                                    <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3">
                                                <label className="mt-0.5 flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSearchLearningIds.includes(entry.id)}
                                                        onChange={() => toggleSearchLearningSelection(entry.id)}
                                                        className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400 focus:ring-sky-400"
                                                    />
                                                </label>
                                                <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.lastSeenAt)}</p>
                                                <p className="mt-1 text-sm font-semibold text-white">{entry.query}</p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    normalized {entry.normalizedQuery || '-'} · fit {entry.lastResultQuality || '-'} · products {entry.lastTotalProducts}
                                                </p>
                                                </div>
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
                                        {impact && (
                                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">Approval Impact</p>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                                                        since {formatTime(entry.approvalBaseline?.approvedAt)}
                                                    </span>
                                                </div>
                                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">New Samples</p>
                                                        <p className="mt-2 text-xl font-black text-white">{impact.postApprovalSamples}</p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(impact.beforeLowFitRate)} → {formatPercent(impact.afterLowFitRate)}
                                                        </p>
                                                    </div>
                                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                                            {formatPercent(impact.beforeZeroRate)} → {formatPercent(impact.afterZeroRate)}
                                                        </p>
                                                    </div>
                                                </div>
                                                {impact.postApprovalSamples === 0 && (
                                                    <p className="mt-3 text-xs text-slate-500">승인 후 아직 새 관측 데이터가 없습니다.</p>
                                                )}
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
                                    );
                                })}
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
