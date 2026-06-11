'use client';

import type { User } from 'firebase/auth';
import type { Dispatch, SetStateAction } from 'react';
import { requestSearchLearningMutation } from './searchLearningApi';
import {
    updateSearchLearningDataState,
    updateSingleSearchLearningEntryState,
} from './searchLearningDataUpdates';
import type {
    DiagnosticsResponse,
    SearchLearningActivityEvent,
    SearchLearningEntry,
} from './types';

type UseSearchLearningMutationsParams = {
    user: User | null;
    data: DiagnosticsResponse | null;
    setData: Dispatch<SetStateAction<DiagnosticsResponse | null>>;
    setProcessingSearchLearningId: Dispatch<SetStateAction<string | null>>;
    setSearchLearningMessage: Dispatch<SetStateAction<string | null>>;
    setSelectedSearchLearningIds: Dispatch<SetStateAction<string[]>>;
};

export function useSearchLearningMutations({
    user,
    data,
    setData,
    setProcessingSearchLearningId,
    setSearchLearningMessage,
    setSelectedSearchLearningIds,
}: UseSearchLearningMutationsParams) {
    function updateSearchLearningData(updatedEntries: SearchLearningEntry[], activity?: SearchLearningActivityEvent | null) {
        setData((current) => updateSearchLearningDataState(current, updatedEntries, activity));
    }

    function updateSearchLearningEntry(entryId: string, nextEntry: SearchLearningEntry | null, activity?: SearchLearningActivityEvent | null) {
        setData((current) => updateSingleSearchLearningEntryState(current, entryId, nextEntry, activity));
    }

    async function handleBulkGenerateSearchLearningSuggestionsForIds(
        entryIds: string[],
        processingKey: string,
        successMessage: (count: number) => string,
        fallbackErrorMessage: string
    ) {
        if (!user || entryIds.length === 0) {
            return;
        }

        setProcessingSearchLearningId(processingKey);
        setSearchLearningMessage(null);
        try {
            const payload = await requestSearchLearningMutation({
                user,
                method: 'POST',
                body: {
                    action: 'bulk_generate',
                    entryIds,
                    context: processingKey,
                },
                fallbackErrorMessage,
            });

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            updateSearchLearningData(updatedEntries, payload.activity as SearchLearningActivityEvent | null);
            setSearchLearningMessage(successMessage(updatedEntries.length));
        } catch (bulkError) {
            setSearchLearningMessage(bulkError instanceof Error ? bulkError.message : fallbackErrorMessage);
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleBulkReviewSearchLearningForIds(
        entryIds: string[],
        action: 'bulk_approve' | 'bulk_ignore',
        processingKey: string,
        successMessage: string | ((count: number) => string),
        fallbackErrorMessage: string
    ) {
        if (!user || entryIds.length === 0) {
            return;
        }

        setProcessingSearchLearningId(processingKey);
        setSearchLearningMessage(null);
        try {
            const payload = await requestSearchLearningMutation({
                user,
                method: 'PATCH',
                body: {
                    action,
                    entryIds,
                    context: processingKey,
                },
                fallbackErrorMessage,
            });

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            setData((current) => updateSearchLearningDataState(current, updatedEntries));
            setSelectedSearchLearningIds((current) => current.filter((id) => !entryIds.includes(id)));
            setSearchLearningMessage(typeof successMessage === 'function' ? successMessage(updatedEntries.length) : successMessage);
        } catch (bulkError) {
            setSearchLearningMessage(bulkError instanceof Error ? bulkError.message : fallbackErrorMessage);
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleGenerateSearchLearningSuggestion(entryId: string) {
        if (!user) {
            return;
        }

        setProcessingSearchLearningId(entryId);
        setSearchLearningMessage(null);
        try {
            const payload = await requestSearchLearningMutation({
                user,
                method: 'POST',
                body: {
                    action: 'generate',
                    entryId,
                    context: 'single_generate',
                },
                fallbackErrorMessage: 'AI 검색 제안 생성에 실패했습니다.',
            });

            updateSearchLearningEntry(
                entryId,
                payload.entry || null,
                payload.activity as SearchLearningActivityEvent | null
            );
            setSearchLearningMessage('AI 검색어 제안을 생성했습니다.');
        } catch (suggestionError) {
            setSearchLearningMessage(suggestionError instanceof Error ? suggestionError.message : 'AI 검색 제안 생성에 실패했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleSeedCoverageQueries() {
        if (!user || !data || data.searchQualityCoverage.uncoveredQueries.length === 0) {
            return;
        }

        setProcessingSearchLearningId('seed_queries');
        setSearchLearningMessage(null);
        try {
            const payload = await requestSearchLearningMutation({
                user,
                method: 'POST',
                body: {
                    action: 'seed_queries',
                    queries: data.searchQualityCoverage.uncoveredQueries.map((entry) => entry.query),
                    context: 'coverage_seed',
                },
                fallbackErrorMessage: '미커버 query를 학습 큐에 추가하지 못했습니다.',
            });

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            updateSearchLearningData(updatedEntries, payload.activity as SearchLearningActivityEvent | null);
            setSearchLearningMessage(`${updatedEntries.length}개의 미커버 query를 학습 큐에 추가했습니다.`);
        } catch (seedError) {
            setSearchLearningMessage(seedError instanceof Error ? seedError.message : '미커버 query를 학습 큐에 추가하지 못했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleSeedCoverageClusterQueries(clusterId: string, clusterLabel: string, queries: string[]) {
        if (!user || queries.length === 0) {
            return;
        }

        setProcessingSearchLearningId(`seed_cluster_${clusterId}`);
        setSearchLearningMessage(null);
        try {
            const payload = await requestSearchLearningMutation({
                user,
                method: 'POST',
                body: {
                    action: 'seed_queries',
                    queries,
                    context: `coverage_cluster_seed:${clusterId}`,
                },
                fallbackErrorMessage: `${clusterLabel} query를 학습 큐에 추가하지 못했습니다.`,
            });

            const updatedEntries = Array.isArray(payload.entries) ? payload.entries as SearchLearningEntry[] : [];
            updateSearchLearningData(updatedEntries, payload.activity as SearchLearningActivityEvent | null);
            setSearchLearningMessage(`${clusterLabel} 클러스터의 ${updatedEntries.length}개 query를 학습 큐에 추가했습니다.`);
        } catch (seedError) {
            setSearchLearningMessage(seedError instanceof Error ? seedError.message : `${clusterLabel} query를 학습 큐에 추가하지 못했습니다.`);
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    async function handleReviewSearchLearningEntry(entry: SearchLearningEntry, action: 'approve' | 'ignore') {
        if (!user) {
            return;
        }

        setProcessingSearchLearningId(entry.id);
        setSearchLearningMessage(null);
        try {
            const approvedQueries = action === 'approve'
                ? (entry.aiSuggestion?.suggestedQueries.length
                    ? entry.aiSuggestion.suggestedQueries
                    : entry.suggestedQueries)
                : [];
            const payload = await requestSearchLearningMutation({
                user,
                method: 'PATCH',
                body: {
                    action,
                    entryId: entry.id,
                    approvedQueries,
                    context: `single_review:${action}`,
                },
                fallbackErrorMessage: '검색 학습 검토 저장에 실패했습니다.',
            });

            updateSearchLearningEntry(
                entry.id,
                payload.entry || null,
                payload.activity as SearchLearningActivityEvent | null
            );
            setSelectedSearchLearningIds((current) => current.filter((id) => id !== entry.id));
            setSearchLearningMessage(action === 'approve' ? '학습 query를 승인했습니다.' : '학습 query를 보류 처리했습니다.');
        } catch (reviewError) {
            setSearchLearningMessage(reviewError instanceof Error ? reviewError.message : '검색 학습 검토 저장에 실패했습니다.');
        } finally {
            setProcessingSearchLearningId(null);
        }
    }

    return {
        handleBulkGenerateSearchLearningSuggestionsForIds,
        handleBulkReviewSearchLearningForIds,
        handleGenerateSearchLearningSuggestion,
        handleReviewSearchLearningEntry,
        handleSeedCoverageClusterQueries,
        handleSeedCoverageQueries,
    };
}
