import { formatTime } from './helpers';
import type { AlertTuningHistoryEntry } from './types';

type AlertQuickRollbackCardProps = {
    entry: AlertTuningHistoryEntry;
    isSavingTuning: boolean;
    rollbackingHistoryId: string | null;
    onRollbackAlertTuning: (historyId: string) => Promise<void> | void;
};

export function AlertQuickRollbackCard({
    entry,
    isSavingTuning,
    rollbackingHistoryId,
    onRollbackAlertTuning,
}: AlertQuickRollbackCardProps) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
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
                    onClick={() => {
                        void onRollbackAlertTuning(entry.id);
                    }}
                    disabled={isSavingTuning || Boolean(rollbackingHistoryId)}
                    className="rounded-full border border-amber-700/40 px-3 py-2 text-[11px] font-bold text-amber-200 disabled:opacity-40"
                >
                    {rollbackingHistoryId === entry.id ? '복원 중...' : 'Quick Rollback'}
                </button>
            </div>
        </div>
    );
}
