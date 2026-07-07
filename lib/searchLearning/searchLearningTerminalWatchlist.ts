import type { SearchLearningImpactSummary } from './searchLearningImpact.ts';
import type { SearchLearningOpsCenterSummary } from './searchLearningOpsCenter.ts';
import type {
    SearchLearningTerminalWorkflowAction,
    SearchLearningTerminalWorkflowSummary,
} from './searchLearningTerminalWorkflow.ts';

export type SearchLearningTerminalWatchlistItem = {
    id: string;
    source: 'ops_center' | 'impact' | 'workflow';
    priority: 'critical' | 'high' | 'medium' | 'low';
    title: string;
    description: string;
    queries: string[];
    entryIds: string[];
    count: number;
    metricLabel: string;
    action: SearchLearningTerminalWorkflowAction;
};

export type SearchLearningTerminalWatchlist = {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    items: SearchLearningTerminalWatchlistItem[];
};

function uniqueOrdered(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean)));
}

function mapPriority(priority: 'critical' | 'high' | 'medium' | 'low'): number {
    if (priority === 'critical') {
        return 4;
    }
    if (priority === 'high') {
        return 3;
    }
    if (priority === 'medium') {
        return 2;
    }
    return 1;
}

function actionForOpsCenterItem(item: SearchLearningOpsCenterSummary['topUrgentNow'][number]): SearchLearningTerminalWorkflowAction {
    if (item.action === 'approve_now') {
        return {
            id: `${item.id}:review`,
            kind: 'review_now',
            title: item.title,
            description: item.description,
            count: item.entryIds.length,
            entryIds: item.entryIds,
            tone: 'emerald',
            actionLabel: 'review pending 선택',
        };
    }

    if (item.action === 'generate_now') {
        return {
            id: `${item.id}:generate`,
            kind: 'generate_now',
            title: item.title,
            description: item.description,
            count: item.entryIds.length,
            entryIds: item.entryIds,
            tone: 'sky',
            actionLabel: 'generate needed AI 제안',
        };
    }

    if (item.action === 'retrain_now') {
        return {
            id: `${item.id}:retrain`,
            kind: 'retrain_now',
            title: item.title,
            description: item.description,
            count: item.entryIds.length,
            entryIds: item.entryIds,
            tone: 'rose',
            actionLabel: 'retrain AI 제안',
        };
    }

    if (item.action === 'sample_now') {
        return {
            id: `${item.id}:sample`,
            kind: 'sample_collection',
            title: item.title,
            description: item.description,
            count: item.entryIds.length,
            entryIds: item.entryIds,
            tone: 'amber',
            actionLabel: '표본 수집 선택',
        };
    }

    return {
        id: `${item.id}:observe`,
        kind: 'observe',
        title: item.title,
        description: item.description,
        count: item.entryIds.length,
        entryIds: item.entryIds,
        tone: 'slate',
        actionLabel: '개선 query 선택',
    };
}

