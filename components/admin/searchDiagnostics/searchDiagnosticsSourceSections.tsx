import {
    buildLowFitQueries,
    buildSourceDrilldown,
    buildSourceTrend,
    collectionModeClass,
    collectionModeLabel,
    formatTime,
    interactionLabel,
    strategyLabel,
} from './helpers';
import type { DiagnosticsResponse, RecentInteraction, RecentSnapshot, SourceSummary } from './types';

type LowFitQuery = ReturnType<typeof buildLowFitQueries>[number];
type SourceDrilldown = ReturnType<typeof buildSourceDrilldown>;
type SourceTrendPoint = ReturnType<typeof buildSourceTrend>[number];

const BADGE_COHORT_LABELS: Record<DiagnosticsResponse['interactionSummary']['badgeCohorts'][number]['cohort'], string> = {
    'shipping+benefit': '배송 + 혜택',
    shipping: '배송',
    benefit: '혜택',
    none: '배지 없음',
};

type SearchDiagnosticsSourceSectionsProps = {
    lowFitQueries: LowFitQuery[];
    interactionSummary?: DiagnosticsResponse['interactionSummary'];
    recentInteractions: RecentInteraction[];
    sources: SourceSummary[];
    selectedSource: string | null;
    onSelectSource: (source: string) => void;
    selectedSummary: SourceSummary | null;
    drilldown: SourceDrilldown;
    trendPoints: SourceTrendPoint[];
    recentSnapshots: RecentSnapshot[];
};

