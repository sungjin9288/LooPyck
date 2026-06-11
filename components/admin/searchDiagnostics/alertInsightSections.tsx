import type { AlertTuningSuggestion } from '@/lib/favorites/alertRecommendations';
import {
    formatTime,
    tuningSeverityClass,
} from './helpers';
import { AlertRecentEventCard } from './alertRecentEventCard';
import type {
    AlertSourceDrilldown,
    AlertSourceSummary,
    DiagnosticsResponse,
} from './types';

type AlertInsightSectionsProps = {
    alertSuggestions: AlertTuningSuggestion[];
    selectedAlertSuggestion: AlertTuningSuggestion | undefined;
    alertSummary: DiagnosticsResponse['alerts']['summary'] | null | undefined;
    selectedAlertSummary: AlertSourceSummary | undefined;
    selectedAlertEvents: DiagnosticsResponse['alerts']['recent'];
    selectedAlertDrilldown: AlertSourceDrilldown | undefined;
    onSelectSource: (source: string) => void;
};

export function AlertInsightSections({
    alertSuggestions,
    selectedAlertSuggestion,
    alertSummary,
    selectedAlertSummary,
    selectedAlertEvents,
    selectedAlertDrilldown,
    onSelectSource,
}: AlertInsightSectionsProps) {
    return (
        <>
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Recommended Alert Tuning</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            unread, 읽음 지연, 스누즈 비중을 기준으로 source별 권장 조치를 계산합니다.
                        </p>
                    </div>
                    {selectedAlertSuggestion && (
                        <span className={`inline-flex rounded-full px-3 py-2 text-xs font-bold ${tuningSeverityClass(selectedAlertSuggestion.severity)}`}>
                            {selectedAlertSuggestion.source} · {selectedAlertSuggestion.severity.toUpperCase()}
                        </span>
                    )}
                </div>

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                    {alertSuggestions.slice(0, 6).map((suggestion) => (
                        <div key={`tuning_${suggestion.source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{suggestion.source}</p>
                                    <p className="mt-2 text-sm text-slate-200">{suggestion.title}</p>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${tuningSeverityClass(suggestion.severity)}`}>
                                    {suggestion.severity.toUpperCase()}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{suggestion.description}</p>
                            {suggestion.recommendedSnoozeHours && (
                                <div className="mt-3 text-xs text-sky-200">
                                    권장 기본 스누즈: {suggestion.recommendedSnoozeHours >= 24
                                        ? `${Math.round(suggestion.recommendedSnoozeHours / 24)}d`
                                        : `${suggestion.recommendedSnoozeHours}h`}
                                </div>
                            )}
                        </div>
                    ))}
                    {alertSuggestions.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                            권장 조치를 계산할 alert tuning 데이터가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-white">Alert Ops Summary</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                소스별 알림 발생 수, 우선순위 분포, 스누즈 상태를 함께 봅니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Last alert update</div>
                            <div className="mt-1 font-semibold text-slate-200">{formatTime(alertSummary?.lastUpdatedAt)}</div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {(alertSummary?.sources || []).map((entry) => {
                            const isSelected = selectedAlertSummary?.source === entry.source;

                            return (
                                <button
                                    key={`alert_${entry.source}`}
                                    type="button"
                                    onClick={() => onSelectSource(entry.source)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${isSelected ? 'border-sky-500/40 bg-slate-900/90' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{entry.source}</p>
                                            <p className="mt-2 text-xs text-slate-400">
                                                alerts {entry.alerts} · unread {entry.unreadCount} · archived {entry.archivedCount}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            snoozed {entry.snoozedTargets}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-4">
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            critical <span className="font-semibold text-rose-200">{entry.criticalPriorityCount}</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            high <span className="font-semibold text-amber-200">{entry.highPriorityCount}</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            targets <span className="font-semibold text-sky-200">{entry.activeTargets}</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            read <span className="font-semibold text-violet-200">{entry.avgReadLatencyMinutes}m</span>
                                        </div>
                                    </div>
                                    <div className="mt-2 text-[11px] text-slate-500">
                                        last seen {formatTime(entry.lastSeenAt)}
                                    </div>
                                </button>
                            );
                        })}
                        {(alertSummary?.sources || []).length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                최근 알림 운영 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <h2 className="text-lg font-bold text-white">Recent Alert Events</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        {selectedAlertSummary
                            ? `${selectedAlertSummary.source} 기준 recent alert 흐름입니다.`
                            : '최근 가격 알림 이벤트입니다.'}
                    </p>
                    <div className="mt-4 space-y-3">
                        {selectedAlertEvents.slice(0, 10).map((entry) => (
                            <AlertRecentEventCard
                                key={`${entry.id}_${entry.generatedAt}`}
                                entry={entry}
                                showMeta
                                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
                            />
                        ))}
                        {selectedAlertEvents.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                recent alert event가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Alert Source Drilldown</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            선택된 source의 unread, snooze, mall, variant 분포를 drilldown으로 봅니다.
                        </p>
                    </div>
                    {selectedAlertDrilldown && (
                        <span className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200">
                            {selectedAlertDrilldown.source}
                        </span>
                    )}
                </div>

                {selectedAlertDrilldown ? (
                    <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                        <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Unread Rate</p>
                                    <p className="mt-2 text-3xl font-black text-amber-200">{selectedAlertDrilldown.unreadRate}%</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Archived</p>
                                    <p className="mt-2 text-3xl font-black text-slate-100">{selectedAlertDrilldown.archivedRate}%</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Latency</p>
                                    <p className="mt-2 text-3xl font-black text-violet-200">{selectedAlertDrilldown.avgReadLatencyMinutes}m</p>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h3 className="text-sm font-semibold text-white">Top Malls</h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedAlertDrilldown.topMalls.map((entry) => (
                                        <span key={`${selectedAlertDrilldown.source}_mall_${entry.name}`} className="rounded-full border border-slate-800 px-3 py-2 text-xs text-slate-300">
                                            {entry.name} · {entry.count}
                                        </span>
                                    ))}
                                    {selectedAlertDrilldown.topMalls.length === 0 && (
                                        <span className="text-xs text-slate-500">mall breakdown이 없습니다.</span>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h3 className="text-sm font-semibold text-white">Top Variants</h3>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {selectedAlertDrilldown.topVariants.map((entry) => (
                                        <span key={`${selectedAlertDrilldown.source}_variant_${entry.label}`} className="rounded-full border border-slate-800 px-3 py-2 text-xs text-slate-300">
                                            {entry.label} · {entry.count}
                                        </span>
                                    ))}
                                    {selectedAlertDrilldown.topVariants.length === 0 && (
                                        <span className="text-xs text-slate-500">variant breakdown이 없습니다.</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h3 className="text-sm font-semibold text-white">Recent Critical Alerts</h3>
                                <div className="mt-3 space-y-3">
                                    {selectedAlertDrilldown.recentCritical.map((entry) => (
                                        <AlertRecentEventCard key={`critical_${entry.id}`} entry={entry} />
                                    ))}
                                    {selectedAlertDrilldown.recentCritical.length === 0 && (
                                        <div className="text-xs text-slate-500">critical alert가 없습니다.</div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h3 className="text-sm font-semibold text-white">Recent Unread Alerts</h3>
                                <div className="mt-3 space-y-3">
                                    {selectedAlertDrilldown.recentUnread.map((entry) => (
                                        <AlertRecentEventCard key={`unread_${entry.id}`} entry={entry} badgeMode="read" />
                                    ))}
                                    {selectedAlertDrilldown.recentUnread.length === 0 && (
                                        <div className="text-xs text-slate-500">unread alert가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                        drilldown 대상 source를 선택하면 상세 alert ops 상태가 표시됩니다.
                    </div>
                )}
            </section>
        </>
    );
}
