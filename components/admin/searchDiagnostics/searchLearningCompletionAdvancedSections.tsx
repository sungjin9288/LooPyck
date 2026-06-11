import { formatTime } from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningCompletionAdvancedSectionsProps = Pick<
    ReturnType<typeof buildSearchLearningWorkbench>,
    | 'searchLearningOpsCompletionActivity'
    | 'searchLearningOpsCompletionOutcomes'
    | 'searchLearningOpsCompletionRecommendations'
    | 'searchLearningOpsCompletionRecommendationQueue'
> & {
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunCompletionRecommendation: (
        recommendation: ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendations']['topReviewNow'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendations']['topRetrainNow'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendations']['topCollectSamples'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendations']['topObserve'][number]
    ) => Promise<void> | void;
    onRunCompletionRecommendationQueueItem: (
        item: ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendationQueue']['topExecuteNow'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendationQueue']['topNeedsReview'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendationQueue']['topSampleCollection'][number]
        | ReturnType<typeof buildSearchLearningWorkbench>['searchLearningOpsCompletionRecommendationQueue']['topObserve'][number]
    ) => Promise<void> | void;
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

function recommendationQueueClass(queueState: string) {
    switch (queueState) {
        case 'execute_now':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'needs_review':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'sample_collection':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
    }
}

export function SearchLearningCompletionAdvancedSections({
    searchLearningOpsCompletionActivity,
    searchLearningOpsCompletionOutcomes,
    searchLearningOpsCompletionRecommendations,
    searchLearningOpsCompletionRecommendationQueue,
    onSelectEntries,
    onRunCompletionRecommendation,
    onRunCompletionRecommendationQueueItem,
}: SearchLearningCompletionAdvancedSectionsProps) {
    return (
        <>
            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Activity</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion queue에서 실제 실행된 `즉시 AI 제안 / 즉시 승인` 이력을 모아봅니다. 같은 액션을 다시 실행하거나 관련 query를 아래 queue로 넘길 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total runs {searchLearningOpsCompletionActivity.totalRuns}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsCompletionActivity.executeRuns}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            review {searchLearningOpsCompletionActivity.reviewRuns}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            queries {searchLearningOpsCompletionActivity.uniqueQueries}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {searchLearningOpsCompletionActivity.recentRuns.map((run) => {
                        const badgeClass = run.action === 'execute_now'
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
                            : 'border-sky-500/30 bg-sky-500/10 text-sky-100';

                        return (
                            <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
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
                                        onClick={() => onSelectEntries(run.entryIds, `${run.title} 실행 query를 선택했습니다.`)}
                                        className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {searchLearningOpsCompletionActivity.totalRuns === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-3">
                            아직 completion activity가 없습니다. `Completion Queue`에서 액션을 실행하면 여기에 최근 이력이 쌓입니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion activity가 실제로 `ready review / needs attention / awaiting samples / validated` 중 어디로 이어졌는지 다시 묶어 보여줍니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            ready {searchLearningOpsCompletionOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            attention {searchLearningOpsCompletionOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionOutcomes.awaitingSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            validated {searchLearningOpsCompletionOutcomes.validated}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionOutcomes.topReadyReview,
                        ...searchLearningOpsCompletionOutcomes.topNeedsAttention,
                        ...searchLearningOpsCompletionOutcomes.topAwaitingSamples,
                        ...searchLearningOpsCompletionOutcomes.topValidated,
                    ].slice(0, 8).map((outcome) => (
                        <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${outcomeStatusClass(outcome.status)}`}>
                                            {outcome.status}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {outcome.action}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                </div>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                improved {outcome.improvedCount} · no improvement {outcome.noImprovementCount} · awaiting {outcome.awaitingSamplesCount}
                            </p>
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
                                    className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsCompletionOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion outcome이 없습니다. `Completion Activity`가 쌓이면 여기에서 후속 상태를 다시 볼 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion outcome을 바로 실행 가능한 triage 액션으로 다시 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상으로 바로 넘길 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendations.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsCompletionRecommendations.reviewNow}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsCompletionRecommendations.retrainNow}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionRecommendations.collectSamples}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionRecommendations.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendations.topReviewNow,
                        ...searchLearningOpsCompletionRecommendations.topRetrainNow,
                        ...searchLearningOpsCompletionRecommendations.topCollectSamples,
                        ...searchLearningOpsCompletionRecommendations.topObserve,
                    ].slice(0, 8).map((recommendation) => (
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
                                    onClick={() => void onRunCompletionRecommendation(recommendation)}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                >
                                    {recommendation.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(recommendation.entryIds, `${recommendation.title} completion recommendation query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsCompletionRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation이 없습니다. `Completion Outcomes`가 쌓이면 여기에서 바로 triage 액션으로 이어질 수 있습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-teal-500/20 bg-teal-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Queue</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            completion recommendation을 실제 운영 우선순위로 다시 정렬합니다. execute, review, sample, observe 순으로 바로 처리할 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsCompletionRecommendationQueue.total}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            execute {searchLearningOpsCompletionRecommendationQueue.executeNow}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsCompletionRecommendationQueue.needsReview}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsCompletionRecommendationQueue.sampleCollection}
                        </span>
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            observe {searchLearningOpsCompletionRecommendationQueue.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                        ...searchLearningOpsCompletionRecommendationQueue.topExecuteNow,
                        ...searchLearningOpsCompletionRecommendationQueue.topNeedsReview,
                        ...searchLearningOpsCompletionRecommendationQueue.topSampleCollection,
                        ...searchLearningOpsCompletionRecommendationQueue.topObserve,
                    ].slice(0, 8).map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${recommendationQueueClass(item.queueState)}`}>
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
                                    onClick={() => void onRunCompletionRecommendationQueueItem(item)}
                                    className="rounded-full border border-teal-500/40 bg-teal-500/10 px-3 py-2 text-xs font-bold text-teal-100"
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
                    {searchLearningOpsCompletionRecommendationQueue.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 md:col-span-2 xl:col-span-4">
                            아직 completion recommendation queue가 없습니다. `Completion Recommendations`가 쌓이면 여기에서 운영 우선순위로 바로 처리할 수 있습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
