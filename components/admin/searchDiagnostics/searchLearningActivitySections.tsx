import {
    formatTime,
    searchLearningActivityClass,
    searchLearningActivityLabel,
} from './helpers';
import {
    buildSearchLearningWorkbench,
    type SearchLearningActivityOpsQueueItem,
} from './searchLearningWorkbench';
import type { SearchLearningActivityEvent } from './types';

type SearchLearningWorkbench = ReturnType<typeof buildSearchLearningWorkbench>;

type ActivityFollowupItem =
    | SearchLearningWorkbench['searchLearningActivityFollowups']['topRetrainNeeded'][number]
    | SearchLearningWorkbench['searchLearningActivityFollowups']['topAwaitingSamples'][number]
    | SearchLearningWorkbench['searchLearningActivityFollowups']['topValidated'][number];

type SearchLearningActivitySectionsProps = Pick<
    SearchLearningWorkbench,
    | 'searchLearningActivitySummary'
    | 'searchLearningActivityRecommendations'
    | 'searchLearningActivityOpsQueue'
    | 'searchLearningActivityFollowups'
> & {
    processingSearchLearningId: string | null;
    searchLearningActivity: SearchLearningActivityEvent[];
    storageLabel: string;
    onRunActivityFollowup: (item: ActivityFollowupItem) => Promise<void> | void;
    onRunActivityOpsQueueItem: (item: SearchLearningActivityOpsQueueItem) => Promise<void> | void;
    onSelectEntries: (entryIds: string[], message: string) => void;
};

