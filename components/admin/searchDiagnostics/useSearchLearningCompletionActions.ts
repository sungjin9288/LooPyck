'use client';

import type {
    SearchLearningOpsCompletionAction,
    SearchLearningOpsCompletionQueueItem,
} from './searchLearningWorkbench';
import type { SearchLearningOpsCompletionActionsSummary } from './sectionProps/types';

type GenerateEntries = (
    entryIds: string[],
    processingKey: string,
    successMessage: (count: number) => string,
    fallbackErrorMessage: string
) => Promise<void>;

type ReviewEntries = (
    entryIds: string[],
    action: 'bulk_approve' | 'bulk_ignore',
    processingKey: string,
    successMessage: string | ((count: number) => string),
    fallbackErrorMessage: string
) => Promise<void>;

type SelectEntries = (entryIds: string[], message: string) => void;

type UseSearchLearningCompletionActionsParams = {
    handleBulkGenerateSearchLearningSuggestionsForIds: GenerateEntries;
    handleBulkReviewSearchLearningForIds: ReviewEntries;
    searchLearningOpsCompletionActions: SearchLearningOpsCompletionActionsSummary;
    selectSearchLearningEntries: SelectEntries;
};

/**
 * Root completion-lane handlers used by SearchLearningCompletionSections.
 * The deeper per-level chain handlers live in useOpsChainActions.ts.
 */
export function useSearchLearningCompletionActions({
    handleBulkGenerateSearchLearningSuggestionsForIds,
    handleBulkReviewSearchLearningForIds,
    searchLearningOpsCompletionActions,
    selectSearchLearningEntries,
}: UseSearchLearningCompletionActionsParams) {
    async function handleSearchLearningOpsCompletionAction(action: SearchLearningOpsCompletionAction) {
        switch (action.type) {
            case 'execute_now':
                await handleBulkGenerateSearchLearningSuggestionsForIds(
                    action.entryIds,
                    'completion_execute_generate',
                    (count) => `${count}개의 completion execute query에 AI 제안을 생성했습니다.`,
                    'completion execute query AI 제안을 생성하지 못했습니다.'
                );
                return;
            case 'review_now':
                await handleBulkReviewSearchLearningForIds(
                    action.entryIds,
                    'bulk_approve',
                    'completion_review_approve',
                    (count) => `${count}개의 completion review query를 승인했습니다.`,
                    'completion review 승인에 실패했습니다.'
                );
                return;
            case 'collect_samples':
                selectSearchLearningEntries(action.entryIds, `${action.title}의 ${action.entryIds.length}개 query를 선택했습니다.`);
                return;
            default:
                selectSearchLearningEntries(action.entryIds, `${action.title}의 ${action.entryIds.length}개 개선 query를 선택했습니다.`);
        }
    }

    async function handleSearchLearningOpsCompletionQueueItem(item: SearchLearningOpsCompletionQueueItem) {
        const action = searchLearningOpsCompletionActions.topActions.find((candidate) => candidate.id === item.actionId);
        if (action) {
            await handleSearchLearningOpsCompletionAction(action);
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`);
    }

    return {
        handleSearchLearningOpsCompletionAction,
        handleSearchLearningOpsCompletionQueueItem,
    };
}
