/**
 * Shared types for the generic "search learning ops chain" group renderer.
 * The render components live in opsChainSections.tsx, the per-group config in
 * opsChainSectionConfig.ts, and the handler wiring in useOpsChainActions.ts.
 */

export type OpsChainActivityRunLike = {
    id: string;
    action: string;
    priority: string;
    title: string;
    description: string;
    context: string;
    count: number;
    createdAt: string;
    queries: string[];
    entryIds: string[];
    outcomeId?: string;
    actorUid?: string | null;
    actionLabel?: string;
};

export type OpsChainActivityDataLike = {
    totalRuns: number;
    uniqueQueries: number;
    recentRuns: OpsChainActivityRunLike[];
};

export type OpsChainOutcomeLike = {
    id: string;
    title: string;
    status: string;
    action: string;
    description: string;
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
    queries: string[];
    entryIds: string[];
    outcomeId?: string;
    context?: string;
    createdAt?: string;
    readyReviewCount?: number;
};

export type OpsChainOutcomeDataLike = {
    total: number;
    readyReview: number;
    needsAttention: number;
    awaitingSamples: number;
    validated: number;
    topReadyReview: OpsChainOutcomeLike[];
    topNeedsAttention: OpsChainOutcomeLike[];
    topAwaitingSamples: OpsChainOutcomeLike[];
    topValidated: OpsChainOutcomeLike[];
};

export type OpsChainRecommendationLike = {
    id: string;
    title: string;
    action: string;
    priority: string;
    description: string;
    reason: string;
    actionLabel: string;
    queries: string[];
    entryIds: string[];
    outcomeId?: string;
    createdAt?: string;
    outcomeStatus?: string;
};

export type OpsChainRecommendationDataLike = {
    total: number;
    reviewNow: number;
    retrainNow: number;
    collectSamples: number;
    observe: number;
    topReviewNow: OpsChainRecommendationLike[];
    topRetrainNow: OpsChainRecommendationLike[];
    topCollectSamples: OpsChainRecommendationLike[];
    topObserve: OpsChainRecommendationLike[];
};

export type OpsChainQueueItemLike = {
    id: string;
    title: string;
    queueState: string;
    priority: string;
    description: string;
    reason: string;
    actionLabel: string;
    queries: string[];
    entryIds: string[];
    recommendationId?: string;
    createdAt?: string;
    outcomeStatus?: string;
};

export type OpsChainQueueDataLike = {
    total: number;
    executeNow: number;
    needsReview: number;
    sampleCollection: number;
    observe: number;
    topExecuteNow: OpsChainQueueItemLike[];
    topNeedsReview: OpsChainQueueItemLike[];
    topSampleCollection: OpsChainQueueItemLike[];
    topObserve: OpsChainQueueItemLike[];
};

export type OpsChainSummaryPill = {
    label: string;
    field: string;
    className: string;
};

export type OpsChainStatCard = {
    label: string;
    field: string;
    cardClass: string;
    labelClass: string;
    valueClass: string;
    caption?: string;
    captionClass?: string;
};

export type OpsChainCardBadge =
    | { kind: 'count'; suffix: string }
    | { kind: 'queryCount' }
    | { kind: 'priority' }
    | { kind: 'actionLabel' }
    | { kind: 'action' };

export type OpsChainBlockUi = {
    heading: string;
    intro: string;
    emptyText: string;
    sectionClass: string;
    selectButtonClass: string;
    selectMessage: (title: string) => string;
    /** intro paragraph color class; defaults to 'text-slate-300' (playbook uses 'text-slate-400'). */
    introClass?: string;
    /** card grid columns; defaults per block type (playbook lanes use 'xl:grid-cols-2'). */
    gridClass?: string;
    /** empty-state col span; defaults per block type. */
    emptyColSpanClass?: string;
    /** max cards rendered for outcomes/recommendations/queue; defaults to 8 (playbook uses 6). */
    maxItems?: number;
    /** optional big metric cards rendered between the header and the card grid. */
    statCards?: OpsChainStatCard[];
    statCardsGridClass?: string;
    /** overrides the default summary pills of outcomes/recommendations/queue blocks. */
    pills?: OpsChainSummaryPill[];
    /** hides the 'queue 선택' select button (playbook G0 outcomes has no select button). */
    hideSelectButton?: boolean;
};

