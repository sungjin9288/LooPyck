import type {
    AlertPersonaRecentProfile,
    AlertRecentEvent,
    AlertTuningApprovalRequest,
    AlertTuningAuditEvent,
    AlertTuningAuditInboxSummary,
    AlertTuningWebhookConfig,
    ApprovalQueueSummary,
    DiagnosticsResponse,
    PdpRecentEvent,
    RecentInteraction,
    RecentSnapshot,
    SearchLearningActivityEvent,
    SearchLearningEntry,
    SourceDrilldownItem,
    SourceSummary,
    SourceTrendPoint,
} from './types';

export async function parseJsonResponseSafely(response: Response) {
    const raw = await response.text();
    if (!raw.trim()) {
        return null;
    }

    try {
        return JSON.parse(raw) as DiagnosticsResponse | { error?: string };
    } catch {
        throw new Error(`진단 API 응답을 해석하지 못했습니다. status=${response.status}`);
    }
}

export function buildLowFitQueries(
    recent: RecentSnapshot[]
): Array<{ query: string; quality: string; generatedAt: string; suggestedQueries: string[]; totalProducts: number }> {
    return recent
        .filter((snapshot) => snapshot.resultQuality === 'weak' || snapshot.resultQuality === 'mixed')
        .map((snapshot) => ({
            query: snapshot.query,
            quality: snapshot.resultQuality || 'weak',
            generatedAt: snapshot.generatedAt,
            suggestedQueries: snapshot.suggestedQueries || [],
            totalProducts: snapshot.totalProducts,
        }))
        .slice(0, 10);
}

export function searchLearningStatusLabel(status: SearchLearningEntry['status']): string {
    switch (status) {
        case 'approved':
            return '승인됨';
        case 'ignored':
            return '보류';
        default:
            return '검토 대기';
    }
}

export function searchLearningStatusClass(status: SearchLearningEntry['status']): string {
    switch (status) {
        case 'approved':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'ignored':
            return 'bg-slate-700/60 text-slate-300';
        default:
            return 'bg-amber-500/15 text-amber-200';
    }
}

export function summarizeSearchLearningEntries(entries: SearchLearningEntry[]): DiagnosticsResponse['searchLearning']['summary'] {
    return {
        total: entries.length,
        pending: entries.filter((entry) => entry.status === 'pending').length,
        approved: entries.filter((entry) => entry.status === 'approved').length,
        ignored: entries.filter((entry) => entry.status === 'ignored').length,
        zeroResult: entries.filter((entry) => entry.zeroResultCount > 0).length,
    };
}

export function searchLearningActivityLabel(event: SearchLearningActivityEvent): string {
    switch (event.type) {
        case 'seed_queries':
            return '큐 추가';
        case 'generate_suggestions':
            return 'AI 제안 생성';
        case 'review_entries':
            return event.reviewedStatus === 'approved' ? '승인' : '보류';
        default:
            return '활동';
    }
}

export function searchLearningActivityClass(event: SearchLearningActivityEvent): string {
    switch (event.type) {
        case 'seed_queries':
            return 'bg-amber-500/15 text-amber-200';
        case 'generate_suggestions':
            return 'bg-cyan-500/15 text-cyan-200';
        case 'review_entries':
            return event.reviewedStatus === 'approved'
                ? 'bg-emerald-500/15 text-emerald-200'
                : 'bg-slate-700/60 text-slate-200';
        default:
            return 'bg-slate-700/60 text-slate-200';
    }
}

export function mergeSearchLearningEntries(
    currentEntries: SearchLearningEntry[],
    updatedEntries: SearchLearningEntry[]
): SearchLearningEntry[] {
    const updatedMap = new Map(updatedEntries.map((entry) => [entry.id, entry]));
    const merged = currentEntries.map((entry) => updatedMap.get(entry.id) || entry);
    const existingIds = new Set(currentEntries.map((entry) => entry.id));

    updatedEntries.forEach((entry) => {
        if (!existingIds.has(entry.id)) {
            merged.unshift(entry);
        }
    });

    return merged.sort((left, right) => right.lastSeenAt.localeCompare(left.lastSeenAt));
}

export function mergeSearchLearningActivityEvents(
    currentEvents: SearchLearningActivityEvent[],
    incomingEvents: SearchLearningActivityEvent[]
): SearchLearningActivityEvent[] {
    const next = [...incomingEvents, ...currentEvents];
    const seen = new Set<string>();

    return next
        .filter((event) => {
            if (seen.has(event.id)) {
                return false;
            }

            seen.add(event.id);
            return true;
        })
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
        .slice(0, 20);
}

