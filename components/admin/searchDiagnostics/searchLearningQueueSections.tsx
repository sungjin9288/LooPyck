import { buildSearchLearningImpact } from '@/lib/search/searchLearningImpact';
import {
    formatPercent,
    formatTime,
    searchLearningStatusClass,
    searchLearningStatusLabel,
} from './helpers';
import type { SearchLearningEntry } from './types';

type SearchLearningQueueSummary = {
    total: number;
    pending: number;
    approved: number;
    zeroResult: number;
};

type SearchLearningQueueSectionsProps = {
    processingSearchLearningId: string | null;
    searchLearningDraftEntries: SearchLearningEntry[];
    searchLearningEntries: SearchLearningEntry[];
    searchLearningMessage: string | null;
    searchLearningSummary: SearchLearningQueueSummary | null | undefined;
    selectedSearchLearningIds: string[];
    onBulkGenerateSuggestions: () => Promise<void> | void;
    onBulkReview: (action: 'bulk_approve' | 'bulk_ignore') => Promise<void> | void;
    onClearSelection: () => void;
    onGenerateSuggestion: (entryId: string) => Promise<void> | void;
    onReviewEntry: (entry: SearchLearningEntry, action: 'approve' | 'ignore') => Promise<void> | void;
    onSelectDraftEntries: () => void;
    onSelectEntries: (entryIds: string[], message: string) => void;
    onSelectPendingEntries: () => void;
    onToggleSelection: (entryId: string) => void;
};

