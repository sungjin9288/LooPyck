import type { SearchLearningActivityEvent } from '../search/queryLearningTypes.ts';
import { buildSearchLearningImpact } from './searchLearningImpact.ts';

/**
 * Generic engine for the recursive "search learning ops" chain.
 *
 * Every recursive level of the playbook/completion lanes repeats the same
 * four-stage pipeline with only context prefixes, id prefixes, and copy text
 * changing per level:
 *
 *   Recommendations(k) -> Queue(k) -> Activity(k) -> Outcomes(k) -> Recommendations(k+1)
 *
 * Level-specific values live in searchLearningOpsChainLevels.ts. The context
 * and id prefixes are persisted in Firestore activity logs, so they must never
 * change for an existing level.
 */

export type OpsChainRunAction = 'review_now' | 'retrain_now';

export type OpsChainRecommendationAction = 'review_now' | 'retrain_now' | 'collect_samples' | 'observe';

export type OpsChainOutcomeStatus = 'ready_review' | 'needs_attention' | 'awaiting_samples' | 'validated';

export type OpsChainQueueState = 'execute_now' | 'needs_review' | 'sample_collection' | 'observe';

export type OpsChainPriority = 'critical' | 'high' | 'medium' | 'low';

export type OpsChainRunMeta = {
    title: string;
    description: string;
    actionLabel: string;
    priority: 'critical' | 'high';
};

export type OpsChainRun = {
    id: string;
    outcomeId: string;
    action: OpsChainRunAction;
    title: string;
    description: string;
    actionLabel: string;
    priority: 'critical' | 'high';
    context: string;
    count: number;
    entryIds: string[];
    queries: string[];
    actorUid: string | null;
    createdAt: string;
};

export type OpsChainActivitySummary = {
    totalRuns: number;
    reviewRuns: number;
    retrainRuns: number;
    uniqueQueries: number;
    recentRuns: OpsChainRun[];
};

export type OpsChainOutcomeEntryLike = {
    id: string;
    query: string;
    status: 'pending' | 'approved' | 'ignored';
    aiSuggestion: { suggestedQueries?: string[] } | null;
    approvalBaseline: {
        approvedAt: string;
        occurrenceCount: number;
        lowFitCount: number;
        zeroResultCount: number;
    } | null;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
};

export type OpsChainOutcome = {
    id: string;
    outcomeId: string;
    title: string;
    action: OpsChainRunAction;
    context: string;
    createdAt: string;
    queries: string[];
    entryIds: string[];
    status: OpsChainOutcomeStatus;
    description: string;
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
    readyReviewCount: number;
};

export type OpsChainOutcomeSummary = {
    total: number;
    readyReview: number;
    needsAttention: number;
    awaitingSamples: number;
    validated: number;
    topReadyReview: OpsChainOutcome[];
    topNeedsAttention: OpsChainOutcome[];
    topAwaitingSamples: OpsChainOutcome[];
    topValidated: OpsChainOutcome[];
};

export type OpsChainRecommendation = {
    id: string;
    outcomeId: string;
    title: string;
    description: string;
    reason: string;
    action: OpsChainRecommendationAction;
    actionLabel: string;
    priority: OpsChainPriority;
    outcomeStatus: OpsChainOutcomeStatus;
    createdAt: string;
    entryIds: string[];
    queries: string[];
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
    readyReviewCount: number;
};

export type OpsChainRecommendationSummary = {
    total: number;
    reviewNow: number;
    retrainNow: number;
    collectSamples: number;
    observe: number;
    critical: number;
    highPriority: number;
    topReviewNow: OpsChainRecommendation[];
    topRetrainNow: OpsChainRecommendation[];
    topCollectSamples: OpsChainRecommendation[];
    topObserve: OpsChainRecommendation[];
};

export type OpsChainQueueItem = {
    id: string;
    recommendationId: string;
    title: string;
    description: string;
    reason: string;
    queueState: OpsChainQueueState;
    action: OpsChainRecommendationAction;
    actionLabel: string;
    priority: OpsChainPriority;
    outcomeStatus: OpsChainOutcomeStatus;
    createdAt: string;
    entryIds: string[];
    queries: string[];
    readyReviewCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
};

