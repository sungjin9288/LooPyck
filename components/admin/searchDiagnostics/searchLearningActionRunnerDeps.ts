'use client';

import type { SearchLearningEntry } from './types';
import type { SearchLearningActionRunnerDeps } from './searchLearningActionRunners';

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

type BuildSearchLearningActionRunnerDepsParams = {
    searchLearningEntries: SearchLearningEntry[];
    handleBulkGenerateSearchLearningSuggestionsForIds: GenerateEntries;
    handleBulkReviewSearchLearningForIds: ReviewEntries;
    selectSearchLearningEntries: SelectEntries;
};

function getReviewableEntryIds(searchLearningEntries: SearchLearningEntry[], entryIds: string[]): string[] {
    return entryIds.filter((entryId) => {
        const entry = searchLearningEntries.find((candidate) => candidate.id === entryId);
        return entry?.status === 'pending' && Boolean(entry.aiSuggestion?.suggestedQueries?.length);
    });
}

export function buildSearchLearningActionRunnerDeps({
    searchLearningEntries,
    handleBulkGenerateSearchLearningSuggestionsForIds,
    handleBulkReviewSearchLearningForIds,
    selectSearchLearningEntries,
}: BuildSearchLearningActionRunnerDepsParams): SearchLearningActionRunnerDeps {
    return {
        reviewableEntryIds: (entryIds) => getReviewableEntryIds(searchLearningEntries, entryIds),
        reviewEntries: (
            entryIds: string[],
            processingKey: string,
            successMessage: (count: number) => string,
            fallbackErrorMessage: string
        ) =>
            handleBulkReviewSearchLearningForIds(
                entryIds,
                'bulk_approve',
                processingKey,
                successMessage,
                fallbackErrorMessage
            ),
        generateEntries: handleBulkGenerateSearchLearningSuggestionsForIds,
        selectEntries: selectSearchLearningEntries,
    };
}
