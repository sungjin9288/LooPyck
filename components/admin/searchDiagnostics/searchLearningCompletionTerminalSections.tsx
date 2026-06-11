import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;
type TerminalQueueItem =
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue']['topExecuteNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue']['topNeedsReview'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue']['topSampleCollection'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue']['topObserve'][number];
type TerminalRecommendation =
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations']['topObserve'][number];

type SearchLearningCompletionTerminalSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations'
> & {
    onRunTerminalQueueItem: (item: TerminalQueueItem) => Promise<void> | void;
    onRunTerminalRecommendation: (recommendation: TerminalRecommendation) => Promise<void> | void;
    onSelectEntries: (entryIds: string[], message: string) => void;
};

function queueStateClass(queueState: string) {
    switch (queueState) {
        case 'execute_now':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'needs_review':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'sample_collection':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
    }
}

function activityActionClass(action: string) {
    return action === 'review_now'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
}

function outcomeStatusClass(status: string) {
    switch (status) {
        case 'ready_review':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'needs_attention':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'awaiting_samples':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
    }
}

function recommendationActionClass(action: string) {
    switch (action) {
        case 'review_now':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'retrain_now':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'collect_samples':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
    }
}

export function SearchLearningCompletionTerminalSections({
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
    onRunTerminalQueueItem,
    onRunTerminalRecommendation,
    onSelectEntries,
}: SearchLearningCompletionTerminalSectionsProps) {
    return (
        <>
            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Queue</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            가장 최근 completion recommendation outcome recommendation outcome recommendation recommendation 액션을 `execute / review / sample / observe` 우선순위 큐로 정렬합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.executeNow}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.needsReview}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.sampleCollection}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topExecuteNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topNeedsReview,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topSampleCollection,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.topObserve,
                    ]
                        .slice(0, 8)
                        .map((item) => (
                            <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${queueStateClass(item.queueState)}`}>
                                                {item.queueState}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {item.priority}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
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
                                    <button
                                        type="button"
                                        onClick={() => void onRunTerminalQueueItem(item)}
                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
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
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome recommendation recommendation queue가 없습니다. `...Recommendations`가 쌓이면 여기에서 우선순위 큐로 정렬됩니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Activity</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion recommendation outcome recommendation outcome recommendation recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 바로 queue로 넘길 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total runs {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.totalRuns}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.reviewRuns}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.retrainRuns}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            queries {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.uniqueQueries}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.recentRuns.map((run) => (
                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${activityActionClass(run.action)}`}>
                                            {run.action}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {run.priority}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                </div>
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
                                    onClick={() => onSelectEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity.totalRuns === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                            아직 completion recommendation outcome recommendation outcome recommendation recommendation activity가 없습니다. queue에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 확인할 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            직전 recommendation recommendation activity가 실제로 review-ready, retrain-needed, sample pending, validated 중 어디로 이어졌는지 다시 묶어 보여줍니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            ready review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            needs attention {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            awaiting {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.awaitingSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            validated {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.validated}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topReadyReview,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topNeedsAttention,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topAwaitingSamples,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.topValidated,
                    ]
                        .slice(0, 8)
                        .map((outcome) => (
                            <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${outcomeStatusClass(outcome.status)}`}>
                                                {outcome.status}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
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
                                        onClick={() => onSelectEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome recommendation recommendation outcomes가 없습니다. activity가 쌓이면 여기에서 후속 상태를 다시 확인할 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendation Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal layer입니다. 직전 outcomes를 `review / retrain / collect samples / observe` 액션으로 다시 묶되, 여기서 더 깊은 queue 체인은 만들지 않고 운영 액션으로 바로 닫습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.reviewNow}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.retrainNow}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.collectSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topReviewNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topRetrainNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topCollectSamples,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.topObserve,
                    ]
                        .slice(0, 8)
                        .map((recommendation) => (
                            <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${recommendationActionClass(recommendation.action)}`}>
                                                {recommendation.action}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {recommendation.priority}
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                    </div>
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
                                        onClick={() => void onRunTerminalRecommendation(recommendation)}
                                        className="rounded-full border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs font-bold text-lime-100"
                                    >
                                        {recommendation.actionLabel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(recommendation.entryIds, `${recommendation.title} terminal recommendation query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome recommendation recommendation recommendations가 없습니다. outcomes가 쌓이면 여기에서 terminal action으로 바로 닫을 수 있습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
