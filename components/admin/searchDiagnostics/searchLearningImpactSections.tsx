import { formatPercent, formatTime } from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type SearchLearningImpactSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningImpactSummary'
    | 'searchLearningImpactClusterRollup'
    | 'searchLearningImpactClusters'
    | 'searchLearningRewritePacks'
    | 'searchLearningRewriteRecommendationSummary'
    | 'searchLearningRewriteRecommendations'
    | 'searchLearningRewriteSourceDraftSummary'
    | 'searchLearningRewriteSourceDrafts'
> & {
    processingSearchLearningId: string | null;
    onGenerateImpactAwaitingClusterSuggestions: () => Promise<void> | void;
    onGenerateImpactAwaitingSuggestions: () => Promise<void> | void;
    onGenerateImpactNoImprovementClusterSuggestions: () => Promise<void> | void;
    onGenerateImpactNoImprovementSuggestions: () => Promise<void> | void;
    onSelectEntries: (entryIds: string[], message: string) => void;
    onSelectImpactAwaitingClusters: () => void;
    onSelectImpactAwaitingEntries: () => void;
    onSelectImpactClusterEntries: (entryIds: string[], clusterLabel: string) => void;
    onSelectImpactImprovedEntries: () => void;
    onSelectImpactNoImprovementClusters: () => void;
    onSelectImpactNoImprovementEntries: () => void;
};

function impactOutcomeClass(outcome: string) {
    return outcome === 'regressed' ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-500/15 text-amber-200';
}

function rewriteToneClass(action: string) {
    switch (action) {
        case 'promote':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
        case 'rollback':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
        case 'awaiting_samples':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
    }
}

