import type { SearchLearningTerminalHealth } from './searchLearningTerminalHealth.ts';
import type { SearchLearningTerminalWorkflowSummary } from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalChecklistStatus = 'open' | 'active' | 'done';

export type SearchLearningTerminalChecklistItem = {
    id: string;
    title: string;
    description: string;
    status: SearchLearningTerminalChecklistStatus;
    count: number;
};

export type SearchLearningTerminalChecklist = {
    completed: number;
    active: number;
    open: number;
    items: SearchLearningTerminalChecklistItem[];
};

function statusForCount(count: number, activeThreshold = 0): SearchLearningTerminalChecklistStatus {
    if (count <= 0) {
        return 'done';
    }
    return count > activeThreshold ? 'active' : 'open';
}

export function buildSearchLearningTerminalChecklist(
    workflow: SearchLearningTerminalWorkflowSummary,
    health: SearchLearningTerminalHealth
): SearchLearningTerminalChecklist {
    const items: SearchLearningTerminalChecklistItem[] = [
        {
            id: 'review_now',
            title: 'Review Pending',
            description: '즉시 승인 가능한 query backlog를 먼저 비웁니다.',
            status: statusForCount(workflow.reviewNow, 3),
            count: workflow.reviewNow,
        },
        {
            id: 'draft_review',
            title: 'Draft Review',
            description: 'AI draft가 붙은 pending query를 검토해서 승인 후보로 올립니다.',
            status: statusForCount(workflow.drafts, 3),
            count: workflow.drafts,
        },
        {
            id: 'generate_now',
            title: 'Generate Suggestions',
            description: 'AI suggestion이 없는 query에 초안을 먼저 채웁니다.',
            status: statusForCount(workflow.generateNow, 4),
            count: workflow.generateNow,
        },
        {
            id: 'retrain_now',
            title: 'Retrain Weak Queries',
            description: '승인 후에도 개선이 없는 query를 다시 학습시킵니다.',
            status: statusForCount(workflow.retrainNow, 2),
            count: workflow.retrainNow,
        },
        {
            id: 'sample_collection',
            title: 'Collect Samples',
            description: '표본 부족 query를 실제 검색으로 다시 관찰합니다.',
            status: statusForCount(workflow.sampleCollection, 2),
            count: workflow.sampleCollection,
        },
        {
            id: 'observe',
            title: 'Observe Improvements',
            description: '개선 신호가 있는 query의 regression 여부만 확인합니다.',
            status: health.label === 'healthy' && workflow.observe <= 0
                ? 'done'
                : workflow.observe > 0
                    ? 'active'
                    : 'open',
            count: workflow.observe,
        },
    ];

    return {
        completed: items.filter((item) => item.status === 'done').length,
        active: items.filter((item) => item.status === 'active').length,
        open: items.filter((item) => item.status === 'open').length,
        items,
    };
}
