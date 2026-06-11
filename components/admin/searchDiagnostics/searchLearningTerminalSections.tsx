import {
    buildSearchLearningWorkbench,
    type SearchLearningTerminalWorkflowAction,
} from './searchLearningWorkbench';

type SearchLearningTerminalSectionsProps = Pick<
    ReturnType<typeof buildSearchLearningWorkbench>,
    | 'searchLearningTerminalWorkflow'
    | 'searchLearningTerminalAlerts'
    | 'searchLearningTerminalHealth'
    | 'searchLearningTerminalChecklist'
    | 'searchLearningTerminalRunbook'
    | 'searchLearningTerminalMetrics'
    | 'searchLearningTerminalTrends'
    | 'searchLearningTerminalWatchlist'
    | 'searchLearningTerminalMetricsMaxDailyTotal'
    | 'searchLearningTerminalCoverage'
    | 'searchLearningTerminalPriorities'
    | 'searchLearningTerminalOverview'
    | 'searchLearningTerminalHandoff'
    | 'searchLearningTerminalValidation'
> & {
    onRunTerminalAction: (action: SearchLearningTerminalWorkflowAction) => Promise<void> | void;
    onSelectEntries: (entryIds: string[], message: string) => void;
};

function terminalStatusClass(status: string) {
    switch (status) {
        case 'critical':
        case 'attention':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'action':
        case 'pending':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        case 'monitoring':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        default:
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
    }
}

function terminalToneClass(tone: string) {
    switch (tone) {
        case 'rose':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'amber':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        case 'sky':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        case 'emerald':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        default:
            return 'border-slate-700 bg-slate-950/70 text-slate-200';
    }
}

function terminalPriorityClass(priority: string) {
    switch (priority) {
        case 'critical':
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
        case 'high':
        case 'warning':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        case 'medium':
        case 'info':
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
        default:
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
    }
}

function terminalChecklistClass(status: string) {
    switch (status) {
        case 'done':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'active':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-sky-500/30 bg-sky-500/10 text-sky-100';
    }
}

function terminalCoverageClass(label: string) {
    switch (label) {
        case 'strong':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100';
        case 'mixed':
            return 'border-amber-500/30 bg-amber-500/10 text-amber-100';
        default:
            return 'border-rose-500/30 bg-rose-500/10 text-rose-100';
    }
}

