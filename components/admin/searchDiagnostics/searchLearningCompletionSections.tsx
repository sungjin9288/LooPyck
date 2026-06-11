import { formatTime } from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningCompletionSectionsProps = Pick<
    ReturnType<typeof buildSearchLearningWorkbench>,
    | 'searchLearningOpsCompletionSummary'
    | 'searchLearningOpsCompletionActions'
    | 'searchLearningOpsCompletionQueue'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
> & {
    showAdvancedSearchLearningChain: boolean;
    onToggleAdvancedChain: () => void;
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunCompletionAction: (
        action: ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionActions']['topActions'][number]
    ) => Promise<void> | void;
    onRunCompletionQueueItem: (
        item: ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionQueue']['topItems'][number]
    ) => Promise<void> | void;
    onRunSummaryRecommendation: (
        recommendation: ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topReviewNow'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topRetrainNow'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topCollectSamples'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topObserve'][number]
    ) => Promise<void> | void;
};

function completionSummaryStateClass(state: string) {
    switch (state) {
        case 'action_required':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'review_required':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        case 'sampling':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        case 'monitoring':
            return 'border-slate-700 bg-slate-950/70 text-slate-300';
        default:
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
    }
}

function completionActionClass(type: string) {
    switch (type) {
        case 'execute_now':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'review_now':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        case 'collect_samples':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
    }
}

function completionQueueClass(queueState: string) {
    switch (queueState) {
        case 'execute_now':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'needs_review':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        case 'sample_collection':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
    }
}

export function SearchLearningCompletionSections({
    searchLearningOpsCompletionSummary,
    searchLearningOpsCompletionActions,
    searchLearningOpsCompletionQueue,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    showAdvancedSearchLearningChain,
    onToggleAdvancedChain,
    onSelectEntries,
    onRunCompletionAction,
    onRunCompletionQueueItem,
    onRunSummaryRecommendation,
}: SearchLearningCompletionSectionsProps) {
    const summaryRecommendations = [
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topReviewNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topRetrainNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topCollectSamples,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topObserve,
    ];

    return (
        <>
            <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Summary</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            현재 deepest search learning ops 체인을 한 번에 닫는 terminal summary입니다. 운영자는 여기서 즉시 실행, review, 표본 수집, 관찰, 안정화 상태를 바로 판단하면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            state {searchLearningOpsCompletionSummary.state}
                        </span>
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionSummary.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            immediate {searchLearningOpsCompletionSummary.immediateCount}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            sampling {searchLearningOpsCompletionSummary.sampleCollection}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            stable signals {searchLearningOpsCompletionSummary.stableSignals}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Execute Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsCompletionSummary.executeNow}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Review</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsCompletionSummary.needsReview}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Sample Collection</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsCompletionSummary.sampleCollection}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe</p>
                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsCompletionSummary.observe}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Validated</p>
                        <p className="mt-3 text-3xl font-black text-cyan-100">{searchLearningOpsCompletionSummary.validated}</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {[
                        ...searchLearningOpsCompletionSummary.topImmediate,
                        ...searchLearningOpsCompletionSummary.topSampling,
                        ...searchLearningOpsCompletionSummary.topObserve,
                    ].slice(0, 6).map((item) => {
                        const recommendation = summaryRecommendations.find((candidate) => candidate.id === item.recommendationId);

                        return (
                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${completionSummaryStateClass(item.state)}`}>
                                                {item.state}
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
                                    {recommendation && (
                                        <button
                                            type="button"
                                            onClick={() => void onRunSummaryRecommendation(recommendation)}
                                            className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                        >
                                            {item.actionLabel}
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(item.entryIds, `${item.title} terminal summary query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {searchLearningOpsCompletionSummary.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-3">
                            현재 search learning ops 체인은 안정 상태입니다. 새 action item이 생기면 여기에서 바로 노출됩니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Actions</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal summary를 실제 batch 실행 단위로 다시 묶은 섹션입니다. 운영자는 여기서 즉시 AI 제안, 즉시 승인, 표본 수집, 관찰 액션을 바로 실행하면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionActions.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsCompletionActions.executeNow}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            review {searchLearningOpsCompletionActions.reviewNow}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionActions.collectSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionActions.observeNow}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {searchLearningOpsCompletionActions.topActions.map((action) => (
                        <div key={action.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${completionActionClass(action.type)}`}>
                                            {action.type}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {action.priority}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{action.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {action.queryCount} queries
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{action.description}</p>
                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                {action.reason}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {action.queries.slice(0, 8).map((query) => (
                                    <span key={`${action.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunCompletionAction(action)}
                                    className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                >
                                    {action.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(action.entryIds, `${action.title}의 ${action.entryIds.length}개 query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsCompletionActions.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            현재 terminal completion action이 없습니다. 상단 `Completion Summary`가 stable이면 추가 조치가 필요하지 않습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Queue</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion action을 실제 운영 우선순위 큐로 다시 정렬한 섹션입니다. execute/review를 먼저 처리하고, sample/observe는 후순위로 바로 넘길 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionQueue.total}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            urgent {searchLearningOpsCompletionQueue.urgent}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsCompletionQueue.executeNow}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            review {searchLearningOpsCompletionQueue.needsReview}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionQueue.sampleCollection}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionQueue.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {searchLearningOpsCompletionQueue.topItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${completionQueueClass(item.queueState)}`}>
                                            {item.queueState}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {item.priority}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {item.queryCount} queries
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                {item.reason}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.queries.slice(0, 8).map((query) => (
                                    <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunCompletionQueueItem(item)}
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
                    {searchLearningOpsCompletionQueue.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                            현재 completion queue가 비어 있습니다. 상단 `Completion Actions`가 모두 소진되면 추가 우선순위 처리가 필요하지 않습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Advanced Search Learning Chain</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            completion workflow의 깊은 중간 단계는 기본 화면에서 숨깁니다. 일반 운영은 `Completion Summary`, `Completion Actions`, `Completion Queue`, terminal recommendations만으로 처리하고, 필요할 때만 아래 상세 chain을 펼치세요.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onToggleAdvancedChain}
                        className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200"
                    >
                        {showAdvancedSearchLearningChain ? 'Advanced Chain 접기' : 'Advanced Chain 펼치기'}
                    </button>
                </div>
            </section>
        </>
    );
}
