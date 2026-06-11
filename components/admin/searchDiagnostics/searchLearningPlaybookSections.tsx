import { formatTime } from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type Playbook = SearchLearningWorkbench['searchLearningOpsPlaybooks']['topPlaybooks'][number];
type PlaybookOutcome =
    | SearchLearningWorkbench['searchLearningOpsPlaybookOutcomes']['topReadyReview'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookOutcomes']['topNeedsAttention'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookOutcomes']['topAwaitingSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookOutcomes']['topValidated'][number];
type PlaybookRecommendation =
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topObserve'][number];
type OpsCenterItem =
    | SearchLearningWorkbench['searchLearningOpsCenter']['topUrgentNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCenter']['topRetrainNeeded'][number]
    | SearchLearningWorkbench['searchLearningOpsCenter']['topValidated'][number];

type SearchLearningPlaybookSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsPlaybooks'
    | 'searchLearningOpsPlaybookActivity'
    | 'searchLearningOpsPlaybookOutcomes'
    | 'searchLearningOpsPlaybookRecommendations'
    | 'searchLearningOpsPlaybookRecommendationQueue'
    | 'searchLearningOpsCenter'
> & {
    onBulkGenerateSuggestionsForIds: (
        entryIds: string[],
        processingKey: string,
        successMessage: (count: number) => string,
        fallbackErrorMessage: string
    ) => Promise<void> | void;
    onRunOpsCenterAction: (item: OpsCenterItem) => Promise<void> | void;
    onRunPlaybookAction: (playbook: Playbook) => Promise<void> | void;
    onRunPlaybookOutcomeAction: (outcome: PlaybookOutcome) => Promise<void> | void;
    onRunPlaybookRecommendationAction: (recommendation: PlaybookRecommendation) => Promise<void> | void;
    onSelectEntries: (entryIds: string[], message: string) => void;
};

function priorityBadgeClass(priority: string) {
    switch (priority) {
        case 'critical':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'high':
            return 'border-orange-500/30 bg-orange-500/10 text-orange-100';
        case 'medium':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        default:
            return 'border-slate-700 bg-slate-950/70 text-slate-300';
    }
}

function playbookOutcomeStatusClass(status: string) {
    switch (status) {
        case 'ready_review':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'needs_attention':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'awaiting_samples':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
    }
}

function playbookRecommendationQueueClass(queueState: string) {
    switch (queueState) {
        case 'execute_now':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'needs_review':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        case 'sample_collection':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-slate-700 bg-slate-950/70 text-slate-300';
    }
}

