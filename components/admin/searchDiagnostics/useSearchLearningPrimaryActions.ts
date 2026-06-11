'use client';

import type { User } from 'firebase/auth';
import type { SearchLearningTerminalWorkflowAction } from './searchLearningWorkbench';

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

type UseSearchLearningPrimaryActionsParams = {
    user: User | null;
    selectedSearchLearningIds: string[];
    handleBulkGenerateSearchLearningSuggestionsForIds: GenerateEntries;
    handleBulkReviewSearchLearningForIds: ReviewEntries;
    selectDraftSearchLearningEntries: () => void;
    selectSearchLearningEntries: SelectEntries;
};

export function useSearchLearningPrimaryActions({
    user,
    selectedSearchLearningIds,
    handleBulkGenerateSearchLearningSuggestionsForIds,
    handleBulkReviewSearchLearningForIds,
    selectDraftSearchLearningEntries,
    selectSearchLearningEntries,
}: UseSearchLearningPrimaryActionsParams) {
    async function handleBulkGenerateSearchLearningSuggestions() {
        if (!user || selectedSearchLearningIds.length === 0) {
            return;
        }

        await handleBulkGenerateSearchLearningSuggestionsForIds(
            selectedSearchLearningIds,
            'bulk_generate',
            (count) => `${count}개의 학습 query에 AI 제안을 생성했습니다.`,
            '검색 학습 AI 제안을 일괄 생성하지 못했습니다.'
        );
    }

    async function handleSearchLearningTerminalAction(action: SearchLearningTerminalWorkflowAction) {
        switch (action.kind) {
            case 'draft_review':
                selectDraftSearchLearningEntries();
                return;
            case 'review_now':
                selectSearchLearningEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`);
                return;
            case 'generate_now':
                await handleBulkGenerateSearchLearningSuggestionsForIds(
                    action.entryIds,
                    'terminal_generate_now',
                    (count) => `${count}개의 terminal generate query에 AI 제안을 생성했습니다.`,
                    'terminal generate query AI 제안 생성에 실패했습니다.'
                );
                return;
            case 'retrain_now':
                await handleBulkGenerateSearchLearningSuggestionsForIds(
                    action.entryIds,
                    'terminal_retrain_now',
                    (count) => `${count}개의 terminal retrain query에 AI 제안을 생성했습니다.`,
                    'terminal retrain query AI 제안 생성에 실패했습니다.'
                );
                return;
            case 'sample_collection':
                selectSearchLearningEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`);
                return;
            default:
                selectSearchLearningEntries(action.entryIds, `${action.title} ${action.count}개 query를 선택했습니다.`);
        }
    }

    async function handleBulkReviewSearchLearning(action: 'bulk_approve' | 'bulk_ignore') {
        if (!user || selectedSearchLearningIds.length === 0) {
            return;
        }

        await handleBulkReviewSearchLearningForIds(
            selectedSearchLearningIds,
            action,
            action,
            action === 'bulk_approve'
                ? (count) => `${count}개의 학습 query를 일괄 승인했습니다.`
                : `${selectedSearchLearningIds.length}개의 학습 query를 일괄 보류 처리했습니다.`,
            '검색 학습 일괄 검토 저장에 실패했습니다.'
        );
    }

    return {
        handleBulkGenerateSearchLearningSuggestions,
        handleBulkReviewSearchLearning,
        handleSearchLearningTerminalAction,
    };
}
