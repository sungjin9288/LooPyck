import { formatTime, pdpStrategyLabel, webhookFormatLabel } from './helpers';
import type {
    ApprovalQueueSummary,
    DiagnosticsResponse,
    PdpRecentEvent,
    PdpSourceSummary,
    SourceHealthEntry,
} from './types';

const SOURCE_HEALTH_BADGE: Record<SourceHealthEntry['status'], { label: string; className: string }> = {
    failing: { label: 'FAILING', className: 'bg-rose-500/15 text-rose-300 border-rose-500/40' },
    degraded: { label: 'DEGRADED', className: 'bg-amber-500/15 text-amber-300 border-amber-500/40' },
    healthy: { label: 'HEALTHY', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40' },
    never_direct: { label: 'NEVER DIRECT', className: 'bg-slate-700/40 text-slate-400 border-slate-600/50' },
    no_data: { label: 'NO DATA', className: 'bg-slate-800/40 text-slate-500 border-slate-700/50' },
};

// 표시는 심각도 우선 — failing이 항상 맨 위에 오도록
const SOURCE_HEALTH_ORDER: SourceHealthEntry['status'][] = ['failing', 'degraded', 'healthy', 'never_direct', 'no_data'];

function SourceHealthSection({ sourceHealth }: { sourceHealth?: SourceHealthEntry[] }) {
    if (!sourceHealth || sourceHealth.length === 0) {
        return null;
    }

    const sorted = [...sourceHealth].sort(
        (left, right) => SOURCE_HEALTH_ORDER.indexOf(left.status) - SOURCE_HEALTH_ORDER.indexOf(right.status)
    );
    const failingCount = sourceHealth.filter((entry) => entry.status === 'failing').length;

    return (
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Source Health</p>
                    <p className="mt-1 text-sm text-slate-400">
                        되다가 죽은 소스(FAILING)는 비공식 API 파라미터/스키마 변경 신호입니다.
                    </p>
                </div>
                <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${
                    failingCount > 0
                        ? 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                        : 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
                }`}>
                    {failingCount > 0 ? `FAILING ${failingCount}` : 'ALL CLEAR'}
                </span>
            </div>

            <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                {sorted.map((entry) => {
                    const badge = SOURCE_HEALTH_BADGE[entry.status];
                    return (
                        <div
                            key={entry.source}
                            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-950/50 px-4 py-3"
                        >
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-slate-200">{entry.source}</p>
                                <p className="mt-1 truncate text-xs text-slate-500" title={entry.reason}>
                                    {entry.reason}
                                </p>
                                {entry.consecutiveEmptyHits > 0 && (
                                    <p className="mt-1 text-[11px] text-slate-600">
                                        연속 무수확 {entry.consecutiveEmptyHits}회
                                    </p>
                                )}
                            </div>
                            <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold ${badge.className}`}>
                                {badge.label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </section>
    );
}

type DashboardHeroProps = {
    data: DiagnosticsResponse | null;
    isFetching: boolean;
    isOpsOnly: boolean;
};

export function DashboardHero({ data, isFetching, isOpsOnly }: DashboardHeroProps) {
    return (
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">
                    {isOpsOnly ? 'Alert Ops' : 'Search Ops'}
                </p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-white">
                    {isOpsOnly ? 'Alert Ops Control Tower' : 'Realtime Search Diagnostics'}
                </h1>
                <p className="mt-3 text-sm text-slate-400">
                    {isOpsOnly
                        ? 'approval queue, audit inbox, rollout tuning, webhook reminder 상태를 운영 기준으로 추적합니다.'
                        : '소스별 직접 수집 성공률과 Naver fallback 상태를 추적합니다.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <a
                        href="/admin"
                        className={`rounded-full px-4 py-2 font-bold ${!isOpsOnly ? 'bg-slate-100 text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                    >
                        Full Diagnostics
                    </a>
                    <a
                        href="/admin/ops"
                        className={`rounded-full px-4 py-2 font-bold ${isOpsOnly ? 'bg-slate-100 text-slate-950' : 'border border-slate-700 text-slate-300'}`}
                    >
                        Ops Console
                    </a>
                </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                {!isOpsOnly && (
                    <>
                        <div>Search storage: <span className="font-semibold text-slate-200">{data?.storage || 'memory'}</span></div>
                        <div className="mt-1">PDP storage: <span className="font-semibold text-slate-200">{data?.pdp.storage || 'memory'}</span></div>
                    </>
                )}
                <div className="mt-1">Alert storage: <span className="font-semibold text-slate-200">{data?.alerts.storage || 'unavailable'}</span></div>
                <div className="mt-1">
                    Webhook: <span className="font-semibold text-slate-200">{webhookFormatLabel(data?.alertTuningWebhook.format || null)}</span>
                </div>
                {data?.alertTuningWebhook.targetLabel && (
                    <div className="mt-1">Target: <span className="font-semibold text-slate-200">{data.alertTuningWebhook.targetLabel}</span></div>
                )}
                <div className="mt-1">Last updated: <span className="font-semibold text-slate-200">{formatTime(data?.summary.lastUpdatedAt)}</span></div>
                <div className="mt-1">{isFetching ? 'Refreshing...' : 'Auto refresh 15s'}</div>
            </div>
        </div>
    );
}

type OpsOverviewCardsProps = {
    approvalQueueSummary: ApprovalQueueSummary;
    auditUnreadCount: number;
    rolloutSourceCount: number;
};

export function OpsOverviewCards({
    approvalQueueSummary,
    auditUnreadCount,
    rolloutSourceCount,
}: OpsOverviewCardsProps) {
    return (
        <section className="grid gap-4 md:grid-cols-4">
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Open Requests</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-white">{approvalQueueSummary.openCount}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Audit Unread</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{auditUnreadCount}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Over SLA</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-rose-300">{approvalQueueSummary.overdueCount}</p>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Rollout Sources</p>
                <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{rolloutSourceCount}</p>
            </div>
        </section>
    );
}

type SearchOverviewSectionsProps = {
    data: DiagnosticsResponse | null;
    onSelectSource: (source: string) => void;
    pdpFailures: PdpRecentEvent[];
    pdpSelectedEvents: PdpRecentEvent[];
    selectedPdpSummary: PdpSourceSummary | null;
};

export function SearchOverviewSections({
    data,
    onSelectSource,
    pdpFailures,
    pdpSelectedEvents,
    selectedPdpSummary,
}: SearchOverviewSectionsProps) {
    const summary = data?.summary;
    const pdpSummary = data?.pdp.summary;
    const totalSources = summary?.sources.length || 0;
    const directSources = summary?.sources.filter((entry) => entry.collectionMode === 'direct').length || 0;
    const fallbackSources = summary?.sources.filter((entry) => entry.fallbackHits > 0).length || 0;

    return (
        <>
            <section className="grid gap-4 md:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Tracked Searches</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-white">{summary?.trackedSearches ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Observed Sources</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-white">{totalSources}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Direct-capable Sources</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{directSources}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Fallback Sources</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{fallbackSources}</p>
                </div>
            </section>

            <SourceHealthSection sourceHealth={data?.sourceHealth} />

            <section className="mt-8 grid gap-4 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Strong Fit</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{data?.quality.strong ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Low-fit Share</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{data?.quality.lowFitShare ?? 0}%</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Suggestion Clicks</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{data?.interactionSummary.suggestionClicks ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Product Opens</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{data?.interactionSummary.productOpens ?? 0}</p>
                </div>
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Compare-ready Ratio</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{data?.quality.compareReadyRatio ?? 0}%</p>
                    <p className="mt-2 text-sm text-slate-500">전체 그룹 중 실제 비교 카드로 올릴 수 있는 비율</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Spread Capture</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{data?.quality.priceSpreadCaptureRate ?? 0}%</p>
                    <p className="mt-2 text-sm text-slate-500">compare-ready 그룹 중 실제 결제가 차이를 잡아낸 비율</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Option Precision</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{data?.quality.optionMatchPrecision ?? 0}%</p>
                    <p className="mt-2 text-sm text-slate-500">검증 옵션이 있는 그룹 중 공통 옵션이 유지된 비율</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Avg Captured Spread</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">
                        {(data?.quality.avgCapturedPriceSpread ?? 0).toLocaleString()}원
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                        max {(data?.quality.maxCapturedPriceSpread ?? 0).toLocaleString()}원
                    </p>
                </div>
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-4">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Events</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-white">{pdpSummary?.trackedEvents ?? 0}</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Cache Hit</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{pdpSummary?.cacheHitRate ?? 0}%</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Fetch Success</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{pdpSummary?.fetchSuccessRate ?? 0}%</p>
                </div>
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Parse Success</p>
                    <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{pdpSummary?.parseSuccessRate ?? 0}%</p>
                </div>
            </section>

            <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-white">PDP Enrichment Sources</h2>
                            <p className="mt-2 text-sm text-slate-400">
                                캐시 재사용률과 live fetch/parse 성공률을 소스별로 추적합니다.
                            </p>
                        </div>
                        <div className="text-right text-xs text-slate-400">
                            <div>Last PDP update</div>
                            <div className="mt-1 font-semibold text-slate-200">{formatTime(pdpSummary?.lastUpdatedAt)}</div>
                        </div>
                    </div>
                    <div className="mt-4 space-y-3">
                        {(pdpSummary?.sources || []).map((entry) => {
                            const isSelected = selectedPdpSummary?.source === entry.source;
                            return (
                                <button
                                    key={`pdp_${entry.source}`}
                                    type="button"
                                    onClick={() => onSelectSource(entry.source)}
                                    className={`w-full rounded-2xl border p-4 text-left transition-colors ${isSelected ? 'border-sky-500/40 bg-slate-900/90' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{entry.source}</p>
                                            <p className="mt-2 text-xs text-slate-400">
                                                req {entry.requests} · avg {entry.avgLatencyMs}ms · unsupported {entry.unsupportedCount}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {pdpStrategyLabel(entry.lastStrategy)}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            cache <span className="font-semibold text-emerald-200">{entry.cacheHitRate}%</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            fetch <span className="font-semibold text-sky-200">{entry.fetchSuccessRate}%</span>
                                        </div>
                                        <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                            parse <span className="font-semibold text-violet-200">{entry.parseSuccessRate}%</span>
                                        </div>
                                    </div>
                                    {entry.lastReason && (
                                        <p className="mt-3 text-xs text-amber-200">{entry.lastReason}</p>
                                    )}
                                </button>
                            );
                        })}
                        {(pdpSummary?.sources || []).length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                PDP enrichment 진단 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                    <h2 className="text-lg font-bold text-white">PDP Recent Events</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        {selectedPdpSummary
                            ? `${selectedPdpSummary.source} 기준 recent cache/fetch/parse 흐름입니다.`
                            : '최근 PDP enrichment 이벤트입니다.'}
                    </p>
                    <div className="mt-4 space-y-3">
                        {(pdpSelectedEvents.length > 0 ? pdpSelectedEvents : pdpFailures).slice(0, 10).map((entry) => (
                            <div key={`${entry.generatedAt}_${entry.source}_${entry.productId || entry.strategy}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                        <p className="mt-1 text-sm font-semibold text-white">{entry.source}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.strategy === 'fetch_failed' || entry.strategy === 'parse_empty' ? 'bg-rose-500/15 text-rose-200' : entry.strategy === 'cache_hit' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-sky-500/15 text-sky-200'}`}>
                                        {pdpStrategyLabel(entry.strategy)}
                                    </span>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                    <span className="rounded-full border border-slate-800 px-2 py-1">latency {entry.durationMs}ms</span>
                                    <span className="rounded-full border border-slate-800 px-2 py-1">{entry.cacheHit ? 'cache' : 'live'}</span>
                                    {entry.fetchAttempted && (
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            fetch {entry.fetchSucceeded ? 'ok' : 'fail'}
                                        </span>
                                    )}
                                    <span className="rounded-full border border-slate-800 px-2 py-1">
                                        parse {entry.parseSucceeded ? 'ok' : 'miss'}
                                    </span>
                                </div>
                                {(entry.reason || entry.productId || entry.queryContext) && (
                                    <div className="mt-3 text-xs text-slate-400">
                                        {entry.reason && <div>reason: <span className="text-amber-200">{entry.reason}</span></div>}
                                        {entry.productId && <div>product: <span className="text-slate-200">{entry.productId}</span></div>}
                                        {entry.queryContext && <div>query: <span className="text-slate-200">{entry.queryContext}</span></div>}
                                    </div>
                                )}
                            </div>
                        ))}
                        {data?.pdp.recent.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                최근 PDP enrichment 이벤트가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </>
    );
}
