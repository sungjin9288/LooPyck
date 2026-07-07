import type { SearchLearningTerminalAlertSummary } from './searchLearningTerminalAlerts.ts';
import type { SearchLearningTerminalWorkflowSummary } from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalHealth = {
    score: number;
    label: 'critical' | 'warning' | 'monitoring' | 'healthy';
    summary: string;
    blockers: string[];
    nextCheck: string;
};

function clampScore(value: number): number {
    return Math.max(0, Math.min(100, Math.round(value)));
}

export function buildSearchLearningTerminalHealth(
    workflow: SearchLearningTerminalWorkflowSummary,
    alerts: SearchLearningTerminalAlertSummary
): SearchLearningTerminalHealth {
    const rawScore =
        100
        - alerts.critical * 28
        - alerts.warning * 14
        - Math.min(workflow.reviewNow, 10) * 2
        - Math.min(workflow.retrainNow, 10) * 2
        - Math.min(workflow.sampleCollection, 10)
        + Math.min(workflow.improved, 10);
    const score = clampScore(rawScore);

    const blockers: string[] = [];
    if (workflow.reviewNow > 0) {
        blockers.push(`즉시 review ${workflow.reviewNow}건`);
    }
    if (workflow.drafts > 0) {
        blockers.push(`draft review ${workflow.drafts}건`);
    }
    if (workflow.retrainNow > 0) {
        blockers.push(`retrain ${workflow.retrainNow}건`);
    }
    if (workflow.sampleCollection > 0) {
        blockers.push(`sample collection ${workflow.sampleCollection}건`);
    }

    const label =
        score < 45
            ? 'critical'
            : score < 70
                ? 'warning'
                : workflow.observe > 0 || workflow.awaitingSamples > 0
                    ? 'monitoring'
                    : 'healthy';

    const summary =
        label === 'critical'
            ? '즉시 처리할 backlog가 커서 terminal workflow가 막히고 있습니다.'
            : label === 'warning'
                ? '운영 상태는 유지되지만 review/retrain/sample 병목을 빨리 줄여야 합니다.'
                : label === 'monitoring'
                    ? '긴급 병목은 적고, 현재는 표본/관찰 상태를 추적하는 단계입니다.'
                    : 'terminal workflow가 안정 상태이며, 새 검색 데이터 유입만 확인하면 됩니다.';

    const nextCheck =
        label === 'critical'
            ? 'Terminal Alerts와 Runbook의 첫 액션을 바로 실행하세요.'
            : label === 'warning'
                ? 'Completion Summary와 Queue를 확인해 review/retrain 우선순위를 줄이세요.'
                : label === 'monitoring'
                    ? 'observe/sample query를 실제 검색으로 다시 검증한 뒤 impact를 확인하세요.'
                    : '새 low-fit query가 쌓이는지만 주기적으로 확인하면 됩니다.';

    return {
        score,
        label,
        summary,
        blockers: blockers.slice(0, 4),
        nextCheck,
    };
}
