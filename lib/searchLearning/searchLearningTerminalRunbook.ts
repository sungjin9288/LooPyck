import type {
    SearchLearningTerminalWorkflowAction,
    SearchLearningTerminalWorkflowSummary,
} from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalRunbookStep = {
    id: string;
    title: string;
    description: string;
    tone: 'emerald' | 'sky' | 'amber' | 'rose' | 'slate';
};

export type SearchLearningTerminalRunbook = {
    state: SearchLearningTerminalWorkflowSummary['state'];
    stateLabel: string;
    headline: string;
    summary: string;
    primaryAction: SearchLearningTerminalWorkflowAction | null;
    steps: SearchLearningTerminalRunbookStep[];
    followUp: string;
};

function buildActionStep(action: SearchLearningTerminalWorkflowAction): SearchLearningTerminalRunbookStep {
    return {
        id: `primary_${action.id}`,
        title: action.title,
        description: `${action.actionLabel}로 ${action.count}개 query를 먼저 처리합니다.`,
        tone: action.tone,
    };
}

export function buildSearchLearningTerminalRunbook(
    workflow: SearchLearningTerminalWorkflowSummary
): SearchLearningTerminalRunbook {
    const primaryAction = workflow.topActions[0] ?? null;
    const stateLabel =
        workflow.state === 'action_required'
            ? 'Action Required'
            : workflow.state === 'sampling'
                ? 'Sampling'
                : workflow.state === 'monitoring'
                    ? 'Monitoring'
                    : 'Stable';

    const steps: SearchLearningTerminalRunbookStep[] = [];
    if (primaryAction) {
        steps.push(buildActionStep(primaryAction));
    }

    if (workflow.state === 'action_required') {
        if (workflow.drafts > 0 && (!primaryAction || primaryAction.kind !== 'draft_review')) {
            steps.push({
                id: 'draft_review',
                title: 'Draft Review',
                description: `AI draft ${workflow.drafts}건을 검토해서 pending query를 바로 승인 후보로 올립니다.`,
                tone: 'sky',
            });
        }
        steps.push({
            id: 'impact_check',
            title: 'Impact Check',
            description: `실제 검색 후 improved ${workflow.improved}, tuning ${workflow.noImprovement}, awaiting ${workflow.awaitingSamples} 변화를 확인합니다.`,
            tone: 'emerald',
        });
    } else if (workflow.state === 'sampling') {
        steps.push({
            id: 'sample_collection',
            title: 'Sample Collection',
            description: `표본 부족 query ${workflow.sampleCollection}건에 대해 실제 검색을 다시 쌓아 학습 근거를 확보합니다.`,
            tone: 'amber',
        });
        steps.push({
            id: 'monitor_after_sampling',
            title: 'Re-check Impact',
            description: '새 표본이 쌓인 뒤 Completion Summary와 Impact 카드에서 후속 상태를 다시 확인합니다.',
            tone: 'slate',
        });
    } else if (workflow.state === 'monitoring') {
        steps.push({
            id: 'monitoring',
            title: 'Observe Current Winners',
            description: `현재 개선 query ${workflow.improved}건을 유지하면서 validated/observe 흐름만 추적합니다.`,
            tone: 'slate',
        });
        steps.push({
            id: 'watch_regressions',
            title: 'Watch for Regressions',
            description: '새 0건/low-fit query가 다시 생기면 Terminal Command Center로 바로 복귀합니다.',
            tone: 'amber',
        });
    } else {
        steps.push({
            id: 'stable_state',
            title: 'Stable State',
            description: '지금은 긴급 triage가 없습니다. 실제 검색 데이터를 더 쌓거나 uncovered query를 큐에 추가할 때만 다시 개입하면 됩니다.',
            tone: 'slate',
        });
    }

    while (steps.length < 3) {
        steps.push({
            id: `follow_up_${steps.length + 1}`,
            title: 'Keep Terminal Loop Short',
            description: '깊은 advanced chain 대신 Terminal Command Center와 Completion 레이어만으로 운영 루프를 닫습니다.',
            tone: 'slate',
        });
    }

    const headline =
        workflow.state === 'action_required'
            ? `${primaryAction?.title ?? 'Search Learning'}를 먼저 처리해야 합니다.`
            : workflow.state === 'sampling'
                ? '지금은 표본 수집이 우선입니다.'
                : workflow.state === 'monitoring'
                    ? '현재는 관찰 중심으로 유지하면 됩니다.'
                    : '긴급한 search-learning triage 항목이 없습니다.';

    const summary =
        workflow.state === 'action_required'
            ? `review ${workflow.reviewNow}, generate ${workflow.generateNow}, retrain ${workflow.retrainNow}, drafts ${workflow.drafts}를 기준으로 가장 먼저 처리할 액션을 하나로 압축했습니다.`
            : workflow.state === 'sampling'
                ? `sample collection ${workflow.sampleCollection}건이 남아 있어 추가 검색 표본 확보가 필요합니다.`
                : workflow.state === 'monitoring'
                    ? `observe ${workflow.observe}건을 유지하면서 improved ${workflow.improved}와 no-improvement ${workflow.noImprovement}를 같이 지켜보면 됩니다.`
                    : 'pending draft, 즉시 review, 재학습, 표본 수집 항목이 모두 낮아 안정 상태입니다.';

    const followUp =
        workflow.state === 'stable'
            ? '새 low-fit/0건 query가 들어오면 Search Learning Queue로 다시 시작합니다.'
            : '액션 실행 후 실제 검색을 반복하고 Search Learning Impact / Semantic Cluster Impact에서 before/after를 확인하세요.';

    return {
        state: workflow.state,
        stateLabel,
        headline,
        summary,
        primaryAction,
        steps: steps.slice(0, 3),
        followUp,
    };
}