export type OpsChainQueueSummary = {
    total: number;
    executeNow: number;
    needsReview: number;
    sampleCollection: number;
    observe: number;
    urgent: number;
    topExecuteNow: OpsChainQueueItem[];
    topNeedsReview: OpsChainQueueItem[];
    topSampleCollection: OpsChainQueueItem[];
    topObserve: OpsChainQueueItem[];
};

export type OpsChainActivityConfig = {
    reviewContextPrefix: string;
    retrainContextPrefix: string;
    reviewMeta: OpsChainRunMeta;
    retrainMeta: OpsChainRunMeta;
};

export type OpsChainOutcomesConfig = {
    idPrefix: string;
    descriptions: {
        readyReview: string;
        needsAttention: string;
        awaitingSamples: string;
        validated: string;
    };
};

export type OpsChainRecommendationClassification = {
    actionLabel: string;
    description: string;
    reason: (outcome: OpsChainRecommendationSourceOutcome) => string;
};

export type OpsChainRecommendationsConfig = {
    idPrefix: string;
    // Which id the produced recommendation's outcomeId points at. Most levels
    // propagate the run's parsed outcome id; the completion root and completion
    // level 0 reference the outcome record id instead. Persisted downstream in
    // activity contexts, so this must stay stable per level.
    outcomeIdSource: 'outcomeRecordId' | 'parsedOutcomeId';
    classify: {
        readyReview: OpsChainRecommendationClassification;
        needsAttention: OpsChainRecommendationClassification;
        awaitingSamples: OpsChainRecommendationClassification;
        validated: OpsChainRecommendationClassification;
    };
};

export type OpsChainQueueConfig = {
    idPrefix: string;
};

export type OpsChainLevelConfig = {
    queue: OpsChainQueueConfig;
    activity: OpsChainActivityConfig;
    // null marks a stage whose outcomes deviate from the template and are
    // built by a bespoke module instead (completion level 0 keeps activityId).
    outcomes: OpsChainOutcomesConfig | null;
    recommendations: OpsChainRecommendationsConfig;
};

// Minimal structural input for the queue builder so the bespoke root-level
// recommendation summaries (playbook/completion) can feed generic queues.
export type OpsChainQueueSourceRecommendation = Omit<OpsChainRecommendation, 'outcomeId'>;

export type OpsChainQueueSource = {
    topReviewNow: OpsChainQueueSourceRecommendation[];
    topRetrainNow: OpsChainQueueSourceRecommendation[];
    topCollectSamples: OpsChainQueueSourceRecommendation[];
    topObserve: OpsChainQueueSourceRecommendation[];
};

// Minimal structural input for the recommendations builder. The bespoke
// completion-root outcome summary has no outcomeId/action/context fields,
// and the builder only reads outcomeId when outcomeIdSource is 'parsedOutcomeId'.
export type OpsChainRecommendationSourceOutcome = Omit<OpsChainOutcome, 'outcomeId' | 'action' | 'context'> & {
    outcomeId?: string;
};

