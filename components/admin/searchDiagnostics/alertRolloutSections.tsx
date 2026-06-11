import { rolloutDeltaClass } from './helpers';
import type { DiagnosticsResponse } from './types';

type AlertRolloutSectionsProps = {
    alertRollout: DiagnosticsResponse['alerts']['rollout'];
    alertRolloutTrends: DiagnosticsResponse['alerts']['rolloutTrends'];
};

export function AlertRolloutSections({
    alertRollout,
    alertRolloutTrends,
}: AlertRolloutSectionsProps) {
    return (
        <>
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Alert Rollout Performance</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            source override가 적용된 실험군과 control 그룹의 unread, snooze, 읽음 지연을 비교합니다.
                        </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                        <div>Tracked rollouts: <span className="font-semibold text-slate-200">{alertRollout.length}</span></div>
                    </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {alertRollout.map((entry) => (
                        <div key={`alert_rollout_${entry.source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{entry.source}</p>
                                    <p className="mt-2 text-xs text-slate-400">rollout {entry.rolloutPercentage}%</p>
                                </div>
                                <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                                    <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-emerald-200">
                                        experiment {entry.experiment.users} users
                                    </span>
                                    <span className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300">
                                        control {entry.control.users} users
                                    </span>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-200">Experiment</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                                        <div>alerts {entry.experiment.alerts} · unread {entry.experiment.unreadRate}%</div>
                                        <div>targets {entry.experiment.activeTargets} · snoozed {entry.experiment.snoozedTargetRate}%</div>
                                        <div>read latency {entry.experiment.avgReadLatencyMinutes}m</div>
                                    </div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-300">Control</p>
                                    <div className="mt-3 space-y-2 text-sm text-slate-200">
                                        <div>alerts {entry.control.alerts} · unread {entry.control.unreadRate}%</div>
                                        <div>targets {entry.control.activeTargets} · snoozed {entry.control.snoozedTargetRate}%</div>
                                        <div>read latency {entry.control.avgReadLatencyMinutes}m</div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid gap-3 md:grid-cols-3">
                                <div className="rounded-2xl bg-slate-950/70 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Unread Delta</p>
                                    <p className={`mt-2 text-lg font-black ${rolloutDeltaClass(entry.delta.unreadRate, 'lower_better')}`}>
                                        {entry.delta.unreadRate > 0 ? '+' : ''}{entry.delta.unreadRate}%
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">experiment - control</p>
                                </div>
                                <div className="rounded-2xl bg-slate-950/70 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Snooze Delta</p>
                                    <p className={`mt-2 text-lg font-black ${rolloutDeltaClass(entry.delta.snoozedTargetRate, 'lower_better')}`}>
                                        {entry.delta.snoozedTargetRate > 0 ? '+' : ''}{entry.delta.snoozedTargetRate}%
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">experiment - control</p>
                                </div>
                                <div className="rounded-2xl bg-slate-950/70 p-4">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500">Latency Delta</p>
                                    <p className={`mt-2 text-lg font-black ${rolloutDeltaClass(entry.delta.avgReadLatencyMinutes, 'lower_better')}`}>
                                        {entry.delta.avgReadLatencyMinutes > 0 ? '+' : ''}{entry.delta.avgReadLatencyMinutes}m
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">experiment - control</p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {alertRollout.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                            비교 가능한 rollout source가 없습니다. source override와 rollout 비율이 저장되면 여기에 실험군/대조군 비교가 표시됩니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Alert Rollout Trends</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            source별로 최근 7일 동안 experiment/control unread와 읽음 지연 추이를 봅니다.
                        </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                        <div>Trend sources: <span className="font-semibold text-slate-200">{alertRolloutTrends.length}</span></div>
                    </div>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {alertRolloutTrends.map((entry) => (
                        <div key={`alert_rollout_trend_${entry.source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{entry.source}</p>
                                    <p className="mt-2 text-xs text-slate-400">rollout {entry.rolloutPercentage}% · last {entry.points.length} days</p>
                                </div>
                            </div>

                            <div className="mt-4 overflow-x-auto">
                                <table className="min-w-full text-left text-xs text-slate-300">
                                    <thead className="text-slate-500">
                                        <tr>
                                            <th className="pb-2 pr-4 font-semibold">Day</th>
                                            <th className="pb-2 pr-4 font-semibold">Exp</th>
                                            <th className="pb-2 pr-4 font-semibold">Ctrl</th>
                                            <th className="pb-2 pr-4 font-semibold">Unread Δ</th>
                                            <th className="pb-2 font-semibold">Latency Δ</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {entry.points.map((point) => {
                                            const unreadDelta = Math.round((point.experimentUnreadRate - point.controlUnreadRate) * 10) / 10;
                                            const latencyDelta = point.experimentAvgReadLatencyMinutes - point.controlAvgReadLatencyMinutes;

                                            return (
                                                <tr key={`${entry.source}_${point.day}`} className="border-t border-slate-800/80 align-top">
                                                    <td className="py-2 pr-4 font-semibold text-slate-200">{point.day.slice(5)}</td>
                                                    <td className="py-2 pr-4">
                                                        <div>{point.experimentAlerts} alerts</div>
                                                        <div className="text-[11px] text-slate-500">unread {point.experimentUnreadRate}% · {point.experimentAvgReadLatencyMinutes}m</div>
                                                    </td>
                                                    <td className="py-2 pr-4">
                                                        <div>{point.controlAlerts} alerts</div>
                                                        <div className="text-[11px] text-slate-500">unread {point.controlUnreadRate}% · {point.controlAvgReadLatencyMinutes}m</div>
                                                    </td>
                                                    <td className={`py-2 pr-4 font-bold ${rolloutDeltaClass(unreadDelta, 'lower_better')}`}>
                                                        {unreadDelta > 0 ? '+' : ''}{unreadDelta}%
                                                    </td>
                                                    <td className={`py-2 font-bold ${rolloutDeltaClass(latencyDelta, 'lower_better')}`}>
                                                        {latencyDelta > 0 ? '+' : ''}{latencyDelta}m
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                    {alertRolloutTrends.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                            rollout trend를 계산할 최근 alert 이벤트가 아직 충분하지 않습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
