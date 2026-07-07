import type { SearchLearningActivityRecommendationSummary } from './searchLearningActivityRecommendations.ts';
import type {
    SearchLearningActivityOpsQueueItem,
    SearchLearningActivityOpsQueueSummary,
} from './searchLearningActivityOpsQueue.ts';
import type {
    SearchLearningActivityFollowupAction,
    SearchLearningActivityFollowupItem,
    SearchLearningActivityFollowupSummary,
} from './searchLearningActivityFollowups.ts';

export type SearchLearningOpsCenterAction =
    | 'approve_now'
    | 'generate_now'
    | 'sample_now'
    | 'retrain_now'
    | 'select_queries';

export type SearchLearningOpsCenterItem = {
    id: string;
    source: 'ops_queue' | 'followup';
    title: string;
    description: string;
    context: string | null;
    entryIds: string[];
    queries: string[];
    lastSeenAt: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    action: SearchLearningOpsCenterAction;
    actionLabel: string;
    metricLabel: string;
};

export type SearchLearningOpsCenterSummary = {
    urgentNow: number;
    reviewPending: number;
    generateNeeded: number;
    sampleCollection: number;
    retrainNeeded: number;
    validated: number;
    reviewPendingEntryIds: string[];
    generateNeededEntryIds: string[];
    sampleCollectionEntryIds: string[];
    retrainNeededEntryIds: string[];
    validatedEntryIds: string[];
    topUrgentNow: SearchLearningOpsCenterItem[];
    topRetrainNeeded: SearchLearningOpsCenterItem[];
    topValidated: SearchLearningOpsCenterItem[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function mapOpsQueueItem(item: SearchLearningActivityOpsQueueItem): SearchLearningOpsCenterItem {
    const action: SearchLearningOpsCenterAction =
        item.action === 'review_pending'
            ? 'approve_now'
            : item.action === 'generate_needed'
                ? 'generate_now'
                : 'sample_now';

    return {
        id: `ops:${item.id}`,
        source: 'ops_queue',
        title: item.title,
        description: item.description,
        context: item.context,
        entryIds: item.entryIds,
        queries: item.queries,
        lastSeenAt: item.lastSeenAt,
        priority: item.priority,
        action,
        actionLabel:
            action === 'approve_now'
                ? '즉시 승인'
                : action === 'generate_now'
                    ? '즉시 AI 제안'
                    : '표본 수집 대상 선택',
        metricLabel: `score ${item.urgencyScore}`,
    };
}

function mapFollowupItem(item: SearchLearningActivityFollowupItem): SearchLearningOpsCenterItem {
    const action: SearchLearningOpsCenterAction =
        item.action === 'retrain_needed'
            ? 'retrain_now'
            : 'select_queries';

    return {
        id: `followup:${item.id}`,
        source: 'followup',
        title: item.title,
        description: item.description,
        context: item.context,
        entryIds: item.entryIds,
        queries: item.queries,
        lastSeenAt: item.lastSeenAt,
        priority:
            item.action === 'retrain_needed'
                ? 'high'
                : item.action === 'awaiting_samples'
                    ? 'medium'
                    : 'low',
        action,
        actionLabel:
            item.action === 'retrain_needed'
                ? '재학습 AI 제안'
                : item.action === 'awaiting_samples'
                    ? '표본 수집 대상 선택'
                    : '개선 query 선택',
        metricLabel:
            item.action === 'retrain_needed'
                ? `no-improvement ${item.noImprovementCount}`
                : item.action === 'awaiting_samples'
                    ? `awaiting ${item.awaitingSamplesCount}`
                    : `improved ${item.improvedCount}`,
    };
}

export function buildSearchLearningOpsCenter(
    recommendations: SearchLearningActivityRecommendationSummary,
    opsQueue: SearchLearningActivityOpsQueueSummary,
    followups: SearchLearningActivityFollowupSummary
): SearchLearningOpsCenterSummary {
    const reviewPendingEntryIds = uniqueOrdered(
        recommendations.topReviewPending.flatMap((entry) => entry.entryIds)
    );
    const generateNeededEntryIds = uniqueOrdered(
        recommendations.topGenerateNeeded.flatMap((entry) => entry.entryIds)
    );
    const sampleCollectionEntryIds = uniqueOrdered(
        [
            ...recommendations.topAwaitingSamples.flatMap((entry) => entry.entryIds),
            ...followups.topAwaitingSamples.flatMap((entry) => entry.entryIds),
        ]
    );
    const retrainNeededEntryIds = uniqueOrdered(
        followups.topRetrainNeeded.flatMap((entry) => entry.entryIds)
    );
    const validatedEntryIds = uniqueOrdered(
        followups.topValidated.flatMap((entry) => entry.entryIds)
    );

    return {
        urgentNow: opsQueue.critical + opsQueue.high,
        reviewPending: recommendations.reviewPending,
        generateNeeded: recommendations.generateNeeded,
        sampleCollection: followups.awaitingSamples,
        retrainNeeded: followups.retrainNeeded,
        validated: followups.validated,
        reviewPendingEntryIds,
        generateNeededEntryIds,
        sampleCollectionEntryIds,
        retrainNeededEntryIds,
        validatedEntryIds,
        topUrgentNow: opsQueue.topItems.slice(0, 4).map(mapOpsQueueItem),
        topRetrainNeeded: followups.topRetrainNeeded.slice(0, 4).map(mapFollowupItem),
        topValidated: followups.topValidated.slice(0, 4).map(mapFollowupItem),
    };
}