export function buildSearchLearningTerminalWatchlist(
    workflow: SearchLearningTerminalWorkflowSummary,
    opsCenter: SearchLearningOpsCenterSummary,
    impactSummary: SearchLearningImpactSummary
): SearchLearningTerminalWatchlist {
    const rawItems = [
        ...opsCenter.topUrgentNow.map((item) => ({
            id: `watchlist:${item.id}`,
            source: 'ops_center' as const,
            priority: item.priority,
            title: item.title,
            description: item.description,
            queries: uniqueOrdered(item.queries).slice(0, 4),
            entryIds: uniqueOrdered(item.entryIds),
            count: item.entryIds.length,
            metricLabel: item.metricLabel,
            action: actionForOpsCenterItem(item),
        })),
        ...opsCenter.topRetrainNeeded.map((item) => ({
            id: `watchlist:${item.id}`,
            source: 'ops_center' as const,
            priority: 'high' as const,
            title: item.title,
            description: item.description,
            queries: uniqueOrdered(item.queries).slice(0, 4),
            entryIds: uniqueOrdered(item.entryIds),
            count: item.entryIds.length,
            metricLabel: item.metricLabel,
            action: actionForOpsCenterItem(item),
        })),
        ...impactSummary.topNeedsAttention.map((impact) => ({
            id: `watchlist:impact:${impact.entryId}`,
            source: 'impact' as const,
            priority: 'high' as const,
            title: `${impact.query} retrain`,
            description: '승인 후에도 low-fit/zero-result 개선이 없어 terminal retrain 후보로 올립니다.',
            queries: [impact.query],
            entryIds: [impact.entryId],
            count: impact.postApprovalSamples,
            metricLabel: `improvement ${impact.improvementScore.toFixed(2)}`,
            action: {
                id: `terminal_watchlist_retrain:${impact.entryId}`,
                kind: 'retrain_now' as const,
                title: `${impact.query} retrain`,
                description: '승인 후에도 개선되지 않아 재학습이 필요한 query입니다.',
                count: 1,
                entryIds: [impact.entryId],
                tone: 'rose' as const,
                actionLabel: 'retrain AI 제안',
            },
        })),
        ...impactSummary.topAwaitingSamples.map((impact) => ({
            id: `watchlist:samples:${impact.entryId}`,
            source: 'impact' as const,
            priority: 'medium' as const,
            title: `${impact.query} sample follow-up`,
            description: '승인 후 sample이 아직 부족해 실제 검색을 더 모아야 합니다.',
            queries: [impact.query],
            entryIds: [impact.entryId],
            count: impact.postApprovalSamples,
            metricLabel: `samples ${impact.postApprovalSamples}`,
            action: {
                id: `terminal_watchlist_sample:${impact.entryId}`,
                kind: 'sample_collection' as const,
                title: `${impact.query} sample follow-up`,
                description: '표본 수집이 더 필요한 query입니다.',
                count: 1,
                entryIds: [impact.entryId],
                tone: 'amber' as const,
                actionLabel: '표본 수집 선택',
            },
        })),
        ...workflow.topActions.slice(0, 2).map((action) => ({
            id: `watchlist:workflow:${action.id}`,
            source: 'workflow' as const,
            priority:
                action.kind === 'review_now'
                    ? 'critical'
                    : action.kind === 'retrain_now'
                        ? 'high'
                        : action.kind === 'sample_collection'
                            ? 'medium'
                            : 'low' as SearchLearningTerminalWatchlistItem['priority'],
            title: action.title,
            description: action.description,
            queries: [],
            entryIds: uniqueOrdered(action.entryIds),
            count: action.count,
            metricLabel: `${action.kind} ${action.count}`,
            action,
        })),
    ] satisfies SearchLearningTerminalWatchlistItem[];

    const items: SearchLearningTerminalWatchlistItem[] = rawItems
        .filter((item) => item.entryIds.length > 0)
        .sort((left, right) => {
            if (mapPriority(right.priority) !== mapPriority(left.priority)) {
                return mapPriority(right.priority) - mapPriority(left.priority);
            }
            return right.count - left.count;
        });

    const deduped: SearchLearningTerminalWatchlistItem[] = [];
    const seenEntryIds = new Set<string>();
    for (const item of items) {
        const uniqueEntryIds = item.entryIds.filter((entryId) => !seenEntryIds.has(entryId));
        if (uniqueEntryIds.length === 0) {
            continue;
        }
        uniqueEntryIds.forEach((entryId) => seenEntryIds.add(entryId));
        deduped.push({
            ...item,
            entryIds: uniqueEntryIds,
            count: uniqueEntryIds.length,
        });
        if (deduped.length >= 6) {
            break;
        }
    }

    return {
        total: deduped.length,
        critical: deduped.filter((item) => item.priority === 'critical').length,
        high: deduped.filter((item) => item.priority === 'high').length,
        medium: deduped.filter((item) => item.priority === 'medium').length,
        low: deduped.filter((item) => item.priority === 'low').length,
        items: deduped,
    };
}