export function SearchLearningImpactSections({
    processingSearchLearningId,
    searchLearningImpactSummary,
    searchLearningImpactClusterRollup,
    searchLearningImpactClusters,
    searchLearningRewritePacks,
    searchLearningRewriteRecommendationSummary,
    searchLearningRewriteRecommendations,
    searchLearningRewriteSourceDraftSummary,
    searchLearningRewriteSourceDrafts,
    onGenerateImpactAwaitingClusterSuggestions,
    onGenerateImpactAwaitingSuggestions,
    onGenerateImpactNoImprovementClusterSuggestions,
    onGenerateImpactNoImprovementSuggestions,
    onSelectEntries,
    onSelectImpactAwaitingClusters,
    onSelectImpactAwaitingEntries,
    onSelectImpactClusterEntries,
    onSelectImpactImprovedEntries,
    onSelectImpactNoImprovementClusters,
    onSelectImpactNoImprovementEntries,
}: SearchLearningImpactSectionsProps) {
    return (
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Search Learning Impact</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        승인된 학습 query가 실제로 low-fit/0건 비율을 얼마나 줄였는지 요약합니다.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                        tracked {searchLearningImpactSummary.approvedTracked}
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                        improved {searchLearningImpactSummary.improved}
                    </span>
                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200">
                        needs attention {searchLearningImpactSummary.noImprovement}
                    </span>
                </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved Tracked</p>
                    <p className="mt-3 text-3xl font-black text-white">{searchLearningImpactSummary.approvedTracked}</p>
                    <p className="mt-1 text-xs text-slate-400">baseline이 있는 승인 query</p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Improved Queries</p>
                    <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningImpactSummary.improved}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        measured {searchLearningImpactSummary.measured} · success {Math.round(searchLearningImpactSummary.improvedRate * 100)}%
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">No Improvement</p>
                    <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningImpactSummary.noImprovement}</p>
                    <p className="mt-1 text-xs text-slate-400">
                        unchanged {searchLearningImpactSummary.unchanged} · regressed {searchLearningImpactSummary.regressed}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                    <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningImpactSummary.awaitingSamples}</p>
                    <p className="mt-1 text-xs text-slate-400">승인 후 새 관측이 아직 없는 query</p>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onSelectImpactNoImprovementEntries}
                    disabled={searchLearningImpactSummary.topNeedsAttention.length === 0}
                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    개선 없음 선택 ({searchLearningImpactSummary.topNeedsAttention.length})
                </button>
                <button
                    type="button"
                    onClick={onSelectImpactAwaitingEntries}
                    disabled={searchLearningImpactSummary.topAwaitingSamples.length === 0}
                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    샘플 대기 선택 ({searchLearningImpactSummary.topAwaitingSamples.length})
                </button>
                <button
                    type="button"
                    onClick={onSelectImpactImprovedEntries}
                    disabled={searchLearningImpactSummary.topImproved.length === 0}
                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    개선 query 선택 ({searchLearningImpactSummary.topImproved.length})
                </button>
                <button
                    type="button"
                    onClick={onGenerateImpactNoImprovementSuggestions}
                    disabled={searchLearningImpactSummary.topNeedsAttention.length === 0 || processingSearchLearningId === 'impact_no_improvement_generate'}
                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingSearchLearningId === 'impact_no_improvement_generate'
                        ? '재학습 제안 생성 중...'
                        : `개선 없음 AI 제안 (${searchLearningImpactSummary.topNeedsAttention.length})`}
                </button>
                <button
                    type="button"
                    onClick={onGenerateImpactAwaitingSuggestions}
                    disabled={searchLearningImpactSummary.topAwaitingSamples.length === 0 || processingSearchLearningId === 'impact_awaiting_generate'}
                    className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingSearchLearningId === 'impact_awaiting_generate'
                        ? '샘플 대기 제안 생성 중...'
                        : `샘플 대기 AI 제안 (${searchLearningImpactSummary.topAwaitingSamples.length})`}
                </button>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">Improved Since Approval</h3>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                            top {searchLearningImpactSummary.topImproved.length}
                        </span>
                    </div>
                    <div className="mt-4 space-y-3">
                        {searchLearningImpactSummary.topImproved.map((impact) => (
                            <div key={`improved_${impact.entryId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{impact.query}</p>
                                        <p className="mt-1 text-xs text-slate-500">since {formatTime(impact.approvedAt)} · new samples {impact.postApprovalSamples}</p>
                                    </div>
                                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                                        improved
                                    </span>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                            {formatPercent(impact.beforeLowFitRate)} → {formatPercent(impact.afterLowFitRate)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                            {formatPercent(impact.beforeZeroRate)} → {formatPercent(impact.afterZeroRate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {searchLearningImpactSummary.topImproved.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                아직 승인 후 개선이 확인된 query가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">Still Needs Tuning</h3>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-200">
                            top {searchLearningImpactSummary.topNeedsAttention.length}
                        </span>
                    </div>
                    <div className="mt-4 space-y-3">
                        {searchLearningImpactSummary.topNeedsAttention.map((impact) => (
                            <div key={`attention_${impact.entryId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-white">{impact.query}</p>
                                        <p className="mt-1 text-xs text-slate-500">since {formatTime(impact.approvedAt)} · new samples {impact.postApprovalSamples}</p>
                                    </div>
                                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${impactOutcomeClass(impact.outcome)}`}>
                                        {impact.outcome === 'regressed' ? 'regressed' : 'unchanged'}
                                    </span>
                                </div>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                            {formatPercent(impact.beforeLowFitRate)} → {formatPercent(impact.afterLowFitRate)}
                                        </p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-100">
                                            {formatPercent(impact.beforeZeroRate)} → {formatPercent(impact.afterZeroRate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {searchLearningImpactSummary.topNeedsAttention.length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500">
                                승인 후에도 계속 개선이 없는 query는 아직 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {searchLearningImpactSummary.topAwaitingSamples.length > 0 && (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-white">Awaiting Post-Approval Samples</h3>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-200">
                            top {searchLearningImpactSummary.topAwaitingSamples.length}
                        </span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                        {searchLearningImpactSummary.topAwaitingSamples.map((impact) => (
                            <span key={`awaiting_${impact.entryId}`} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                                {impact.query}
                            </span>
                        ))}
                    </div>
                </div>
            )}
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">Semantic Cluster Impact</h3>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        tracked {searchLearningImpactClusterRollup.tracked}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onSelectImpactNoImprovementClusters}
                        disabled={searchLearningImpactClusterRollup.topNeedsAttention.length === 0}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        개선 없음 클러스터 선택 ({searchLearningImpactClusterRollup.topNeedsAttention.length})
                    </button>
                    <button
                        type="button"
                        onClick={onGenerateImpactNoImprovementClusterSuggestions}
                        disabled={searchLearningImpactClusterRollup.topNeedsAttention.length === 0 || processingSearchLearningId === 'impact_cluster_no_improvement_generate'}
                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'impact_cluster_no_improvement_generate'
                            ? '클러스터 제안 생성 중...'
                            : `개선 없음 클러스터 AI 제안 (${searchLearningImpactClusterRollup.topNeedsAttention.length})`}
                    </button>
                    <button
                        type="button"
                        onClick={onSelectImpactAwaitingClusters}
                        disabled={searchLearningImpactClusterRollup.topAwaitingSamples.length === 0}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        샘플 대기 클러스터 선택 ({searchLearningImpactClusterRollup.topAwaitingSamples.length})
                    </button>
                    <button
                        type="button"
                        onClick={onGenerateImpactAwaitingClusterSuggestions}
                        disabled={searchLearningImpactClusterRollup.topAwaitingSamples.length === 0 || processingSearchLearningId === 'impact_cluster_awaiting_generate'}
                        className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'impact_cluster_awaiting_generate'
                            ? '대기 클러스터 제안 생성 중...'
                            : `샘플 대기 클러스터 AI 제안 (${searchLearningImpactClusterRollup.topAwaitingSamples.length})`}
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tracked Clusters</p>
                        <p className="mt-3 text-3xl font-black text-white">{searchLearningImpactClusterRollup.tracked}</p>
                        <p className="mt-1 text-xs text-slate-400">semantic cluster 단위 승인 영향</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Improved Clusters</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningImpactClusterRollup.improved}</p>
                        <p className="mt-1 text-xs text-slate-400">
                            measured {searchLearningImpactClusterRollup.measured} · success {Math.round(searchLearningImpactClusterRollup.improvedRate * 100)}%
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Tuning</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningImpactClusterRollup.noImprovement}</p>
                        <p className="mt-1 text-xs text-slate-400">개선 없이 유지/회귀한 클러스터</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningImpactClusterRollup.awaitingSamples}</p>
                        <p className="mt-1 text-xs text-slate-400">승인 후 새 검색 표본이 아직 없음</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-white">Improved Clusters</h4>
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[10px] font-bold text-emerald-200">
                                top {searchLearningImpactClusterRollup.topImproved.length}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {searchLearningImpactClusterRollup.topImproved.map((cluster) => (
                                <div key={`cluster_improved_${cluster.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                queries {cluster.queryCount} · measured {cluster.measured} · 대표 {cluster.topQuery || '-'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onSelectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                            className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                        >
                                            선택
                                        </button>
                                    </div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                {formatPercent(cluster.beforeLowFitRate)} → {formatPercent(cluster.afterLowFitRate)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                {formatPercent(cluster.beforeZeroRate)} → {formatPercent(cluster.afterZeroRate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {searchLearningImpactClusterRollup.topImproved.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    아직 개선이 확인된 semantic cluster가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-white">Clusters Still Needing Tuning</h4>
                            <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[10px] font-bold text-rose-200">
                                top {searchLearningImpactClusterRollup.topNeedsAttention.length}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {searchLearningImpactClusterRollup.topNeedsAttention.map((cluster) => (
                                <div key={`cluster_attention_${cluster.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                queries {cluster.queryCount} · measured {cluster.measured} · 대표 {cluster.topQuery || '-'}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onSelectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                            className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                        >
                                            선택
                                        </button>
                                    </div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                {formatPercent(cluster.beforeLowFitRate)} → {formatPercent(cluster.afterLowFitRate)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                {formatPercent(cluster.beforeZeroRate)} → {formatPercent(cluster.afterZeroRate)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {searchLearningImpactClusterRollup.topNeedsAttention.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    아직 개선이 없는 semantic cluster는 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {searchLearningImpactClusterRollup.topAwaitingSamples.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <h4 className="text-sm font-semibold text-white">Awaiting Cluster Samples</h4>
                            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-200">
                                top {searchLearningImpactClusterRollup.topAwaitingSamples.length}
                            </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {searchLearningImpactClusterRollup.topAwaitingSamples.map((cluster) => (
                                <button
                                    key={`cluster_awaiting_${cluster.clusterId}`}
                                    type="button"
                                    onClick={() => onSelectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                    className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
                                >
                                    {cluster.clusterLabel} · queries {cluster.queryCount}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">Semantic Cluster Triage</h3>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        top {searchLearningImpactClusters.length}
                    </span>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                    {searchLearningImpactClusters.map((cluster) => (
                        <div key={cluster.clusterId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        queries {cluster.queryCount} · measured {cluster.measured}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectImpactClusterEntries(cluster.entryIds, cluster.clusterLabel)}
                                    className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                >
                                    선택
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Improved</p>
                                    <p className="mt-2 text-lg font-black text-emerald-300">{cluster.improved}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                    <p className="mt-2 text-lg font-black text-rose-300">{cluster.noImprovement}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                    <p className="mt-2 text-lg font-black text-amber-300">{cluster.awaitingSamples}</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Improved Rate</p>
                                    <p className="mt-2 text-lg font-black text-sky-300">{Math.round(cluster.improvedRate * 100)}%</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs text-slate-500">
                                대표 query: {cluster.topQuery || '-'}
                            </p>
                        </div>
                    ))}
                    {searchLearningImpactClusters.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            semantic cluster 기준으로 집계할 승인 query가 아직 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Approved Rewrite Packs</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            승인된 query를 semantic cluster 기준 source-aware rewrite pack으로 자동 승격합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        top {searchLearningRewritePacks.length}
                    </span>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningRewritePacks.map((pack) => (
                        <div key={`rewrite_pack_${pack.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{pack.clusterLabel}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        approved entries {pack.entryCount} · promoted queries {pack.approvedQueryCount} · active sources {pack.sourceCount}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(pack.entryIds, `${pack.clusterLabel} rewrite pack query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200"
                                >
                                    선택
                                </button>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {pack.commonQueries.slice(0, 6).map((query) => (
                                    <span key={`${pack.clusterId}_${query}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 space-y-3">
                                {Object.entries(pack.sourceQueries)
                                    .filter(([, queries]) => (queries || []).length > 0)
                                    .slice(0, 3)
                                    .map(([source, queries]) => (
                                        <div key={`${pack.clusterId}_${source}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">{source}</p>
                                            <div className="mt-2 flex flex-wrap gap-2">
                                                {(queries || []).slice(0, 4).map((query) => (
                                                    <span key={`${pack.clusterId}_${source}_${query}`} className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                                                        {query}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                    {searchLearningRewritePacks.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 rewrite pack으로 승격된 승인 query가 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Rewrite Pack Recommendations</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            semantic cluster impact를 기준으로 rewrite pack의 승격, 유지, rollback 후보를 자동 추천합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        tracked {searchLearningRewriteRecommendationSummary.tracked}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteRecommendationSummary.topPromote.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteRecommendationSummary.topPromote.length}개의 승격 후보 rewrite pack query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteRecommendationSummary.topPromote.length === 0}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        승격 후보 선택 ({searchLearningRewriteRecommendationSummary.topPromote.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteRecommendationSummary.topRollback.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteRecommendationSummary.topRollback.length}개의 rollback 후보 rewrite pack query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteRecommendationSummary.topRollback.length === 0}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        rollback 후보 선택 ({searchLearningRewriteRecommendationSummary.topRollback.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteRecommendationSummary.topAwaiting.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteRecommendationSummary.topAwaiting.length}개의 표본 대기 rewrite pack query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteRecommendationSummary.topAwaiting.length === 0}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        표본 대기 선택 ({searchLearningRewriteRecommendationSummary.topAwaiting.length})
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteRecommendationSummary.promote}</p>
                        <p className="mt-1 text-xs text-slate-400">안정적으로 유지 가능한 rewrite pack</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteRecommendationSummary.hold}</p>
                        <p className="mt-1 text-xs text-slate-400">유지하되 표본을 더 모을 rewrite pack</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteRecommendationSummary.rollback}</p>
                        <p className="mt-1 text-xs text-slate-400">조정 또는 rollback이 필요한 pack</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteRecommendationSummary.awaitingSamples}</p>
                        <p className="mt-1 text-xs text-slate-400">승인 후 새 표본이 아직 부족함</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {searchLearningRewriteRecommendations.slice(0, 6).map((recommendation) => (
                        <div key={`rewrite_recommendation_${recommendation.clusterId}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{recommendation.clusterLabel}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        measured {recommendation.measured} · improved {recommendation.improved} · no improvement {recommendation.noImprovement}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${rewriteToneClass(recommendation.recommendation)}`}>
                                    {recommendation.recommendation}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.reason}</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-100">
                                        {formatPercent(recommendation.beforeLowFitRate)} → {formatPercent(recommendation.afterLowFitRate)}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-100">
                                        {formatPercent(recommendation.beforeZeroRate)} → {formatPercent(recommendation.afterZeroRate)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {recommendation.commonQueries.slice(0, 5).map((query) => (
                                    <span key={`${recommendation.clusterId}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectEntries(recommendation.entryIds, `${recommendation.clusterLabel} rewrite pack query를 선택했습니다.`)}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                관련 query 선택
                            </button>
                        </div>
                    ))}
                    {searchLearningRewriteRecommendations.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            아직 추천할 rewrite pack이 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Source Rollout Drafts</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            rewrite pack recommendation을 source 단위 rollout draft로 쪼개서, mall별 query triage를 바로 실행합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        drafts {searchLearningRewriteSourceDraftSummary.tracked}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceDraftSummary.topPromote.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceDraftSummary.topPromote.length}개의 승격 source draft query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceDraftSummary.topPromote.length === 0}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        승격 source 선택 ({searchLearningRewriteSourceDraftSummary.topPromote.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceDraftSummary.topRollback.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceDraftSummary.topRollback.length}개의 rollback source draft query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceDraftSummary.topRollback.length === 0}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        rollback source 선택 ({searchLearningRewriteSourceDraftSummary.topRollback.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceDraftSummary.topAwaiting.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceDraftSummary.topAwaiting.length}개의 표본 대기 source draft query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceDraftSummary.topAwaiting.length === 0}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        표본 대기 source 선택 ({searchLearningRewriteSourceDraftSummary.topAwaiting.length})
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceDraftSummary.promote}</p>
                        <p className="mt-1 text-xs text-slate-400">source 수준 승격 후보</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceDraftSummary.hold}</p>
                        <p className="mt-1 text-xs text-slate-400">유지하면서 표본을 더 모을 source draft</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceDraftSummary.rollback}</p>
                        <p className="mt-1 text-xs text-slate-400">조정이 필요한 source draft</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceDraftSummary.awaitingSamples}</p>
                        <p className="mt-1 text-xs text-slate-400">새 표본을 기다리는 source draft</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {searchLearningRewriteSourceDrafts.slice(0, 6).map((draft) => (
                        <div key={draft.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{draft.clusterLabel}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {draft.source} · measured {draft.measured} · queries {draft.queryCount}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${rewriteToneClass(draft.action)}`}>
                                    {draft.action}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{draft.reason}</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-100">
                                        {formatPercent(draft.beforeLowFitRate)} → {formatPercent(draft.afterLowFitRate)}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-100">
                                        {formatPercent(draft.beforeZeroRate)} → {formatPercent(draft.afterZeroRate)}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {draft.queries.map((query) => (
                                    <span key={`${draft.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectEntries(draft.entryIds, `${draft.clusterLabel} / ${draft.source} source draft query를 선택했습니다.`)}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                source draft 선택
                            </button>
                        </div>
                    ))}
                    {searchLearningRewriteSourceDrafts.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            아직 source rollout draft가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
