import type { AlertPriority } from './alertState.ts';

export type RecommendedSnoozePreset = {
    hours: number;
    label: string;
    reason: string;
    emphasis: 'recommended' | 'secondary';
};

export type AlertTuningSuggestion = {
    source: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    recommendedSnoozeHours?: number;
};

export type AlertRolloutRecommendationInput = {
    source: string;
    rolloutPercentage: number;
    experiment: {
        users: number;
        alerts: number;
        unreadRate: number;
        snoozedTargetRate: number;
        avgReadLatencyMinutes: number;
    };
    control: {
        users: number;
        alerts: number;
        unreadRate: number;
        snoozedTargetRate: number;
        avgReadLatencyMinutes: number;
    };
    delta: {
        unreadRate: number;
        snoozedTargetRate: number;
        avgReadLatencyMinutes: number;
    };
};

export type AlertRolloutRecommendation = {
    source: string;
    severity: 'high' | 'medium' | 'low';
    action: 'increase' | 'hold' | 'decrease' | 'collect_more';
    title: string;
    description: string;
    currentRolloutPercentage: number;
    recommendedRolloutPercentage: number;
    experimentAlerts: number;
    controlAlerts: number;
};

export type AlertTuningDrilldownInput = {
    source: string;
    unreadRate: number;
    archivedRate: number;
    activeTargets: number;
    snoozedTargets: number;
    avgReadLatencyMinutes: number;
    criticalAlerts: number;
    highAlerts: number;
    recentCritical: Array<{ id: string }>;
    recentUnread: Array<{ id: string }>;
};

function hoursLabel(hours: number): string {
    if (hours % 24 === 0) {
        const days = hours / 24;
        return `${days}d`;
    }

    return `${hours}h`;
}

export function buildRecommendedSnoozePresets(input: {
    priority: AlertPriority;
    isReached: boolean;
    isSnoozed?: boolean;
}): RecommendedSnoozePreset[] {
    if (input.isSnoozed) {
        return [];
    }

    if (input.priority === 'critical') {
        return [
            {
                hours: 24,
                label: hoursLabel(24),
                reason: input.isReached ? '방금 목표가에 도달한 알림이라 단기 재확인이 적합합니다.' : '긴급 알림은 짧게 끊어서 다시 확인하는 편이 좋습니다.',
                emphasis: 'recommended',
            },
            {
                hours: 72,
                label: hoursLabel(72),
                reason: '더 긴 재확인 주기가 필요하면 3일 스누즈가 적합합니다.',
                emphasis: 'secondary',
            },
        ];
    }

    if (input.priority === 'high') {
        return [
            {
                hours: 72,
                label: hoursLabel(72),
                reason: '높음 우선순위 알림은 3일 단위로 다시 보는 편이 안정적입니다.',
                emphasis: 'recommended',
            },
            {
                hours: 168,
                label: hoursLabel(168),
                reason: '반응이 급하지 않으면 1주일 스누즈로 정리할 수 있습니다.',
                emphasis: 'secondary',
            },
        ];
    }

    return [
        {
            hours: 168,
            label: hoursLabel(168),
            reason: '기본 알림은 1주일 간격으로 다시 보는 편이 노이즈가 적습니다.',
            emphasis: 'recommended',
        },
        {
            hours: 336,
            label: hoursLabel(336),
            reason: '장기 추적 상품이면 2주 스누즈가 적합합니다.',
            emphasis: 'secondary',
        },
    ];
}

export function buildAlertTuningSuggestions(inputs: AlertTuningDrilldownInput[]): AlertTuningSuggestion[] {
    return inputs
        .map((input) => {
            const snoozeShare = input.activeTargets > 0
                ? input.snoozedTargets / input.activeTargets
                : 0;

            if (input.unreadRate >= 55 && input.avgReadLatencyMinutes >= 180) {
                return {
                    source: input.source,
                    severity: 'high' as const,
                    title: '읽음 지연이 높습니다',
                    description: `unread ${input.unreadRate}% / 평균 ${input.avgReadLatencyMinutes}분 지연입니다. 기본 스누즈를 3일 이상으로 늘리는 편이 안전합니다.`,
                    recommendedSnoozeHours: 72,
                };
            }

            if (input.criticalAlerts >= 3 && input.recentUnread.length >= 2) {
                return {
                    source: input.source,
                    severity: 'high' as const,
                    title: 'critical backlog를 먼저 정리해야 합니다',
                    description: `긴급 알림 ${input.criticalAlerts}건이 쌓여 있습니다. critical queue를 먼저 확인하고 24h 재확인 플로우를 우선 배치하세요.`,
                    recommendedSnoozeHours: 24,
                };
            }

            if (snoozeShare >= 0.45 || input.archivedRate >= 35) {
                return {
                    source: input.source,
                    severity: 'medium' as const,
                    title: '알림 피로도가 높습니다',
                    description: `스누즈 비중 ${(snoozeShare * 100).toFixed(1)}% / archived ${input.archivedRate}% 입니다. 기본 스누즈를 1주일까지 확대하는 편이 좋습니다.`,
                    recommendedSnoozeHours: 168,
                };
            }

            if (input.unreadRate >= 25 || input.highAlerts >= 3) {
                return {
                    source: input.source,
                    severity: 'medium' as const,
                    title: '중간 수준의 알림 누적이 보입니다',
                    description: `높음 우선순위 ${input.highAlerts}건, unread ${input.unreadRate}%입니다. 3일 스누즈를 기본값으로 제안합니다.`,
                    recommendedSnoozeHours: 72,
                };
            }

            return {
                source: input.source,
                severity: 'low' as const,
                title: '현재 알림 상태가 안정적입니다',
                description: '즉시 조정이 필요한 경고는 없습니다. 현행 스누즈/우선순위 규칙을 유지해도 됩니다.',
            };
        })
        .sort((left, right) => {
            const severityRank = { high: 0, medium: 1, low: 2 };
            const severityDiff = severityRank[left.severity] - severityRank[right.severity];
            if (severityDiff !== 0) {
                return severityDiff;
            }

            return left.source.localeCompare(right.source);
        });
}