export function formatPercent(value: number | null): string {
    if (value === null || Number.isNaN(value)) {
        return '-';
    }

    return `${Math.round(value * 100)}%`;
}

export function formatTime(value: string | null | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function strategyLabel(strategy: string): string {
    switch (strategy) {
        case 'direct':
            return '직접 수집';
        case 'direct_preferred_over_naver':
            return '직접 우선';
        case 'naver_classified_fallback':
            return 'Naver fallback';
        case 'classified_naver':
            return 'Naver 분류';
        case 'api':
            return 'API';
        default:
            return '미스';
    }
}

export function collectionModeLabel(mode: SourceSummary['collectionMode']): string {
    switch (mode) {
        case 'api':
            return 'API';
        case 'direct':
            return 'DIRECT';
        default:
            return 'CLASSIFIED';
    }
}

export function collectionModeClass(mode: SourceSummary['collectionMode']): string {
    switch (mode) {
        case 'api':
            return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
        case 'direct':
            return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
        default:
            return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
    }
}

export function interactionLabel(type: RecentInteraction['type']): string {
    switch (type) {
        case 'suggestion_click':
            return '추천 클릭';
        case 'product_open':
            return '상품 열람';
        case 'product_impression':
            return '검색결과 노출';
        default:
            return '쇼핑몰 이동';
    }
}

export function pdpStrategyLabel(strategy: PdpRecentEvent['strategy']): string {
    switch (strategy) {
        case 'cache_hit':
            return '캐시 히트';
        case 'fetched':
            return '실시간 수집';
        case 'stale_cache_refreshed':
            return '캐시 갱신';
        case 'fetch_failed':
            return 'fetch 실패';
        case 'parse_empty':
            return 'parse 실패';
        default:
            return '미지원';
    }
}

export function alertPriorityLabel(priority: AlertRecentEvent['priority']): string {
    switch (priority) {
        case 'critical':
            return '긴급';
        case 'high':
            return '높음';
        default:
            return '기본';
    }
}

export function alertPriorityClass(priority: AlertRecentEvent['priority']): string {
    switch (priority) {
        case 'critical':
            return 'bg-rose-500/15 text-rose-200';
        case 'high':
            return 'bg-amber-500/15 text-amber-200';
        default:
            return 'bg-slate-700/60 text-slate-200';
    }
}

export function alertPersonaModeLabel(mode: AlertPersonaRecentProfile['mode'] | null | undefined): string {
    switch (mode) {
        case 'instant':
            return '빠른 대응형';
        case 'batch':
            return '배치 확인형';
        case 'balanced':
            return '균형 확인형';
        default:
            return '미확인';
    }
}

export function alertPersonaModeClass(mode: AlertPersonaRecentProfile['mode'] | null | undefined): string {
    switch (mode) {
        case 'instant':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'batch':
            return 'bg-amber-500/15 text-amber-200';
        case 'balanced':
            return 'bg-sky-500/15 text-sky-200';
        default:
            return 'bg-slate-700/60 text-slate-200';
    }
}

export function formatSnoozeHours(hours: number): string {
    if (!Number.isFinite(hours) || hours <= 0) {
        return '-';
    }

    if (hours % 24 === 0) {
        return `${Math.round(hours / 24)}d`;
    }

    return `${hours}h`;
}

export function tuningSeverityClass(severity: 'high' | 'medium' | 'low'): string {
    switch (severity) {
        case 'high':
            return 'bg-rose-500/15 text-rose-200';
        case 'medium':
            return 'bg-amber-500/15 text-amber-200';
        default:
            return 'bg-emerald-500/15 text-emerald-200';
    }
}

export function rolloutDeltaClass(
    value: number,
    direction: 'lower_better' | 'higher_better' = 'lower_better'
): string {
    if (value === 0) {
        return 'text-slate-300';
    }

    const positive = direction === 'higher_better' ? value > 0 : value < 0;
    return positive ? 'text-emerald-300' : 'text-rose-300';
}

export function rolloutActionLabel(action: 'increase' | 'hold' | 'decrease' | 'collect_more'): string {
    switch (action) {
        case 'increase':
            return '확대 추천';
        case 'decrease':
            return '축소 추천';
        case 'collect_more':
            return '표본 대기';
        default:
            return '유지 추천';
    }
}

export function approvalStatusClass(status: AlertTuningApprovalRequest['status']): string {
    switch (status) {
        case 'approved':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'rejected':
            return 'bg-rose-500/15 text-rose-200';
        case 'expired':
            return 'bg-slate-500/20 text-slate-300';
        case 'pending_second_approval':
            return 'bg-sky-500/15 text-sky-200';
        default:
            return 'bg-amber-500/15 text-amber-200';
    }
}

export function approvalStatusLabel(status: AlertTuningApprovalRequest['status']): string {
    switch (status) {
        case 'approved':
            return 'APPROVED';
        case 'rejected':
            return 'REJECTED';
        case 'expired':
            return 'EXPIRED';
        case 'pending_second_approval':
            return 'SECOND APPROVAL';
        default:
            return 'PENDING';
    }
}

export function auditLevelClass(level: AlertTuningAuditEvent['level']): string {
    switch (level) {
        case 'success':
            return 'bg-emerald-500/15 text-emerald-200';
        case 'warning':
            return 'bg-amber-500/15 text-amber-200';
        case 'critical':
            return 'bg-rose-500/15 text-rose-200';
        default:
            return 'bg-slate-500/20 text-slate-300';
    }
}

export function auditTypeLabel(type: AlertTuningAuditEvent['type']): string {
    switch (type) {
        case 'request_created':
            return 'REQUEST';
        case 'approval_recorded':
            return 'APPROVAL';
        case 'second_approval_required':
            return 'SECOND APPROVAL';
        case 'request_approved':
            return 'APPROVED';
        case 'request_rejected':
            return 'REJECTED';
        case 'request_expired':
            return 'EXPIRED';
        case 'config_saved':
            return 'CONFIG SAVE';
        case 'config_rolled_back':
            return 'ROLLBACK';
        case 'sla_digest':
            return 'DIGEST';
        case 'webhook_dispatched':
            return 'WEBHOOK OK';
        case 'webhook_failed':
            return 'WEBHOOK FAIL';
        default:
            return 'AUDIT';
    }
}

export function notificationTypeForAudit(level: AlertTuningAuditEvent['level']): 'info' | 'success' | 'alert' {
    if (level === 'success') return 'success';
    if (level === 'warning' || level === 'critical') return 'alert';
    return 'info';
}

export function webhookFormatLabel(format: AlertTuningWebhookConfig['format']): string {
    switch (format) {
        case 'slack':
            return 'Slack';
        case 'discord':
            return 'Discord';
        case 'generic':
            return 'Generic JSON';
        default:
            return 'Not Configured';
    }
}

export function buildClientAuditInboxSummary(events: AlertTuningAuditEvent[]): AlertTuningAuditInboxSummary {
    const unread = events.filter((event) => !event.read);
    return {
        total: events.length,
        unreadCount: unread.length,
        criticalUnreadCount: unread.filter((event) => event.level === 'critical').length,
        warningUnreadCount: unread.filter((event) => event.level === 'warning').length,
    };
}

function toMillisFromIso(value: string | null | undefined): number | null {
    if (!value) return null;
    const millis = Date.parse(value);
    return Number.isFinite(millis) ? millis : null;
}

export function requestAgeHours(createdAt: string | null | undefined): number | null {
    const createdAtMs = toMillisFromIso(createdAt);
    if (createdAtMs === null) return null;
    return Math.max(0, (Date.now() - createdAtMs) / 3_600_000);
}

export function requestExpiresAt(createdAt: string | null | undefined): string | null {
    const createdAtMs = toMillisFromIso(createdAt);
    if (createdAtMs === null) return null;
    return new Date(createdAtMs + 48 * 3_600_000).toISOString();
}

export function formatHours(value: number): string {
    if (!Number.isFinite(value)) return '-';
    if (value >= 10) return `${Math.round(value)}h`;
    return `${value.toFixed(1)}h`;
}

export function buildApprovalQueueSummary(requests: AlertTuningApprovalRequest[]): ApprovalQueueSummary {
    const openRequests = requests.filter(
        (request) => request.status === 'pending' || request.status === 'pending_second_approval'
    );
    const openAges = openRequests
        .map((request) => requestAgeHours(request.createdAt))
        .filter((value): value is number => value !== null);
    const resolutionHours = requests
        .filter(
            (request) =>
                request.status === 'approved' ||
                request.status === 'rejected' ||
                request.status === 'expired'
        )
        .map((request) => {
            const createdAtMs = toMillisFromIso(request.createdAt);
            const resolvedAtMs = toMillisFromIso(request.resolvedAt);
            if (createdAtMs === null || resolvedAtMs === null) return null;
            return Math.max(0, (resolvedAtMs - createdAtMs) / 3_600_000);
        })
        .filter((value): value is number => value !== null);
    const withinSlaResolvedCount = resolutionHours.filter((hours) => hours <= 24).length;

    return {
        openCount: openRequests.length,
        pendingCount: requests.filter((request) => request.status === 'pending').length,
        secondApprovalCount: requests.filter((request) => request.status === 'pending_second_approval').length,
        approvedCount: requests.filter((request) => request.status === 'approved').length,
        rejectedCount: requests.filter((request) => request.status === 'rejected').length,
        expiredCount: requests.filter((request) => request.status === 'expired').length,
        overdueCount: openAges.filter((hours) => hours >= 24).length,
        expiringSoonCount: openAges.filter((hours) => hours >= 18 && hours < 48).length,
        avgOpenAgeHours:
            openAges.length > 0
                ? Number((openAges.reduce((sum, hours) => sum + hours, 0) / openAges.length).toFixed(1))
                : 0,
        maxOpenAgeHours: openAges.length > 0 ? Number(Math.max(...openAges).toFixed(1)) : 0,
        avgResolutionHours:
            resolutionHours.length > 0
                ? Number((resolutionHours.reduce((sum, hours) => sum + hours, 0) / resolutionHours.length).toFixed(1))
                : 0,
        withinSlaRate:
            resolutionHours.length > 0
                ? Number(((withinSlaResolvedCount / resolutionHours.length) * 100).toFixed(1))
                : 0,
        oldestOpenAt:
            openRequests
                .map((request) => request.createdAt)
                .filter((value): value is string => Boolean(value))
                .sort((left, right) => left.localeCompare(right))[0] || null,
    };
}

function isFailureStrategy(strategy: string): boolean {
    return strategy === 'empty' || strategy === 'naver_classified_fallback' || strategy === 'classified_naver';
}

function isDirectStrategy(strategy: string): boolean {
    return strategy === 'direct' || strategy === 'direct_preferred_over_naver';
}

function isFallbackStrategy(strategy: string): boolean {
    return strategy === 'naver_classified_fallback' || strategy === 'classified_naver';
}

export function buildSourceDrilldown(
    recent: RecentSnapshot[],
    source: string
): {
    samples: SourceDrilldownItem[];
    failureSamples: SourceDrilldownItem[];
    fallbackSamples: SourceDrilldownItem[];
    directSamples: SourceDrilldownItem[];
    successSamples: SourceDrilldownItem[];
} {
    const samples = recent.flatMap((snapshot) => {
        const match = snapshot.sources.find((entry) => entry.source === source);
        if (!match) return [];

        return [
            {
                query: snapshot.query,
                effectiveQuery: snapshot.effectiveQuery,
                generatedAt: snapshot.generatedAt,
                totalProducts: snapshot.totalProducts,
                finalCount: match.finalCount,
                strategy: match.strategy,
                fallbackReason: match.fallbackReason,
                requestedQueries: match.requestedQueries,
                resolvedQuery: match.resolvedQuery,
            },
        ];
    });

    return {
        samples,
        failureSamples: samples.filter((sample) => isFailureStrategy(sample.strategy)),
        fallbackSamples: samples.filter((sample) => isFallbackStrategy(sample.strategy)),
        directSamples: samples.filter((sample) => isDirectStrategy(sample.strategy)),
        successSamples: samples.filter((sample) => sample.finalCount > 0),
    };
}

function dayLabel(value: string): string {
    return new Date(value).toLocaleDateString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
    });
}

