'use client';

import type {
    SearchLearningOpsCompletionAction,
    SearchLearningOpsCompletionQueueItem,
    OpsChainRecommendation,
    OpsChainQueueItem,
} from './searchLearningWorkbench';
import {
    runSearchLearningRecommendationAction,
    runSearchLearningRecommendationQueueItem,
    type SearchLearningActionRunnerDeps,
} from './searchLearningActionRunners';
import type {
    SearchLearningOpsCompletionActionsSummary,
    SearchLearningOpsCompletionRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationsSummary,
    SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendationsSummary,
} from './sectionProps/types';

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
    searchLearningActionRunnerDeps: SearchLearningActionRunnerDeps;
    searchLearningOpsCompletionActions: SearchLearningOpsCompletionActionsSummary;
    searchLearningOpsCompletionRecommendations: SearchLearningOpsCompletionRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationsSummary;
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations: SearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendationsSummary;
    selectSearchLearningEntries: SelectEntries;
};

export function useSearchLearningCompletionActions({
    handleBulkGenerateSearchLearningSuggestionsForIds,
    handleBulkReviewSearchLearningForIds,
    searchLearningActionRunnerDeps,
    searchLearningOpsCompletionActions,
    searchLearningOpsCompletionRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
    searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendations,
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

    async function handleSearchLearningOpsCompletionRecommendation(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'completion recommendation',
            contextBase: 'completion_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationQueueItem(
        item: OpsChainQueueItem
    ) {
        await runSearchLearningRecommendationQueueItem({
            summary: searchLearningOpsCompletionRecommendations,
            recommendationId: item.recommendationId,
            entryIds: item.entryIds,
            title: item.title,
            noun: 'completion recommendation',
            contextBase: 'completion_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendation(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'completion recommendation outcome',
            contextBase: 'completion_recommendation_outcome',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'completion recommendation outcome recommendation outcome',
            contextBase: 'completion_recommendation_outcome_recommendation_outcome',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'completion recommendation outcome recommendation outcome recommendation',
            contextBase: 'completion_recommendation_outcome_recommendation_outcome_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation(
        recommendation: OpsChainRecommendation
    ) {
        await runSearchLearningRecommendationAction({
            recommendation,
            noun: 'completion recommendation outcome recommendation outcome recommendation recommendation',
            contextBase: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem(
        item: OpsChainQueueItem
    ) {
        await runSearchLearningRecommendationQueueItem({
            summary: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendations,
            recommendationId: item.recommendationId,
            entryIds: item.entryIds,
            title: item.title,
            noun: 'completion recommendation outcome recommendation outcome recommendation recommendation',
            contextBase: 'completion_recommendation_outcome_recommendation_outcome_recommendation_recommendation',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem(
        item: OpsChainQueueItem
    ) {
        await runSearchLearningRecommendationQueueItem({
            summary: searchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendations,
            recommendationId: item.recommendationId,
            entryIds: item.entryIds,
            title: item.title,
            noun: 'completion recommendation outcome recommendation outcome',
            contextBase: 'completion_recommendation_outcome_recommendation_outcome',
            deps: searchLearningActionRunnerDeps,
        });
    }

    async function handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem(
        item: OpsChainQueueItem
    ) {
        await runSearchLearningRecommendationQueueItem({
            summary: searchLearningOpsCompletionRecommendationOutcomeRecommendations,
            recommendationId: item.recommendationId,
            entryIds: item.entryIds,
            title: item.title,
            noun: 'completion recommendation outcome',
            contextBase: 'completion_recommendation_outcome',
            deps: searchLearningActionRunnerDeps,
        });
    }

    return {
        handleSearchLearningOpsCompletionAction,
        handleSearchLearningOpsCompletionQueueItem,
        handleSearchLearningOpsCompletionRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationQueueItem,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationQueueItem,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationOutcomeRecommendationRecommendationRecommendation,
        handleSearchLearningOpsCompletionRecommendationOutcomeRecommendationQueueItem,
        handleSearchLearningOpsCompletionRecommendationQueueItem,
    };
}
