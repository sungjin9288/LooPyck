export const MIN_DIRECTIONAL_COHORT_IMPRESSIONS = 30;

export type SearchQualityObservationStatus = 'insufficient-data' | 'hold' | 'candidate' | 'watch';
export type CommerceBadgeCohort = 'none' | 'shipping' | 'benefit' | 'shipping+benefit';

export type SearchQualityObservationInput = {
    summary: { trackedSearches: number };
    quality: {
        strong: number;
        mixed: number;
        weak: number;
        lowFitShare: number;
        compareReadyRatio: number;
        priceSpreadCaptureRate: number;
        optionMatchPrecision: number;
        avgCapturedPriceSpread: number;
        maxCapturedPriceSpread: number;
    };
    interactionSummary: {
        total: number;
        productImpressions: number;
        productOpens: number;
        badgeCohorts: Array<{
            cohort: CommerceBadgeCohort;
            impressions: number;
            opens: number;
            openRate: number;
        }>;
    };
    sourceHealth?: Array<{
        source: string;
        status: 'healthy' | 'degraded' | 'failing' | 'never_direct' | 'no_data' | 'disabled';
        reason: string;
    }>;
};

export type BadgeCohortObservation = {
    cohort: CommerceBadgeCohort;
    impressions: number;
    opens: number;
    openRate: number;
    upliftVsNoBadge: number | null;
    hasDirectionalSample: boolean;
    decision: Exclude<SearchQualityObservationStatus, 'insufficient-data'>;
    reason: string;
};

export type SearchQualityObservation = {
    status: SearchQualityObservationStatus;
    minimumDirectionalImpressions: number;
    trackedSearches: number;
    interactionCount: number;
    quality: SearchQualityObservationInput['quality'];
    badgeCohorts: BadgeCohortObservation[];
    sourceHealth: {
        failing: number;
        degraded: number;
        healthy: number;
        disabled: number;
        other: number;
        failingSources: Array<{ source: string; reason: string }>;
    };
    actions: Array<{
        id: string;
        priority: 'high' | 'medium' | 'low';
        title: string;
        detail: string;
    }>;
};

function roundRate(value: number): number {
    return Math.round(value * 10) / 10;
}

export function buildSearchQualityObservation(
    input: SearchQualityObservationInput,
    minimumDirectionalImpressions = MIN_DIRECTIONAL_COHORT_IMPRESSIONS
): SearchQualityObservation {
    const baseline = input.interactionSummary.badgeCohorts.find((entry) => entry.cohort === 'none');
    const baselineReady = Boolean(baseline && baseline.impressions >= minimumDirectionalImpressions);

    const badgeCohorts = input.interactionSummary.badgeCohorts.map((entry): BadgeCohortObservation => {
        const hasDirectionalSample = entry.impressions >= minimumDirectionalImpressions;

        if (entry.cohort === 'none') {
            return {
                ...entry,
                upliftVsNoBadge: 0,
                hasDirectionalSample,
                decision: 'hold',
                reason: hasDirectionalSample
                    ? '배지 없는 결과의 directional baseline입니다.'
                    : `baseline 표본이 ${minimumDirectionalImpressions} impressions 미만입니다.`,
            };
        }

        if (!hasDirectionalSample || !baselineReady || !baseline) {
            return {
                ...entry,
                upliftVsNoBadge: baseline ? roundRate(entry.openRate - baseline.openRate) : null,
                hasDirectionalSample,
                decision: 'hold',
                reason: !hasDirectionalSample
                    ? `cohort 표본이 ${minimumDirectionalImpressions} impressions 미만입니다.`
                    : `배지 없음 baseline이 ${minimumDirectionalImpressions} impressions 미만입니다.`,
            };
        }

        const upliftVsNoBadge = roundRate(entry.openRate - baseline.openRate);
        return {
            ...entry,
            upliftVsNoBadge,
            hasDirectionalSample,
            decision: upliftVsNoBadge > 0 ? 'candidate' : upliftVsNoBadge < 0 ? 'watch' : 'hold',
            reason: upliftVsNoBadge > 0
                ? 'baseline보다 open rate가 높아 추가 검증 후보입니다.'
                : upliftVsNoBadge < 0
                    ? 'baseline보다 open rate가 낮아 query/source mix 점검이 필요합니다.'
                    : 'baseline과 같은 open rate로 관찰을 유지합니다.',
        };
    });

    const sourceHealth = input.sourceHealth || [];
    const failingSources = sourceHealth
        .filter((entry) => entry.status === 'failing')
        .map((entry) => ({ source: entry.source, reason: entry.reason }));
    const healthSummary = {
        failing: failingSources.length,
        degraded: sourceHealth.filter((entry) => entry.status === 'degraded').length,
        healthy: sourceHealth.filter((entry) => entry.status === 'healthy').length,
        disabled: sourceHealth.filter((entry) => entry.status === 'disabled').length,
        other: sourceHealth.filter((entry) => entry.status === 'never_direct' || entry.status === 'no_data').length,
        failingSources,
    };

    const actions: SearchQualityObservation['actions'] = [];
    if (failingSources.length > 0) {
        actions.push({
            id: 'repair-failing-sources',
            priority: 'high',
            title: `FAILING source ${failingSources.length}개 점검`,
            detail: failingSources.map((entry) => entry.source).join(', '),
        });
    }
    if (!baselineReady) {
        actions.push({
            id: 'collect-no-badge-baseline',
            priority: 'medium',
            title: '배지 없음 baseline 표본 확보',
            detail: `${baseline?.impressions || 0}/${minimumDirectionalImpressions} impressions. 이 기준 전에는 uplift를 rollout 근거로 사용하지 않습니다.`,
        });
    }

    const candidates = badgeCohorts.filter((entry) => entry.decision === 'candidate');
    const watches = badgeCohorts.filter((entry) => entry.decision === 'watch');
    const insufficientCohorts = badgeCohorts.filter((entry) => entry.cohort !== 'none' && !entry.hasDirectionalSample);

    if (insufficientCohorts.length > 0) {
        actions.push({
            id: 'collect-badge-cohort-samples',
            priority: 'low',
            title: 'badge cohort 표본 추가 수집',
            detail: insufficientCohorts.map((entry) => entry.cohort).join(', '),
        });
    }
    if (candidates.length > 0) {
        actions.push({
            id: 'validate-positive-badge-cohorts',
            priority: 'medium',
            title: 'positive uplift cohort 재검증',
            detail: `${candidates.map((entry) => entry.cohort).join(', ')}. directional signal이며 통계적 유의성 또는 인과 효과를 의미하지 않습니다.`,
        });
    }
    if (watches.length > 0) {
        actions.push({
            id: 'inspect-negative-badge-cohorts',
            priority: 'high',
            title: 'negative uplift cohort 구성 점검',
            detail: `${watches.map((entry) => entry.cohort).join(', ')}의 query, source, 상품 구성 차이를 확인합니다.`,
        });
    }

    const hasAnySample = input.summary.trackedSearches > 0 || input.interactionSummary.total > 0;
    const status: SearchQualityObservationStatus = !hasAnySample
        ? 'insufficient-data'
        : failingSources.length > 0 || watches.length > 0
            ? 'watch'
            : candidates.length > 0
                ? 'candidate'
                : 'hold';

    return {
        status,
        minimumDirectionalImpressions,
        trackedSearches: input.summary.trackedSearches,
        interactionCount: input.interactionSummary.total,
        quality: input.quality,
        badgeCohorts,
        sourceHealth: healthSummary,
        actions,
    };
}