export function buildSourceTrend(recent: RecentSnapshot[], source: string): SourceTrendPoint[] {
    const drilldown = buildSourceDrilldown(recent, source);
    const grouped = new Map<string, Omit<SourceTrendPoint, 'successRate'>>();

    drilldown.samples.forEach((sample) => {
        const day = dayLabel(sample.generatedAt);
        const current = grouped.get(day) || {
            day,
            samples: 0,
            successSamples: 0,
            directSamples: 0,
            fallbackSamples: 0,
            emptySamples: 0,
            totalItems: 0,
        };

        current.samples += 1;
        current.successSamples += sample.finalCount > 0 ? 1 : 0;
        current.directSamples += isDirectStrategy(sample.strategy) ? 1 : 0;
        current.fallbackSamples += isFallbackStrategy(sample.strategy) ? 1 : 0;
        current.emptySamples += sample.strategy === 'empty' ? 1 : 0;
        current.totalItems += sample.finalCount;
        grouped.set(day, current);
    });

    return Array.from(grouped.values())
        .map((entry) => ({
            ...entry,
            successRate: entry.samples > 0 ? Math.round((entry.successSamples / entry.samples) * 100) : 0,
        }))
        .sort((left, right) => left.day.localeCompare(right.day))
        .slice(-7);
}
