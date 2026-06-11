'use client';

import { useUser } from '@/contexts/UserContext';
import DebugConsole from './DebugConsole';
import { DashboardAccessState, DashboardLoadingScreen } from './searchDiagnostics/dashboardStateScreens';
import { DashboardHero, OpsOverviewCards, SearchOverviewSections } from './searchDiagnostics/overviewSections';
import {
    AlertOverviewSections,
} from './searchDiagnostics/alertSections';
import { AlertInsightSections } from './searchDiagnostics/alertInsightSections';
import { AlertTuningSettingsSection } from './searchDiagnostics/alertTuningSettingsSection';
import { buildAlertSectionProps } from './searchDiagnostics/buildAlertSectionProps';
import { SearchLearningSections } from './searchDiagnostics/searchLearningSections';
import { useSearchDiagnosticsDashboardModel } from './searchDiagnostics/useSearchDiagnosticsDashboardModel';
import { useSearchDiagnosticsData } from './searchDiagnostics/useSearchDiagnosticsData';
import { useSearchLearningSectionProps } from './searchDiagnostics/useSearchLearningSectionProps';
import { useAlertTuningActions } from './searchDiagnostics/useAlertTuningActions';
import type { SearchDiagnosticsDashboardProps } from './searchDiagnostics/types';

export default function SearchDiagnosticsDashboard({ scope = 'full' }: SearchDiagnosticsDashboardProps) {
    const { user, loading } = useUser();
    const {
        data,
        setData,
        isFetching,
        error,
        isAdminAuthorized,
        selectedSource,
        setSelectedSource,
        fetchTelemetry,
    } = useSearchDiagnosticsData(user);

    const dashboardModel = useSearchDiagnosticsDashboardModel({
        data,
        selectedSource,
        scope,
    });
    const {
        summary,
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
        isOpsOnly,
    } = dashboardModel;

    const alertTuningActions = useAlertTuningActions({
        user,
        data,
        setData,
    });
    const alertSectionProps = buildAlertSectionProps({
        dashboardModel,
        alertTuningActions,
        currentUserUid: user?.uid || null,
        onSelectSource: (source) => setSelectedSource(source),
    });

    const searchLearningSectionProps = useSearchLearningSectionProps({
        user,
        data,
        setData,
        selectedSource,
        setSelectedSource,
        dashboardModel,
    });

    if (loading) {
        return <DashboardLoadingScreen />;
    }

    if (!user || user.isAnonymous) {
        return (
            <DashboardAccessState
                title="Sign In Required"
                description={user?.isAnonymous
                    ? '현재 익명 로그인 상태입니다. 홈 화면에서 Google 로그인 후 다시 시도하세요.'
                    : '관리자 진단 화면을 보려면 먼저 로그인해야 합니다.'}
            />
        );
    }

    if (isAdminAuthorized === false) {
        return (
            <DashboardAccessState
                title="Access Denied"
                description={error || '관리자 권한이 필요합니다.'}
            />
        );
    }

    if (isAdminAuthorized === null && isFetching && !data) {
        return <DashboardLoadingScreen />;
    }

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <DashboardHero
                    data={data}
                    isFetching={isFetching}
                    isOpsOnly={isOpsOnly}
                />

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                    </div>
                )}

                <DebugConsole
                    data={data}
                    error={error}
                    isFetching={isFetching}
                    fetchTelemetry={fetchTelemetry}
                />

                {isOpsOnly ? (
                    <OpsOverviewCards
                        approvalQueueSummary={approvalQueueSummary}
                        auditUnreadCount={alertTuningAuditInbox.unreadCount}
                        rolloutSourceCount={alertRollout.length}
                    />
                ) : (
                    <SearchOverviewSections
                        data={data}
                        onSelectSource={(source) => setSelectedSource(source)}
                        pdpFailures={pdpFailures}
                        pdpSelectedEvents={pdpSelectedEvents}
                        selectedPdpSummary={selectedPdpSummary}
                    />
                )}

                <AlertOverviewSections
                    {...alertSectionProps.overviewProps}
                />

                <AlertTuningSettingsSection
                    {...alertSectionProps.tuningProps}
                />

                <AlertInsightSections
                    {...alertSectionProps.insightProps}
                />

                {!isOpsOnly && (
                    <SearchLearningSections sectionProps={searchLearningSectionProps} />
                )}
            </div>
        </main>
    );
}
