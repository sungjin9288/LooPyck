import type {
    SearchLearningApprovalBaseline,
    SearchLearningStatus,
    SearchLearningSuggestion,
} from './queryLearningTypes.ts';
import { buildSearchLearningImpact } from './searchLearningImpact.ts';
import type { SearchLearningOpsPlaybookRecommendationOutcomeRecommendationRun } from './searchLearningOpsPlaybookRecommendationOutcomeRecommendationActivity.ts';

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeStatus =
    | 'ready_review'
    | 'needs_attention'
    | 'awaiting_samples'
    | 'validated';

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeEntryLike = {
    id: string;
    query: string;
    status: SearchLearningStatus;
    aiSuggestion: SearchLearningSuggestion | null;
    approvalBaseline: SearchLearningApprovalBaseline | null;
    occurrenceCount: number;
    lowFitCount: number;
    zeroResultCount: number;
};

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome = {
    id: string;
    outcomeId: string;
    title: string;
    action: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationRun['action'];
    context: string;
    createdAt: string;
    queries: string[];
    entryIds: string[];
    status: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeStatus;
    description: string;
    improvedCount: number;
    noImprovementCount: number;
    awaitingSamplesCount: number;
    readyReviewCount: number;
};

export type SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeSummary = {
    total: number;
    readyReview: number;
    needsAttention: number;
    awaitingSamples: number;
    validated: number;
    topReadyReview: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome[];
    topNeedsAttention: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome[];
    topAwaitingSamples: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome[];
    topValidated: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function sortOutcomes(
    items: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome[]
): SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome[] {
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

export function buildSearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomes(
    runs: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationRun[],
    entries: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeEntryLike[]
): SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeSummary {
    const entryMap = new Map(entries.map((entry) => [entry.id, entry]));
    const outcomes: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcome[] = [];

    for (const run of runs) {
        const relatedEntries = run.entryIds
            .map((entryId) => entryMap.get(entryId))
            .filter((entry): entry is SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeEntryLike => Boolean(entry));

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

        let status: SearchLearningOpsPlaybookRecommendationOutcomeRecommendationOutcomeStatus = 'validated';
        let description = 'outcome recommendation 실행이 승인 상태와 검색 개선 지표까지 안정적으로 이어졌습니다.';

        if (readyReviewCount > 0) {
            status = 'ready_review';
            description = 'outcome recommendation 실행으로 새 AI suggestion이 준비되어 draft review/승인이 필요한 상태입니다.';
        } else if (noImprovementCount > 0) {
            status = 'needs_attention';
            description = 'outcome recommendation 실행 후에도 개선이 약해 추가 재학습 또는 rewrite 조정이 필요합니다.';
        } else if (awaitingSamplesCount > 0 || improvedCount === 0) {
            status = 'awaiting_samples';
            description = 'outcome recommendation은 실행됐지만 표본이 부족해 실제 개선 여부를 더 지켜봐야 합니다.';
        }

        outcomes.push({
            id: `playbook_recommendation_outcome_recommendation_outcome:${run.id}`,
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
