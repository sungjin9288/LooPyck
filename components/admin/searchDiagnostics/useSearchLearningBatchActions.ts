'use client';

import type {
    SearchLearningActivityOpsQueueItem,
    SearchLearningOpsCenterItem,
    SearchLearningOpsPlaybook,
} from './searchLearningWorkbench';
import type {
    SearchLearningImpactClusterRollup,
    SearchLearningImpactSummary,
    SearchLearningRewriteSourceActionDraftSummary,
    SearchLearningRewriteSourceActionReviewSummary,
    SearchLearningRewriteSourceApprovalQueueSummary,
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

type UseSearchLearningBatchActionsParams = {
    handleBulkGenerateSearchLearningSuggestionsForIds: GenerateEntries;
    handleBulkReviewSearchLearningForIds: ReviewEntries;
    searchLearningImpactClusterRollup: SearchLearningImpactClusterRollup;
    searchLearningImpactSummary: SearchLearningImpactSummary;
    searchLearningRewriteSourceActionDraftSummary: SearchLearningRewriteSourceActionDraftSummary;
    searchLearningRewriteSourceActionReviewSummary: SearchLearningRewriteSourceActionReviewSummary;
    searchLearningRewriteSourceApprovalQueueSummary: SearchLearningRewriteSourceApprovalQueueSummary;
    selectSearchLearningEntries: SelectEntries;
};

export function useSearchLearningBatchActions({
    handleBulkGenerateSearchLearningSuggestionsForIds,
    handleBulkReviewSearchLearningForIds,
    searchLearningImpactClusterRollup,
    searchLearningImpactSummary,
    searchLearningRewriteSourceActionDraftSummary,
    searchLearningRewriteSourceActionReviewSummary,
    searchLearningRewriteSourceApprovalQueueSummary,
    selectSearchLearningEntries,
}: UseSearchLearningBatchActionsParams) {
    async function handleGenerateSourceRollbackDraftSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningRewriteSourceActionDraftSummary.topRollbackRegenerate.flatMap((draft) => draft.entryIds),
            'source_ops_rollback_generate',
            (count) => `${count}개의 rollback source ops query에 AI 제안을 재생성했습니다.`,
            'rollback source ops query AI 제안을 재생성하지 못했습니다.'
        );
    }

    async function handleGenerateSourceActionReviewSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningRewriteSourceActionReviewSummary.topGenerationNeeded.flatMap((entry) => entry.generationNeededEntryIds),
            'source_action_review_generate',
            (count) => `${count}개의 source action review query에 AI 제안을 생성했습니다.`,
            'source action review query AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleApproveSourceActionReviewSuggestions() {
        await handleBulkReviewSearchLearningForIds(
            searchLearningRewriteSourceActionReviewSummary.topReadyReview.flatMap((entry) => entry.readyReviewEntryIds),
            'bulk_approve',
            'source_action_review_approve',
            (count) => `${count}개의 source action review query를 일괄 승인했습니다.`,
            'source action review 승인에 실패했습니다.'
        );
    }

    async function handleGenerateSourceApprovalRollbackSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningRewriteSourceApprovalQueueSummary.topRollbackCandidates.flatMap((entry) => entry.primaryEntryIds),
            'source_approval_rollback_generate',
            (count) => `${count}개의 rollback approval 후보 query에 AI 제안을 생성했습니다.`,
            'rollback approval 후보 query AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleApproveSourceApprovalReviewPending() {
        await handleBulkReviewSearchLearningForIds(
            searchLearningRewriteSourceApprovalQueueSummary.topReviewPending.flatMap((entry) => entry.primaryEntryIds),
            'bulk_approve',
            'source_approval_review_approve',
            (count) => `${count}개의 review pending source approval query를 승인했습니다.`,
            'review pending source approval 승인에 실패했습니다.'
        );
    }

    async function handleGenerateImpactNoImprovementSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactSummary.topNeedsAttention.map((impact) => impact.entryId),
            'impact_no_improvement_generate',
            (count) => `${count}개의 개선 없음 query에 재학습 AI 제안을 생성했습니다.`,
            '개선 없음 query 재학습 AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleGenerateImpactAwaitingSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactSummary.topAwaitingSamples.map((impact) => impact.entryId),
            'impact_awaiting_generate',
            (count) => `${count}개의 샘플 대기 query에 AI 제안을 생성했습니다.`,
            '샘플 대기 query AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleGenerateImpactNoImprovementClusterSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactClusterRollup.topNeedsAttention.flatMap((cluster) => cluster.entryIds),
            'impact_cluster_no_improvement_generate',
            (count) => `${count}개의 개선 없음 클러스터 query에 재학습 AI 제안을 생성했습니다.`,
            '개선 없음 클러스터 재학습 AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleGenerateImpactAwaitingClusterSuggestions() {
        await handleBulkGenerateSearchLearningSuggestionsForIds(
            searchLearningImpactClusterRollup.topAwaitingSamples.flatMap((cluster) => cluster.entryIds),
            'impact_cluster_awaiting_generate',
            (count) => `${count}개의 샘플 대기 클러스터 query에 AI 제안을 생성했습니다.`,
            '샘플 대기 클러스터 AI 제안을 생성하지 못했습니다.'
        );
    }

    async function handleActivityOpsQueueItemAction(item: SearchLearningActivityOpsQueueItem) {
        if (item.action === 'review_pending') {
            await handleBulkReviewSearchLearningForIds(
                item.entryIds,
                'bulk_approve',
                `activity_ops_review_${item.id}`,
                (count) => `${count}개의 activity review query를 승인했습니다.`,
                'activity review query 승인에 실패했습니다.'
            );
            return;
        }

        if (item.action === 'generate_needed') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                item.entryIds,
                `activity_ops_generate_${item.id}`,
                (count) => `${count}개의 activity query에 AI 제안을 생성했습니다.`,
                'activity query AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleActivityFollowupAction(
        entryIds: string[],
        action: 'retrain_needed' | 'awaiting_samples' | 'validated',
        title: string
    ) {
        if (action === 'retrain_needed') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                entryIds,
                `activity_followup_retrain_${title}`,
                (count) => `${count}개의 follow-up query에 AI 제안을 생성했습니다.`,
                'follow-up query AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(entryIds, `${title}의 ${entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsCenterAction(item: SearchLearningOpsCenterItem) {
        if (item.action === 'approve_now') {
            await handleBulkReviewSearchLearningForIds(
                item.entryIds,
                'bulk_approve',
                `ops_center_review_${item.id}`,
                (count) => `${count}개의 ops center query를 즉시 승인했습니다.`,
                'ops center query 즉시 승인에 실패했습니다.'
            );
            return;
        }

        if (item.action === 'generate_now' || item.action === 'retrain_now') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                item.entryIds,
                `ops_center_generate_${item.id}`,
                (count) => `${count}개의 ops center query에 AI 제안을 생성했습니다.`,
                'ops center query AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(item.entryIds, `${item.title}의 ${item.entryIds.length}개 query를 선택했습니다.`);
    }

    async function handleSearchLearningOpsPlaybookAction(playbook: SearchLearningOpsPlaybook) {
        if (playbook.action === 'approve_batch') {
            await handleBulkReviewSearchLearningForIds(
                playbook.entryIds,
                'bulk_approve',
                `ops_playbook_approve_${playbook.id}`,
                (count) => `${count}개의 search learning playbook query를 승인했습니다.`,
                'search learning playbook 승인에 실패했습니다.'
            );
            return;
        }

        if (playbook.action === 'generate_batch' || playbook.action === 'retrain_batch') {
            await handleBulkGenerateSearchLearningSuggestionsForIds(
                playbook.entryIds,
                `ops_playbook_generate_${playbook.id}`,
                (count) => `${count}개의 search learning playbook query에 AI 제안을 생성했습니다.`,
                'search learning playbook AI 제안 생성에 실패했습니다.'
            );
            return;
        }

        selectSearchLearningEntries(playbook.entryIds, `${playbook.title}의 ${playbook.entryIds.length}개 query를 선택했습니다.`);
    }

    return {
        handleActivityFollowupAction,
        handleActivityOpsQueueItemAction,
        handleApproveSourceActionReviewSuggestions,
        handleApproveSourceApprovalReviewPending,
        handleGenerateImpactAwaitingClusterSuggestions,
        handleGenerateImpactAwaitingSuggestions,
        handleGenerateImpactNoImprovementClusterSuggestions,
        handleGenerateImpactNoImprovementSuggestions,
        handleGenerateSourceActionReviewSuggestions,
        handleGenerateSourceApprovalRollbackSuggestions,
        handleGenerateSourceRollbackDraftSuggestions,
        handleSearchLearningOpsCenterAction,
        handleSearchLearningOpsPlaybookAction,
    };
}
