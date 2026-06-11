import { approvalStatusLabel, formatHours, formatTime } from './helpers';
import type { AlertTuningReminderDigest } from './types';

type AlertOverdueRequestCardProps = {
    entry: AlertTuningReminderDigest['overdueRequests'][number];
};

export function AlertOverdueRequestCard({
    entry,
}: AlertOverdueRequestCardProps) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-xs text-slate-300">
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
    );
}
