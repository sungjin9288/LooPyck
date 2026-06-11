import { AlertMetricCard } from './alertMetricCard';
import { AlertAuditEventCard } from './alertAuditEventCard';
import { AlertOverdueRequestCard } from './alertOverdueRequestCard';
import { AlertQuickRollbackCard } from './alertQuickRollbackCard';
import {
    formatTime,
    webhookFormatLabel,
} from './helpers';
import type {
    AlertTuningAuditEvent,
    AlertTuningAuditInboxSummary,
    AlertTuningHistoryEntry,
    AlertTuningReminderDigest,
    AlertTuningWebhookConfig,
} from './types';

type AlertQueueOpsSectionProps = {
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
};

export function AlertQueueOpsSection({
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
}: AlertQueueOpsSectionProps) {
    return (
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
                    onClick={() => {
                        void onMarkAuditEventsRead([], true);
                    }}
                    disabled={alertTuningAuditInbox.unreadCount === 0 || Boolean(markingAuditId)}
                    className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200 disabled:opacity-40"
                >
                    {markingAuditId === '__all__' ? '처리 중...' : 'Mark All Read'}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        void onRunReminderDigest();
                    }}
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
                        <AlertMetricCard label="Digest Open" value={alertTuningDigest.openCount} description="current open approval requests" />
                        <AlertMetricCard label="Digest Overdue" value={alertTuningDigest.overdueCount} description="SLA를 넘긴 request" toneClassName="text-amber-200" />
                        <AlertMetricCard label="Expired" value={alertTuningDigest.expiredCount} description="auto-expire 누적" toneClassName="text-rose-200" />
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
                                    <AlertOverdueRequestCard
                                        key={`digest_overdue_${entry.requestId}`}
                                        entry={entry}
                                    />
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
                                    <AlertQuickRollbackCard
                                        key={`quick_rollback_${entry.id}`}
                                        entry={entry}
                                        isSavingTuning={isSavingTuning}
                                        rollbackingHistoryId={rollbackingHistoryId}
                                        onRollbackAlertTuning={onRollbackAlertTuning}
                                    />
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
                            <AlertAuditEventCard
                                key={`audit_event_${event.id}`}
                                event={event}
                                markingAuditId={markingAuditId}
                                onMarkAuditEventsRead={onMarkAuditEventsRead}
                            />
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
    );
}
