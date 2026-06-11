import { formatTime } from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;
type OutcomeRecommendation =
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations']['topObserve'][number];
type DeepQueueItem =
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue']['topExecuteNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue']['topNeedsReview'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue']['topSampleCollection'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue']['topObserve'][number];
type DeepRecommendation =
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topObserve'][number];

type SearchLearningCompletionOutcomeRecommendationSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
> & {
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunOutcomeRecommendation: (recommendation: OutcomeRecommendation) => Promise<void> | void;
    onRunDeepQueueItem: (item: DeepQueueItem) => Promise<void> | void;
    onRunDeepRecommendation: (recommendation: DeepRecommendation) => Promise<void> | void;
};

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

export function SearchLearningCompletionOutcomeRecommendationSections({
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    onSelectEntries,
    onRunOutcomeRecommendation,
    onRunDeepQueueItem,
    onRunDeepRecommendation,
}: SearchLearningCompletionOutcomeRecommendationSectionsProps) {
    return (
        <>
            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion recommendation outcome recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어봅니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            ready review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            needs attention {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            awaiting {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            validated {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.validated}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.topValidated,
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
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {outcome.entryIds.length} queries
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
                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome이 없습니다. `Completion Recommendation Outcome Recommendation Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-lime-500/20 bg-lime-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion recommendation outcome recommendation outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.reviewNow}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.retrainNow}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.collectSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
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
                                        onClick={() => void onRunOutcomeRecommendation(recommendation)}
                                        className="rounded-full border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs font-bold text-lime-100"
                                    >
                                        {recommendation.actionLabel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(recommendation.entryIds, `${recommendation.title} completion recommendation outcome recommendation outcome query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome recommendation이 없습니다. `Completion Recommendation Outcome Recommendation Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Queue</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            가장 최근 completion recommendation outcome recommendation outcome recommendation 액션을 `execute / review / sample / observe` 우선순위 큐로 정렬합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.executeNow}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.needsReview}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.sampleCollection}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topExecuteNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topNeedsReview,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topSampleCollection,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topObserve,
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
                                        onClick={() => void onRunDeepQueueItem(item)}
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
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome recommendation queue가 없습니다. `...Outcome Recommendations`가 쌓이면 여기에서 우선순위 큐로 정렬됩니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Activity</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion recommendation outcome recommendation outcome recommendation queue에서 실제 실행된 review/retrain 이력을 모아봅니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            runs {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.reviewRuns}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.retrainRuns}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            queries {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.uniqueQueries}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => (
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
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {run.count} items
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                {formatTime(run.createdAt)} · {run.context}
                            </p>
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
                                    onClick={() => onSelectEntries(run.entryIds, `${run.title} queue query를 선택했습니다.`)}
                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                            아직 completion recommendation outcome recommendation outcome recommendation activity가 없습니다. `...Queue`에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 볼 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion recommendation outcome recommendation outcome recommendation activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어봅니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            ready review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            needs attention {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            awaiting {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            validated {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.validated}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topValidated,
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
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {outcome.entryIds.length} queries
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
                                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome recommendation outcomes가 없습니다. `...Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-lime-500/20 bg-lime-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Outcome Recommendation Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion recommendation outcome recommendation outcome recommendation outcomes를 다시 `review / retrain / sample / observe` 액션으로 분류해서 바로 실행할 수 있게 정리합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.reviewNow}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.retrainNow}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.collectSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topReviewNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topRetrainNow,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topCollectSamples,
                        ...searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topObserve,
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
                                        onClick={() => void onRunDeepRecommendation(recommendation)}
                                        className="rounded-full border border-lime-500/40 bg-lime-500/10 px-3 py-2 text-xs font-bold text-lime-100"
                                    >
                                        {recommendation.actionLabel}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(recommendation.entryIds, `${recommendation.title} completion recommendation outcome recommendation outcome recommendation query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        ))}
                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation outcome recommendation outcome recommendation recommendations가 없습니다. `...Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
