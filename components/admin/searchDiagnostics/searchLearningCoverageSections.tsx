import { buildSearchLearningWorkbench } from './searchLearningWorkbench';
import type { DiagnosticsResponse } from './types';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type SearchLearningCoverageSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningRewriteSourceOps'
    | 'searchLearningRewriteSourceOpsSummary'
    | 'searchLearningRewriteSourceActionDrafts'
    | 'searchLearningRewriteSourceActionDraftSummary'
    | 'searchLearningRewriteSourceActionReviewQueue'
    | 'searchLearningRewriteSourceActionReviewSummary'
    | 'searchLearningRewriteSourceApprovalQueue'
    | 'searchLearningRewriteSourceApprovalQueueSummary'
    | 'searchLearningRewriteSourceApprovalActivity'
    | 'searchLearningRewriteSourceApprovalActivitySummary'
> & {
    coverage: DiagnosticsResponse['searchQualityCoverage'] | null | undefined;
    processingSearchLearningId: string | null;
    onApproveSourceActionReviewSuggestions: () => Promise<void> | void;
    onApproveSourceApprovalReviewPending: () => Promise<void> | void;
    onGenerateSourceActionReviewSuggestions: () => Promise<void> | void;
    onGenerateSourceApprovalRollbackSuggestions: () => Promise<void> | void;
    onGenerateSourceRollbackDraftSuggestions: () => Promise<void> | void;
    onSeedCoverageQueries: () => Promise<void> | void;
    onSeedCoverageClusterQueries: (clusterId: string, clusterLabel: string, queries: string[]) => Promise<void> | void;
    onSelectEntries: (entryIds: string[], message: string) => void;
};

function activityPriorityTone(priority: string) {
    switch (priority) {
        case 'urgent':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
        case 'high':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
        case 'medium':
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
    }
}

function approvalDecisionTone(decision: string) {
    switch (decision) {
        case 'promote_candidate':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
        case 'rollback_candidate':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
        case 'review_pending':
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-200';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
    }
}

function reviewStateTone(reviewState: string) {
    switch (reviewState) {
        case 'ready_review':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
        case 'generation_needed':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
    }
}

function sourceDraftTone(action: string) {
    switch (action) {
        case 'promote_confirm':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
        case 'rollback_regenerate':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-200';
        case 'awaiting_observe':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-200';
    }
}

