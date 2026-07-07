import type {
    SearchLearningApprovalBaseline,
    SearchLearningStatus,
    SearchLearningSuggestion,
} from '../search/queryLearningTypes.ts';
import { buildSearchLearningImpact } from './searchLearningImpact.ts';
import type { SearchLearningOpsCompletionActivityRun } from './searchLearningOpsCompletionActivity.ts';

export type SearchLearningOpsCompletionOutcomeStatus =
    | 'ready_review'
    | 'needs_attention'
    | 'awaiting_samples'
    | 'validated';

export type SearchLearningOpsCompletionOutcomeEntryLike = {
    id: string;
    query: string;
    status: SearchLearningStatus;
    aiSuggestion: SearchLearningSuggestion | null;
    approvalBaseline: SearchLearningApprovalBaseline | null;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
};

export type SearchLearningOpsCompletionOutcome = {
    id: string;
    runId: string;
    title: string;
    action: SearchLearningOpsCompletionActivityRun['action'];
    context: string;
    createdAt: string;
    queries: string[];
    entryIds: string[];
    status: SearchLearningOpsCompletionOutcomeStatus;
    description: string;
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
    readyReviewCount: number;
};

export type SearchLearningOpsCompletionOutcomeSummary = {
    total: number;
    readyReview: number;
    needsAttention: number;
    awaitingSamples: number;
    validated: number;
    topReadyReview: SearchLearningOpsCompletionOutcome[];
    topNeedsAttention: SearchLearningOpsCompletionOutcome[];
    topAwaitingSamples: SearchLearningOpsCompletionOutcome[];
    topValidated: SearchLearningOpsCompletionOutcome[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function sortOutcomes(items: SearchLearningOpsCompletionOutcome[]): SearchLearningOpsCompletionOutcome[] {
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

export function buildSearchLearningOpsCompletionOutcomes(
    runs: SearchLearningOpsCompletionActivityRun[],
    entries: SearchLearningOpsCompletionOutcomeEntryLike[]
): SearchLearningOpsCompletionOutcomeSummary {
    const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
    const outcomes: SearchLearningOpsCompletionOutcome[] = [];

    for (const run of runs) {
        const relatedEntries = run.entryIds
            .map((entryId) => entryMap.get(entryId))
            .filter((entry): entry is SearchLearningOpsCompletionOutcomeEntryLike => Boolean(entry));

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
        const noImprovementCount = impacts.filter((impact) => impact?.outcome === 'unchanged' || impact?.outcome === 'regressed').length;

        let status: SearchLearningOpsCompletionOutcomeStatus = 'validated';
        let description = 'completion 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.';

        if (readyReviewCount > 0) {
            status = 'ready_review';
            description = 'completion 실행으로 새 AI suggestion이 준비되어 즉시 review/승인이 필요한 상태입니다.';
        } else if (noImprovementCount > 0) {
            status = 'needs_attention';
            description = 'completion 실행 후에도 low-fit/0건 개선이 약해 재학습 또는 rewrite 조정이 필요합니다.';
        } else if (awaitingSamplesCount > 0 || improvedCount === 0) {
            status = 'awaiting_samples';
            description = 'completion은 실행됐지만 아직 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.';
        }

        outcomes.push({
            id: `completion_outcome:${run.id}`,
            runId: run.id,
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
