import type { AlertRolloutRecommendation } from '@/lib/favorites/alertRecommendations';
import { AlertMetricCard } from './alertMetricCard';
import { AlertApprovalQueueSection } from './alertApprovalQueueSection';
import { AlertQueueOpsSection } from './alertQueueOpsSection';
import { AlertRolloutSections } from './alertRolloutSections';
import {
    alertPersonaModeClass,
    alertPersonaModeLabel,
    formatSnoozeHours,
    formatTime,
    rolloutActionLabel,
    tuningSeverityClass,
} from './helpers';
import type {
    AlertTuningAuditEvent,
    AlertTuningAuditInboxSummary,
    AlertTuningApprovalRequest,
    AlertTuningHistoryEntry,
    AlertTuningReminderDigest,
    AlertTuningWebhookConfig,
    ApprovalQueueSummary,
    DiagnosticsResponse,
} from './types';

type AlertOverviewSectionsProps = {
    alertSummary: DiagnosticsResponse['alerts']['summary'] | null | undefined;
    alertPersonaSummary: DiagnosticsResponse['alerts']['personas']['summary'] | null | undefined;
    alertPersonaRecent: DiagnosticsResponse['alerts']['personas']['recent'];
    rolloutRecommendations: AlertRolloutRecommendation[];
    alertTuningRequests: AlertTuningApprovalRequest[];
    approvalQueueSummary: ApprovalQueueSummary;
    queuedRequestNotes: Record<string, string>;
    onQueuedRequestNoteChange: (source: string, note: string) => void;
    onQueueRecommendedRolloutRequest: (recommendation: AlertRolloutRecommendation) => Promise<void> | void;
    processingRequestId: string | null;
    resolutionNotes: Record<string, string>;
    onResolutionNoteChange: (requestId: string, note: string) => void;
    onResolveApprovalRequest: (requestId: string, action: 'approve' | 'reject') => Promise<void> | void;
    currentUserUid: string | null;
    alertTuningAudit: AlertTuningAuditEvent[];
    alertTuningAuditInbox: AlertTuningAuditInboxSummary;
    alertTuningDigest: AlertTuningReminderDigest;
    alertTuningWebhook: AlertTuningWebhookConfig;
    markingAuditId: string | null;
    onMarkAuditEventsRead: (ids: string[], markAll?: boolean) => Promise<void> | void;
    runningReminderDigest: boolean;
    onRunReminderDigest: () => Promise<void> | void;
    quickRollbackEntries: AlertTuningHistoryEntry[];
    onRollbackAlertTuning: (historyId: string) => Promise<void> | void;
    isSavingTuning: boolean;
    rollbackingHistoryId: string | null;
    alertRollout: DiagnosticsResponse['alerts']['rollout'];
    alertRolloutTrends: DiagnosticsResponse['alerts']['rolloutTrends'];
};

export function AlertOverviewSections({
    alertSummary,
    alertPersonaSummary,
    alertPersonaRecent,
    rolloutRecommendations,
    alertTuningRequests,
    approvalQueueSummary,
    queuedRequestNotes,
    onQueuedRequestNoteChange,
    onQueueRecommendedRolloutRequest,
    processingRequestId,
    resolutionNotes,
    onResolutionNoteChange,
    onResolveApprovalRequest,
    currentUserUid,
    alertTuningAudit,
    alertTuningAuditInbox,
    alertTuningDigest,
    alertTuningWebhook,
    markingAuditId,
    onMarkAuditEventsRead,
    runningReminderDigest,
    onRunReminderDigest,
    quickRollbackEntries,
    onRollbackAlertTuning,
    isSavingTuning,
    rollbackingHistoryId,
    alertRollout,
    alertRolloutTrends,
}: AlertOverviewSectionsProps) {
    return (
        <>
            <section className="mt-8 grid gap-4 lg:grid-cols-4">
                <AlertMetricCard label="Alert Events" value={alertSummary?.trackedAlerts ?? 0} />
                <AlertMetricCard label="Unread Alerts" value={alertSummary?.unreadCount ?? 0} toneClassName="text-amber-300" />
                <AlertMetricCard label="Snoozed Targets" value={alertSummary?.snoozedTargets ?? 0} toneClassName="text-sky-300" />
                <AlertMetricCard label="Avg Read Latency" value={`${alertSummary?.avgReadLatencyMinutes ?? 0}m`} toneClassName="text-violet-300" />
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-4">
                <AlertMetricCard label="Synced Personas" value={alertPersonaSummary?.trackedProfiles ?? 0} />
                <AlertMetricCard label="Dominant Mode" value={alertPersonaModeLabel(alertPersonaSummary?.dominantMode)} toneClassName="text-emerald-300" />
                <AlertMetricCard label="Avg Default Snooze" value={formatSnoozeHours(alertPersonaSummary?.avgDefaultSnoozeHours ?? 0)} toneClassName="text-sky-300" />
                <AlertMetricCard label="Persona Unread" value={`${alertPersonaSummary?.avgUnreadRate ?? 0}%`} toneClassName="text-amber-300" />
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
                        const pendingRequest = alertTuningRequests.find((entry) =>
                            (entry.status === 'pending' || entry.status === 'pending_second_approval')
                            && entry.source === recommendation.source
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
                                            onChange={(event) => onQueuedRequestNoteChange(recommendation.source, event.target.value)}
                                            maxLength={280}
                                            placeholder="왜 이 rollout 변경이 필요한지 남겨두면 approval queue에서 바로 볼 수 있습니다."
                                            className="mt-2 min-h-[84px] w-full rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-3 text-sm text-slate-200 outline-none placeholder:text-slate-600"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            void onQueueRecommendedRolloutRequest(recommendation);
                                        }}
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

            <AlertApprovalQueueSection
                alertTuningRequests={alertTuningRequests}
                approvalQueueSummary={approvalQueueSummary}
                processingRequestId={processingRequestId}
                resolutionNotes={resolutionNotes}
                onResolutionNoteChange={onResolutionNoteChange}
                onResolveApprovalRequest={onResolveApprovalRequest}
                currentUserUid={currentUserUid}
            />

            <AlertQueueOpsSection
                alertTuningAudit={alertTuningAudit}
                alertTuningAuditInbox={alertTuningAuditInbox}
                alertTuningDigest={alertTuningDigest}
                alertTuningWebhook={alertTuningWebhook}
                markingAuditId={markingAuditId}
                onMarkAuditEventsRead={onMarkAuditEventsRead}
                runningReminderDigest={runningReminderDigest}
                onRunReminderDigest={onRunReminderDigest}
                quickRollbackEntries={quickRollbackEntries}
                onRollbackAlertTuning={onRollbackAlertTuning}
                isSavingTuning={isSavingTuning}
                rollbackingHistoryId={rollbackingHistoryId}
            />

            <AlertRolloutSections
                alertRollout={alertRollout}
                alertRolloutTrends={alertRolloutTrends}
            />
        </>
    );
}
