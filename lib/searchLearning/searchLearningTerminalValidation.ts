import type { SearchLearningTerminalCoverage } from './searchLearningTerminalCoverage.ts';
import type { SearchLearningTerminalHandoff } from './searchLearningTerminalHandoff.ts';
import type { SearchLearningTerminalOverview } from './searchLearningTerminalOverview.ts';
import type { SearchLearningTerminalWorkflowAction, SearchLearningTerminalWorkflowSummary } from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalValidationStatus = 'ready' | 'attention' | 'pending';
export type SearchLearningTerminalValidationTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'slate';

export type SearchLearningTerminalValidationItem = {
    id: string;
    label: string;
    title: string;
    summary: string;
    status: SearchLearningTerminalValidationStatus;
    tone: SearchLearningTerminalValidationTone;
    action: SearchLearningTerminalWorkflowAction | null;
};

export type SearchLearningTerminalValidation = {
    status: SearchLearningTerminalValidationStatus;
    headline: string;
    nextStep: string;
    docPath: string;
    checks: {
        total: number;
        ready: number;
        attention: number;
        pending: number;
    };
    items: SearchLearningTerminalValidationItem[];
};

type SearchLearningTerminalValidationInputs = {
    trackedSearches: number;
    observedSources: number;
    productOpens: number;
};

function countStatus(
    items: SearchLearningTerminalValidationItem[],
    status: SearchLearningTerminalValidationStatus
): number {
    return items.filter((item) => item.status === status).length;
}

function buildSurfaceItem(
    overview: SearchLearningTerminalOverview,
    handoff: SearchLearningTerminalHandoff
): SearchLearningTerminalValidationItem {
    return {
        id: 'surface',
        label: 'surface',
        title: 'Terminal Surface Ready',
        summary: `${overview.status} 상태와 handoff ${handoff.current.label}/${handoff.next.label}/${handoff.followUp.label} 구성이 준비되어 있습니다.`,
        status: 'ready',
        tone: 'emerald',
        action: handoff.current.action,
    };
}

function buildSearchSignalItem(
    inputs: SearchLearningTerminalValidationInputs
): SearchLearningTerminalValidationItem {
    const totalSignals = inputs.trackedSearches + inputs.observedSources + inputs.productOpens;
    const status: SearchLearningTerminalValidationStatus = totalSignals > 0 ? 'ready' : 'pending';

    return {
        id: 'search_signals',
        label: 'signals',
        title: 'Search Signals Captured',
        summary:
            totalSignals > 0
                ? `tracked ${inputs.trackedSearches}, sources ${inputs.observedSources}, opens ${inputs.productOpens} 기준으로 실제 검색 신호가 들어왔습니다.`
                : 'production redeploy 후 대표 패션 검색어를 다시 실행해 tracked search / source / product open 신호를 만들어야 합니다.',
        status,
        tone: totalSignals > 0 ? 'emerald' : 'amber',
        action: null,
    };
}

function buildCoverageItem(
    coverage: SearchLearningTerminalCoverage,
    handoff: SearchLearningTerminalHandoff
): SearchLearningTerminalValidationItem {
    const status: SearchLearningTerminalValidationStatus =
        coverage.qualityLabel === 'strong'
            ? 'ready'
            : coverage.qualityLabel === 'mixed'
                ? 'pending'
                : 'attention';

    return {
        id: 'coverage',
        label: 'coverage',
        title: 'Coverage Validation',
        summary:
            coverage.qualityLabel === 'strong'
                ? `coverage score ${coverage.coverageScore} 기준으로 curated query 공백이 크지 않습니다.`
                : `coverage score ${coverage.coverageScore}, uncovered query ${coverage.uncoveredQueries}, uncovered cluster ${coverage.uncoveredClusters}를 먼저 줄여야 합니다.`,
        status,
        tone:
            status === 'ready'
                ? 'emerald'
                : status === 'attention'
                    ? 'rose'
                    : 'amber',
        action: handoff.current.action,
    };
}

