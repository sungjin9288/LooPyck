import { approvalStatusClass, approvalStatusLabel, formatHours, formatTime, requestAgeHours, requestExpiresAt } from './helpers';
import type { AlertTuningApprovalRequest } from './types';

type AlertApprovalRequestCardProps = {
    request: AlertTuningApprovalRequest;
    processingRequestId: string | null;
    resolutionNote: string;
    onResolutionNoteChange: (requestId: string, note: string) => void;
    onResolveApprovalRequest: (requestId: string, action: 'approve' | 'reject') => Promise<void> | void;
    currentUserUid: string | null;
};

export function AlertApprovalRequestCard({
    request,
    processingRequestId,
    resolutionNote,
    onResolutionNoteChange,
    onResolveApprovalRequest,
    currentUserUid,
}: AlertApprovalRequestCardProps) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
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
                {(request.status === 'pending' || request.status === 'pending_second_approval') && (
                    <span className="rounded-full border border-slate-800 px-2 py-1">
                        expires {formatTime(requestExpiresAt(request.createdAt))}
                    </span>
                )}
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

            {(request.status === 'pending' || request.status === 'pending_second_approval') ? (
                <div className="mt-4 space-y-3">
                    <label className="block">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Decision Note</span>
                        <textarea
                            value={resolutionNote}
                            onChange={(event) => onResolutionNoteChange(request.id, event.target.value)}
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
                    {request.createdBy === currentUserUid && (
                        <p className="text-[11px] text-amber-300">
                            다중 admin 설정이면 request 생성자는 self-approve가 차단됩니다.
                        </p>
                    )}
                    {request.approvals.some((approval) => approval.uid === currentUserUid) && (
                        <p className="text-[11px] text-amber-300">
                            이미 approve한 request입니다. 같은 관리자는 두 번 approve할 수 없습니다.
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                void onResolveApprovalRequest(request.id, 'approve');
                            }}
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
                            onClick={() => {
                                void onResolveApprovalRequest(request.id, 'reject');
                            }}
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
    );
}
