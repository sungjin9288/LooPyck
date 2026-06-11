import { AlertMetricCard } from './alertMetricCard';
import { AlertApprovalRequestCard } from './alertApprovalRequestCard';
import { formatHours, formatTime } from './helpers';
import type { AlertTuningApprovalRequest, ApprovalQueueSummary } from './types';

type AlertApprovalQueueSectionProps = {
    alertTuningRequests: AlertTuningApprovalRequest[];
    approvalQueueSummary: ApprovalQueueSummary;
    processingRequestId: string | null;
    resolutionNotes: Record<string, string>;
    onResolutionNoteChange: (requestId: string, note: string) => void;
    onResolveApprovalRequest: (requestId: string, action: 'approve' | 'reject') => Promise<void> | void;
    currentUserUid: string | null;
};

export function AlertApprovalQueueSection({
    alertTuningRequests,
    approvalQueueSummary,
    processingRequestId,
    resolutionNotes,
    onResolutionNoteChange,
    onResolveApprovalRequest,
    currentUserUid,
}: AlertApprovalQueueSectionProps) {
    return (
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
                <AlertMetricCard label="Pending" value={approvalQueueSummary.pendingCount} description="1st approval 대기" />
                <AlertMetricCard label="Second Approval" value={approvalQueueSummary.secondApprovalCount} description="2nd approver 대기" toneClassName="text-sky-200" />
                <AlertMetricCard label="Over SLA" value={approvalQueueSummary.overdueCount} description="24h 초과 open request" toneClassName="text-amber-200" />
                <AlertMetricCard label="Expiring Soon" value={approvalQueueSummary.expiringSoonCount} description="48h auto-expire 임박" toneClassName="text-orange-200" />
                <AlertMetricCard label="Avg Resolve" value={formatHours(approvalQueueSummary.avgResolutionHours)} description="resolved mean turnaround" />
                <AlertMetricCard label="Within SLA" value={`${approvalQueueSummary.withinSlaRate}%`} description="resolved within 24h" toneClassName="text-emerald-200" />
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
                    <AlertApprovalRequestCard
                        key={`approval_request_${request.id}`}
                        request={request}
                        processingRequestId={processingRequestId}
                        resolutionNote={resolutionNotes[request.id] || ''}
                        onResolutionNoteChange={onResolutionNoteChange}
                        onResolveApprovalRequest={onResolveApprovalRequest}
                        currentUserUid={currentUserUid}
                    />
                ))}
                {alertTuningRequests.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                        아직 생성된 rollout approval request가 없습니다.
                    </div>
                )}
            </div>
        </section>
    );
}