export function SearchLearningPlaybookSections({
    searchLearningOpsPlaybooks,
    searchLearningOpsPlaybookActivity,
    searchLearningOpsPlaybookOutcomes,
    searchLearningOpsPlaybookRecommendations,
    searchLearningOpsPlaybookRecommendationQueue,
    searchLearningOpsCenter,
    onBulkGenerateSuggestionsForIds,
    onRunOpsCenterAction,
    onRunPlaybookAction,
    onRunPlaybookOutcomeAction,
    onRunPlaybookRecommendationAction,
    onSelectEntries,
}: SearchLearningPlaybookSectionsProps) {
    const allPlaybookRecommendations = [
        ...searchLearningOpsPlaybookRecommendations.topReviewNow,
        ...searchLearningOpsPlaybookRecommendations.topRetrainNow,
        ...searchLearningOpsPlaybookRecommendations.topCollectSamples,
        ...searchLearningOpsPlaybookRecommendations.topObserve,
    ];

    return (
        <>
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbooks</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            승인, AI 생성, 재학습, 표본 수집을 배치 실행 단위로 묶은 빠른 운영 플레이북입니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            ready {searchLearningOpsPlaybooks.readyBatches}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            urgent {searchLearningOpsPlaybooks.urgentBatches}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            validated {searchLearningOpsPlaybooks.stableValidated}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ready Batches</p>
                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybooks.readyBatches}</p>
                        <p className="mt-1 text-xs text-slate-400">실행 가능한 playbook 수</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Urgent Batches</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybooks.urgentBatches}</p>
                        <p className="mt-1 text-xs text-rose-100/70">즉시 처리 권장 batch</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Stable Validated</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybooks.stableValidated}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">안정 상태 승인 query</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningOpsPlaybooks.topPlaybooks.map((playbook) => (
                        <div key={playbook.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${priorityBadgeClass(playbook.priority)}`}>
                                            {playbook.priority}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {playbook.queryCount} queries
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{playbook.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {playbook.action}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{playbook.description}</p>
                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                {playbook.reason}
                            </p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunPlaybookAction(playbook)}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                >
                                    {playbook.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(playbook.entryIds, `${playbook.title}의 ${playbook.entryIds.length}개 query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsPlaybooks.topPlaybooks.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 실행 가능한 search learning playbook이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Activity</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            배치 승인/AI 생성 플레이북이 실제로 얼마나 실행됐는지, 최근 어떤 query를 처리했는지 바로 다시 봅니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            runs {searchLearningOpsPlaybookActivity.totalRuns}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            approvals {searchLearningOpsPlaybookActivity.approvalRuns}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            unique queries {searchLearningOpsPlaybookActivity.uniqueQueries}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total Runs</p>
                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookActivity.totalRuns}</p>
                        <p className="mt-1 text-xs text-slate-400">기록된 playbook 실행 수</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Approval Runs</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookActivity.approvalRuns}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">review pending batch 승인 실행</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Generate Runs</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookActivity.generationRuns}</p>
                        <p className="mt-1 text-xs text-sky-100/70">generate needed batch 실행</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Runs</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookActivity.retrainRuns}</p>
                        <p className="mt-1 text-xs text-rose-100/70">retrain batch 실행</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningOpsPlaybookActivity.recentRuns.map((run) => {
                        const linkedPlaybook = searchLearningOpsPlaybooks.topPlaybooks.find((playbook) => playbook.id === run.playbookId);

                        return (
                            <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${priorityBadgeClass(run.priority)}`}>
                                                {run.priority}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {run.count} queries
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {formatTime(run.createdAt)} · {run.context}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                        {run.action}
                                    </span>
                                </div>
                                <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {run.queries.map((query) => (
                                        <span key={`${run.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                            {query}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(run.entryIds, `${run.title} 실행 query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => linkedPlaybook && void onRunPlaybookAction(linkedPlaybook)}
                                        disabled={!linkedPlaybook}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        같은 playbook 다시 실행
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {searchLearningOpsPlaybookActivity.recentRuns.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 기록된 search learning playbook activity가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            실행된 playbook이 실제로 review 승인 대기인지, 재학습이 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            attention {searchLearningOpsPlaybookOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            awaiting {searchLearningOpsPlaybookOutcomes.awaitingSamples}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Ready Review</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookOutcomes.readyReview}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">draft review/승인으로 바로 이어질 batch</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Needs Attention</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookOutcomes.needsAttention}</p>
                        <p className="mt-1 text-xs text-rose-100/70">재학습 또는 rewrite 보정이 필요한 batch</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Awaiting Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookOutcomes.awaitingSamples}</p>
                        <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 batch</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Validated</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookOutcomes.validated}</p>
                        <p className="mt-1 text-xs text-sky-100/70">안정적으로 개선된 batch</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[
                        ...searchLearningOpsPlaybookOutcomes.topReadyReview,
                        ...searchLearningOpsPlaybookOutcomes.topNeedsAttention,
                        ...searchLearningOpsPlaybookOutcomes.topAwaitingSamples,
                        ...searchLearningOpsPlaybookOutcomes.topValidated,
                    ]
                        .slice(0, 6)
                        .map((outcome) => (
                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${playbookOutcomeStatusClass(outcome.status)}`}>
                                                {outcome.status}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {outcome.entryIds.length} queries
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {formatTime(outcome.createdAt)} · {outcome.context}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                        {outcome.action}
                                    </span>
                                </div>
                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Review</p>
                                        <p className="mt-2 text-sm font-semibold text-emerald-100">{outcome.readyReviewCount}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                                        <p className="mt-2 text-sm font-semibold text-rose-100">{outcome.noImprovementCount}</p>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting</p>
                                        <p className="mt-2 text-sm font-semibold text-amber-100">{outcome.awaitingSamplesCount}</p>
                                    </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {outcome.queries.map((query) => (
                                        <span key={`${outcome.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                            {query}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => void onRunPlaybookOutcomeAction(outcome)}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                    >
                                        {outcome.status === 'ready_review'
                                            ? 'review 즉시 승인'
                                            : outcome.status === 'needs_attention'
                                                ? '재학습 AI 제안'
                                                : 'queue 선택'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        상세 queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsPlaybookOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 평가 가능한 search learning playbook outcome이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            playbook outcome을 바로 실행할 다음 액션으로 재분류해서, review 승인/재학습/표본 수집/관찰 흐름으로 곧바로 이어집니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendations.total}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            critical {searchLearningOpsPlaybookRecommendations.critical}
                        </span>
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-orange-100">
                            high {searchLearningOpsPlaybookRecommendations.highPriority}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendations.reviewNow}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 batch</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Now</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendations.retrainNow}</p>
                        <p className="mt-1 text-xs text-rose-100/70">즉시 재학습할 batch</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Collect Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendations.collectSamples}</p>
                        <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 batch</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Observe</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendations.observe}</p>
                        <p className="mt-1 text-xs text-sky-100/70">개선 상태를 관찰할 batch</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {allPlaybookRecommendations.slice(0, 6).map((recommendation) => (
                        <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${priorityBadgeClass(recommendation.priority)}`}>
                                            {recommendation.priority}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {recommendation.action}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {formatTime(recommendation.createdAt)} · {recommendation.outcomeStatus}
                                    </p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {recommendation.entryIds.length} queries
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                {recommendation.reason}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {recommendation.queries.map((query) => (
                                    <span key={`${recommendation.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunPlaybookRecommendationAction(recommendation)}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                >
                                    {recommendation.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(recommendation.entryIds, `${recommendation.title} recommendation query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsPlaybookRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 실행 가능한 search learning playbook recommendation이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Queue</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            recommendation을 다시 실행 우선순위 큐로 정렬해서, 지금 당장 처리할 배치와 관찰 대상으로 남길 배치를 분리합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationQueue.total}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            urgent {searchLearningOpsPlaybookRecommendationQueue.urgent}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsPlaybookRecommendationQueue.executeNow}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            review {searchLearningOpsPlaybookRecommendationQueue.needsReview}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Execute Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationQueue.executeNow}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 재학습/실행할 항목</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Needs Review</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationQueue.needsReview}</p>
                        <p className="mt-1 text-xs text-sky-100/70">즉시 승인 review 대상</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Sample Collection</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationQueue.sampleCollection}</p>
                        <p className="mt-1 text-xs text-amber-100/70">추가 샘플이 필요한 항목</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Observe</p>
                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookRecommendationQueue.observe}</p>
                        <p className="mt-1 text-xs text-slate-400">개선 상태를 관찰할 항목</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[
                        ...searchLearningOpsPlaybookRecommendationQueue.topExecuteNow,
                        ...searchLearningOpsPlaybookRecommendationQueue.topNeedsReview,
                        ...searchLearningOpsPlaybookRecommendationQueue.topSampleCollection,
                        ...searchLearningOpsPlaybookRecommendationQueue.topObserve,
                    ]
                        .slice(0, 6)
                        .map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${playbookRecommendationQueueClass(item.queueState)}`}>
                                                {item.queueState}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {item.priority}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {formatTime(item.createdAt)} · {item.outcomeStatus}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                        {item.entryIds.length} queries
                                    </span>
                                </div>
                                <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                    {item.reason}
                                </p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {item.queries.map((query) => (
                                        <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                            {query}
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const recommendation = allPlaybookRecommendations.find((candidate) => candidate.id === item.recommendationId);
                                            if (recommendation) {
                                                void onRunPlaybookRecommendationAction(recommendation);
                                            }
                                        }}
                                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                    >
                                        {item.actionLabel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(item.entryIds, `${item.title} queue query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsPlaybookRecommendationQueue.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 실행 가능한 search learning playbook recommendation queue가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Center</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            최근 activity triage와 승인 후 follow-up을 한 번에 보고, 가장 먼저 처리할 검색 학습 액션으로 바로 이어집니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <button
                            type="button"
                            onClick={() => onSelectEntries(
                                searchLearningOpsCenter.reviewPendingEntryIds,
                                `${searchLearningOpsCenter.reviewPendingEntryIds.length}개의 review pending query를 선택했습니다.`
                            )}
                            disabled={searchLearningOpsCenter.reviewPendingEntryIds.length === 0}
                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            review pending 선택 ({searchLearningOpsCenter.reviewPendingEntryIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => void onBulkGenerateSuggestionsForIds(
                                searchLearningOpsCenter.generateNeededEntryIds,
                                'ops_center_generate_needed',
                                (count) => `${count}개의 ops center generate query에 AI 제안을 생성했습니다.`,
                                'ops center generate query AI 제안 생성에 실패했습니다.'
                            )}
                            disabled={searchLearningOpsCenter.generateNeededEntryIds.length === 0}
                            className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            generate needed AI 제안 ({searchLearningOpsCenter.generateNeededEntryIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => void onBulkGenerateSuggestionsForIds(
                                searchLearningOpsCenter.retrainNeededEntryIds,
                                'ops_center_retrain_needed',
                                (count) => `${count}개의 ops center retrain query에 AI 제안을 생성했습니다.`,
                                'ops center retrain query AI 제안 생성에 실패했습니다.'
                            )}
                            disabled={searchLearningOpsCenter.retrainNeededEntryIds.length === 0}
                            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-bold text-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            retrain AI 제안 ({searchLearningOpsCenter.retrainNeededEntryIds.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => onSelectEntries(
                                searchLearningOpsCenter.sampleCollectionEntryIds,
                                `${searchLearningOpsCenter.sampleCollectionEntryIds.length}개의 표본 수집 query를 선택했습니다.`
                            )}
                            disabled={searchLearningOpsCenter.sampleCollectionEntryIds.length === 0}
                            className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 font-bold text-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            표본 수집 선택 ({searchLearningOpsCenter.sampleCollectionEntryIds.length})
                        </button>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Urgent Now</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsCenter.urgentNow}</p>
                        <p className="mt-1 text-xs text-rose-100/70">critical/high ops queue</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Pending</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsCenter.reviewPending}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 후보</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Generate Needed</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsCenter.generateNeeded}</p>
                        <p className="mt-1 text-xs text-sky-100/70">즉시 AI 생성 후보</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Sample Collection</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsCenter.sampleCollection}</p>
                        <p className="mt-1 text-xs text-amber-100/70">추가 관찰 필요</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Needed</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsCenter.retrainNeeded}</p>
                        <p className="mt-1 text-xs text-rose-100/70">follow-up 재학습 필요</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Validated</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsCenter.validated}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">개선 확인 activity</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {[
                        {
                            title: 'Urgent Now',
                            entries: searchLearningOpsCenter.topUrgentNow,
                            empty: '아직 즉시 처리할 ops item이 없습니다.',
                        },
                        {
                            title: 'Retrain Needed',
                            entries: searchLearningOpsCenter.topRetrainNeeded,
                            empty: '아직 재학습 follow-up이 없습니다.',
                        },
                        {
                            title: 'Validated',
                            entries: searchLearningOpsCenter.topValidated,
                            empty: '아직 개선 확인 activity가 없습니다.',
                        },
                    ].map((group) => (
                        <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                    top {group.entries.length}
                                </span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {group.entries.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${priorityBadgeClass(item.priority)}`}>
                                                        {item.priority}
                                                    </span>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                        {item.metricLabel}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatTime(item.lastSeenAt)}
                                                    {item.context ? ` · ${item.context}` : ''}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                {item.source}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {item.queries.slice(0, 4).map((query) => (
                                                <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                    {query}
                                                </span>
                                            ))}
                                        </div>
                                        <div className="mt-4 flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => void onRunOpsCenterAction(item)}
                                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                            >
                                                {item.actionLabel}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onSelectEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`)}
                                                className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                            >
                                                queue 선택
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {group.entries.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-sm text-slate-500">
                                        {group.empty}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </>
    );
}