export type OpsChainRecommendationSource = {
    topReadyReview: OpsChainRecommendationSourceOutcome[];
    topNeedsAttention: OpsChainRecommendationSourceOutcome[];
    topAwaitingSamples: OpsChainRecommendationSourceOutcome[];
    topValidated: OpsChainRecommendationSourceOutcome[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function priorityWeight(priority: OpsChainPriority): number {
    switch (priority) {
        case 'critical':
            return 4;
        case 'high':
            return 3;
        case 'medium':
            return 2;
        default:
            return 1;
    }
}

function parseChainContext(
    context: string | null,
    config: OpsChainActivityConfig
): { outcomeId: string; action: OpsChainRunAction } | null {
    if (!context) {
        return null;
    }

    if (context.startsWith(config.reviewContextPrefix)) {
        return {
            outcomeId: context.slice(config.reviewContextPrefix.length),
            action: 'review_now',
        };
    }

    if (context.startsWith(config.retrainContextPrefix)) {
        return {
            outcomeId: context.slice(config.retrainContextPrefix.length),
            action: 'retrain_now',
        };
    }

    return null;
}

function toChainRun(event: SearchLearningActivityEvent, config: OpsChainActivityConfig): OpsChainRun | null {
    const parsed = parseChainContext(event.context, config);
    if (!parsed) {
        return null;
    }

    const meta = parsed.action === 'review_now' ? config.reviewMeta : config.retrainMeta;
    return {
        id: event.id,
        outcomeId: parsed.outcomeId,
        action: parsed.action,
        title: meta.title,
        description: meta.description,
        actionLabel: meta.actionLabel,
        priority: meta.priority,
        context: event.context || '',
        count: event.count,
        entryIds: uniqueOrdered(event.entryIds).slice(0, 24),
        queries: uniqueOrdered(event.queries).slice(0, 8),
        actorUid: event.actorUid,
        createdAt: event.createdAt,
    };
}

export function buildOpsChainActivity(
    events: SearchLearningActivityEvent[],
    config: OpsChainActivityConfig
): OpsChainActivitySummary {
    const runs = events
        .map((event) => toChainRun(event, config))
        .filter((run): run is OpsChainRun => Boolean(run));
    const recentRuns = [...runs].sort((left, right) => right.createdAt.localeCompare(left.createdAt));

    return {
        totalRuns: runs.length,
        reviewRuns: runs.filter((run) => run.action === 'review_now').length,
        retrainRuns: runs.filter((run) => run.action === 'retrain_now').length,
        uniqueQueries: new Set(runs.flatMap((run) => run.queries)).size,
        recentRuns: recentRuns.slice(0, 6),
    };
}

function sortOutcomes(items: OpsChainOutcome[]): OpsChainOutcome[] {
    return [...items].sort((left, right) => {
        if (right.noImprovementCount !== left.noImprovementCount) {
            return right.noImprovementCount - left.noImprovementCount;
        }

        if (right.readyReviewCount !== left.readyReviewCount) {
            return right.readyReviewCount - left.readyReviewCount;
        }

        if (right.awaitingSamplesCount !== left.awaitingSamplesCount) {
            return right.awaitingSamplesCount - left.awaitingSamplesCount;
        }

        if (right.improvedCount !== left.improvedCount) {
            return right.improvedCount - left.improvedCount;
        }

        return right.createdAt.localeCompare(left.createdAt);
    });
}

export function buildOpsChainOutcomes(
    runs: OpsChainRun[],
    entries: OpsChainOutcomeEntryLike[],
    config: OpsChainOutcomesConfig
): OpsChainOutcomeSummary {
    const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
    const outcomes: OpsChainOutcome[] = [];

    for (const run of runs) {
        const relatedEntries = run.entryIds
            .map((entryId) => entryMap.get(entryId))
            .filter((entry): entry is OpsChainOutcomeEntryLike => Boolean(entry));

        if (relatedEntries.length === 0) {
            continue;
        }

        const readyReviewCount = relatedEntries.filter(
            (entry) => entry.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length)
        ).length;
        const impacts = relatedEntries
            .map((entry) => buildSearchLearningImpact(entry))
            .filter((impact) => Boolean(impact));
        const improvedCount = impacts.filter((impact) => impact?.outcome === 'improved').length;
        const awaitingSamplesCount = impacts.filter((impact) => impact?.outcome === 'awaiting_samples').length;
        const noImprovementCount = impacts.filter(
            (impact) => impact?.outcome === 'unchanged' || impact?.outcome === 'regressed'
        ).length;

        let status: OpsChainOutcomeStatus = 'validated';
        let description = config.descriptions.validated;

        if (readyReviewCount > 0) {
            status = 'ready_review';
            description = config.descriptions.readyReview;
        } else if (noImprovementCount > 0) {
            status = 'needs_attention';
            description = config.descriptions.needsAttention;
        } else if (awaitingSamplesCount > 0 || improvedCount === 0) {
            status = 'awaiting_samples';
            description = config.descriptions.awaitingSamples;
        }

        outcomes.push({
            id: `${config.idPrefix}:${run.id}`,
            outcomeId: run.outcomeId,
            title: run.title,
            action: run.action,
            context: run.context,
            createdAt: run.createdAt,
            queries: uniqueOrdered(relatedEntries.map((entry) => entry.query)).slice(0, 12),
            entryIds: uniqueOrdered(relatedEntries.map((entry) => entry.id)).slice(0, 24),
            status,
            description,
            improvedCount,
            noImprovementCount,
            awaitingSamplesCount,
            readyReviewCount,
        });
    }

    const sorted = sortOutcomes(outcomes);
    const readyReview = sorted.filter((outcome) => outcome.status === 'ready_review');
    const needsAttention = sorted.filter((outcome) => outcome.status === 'needs_attention');
    const awaitingSamples = sorted.filter((outcome) => outcome.status === 'awaiting_samples');
    const validated = sorted.filter((outcome) => outcome.status === 'validated');

    return {
        total: outcomes.length,
        readyReview: readyReview.length,
        needsAttention: needsAttention.length,
        awaitingSamples: awaitingSamples.length,
        validated: validated.length,
        topReadyReview: readyReview.slice(0, 4),
        topNeedsAttention: needsAttention.slice(0, 4),
        topAwaitingSamples: awaitingSamples.slice(0, 4),
        topValidated: validated.slice(0, 4),
    };
}

function classifyOutcome(
    outcome: OpsChainRecommendationSourceOutcome,
    config: OpsChainRecommendationsConfig
): Pick<OpsChainRecommendation, 'action' | 'actionLabel' | 'priority' | 'description' | 'reason'> {
    switch (outcome.status) {
        case 'ready_review':
            return {
                action: 'review_now',
                actionLabel: config.classify.readyReview.actionLabel,
                priority: outcome.readyReviewCount >= 2 ? 'critical' : 'high',
                description: config.classify.readyReview.description,
                reason: config.classify.readyReview.reason(outcome),
            };
        case 'needs_attention':
            return {
                action: 'retrain_now',
                actionLabel: config.classify.needsAttention.actionLabel,
                priority: outcome.noImprovementCount >= 2 ? 'critical' : 'high',
                description: config.classify.needsAttention.description,
                reason: config.classify.needsAttention.reason(outcome),
            };
        case 'awaiting_samples':
            return {
                action: 'collect_samples',
                actionLabel: config.classify.awaitingSamples.actionLabel,
                priority: 'medium',
                description: config.classify.awaitingSamples.description,
                reason: config.classify.awaitingSamples.reason(outcome),
            };
        default:
            return {
                action: 'observe',
                actionLabel: config.classify.validated.actionLabel,
                priority: 'low',
                description: config.classify.validated.description,
                reason: config.classify.validated.reason(outcome),
            };
    }
}

function sortRecommendations(items: OpsChainRecommendation[]): OpsChainRecommendation[] {
    return [...items].sort((left, right) => {
        const weightDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
        if (weightDiff !== 0) {
            return weightDiff;
        }

        if (right.noImprovementCount !== left.noImprovementCount) {
            return right.noImprovementCount - left.noImprovementCount;
        }

        if (right.readyReviewCount !== left.readyReviewCount) {
            return right.readyReviewCount - left.readyReviewCount;
        }

        if (right.awaitingSamplesCount !== left.awaitingSamplesCount) {
            return right.awaitingSamplesCount - left.awaitingSamplesCount;
        }

        return right.createdAt.localeCompare(left.createdAt);
    });
}

export function buildOpsChainRecommendations(
    outcomes: OpsChainRecommendationSource,
    config: OpsChainRecommendationsConfig
): OpsChainRecommendationSummary {
    const recommendations = sortRecommendations(
        [
            ...outcomes.topReadyReview,
            ...outcomes.topNeedsAttention,
            ...outcomes.topAwaitingSamples,
            ...outcomes.topValidated,
        ].map((outcome) => {
            const classification = classifyOutcome(outcome, config);
            return {
                id: `${config.idPrefix}:${outcome.id}`,
                outcomeId:
                    config.outcomeIdSource === 'parsedOutcomeId' && outcome.outcomeId !== undefined
                        ? outcome.outcomeId
                        : outcome.id,
                title: outcome.title,
                description: classification.description,
                reason: classification.reason,
                action: classification.action,
                actionLabel: classification.actionLabel,
                priority: classification.priority,
                outcomeStatus: outcome.status,
                createdAt: outcome.createdAt,
                entryIds: outcome.entryIds,
                queries: outcome.queries,
                improvedCount: outcome.improvedCount,
                noImprovementCount: outcome.noImprovementCount,
                awaitingSamplesCount: outcome.awaitingSamplesCount,
                readyReviewCount: outcome.readyReviewCount,
            };
        })
    );

    const reviewNow = recommendations.filter((item) => item.action === 'review_now');
    const retrainNow = recommendations.filter((item) => item.action === 'retrain_now');
    const collectSamples = recommendations.filter((item) => item.action === 'collect_samples');
    const observe = recommendations.filter((item) => item.action === 'observe');

    return {
        total: recommendations.length,
        reviewNow: reviewNow.length,
        retrainNow: retrainNow.length,
        collectSamples: collectSamples.length,
        observe: observe.length,
        critical: recommendations.filter((item) => item.priority === 'critical').length,
        highPriority: recommendations.filter((item) => item.priority === 'high').length,
        topReviewNow: reviewNow.slice(0, 4),
        topRetrainNow: retrainNow.slice(0, 4),
        topCollectSamples: collectSamples.slice(0, 4),
        topObserve: observe.slice(0, 4),
    };
}

function resolveQueueState(action: OpsChainRecommendationAction): OpsChainQueueState {
    switch (action) {
        case 'retrain_now':
            return 'execute_now';
        case 'review_now':
            return 'needs_review';
        case 'collect_samples':
            return 'sample_collection';
        default:
            return 'observe';
    }
}

function stateWeight(state: OpsChainQueueState): number {
    switch (state) {
        case 'execute_now':
            return 4;
        case 'needs_review':
            return 3;
        case 'sample_collection':
            return 2;
        default:
            return 1;
    }
}

function sortQueue(items: OpsChainQueueItem[]): OpsChainQueueItem[] {
    return [...items].sort((left, right) => {
        const stateDiff = stateWeight(right.queueState) - stateWeight(left.queueState);
        if (stateDiff !== 0) {
            return stateDiff;
        }

        const priorityDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
        if (priorityDiff !== 0) {
            return priorityDiff;
        }

        if (right.noImprovementCount !== left.noImprovementCount) {
            return right.noImprovementCount - left.noImprovementCount;
        }

        if (right.readyReviewCount !== left.readyReviewCount) {
            return right.readyReviewCount - left.readyReviewCount;
        }

        if (right.awaitingSamplesCount !== left.awaitingSamplesCount) {
            return right.awaitingSamplesCount - left.awaitingSamplesCount;
        }

        return right.createdAt.localeCompare(left.createdAt);
    });
}

export function buildOpsChainQueue(summary: OpsChainQueueSource, config: OpsChainQueueConfig): OpsChainQueueSummary {
    const queue = sortQueue(
        [
            ...summary.topReviewNow,
            ...summary.topRetrainNow,
            ...summary.topCollectSamples,
            ...summary.topObserve,
        ].map((recommendation) => ({
            id: `${config.idPrefix}:${recommendation.id}`,
            recommendationId: recommendation.id,
            title: recommendation.title,
            description: recommendation.description,
            reason: recommendation.reason,
            queueState: resolveQueueState(recommendation.action),
            action: recommendation.action,
            actionLabel: recommendation.actionLabel,
            priority: recommendation.priority,
            outcomeStatus: recommendation.outcomeStatus,
            createdAt: recommendation.createdAt,
            entryIds: recommendation.entryIds,
            queries: recommendation.queries,
            readyReviewCount: recommendation.readyReviewCount,
            noImprovementCount: recommendation.noImprovementCount,
            awaitingSamplesCount: recommendation.awaitingSamplesCount,
        }))
    );

    return {
        total: queue.length,
        executeNow: queue.filter((item) => item.queueState === 'execute_now').length,
        needsReview: queue.filter((item) => item.queueState === 'needs_review').length,
        sampleCollection: queue.filter((item) => item.queueState === 'sample_collection').length,
        observe: queue.filter((item) => item.queueState === 'observe').length,
        urgent: queue.filter((item) => item.queueState === 'execute_now' || item.queueState === 'needs_review').length,
        topExecuteNow: queue.filter((item) => item.queueState === 'execute_now').slice(0, 4),
        topNeedsReview: queue.filter((item) => item.queueState === 'needs_review').slice(0, 4),
        topSampleCollection: queue.filter((item) => item.queueState === 'sample_collection').slice(0, 4),
        topObserve: queue.filter((item) => item.queueState === 'observe').slice(0, 4),
    };
}
