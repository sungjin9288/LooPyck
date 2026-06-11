import { formatTime } from './helpers';
import { buildSearchLearningWorkbench } from './searchLearningWorkbench';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type PlaybookRecommendation =
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendations']['topObserve'][number];
type OutcomeOutcomeRecommendation =
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations']['topObserve'][number];
type PlaybookRecommendationOutcome =
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomes']['topReadyReview'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomes']['topNeedsAttention'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomes']['topAwaitingSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomes']['topValidated'][number];
type OutcomeRecommendation =
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendations']['topReviewNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendations']['topRetrainNow'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendations']['topCollectSamples'][number]
    | SearchLearningWorkbench['searchLearningOpsPlaybookRecommendationOutcomeRecommendations']['topObserve'][number];

type SearchLearningPlaybookRecommendationOutcomeSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsPlaybookRecommendationActivity'
    | 'searchLearningOpsPlaybookRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomes'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendations'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes'
> & {
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunPlaybookRecommendationAction: (recommendation: PlaybookRecommendation) => Promise<void> | void;
    onRunPlaybookRecommendationOutcomeAction: (outcome: PlaybookRecommendationOutcome) => Promise<void> | void;
    onRunOutcomeOutcomeRecommendationAction: (recommendation: OutcomeOutcomeRecommendation) => Promise<void> | void;
    onRunOutcomeRecommendationAction: (recommendation: OutcomeRecommendation) => Promise<void> | void;
};

function recommendationOutcomeStatusClass(status: string) {
    switch (status) {
        case 'ready_review':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'needs_attention':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'awaiting_samples':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-slate-700 bg-slate-950/70 text-slate-300';
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
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
    }
}

function recommendationPriorityClass(priority: string) {
    switch (priority) {
        case 'critical':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'high':
            return 'border-orange-500/30 bg-orange-500/10 text-orange-100';
        case 'medium':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
    }
}

