export type DataFreshnessStatus = 'fresh' | 'aging' | 'stale' | 'unknown';

export interface DataFreshnessSummary {
    status: DataFreshnessStatus;
    timestampMs?: number;
    relativeLabel?: string;
    absoluteLabel?: string;
    shortLabel: string;
    detailLabel: string;
}

type FreshnessOptions = {
    freshMs: number;
    agingMs: number;
    verb: string;
    unknownLabel: string;
    nowMs?: number;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;
const WEEK_MS = 7 * DAY_MS;

function toTimestampMs(value?: string | number | null): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return undefined;
}

function formatRelativeAge(ageMs: number): string {
    const normalizedAge = Math.max(0, ageMs);

    if (normalizedAge < MINUTE_MS) {
        return '방금';
    }

    if (normalizedAge < HOUR_MS) {
        return `${Math.max(1, Math.floor(normalizedAge / MINUTE_MS))}분 전`;
    }

    if (normalizedAge < DAY_MS) {
        return `${Math.max(1, Math.floor(normalizedAge / HOUR_MS))}시간 전`;
    }

    if (normalizedAge < WEEK_MS) {
        return `${Math.max(1, Math.floor(normalizedAge / DAY_MS))}일 전`;
    }

    return `${Math.max(1, Math.floor(normalizedAge / WEEK_MS))}주 전`;
}

function formatAbsoluteTime(timestampMs: number): string {
    return new Intl.DateTimeFormat('ko-KR', {
        timeZone: 'Asia/Seoul',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hourCycle: 'h23',
    }).format(new Date(timestampMs));
}

export function summarizeDataFreshness(
    value: string | number | null | undefined,
    {
        freshMs,
        agingMs,
        verb,
        unknownLabel,
        nowMs = Date.now(),
    }: FreshnessOptions
): DataFreshnessSummary {
    const timestampMs = toTimestampMs(value);
    if (!timestampMs) {
        return {
            status: 'unknown',
            shortLabel: unknownLabel,
            detailLabel: unknownLabel,
        };
    }

    const ageMs = Math.max(0, nowMs - timestampMs);
    const relativeLabel = formatRelativeAge(ageMs);
    const absoluteLabel = formatAbsoluteTime(timestampMs);
    const status: DataFreshnessStatus = ageMs <= freshMs
        ? 'fresh'
        : ageMs <= agingMs
            ? 'aging'
            : 'stale';

    return {
        status,
        timestampMs,
        relativeLabel,
        absoluteLabel,
        shortLabel: `${relativeLabel} ${verb}`,
        detailLabel: `${absoluteLabel} 기준`,
    };
}

export function summarizeDetailFreshness(
    detailCollectedAt?: string | null,
    nowMs?: number
): DataFreshnessSummary {
    return summarizeDataFreshness(detailCollectedAt, {
        freshMs: 12 * HOUR_MS,
        agingMs: 48 * HOUR_MS,
        verb: '확인',
        unknownLabel: 'PDP 수집 시각 없음',
        nowMs,
    });
}

export function summarizePriceHistoryFreshness(
    capturedAt?: number | null,
    nowMs?: number
): DataFreshnessSummary {
    return summarizeDataFreshness(capturedAt, {
        freshMs: 24 * HOUR_MS,
        agingMs: 72 * HOUR_MS,
        verb: '수집',
        unknownLabel: '가격 이력 수집 대기',
        nowMs,
    });
}

export function getFreshnessBadgeClassName(status: DataFreshnessStatus): string {
    switch (status) {
        case 'fresh':
            return 'border-emerald-200 bg-emerald-50 text-emerald-700';
        case 'aging':
            return 'border-amber-200 bg-amber-50 text-amber-700';
        case 'stale':
            return 'border-rose-200 bg-rose-50 text-rose-700';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600';
    }
}
