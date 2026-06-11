'use client';

import { useState } from 'react';

type SearchLearningSelectionStateParams = {
    searchLearningEntries: Array<{ id: string; status: string }>;
    searchLearningDraftEntries: Array<{ id: string }>;
    searchLearningImpactSummary: {
        topNeedsAttention: Array<{ entryId: string }>;
        topImproved: Array<{ entryId: string }>;
        topAwaitingSamples: Array<{ entryId: string }>;
    };
    searchLearningImpactClusterRollup: {
        topNeedsAttention: Array<{ entryIds: string[] }>;
        topAwaitingSamples: Array<{ entryIds: string[] }>;
    };
};

export function useSearchLearningSelectionState({
    searchLearningEntries,
    searchLearningDraftEntries,
    searchLearningImpactSummary,
    searchLearningImpactClusterRollup,
}: SearchLearningSelectionStateParams) {
    const [searchLearningMessage, setSearchLearningMessage] = useState<string | null>(null);
    const [selectedSearchLearningIds, setSelectedSearchLearningIds] = useState<string[]>([]);

    function selectSearchLearningEntries(entryIds: string[], message: string) {
        const nextIds = Array.from(new Set(entryIds.filter(Boolean))).slice(0, 24);
        setSelectedSearchLearningIds(nextIds);
        setSearchLearningMessage(message);
    }

    function toggleSearchLearningSelection(entryId: string) {
        setSelectedSearchLearningIds((current) => (
            current.includes(entryId)
                ? current.filter((id) => id !== entryId)
                : [...current, entryId]
        ));
    }

    function selectPendingSearchLearningEntries() {
        setSelectedSearchLearningIds(searchLearningEntries
            .filter((entry) => entry.status === 'pending')
            .map((entry) => entry.id)
            .slice(0, 24));
    }

    function selectDraftSearchLearningEntries() {
        setSelectedSearchLearningIds(searchLearningDraftEntries.map((entry) => entry.id).slice(0, 24));
        setSearchLearningMessage(`${Math.min(searchLearningDraftEntries.length, 24)}개의 AI draft query를 선택했습니다.`);
    }

    function selectImpactNoImprovementEntries() {
        selectSearchLearningEntries(
            searchLearningImpactSummary.topNeedsAttention.map((impact) => impact.entryId),
            `${searchLearningImpactSummary.topNeedsAttention.length}개의 개선 없음 query를 선택했습니다.`
        );
    }

    function selectImpactImprovedEntries() {
        selectSearchLearningEntries(
            searchLearningImpactSummary.topImproved.map((impact) => impact.entryId),
            `${searchLearningImpactSummary.topImproved.length}개의 개선 query를 선택했습니다.`
        );
    }

    function selectImpactAwaitingEntries() {
        selectSearchLearningEntries(
            searchLearningImpactSummary.topAwaitingSamples.map((impact) => impact.entryId),
            `${searchLearningImpactSummary.topAwaitingSamples.length}개의 샘플 대기 query를 선택했습니다.`
        );
    }

    function selectImpactClusterEntries(entryIds: string[], clusterLabel: string) {
        selectSearchLearningEntries(
            entryIds,
            `${clusterLabel} 클러스터의 ${entryIds.length}개 query를 선택했습니다.`
        );
    }

    function selectImpactClusters(
        clusters: Array<{ entryIds: string[] }>,
        message: string
    ) {
        selectSearchLearningEntries(
            clusters.flatMap((cluster) => cluster.entryIds),
            message
        );
    }

    function clearSearchLearningSelection() {
        setSelectedSearchLearningIds([]);
    }

    return {
        clearSearchLearningSelection,
        searchLearningMessage,
        selectedSearchLearningIds,
        selectDraftSearchLearningEntries,
        selectImpactAwaitingEntries,
        selectImpactClusterEntries,
        selectImpactClusters,
        selectImpactImprovedEntries,
        selectImpactNoImprovementEntries,
        selectPendingSearchLearningEntries,
        selectSearchLearningEntries,
        setSearchLearningMessage,
        setSelectedSearchLearningIds,
        toggleSearchLearningSelection,
    };
}