function outcomeRecommendationQueueClass(queueState: string) {
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

function outcomeRecommendationActivityClass(action: string) {
    return action === 'review_now'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
}

function outcomeRecommendationOutcomeStatusClass(status: string) {
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

export function SearchLearningPlaybookRecommendationOutcomeSections({
    searchLearningOpsPlaybookRecommendationActivity,
    searchLearningOpsPlaybookRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomes,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendations,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes,
    onSelectEntries,
    onRunPlaybookRecommendationAction,
    onRunPlaybookRecommendationOutcomeAction,
    onRunOutcomeOutcomeRecommendationAction,
    onRunOutcomeRecommendationAction,
}: SearchLearningPlaybookRecommendationOutcomeSectionsProps) {
    const allPlaybookRecommendations = [
        ...searchLearningOpsPlaybookRecommendations.topReviewNow,
        ...searchLearningOpsPlaybookRecommendations.topRetrainNow,
        ...searchLearningOpsPlaybookRecommendations.topCollectSamples,
        ...searchLearningOpsPlaybookRecommendations.topObserve,
    ];
    const allOutcomeOutcomeRecommendations = [
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topReviewNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topRetrainNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topCollectSamples,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.topObserve,
    ];
    const allOutcomeRecommendations = [
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topReviewNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topRetrainNow,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topCollectSamples,
        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendations.topObserve,
    ];

    return (
        <>
            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcome Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            후속 outcome을 다시 실행 가능한 triage 액션으로 정리합니다. review 즉시 승인, 재학습, 표본 수집, 관찰 대상을 바로 처리할 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.total}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.retrainNow}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.reviewNow}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            samples {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.collectSamples}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            observe {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.observe}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.reviewNow}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Retrain Now</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.retrainNow}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Collect Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.collectSamples}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Observe</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">
                            {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.observe}
                        </p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {allOutcomeOutcomeRecommendations.slice(0, 6).map((recommendation) => (
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
                                        {recommendation.reason}
                                    </p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {recommendation.entryIds.length} queries
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {recommendation.queries.map((query) => (
                                    <span
                                        key={`${recommendation.id}_${query}`}
                                        className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200"
                                    >
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunOutcomeOutcomeRecommendationAction(recommendation)}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                >
                                    {recommendation.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(
                                        recommendation.entryIds,
                                        `${recommendation.title} outcome recommendation outcome query를 선택했습니다.`
                                    )}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 outcome recommendation outcome 후속 추천이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Activity</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            recommendation queue에서 실제로 실행된 review/retrain activity를 추적해서, 동일 outcome 재실행과 queue 후속 조치를 바로 이어갈 수 있습니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total runs {searchLearningOpsPlaybookRecommendationActivity.totalRuns}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookRecommendationActivity.reviewRuns}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsPlaybookRecommendationActivity.retrainRuns}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            unique queries {searchLearningOpsPlaybookRecommendationActivity.uniqueQueries}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Total Runs</p>
                        <p className="mt-3 text-3xl font-black text-white">{searchLearningOpsPlaybookRecommendationActivity.totalRuns}</p>
                        <p className="mt-1 text-xs text-slate-500">recommendation queue 실행 기록</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Runs</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationActivity.reviewRuns}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 실행 횟수</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Runs</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendationActivity.retrainRuns}</p>
                        <p className="mt-1 text-xs text-rose-100/70">재학습 AI 제안 실행 횟수</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Unique Queries</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationActivity.uniqueQueries}</p>
                        <p className="mt-1 text-xs text-sky-100/70">activity가 다룬 query 수</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningOpsPlaybookRecommendationActivity.recentRuns.map((run) => {
                        const recommendation = allPlaybookRecommendations.find((candidate) => candidate.outcomeId === run.outcomeId);

                        return (
                            <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${recommendationActionClass(run.action)}`}>
                                                {run.action}
                                            </span>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {run.entryIds.length} queries
                                            </span>
                                        </div>
                                        <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {formatTime(run.createdAt)}{run.actorUid ? ` · ${run.actorUid}` : ''}
                                        </p>
                                    </div>
                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                        {run.actionLabel}
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
                                            onClick={() => void onRunPlaybookRecommendationAction(recommendation)}
                                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                        >
                                            동일 recommendation 실행
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
                    {searchLearningOpsPlaybookRecommendationActivity.totalRuns === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 recommendation queue 실행 activity가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            recommendation activity가 실제로 `review 가능 / 재학습 필요 / 표본 대기 / 안정화` 중 어디에 있는지 다시 분류해서 후속 triage를 바로 탈 수 있게 합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            attention {searchLearningOpsPlaybookRecommendationOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            awaiting {searchLearningOpsPlaybookRecommendationOutcomes.awaitingSamples}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Ready Review</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationOutcomes.readyReview}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 recommendation outcome</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Needs Attention</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendationOutcomes.needsAttention}</p>
                        <p className="mt-1 text-xs text-rose-100/70">재학습 또는 rewrite 조정 필요</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Awaiting Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationOutcomes.awaitingSamples}</p>
                        <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 recommendation outcome</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Validated</p>
                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookRecommendationOutcomes.validated}</p>
                        <p className="mt-1 text-xs text-slate-400">안정적으로 개선된 outcome</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[
                        ...searchLearningOpsPlaybookRecommendationOutcomes.topReadyReview,
                        ...searchLearningOpsPlaybookRecommendationOutcomes.topNeedsAttention,
                        ...searchLearningOpsPlaybookRecommendationOutcomes.topAwaitingSamples,
                        ...searchLearningOpsPlaybookRecommendationOutcomes.topValidated,
                    ]
                        .slice(0, 6)
                        .map((outcome) => {
                            const recommendation = allPlaybookRecommendations.find((candidate) => candidate.outcomeId === outcome.outcomeId);

                            return (
                                <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${recommendationOutcomeStatusClass(outcome.status)}`}>
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
                                            onClick={() => void onRunPlaybookRecommendationOutcomeAction(outcome)}
                                            className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                        >
                                            {outcome.status === 'ready_review'
                                                ? 'review 즉시 승인'
                                                : outcome.status === 'needs_attention'
                                                    ? '재학습 AI 제안'
                                                    : 'queue 선택'}
                                        </button>
                                        {recommendation && (
                                            <button
                                                type="button"
                                                onClick={() => void onRunPlaybookRecommendationAction(recommendation)}
                                                className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                            >
                                                동일 recommendation 실행
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    {searchLearningOpsPlaybookRecommendationOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 평가 가능한 recommendation outcome이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendations</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            recommendation outcome을 다시 다음 액션으로 재분류해서, review 승인/재학습/표본 수집을 한 단계 더 자동화합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.total}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            critical {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.critical}
                        </span>
                        <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-orange-100">
                            high {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.highPriority}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.reviewNow}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 outcome recommendation</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Now</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.retrainNow}</p>
                        <p className="mt-1 text-xs text-rose-100/70">즉시 재학습할 outcome recommendation</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Collect Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.collectSamples}</p>
                        <p className="mt-1 text-xs text-amber-100/70">표본이 더 필요한 outcome recommendation</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Observe</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendations.observe}</p>
                        <p className="mt-1 text-xs text-sky-100/70">개선 상태를 관찰할 outcome recommendation</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {allOutcomeRecommendations.slice(0, 6).map((recommendation) => (
                        <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${recommendationPriorityClass(recommendation.priority)}`}>
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
                                    onClick={() => void onRunOutcomeRecommendationAction(recommendation)}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                >
                                    {recommendation.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(
                                        recommendation.entryIds,
                                        `${recommendation.title} recommendation outcome recommendation query를 선택했습니다.`
                                    )}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendations.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 실행 가능한 recommendation outcome recommendation이 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Queue</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            outcome recommendation을 다시 실행 우선순위 큐로 정렬해서, 지금 당장 처리할 항목과 관찰 대상으로 남길 항목을 분리합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.total}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            urgent {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.urgent}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            execute {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.executeNow}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.needsReview}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Execute Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.executeNow}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 재학습/실행할 항목</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Needs Review</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.needsReview}</p>
                        <p className="mt-1 text-xs text-sky-100/70">즉시 승인 review 대상</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Sample Collection</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.sampleCollection}</p>
                        <p className="mt-1 text-xs text-amber-100/70">추가 샘플이 필요한 항목</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Observe</p>
                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.observe}</p>
                        <p className="mt-1 text-xs text-slate-400">개선 상태를 관찰할 항목</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topExecuteNow,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topNeedsReview,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topSampleCollection,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.topObserve,
                    ]
                        .slice(0, 6)
                        .map((item) => {
                            const recommendation = allOutcomeRecommendations.find((candidate) => candidate.id === item.recommendationId);

                            return (
                                <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${outcomeRecommendationQueueClass(item.queueState)}`}>
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
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationQueue.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 실행 가능한 recommendation outcome recommendation queue가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Activity</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            outcome recommendation queue에서 실제로 실행된 review/retrain activity를 최근 이력으로 보여주고, 같은 outcome을 다시 실행하거나 queue로 넘길 수 있게 합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            runs {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.totalRuns}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.reviewRuns}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            retrain {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.retrainRuns}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                            queries {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.uniqueQueries}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => {
                        const recommendation = allOutcomeRecommendations.find((candidate) => candidate.outcomeId === run.outcomeId);

                        return (
                            <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${outcomeRecommendationActivityClass(run.action)}`}>
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
                                            동일 outcome recommendation 실행
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
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 outcome recommendation queue 실행 activity가 없습니다.
                        </div>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Ops Playbook Recommendation Outcome Recommendation Outcomes</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            outcome recommendation activity가 실제로 review 가능한 draft로 이어졌는지, 재학습이 더 필요한지, 표본을 더 모아야 하는지 다시 묶어서 보여줍니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                            total {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.total}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            ready review {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.readyReview}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            needs attention {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.needsAttention}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            awaiting {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.awaitingSamples}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            validated {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.validated}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {[
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topReadyReview,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topNeedsAttention,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topAwaitingSamples,
                        ...searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.topValidated,
                    ]
                        .slice(0, 6)
                        .map((outcome) => {
                            const recommendation = allOutcomeRecommendations.find((candidate) => candidate.outcomeId === outcome.outcomeId);

                            return (
                                <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${outcomeRecommendationOutcomeStatusClass(outcome.status)}`}>
                                                    {outcome.status}
                                                </span>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                    {outcome.action}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                {formatTime(outcome.createdAt)} · improved {outcome.improvedCount} · weak {outcome.noImprovementCount}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                            {outcome.entryIds.length} queries
                                        </span>
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
                                        {recommendation && (
                                            <button
                                                type="button"
                                                onClick={() => void onRunOutcomeRecommendationAction(recommendation)}
                                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                            >
                                                동일 outcome recommendation 실행
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => onSelectEntries(outcome.entryIds, `${outcome.title} outcome query를 선택했습니다.`)}
                                            className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                        >
                                            queue 선택
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    {searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes.total === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 outcome recommendation activity 후속 outcome이 없습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
