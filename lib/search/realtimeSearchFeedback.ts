import type { AppNotificationPayload } from '@/lib/core/notifications';

export type RealtimeSearchFallbackMode = 'full' | 'naver_only' | 'tracked_catalog';

type HeaderReader = {
    get(name: string): string | null;
};

export interface RealtimeSearchFeedbackMeta {
    fallbackMode: RealtimeSearchFallbackMode;
    directSourceCount: number;
    fallbackSourceCount: number;
}

export interface RealtimeSearchPersistentFeedback {
    fallbackMode: RealtimeSearchFallbackMode;
    directSourceCount: number;
    fallbackSourceCount: number;
    badgeLabel: string;
    title: string;
    detail: string;
}

function parseHeaderNumber(value: string | null): number {
    if (!value) return 0;
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function parseFallbackMode(value: string | null): RealtimeSearchFallbackMode {
    if (value === 'naver_only' || value === 'tracked_catalog') {
        return value;
    }

    return 'full';
}

function isRealtimeSearchDegraded(meta: RealtimeSearchFeedbackMeta): boolean {
    return meta.fallbackMode !== 'full' || meta.fallbackSourceCount > 0;
}

export function parseRealtimeSearchFeedbackMeta(headers: HeaderReader): RealtimeSearchFeedbackMeta {
    return {
        fallbackMode: parseFallbackMode(headers.get('X-Search-Fallback-Mode')),
        directSourceCount: parseHeaderNumber(headers.get('X-Search-Direct-Sources')),
        fallbackSourceCount: parseHeaderNumber(headers.get('X-Search-Fallback-Sources')),
    };
}

export function buildRealtimeSearchFallbackNotification(
    meta: RealtimeSearchFeedbackMeta,
    productCount: number
): AppNotificationPayload | null {
    if (productCount <= 0) {
        return null;
    }

    if (meta.fallbackMode === 'tracked_catalog') {
        return {
            title: '일부 검색 소스 지연',
            message: '일부 쇼핑몰 응답이 느려 저장된 비교 상품을 먼저 보여주고 있습니다. 잠시 후 다시 검색하면 최신 결과를 더 확인할 수 있습니다.',
            type: 'info',
        };
    }

    if (meta.fallbackMode === 'naver_only') {
        return {
            title: '대체 검색 결과 안내',
            message: '일부 쇼핑몰 응답이 느려 네이버 분류 결과를 우선 보여주고 있습니다. 결과는 계속 비교 가능하며 잠시 후 다시 검색하면 더 넓게 확인할 수 있습니다.',
            type: 'info',
        };
    }

    if (meta.fallbackSourceCount > 0) {
        const fallbackMessage = meta.directSourceCount > 0
            ? `직접 수집 ${meta.directSourceCount}개 소스에 대체 결과를 함께 반영해 비교를 이어가고 있습니다.`
            : '직접 응답이 느린 소스는 대체 결과로 보완해 비교를 이어가고 있습니다.';

        return {
            title: '일부 결과를 보완해 표시 중',
            message: fallbackMessage,
            type: 'info',
        };
    }

    return null;
}

export function buildRealtimeSearchFeedbackNotificationKey(
    query: string,
    meta: RealtimeSearchFeedbackMeta,
    productCount: number
): string | null {
    if (!buildRealtimeSearchFallbackNotification(meta, productCount)) {
        return null;
    }

    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
        return null;
    }

    return [
        normalizedQuery,
        meta.fallbackMode,
        meta.directSourceCount,
        meta.fallbackSourceCount,
        productCount,
    ].join(':');
}

export function mergeRealtimeSearchFeedbackMeta(
    previous: RealtimeSearchFeedbackMeta | null,
    next: RealtimeSearchFeedbackMeta
): RealtimeSearchFeedbackMeta | null {
    if (!previous) {
        return isRealtimeSearchDegraded(next) ? next : null;
    }

    const fallbackModePriority: Record<RealtimeSearchFallbackMode, number> = {
        full: 0,
        naver_only: 1,
        tracked_catalog: 2,
    };

    const merged: RealtimeSearchFeedbackMeta = {
        fallbackMode:
            fallbackModePriority[next.fallbackMode] >= fallbackModePriority[previous.fallbackMode]
                ? next.fallbackMode
                : previous.fallbackMode,
        directSourceCount: Math.max(previous.directSourceCount, next.directSourceCount),
        fallbackSourceCount: Math.max(previous.fallbackSourceCount, next.fallbackSourceCount),
    };

    return isRealtimeSearchDegraded(merged) ? merged : null;
}

export function buildRealtimeSearchPersistentFeedback(
    meta: RealtimeSearchFeedbackMeta | null
): RealtimeSearchPersistentFeedback | null {
    if (!meta || !isRealtimeSearchDegraded(meta)) {
        return null;
    }

    const sourceCountLabel = `직접 수집 ${meta.directSourceCount}개 소스 · 대체/보완 ${meta.fallbackSourceCount}개 소스`;

    if (meta.fallbackMode === 'tracked_catalog') {
        return {
            ...meta,
            badgeLabel: 'Stored fallback',
            title: '일부 결과는 저장된 비교 데이터로 먼저 보여주고 있습니다.',
            detail: `${sourceCountLabel}. 실시간 쇼핑몰 응답이 회복되면 최신 결과가 다시 채워집니다.`,
        };
    }

    if (meta.fallbackMode === 'naver_only') {
        return {
            ...meta,
            badgeLabel: 'Naver fallback',
            title: '일부 결과는 네이버 분류 기반 fallback으로 보완 중입니다.',
            detail: `${sourceCountLabel}. 잠시 후 같은 검색어를 다시 조회하면 직접 수집 결과가 더 반영될 수 있습니다.`,
        };
    }

    return {
        ...meta,
        badgeLabel: 'Partial sources',
        title: '일부 쇼핑몰 결과는 대체 소스로 보완되어 표시되고 있습니다.',
        detail: `${sourceCountLabel}. 비교는 계속 가능하지만 직접 수집이 늦은 소스는 잠시 후 다시 확인해보세요.`,
    };
}
