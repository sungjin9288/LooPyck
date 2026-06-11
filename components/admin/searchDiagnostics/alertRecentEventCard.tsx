import {
    alertPriorityClass,
    alertPriorityLabel,
    formatHours,
    formatTime,
} from './helpers';
import type { AlertRecentEvent } from './types';

type AlertRecentEventCardProps = {
    entry: AlertRecentEvent;
    badgeMode?: 'priority' | 'read';
    showMeta?: boolean;
    className?: string;
};

export function AlertRecentEventCard({
    entry,
    badgeMode = 'priority',
    showMeta = false,
    className = 'rounded-xl border border-slate-800 bg-slate-950/70 p-3',
}: AlertRecentEventCardProps) {
    return (
        <div className={className}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                    <p className="mt-1 text-sm font-semibold text-white">{entry.title}</p>
                </div>
                <span
                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        badgeMode === 'read'
                            ? entry.read
                                ? 'bg-slate-700/60 text-slate-200'
                                : 'bg-amber-500/15 text-amber-200'
                            : alertPriorityClass(entry.priority)
                    }`}
                >
                    {badgeMode === 'read' ? (entry.read ? 'read' : 'unread') : alertPriorityLabel(entry.priority)}
                </span>
            </div>
            {showMeta && (
                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                    <span className="rounded-full border border-slate-800 px-2 py-1">{entry.source}</span>
                    {entry.mallName && (
                        <span className="rounded-full border border-slate-800 px-2 py-1">{entry.mallName}</span>
                    )}
                    {entry.variantLabel && (
                        <span className="rounded-full border border-slate-800 px-2 py-1">{entry.variantLabel}</span>
                    )}
                    {typeof entry.currentPrice === 'number' && (
                        <span className="rounded-full border border-slate-800 px-2 py-1">now {formatHours(entry.currentPrice)}</span>
                    )}
                    {typeof entry.targetPrice === 'number' && (
                        <span className="rounded-full border border-slate-800 px-2 py-1">target {formatHours(entry.targetPrice)}</span>
                    )}
                </div>
            )}
        </div>
    );
}
