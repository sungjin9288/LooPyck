import { auditLevelClass, auditTypeLabel, formatTime } from './helpers';
import type { AlertTuningAuditEvent } from './types';

type AlertAuditEventCardProps = {
    event: AlertTuningAuditEvent;
    markingAuditId: string | null;
    onMarkAuditEventsRead: (ids: string[], markAll?: boolean) => Promise<void> | void;
};

export function AlertAuditEventCard({
    event,
    markingAuditId,
    onMarkAuditEventsRead,
}: AlertAuditEventCardProps) {
    return (
        <div className={`rounded-2xl border p-3 ${event.read ? 'border-slate-800 bg-slate-950/70' : 'border-sky-700/30 bg-sky-500/5'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-semibold text-white">{event.title}</p>
                    <p className="mt-2 text-xs leading-6 text-slate-400">{event.message}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {!event.read && (
                        <span className="rounded-full border border-sky-700/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-200">
                            UNREAD
                        </span>
                    )}
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${auditLevelClass(event.level)}`}>
                        {auditTypeLabel(event.type)}
                    </span>
                </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
                <span>{formatTime(event.createdAt)}</span>
                {event.source && <span>{event.source}</span>}
                {event.actorUid && <span>{event.actorUid}</span>}
                {event.requestId && <span>request {event.requestId.slice(0, 8)}</span>}
                {event.readAt && <span>read {formatTime(event.readAt)}</span>}
            </div>
            {event.note && (
                <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-xs text-slate-300">
                    {event.note}
                </div>
            )}
            {!event.read && (
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={() => {
                            void onMarkAuditEventsRead([event.id]);
                        }}
                        disabled={Boolean(markingAuditId)}
                        className="rounded-full border border-slate-700 px-3 py-2 text-[11px] font-bold text-slate-200 disabled:opacity-40"
                    >
                        {markingAuditId === event.id ? '처리 중...' : 'Mark Read'}
                    </button>
                </div>
            )}
        </div>
    );
}
