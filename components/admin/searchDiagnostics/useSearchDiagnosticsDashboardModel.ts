'use client';

import { useMemo } from 'react';
import { buildAlertRolloutRecommendations, buildAlertTuningSuggestions } from '@/lib/favorites/alertRecommendations';
import {
    buildApprovalQueueSummary,
    buildClientAuditInboxSummary,
    buildLowFitQueries,
    buildSourceDrilldown,
    buildSourceTrend,
} from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';
import type { DiagnosticsResponse } from './types';

type UseSearchDiagnosticsDashboardModelParams = {
    data: DiagnosticsResponse | null;
    selectedSource: string | null;
    scope: 'full' | 'ops';
};

export function useSearchDiagnosticsDashboardModel({
    data,
    selectedSource,
    scope,
}: UseSearchDiagnosticsDashboardModelParams) {
    return useMemo(() => {
        const summary = data?.summary;
        const searchLearning = data?.searchLearning;
        const searchLearningEntries = searchLearning?.entries || [];
        const searchLearningActivityEvents = data?.searchLearningActivity?.events || [];
        const searchLearningWorkbench = buildSearchLearningWorkbench({
            entries: searchLearningEntries,
            activity: searchLearningActivityEvents,
            coverage: data?.searchQualityCoverage,
            summary: {
                trackedSearches: summary?.trackedSearches ?? 0,
                observedSources: summary?.sources.length ?? 0,
                productOpens: data?.interactionSummary.productOpens ?? 0,
            },
        });
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
        const pdpRecentEvents = (data?.pdp.recent || []).slice(0, 16);
        const pdpFailures = pdpRecentEvents.filter((entry) => entry.strategy === 'fetch_failed' || entry.strategy === 'parse_empty');
        const pdpSelectedEvents = pdpRecentEvents.filter((entry) => !selectedPdpSummary || entry.source === selectedPdpSummary.source);
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

        return {
            summary,
            searchLearningEntries,
            searchLearningSummary: searchLearning?.summary,
            searchLearningActivityEvents,
            searchLearningActivityStorage: data?.searchLearningActivity.storage ?? 'memory',
            searchLearningWorkbench,
            selectedSummary,
            drilldown,
            trendPoints,
            recentSnapshots,
            lowFitQueries,
            recentInteractions,
            pdpSummary,
            selectedPdpSummary,
            pdpFailures,
            pdpSelectedEvents,
            alertSummary,
            alertSuggestions,
            selectedAlertSummary,
            selectedAlertDrilldown,
            selectedAlertSuggestion,
            selectedAlertEvents,
            alertPersonaSummary,
            alertPersonaRecent,
            alertRollout,
            alertRolloutTrends,
            rolloutRecommendations,
            alertTuningRequests,
            alertTuningAudit,
            alertTuningAuditInbox,
            alertTuningDigest,
            alertTuningWebhook,
            approvalQueueSummary,
            isOpsOnly: scope === 'ops',
        };
    }, [data, scope, selectedSource]);
}
