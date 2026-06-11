import { formatTime } from './helpers';
import type {
    OpsChainActivityBlockUi,
    OpsChainActivityRunLike,
    OpsChainBlockUi,
    OpsChainCardBadge,
    OpsChainActionBlockUi,
    OpsChainGroupData,
    OpsChainGroupHandlers,
    OpsChainGroupUi,
    OpsChainOutcomeLike,
    OpsChainOutcomesBlockUi,
    OpsChainStatCard,
    OpsChainSummaryPill,
} from './opsChainSectionTypes';

/**
 * Generic renderer for one recursive "search learning ops chain" group:
 * activity -> outcomes -> recommendations -> queue. Every chain level renders
 * the same four blocks; headings, intro copy, empty states, accents, badge
 * variants, stat cards, and action handlers differ per level. Those live in
 * opsChainSectionConfig.ts (UI) and useOpsChainActions.ts (handlers).
 */

export type {
    OpsChainActionBlockUi,
    OpsChainActivityBlockUi,
    OpsChainBlockUi,
    OpsChainCardBadge,
    OpsChainGroupData,
    OpsChainGroupHandlers,
    OpsChainGroupUi,
    OpsChainOutcomesBlockUi,
    OpsChainStatCard,
    OpsChainSummaryPill,
} from './opsChainSectionTypes';

const OUTCOME_STATUS_CLASSES: Record<string, string> = {
    ready_review: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    needs_attention: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
    awaiting_samples: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
};

const RECOMMENDATION_ACTION_CLASSES: Record<string, string> = {
    review_now: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    retrain_now: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
    collect_samples: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
};

const RECOMMENDATION_PRIORITY_CLASSES: Record<string, string> = {
    critical: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
    high: 'border-orange-500/30 bg-orange-500/10 text-orange-100',
    medium: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
};

const QUEUE_STATE_CLASSES: Record<string, string> = {
    execute_now: 'border-rose-500/30 bg-rose-500/10 text-rose-100',
    needs_review: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100',
    sample_collection: 'border-amber-500/30 bg-amber-500/10 text-amber-100',
};

const FALLBACK_BADGE_CLASS = 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100';
const DEFAULT_RERUN_BUTTON_CLASS = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-100';

function outcomeStatusClass(status: string, fallback?: string) {
    return OUTCOME_STATUS_CLASSES[status] || fallback || FALLBACK_BADGE_CLASS;
}

function recommendationActionClass(action: string, fallback?: string) {
    return RECOMMENDATION_ACTION_CLASSES[action] || fallback || FALLBACK_BADGE_CLASS;
}

function recommendationPriorityClass(priority: string) {
    return RECOMMENDATION_PRIORITY_CLASSES[priority] || 'border-sky-500/30 bg-sky-500/10 text-sky-100';
}

function recommendationQueueClass(queueState: string, ui: OpsChainActionBlockUi) {
    const classes = ui.stateClasses || QUEUE_STATE_CLASSES;
    return classes[queueState] || ui.stateFallbackClass || FALLBACK_BADGE_CLASS;
}

function badgeText(item: Record<string, unknown>, badge: OpsChainCardBadge): string {
    switch (badge.kind) {
        case 'count':
            return `${item.count} ${badge.suffix}`;
        case 'queryCount':
            return `${(item.entryIds as string[]).length} queries`;
        case 'priority':
            return String(item.priority);
        case 'actionLabel':
            return String(item.actionLabel);
        default:
            return String(item.action);
    }
}

function formatPills(pills: OpsChainSummaryPill[], data: unknown): OpsChainSummaryPill[] {
    const summary = data as Record<string, number>;
    return pills.map((pill) => ({ ...pill, label: `${pill.label} ${summary[pill.field] ?? 0}` }));
}

