import type {
    SearchLearningActivityEvent,
    SearchLearningApprovalBaseline,
    SearchLearningStatus,
    SearchLearningSuggestion,
} from './queryLearning.ts';
import { buildSearchLearningImpact } from './searchLearningImpact.ts';

export type SearchLearningActivityFollowupEntryLike = {
    id: string;
    query: string;
    status: SearchLearningStatus;
    aiSuggestion: SearchLearningSuggestion | null;
    approvalBaseline: SearchLearningApprovalBaseline | null;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
    [key: string]: unknown;
};

export type SearchLearningActivityFollowupAction =
    | 'retrain_needed'
    | 'awaiting_samples'
    | 'validated';

export type SearchLearningActivityFollowupItem = {
    id: string;
    action: SearchLearningActivityFollowupAction;
    title: string;
    description: string;
    context: string | null;
    entryIds: string[];
    queries: string[];
    lastSeenAt: string;
    reviewedCount: number;
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
};

export type SearchLearningActivityFollowupSummary = {
    retrainNeeded: number;
    awaitingSamples: number;
    validated: number;
    topRetrainNeeded: SearchLearningActivityFollowupItem[];
    topAwaitingSamples: SearchLearningActivityFollowupItem[];
    topValidated: SearchLearningActivityFollowupItem[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function sortFollowups(items: SearchLearningActivityFollowupItem[]): SearchLearningActivityFollowupItem[] {
    return [...items].sort((left, right) => {
        if (right.noImprovementCount !== left.noImprovementCount) {
            return right.noImprovementCount - left.noImprovementCount;
        }

        if (right.awaitingSamplesCount !== left.awaitingSamplesCount) {
            return right.awaitingSamplesCount - left.awaitingSamplesCount;
        }

        if (right.improvedCount !== left.improvedCount) {
            return right.improvedCount - left.improvedCount;
        }

        return right.lastSeenAt.localeCompare(left.lastSeenAt);
    });
}

export function buildSearchLearningActivityFollowups(
    events: SearchLearningActivityEvent[],
    entries: SearchLearningActivityFollowupEntryLike[]
): SearchLearningActivityFollowupSummary {
    const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
    const followups: SearchLearningActivityFollowupItem[] = [];

    for (const event of events) {
        if (event.type !== 'review_entries' || event.reviewedStatus !== 'approved') {
            continue;
        }

        const relatedEntries = event.entryIds
            .map((entryId) => entryMap.get(entryId))
            .filter((entry): entry is SearchLearningActivityFollowupEntryLike => Boolean(entry))
            .filter((entry) => entry.status === 'approved');

        if (relatedEntries.length === 0) {
            continue;
        }

        const impacts = relatedEntries
            .map((entry) => buildSearchLearningImpact(entry))
            .filter((impact) => Boolean(impact));

        const improvedCount = impacts.filter((impact) => impact?.outcome === 'improved').length;
        const awaitingSamplesCount = impacts.filter((impact) => impact?.outcome === 'awaiting_samples').length;
        const noImprovementCount = impacts.filter((impact) => impact?.outcome === 'unchanged' || impact?.outcome === 'regressed').length;

        let action: SearchLearningActivityFollowupAction = 'validated';
        let description = '승인된 query가 실제 검색 품질 개선으로 이어졌는지 검증이 완료된 activity입니다.';

        if (noImprovementCount > 0) {
            action = 'retrain_needed';
            description = '승인 후에도 low-fit/0건이 개선되지 않아 재학습 또는 rewrite 조정이 필요한 activity입니다.';
        } else if (awaitingSamplesCount > 0) {
            action = 'awaiting_samples';
            description = '승인된 query가 있지만 아직 표본이 부족해 실제 개선 여부를 더 관찰해야 하는 activity입니다.';
        }

        followups.push({
            id: `followup:${event.id}`,
            action,
            title: event.context ? `${event.context} approval follow-up` : 'Approved activity follow-up',
            description,
            context: event.context,
            entryIds: uniqueOrdered(relatedEntries.map((entry) => entry.id)).slice(0, 24),
            queries: uniqueOrdered(relatedEntries.map((entry) => entry.query)).slice(0, 12),
            lastSeenAt: event.createdAt,
            reviewedCount: relatedEntries.length,
            improvedCount,
            noImprovementCount,
            awaitingSamplesCount,
        });
    }

    const sorted = sortFollowups(followups);
    const retrainNeeded = sorted.filter((item) => item.action === 'retrain_needed');
    const awaitingSamples = sorted.filter((item) => item.action === 'awaiting_samples');
    const validated = sorted.filter((item) => item.action === 'validated');

    return {
        retrainNeeded: retrainNeeded.length,
        awaitingSamples: awaitingSamples.length,
        validated: validated.length,
        topRetrainNeeded: retrainNeeded.slice(0, 4),
        topAwaitingSamples: awaitingSamples.slice(0, 4),
        topValidated: validated.slice(0, 4),
    };
}
