import { formatTime } from './helpers';
import {
    buildSearchLearningWorkbench,
    type SearchLearningOpsCompletionAction,
    type SearchLearningOpsCompletionQueueItem,
    type SearchLearningOpsCompletionRecommendation,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendation,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation,
    type SearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem,
    type SearchLearningOpsCompletionRecommendationQueueItem,
    type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
} from './searchLearningWorkbench';
import { SearchLearningCompletionAdvancedSections } from './searchLearningCompletionAdvancedSections';
import { SearchLearningCompletionOutcomeRecommendationSections } from './searchLearningCompletionOutcomeRecommendationSections';
import { SearchLearningCompletionRecommendationSections } from './searchLearningCompletionRecommendationSections';
import { SearchLearningCompletionSections } from './searchLearningCompletionSections';
import { SearchLearningCompletionTerminalSections } from './searchLearningCompletionTerminalSections';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type SearchLearningCompletionChainSectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningOpsCompletionSummary'
    | 'searchLearningOpsCompletionActions'
    | 'searchLearningOpsCompletionQueue'
    | 'searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
    | 'searchLearningOpsCompletionActivity'
    | 'searchLearningOpsCompletionOutcomes'
    | 'searchLearningOpsCompletionRecommendations'
    | 'searchLearningOpsCompletionRecommendationQueue'
    | 'searchLearningOpsCompletionRecommendationActivity'
    | 'searchLearningOpsCompletionRecommendationOutcomes'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes'
    | 'searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations'
> & {
    showAdvancedSearchLearningChain: boolean;
    onToggleAdvancedChain: () => void;
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunCompletionAction: (action: SearchLearningOpsCompletionAction) => Promise<void> | void;
    onRunCompletionQueueItem: (item: SearchLearningOpsCompletionQueueItem) => Promise<void> | void;
    onRunSummaryRecommendation: (
        recommendation: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation
    ) => Promise<void> | void;
    onRunCompletionRecommendation: (
        recommendation: SearchLearningOpsCompletionRecommendation
    ) => Promise<void> | void;
    onRunCompletionRecommendationQueueItem: (
        item: SearchLearningOpsCompletionRecommendationQueueItem
    ) => Promise<void> | void;
    onRunOutcomeRecommendation: (
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation
    ) => Promise<void> | void;
    onRunDeepQueueItem: (
        item: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem
    ) => Promise<void> | void;
    onRunDeepRecommendation: (
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation
    ) => Promise<void> | void;
    onRunTerminalQueueItem: (
        item: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem
    ) => Promise<void> | void;
    onRunTerminalRecommendation: (
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation
    ) => Promise<void> | void;
    onRunRecommendationOutcomeRecommendation: (
        recommendation: SearchLearningOpsCompletionRecommendationOutcomeRecommendation
    ) => Promise<void> | void;
    onRunRecommendationQueueItem: (
        item: SearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem
    ) => Promise<void> | void;
};

function recommendationOutcomeActivityClass(action: string) {
    return action === 'review_now'
        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100'
        : 'border-rose-500/30 bg-rose-500/10 text-rose-100';
}

