import type {
    SearchLearningTerminalWorkflowAction,
    SearchLearningTerminalWorkflowSummary,
} from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalAlertSeverity = 'critical' | 'warning' | 'info' | 'success';

export type SearchLearningTerminalAlert = {
    id: string;
    severity: SearchLearningTerminalAlertSeverity;
    title: string;
    description: string;
    count: number;
    action: SearchLearningTerminalWorkflowAction | null;
};

export type SearchLearningTerminalAlertSummary = {
    total: number;
    critical: number;
    warning: number;
    info: number;
    success: number;
    topAlerts: SearchLearningTerminalAlert[];
};

function findAction(
    workflow: SearchLearningTerminalWorkflowSummary,
    kind: SearchLearningTerminalWorkflowAction['kind']
): SearchLearningTerminalWorkflowAction | null {
    return workflow.topActions.find((action) => action.kind === kind) ?? null;
}

export function buildSearchLearningTerminalAlerts(
    workflow: SearchLearningTerminalWorkflowSummary
): SearchLearningTerminalAlertSummary {
    const alerts: SearchLearningTerminalAlert[] = [];

    if (workflow.reviewNow > 0) {
        alerts.push({
            id: 'review_now',
            severity: 'critical',
            title: 'Immediate Review Backlog',
            description: `즉시 승인 가능한 query ${workflow.reviewNow}건이 남아 있습니다. terminal workflow를 늦추는 가장 직접적인 병목입니다.`,
            count: workflow.reviewNow,
            action: findAction(workflow, 'review_now'),
        });
    }

    if (workflow.drafts > 0) {
        alerts.push({
            id: 'draft_review',
            severity: workflow.drafts >= 5 ? 'critical' : 'warning',
            title: 'Draft Review Pending',
            description: `AI draft ${workflow.drafts}건이 승인 대기 중입니다. draft review를 미루면 review queue가 계속 커집니다.`,
            count: workflow.drafts,
            action: findAction(workflow, 'draft_review'),
        });
    }

    if (workflow.retrainNow > 0) {
        alerts.push({
            id: 'retrain_now',
            severity: 'warning',
            title: 'Retrain Candidates',
            description: `개선이 없던 query ${workflow.retrainNow}건이 재학습 대기 중입니다. retrain을 돌려야 impact가 다시 올라갑니다.`,
            count: workflow.retrainNow,
            action: findAction(workflow, 'retrain_now'),
        });
    }

    if (workflow.generateNow > 0) {
        alerts.push({
            id: 'generate_now',
            severity: 'info',
            title: 'Missing AI Suggestions',
            description: `AI suggestion이 아직 없는 query ${workflow.generateNow}건이 남아 있습니다. generate 단계로 초안을 먼저 채우세요.`,
            count: workflow.generateNow,
            action: findAction(workflow, 'generate_now'),
        });
    }

    if (workflow.sampleCollection > 0) {
        alerts.push({
            id: 'sample_collection',
            severity: 'warning',
            title: 'Sample Collection Needed',
            description: `표본 부족 query ${workflow.sampleCollection}건은 추가 검색이 더 필요합니다. sample collection 없이는 승인 효과를 판단하기 어렵습니다.`,
            count: workflow.sampleCollection,
            action: findAction(workflow, 'sample_collection'),
        });
    }

    if (workflow.observe > 0) {
        alerts.push({
            id: 'observe',
            severity: 'info',
            title: 'Monitoring in Progress',
            description: `개선 신호가 있는 query ${workflow.observe}건을 관찰 중입니다. regression이 없는지만 확인하면 됩니다.`,
            count: workflow.observe,
            action: findAction(workflow, 'observe'),
        });
    }

    if (alerts.length === 0) {
        alerts.push({
            id: 'stable',
            severity: 'success',
            title: 'Terminal Workflow Stable',
            description: '긴급 review, draft backlog, retrain, sample collection 항목이 없어 현재 terminal workflow는 안정 상태입니다.',
            count: workflow.improved,
            action: null,
        });
    }

    const severityWeight: Record<SearchLearningTerminalAlertSeverity, number> = {
        critical: 4,
        warning: 3,
        info: 2,
        success: 1,
    };

    const sorted = alerts
        .slice()
        .sort((left, right) => {
            if (severityWeight[right.severity] !== severityWeight[left.severity]) {
                return severityWeight[right.severity] - severityWeight[left.severity];
            }
            return right.count - left.count;
        })
        .slice(0, 4);

    return {
        total: alerts.length,
        critical: alerts.filter((alert) => alert.severity === 'critical').length,
        warning: alerts.filter((alert) => alert.severity === 'warning').length,
        info: alerts.filter((alert) => alert.severity === 'info').length,
        success: alerts.filter((alert) => alert.severity === 'success').length,
        topAlerts: sorted,
    };
}