function sourceOpsTone(action: string) {
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

export function SearchLearningCoverageSections({
    coverage,
    processingSearchLearningId,
    searchLearningRewriteSourceOps,
    searchLearningRewriteSourceOpsSummary,
    searchLearningRewriteSourceActionDrafts,
    searchLearningRewriteSourceActionDraftSummary,
    searchLearningRewriteSourceActionReviewQueue,
    searchLearningRewriteSourceActionReviewSummary,
    searchLearningRewriteSourceApprovalQueue,
    searchLearningRewriteSourceApprovalQueueSummary,
    searchLearningRewriteSourceApprovalActivity,
    searchLearningRewriteSourceApprovalActivitySummary,
    onApproveSourceActionReviewSuggestions,
    onApproveSourceApprovalReviewPending,
    onGenerateSourceActionReviewSuggestions,
    onGenerateSourceApprovalRollbackSuggestions,
    onGenerateSourceRollbackDraftSuggestions,
    onSeedCoverageQueries,
    onSeedCoverageClusterQueries,
    onSelectEntries,
}: SearchLearningCoverageSectionsProps) {
    const clusters = coverage?.clusters || [];
    const uncoveredQueries = coverage?.uncoveredQueries || [];

    return (
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Search Quality Coverage</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        curated 패션 검색어 평가셋 기준으로 rewrite/semantic expansion이 얼마나 커버되는지 요약합니다.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                        total {coverage?.totalQueries ?? 0}
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                        NAVER {Math.round((coverage?.naverCoverageRate ?? 0) * 100)}%
                    </span>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
                <button
                    type="button"
                    onClick={onSeedCoverageQueries}
                    disabled={uncoveredQueries.length === 0 || processingSearchLearningId === 'seed_queries'}
                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingSearchLearningId === 'seed_queries'
                        ? '큐 적재 중...'
                        : `미커버 query 큐 추가 (${uncoveredQueries.length})`}
                </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">NAVER Coverage</p>
                    <p className="mt-3 text-3xl font-black text-emerald-300">
                        {Math.round((coverage?.naverCoverageRate ?? 0) * 100)}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {coverage?.naverCovered ?? 0}/{coverage?.totalQueries ?? 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Global Coverage</p>
                    <p className="mt-3 text-3xl font-black text-sky-300">
                        {Math.round((coverage?.globalCoverageRate ?? 0) * 100)}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {coverage?.globalCovered ?? 0}/{coverage?.globalTargetQueries ?? 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Full Coverage</p>
                    <p className="mt-3 text-3xl font-black text-violet-300">
                        {Math.round((coverage?.fullCoverageRate ?? 0) * 100)}%
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                        {coverage?.fullyCovered ?? 0}/{coverage?.totalQueries ?? 0}
                    </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Review</p>
                    <p className="mt-3 text-3xl font-black text-amber-300">{uncoveredQueries.length}</p>
                    <p className="mt-1 text-xs text-slate-400">uncovered curated queries</p>
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Source Approval Activity</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            source approval 흐름을 긴급 승인, rollback 재생성, 승격 관찰, 표본 추가 수집 순서로 한 번에 triage합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        activity {searchLearningRewriteSourceApprovalActivitySummary.total}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={onApproveSourceApprovalReviewPending}
                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topReviewApprove.length === 0 || processingSearchLearningId === 'source_approval_review_approve'}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'source_approval_review_approve'
                            ? '승인 중...'
                            : `긴급 review 승인 (${searchLearningRewriteSourceApprovalActivitySummary.topReviewApprove.length})`}
                    </button>
                    <button
                        type="button"
                        onClick={onGenerateSourceApprovalRollbackSuggestions}
                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topRollbackGenerate.length === 0 || processingSearchLearningId === 'source_approval_rollback_generate'}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'source_approval_rollback_generate'
                            ? '생성 중...'
                            : `긴급 rollback AI 제안 (${searchLearningRewriteSourceApprovalActivitySummary.topRollbackGenerate.length})`}
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.flatMap((item) => item.primaryEntryIds),
                            `${searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.length}개의 승격 관찰 query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.length === 0}
                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        승격 관찰 선택 ({searchLearningRewriteSourceApprovalActivitySummary.topPromoteWatch.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.flatMap((item) => item.primaryEntryIds),
                            `${searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.length}개의 표본 추가 수집 query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.length === 0}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        표본 추가 수집 선택 ({searchLearningRewriteSourceApprovalActivitySummary.topObserveMore.length})
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Urgent</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceApprovalActivitySummary.urgent}</p>
                        <p className="mt-1 text-xs text-slate-400">즉시 승인 또는 rollback 재생성이 필요한 항목</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">High</p>
                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceApprovalActivitySummary.high}</p>
                        <p className="mt-1 text-xs text-slate-400">rollback 재검토처럼 우선순위가 높은 후속 액션</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Medium</p>
                        <p className="mt-3 text-3xl font-black text-cyan-300">{searchLearningRewriteSourceApprovalActivitySummary.medium}</p>
                        <p className="mt-1 text-xs text-slate-400">승격 관찰처럼 유지/확대 판단을 기다리는 항목</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Low</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceApprovalActivitySummary.low}</p>
                        <p className="mt-1 text-xs text-slate-400">표본 추가 수집 위주로 보면 되는 항목</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {searchLearningRewriteSourceApprovalActivity.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{item.source}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {item.title} · review {item.readyReviewCount} · regenerate {item.generationNeededCount}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${activityPriorityTone(item.priority)}`}>
                                    {item.priority}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topClusters.map((cluster) => (
                                    <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {cluster}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topQueries.slice(0, 4).map((query) => (
                                    <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectEntries(
                                    item.primaryEntryIds.length > 0 ? item.primaryEntryIds : item.entryIds,
                                    `${item.source} / ${item.title} activity query를 선택했습니다.`
                                )}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                activity 선택
                            </button>
                        </div>
                    ))}
                    {searchLearningRewriteSourceApprovalActivity.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            아직 source approval activity가 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Source Approval Queue</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            source action과 review 상태를 합쳐 자동 승격 후보, rollback 후보, review pending 후보를 운영 승인 큐로 정리합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        queue {searchLearningRewriteSourceApprovalQueueSummary.total}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.flatMap((entry) => entry.primaryEntryIds),
                            `${searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.length}개의 승격 후보 query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.length === 0}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        승격 후보 선택 ({searchLearningRewriteSourceApprovalQueueSummary.topPromoteCandidates.length})
                    </button>
                    <button
                        type="button"
                        onClick={onApproveSourceApprovalReviewPending}
                        disabled={searchLearningRewriteSourceApprovalQueueSummary.topReviewPending.length === 0 || processingSearchLearningId === 'source_approval_review_approve'}
                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'source_approval_review_approve'
                            ? '승인 중...'
                            : `review pending 승인 (${searchLearningRewriteSourceApprovalQueueSummary.topReviewPending.length})`}
                    </button>
                    <button
                        type="button"
                        onClick={onGenerateSourceApprovalRollbackSuggestions}
                        disabled={searchLearningRewriteSourceApprovalQueueSummary.topRollbackCandidates.length === 0 || processingSearchLearningId === 'source_approval_rollback_generate'}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'source_approval_rollback_generate'
                            ? '생성 중...'
                            : `rollback 후보 AI 제안 (${searchLearningRewriteSourceApprovalQueueSummary.topRollbackCandidates.length})`}
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote Candidates</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceApprovalQueueSummary.promoteCandidates}</p>
                        <p className="mt-1 text-xs text-slate-400">안정적으로 유지/확대 가능한 source action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback Candidates</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceApprovalQueueSummary.rollbackCandidates}</p>
                        <p className="mt-1 text-xs text-slate-400">재생성 또는 rollback 재검토가 필요한 action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Pending</p>
                        <p className="mt-3 text-3xl font-black text-cyan-300">{searchLearningRewriteSourceApprovalQueueSummary.reviewPending}</p>
                        <p className="mt-1 text-xs text-slate-400">이미 AI draft가 있어 승인만 남은 action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe Pending</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceApprovalQueueSummary.observePending}</p>
                        <p className="mt-1 text-xs text-slate-400">추가 표본 관측이 더 필요한 action</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {searchLearningRewriteSourceApprovalQueue.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{item.source}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {item.title} · ready {item.readyReviewCount} · regenerate {item.generationNeededCount}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${approvalDecisionTone(item.decision)}`}>
                                    {item.decision}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.reason}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topClusters.map((cluster) => (
                                    <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {cluster}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topQueries.slice(0, 4).map((query) => (
                                    <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectEntries(
                                    item.primaryEntryIds.length > 0 ? item.primaryEntryIds : item.entryIds,
                                    `${item.source} / ${item.title} approval query를 선택했습니다.`
                                )}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                approval queue 선택
                            </button>
                        </div>
                    ))}
                    {searchLearningRewriteSourceApprovalQueue.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            아직 source approval queue가 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Source Action Review Queue</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            source action에서 바로 review 가능한 AI draft와 아직 AI 생성이 필요한 항목을 분리해 운영 우선순위로 보여줍니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        queue {searchLearningRewriteSourceActionReviewSummary.total}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceActionReviewSummary.topReadyReview.flatMap((entry) => entry.readyReviewEntryIds),
                            `${searchLearningRewriteSourceActionReviewSummary.topReadyReview.length}개의 source action review query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceActionReviewSummary.topReadyReview.length === 0}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        review 선택 ({searchLearningRewriteSourceActionReviewSummary.topReadyReview.length})
                    </button>
                    <button
                        type="button"
                        onClick={onApproveSourceActionReviewSuggestions}
                        disabled={searchLearningRewriteSourceActionReviewSummary.topReadyReview.length === 0 || processingSearchLearningId === 'source_action_review_approve'}
                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'source_action_review_approve'
                            ? '승인 중...'
                            : `review 즉시 승인 (${searchLearningRewriteSourceActionReviewSummary.topReadyReview.length})`}
                    </button>
                    <button
                        type="button"
                        onClick={onGenerateSourceActionReviewSuggestions}
                        disabled={searchLearningRewriteSourceActionReviewSummary.topGenerationNeeded.length === 0 || processingSearchLearningId === 'source_action_review_generate'}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'source_action_review_generate'
                            ? '생성 중...'
                            : `AI 제안 생성 (${searchLearningRewriteSourceActionReviewSummary.topGenerationNeeded.length})`}
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ready Review</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceActionReviewSummary.readyReview}</p>
                        <p className="mt-1 text-xs text-slate-400">새 AI 제안이 있어 바로 승인 가능한 action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Generation Needed</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceActionReviewSummary.generationNeeded}</p>
                        <p className="mt-1 text-xs text-slate-400">AI 제안 생성부터 다시 필요한 action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Stable Follow-up</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceActionReviewSummary.stableFollowup}</p>
                        <p className="mt-1 text-xs text-slate-400">지금은 유지하면서 관측만 보면 되는 action</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {searchLearningRewriteSourceActionReviewQueue.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{item.source}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {item.title} · review {item.readyReviewCount} · generation {item.generationNeededCount}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${reviewStateTone(item.reviewState)}`}>
                                    {item.reviewState}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.reason}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topClusters.map((cluster) => (
                                    <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {cluster}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topQueries.slice(0, 4).map((query) => (
                                    <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectEntries(
                                    item.reviewState === 'ready_review' ? item.readyReviewEntryIds : item.entryIds,
                                    `${item.source} / ${item.title} review query를 선택했습니다.`
                                )}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                review queue 선택
                            </button>
                        </div>
                    ))}
                    {searchLearningRewriteSourceActionReviewQueue.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            아직 source action review queue가 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Source Action Drafts</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            source ops 결과를 실제 운영 액션으로 변환한 draft입니다. rollback 후보는 바로 AI 재생성을 실행할 수 있습니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        drafts {searchLearningRewriteSourceActionDraftSummary.total}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.length}개의 승격 유지 확인 query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.length === 0}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        승격 유지 선택 ({searchLearningRewriteSourceActionDraftSummary.topPromoteConfirm.length})
                    </button>
                    <button
                        type="button"
                        onClick={onGenerateSourceRollbackDraftSuggestions}
                        disabled={searchLearningRewriteSourceActionDraftSummary.topRollbackRegenerate.length === 0 || processingSearchLearningId === 'source_ops_rollback_generate'}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {processingSearchLearningId === 'source_ops_rollback_generate'
                            ? '재생성 중...'
                            : `rollback AI 재생성 (${searchLearningRewriteSourceActionDraftSummary.topRollbackRegenerate.length})`}
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.length}개의 샘플 대기 query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.length === 0}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        샘플 대기 선택 ({searchLearningRewriteSourceActionDraftSummary.topAwaitingObserve.length})
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote Confirm</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceActionDraftSummary.promoteConfirm}</p>
                        <p className="mt-1 text-xs text-slate-400">유지 확인만 필요한 source action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback Regenerate</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceActionDraftSummary.rollbackRegenerate}</p>
                        <p className="mt-1 text-xs text-slate-400">AI 재생성이 필요한 source action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Observe</p>
                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceActionDraftSummary.awaitingObserve}</p>
                        <p className="mt-1 text-xs text-slate-400">실제 표본을 더 모아야 하는 source action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold Review</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceActionDraftSummary.holdReview}</p>
                        <p className="mt-1 text-xs text-slate-400">유지하며 추가 검토할 source action</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {searchLearningRewriteSourceActionDrafts.slice(0, 6).map((draft) => (
                        <div key={draft.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{draft.source}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {draft.title} · measured {draft.measured} · queries {draft.queryCount}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${sourceDraftTone(draft.action)}`}>
                                    {draft.action}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{draft.reason}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {draft.topClusters.map((cluster) => (
                                    <span key={`${draft.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {cluster}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {draft.topQueries.slice(0, 4).map((query) => (
                                    <span key={`${draft.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectEntries(draft.entryIds, `${draft.source} / ${draft.title} query를 선택했습니다.`)}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                action draft 선택
                            </button>
                        </div>
                    ))}
                    {searchLearningRewriteSourceActionDrafts.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            아직 source action draft가 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Source Rollout Ops Summary</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            source/action 조합별로 승격, rollback, 표본 대기 후보를 묶어 한 번에 triage합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        tracked {searchLearningRewriteSourceOpsSummary.trackedSources}
                    </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceOpsSummary.topPromote.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceOpsSummary.topPromote.length}개의 승격 source ops query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceOpsSummary.topPromote.length === 0}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        승격 ops 선택 ({searchLearningRewriteSourceOpsSummary.topPromote.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceOpsSummary.topRollback.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceOpsSummary.topRollback.length}개의 rollback source ops query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceOpsSummary.topRollback.length === 0}
                        className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        rollback ops 선택 ({searchLearningRewriteSourceOpsSummary.topRollback.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningRewriteSourceOpsSummary.topAwaiting.flatMap((entry) => entry.entryIds),
                            `${searchLearningRewriteSourceOpsSummary.topAwaiting.length}개의 표본 대기 source ops query를 선택했습니다.`
                        )}
                        disabled={searchLearningRewriteSourceOpsSummary.topAwaiting.length === 0}
                        className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        표본 대기 ops 선택 ({searchLearningRewriteSourceOpsSummary.topAwaiting.length})
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Promote</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningRewriteSourceOpsSummary.promoteSources}</p>
                        <p className="mt-1 text-xs text-slate-400">source/action 기준 승격 후보</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Hold</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningRewriteSourceOpsSummary.holdSources}</p>
                        <p className="mt-1 text-xs text-slate-400">유지하며 표본 관측 중인 source/action</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Rollback</p>
                        <p className="mt-3 text-3xl font-black text-rose-300">{searchLearningRewriteSourceOpsSummary.rollbackSources}</p>
                        <p className="mt-1 text-xs text-slate-400">source/action 기준 rollback 후보</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningRewriteSourceOpsSummary.awaitingSources}</p>
                        <p className="mt-1 text-xs text-slate-400">새 표본을 기다리는 source/action</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {searchLearningRewriteSourceOps.slice(0, 6).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{item.source}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        drafts {item.draftCount} · clusters {item.clusterCount} · measured {item.measured}
                                    </p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${sourceOpsTone(item.action)}`}>
                                    {item.action}
                                </span>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Improved Rate</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-100">{Math.round(item.avgImprovedRate * 100)}%</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                    <p className="mt-2 text-sm font-semibold text-slate-100">{item.noImprovement}</p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topClusters.map((cluster) => (
                                    <span key={`${item.id}_${cluster}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {cluster}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.topQueries.slice(0, 4).map((query) => (
                                    <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => onSelectEntries(item.entryIds, `${item.source} / ${item.action} source ops query를 선택했습니다.`)}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                source ops 선택
                            </button>
                        </div>
                    ))}
                    {searchLearningRewriteSourceOps.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            아직 source ops summary가 없습니다.
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">Semantic Coverage Clusters</h3>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        top {clusters.slice(0, 6).length}
                    </span>
                </div>
                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                    {clusters.slice(0, 6).map((cluster) => (
                        <div key={cluster.clusterId} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{cluster.clusterLabel}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        total {cluster.totalQueries} · uncovered {cluster.uncoveredQueries.length}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onSeedCoverageClusterQueries(cluster.clusterId, cluster.clusterLabel, cluster.uncoveredQueries.map((entry) => entry.query))}
                                    disabled={cluster.uncoveredQueries.length === 0 || processingSearchLearningId === `seed_cluster_${cluster.clusterId}`}
                                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === `seed_cluster_${cluster.clusterId}`
                                        ? '큐 적재 중...'
                                        : `큐 추가 (${cluster.uncoveredQueries.length})`}
                                </button>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">NAVER</p>
                                    <p className="mt-2 text-lg font-black text-emerald-300">{Math.round(cluster.naverCoverageRate * 100)}%</p>
                                </div>
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Full</p>
                                    <p className="mt-2 text-lg font-black text-violet-300">{Math.round(cluster.fullCoverageRate * 100)}%</p>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {cluster.uncoveredQueries.slice(0, 3).map((entry) => (
                                    <span key={`${cluster.clusterId}_${entry.query}`} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
                                        {entry.query}
                                    </span>
                                ))}
                                {cluster.uncoveredQueries.length === 0 && (
                                    <span className="text-xs text-slate-500">현재 uncovered query가 없습니다.</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {uncoveredQueries.slice(0, 6).map((entry) => (
                    <div key={entry.query} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-sm font-semibold text-white">{entry.query}</p>
                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">NAVER Missing</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {entry.naverMissing.length > 0 ? entry.naverMissing.map((query) => (
                                        <span key={`${entry.query}_naver_${query}`} className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100">
                                            {query}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-slate-500">none</span>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Global Missing</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {entry.globalMissing.length > 0 ? entry.globalMissing.map((query) => (
                                        <span key={`${entry.query}_global_${query}`} className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-1 text-[11px] text-rose-100">
                                            {query}
                                        </span>
                                    )) : (
                                        <span className="text-xs text-slate-500">none</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {uncoveredQueries.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                        현재 curated 검색어 평가셋은 모두 커버되고 있습니다.
                    </div>
                )}
            </div>
        </section>
    );
}