export function SearchLearningCompletionChainSections({
    searchLearningOpsCompletionSummary,
    searchLearningOpsCompletionActions,
    searchLearningOpsCompletionQueue,
    searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    searchLearningOpsCompletionActivity,
    searchLearningOpsCompletionOutcomes,
    searchLearningOpsCompletionRecommendations,
    searchLearningOpsCompletionRecommendationQueue,
    searchLearningOpsCompletionRecommendationActivity,
    searchLearningOpsCompletionRecommendationOutcomes,
    searchLearningOpsCompletionRecommendationOutcomeRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
    showAdvancedSearchLearningChain,
    onToggleAdvancedChain,
    onSelectEntries,
    onRunCompletionAction,
    onRunCompletionQueueItem,
    onRunSummaryRecommendation,
    onRunCompletionRecommendation,
    onRunCompletionRecommendationQueueItem,
    onRunOutcomeRecommendation,
    onRunDeepQueueItem,
    onRunDeepRecommendation,
    onRunTerminalQueueItem,
    onRunTerminalRecommendation,
    onRunRecommendationOutcomeRecommendation,
    onRunRecommendationQueueItem,
}: SearchLearningCompletionChainSectionsProps) {
    return (
        <>
            <SearchLearningCompletionSections
                searchLearningOpsCompletionSummary={searchLearningOpsCompletionSummary}
                searchLearningOpsCompletionActions={searchLearningOpsCompletionActions}
                searchLearningOpsCompletionQueue={searchLearningOpsCompletionQueue}
                searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations={searchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations}
                showAdvancedSearchLearningChain={showAdvancedSearchLearningChain}
                onToggleAdvancedChain={onToggleAdvancedChain}
                onSelectEntries={onSelectEntries}
                onRunCompletionAction={onRunCompletionAction}
                onRunCompletionQueueItem={onRunCompletionQueueItem}
                onRunSummaryRecommendation={onRunSummaryRecommendation}
            />

            {showAdvancedSearchLearningChain && (
                <>
                    <SearchLearningCompletionAdvancedSections
                        searchLearningOpsCompletionActivity={searchLearningOpsCompletionActivity}
                        searchLearningOpsCompletionOutcomes={searchLearningOpsCompletionOutcomes}
                        searchLearningOpsCompletionRecommendations={searchLearningOpsCompletionRecommendations}
                        searchLearningOpsCompletionRecommendationQueue={searchLearningOpsCompletionRecommendationQueue}
                        onSelectEntries={onSelectEntries}
                        onRunCompletionRecommendation={onRunCompletionRecommendation}
                        onRunCompletionRecommendationQueueItem={onRunCompletionRecommendationQueueItem}
                    />

                    <section className="mt-8 rounded-3xl border border-fuchsia-500/20 bg-fuchsia-500/5 p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-white">Search Learning Ops Completion Recommendation Outcome Recommendation Activity</h2>
                                <p className="mt-2 text-sm text-slate-300">
                                    completion recommendation outcome recommendation queue에서 실제로 실행된 review/retrain 이력을 모읍니다. 최근 실행 query를 다시 queue로 넘겨 후속 triage로 이어갈 수 있습니다.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                                <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                                    total {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.totalRuns}
                                </span>
                                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-100">
                                    review {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.reviewRuns}
                                </span>
                                <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-100">
                                    retrain {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.retrainRuns}
                                </span>
                                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-slate-300">
                                    queries {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.uniqueQueries}
                                </span>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Total Runs</p>
                                <p className="mt-3 text-3xl font-black text-white">
                                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.totalRuns}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Runs</p>
                                <p className="mt-3 text-3xl font-black text-emerald-100">
                                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.reviewRuns}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Retrain Runs</p>
                                <p className="mt-3 text-3xl font-black text-rose-100">
                                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.retrainRuns}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Unique Queries</p>
                                <p className="mt-3 text-3xl font-black text-slate-100">
                                    {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.uniqueQueries}
                                </p>
                            </div>
                        </div>
                        <div className="mt-4 grid gap-4 xl:grid-cols-2">
                            {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.recentRuns.map((run) => (
                                <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${recommendationOutcomeActivityClass(run.action)}`}>
                                                    {run.action}
                                                </span>
                                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                    {run.priority}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                {formatTime(run.createdAt)}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                            {run.count} actions
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
                                            onClick={() => onSelectEntries(run.entryIds, `${run.title} activity query를 선택했습니다.`)}
                                            className="rounded-full border border-fuchsia-500/40 bg-fuchsia-500/10 px-3 py-2 text-xs font-bold text-fuchsia-100"
                                        >
                                            queue 선택
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {searchLearningOpsCompletionRecommendationOutcomeRecommendationActivity.totalRuns === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                                    아직 completion recommendation outcome recommendation activity가 없습니다. `Completion Recommendation Outcome Recommendation Queue`에서 review/retrain 실행이 발생하면 여기에서 최근 이력을 볼 수 있습니다.
                                </div>
                            )}
                        </div>
                    </section>
                </>
            )}

            <SearchLearningCompletionOutcomeRecommendationSections
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomes}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueue}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationActivity}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationOutcomes}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations}
                onSelectEntries={onSelectEntries}
                onRunOutcomeRecommendation={onRunOutcomeRecommendation}
                onRunDeepQueueItem={onRunDeepQueueItem}
                onRunDeepRecommendation={onRunDeepRecommendation}
            />

            <SearchLearningCompletionTerminalSections
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueue}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationActivity}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationOutcomes}
                searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations={searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations}
                onRunTerminalQueueItem={onRunTerminalQueueItem}
                onRunTerminalRecommendation={onRunTerminalRecommendation}
                onSelectEntries={onSelectEntries}
            />

            {showAdvancedSearchLearningChain && (
                <SearchLearningCompletionRecommendationSections
                    searchLearningOpsCompletionRecommendationActivity={searchLearningOpsCompletionRecommendationActivity}
                    searchLearningOpsCompletionRecommendationOutcomes={searchLearningOpsCompletionRecommendationOutcomes}
                    searchLearningOpsCompletionRecommendationOutcomeRecommendations={searchLearningOpsCompletionRecommendationOutcomeRecommendations}
                    searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue={searchLearningOpsCompletionRecommendationOutcomeRecommendationQueue}
                    onSelectEntries={onSelectEntries}
                    onRunOutcomeRecommendation={onRunRecommendationOutcomeRecommendation}
                    onRunOutcomeRecommendationQueueItem={onRunRecommendationQueueItem}
                />
            )}
        </>
    );
}
