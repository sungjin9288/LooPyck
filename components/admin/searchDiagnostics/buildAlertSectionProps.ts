import type { useSearchDiagnosticsDashboardModel } from './useSearchDiagnosticsDashboardModel';
import type { useAlertTuningActions } from './useAlertTuningActions';

type AlertSectionPropsParams = {
    dashboardModel: ReturnType<typeof useSearchDiagnosticsDashboardModel>;
    alertTuningActions: ReturnType<typeof useAlertTuningActions>;
    currentUserUid: string | null;
    onSelectSource: (source: string) => void;
};

export function buildAlertSectionProps({
    dashboardModel,
    alertTuningActions,
    currentUserUid,
    onSelectSource,
}: AlertSectionPropsParams) {
    return {
        overviewProps: {
            alertPersonaRecent: dashboardModel.alertPersonaRecent,
            alertPersonaSummary: dashboardModel.alertPersonaSummary,
            alertRollout: dashboardModel.alertRollout,
            alertRolloutTrends: dashboardModel.alertRolloutTrends,
            alertSummary: dashboardModel.alertSummary,
            alertTuningAudit: dashboardModel.alertTuningAudit,
            alertTuningAuditInbox: dashboardModel.alertTuningAuditInbox,
            alertTuningDigest: dashboardModel.alertTuningDigest,
            alertTuningRequests: dashboardModel.alertTuningRequests,
            alertTuningWebhook: dashboardModel.alertTuningWebhook,
            approvalQueueSummary: dashboardModel.approvalQueueSummary,
            currentUserUid,
            isSavingTuning: alertTuningActions.isSavingTuning,
            markingAuditId: alertTuningActions.markingAuditId,
            onMarkAuditEventsRead: alertTuningActions.handleMarkAuditEventsRead,
            onQueueRecommendedRolloutRequest: alertTuningActions.queueRecommendedSourceRolloutRequest,
            onQueuedRequestNoteChange: alertTuningActions.onQueuedRequestNoteChange,
            onResolveApprovalRequest: alertTuningActions.handleResolveApprovalRequest,
            onResolutionNoteChange: alertTuningActions.onResolutionNoteChange,
            onRollbackAlertTuning: alertTuningActions.handleRollbackAlertTuning,
            onRunReminderDigest: alertTuningActions.handleRunReminderDigest,
            processingRequestId: alertTuningActions.processingRequestId,
            queuedRequestNotes: alertTuningActions.queuedRequestNotes,
            quickRollbackEntries: alertTuningActions.quickRollbackEntries,
            resolutionNotes: alertTuningActions.resolutionNotes,
            rollbackingHistoryId: alertTuningActions.rollbackingHistoryId,
            rolloutRecommendations: dashboardModel.rolloutRecommendations,
            runningReminderDigest: alertTuningActions.runningReminderDigest,
        },
        tuningProps: {
            alertTuning: alertTuningActions.alertTuning,
            availableOverrideSources: alertTuningActions.availableOverrideSources,
            currentOverrideSource: alertTuningActions.currentOverrideSource,
            currentSourceOverride: alertTuningActions.currentSourceOverride,
            currentSourceRollout: alertTuningActions.currentSourceRollout,
            draftTuning: alertTuningActions.draftTuning,
            isSavingTuning: alertTuningActions.isSavingTuning,
            isTuningDirty: alertTuningActions.isTuningDirty,
            onRemoveSourceOverride: alertTuningActions.handleRemoveSourceOverride,
            onReset: alertTuningActions.handleResetAlertTuning,
            onRollbackAlertTuning: alertTuningActions.handleRollbackAlertTuning,
            onSave: alertTuningActions.handleSaveAlertTuning,
            onSelectOverrideSource: alertTuningActions.setSelectedOverrideSource,
            onUpdateAlertTuningMode: alertTuningActions.updateAlertTuningMode,
            onUpdateSourceAlertTuningMode: alertTuningActions.updateSourceAlertTuningMode,
            onUpdateSourceRolloutPercentage: alertTuningActions.updateSourceRolloutPercentage,
            rollbackingHistoryId: alertTuningActions.rollbackingHistoryId,
            tuningMessage: alertTuningActions.tuningMessage,
        },
        insightProps: {
            alertSuggestions: dashboardModel.alertSuggestions,
            alertSummary: dashboardModel.alertSummary,
            onSelectSource,
            selectedAlertDrilldown: dashboardModel.selectedAlertDrilldown,
            selectedAlertEvents: dashboardModel.selectedAlertEvents,
            selectedAlertSuggestion: dashboardModel.selectedAlertSuggestion,
            selectedAlertSummary: dashboardModel.selectedAlertSummary,
        },
    };
}