export function SearchLearningTerminalSections({
    searchLearningTerminalWorkflow,
    searchLearningTerminalAlerts,
    searchLearningTerminalHealth,
    searchLearningTerminalChecklist,
    searchLearningTerminalRunbook,
    searchLearningTerminalMetrics,
    searchLearningTerminalTrends,
    searchLearningTerminalWatchlist,
    searchLearningTerminalMetricsMaxDailyTotal,
    searchLearningTerminalCoverage,
    searchLearningTerminalPriorities,
    searchLearningTerminalOverview,
    searchLearningTerminalHandoff,
    searchLearningTerminalValidation,
    onRunTerminalAction,
    onSelectEntries,
}: SearchLearningTerminalSectionsProps) {
    return (
        <>
            <section className="mt-8 rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Overview</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal surface 전체를 한 번에 압축한 최종 요약입니다. 상태, coverage, action load, 첫 액션을 보고 바로 다음 lane로 이동하면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-3 py-1 ${terminalStatusClass(searchLearningTerminalOverview.status)}`}>
                            {searchLearningTerminalOverview.status}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-200">
                            lane {searchLearningTerminalOverview.primaryLane}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-sm font-semibold text-white">{searchLearningTerminalOverview.headline}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{searchLearningTerminalOverview.summary}</p>
                        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                            {searchLearningTerminalOverview.nextStep}
                        </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Health Score</p>
                            <p className="mt-3 text-3xl font-black text-white">{searchLearningTerminalOverview.healthScore}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Coverage Score</p>
                            <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalOverview.coverageScore}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Action Load</p>
                            <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningTerminalOverview.actionLoad}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Priority Count</p>
                            <p className="mt-3 text-3xl font-black text-fuchsia-100">{searchLearningTerminalOverview.watchCount}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {searchLearningTerminalOverview.spotlights.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(item.tone)}`}>
                                {item.label}
                            </span>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-sky-500/20 bg-sky-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Handoff</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal 상태를 실제 운영 인계 기준으로 `지금 / 다음 / 확인` 세 줄로 압축한 섹션입니다. 이 카드만 보고도 바로 액션을 이어갈 수 있게 정리합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-3 py-1 ${terminalStatusClass(searchLearningTerminalHandoff.status)}`}>
                            {searchLearningTerminalHandoff.status}
                        </span>
                    </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm font-semibold text-white">{searchLearningTerminalHandoff.headline}</p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {[searchLearningTerminalHandoff.current, searchLearningTerminalHandoff.next, searchLearningTerminalHandoff.followUp].map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(item.tone)}`}>
                                {item.label}
                            </span>
                            <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {item.action ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void onRunTerminalAction(item.action)}
                                            className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100"
                                        >
                                            {item.action.actionLabel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onSelectEntries(item.action.entryIds, `${item.title}의 ${item.action.entryIds.length}개 query를 선택했습니다.`)}
                                            className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                        >
                                            queue 선택
                                        </button>
                                    </>
                                ) : (
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-bold text-slate-300">
                                        follow-up only
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Validation</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            production redeploy 이후 terminal surface, 실제 검색 신호, workflow loop, impact 추적이 준비됐는지 한 번에 확인하는 검증 레이어입니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-3 py-1 ${terminalStatusClass(searchLearningTerminalValidation.status)}`}>
                            {searchLearningTerminalValidation.status}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            ready {searchLearningTerminalValidation.checks.ready}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            attention {searchLearningTerminalValidation.checks.attention}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            pending {searchLearningTerminalValidation.checks.pending}
                        </span>
                    </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm font-semibold text-white">{searchLearningTerminalValidation.headline}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{searchLearningTerminalValidation.nextStep}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-100">
                            validation doc
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            {searchLearningTerminalValidation.docPath}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    {searchLearningTerminalValidation.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(item.tone)}`}>
                                        {item.label}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                </div>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(item.tone)}`}>
                                    {item.status}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {item.action ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void onRunTerminalAction(item.action)}
                                            className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100"
                                        >
                                            {item.action.actionLabel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onSelectEntries(item.action.entryIds, `${item.title} query를 선택했습니다.`)}
                                            className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                        >
                                            queue 선택
                                        </button>
                                    </>
                                ) : (
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs font-bold text-slate-300">
                                        manual check
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-slate-700 bg-slate-950/70 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Health</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal workflow의 현재 건강 상태를 score와 blocker 기준으로 요약한 섹션입니다. 긴급도 판단은 여기서, 실제 액션은 아래 alerts/runbook에서 바로 시작하면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-200">
                            score {searchLearningTerminalHealth.score}
                        </span>
                        <span className={`rounded-full border px-3 py-1 ${terminalStatusClass(searchLearningTerminalHealth.label)}`}>
                            {searchLearningTerminalHealth.label}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1.3fr_1fr]">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-sm font-semibold text-white">{searchLearningTerminalHealth.summary}</p>
                        <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
                            {searchLearningTerminalHealth.nextCheck}
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Blockers</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {searchLearningTerminalHealth.blockers.length > 0 ? (
                                searchLearningTerminalHealth.blockers.map((blocker) => (
                                    <span
                                        key={blocker}
                                        className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200"
                                    >
                                        {blocker}
                                    </span>
                                ))
                            ) : (
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-100">
                                    blocker 없음
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Priorities</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            health, coverage, alerts, watchlist를 한 번에 눌러서 지금 먼저 처리할 lane를 압축한 요약입니다. terminal surface에서 가장 먼저 볼 섹션으로 두고 바로 action으로 이어가면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-3 py-1 ${terminalStatusClass(searchLearningTerminalPriorities.status)}`}>
                            {searchLearningTerminalPriorities.status}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            critical {searchLearningTerminalPriorities.critical}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            high {searchLearningTerminalPriorities.high}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            medium {searchLearningTerminalPriorities.medium}
                        </span>
                    </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                    <p className="text-sm font-semibold text-white">{searchLearningTerminalPriorities.headline}</p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {searchLearningTerminalPriorities.priorities.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalPriorityClass(item.severity)}`}>
                                        {item.severity}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {item.count}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                                <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-slate-200">
                                    {item.source}
                                </span>
                                <span className="rounded-full border border-fuchsia-500/30 bg-fuchsia-500/10 px-2 py-1 text-fuchsia-100">
                                    {item.lane}
                                </span>
                                {item.action && (
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(item.action.entryIds, `${item.title}의 ${item.action.entryIds.length}개 query를 선택했습니다.`)}
                                        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-emerald-100 transition hover:border-emerald-400 hover:bg-emerald-500/20"
                                    >
                                        {item.action.actionLabel}
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Metrics</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            최근 search-learning 운영량과 terminal backlog를 같이 보는 요약입니다. health 점수만 보지 않고 실제 review/generate/reviewed 추세가 살아 있는지 여기서 먼저 확인합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            active days {searchLearningTerminalMetrics.activeDays}/7
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            backlog {searchLearningTerminalMetrics.backlogPressure}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            critical {searchLearningTerminalMetrics.criticalAlerts}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1.4fr]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Action Load</p>
                            <p className="mt-3 text-3xl font-black text-cyan-100">{searchLearningTerminalMetrics.actionLoad}</p>
                            <p className="mt-2 text-xs text-slate-400">review/draft/generate/retrain이 몰린 현재 작업량</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recent Generated</p>
                            <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningTerminalMetrics.recentGenerated}</p>
                            <p className="mt-2 text-xs text-slate-400">최근 7일간 생성된 AI suggestion 수</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Recent Reviewed</p>
                            <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalMetrics.recentReviewed}</p>
                            <p className="mt-2 text-xs text-slate-400">최근 7일간 review에 들어간 query 수</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved / Ignored</p>
                            <p className="mt-3 text-3xl font-black text-white">
                                {searchLearningTerminalMetrics.recentApproved}
                                <span className="mx-2 text-slate-500">/</span>
                                <span className="text-slate-300">{searchLearningTerminalMetrics.recentIgnored}</span>
                            </p>
                            <p className="mt-2 text-xs text-slate-400">최근 7일간 승인과 무시 처리의 비율</p>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="flex flex-wrap gap-2 text-[11px]">
                            <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                                generated {searchLearningTerminalMetrics.recentGenerated}
                            </span>
                            <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                reviewed {searchLearningTerminalMetrics.recentReviewed}
                            </span>
                            <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                                approved {searchLearningTerminalMetrics.recentApproved}
                            </span>
                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                                health score {searchLearningTerminalMetrics.healthScore}
                            </span>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-7">
                            {searchLearningTerminalMetrics.trend.map((point) => {
                                const total = point.seeded + point.generated + point.reviewed;
                                const relativeHeight = total > 0
                                    ? Math.max(18, Math.round((total / searchLearningTerminalMetricsMaxDailyTotal) * 100))
                                    : 8;

                                return (
                                    <div key={point.day} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3">
                                        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
                                            {point.day.slice(5)}
                                        </p>
                                        <div className="mt-3 flex h-24 items-end">
                                            <div
                                                className="w-full rounded-2xl border border-cyan-500/30 bg-cyan-500/10"
                                                style={{ height: `${relativeHeight}%` }}
                                            />
                                        </div>
                                        <p className="mt-3 text-xl font-black text-white">{total}</p>
                                        <div className="mt-2 space-y-1 text-[10px] text-slate-400">
                                            <p>seed {point.seeded}</p>
                                            <p>gen {point.generated}</p>
                                            <p>review {point.reviewed}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Coverage</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal surface에서 실제 검색 품질 상태를 보는 요약입니다. curated coverage와 semantic cluster impact를 같이 봐서 지금 품질 병목이 데이터 부족인지, coverage gap인지, retrain 이슈인지 바로 판단합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            score {searchLearningTerminalCoverage.coverageScore}
                        </span>
                        <span className={`rounded-full border px-3 py-1 ${terminalCoverageClass(searchLearningTerminalCoverage.qualityLabel)}`}>
                            {searchLearningTerminalCoverage.qualityLabel}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Coverage Score</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalCoverage.coverageScore}</p>
                        <p className="mt-2 text-xs text-slate-400">coverage + impact를 합친 terminal 품질 점수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Uncovered Queries</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningTerminalCoverage.uncoveredQueries}</p>
                        <p className="mt-2 text-xs text-slate-400">curated 평가셋에서 아직 비는 query 수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Uncovered Clusters</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningTerminalCoverage.uncoveredClusters}</p>
                        <p className="mt-2 text-xs text-slate-400">semantic cluster 단위의 coverage 공백</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Improved Clusters</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalCoverage.improvedClusters}</p>
                        <p className="mt-2 text-xs text-slate-400">impact 기준 개선 확인된 cluster 수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Needs Tuning</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningTerminalCoverage.needsAttentionClusters}</p>
                        <p className="mt-2 text-xs text-slate-400">여전히 retrain/조정이 필요한 cluster 수</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {searchLearningTerminalCoverage.focusAreas.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(item.tone)}`}>
                                        {item.label}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {item.count}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-violet-500/20 bg-violet-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Trends</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            최근 7일 메트릭을 `pace / backlog / approval quality` 관점으로 다시 압축한 섹션입니다. 오늘 어떤 lane를 먼저 밀어야 하는지 terminal surface에서 바로 판단할 수 있게 합니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-violet-100">
                            pace {searchLearningTerminalTrends.paceLabel}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            backlog {searchLearningTerminalTrends.backlogLabel}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            approval {searchLearningTerminalTrends.approvalLabel}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {searchLearningTerminalTrends.focusAreas.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(item.tone)}`}>
                                        {item.label}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {item.count}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.summary}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Watchlist</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            지금 바로 처리할 query를 `ops center + impact + workflow`에서 추려서 보여주는 terminal triage 목록입니다. health와 trend를 본 뒤 실제 액션은 여기서 바로 시작하면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            critical {searchLearningTerminalWatchlist.critical}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            high {searchLearningTerminalWatchlist.high}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            medium {searchLearningTerminalWatchlist.medium}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            total {searchLearningTerminalWatchlist.total}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {searchLearningTerminalWatchlist.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalPriorityClass(item.priority)}`}>
                                        {item.priority}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {item.metricLabel}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.queries.length > 0 ? item.queries.map((query) => (
                                    <span
                                        key={`${item.id}:${query}`}
                                        className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-200"
                                    >
                                        {query}
                                    </span>
                                )) : (
                                    <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-2 text-[11px] text-slate-300">
                                        query 묶음 {item.count}건
                                    </span>
                                )}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunTerminalAction(item.action)}
                                    className="rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-100"
                                >
                                    {item.action.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(item.entryIds, `${item.title} query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {searchLearningTerminalWatchlist.items.length === 0 && (
                    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                        terminal watchlist에 올릴 즉시 처리 query가 없습니다.
                    </div>
                )}
            </section>

            <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Checklist</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal workflow에서 지금 남아 있는 운영 항목을 `done / open / active`로 바로 보는 체크리스트입니다. health가 나빠 보일 때 어떤 항목이 실제로 남았는지 여기서 확인하면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            done {searchLearningTerminalChecklist.completed}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            open {searchLearningTerminalChecklist.open}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            active {searchLearningTerminalChecklist.active}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {searchLearningTerminalChecklist.items.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalChecklistClass(item.status)}`}>
                                        {item.status}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {item.count}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Alerts</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            terminal workflow에서 지금 가장 긴급한 병목을 severity 기준으로 압축한 경보 레이어입니다. review backlog, draft backlog, retrain, sample collection을 먼저 봅니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            critical {searchLearningTerminalAlerts.critical}
                        </span>
                        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-100">
                            warning {searchLearningTerminalAlerts.warning}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            info {searchLearningTerminalAlerts.info}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            success {searchLearningTerminalAlerts.success}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {searchLearningTerminalAlerts.topAlerts.map((alert) => (
                        <div key={alert.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalPriorityClass(alert.severity)}`}>
                                        {alert.severity}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{alert.title}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {alert.count}
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{alert.description}</p>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {alert.action ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => void onRunTerminalAction(alert.action)}
                                            className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100"
                                        >
                                            {alert.action.actionLabel}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onSelectEntries(alert.action.entryIds || [], `${alert.title} query를 선택했습니다.`)}
                                            className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                        >
                                            queue 선택
                                        </button>
                                    </>
                                ) : (
                                    <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-2 text-xs font-bold text-slate-300">
                                        추가 액션 없음
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Runbook</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            지금 운영자가 가장 먼저 해야 할 action과, 그 다음 확인 순서를 세 단계로 압축한 runbook입니다. 깊은 chain을 다시 따라가기 전에 여기서 바로 시작하면 됩니다.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            {searchLearningTerminalRunbook.stateLabel}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            pending {searchLearningTerminalWorkflow.pending}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            drafts {searchLearningTerminalWorkflow.drafts}
                        </span>
                    </div>
                </div>
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/70 p-5">
                    <p className="text-lg font-bold text-white">{searchLearningTerminalRunbook.headline}</p>
                    <p className="mt-2 text-sm leading-7 text-slate-300">{searchLearningTerminalRunbook.summary}</p>
                    <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-xs text-slate-300">
                        {searchLearningTerminalRunbook.followUp}
                    </p>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {searchLearningTerminalRunbook.steps.map((step) => (
                        <div key={step.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(step.tone)}`}>
                                {step.tone}
                            </span>
                            <p className="mt-3 text-sm font-semibold text-white">{step.title}</p>
                            <p className="mt-2 text-xs leading-6 text-slate-400">{step.description}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {searchLearningTerminalRunbook.primaryAction ? (
                        <>
                            <button
                                type="button"
                                onClick={() => void onRunTerminalAction(searchLearningTerminalRunbook.primaryAction)}
                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-100"
                            >
                                {searchLearningTerminalRunbook.primaryAction.actionLabel}
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    onSelectEntries(
                                        searchLearningTerminalRunbook.primaryAction.entryIds || [],
                                        `${searchLearningTerminalRunbook.primaryAction.title || 'Terminal Runbook'} query를 선택했습니다.`
                                    )
                                }
                                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-bold text-slate-200"
                            >
                                queue 선택
                            </button>
                        </>
                    ) : (
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-4 py-2 text-xs font-bold text-slate-300">
                            추가 액션 없음
                        </span>
                    )}
                </div>
            </section>

            <section className="mt-8 rounded-3xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Search Learning Terminal Command Center</h2>
                        <p className="mt-2 text-sm text-slate-300">
                            `/admin`에서 실제로 먼저 처리할 search-learning 액션만 묶은 terminal 요약입니다. draft review, review pending, AI 생성, 재학습, 표본 수집을 여기서 바로 시작하고, 깊은 chain은 필요할 때만 펼치세요.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-100">
                            state {searchLearningTerminalWorkflow.state}
                        </span>
                        <span className="rounded-full border border-slate-700 bg-slate-950/70 px-3 py-1 text-slate-200">
                            pending {searchLearningTerminalWorkflow.pending}
                        </span>
                        <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-100">
                            drafts {searchLearningTerminalWorkflow.drafts}
                        </span>
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                            improved {searchLearningTerminalWorkflow.improved}
                        </span>
                        <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                            tuning {searchLearningTerminalWorkflow.noImprovement}
                        </span>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Draft Review</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningTerminalWorkflow.drafts}</p>
                        <p className="mt-1 text-xs text-sky-100/70">AI draft가 이미 붙은 pending query</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Review Now</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningTerminalWorkflow.reviewNow}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">즉시 승인 가능한 query</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Generate Now</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningTerminalWorkflow.generateNow}</p>
                        <p className="mt-1 text-xs text-sky-100/70">AI suggestion이 필요한 query</p>
                    </div>
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningTerminalWorkflow.retrainNow}</p>
                        <p className="mt-1 text-xs text-rose-100/70">승인 후에도 개선이 부족한 query</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningTerminalWorkflow.sampleCollection}</p>
                        <p className="mt-1 text-xs text-amber-100/70">추가 관찰이 필요한 query</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningTerminalWorkflow.topActions.map((action) => (
                        <div key={action.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${terminalToneClass(action.tone)}`}>
                                        {action.kind}
                                    </span>
                                    <p className="mt-3 text-sm font-semibold text-white">{action.title}</p>
                                    <p className="mt-1 text-xs text-slate-400">{action.description}</p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {action.count} queries
                                </span>
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunTerminalAction(action)}
                                    className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-bold text-cyan-100"
                                >
                                    {action.actionLabel}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onSelectEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`)}
                                    className="rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                >
                                    queue 선택
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningTerminalWorkflow.topActions.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            지금은 terminal workflow에서 즉시 처리할 항목이 없습니다. 실제 검색을 더 쌓거나 `Search Learning Queue`에서 새 draft를 생성하면 여기서 다시 triage할 수 있습니다.
                        </div>
                    )}
                </div>
            </section>
        </>
    );
}