function normalizeRolloutPercentage(value: number): number {
    return Math.min(100, Math.max(0, Math.round(value)));
}

export function buildAlertRolloutRecommendations(
    inputs: AlertRolloutRecommendationInput[]
): AlertRolloutRecommendation[] {
    return inputs
        .map((input) => {
            const totalAlerts = input.experiment.alerts + input.control.alerts;
            const totalUsers = input.experiment.users + input.control.users;
            const currentRolloutPercentage = normalizeRolloutPercentage(input.rolloutPercentage);

            if (totalAlerts < 8 || totalUsers < 4 || input.experiment.alerts < 3 || input.control.alerts < 3) {
                return {
                    source: input.source,
                    severity: 'low' as const,
                    action: 'collect_more' as const,
                    title: '표본이 더 필요합니다',
                    description: `experiment ${input.experiment.alerts}건 / control ${input.control.alerts}건이라 아직 결론을 내리기 이릅니다. 현재 rollout ${currentRolloutPercentage}%를 유지하면서 더 모으는 편이 안전합니다.`,
                    currentRolloutPercentage,
                    recommendedRolloutPercentage: currentRolloutPercentage,
                    experimentAlerts: input.experiment.alerts,
                    controlAlerts: input.control.alerts,
                };
            }

            const severeRegression = input.delta.unreadRate >= 8
                || input.delta.avgReadLatencyMinutes >= 45
                || input.delta.snoozedTargetRate >= 12;
            if (severeRegression) {
                const recommendedRolloutPercentage = currentRolloutPercentage <= 25 ? 0 : Math.max(0, currentRolloutPercentage - 25);
                return {
                    source: input.source,
                    severity: 'high' as const,
                    action: 'decrease' as const,
                    title: 'rollout 축소가 필요합니다',
                    description: `실험군이 control 대비 unread ${input.delta.unreadRate > 0 ? '+' : ''}${input.delta.unreadRate}%p, read latency ${input.delta.avgReadLatencyMinutes > 0 ? '+' : ''}${input.delta.avgReadLatencyMinutes}m로 악화됐습니다. rollout을 ${recommendedRolloutPercentage}%까지 줄이는 편이 안전합니다.`,
                    currentRolloutPercentage,
                    recommendedRolloutPercentage,
                    experimentAlerts: input.experiment.alerts,
                    controlAlerts: input.control.alerts,
                };
            }

            const strongImprovement = input.delta.unreadRate <= -6
                && input.delta.avgReadLatencyMinutes <= 0
                && input.delta.snoozedTargetRate <= 6;
            if (strongImprovement) {
                const recommendedRolloutPercentage = currentRolloutPercentage >= 75 ? 100 : Math.min(100, currentRolloutPercentage + 25);
                return {
                    source: input.source,
                    severity: 'medium' as const,
                    action: 'increase' as const,
                    title: 'rollout 확대 후보입니다',
                    description: `실험군이 control 대비 unread ${input.delta.unreadRate}%p, read latency ${input.delta.avgReadLatencyMinutes}m로 개선됐습니다. rollout을 ${recommendedRolloutPercentage}%로 확대해도 됩니다.`,
                    currentRolloutPercentage,
                    recommendedRolloutPercentage,
                    experimentAlerts: input.experiment.alerts,
                    controlAlerts: input.control.alerts,
                };
            }

            return {
                source: input.source,
                severity: 'low' as const,
                action: 'hold' as const,
                title: '현재 rollout 유지가 적절합니다',
                description: `실험군과 control의 차이가 작습니다. 현재 rollout ${currentRolloutPercentage}%를 유지하면서 더 추적하는 편이 좋습니다.`,
                currentRolloutPercentage,
                recommendedRolloutPercentage: currentRolloutPercentage,
                experimentAlerts: input.experiment.alerts,
                controlAlerts: input.control.alerts,
            };
        })
        .sort((left, right) => {
            const severityRank = { high: 0, medium: 1, low: 2 };
            const severityDiff = severityRank[left.severity] - severityRank[right.severity];
            if (severityDiff !== 0) {
                return severityDiff;
            }

            const actionRank = { decrease: 0, increase: 1, hold: 2, collect_more: 3 };
            const actionDiff = actionRank[left.action] - actionRank[right.action];
            if (actionDiff !== 0) {
                return actionDiff;
            }

            return left.source.localeCompare(right.source);
        });
}
