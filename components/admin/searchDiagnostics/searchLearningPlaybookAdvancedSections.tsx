import { formatTime } from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type OutcomeRecommendation =
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topObserve'][number];
type AdvancedRecommendation =
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations']['topObserve'][number];

type SearchLearningPlaybookAdvancedSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue'
> & {
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunOutcomeRecommendationAction: (recommendation: OutcomeRecommendation) => Promise<void> | void;
    onRunAdvancedRecommendationAction: (recommendation: AdvancedRecommendation) => Promise<void> | void;
};

function recommendationActionClass(action: string) {
    switch (action) {
        case 'review_now':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'retrain_now':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'collect_samples':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
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
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
    }
}

function queueStateClass(queueState: string) {
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

export function SearchLearningPlaybookAdvancedSections({
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
    onSelectEntries,
    onRunOutcomeRecommendationAction,
    onRunAdvancedRecommendationAction,
}: SearchLearningPlaybookAdvancedSectionsProps) {
    const allOutcomeRecommendations = [
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
    ];
    const allAdvancedRecommendations = [
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topReviewNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topRetrainNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topCollectSamples,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.topObserve,
    ];

    return (
        <>
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Activity</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            outcome recommendation outcome recommendation queue에서 실제로 실행된 review/retrain activity를 최근 이력으로 보여주고, 같은 recommendation을 다시 실행하거나 queue로 넘길 수 있게 합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            runs {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.reviewRuns}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.retrainRuns}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                            queries {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.uniqueQueries}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => {
                        const recommendation = allOutcomeRecommendations.find((candidate) => candidate.outcomeId === run.outcomeId);

                        return (
                            <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${activityActionClass(run.action)}`}>
                                                {run.action}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {run.count} entries
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {formatTime(run.createdAt)} · {run.context}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                        {run.priority}
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
                                    {recommendation && (
                                        <button
                                            type="button"
                                            onClick={() => void onRunOutcomeRecommendationAction(recommendation)}
                                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                        >
                                            동일 outcome recommendation outcome recommendation 실행
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                        className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        queue 선택
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 outcome recommendation outcome recommendation queue 실행 activity가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            outcome recommendation outcome recommendation activity가 실제로 review 가능한 draft로 이어졌는지, 재학습이 더 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            validated {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.validated}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ready Review</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.readyReview}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Attention</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.needsAttention}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Validated</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.validated}
                        </p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.topValidated,
                    ]
                        .slice(0, 6)
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
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {formatTime(outcome.createdAt)} · {outcome.context}
                                        </p>
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
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 outcome recommendation outcome recommendation activity outcome이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            후속 outcome recommendation activity 결과를 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상을 바로 처리할 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.reviewNow}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.retrainNow}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.collectSamples}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            observe {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.reviewNow}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Retrain Now</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.retrainNow}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Collect Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.collectSamples}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.observe}
                        </p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {allAdvancedRecommendations.slice(0, 6).map((recommendation) => (
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
                                    onClick={() => void onRunAdvancedRecommendationAction(recommendation)}
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
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 outcome recommendation outcome recommendation recommendation이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendation Queue</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            후속 outcome triage 추천을 `즉시 실행 / review / 표본 수집 / 관찰` 큐로 다시 정렬합니다. 운영자는 이 큐만 보고 우선순위 처리를 이어가면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.executeNow}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.needsReview}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.sampleCollection}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            urgent {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.urgent}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topExecuteNow,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topNeedsReview,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topSampleCollection,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.topObserve,
                    ]
                        .slice(0, 6)
                        .map((item) => {
                            const recommendation = allOutcomeRecommendations.find((candidate) => candidate.id === item.recommendationId);

                            return (
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
                                                if (recommendation) {
                                                    void onRunOutcomeRecommendationAction(recommendation);
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
                            );
                        })}
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationQueue.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 실행 가능한 outcome recommendation outcome recommendation queue가 없습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
