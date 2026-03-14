import type { SearchLearningImpactSummary } from './searchLearningImpact.ts';
import type { SearchLearningOpsCenterSummary } from './searchLearningOpsCenter.ts';
import type { SearchLearningOpsCompletionSummary } from './searchLearningOpsCompletionSummary.ts';

type SearchLearningEntryLike = {
    id: string;
    status: 'pending' | 'approved' | 'ignored';
};

type SearchLearningDraftLike = {
    id: string;
};

export type SearchLearningTerminalWorkflowActionKind =
    | 'draft_review'
    | 'review_now'
    | 'generate_now'
    | 'retrain_now'
    | 'sample_collection'
    | 'observe';

export type SearchLearningTerminalWorkflowAction = {
    id: string;
    kind: SearchLearningTerminalWorkflowActionKind;
    title: string;
    description: string;
    count: number;
    entryIds: string[];
    tone: 'emerald' | 'sky' | 'rose' | 'amber' | 'slate';
    actionLabel: string;
};

export type SearchLearningTerminalWorkflowSummary = {
    state: 'action_required' | 'sampling' | 'monitoring' | 'stable';
    pending: number;
    drafts: number;
    reviewNow: number;
    generateNow: number;
    retrainNow: number;
    sampleCollection: number;
    observe: number;
    improved: number;
    noImprovement: number;
    awaitingSamples: number;
    topActions: SearchLearningTerminalWorkflowAction[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

export function buildSearchLearningTerminalWorkflow(
    entries: SearchLearningEntryLike[],
    draftEntries: SearchLearningDraftLike[],
    opsCenter: SearchLearningOpsCenterSummary,
    completionSummary: SearchLearningOpsCompletionSummary,
    impactSummary: SearchLearningImpactSummary
): SearchLearningTerminalWorkflowSummary {
    const pending = entries.filter((entry) => entry.status === 'pending').length;
    const drafts = draftEntries.length;
    const reviewNow = opsCenter.reviewPending;
    const generateNow = opsCenter.generateNeeded;
    const retrainNow = opsCenter.retrainNeeded;
    const sampleCollection = opsCenter.sampleCollection;
    const observe = completionSummary.observe + completionSummary.validated;

    const topActions = ([
        {
            id: 'terminal_review_now',
            kind: 'review_now',
            title: 'Review Pending',
            description: '즉시 승인 가능한 query를 먼저 처리합니다.',
            count: reviewNow,
            entryIds: opsCenter.reviewPendingEntryIds,
            tone: 'emerald',
            actionLabel: 'review pending 선택',
        },
        {
            id: 'terminal_draft_review',
            kind: 'draft_review',
            title: 'Draft Review',
            description: 'AI draft가 이미 붙어 있는 pending query를 검토합니다.',
            count: drafts,
            entryIds: draftEntries.map((entry) => entry.id),
            tone: 'sky',
            actionLabel: 'draft 전체 선택',
        },
        {
            id: 'terminal_generate_now',
            kind: 'generate_now',
            title: 'Generate Needed',
            description: 'AI suggestion이 아직 없는 query에 바로 제안을 생성합니다.',
            count: generateNow,
            entryIds: opsCenter.generateNeededEntryIds,
            tone: 'sky',
            actionLabel: 'generate needed AI 제안',
        },
        {
            id: 'terminal_retrain_now',
            kind: 'retrain_now',
            title: 'Retrain Needed',
            description: '승인 후에도 개선이 없는 query를 재학습합니다.',
            count: retrainNow,
            entryIds: opsCenter.retrainNeededEntryIds,
            tone: 'rose',
            actionLabel: 'retrain AI 제안',
        },
        {
            id: 'terminal_sample_collection',
            kind: 'sample_collection',
            title: 'Sample Collection',
            description: '아직 표본이 부족한 query를 다시 관찰 대상으로 올립니다.',
            count: sampleCollection,
            entryIds: opsCenter.sampleCollectionEntryIds,
            tone: 'amber',
            actionLabel: '표본 수집 선택',
        },
        {
            id: 'terminal_observe',
            kind: 'observe',
            title: 'Observe',
            description: '개선 신호가 있는 query를 계속 관찰합니다.',
            count: observe,
            entryIds: opsCenter.validatedEntryIds,
            tone: 'slate',
            actionLabel: '개선 query 선택',
        },
    ] satisfies SearchLearningTerminalWorkflowAction[])
        .filter((action) => action.count > 0)
        .sort((left, right) => right.count - left.count)
        .slice(0, 5);

    const state =
        reviewNow > 0 || drafts > 0 || generateNow > 0 || retrainNow > 0
            ? 'action_required'
            : sampleCollection > 0
                ? 'sampling'
                : observe > 0
                    ? 'monitoring'
                    : 'stable';

    return {
        state,
        pending,
        drafts,
        reviewNow,
        generateNow,
        retrainNow,
        sampleCollection,
        observe,
        improved: impactSummary.improved,
        noImprovement: impactSummary.noImprovement,
        awaitingSamples: impactSummary.awaitingSamples,
        topActions: topActions.map((action) => ({
            ...action,
            entryIds: uniqueOrdered(action.entryIds),
        })),
    };
}