function SectionHeader({
    ui,
    pills,
}: {
    ui: OpsChainBlockUi;
    pills: OpsChainSummaryPill[];
    }) {
    return (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
                <h2 className="text-lg font-bold text-white">{ui.heading}</h2>
                <p className={`mt-2 text-sm ${ui.introClass || 'text-slate-300'}`}>{ui.intro}</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
                {pills.map((pill) => (
                    <span key={pill.label} className={`rounded-full border px-3 py-1 ${pill.className}`}>
                        {pill.label}
                    </span>
                ))}
            </div>
        </div>
    );
}

function StatCards({ ui, data }: { ui: OpsChainBlockUi; data: unknown }) {
    if (!ui.statCards || ui.statCards.length === 0) {
        return null;
    }

    const summary = data as Record<string, number>;

    return (
        <div className={`mt-4 grid gap-4 ${ui.statCardsGridClass || 'md:grid-cols-2 xl:grid-cols-4'}`}>
            {ui.statCards.map((card) => (
                <div key={card.label} className={`rounded-2xl border p-4 ${card.cardClass}`}>
                    <p className={`text-xs font-bold uppercase tracking-[0.16em] ${card.labelClass}`}>{card.label}</p>
                    <p className={`mt-3 text-3xl font-black ${card.valueClass}`}>{summary[card.field] ?? 0}</p>
                    {card.caption && (
                        <p className={`mt-1 text-xs ${card.captionClass || 'text-slate-500'}`}>{card.caption}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

function CornerBadge({ item, badge }: { item: Record<string, unknown>; badge?: OpsChainCardBadge | null }) {
    if (!badge) {
        return null;
    }

    return (
        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-200">
            {badgeText(item, badge)}
        </span>
    );
}

function SecondBadge({ item, badge }: { item: Record<string, unknown>; badge?: OpsChainCardBadge | null }) {
    if (!badge) {
        return null;
    }

    return (
        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
            {badgeText(item, badge)}
        </span>
    );
}

function QueryChips({ ownerId, queries }: { ownerId: string; queries: string[] }) {
    return (
        <div className="mt-3 flex flex-wrap gap-2">
            {queries.map((query) => (
                <span
                    key={`${ownerId}_${query}`}
                    className="rounded-full border border-slate-700 bg-slate-900/60 px-2 py-1 text-[11px] text-slate-200"
                >
                    {query}
                </span>
            ))}
        </div>
    );
}

function EmptyState({ text, colSpanClass }: { text: string; colSpanClass: string }) {
    return (
        <div className={`rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-500 ${colSpanClass}`}>
            {text}
        </div>
    );
}

function SelectButton({
    ui,
    entryIds,
    title,
    onSelectEntries,
}: {
    ui: OpsChainBlockUi;
    entryIds: string[];
    title: string;
    onSelectEntries: OpsChainGroupHandlers['onSelectEntries'];
}) {
    if (ui.hideSelectButton) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={() => onSelectEntries(entryIds, ui.selectMessage(title))}
            className={`rounded-full border px-3 py-2 text-xs font-bold ${ui.selectButtonClass}`}
        >
            queue 선택
        </button>
    );
}

function activityMetaLine(run: OpsChainActivityRunLike, metaLine: NonNullable<OpsChainActivityBlockUi['metaLine']>) {
    if (metaLine === 'time') {
        return formatTime(run.createdAt);
    }

    if (metaLine === 'timeActor') {
        return `${formatTime(run.createdAt)}${run.actorUid ? ` · ${run.actorUid}` : ''}`;
    }

    return `${formatTime(run.createdAt)} · ${run.context}`;
}

export function OpsChainActivitySection({
    ui,
    data,
    onSelectEntries,
    resolveActivityRerun,
}: {
    ui: OpsChainActivityBlockUi;
    data: OpsChainGroupData['activity'];
    onSelectEntries: OpsChainGroupHandlers['onSelectEntries'];
    resolveActivityRerun?: OpsChainGroupHandlers['resolveActivityRerun'];
}) {
    const pills = formatPills(ui.pills, data);
    const secondBadge = ui.secondBadge === undefined ? { kind: 'priority' as const } : ui.secondBadge;
    const cornerBadge = ui.cornerBadge === undefined ? { kind: 'count' as const, suffix: 'items' } : ui.cornerBadge;
    const gridClass = ui.gridClass || 'md:grid-cols-2 xl:grid-cols-3';
    const emptyColSpanClass = ui.emptyColSpanClass || 'md:col-span-2 xl:col-span-3';

    return (
        <section className={`mt-8 rounded-3xl border p-5 ${ui.sectionClass}`}>
            <SectionHeader ui={ui} pills={pills} />
            <StatCards ui={ui} data={data} />
            <div className={`mt-4 grid gap-4 ${gridClass}`}>
                {data.recentRuns.map((run) => {
                    const badgeClass = ui.badgeClassByAction[run.action] || ui.fallbackBadgeClass;
                    const rerun = ui.rerunLabel && resolveActivityRerun ? resolveActivityRerun(run) : null;

                    return (
                        <div key={run.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${badgeClass}`}>
                                            {run.action}
                                        </span>
                                        <SecondBadge item={run} badge={secondBadge} />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{run.title}</p>
                                    {ui.metaLine && (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {activityMetaLine(run, ui.metaLine)}
                                        </p>
                                    )}
                                </div>
                                <CornerBadge item={run} badge={cornerBadge} />
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{run.description}</p>
                            {ui.showMetaBox !== false && (
                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                    {formatTime(run.createdAt)} · {run.context}
                                </p>
                            )}
                            <QueryChips ownerId={run.id} queries={run.queries} />
                            <div className="mt-4 flex flex-wrap gap-2">
                                {rerun && (
                                    <button
                                        type="button"
                                        onClick={() => void rerun()}
                                        className={`rounded-full border px-3 py-2 text-xs font-bold ${ui.rerunButtonClass || DEFAULT_RERUN_BUTTON_CLASS}`}
                                    >
                                        {ui.rerunLabel}
                                    </button>
                                )}
                                <SelectButton ui={ui} entryIds={run.entryIds} title={run.title} onSelectEntries={onSelectEntries} />
                            </div>
                        </div>
                    );
                })}
                {data.totalRuns === 0 && <EmptyState text={ui.emptyText} colSpanClass={emptyColSpanClass} />}
            </div>
        </section>
    );
}

const DEFAULT_OUTCOME_PILLS: OpsChainSummaryPill[] = [
    { label: 'total', field: 'total', className: 'border-slate-800 bg-slate-900/60 text-slate-300' },
    { label: 'ready', field: 'readyReview', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' },
    { label: 'attention', field: 'needsAttention', className: 'border-rose-500/30 bg-rose-500/10 text-rose-100' },
    { label: 'samples', field: 'awaitingSamples', className: 'border-amber-500/30 bg-amber-500/10 text-amber-100' },
    { label: 'validated', field: 'validated', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100' },
];

function outcomeMetaLine(outcome: OpsChainOutcomeLike, metaLine: NonNullable<OpsChainOutcomesBlockUi['metaLine']>) {
    if (metaLine === 'timeImproved') {
        return `${formatTime(outcome.createdAt || '')} · improved ${outcome.improvedCount} · weak ${outcome.noImprovementCount}`;
    }

    return `${formatTime(outcome.createdAt || '')} · ${outcome.context}`;
}

export function OpsChainOutcomesSection({
    ui,
    data,
    onSelectEntries,
    onRunOutcome,
    resolveOutcomeRerun,
}: {
    ui: OpsChainOutcomesBlockUi;
    data: OpsChainGroupData['outcomes'];
    onSelectEntries: OpsChainGroupHandlers['onSelectEntries'];
    onRunOutcome?: OpsChainGroupHandlers['onRunOutcome'];
    resolveOutcomeRerun?: OpsChainGroupHandlers['resolveOutcomeRerun'];
}) {
    const pills = formatPills(ui.pills || DEFAULT_OUTCOME_PILLS, data);
    const secondBadge = ui.secondBadge === undefined ? { kind: 'action' as const } : ui.secondBadge;
    const gridClass = ui.gridClass || 'md:grid-cols-2 xl:grid-cols-4';
    const emptyColSpanClass = ui.emptyColSpanClass || 'md:col-span-2 xl:col-span-4';

    return (
        <section className={`mt-8 rounded-3xl border p-5 ${ui.sectionClass}`}>
            <SectionHeader ui={ui} pills={pills} />
            <StatCards ui={ui} data={data} />
            <div className={`mt-4 grid gap-4 ${gridClass}`}>
                {[
                    ...data.topReadyReview,
                    ...data.topNeedsAttention,
                    ...data.topAwaitingSamples,
                    ...data.topValidated,
                ].slice(0, ui.maxItems ?? 8).map((outcome) => {
                    const rerun = ui.rerunLabel && resolveOutcomeRerun ? resolveOutcomeRerun(outcome) : null;

                    return (
                        <div key={outcome.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${outcomeStatusClass(outcome.status, ui.statusFallbackClass)}`}>
                                            {outcome.status}
                                        </span>
                                        <SecondBadge item={outcome} badge={secondBadge} />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{outcome.title}</p>
                                    {ui.metaLine && (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {outcomeMetaLine(outcome, ui.metaLine)}
                                        </p>
                                    )}
                                </div>
                                <CornerBadge item={outcome} badge={ui.cornerBadge} />
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{outcome.description}</p>
                            {ui.showResultBox !== false && (
                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                    improved {outcome.improvedCount} · no improvement {outcome.noImprovementCount} · awaiting {outcome.awaitingSamplesCount}
                                </p>
                            )}
                            {ui.showMiniStats && (
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
                            )}
                            <QueryChips ownerId={outcome.id} queries={outcome.queries} />
                            <div className="mt-4 flex flex-wrap gap-2">
                                {onRunOutcome && ui.runButtonClass && (
                                    <button
                                        type="button"
                                        onClick={() => void onRunOutcome(outcome)}
                                        className={`rounded-full border px-3 py-2 text-xs font-bold ${ui.runButtonClass}`}
                                    >
                                        {ui.runLabel ? ui.runLabel(outcome) : '바로 실행'}
                                    </button>
                                )}
                                {rerun && (
                                    <button
                                        type="button"
                                        onClick={() => void rerun()}
                                        className={`rounded-full border px-3 py-2 text-xs font-bold ${ui.rerunButtonClass || DEFAULT_RERUN_BUTTON_CLASS}`}
                                    >
                                        {ui.rerunLabel}
                                    </button>
                                )}
                                <SelectButton ui={ui} entryIds={outcome.entryIds} title={outcome.title} onSelectEntries={onSelectEntries} />
                            </div>
                        </div>
                    );
                })}
                {data.total === 0 && <EmptyState text={ui.emptyText} colSpanClass={emptyColSpanClass} />}
            </div>
        </section>
    );
}

const DEFAULT_RECOMMENDATION_PILLS: OpsChainSummaryPill[] = [
    { label: 'total', field: 'total', className: 'border-slate-800 bg-slate-900/60 text-slate-300' },
    { label: 'review', field: 'reviewNow', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' },
    { label: 'retrain', field: 'retrainNow', className: 'border-rose-500/30 bg-rose-500/10 text-rose-100' },
    { label: 'samples', field: 'collectSamples', className: 'border-amber-500/30 bg-amber-500/10 text-amber-100' },
    { label: 'observe', field: 'observe', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100' },
];

export function OpsChainRecommendationsSection({
    ui,
    data,
    onSelectEntries,
    onRunRecommendation,
}: {
    ui: OpsChainActionBlockUi;
    data: OpsChainGroupData['recommendations'];
    onSelectEntries: OpsChainGroupHandlers['onSelectEntries'];
    onRunRecommendation: OpsChainGroupHandlers['onRunRecommendation'];
}) {
    const pills = formatPills(ui.pills || DEFAULT_RECOMMENDATION_PILLS, data);
    const gridClass = ui.gridClass || 'md:grid-cols-2 xl:grid-cols-4';
    const emptyColSpanClass = ui.emptyColSpanClass || 'md:col-span-2 xl:col-span-4';

    return (
        <section className={`mt-8 rounded-3xl border p-5 ${ui.sectionClass}`}>
            <SectionHeader ui={ui} pills={pills} />
            <StatCards ui={ui} data={data} />
            <div className={`mt-4 grid gap-4 ${gridClass}`}>
                {[
                    ...data.topReviewNow,
                    ...data.topRetrainNow,
                    ...data.topCollectSamples,
                    ...data.topObserve,
                ].slice(0, ui.maxItems ?? 8).map((recommendation) => {
                    const primaryBadgeClass = ui.primaryBadge === 'priority'
                        ? recommendationPriorityClass(recommendation.priority)
                        : recommendationActionClass(recommendation.action, ui.actionFallbackClass);
                    const primaryBadgeText = ui.primaryBadge === 'priority' ? recommendation.priority : recommendation.action;
                    const secondBadge = ui.secondBadge === undefined
                        ? { kind: (ui.primaryBadge === 'priority' ? 'action' : 'priority') as 'action' | 'priority' }
                        : ui.secondBadge;

                    return (
                        <div key={recommendation.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${primaryBadgeClass}`}>
                                            {primaryBadgeText}
                                        </span>
                                        <SecondBadge item={recommendation} badge={secondBadge} />
                                    </div>
                                    <p className="mt-3 text-sm font-semibold text-white">{recommendation.title}</p>
                                    {ui.metaLine && (
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            {ui.metaLine === 'reason'
                                                ? recommendation.reason
                                                : `${formatTime(recommendation.createdAt || '')} · ${recommendation.outcomeStatus}`}
                                        </p>
                                    )}
                                </div>
                                <CornerBadge item={recommendation} badge={ui.cornerBadge} />
                            </div>
                            <p className="mt-3 text-xs leading-6 text-slate-400">{recommendation.description}</p>
                            {ui.showReasonBox !== false && (
                                <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                    {recommendation.reason}
                                </p>
                            )}
                            <QueryChips ownerId={recommendation.id} queries={recommendation.queries} />
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => void onRunRecommendation(recommendation)}
                                    className={`rounded-full border px-3 py-2 text-xs font-bold ${ui.runButtonClass}`}
                                >
                                    {recommendation.actionLabel}
                                </button>
                                <SelectButton ui={ui} entryIds={recommendation.entryIds} title={recommendation.title} onSelectEntries={onSelectEntries} />
                            </div>
                        </div>
                    );
                })}
                {data.total === 0 && <EmptyState text={ui.emptyText} colSpanClass={emptyColSpanClass} />}
            </div>
        </section>
    );
}

const DEFAULT_QUEUE_PILLS: OpsChainSummaryPill[] = [
    { label: 'total', field: 'total', className: 'border-slate-800 bg-slate-900/60 text-slate-300' },
    { label: 'execute', field: 'executeNow', className: 'border-rose-500/30 bg-rose-500/10 text-rose-100' },
    { label: 'review', field: 'needsReview', className: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-100' },
    { label: 'samples', field: 'sampleCollection', className: 'border-amber-500/30 bg-amber-500/10 text-amber-100' },
    { label: 'observe', field: 'observe', className: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-100' },
];

export function OpsChainQueueSection({
    ui,
    data,
    onSelectEntries,
    onRunQueueItem,
}: {
    ui: OpsChainActionBlockUi;
    data: NonNullable<OpsChainGroupData['queue']>;
    onSelectEntries: OpsChainGroupHandlers['onSelectEntries'];
    onRunQueueItem?: OpsChainGroupHandlers['onRunQueueItem'];
}) {
    const pills = formatPills(ui.pills || DEFAULT_QUEUE_PILLS, data);
    const secondBadge = ui.secondBadge === undefined ? { kind: 'priority' as const } : ui.secondBadge;
    const gridClass = ui.gridClass || 'md:grid-cols-2 xl:grid-cols-4';
    const emptyColSpanClass = ui.emptyColSpanClass || 'md:col-span-2 xl:col-span-4';

    return (
        <section className={`mt-8 rounded-3xl border p-5 ${ui.sectionClass}`}>
            <SectionHeader ui={ui} pills={pills} />
            <StatCards ui={ui} data={data} />
            <div className={`mt-4 grid gap-4 ${gridClass}`}>
                {[
                    ...data.topExecuteNow,
                    ...data.topNeedsReview,
                    ...data.topSampleCollection,
                    ...data.topObserve,
                ].slice(0, ui.maxItems ?? 8).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${recommendationQueueClass(item.queueState, ui)}`}>
                                        {item.queueState}
                                    </span>
                                    <SecondBadge item={item} badge={secondBadge} />
                                </div>
                                <p className="mt-3 text-sm font-semibold text-white">{item.title}</p>
                                {ui.metaLine === 'timeOutcomeStatus' && (
                                    <p className="mt-1 text-[11px] text-slate-500">
                                        {formatTime(item.createdAt || '')} · {item.outcomeStatus}
                                    </p>
                                )}
                            </div>
                            <CornerBadge item={item} badge={ui.cornerBadge} />
                        </div>
                        <p className="mt-3 text-xs leading-6 text-slate-400">{item.description}</p>
                        {ui.showReasonBox !== false && (
                            <p className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                                {item.reason}
                            </p>
                        )}
                        <QueryChips ownerId={item.id} queries={item.queries} />
                        <div className="mt-4 flex flex-wrap gap-2">
                            {onRunQueueItem && (
                                <button
                                    type="button"
                                    onClick={() => void onRunQueueItem(item)}
                                    className={`rounded-full border px-3 py-2 text-xs font-bold ${ui.runButtonClass}`}
                                >
                                    {item.actionLabel}
                                </button>
                            )}
                            <SelectButton ui={ui} entryIds={item.entryIds} title={item.title} onSelectEntries={onSelectEntries} />
                        </div>
                    </div>
                ))}
                {data.total === 0 && <EmptyState text={ui.emptyText} colSpanClass={emptyColSpanClass} />}
            </div>
        </section>
    );
}

export function OpsChainGroupSections({
    ui,
    data,
    handlers,
}: {
    ui: OpsChainGroupUi;
    data: OpsChainGroupData;
    handlers: OpsChainGroupHandlers;
}) {
    return (
        <>
            <OpsChainActivitySection
                ui={ui.activity}
                data={data.activity}
                onSelectEntries={handlers.onSelectEntries}
                resolveActivityRerun={handlers.resolveActivityRerun}
            />
            <OpsChainOutcomesSection
                ui={ui.outcomes}
                data={data.outcomes}
                onSelectEntries={handlers.onSelectEntries}
                onRunOutcome={handlers.onRunOutcome}
                resolveOutcomeRerun={handlers.resolveOutcomeRerun}
            />
            <OpsChainRecommendationsSection
                ui={ui.recommendations}
                data={data.recommendations}
                onSelectEntries={handlers.onSelectEntries}
                onRunRecommendation={handlers.onRunRecommendation}
            />
            {ui.queue && data.queue && (
                <OpsChainQueueSection
                    ui={ui.queue}
                    data={data.queue}
                    onSelectEntries={handlers.onSelectEntries}
                    onRunQueueItem={handlers.onRunQueueItem}
                />
            )}
        </>
    );
}