export function SearchDiagnosticsSourceSections({
    lowFitQueries,
    interactionSummary,
    recentInteractions,
    sources,
    selectedSource,
    onSelectSource,
    selectedSummary,
    drilldown,
    trendPoints,
    recentSnapshots,
}: SearchDiagnosticsSourceSectionsProps) {
    return (
        <>
            <section className="mt-8 grid gap-4 lg:grid-cols-2">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <h2 className="text-lg font-bold text-white">Low-fit Queries</h2>
                    <div className="mt-4 space-y-3">
                        {lowFitQueries.map((entry) => (
                            <div key={`${entry.generatedAt}_${entry.query}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                        <p className="mt-1 text-sm font-semibold text-white">{entry.query}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.quality === 'weak' ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-500/15 text-amber-200'}`}>
                                        {entry.quality}
                                    </span>
                                </div>
                                <div className="mt-3 text-xs text-slate-400">totalProducts {entry.totalProducts}</div>
                                {entry.suggestedQueries.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {entry.suggestedQueries.map((suggestion) => (
                                            <span key={`${entry.generatedAt}_${suggestion}`} className="rounded-full border border-slate-800 px-2 py-1 text-[11px] text-slate-300">
                                                {suggestion}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {lowFitQueries.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                최근 low-fit query가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <h2 className="text-lg font-bold text-white">Interaction Signals</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Suggested Queries</p>
                            <div className="mt-3 space-y-2">
                                {(interactionSummary?.topSelectedQueries || []).map((entry) => (
                                    <div key={entry.query} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                                        <span>{entry.query}</span>
                                        <span className="font-semibold text-sky-200">{entry.count}</span>
                                    </div>
                                ))}
                                {(interactionSummary?.topSelectedQueries || []).length === 0 && (
                                    <div className="text-sm text-slate-500">추천 클릭 데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Opened Brands</p>
                            <div className="mt-3 space-y-2">
                                {(interactionSummary?.topOpenedBrands || []).map((entry) => (
                                    <div key={entry.brand} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                                        <span>{entry.brand}</span>
                                        <span className="font-semibold text-violet-200">{entry.count}</span>
                                    </div>
                                ))}
                                {(interactionSummary?.topOpenedBrands || []).length === 0 && (
                                    <div className="text-sm text-slate-500">상품 열람 데이터가 없습니다.</div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="flex flex-wrap items-end justify-between gap-2">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Badge Cohort Open Rate</p>
                                <p className="mt-1 text-xs text-slate-500">최근 표본에서 동일 검색어의 노출 ID와 매칭된 고유 상품 열람 기준</p>
                            </div>
                            <span className="text-xs font-semibold text-slate-400">
                                {interactionSummary?.productImpressions ?? 0} impressions
                            </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {(interactionSummary?.badgeCohorts || []).map((entry) => (
                                <div key={entry.cohort} className="rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-sm font-semibold text-slate-200">{BADGE_COHORT_LABELS[entry.cohort]}</span>
                                        <span className="text-sm font-black text-lime-200">{entry.openRate}%</span>
                                    </div>
                                    <p className="mt-2 text-xs text-slate-500">
                                        {entry.opens} opens / {entry.impressions} impressions
                                    </p>
                                </div>
                            ))}
                            {(interactionSummary?.badgeCohorts || []).length === 0 && (
                                <div className="text-sm text-slate-500">배지 cohort 표본이 없습니다.</div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {recentInteractions.map((entry, index) => (
                            <div key={`${entry.generatedAt}_${entry.type}_${entry.productId || entry.selectedQuery || entry.query}_${entry.context || 'general'}_${entry.productIds?.join(',') || 'single'}_${index}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                        <p className="mt-1 text-sm font-semibold text-white">{interactionLabel(entry.type)}</p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                        {entry.context || 'general'}
                                    </span>
                                </div>
                                <div className="mt-3 text-xs text-slate-400">
                                    <div>query: <span className="text-slate-200">{entry.query}</span></div>
                                    {entry.selectedQuery && <div>selected: <span className="text-sky-200">{entry.selectedQuery}</span></div>}
                                    {entry.productTitle && <div>product: <span className="text-slate-200">{entry.productTitle}</span></div>}
                                    {entry.brand && <div>brand: <span className="text-slate-200">{entry.brand}</span></div>}
                                    {entry.source && <div>source: <span className="text-slate-200">{entry.source}</span></div>}
                                    {entry.productIds && entry.productIds.length > 0 && (
                                        <div>products: <span className="text-slate-200">{entry.productIds.length}</span></div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {recentInteractions.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                최근 interaction 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Source Summary</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                            <tr>
                                <th className="px-5 py-3">Source</th>
                                <th className="px-5 py-3">Success</th>
                                <th className="px-5 py-3">Avg Latency</th>
                                <th className="px-5 py-3">Direct</th>
                                <th className="px-5 py-3">Fallback</th>
                                <th className="px-5 py-3">Empty</th>
                                <th className="px-5 py-3">Last Strategy</th>
                                <th className="px-5 py-3">Last Seen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sources.map((entry) => {
                                const isSelected = selectedSource === entry.source;
                                return (
                                    <tr
                                        key={entry.source}
                                        className={`border-t border-slate-800 text-slate-200 transition-colors ${isSelected ? 'bg-slate-900/80' : 'hover:bg-slate-900/40'}`}
                                    >
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => onSelectSource(entry.source)}
                                                className="text-left"
                                            >
                                                <div className="font-semibold text-white">{entry.source}</div>
                                            </button>
                                            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${collectionModeClass(entry.collectionMode)}`}>
                                                {collectionModeLabel(entry.collectionMode)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">{entry.successRate}%</td>
                                        <td className="px-5 py-4">{entry.avgLatencyMs}ms</td>
                                        <td className="px-5 py-4">{entry.directHits}</td>
                                        <td className="px-5 py-4 text-amber-300">{entry.fallbackHits}</td>
                                        <td className="px-5 py-4 text-rose-300">{entry.emptyHits}</td>
                                        <td className="px-5 py-4">
                                            <div>{strategyLabel(entry.lastStrategy)}</div>
                                            {entry.lastFallbackReason && (
                                                <div className="mt-1 text-xs text-slate-500">{entry.lastFallbackReason}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-400">{formatTime(entry.lastSeenAt)}</td>
                                    </tr>
                                );
                            })}
                            {sources.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                                        수집된 진단 데이터가 없습니다.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Source Drill-down</h2>
                </div>
                {selectedSummary ? (
                    <div className="p-5">
                        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                            <div>
                                <div className="flex items-center gap-3">
                                    <h3 className="text-2xl font-black tracking-tight text-white">{selectedSummary.source}</h3>
                                    <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.16em] ${collectionModeClass(selectedSummary.collectionMode)}`}>
                                        {collectionModeLabel(selectedSummary.collectionMode)}
                                    </span>
                                </div>
                                <p className="mt-2 text-sm text-slate-400">
                                    최근 실패 샘플 query, source별 resolved query, fallback reason을 바로 확인할 수 있습니다.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                    <div>Direct Hits</div>
                                    <div className="mt-1 text-lg font-bold text-emerald-300">{selectedSummary.directHits}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                    <div>Fallback Hits</div>
                                    <div className="mt-1 text-lg font-bold text-amber-300">{selectedSummary.fallbackHits}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                    <div>Empty Hits</div>
                                    <div className="mt-1 text-lg font-bold text-rose-300">{selectedSummary.emptyHits}</div>
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h4 className="text-sm font-bold text-white">Failure / Fallback Samples</h4>
                                <div className="mt-4 space-y-3">
                                    {drilldown.failureSamples.slice(0, 8).map((sample) => (
                                        <div key={`${sample.generatedAt}_${sample.query}_${sample.strategy}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(sample.generatedAt)}</p>
                                                    <p className="mt-1 text-sm font-semibold text-white">{sample.query}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                    {strategyLabel(sample.strategy)}
                                                </span>
                                            </div>
                                            <div className="mt-3 text-xs text-slate-400">
                                                <div>finalCount: {sample.finalCount}</div>
                                                {sample.resolvedQuery && <div>resolved: <span className="text-sky-200">{sample.resolvedQuery}</span></div>}
                                                {sample.requestedQueries && sample.requestedQueries.length > 1 && (
                                                    <div>candidates: <span className="text-slate-300">{sample.requestedQueries.join(' / ')}</span></div>
                                                )}
                                                <div>reason: <span className="text-amber-200">{sample.fallbackReason || 'none'}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                    {drilldown.failureSamples.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                            최근 window에서 failure / fallback 샘플이 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h4 className="text-sm font-bold text-white">Successful Samples</h4>
                                <div className="mt-4 space-y-3">
                                    {drilldown.successSamples.slice(0, 8).map((sample) => (
                                        <div key={`${sample.generatedAt}_${sample.query}_${sample.strategy}_activity`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(sample.generatedAt)}</p>
                                                    <p className="mt-1 text-sm font-semibold text-white">{sample.query}</p>
                                                </div>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                    {strategyLabel(sample.strategy)}
                                                </span>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                                                <span className="rounded-full border border-slate-800 px-2 py-1">final {sample.finalCount}</span>
                                                <span className="rounded-full border border-slate-800 px-2 py-1">total {sample.totalProducts}</span>
                                                {sample.resolvedQuery && (
                                                    <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-200">
                                                        resolved {sample.resolvedQuery}
                                                    </span>
                                                )}
                                                {sample.fallbackReason && (
                                                    <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-200">
                                                        {sample.fallbackReason}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {drilldown.successSamples.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                            최근 성공 샘플이 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <h4 className="text-sm font-bold text-white">Recent Daily Trend</h4>
                            <div className="mt-4 space-y-3">
                                {trendPoints.map((point) => (
                                    <div key={`${selectedSummary.source}_${point.day}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                        <div className="mb-2 flex items-center justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{point.day}</p>
                                                <p className="mt-1 text-sm text-slate-300">{point.samples} samples · {point.totalItems} items</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-lg font-black text-white">{point.successRate}%</p>
                                                <p className="text-[11px] text-slate-500">success rate</p>
                                            </div>
                                        </div>
                                        <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                                            <div
                                                className="h-full bg-emerald-400"
                                                style={{ width: `${point.samples > 0 ? (point.directSamples / point.samples) * 100 : 0}%` }}
                                            />
                                            <div
                                                className="h-full bg-amber-400"
                                                style={{ width: `${point.samples > 0 ? (point.fallbackSamples / point.samples) * 100 : 0}%`, marginTop: '-0.75rem' }}
                                            />
                                            <div
                                                className="h-full bg-rose-400"
                                                style={{ width: `${point.samples > 0 ? (point.emptySamples / point.samples) * 100 : 0}%`, marginTop: '-0.75rem' }}
                                            />
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                            <span className="rounded-full border border-slate-800 px-2 py-1 text-emerald-300">direct {point.directSamples}</span>
                                            <span className="rounded-full border border-slate-800 px-2 py-1 text-amber-300">fallback {point.fallbackSamples}</span>
                                            <span className="rounded-full border border-slate-800 px-2 py-1 text-rose-300">empty {point.emptySamples}</span>
                                        </div>
                                    </div>
                                ))}
                                {trendPoints.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                        최근 추이 데이터가 없습니다.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-5 text-sm text-slate-500">선택된 소스가 없습니다.</div>
                )}
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60">
                <div className="border-b border-slate-800 px-5 py-4">
                    <h2 className="text-lg font-bold text-white">Recent Searches</h2>
                </div>
                <div className="grid gap-4 p-5 lg:grid-cols-2">
                    {recentSnapshots.map((snapshot) => (
                        <article key={`${snapshot.generatedAt}_${snapshot.query}_${snapshot.page}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{formatTime(snapshot.generatedAt)}</p>
                                    <h3 className="mt-2 text-lg font-bold text-white">{snapshot.query}</h3>
                                    <p className="mt-1 text-sm text-slate-400">
                                        page {snapshot.page} · {snapshot.sort} · {snapshot.totalProducts} products
                                    </p>
                                    {snapshot.effectiveQuery && snapshot.effectiveQuery !== snapshot.query && (
                                        <p className="mt-1 text-xs text-sky-200">effective {snapshot.effectiveQuery}</p>
                                    )}
                                </div>
                                <div className="text-right text-xs text-slate-400">
                                    <div>Direct {snapshot.directSourceCount}</div>
                                    <div>Fallback {snapshot.fallbackSourceCount}</div>
                                    {snapshot.resultQuality && <div>Fit {snapshot.resultQuality}</div>}
                                </div>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {snapshot.sources
                                    .filter((source) => source.finalCount > 0)
                                    .map((source) => (
                                        <span key={`${snapshot.generatedAt}_${source.source}`} className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
                                            {source.source} · {strategyLabel(source.strategy)} · {source.finalCount}
                                        </span>
                                    ))}
                            </div>
                        </article>
                    ))}
                    {recentSnapshots.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-500">
                            최근 검색 진단 데이터가 없습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