export type OpsChainActivityBlockUi = OpsChainBlockUi & {
    pills: OpsChainSummaryPill[];
    badgeClassByAction: Record<string, string>;
    fallbackBadgeClass: string;
    /** second badge in the badge row; defaults to priority. */
    secondBadge?: OpsChainCardBadge | null;
    /** badge on the card's top-right corner; defaults to '{count} items'. */
    cornerBadge?: OpsChainCardBadge | null;
    /** small slate-500 line under the title. */
    metaLine?: 'time' | 'timeContext' | 'timeActor' | null;
    /** rounded '{time} · {context}' box after the description; defaults to true. */
    showMetaBox?: boolean;
    /** playbook-only '동일 ... 실행' rerun button (rendered when the handler resolves a target). */
    rerunLabel?: string;
    rerunButtonClass?: string;
};

export type OpsChainOutcomesBlockUi = OpsChainBlockUi & {
    runButtonClass?: string;
    /** run-button label; defaults to '바로 실행' (playbook G0 labels by outcome status). */
    runLabel?: (outcome: OpsChainOutcomeLike) => string;
    /** second badge in the badge row; defaults to the outcome action. */
    secondBadge?: OpsChainCardBadge | null;
    cornerBadge?: OpsChainCardBadge | null;
    metaLine?: 'timeContext' | 'timeImproved' | null;
    /** 'improved X · no improvement Y · awaiting Z' box; defaults to true. */
    showResultBox?: boolean;
    /** status badge class for non ready/attention/awaiting statuses; defaults to cyan. */
    statusFallbackClass?: string;
    /** playbook G0 3-column Review / Needs Attention / Awaiting mini grid. */
    showMiniStats?: boolean;
    rerunLabel?: string;
    rerunButtonClass?: string;
};

export type OpsChainActionBlockUi = OpsChainBlockUi & {
    runButtonClass: string;
    /** first badge: classified action (default) or classified priority (playbook G0 recommendations). */
    primaryBadge?: 'action' | 'priority';
    secondBadge?: OpsChainCardBadge | null;
    cornerBadge?: OpsChainCardBadge | null;
    metaLine?: 'timeOutcomeStatus' | 'reason' | null;
    /** rounded reason box after the description; defaults to true. */
    showReasonBox?: boolean;
    /** recommendation action badge fallback class; defaults to cyan (playbook uses sky). */
    actionFallbackClass?: string;
    /** queue-state badge class overrides + fallback (deep completion levels swap execute/review). */
    stateClasses?: Record<string, string>;
    stateFallbackClass?: string;
};

export type OpsChainGroupUi = {
    key: string;
    activity: OpsChainActivityBlockUi;
    outcomes: OpsChainOutcomesBlockUi;
    recommendations: OpsChainActionBlockUi;
    queue: OpsChainActionBlockUi | null;
};

export type OpsChainGroupData = {
    activity: OpsChainActivityDataLike;
    outcomes: OpsChainOutcomeDataLike;
    recommendations: OpsChainRecommendationDataLike;
    queue: OpsChainQueueDataLike | null;
};

export type OpsChainGroupHandlers = {
    onSelectEntries: (entryIds: string[], message: string) => void;
    onRunRecommendation: (recommendation: OpsChainRecommendationLike) => Promise<void> | void;
    onRunQueueItem?: (item: OpsChainQueueItemLike) => Promise<void> | void;
    onRunOutcome?: (outcome: OpsChainOutcomeLike) => Promise<void> | void;
    /** resolves a playbook '동일 ... 실행' rerun for an activity run; null hides the button. */
    resolveActivityRerun?: (run: OpsChainActivityRunLike) => (() => Promise<void> | void) | null;
    /** resolves a playbook '동일 ... 실행' rerun for an outcome; null hides the button. */
    resolveOutcomeRerun?: (outcome: OpsChainOutcomeLike) => (() => Promise<void> | void) | null;
};