function buildWorkflowItem(
    workflow: SearchLearningTerminalWorkflowSummary
): SearchLearningTerminalValidationItem {
    const status: SearchLearningTerminalValidationStatus =
        workflow.state === 'action_required'
            ? 'attention'
            : workflow.state === 'sampling'
                ? 'pending'
                : 'ready';

    return {
        id: 'workflow',
        label: 'workflow',
        title: 'Workflow Loop',
        summary:
            workflow.state === 'action_required'
                ? `draft ${workflow.drafts}, review ${workflow.reviewNow}, generate ${workflow.generateNow}, retrain ${workflow.retrainNow}를 바로 처리해야 합니다.`
                : workflow.state === 'sampling'
                    ? `sample collection ${workflow.sampleCollection}건이 남아 있어 실제 검색 표본을 더 쌓아야 합니다.`
                    : workflow.state === 'monitoring'
                        ? `observe ${workflow.observe}, improved ${workflow.improved} 기준으로 현재는 관찰 중심입니다.`
                        : '긴급 triage가 없어 terminal workflow가 안정 상태입니다.',
        status,
        tone:
            status === 'ready'
                ? 'emerald'
                : status === 'attention'
                    ? 'rose'
                    : 'amber',
        action: workflow.topActions[0] ?? null,
    };
}

function buildImpactItem(
    workflow: SearchLearningTerminalWorkflowSummary,
    handoff: SearchLearningTerminalHandoff
): SearchLearningTerminalValidationItem {
    const totalImpactSignals = workflow.improved + workflow.noImprovement + workflow.awaitingSamples;
    const status: SearchLearningTerminalValidationStatus =
        totalImpactSignals === 0
            ? 'pending'
            : workflow.noImprovement > workflow.improved
                ? 'attention'
                : 'ready';

    return {
        id: 'impact',
        label: 'impact',
        title: 'Impact Tracking',
        summary:
            totalImpactSignals === 0
                ? 'approval 이후 before/after 신호가 아직 없어 실제 검색 반복이 더 필요합니다.'
                : `improved ${workflow.improved}, needs tuning ${workflow.noImprovement}, awaiting ${workflow.awaitingSamples} 기준으로 impact 추적이 살아 있습니다.`,
        status,
        tone:
            status === 'ready'
                ? 'emerald'
                : status === 'attention'
                    ? 'rose'
                    : 'amber',
        action: handoff.next.action,
    };
}

export function buildSearchLearningTerminalValidation(
    overview: SearchLearningTerminalOverview,
    handoff: SearchLearningTerminalHandoff,
    workflow: SearchLearningTerminalWorkflowSummary,
    coverage: SearchLearningTerminalCoverage,
    inputs: SearchLearningTerminalValidationInputs
): SearchLearningTerminalValidation {
    const items = [
        buildSurfaceItem(overview, handoff),
        buildSearchSignalItem(inputs),
        buildCoverageItem(coverage, handoff),
        buildWorkflowItem(workflow),
        buildImpactItem(workflow, handoff),
    ];

    const ready = countStatus(items, 'ready');
    const attention = countStatus(items, 'attention');
    const pending = countStatus(items, 'pending');

    const status: SearchLearningTerminalValidationStatus =
        attention > 0
            ? 'attention'
            : pending > 0
                ? 'pending'
                : 'ready';

    const firstActionable = items.find((item) => item.status !== 'ready');
    const headline =
        status === 'attention'
            ? 'terminal surface는 준비됐고, 남은 건 실제 운영 액션을 처리해 검증 루프를 닫는 것입니다.'
            : status === 'pending'
                ? '큰 blocker는 없지만 production 신호와 impact 표본이 더 필요합니다.'
                : 'terminal surface와 search-learning 검증 신호가 모두 들어와 운영 검증 상태가 안정적입니다.';

    const nextStep =
        firstActionable?.action
            ? `${firstActionable.title}부터 처리한 뒤 실제 검색을 반복하세요.`
            : firstActionable
                ? `${firstActionable.title}를 먼저 확인하세요.`
                : '대표 검색어를 다시 검색해 terminal overview / handoff / impact 변화만 모니터링하면 됩니다.';

    return {
        status,
        headline,
        nextStep,
        docPath: 'docs/SEARCH_LEARNING_TERMINAL_VALIDATION.md',
        checks: {
            total: items.length,
            ready,
            attention,
            pending,
        },
        items,
    };
}