export function SearchLearningQueueSections({
    processingSearchLearningId,
    searchLearningDraftEntries,
    searchLearningEntries,
    searchLearningMessage,
    searchLearningSummary,
    selectedSearchLearningIds,
    onBulkGenerateSuggestions,
    onBulkReview,
    onClearSelection,
    onGenerateSuggestion,
    onReviewEntry,
    onSelectDraftEntries,
    onSelectEntries,
    onSelectPendingEntries,
    onToggleSelection,
}: SearchLearningQueueSectionsProps) {
    return (
        <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                    <h2 className="text-lg font-bold text-white">Search Learning Queue</h2>
                    <p className="mt-2 text-sm text-slate-400">
                        low-fit 또는 0건 검색어를 저장하고, AI 제안 후 승인된 검색어를 다음 검색부터 확장어로 사용합니다.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-slate-300">
                        total {searchLearningSummary?.total ?? 0}
                    </span>
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-amber-200">
                        pending {searchLearningSummary?.pending ?? 0}
                    </span>
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-emerald-200">
                        approved {searchLearningSummary?.approved ?? 0}
                    </span>
                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-sky-200">
                        drafts {searchLearningDraftEntries.length}
                    </span>
                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-rose-200">
                        zero-result {searchLearningSummary?.zeroResult ?? 0}
                    </span>
                </div>
            </div>

            {searchLearningMessage && (
                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-200">
                    {searchLearningMessage}
                </div>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
                <button
                    type="button"
                    onClick={onSelectPendingEntries}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-200"
                >
                    pending 전체 선택
                </button>
                <button
                    type="button"
                    onClick={onSelectDraftEntries}
                    disabled={searchLearningDraftEntries.length === 0}
                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    draft 전체 선택 ({searchLearningDraftEntries.length})
                </button>
                <button
                    type="button"
                    onClick={onClearSelection}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300"
                >
                    선택 해제
                </button>
                <button
                    type="button"
                    onClick={() => void onBulkReview('bulk_approve')}
                    disabled={selectedSearchLearningIds.length === 0 || processingSearchLearningId === 'bulk_approve'}
                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingSearchLearningId === 'bulk_approve' ? '승인 중...' : `선택 승인 (${selectedSearchLearningIds.length})`}
                </button>
                <button
                    type="button"
                    onClick={() => void onBulkGenerateSuggestions()}
                    disabled={selectedSearchLearningIds.length === 0 || processingSearchLearningId === 'bulk_generate'}
                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingSearchLearningId === 'bulk_generate' ? '생성 중...' : `선택 AI 제안 (${selectedSearchLearningIds.length})`}
                </button>
                <button
                    type="button"
                    onClick={() => void onBulkReview('bulk_ignore')}
                    disabled={selectedSearchLearningIds.length === 0 || processingSearchLearningId === 'bulk_ignore'}
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processingSearchLearningId === 'bulk_ignore' ? '보류 중...' : `선택 보류 (${selectedSearchLearningIds.length})`}
                </button>
            </div>

            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-white">Draft Review Queue</h3>
                    <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-200">
                        top {Math.min(searchLearningDraftEntries.length, 6)}
                    </span>
                </div>
                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                    {searchLearningDraftEntries.slice(0, 6).map((entry) => (
                        <div key={`draft_${entry.id}`} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <label className="mt-0.5 flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedSearchLearningIds.includes(entry.id)}
                                            onChange={() => onToggleSelection(entry.id)}
                                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400 focus:ring-sky-400"
                                        />
                                    </label>
                                    <div>
                                        <p className="text-sm font-semibold text-white">{entry.query}</p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            fit {entry.lastResultQuality || '-'} · products {entry.lastTotalProducts} · seen {formatTime(entry.lastSeenAt)}
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[10px] font-bold text-sky-200">
                                    draft
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {entry.aiSuggestion?.suggestedQueries.map((query) => (
                                    <span key={`draft_${entry.id}_${query}`} className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                                        {query}
                                    </span>
                                ))}
                            </div>
                            {entry.aiSuggestion?.rationale && (
                                <p className="mt-3 text-xs leading-6 text-slate-400">{entry.aiSuggestion.rationale}</p>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onReviewEntry(entry, 'approve')}
                                    disabled={processingSearchLearningId === entry.id}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    승인
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void onGenerateSuggestion(entry.id)}
                                    disabled={processingSearchLearningId === entry.id}
                                    className="rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-2 text-xs font-bold text-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    재생성
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void onReviewEntry(entry, 'ignore')}
                                    disabled={processingSearchLearningId === entry.id}
                                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    보류
                                </button>
                            </div>
                        </div>
                    ))}
                    {searchLearningDraftEntries.length === 0 && (
                        <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 xl:col-span-2">
                            아직 AI draft가 생성된 pending query가 없습니다.
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-2">
                {searchLearningEntries.slice(0, 8).map((entry) => {
                    const impact = buildSearchLearningImpact(entry);

                    return (
                        <div key={entry.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-3">
                                    <label className="mt-0.5 flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedSearchLearningIds.includes(entry.id)}
                                            onChange={() => onToggleSelection(entry.id)}
                                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-sky-400 focus:ring-sky-400"
                                        />
                                    </label>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.lastSeenAt)}</p>
                                        <p className="mt-1 text-sm font-semibold text-white">{entry.query}</p>
                                        <p className="mt-1 text-xs text-slate-400">
                                            normalized {entry.normalizedQuery || '-'} · fit {entry.lastResultQuality || '-'} · products {entry.lastTotalProducts}
                                        </p>
                                    </div>
                                </div>
                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${searchLearningStatusClass(entry.status)}`}>
                                    {searchLearningStatusLabel(entry.status)}
                                </span>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-300">
                                <span className="rounded-full border border-slate-800 px-2 py-1">occurrence {entry.occurrenceCount}</span>
                                <span className="rounded-full border border-slate-800 px-2 py-1">low-fit {entry.lowFitCount}</span>
                                <span className="rounded-full border border-slate-800 px-2 py-1">zero {entry.zeroResultCount}</span>
                            </div>
                            {entry.aiSuggestion && (
                                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-sky-300">
                                            AI Suggestion · {entry.aiSuggestion.model}
                                        </p>
                                        {entry.aiSuggestion.categoryHint && (
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                                                {entry.aiSuggestion.categoryHint}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-2 text-xs leading-6 text-slate-400">{entry.aiSuggestion.rationale}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {entry.aiSuggestion.suggestedQueries.map((query) => (
                                            <span key={`${entry.id}_${query}`} className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-1 text-[11px] text-sky-100">
                                                {query}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {entry.approvedQueries.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-300">Approved Queries</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {entry.approvedQueries.map((query) => (
                                            <span key={`${entry.id}_approved_${query}`} className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-[11px] text-emerald-100">
                                                {query}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {impact && (
                                <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-300">Approval Impact</p>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] text-slate-300">
                                            since {formatTime(entry.approvalBaseline?.approvedAt)}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid gap-3 md:grid-cols-3">
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">New Samples</p>
                                            <p className="mt-2 text-xl font-black text-white">{impact.postApprovalSamples}</p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Low-fit</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                {formatPercent(impact.beforeLowFitRate)} → {formatPercent(impact.afterLowFitRate)}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3">
                                            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">Zero-result</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-100">
                                                {formatPercent(impact.beforeZeroRate)} → {formatPercent(impact.afterZeroRate)}
                                            </p>
                                        </div>
                                    </div>
                                    {impact.postApprovalSamples === 0 && (
                                        <p className="mt-3 text-xs text-slate-500">승인 후 아직 새 관측 데이터가 없습니다.</p>
                                    )}
                                </div>
                            )}
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onGenerateSuggestion(entry.id)}
                                    disabled={processingSearchLearningId === entry.id}
                                    className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processingSearchLearningId === entry.id ? '생성 중...' : 'AI 제안 생성'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void onReviewEntry(entry, 'approve')}
                                    disabled={processingSearchLearningId === entry.id}
                                    className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    승인
                                </button>
                                <button
                                    type="button"
                                    onClick={() => void onReviewEntry(entry, 'ignore')}
                                    disabled={processingSearchLearningId === entry.id}
                                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    보류
                                </button>
                            </div>
                        </div>
                    );
                })}
                {searchLearningEntries.length === 0 && (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                        아직 저장된 학습 대상 query가 없습니다.
                    </div>
                )}
            </div>
        </section>
    );
}