function activityPriorityClass(priority: string) {
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

export function SearchLearningActivitySections({
    processingSearchLearningId,
    searchLearningActivity,
    searchLearningActivitySummary,
    searchLearningActivityRecommendations,
    searchLearningActivityOpsQueue,
    searchLearningActivityFollowups,
    storageLabel,
    onRunActivityFollowup,
    onRunActivityOpsQueueItem,
    onSelectEntries,
}: SearchLearningActivitySectionsProps) {
    return (
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Search Learning Activity</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        queue 추가, AI 제안 생성, 승인/보류 같은 운영 액션이 최근 순서대로 기록됩니다.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                        storage {storageLabel}
                    </span>
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-cyan-200">
                        events {searchLearningActivity.length}
                    </span>
                </div>
            </div>
            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningActivitySummary.topGeneratedContexts.flatMap((entry) => entry.entryIds),
                            `${searchLearningActivitySummary.topGeneratedContexts.length}개의 생성 activity context query를 선택했습니다.`
                        )}
                        disabled={searchLearningActivitySummary.topGeneratedContexts.length === 0}
                        className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        생성 activity 선택 ({searchLearningActivitySummary.topGeneratedContexts.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningActivitySummary.topReviewContexts.flatMap((entry) => entry.entryIds),
                            `${searchLearningActivitySummary.topReviewContexts.length}개의 review activity context query를 선택했습니다.`
                        )}
                        disabled={searchLearningActivitySummary.topReviewContexts.length === 0}
                        className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        review activity 선택 ({searchLearningActivitySummary.topReviewContexts.length})
                    </button>
                    <button
                        type="button"
                        onClick={() => onSelectEntries(
                            searchLearningActivitySummary.topQueries.flatMap((entry) => entry.entryIds),
                            `${searchLearningActivitySummary.topQueries.length}개의 반복 query activity를 선택했습니다.`
                        )}
                        disabled={searchLearningActivitySummary.topQueries.length === 0}
                        className="rounded-full border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-bold text-violet-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        반복 query 선택 ({searchLearningActivitySummary.topQueries.length})
                    </button>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3 xl:grid-cols-6">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Generated</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningActivitySummary.generated}</p>
                        <p className="mt-1 text-xs text-slate-400">AI 제안 생성 수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Seeded</p>
                        <p className="mt-3 text-3xl font-black text-cyan-300">{searchLearningActivitySummary.seeded}</p>
                        <p className="mt-1 text-xs text-slate-400">coverage/queue seed 수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Reviewed</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningActivitySummary.reviewed}</p>
                        <p className="mt-1 text-xs text-slate-400">review 처리 수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Approved</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningActivitySummary.approvedReviews}</p>
                        <p className="mt-1 text-xs text-slate-400">승인된 review 수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Ignored</p>
                        <p className="mt-3 text-3xl font-black text-slate-200">{searchLearningActivitySummary.ignoredReviews}</p>
                        <p className="mt-1 text-xs text-slate-400">보류된 review 수</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Actors</p>
                        <p className="mt-3 text-3xl font-black text-violet-300">{searchLearningActivitySummary.uniqueActors}</p>
                        <p className="mt-1 text-xs text-slate-400">활동 admin 수</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-white">Top Activity Contexts</h3>
                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                top {searchLearningActivitySummary.topContexts.length}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {searchLearningActivitySummary.topContexts.map((entry) => (
                                <div key={entry.context} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{entry.context}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {formatTime(entry.lastSeenAt)} · {entry.types.join(', ')}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                            {entry.count}건
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {entry.queries.slice(0, 4).map((query) => (
                                            <span key={`${entry.context}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                {query}
                                            </span>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(entry.entryIds, `${entry.context} context의 ${entry.entryIds.length}개 query를 선택했습니다.`)}
                                        className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        context query 선택
                                    </button>
                                </div>
                            ))}
                            {searchLearningActivitySummary.topContexts.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                    아직 activity context가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-sm font-semibold text-white">Repeated Activity Queries</h3>
                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                top {searchLearningActivitySummary.topQueries.length}
                            </span>
                        </div>
                        <div className="mt-4 space-y-3">
                            {searchLearningActivitySummary.topQueries.map((entry) => (
                                <div key={entry.query} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-white">{entry.query}</p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {formatTime(entry.lastSeenAt)} · {entry.types.join(', ')}
                                            </p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                            {entry.count}회
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => onSelectEntries(entry.entryIds, `${entry.query} activity의 ${entry.entryIds.length}개 query를 선택했습니다.`)}
                                        className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                    >
                                        반복 query 선택
                                    </button>
                                </div>
                            ))}
                            {searchLearningActivitySummary.topQueries.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                    아직 반복 activity query가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Activity Recommendations</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            최근 activity를 기준으로 바로 처리할 review, AI 생성, 표본 수집 대상을 추천합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        actionable {searchLearningActivityRecommendations.reviewPending + searchLearningActivityRecommendations.generateNeeded + searchLearningActivityRecommendations.awaitingSamples}
                    </span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Review Pending</p>
                        <p className="mt-3 text-3xl font-black text-emerald-300">{searchLearningActivityRecommendations.reviewPending}</p>
                        <p className="mt-1 text-xs text-slate-400">draft review가 남은 activity</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Generate Needed</p>
                        <p className="mt-3 text-3xl font-black text-sky-300">{searchLearningActivityRecommendations.generateNeeded}</p>
                        <p className="mt-1 text-xs text-slate-400">AI suggestion이 아직 없는 seed activity</p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Awaiting Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-300">{searchLearningActivityRecommendations.awaitingSamples}</p>
                        <p className="mt-1 text-xs text-slate-400">승인 후 실제 검색 표본이 더 필요한 activity</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {[
                        {
                            title: 'Review Pending',
                            entries: searchLearningActivityRecommendations.topReviewPending,
                            empty: '아직 review pending activity가 없습니다.',
                            buttonLabel: 'review query 선택',
                        },
                        {
                            title: 'Generate Needed',
                            entries: searchLearningActivityRecommendations.topGenerateNeeded,
                            empty: '아직 generate needed activity가 없습니다.',
                            buttonLabel: 'AI 생성 대상 선택',
                        },
                        {
                            title: 'Awaiting Samples',
                            entries: searchLearningActivityRecommendations.topAwaitingSamples,
                            empty: '아직 awaiting samples activity가 없습니다.',
                            buttonLabel: '표본 수집 대상 선택',
                        },
                    ].map((group) => (
                        <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                    top {group.entries.length}
                                </span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {group.entries.map((entry) => (
                                    <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{entry.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatTime(entry.lastSeenAt)}
                                                    {entry.context ? ` · ${entry.context}` : ''}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                {entry.count}건
                                            </span>
                                        </div>
                                        <p className="mt-3 text-xs leading-6 text-slate-400">{entry.description}</p>
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {entry.queries.slice(0, 4).map((query) => (
                                                <span key={`${entry.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                                    {query}
                                                </span>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onSelectEntries(entry.entryIds, `${entry.title}의 ${entry.entryIds.length}개 query를 선택했습니다.`)}
                                            className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                                        >
                                            {group.buttonLabel}
                                        </button>
                                    </div>
                                ))}
                                {group.entries.length === 0 && (
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                        {group.empty}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Activity Ops Queue</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            최근 activity 추천을 긴급도 기준으로 다시 정렬해, 바로 생성·승인·표본 수집 액션으로 연결합니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        top {searchLearningActivityOpsQueue.topItems.length}
                    </span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Critical</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningActivityOpsQueue.critical}</p>
                        <p className="mt-1 text-xs text-rose-100/70">즉시 처리 권장</p>
                    </div>
                    <div className="rounded-2xl border border-orange-500/30 bg-orange-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-200">High</p>
                        <p className="mt-3 text-3xl font-black text-orange-100">{searchLearningActivityOpsQueue.high}</p>
                        <p className="mt-1 text-xs text-orange-100/70">반복 실패/반복 생성 대상</p>
                    </div>
                    <div className="rounded-2xl border border-sky-500/30 bg-sky-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-200">Medium</p>
                        <p className="mt-3 text-3xl font-black text-sky-100">{searchLearningActivityOpsQueue.medium}</p>
                        <p className="mt-1 text-xs text-sky-100/70">추가 triage 필요</p>
                    </div>
                    <div className="rounded-2xl border border-slate-700 bg-slate-950/70 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Low</p>
                        <p className="mt-3 text-3xl font-black text-slate-100">{searchLearningActivityOpsQueue.low}</p>
                        <p className="mt-1 text-xs text-slate-500">관찰 위주</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningActivityOpsQueue.topItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${activityPriorityClass(item.priority)}`}>
                                            {item.priority}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                            score {item.urgencyScore}
                                        </span>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {item.action}
                                        </span>
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {formatTime(item.lastSeenAt)}
                                        {item.context ? ` · ${item.context}` : ''}
                                    </p>
                                </div>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                    {item.count}건
                                </span>
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1">
                                    repeated {item.repeatedQueryCount}
                                </span>
                                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1">
                                    zero-result {item.zeroResultCount}
                                </span>
                                <span className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1">
                                    low-fit {item.lowFitCount}
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {item.queries.slice(0, 5).map((query) => (
                                    <span key={`${item.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunActivityOpsQueueItem(item)}
                                    disabled={processingSearchLearningId === `activity_ops_review_${item.id}` || processingSearchLearningId === `activity_ops_generate_${item.id}`}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
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
                    {searchLearningActivityOpsQueue.topItems.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 activity ops queue가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <h3 className="text-sm font-semibold text-white">Activity Outcome Follow-up</h3>
                        <p className="mt-1 text-xs text-slate-500">
                            승인된 activity가 실제 검색 개선으로 이어졌는지 보고, 재학습 또는 추가 표본 수집으로 바로 이어집니다.
                        </p>
                    </div>
                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                        tracked {searchLearningActivityFollowups.retrainNeeded + searchLearningActivityFollowups.awaitingSamples + searchLearningActivityFollowups.validated}
                    </span>
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-rose-200">Retrain Needed</p>
                        <p className="mt-3 text-3xl font-black text-rose-100">{searchLearningActivityFollowups.retrainNeeded}</p>
                        <p className="mt-1 text-xs text-rose-100/70">재학습 또는 rewrite 조정 필요</p>
                    </div>
                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-200">Awaiting Samples</p>
                        <p className="mt-3 text-3xl font-black text-amber-100">{searchLearningActivityFollowups.awaitingSamples}</p>
                        <p className="mt-1 text-xs text-amber-100/70">추가 검색 표본 관찰 필요</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Validated</p>
                        <p className="mt-3 text-3xl font-black text-emerald-100">{searchLearningActivityFollowups.validated}</p>
                        <p className="mt-1 text-xs text-emerald-100/70">개선 확인 또는 안정 상태</p>
                    </div>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-3">
                    {[
                        {
                            title: 'Retrain Needed',
                            entries: searchLearningActivityFollowups.topRetrainNeeded,
                            empty: '아직 재학습이 필요한 activity가 없습니다.',
                            actionLabel: '재학습 AI 제안',
                        },
                        {
                            title: 'Awaiting Samples',
                            entries: searchLearningActivityFollowups.topAwaitingSamples,
                            empty: '아직 표본 대기 activity가 없습니다.',
                            actionLabel: '표본 수집 대상 선택',
                        },
                        {
                            title: 'Validated',
                            entries: searchLearningActivityFollowups.topValidated,
                            empty: '아직 개선 확인 activity가 없습니다.',
                            actionLabel: '개선 query 선택',
                        },
                    ].map((group) => (
                        <div key={group.title} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <h3 className="text-sm font-semibold text-white">{group.title}</h3>
                                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                    top {group.entries.length}
                                </span>
                            </div>
                            <div className="mt-4 space-y-3">
                                {group.entries.map((item) => (
                                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{item.title}</p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {formatTime(item.lastSeenAt)}
                                                    {item.context ? ` · ${item.context}` : ''}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
                                                {item.reviewedCount}건
                                            </span>
                                        </div>
                                        <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                                                improved {item.improvedCount}
                                            </span>
                                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                                                no-improvement {item.noImprovementCount}
                                            </span>
                                            <span className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1">
                                                awaiting {item.awaitingSamplesCount}
                                            </span>
                                        </div>
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
                                                onClick={() => void onRunActivityFollowup(item)}
                                                className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100"
                                            >
                                                {group.actionLabel}
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
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-500">
                                        {group.empty}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {searchLearningActivity.slice(0, 8).map((event) => (
                    <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-white">{searchLearningActivityLabel(event)}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {formatTime(event.createdAt)}
                                    {event.context ? ` · ${event.context}` : ''}
                                    {event.actorUid ? ` · ${event.actorUid.slice(0, 8)}` : ''}
                                </p>
                            </div>
                            <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${searchLearningActivityClass(event)}`}>
                                {event.count}건
                            </span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {event.queries.slice(0, 4).map((query) => (
                                <span key={`${event.id}_${query}`} className="rounded-full border border-slate-700 bg-slate-950/70 px-2 py-1 text-[11px] text-slate-200">
                                    {query}
                                </span>
                            ))}
                        </div>
                        {event.entryIds.length > 0 && (
                            <button
                                type="button"
                                onClick={() => onSelectEntries(
                                    event.entryIds,
                                    `${searchLearningActivityLabel(event)} activity의 ${event.entryIds.length}개 query를 선택했습니다.`
                                )}
                                className="mt-4 rounded-full border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
                            >
                                activity query 선택
                            </button>
                        )}
                    </div>
                ))}
                {searchLearningActivity.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500 xl:col-span-2">
                        아직 search learning activity가 없습니다.
                    </div>
                )}
            </div>
        </section>
    );
}
