import type { SearchLearningOpsCenterSummary } from './searchLearningOpsCenter.ts';

export type SearchLearningOpsPlaybookAction =
    | 'approve_batch'
    | 'retrain_batch'
    | 'generate_batch'
    | 'sample_batch';

export type SearchLearningOpsPlaybook = {
    id: string;
    action: SearchLearningOpsPlaybookAction;
    title: string;
    description: string;
    reason: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    entryIds: string[];
    queryCount: number;
    actionLabel: string;
};

export type SearchLearningOpsPlaybookSummary = {
    readyBatches: number;
    urgentBatches: number;
    stableValidated: number;
    topPlaybooks: SearchLearningOpsPlaybook[];
};

function buildPlaybook(
    id: string,
    action: SearchLearningOpsPlaybookAction,
    priority: 'critical' | 'high' | 'medium' | 'low',
    entryIds: string[],
    title: string,
    description: string,
    reason: string,
    actionLabel: string
): SearchLearningOpsPlaybook | null {
    if (entryIds.length === 0) {
        return null;
    }

    return {
        id,
        action,
        title,
        description,
        reason,
        priority,
        entryIds,
        queryCount: entryIds.length,
        actionLabel,
    };
}

function priorityWeight(priority: SearchLearningOpsPlaybook['priority']): number {
    switch (priority) {
        case 'critical':
            return 4;
        case 'high':
            return 3;
        case 'medium':
            return 2;
        default:
            return 1;
    }
}

export function buildSearchLearningOpsPlaybooks(
    opsCenter: SearchLearningOpsCenterSummary
): SearchLearningOpsPlaybookSummary {
    const playbooks = [
        buildPlaybook(
            'approve',
            'approve_batch',
            opsCenter.reviewPending > 0 ? 'critical' : 'low',
            opsCenter.reviewPendingEntryIds,
            'Review Pending Batch',
            'AI suggestion이 이미 생성된 pending query를 한 번에 승인해서 rewrite/impact 루프로 넘깁니다.',
            `${opsCenter.reviewPending}개의 review pending activity가 대기 중입니다.`,
            '즉시 승인'
        ),
        buildPlaybook(
            'retrain',
            'retrain_batch',
            opsCenter.retrainNeeded > 0 ? 'high' : 'low',
            opsCenter.retrainNeededEntryIds,
            'Retrain Batch',
            '승인 후에도 개선이 없는 query에 재학습 AI 제안을 한 번에 생성합니다.',
            `${opsCenter.retrainNeeded}개의 follow-up이 재학습을 요구합니다.`,
            '재학습 AI 제안'
        ),
        buildPlaybook(
            'generate',
            'generate_batch',
            opsCenter.generateNeeded > 0 ? 'high' : 'low',
            opsCenter.generateNeededEntryIds,
            'Generate Needed Batch',
            'seed된 query 중 AI suggestion이 없는 항목을 한 번에 생성합니다.',
            `${opsCenter.generateNeeded}개의 seed query에 suggestion 생성이 필요합니다.`,
            '즉시 AI 제안'
        ),
        buildPlaybook(
            'samples',
            'sample_batch',
            opsCenter.sampleCollection > 0 ? 'medium' : 'low',
            opsCenter.sampleCollectionEntryIds,
            'Sample Collection Batch',
            '승인된 query의 효과 측정을 위해 추가 검색 표본이 필요한 항목을 한 번에 triage합니다.',
            `${opsCenter.sampleCollection}개의 query가 추가 표본을 기다리고 있습니다.`,
            '표본 수집 대상 선택'
        ),
    ].filter((playbook): playbook is SearchLearningOpsPlaybook => Boolean(playbook));

    const sorted = [...playbooks].sort((left, right) => {
        const weightDiff = priorityWeight(right.priority) - priorityWeight(left.priority);
        if (weightDiff !== 0) {
            return weightDiff;
        }
        return right.queryCount - left.queryCount;
    });

    return {
        readyBatches: playbooks.length,
        urgentBatches: playbooks.filter((playbook) => playbook.priority === 'critical' || playbook.priority === 'high').length,
        stableValidated: opsCenter.validated,
        topPlaybooks: sorted.slice(0, 4),
    };
}
