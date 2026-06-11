'use client';

import { performanceMonitor } from '@/lib/core/performanceMonitor';
import { buildDebugConsoleModel } from './searchDiagnostics/debugConsoleModel';
import { formatTime } from './searchDiagnostics/helpers';
import type { DiagnosticsResponse, SearchDiagnosticsFetchTelemetry } from './searchDiagnostics/types';

type DebugConsoleProps = {
    data: DiagnosticsResponse | null;
    error: string | null;
    isFetching: boolean;
    fetchTelemetry: SearchDiagnosticsFetchTelemetry;
};

const STATUS_BADGE_CLASS = {
    healthy: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200',
    degraded: 'border-amber-400/30 bg-amber-400/10 text-amber-200',
    critical: 'border-rose-400/30 bg-rose-400/10 text-rose-200',
    neutral: 'border-slate-700 bg-slate-800/70 text-slate-300',
} as const;

const STATUS_DOT_CLASS = {
    healthy: 'bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.45)]',
    degraded: 'bg-amber-300 shadow-[0_0_18px_rgba(252,211,77,0.45)]',
    critical: 'bg-rose-300 shadow-[0_0_18px_rgba(253,164,175,0.45)]',
} as const;

export default function DebugConsole({
    data,
    error,
    isFetching,
    fetchTelemetry,
}: DebugConsoleProps) {
    const model = buildDebugConsoleModel({
        data,
        error,
        isFetching,
        fetchTelemetry,
        metrics: performanceMonitor
            .getRecentMetrics(20)
            .filter((entry) => entry.operationName === 'admin:realtime-search-diagnostics'),
    });

    const leadIssue = model.issues[0] || null;

    return (
        <section className="relative mt-8 overflow-hidden rounded-[2rem] border border-slate-800/90 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] px-5 py-6 shadow-[0_28px_100px_rgba(2,6,23,0.45)] sm:px-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/60 to-transparent" />
            <div className="pointer-events-none absolute -left-20 top-0 h-40 w-40 rounded-full bg-sky-400/12 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-48 w-48 rounded-full bg-emerald-400/8 blur-3xl" />

            <div className="relative grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.35fr)]">
                <div className="border-b border-slate-800/80 pb-6 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sky-300/80">Debug Console</p>
                            <h2 className="mt-3 text-3xl font-black tracking-[-0.04em] text-white sm:text-[2.2rem]">
                                Admin runtime telemetry
                            </h2>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
                                Polling health, fallback storage, and live operator signals are kept on one surface so the admin panel still reads clearly after transient notifications disappear.
                            </p>
                        </div>
                        <div className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] transition-transform duration-300 hover:-translate-y-0.5 ${STATUS_BADGE_CLASS[model.status]}`}>
                            <span className={`h-2.5 w-2.5 rounded-full ${STATUS_DOT_CLASS[model.status]}`} />
                            <span>{model.statusLabel}</span>
                            <span className="text-[10px] opacity-80">{model.isFetching ? 'refreshing' : 'idle'}</span>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[1.6rem] border border-slate-800/80 bg-slate-950/55 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Operator Read</p>
                            <span className="text-[11px] text-slate-500">15s polling cadence</span>
                        </div>
                        <div className="mt-3 flex items-start gap-3">
                            <div className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${STATUS_DOT_CLASS[leadIssue?.tone || model.status]}`} />
                            <div>
                                <p className="text-sm font-semibold text-white">
                                    {leadIssue ? leadIssue.message : '지금 바로 대응이 필요한 runtime issue는 없습니다.'}
                                </p>
                                <p className="mt-1 text-sm text-slate-400">{model.summary}</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        {[
                            {
                                label: 'Poll Latency',
                                value: `${model.averageDurationMs}ms`,
                                detail: `last ${model.lastDurationMs ?? 0}ms`,
                                accent: 'text-sky-200',
                            },
                            {
                                label: 'Fetch Success',
                                value: `${model.fetchSuccessRate}%`,
                                detail: `${model.successCount}/${model.requestCount} success`,
                                accent: 'text-emerald-200',
                            },
                            {
                                label: 'Failure Streak',
                                value: String(fetchTelemetry.consecutiveFailures),
                                detail: `total failures ${model.failureCount}`,
                                accent: 'text-amber-200',
                            },
                            {
                                label: 'Tracked Sources',
                                value: String(data?.summary.sources.length ?? 0),
                                detail: `updated ${formatTime(data?.summary.lastUpdatedAt)}`,
                                accent: 'text-violet-200',
                            },
                        ].map((item) => (
                            <div
                                key={item.label}
                                className="group rounded-[1.5rem] border border-slate-800/80 bg-slate-950/50 px-4 py-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-950/70"
                            >
                                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                                <p className={`mt-3 text-[2rem] font-black tracking-[-0.05em] ${item.accent}`}>{item.value}</p>
                                <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                        <div className="rounded-[1.8rem] border border-slate-800/80 bg-slate-950/50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Runtime Status</h3>
                                <span className="text-[11px] text-slate-500">storage + webhook visibility</span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {model.storageBadges.map((badge) => (
                                    <span
                                        key={badge.label}
                                        className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${STATUS_BADGE_CLASS[badge.tone]}`}
                                    >
                                        {badge.label}: {badge.value}
                                    </span>
                                ))}
                            </div>

                            <div className="mt-5 space-y-2.5">
                                {model.issues.length > 0 ? model.issues.map((issue, index) => (
                                    <div
                                        key={`${issue.message}-${index}`}
                                        className={`rounded-[1.25rem] border px-3 py-3 text-sm ${STATUS_BADGE_CLASS[issue.tone]}`}
                                    >
                                        {issue.message}
                                    </div>
                                )) : (
                                    <div className="rounded-[1.25rem] border border-emerald-400/30 bg-emerald-400/10 px-3 py-3 text-sm text-emerald-200">
                                        현재 감지된 runtime issue가 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-[1.8rem] border border-slate-800/80 bg-slate-950/50 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Recent Diagnostics Polls</h3>
                                <span className="text-[11px] text-slate-500">latest 8 samples</span>
                            </div>
                            <div className="mt-4 space-y-2.5">
                                {model.recentOperations.length > 0 ? model.recentOperations.map((metric) => (
                                    <div
                                        key={`${metric.timestamp}-${metric.operationName}`}
                                        className="rounded-[1.25rem] border border-slate-800/80 bg-slate-950/75 px-3 py-3 text-sm text-slate-300 transition-all duration-300 hover:border-slate-700 hover:bg-slate-950"
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="truncate font-medium text-slate-100">{metric.operationName}</span>
                                            <span className={metric.durationMs > 500 ? 'font-bold text-amber-300' : 'font-bold text-emerald-300'}>
                                                {metric.durationMs}ms
                                            </span>
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">{formatTime(metric.timestamp)}</div>
                                    </div>
                                )) : (
                                    <div className="rounded-[1.25rem] border border-slate-800/80 bg-slate-950/75 px-3 py-4 text-sm text-slate-500">
                                        아직 이 세션에서 기록된 diagnostics polling metric이 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 rounded-[1.8rem] border border-slate-800/80 bg-slate-950/50 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Recent Errors</h3>
                            <span className="text-[11px] text-slate-500">latest 5 fetch failures</span>
                        </div>
                        <div className="mt-4 grid gap-2.5 lg:grid-cols-2">
                            {model.recentErrors.length > 0 ? model.recentErrors.map((entry) => (
                                <div
                                    key={`${entry.at}-${entry.message}`}
                                    className="rounded-[1.25rem] border border-rose-400/20 bg-[linear-gradient(135deg,rgba(190,24,93,0.16),rgba(15,23,42,0.8))] px-3 py-3 text-sm text-rose-100"
                                >
                                    <div className="font-medium">{entry.message}</div>
                                    <div className="mt-1 text-xs text-rose-200/70">{formatTime(entry.at)}</div>
                                </div>
                            )) : (
                                <div className="rounded-[1.25rem] border border-slate-800/80 bg-slate-950/75 px-3 py-4 text-sm text-slate-500 lg:col-span-2">
                                    최근 fetch error가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
