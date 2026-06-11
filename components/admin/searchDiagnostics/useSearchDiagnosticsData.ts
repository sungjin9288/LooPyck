'use client';

import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import type { User } from 'firebase/auth';
import { performanceMonitor } from '@/lib/core/performanceMonitor';
import { parseJsonResponseSafely } from './helpers';
import type { DiagnosticsResponse, SearchDiagnosticsFetchTelemetry } from './types';

type UseSearchDiagnosticsDataResult = {
    data: DiagnosticsResponse | null;
    setData: Dispatch<SetStateAction<DiagnosticsResponse | null>>;
    isFetching: boolean;
    error: string | null;
    isAdminAuthorized: boolean | null;
    selectedSource: string | null;
    setSelectedSource: Dispatch<SetStateAction<string | null>>;
    fetchTelemetry: SearchDiagnosticsFetchTelemetry;
};

const INITIAL_FETCH_TELEMETRY: SearchDiagnosticsFetchTelemetry = {
    lastStartedAt: null,
    lastCompletedAt: null,
    lastSuccessfulAt: null,
    lastErrorAt: null,
    lastDurationMs: null,
    averageDurationMs: 0,
    requestCount: 0,
    successCount: 0,
    failureCount: 0,
    consecutiveFailures: 0,
    recentErrors: [],
};

export function useSearchDiagnosticsData(user: User | null): UseSearchDiagnosticsDataResult {
    const [data, setData] = useState<DiagnosticsResponse | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);
    const [fetchTelemetry, setFetchTelemetry] = useState<SearchDiagnosticsFetchTelemetry>(INITIAL_FETCH_TELEMETRY);

    useEffect(() => {
        if (!user || user.isAnonymous) {
            setData(null);
            setError(null);
            setIsAdminAuthorized(null);
            setFetchTelemetry(INITIAL_FETCH_TELEMETRY);
            return;
        }

        let cancelled = false;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const fetchDiagnostics = async (): Promise<boolean> => {
            setIsFetching(true);
            const startedAt = new Date().toISOString();
            const startedAtMs = Date.now();
            setFetchTelemetry((current) => ({
                ...current,
                lastStartedAt: startedAt,
            }));
            try {
                const response = await performanceMonitor.trackAsync('admin:realtime-search-diagnostics', async () => {
                    const token = await user.getIdToken();
                    return fetch('/api/realtime-search/diagnostics?include=recent&limit=60', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: 'no-store',
                    });
                });
                const payload = await parseJsonResponseSafely(response);

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403 || response.status === 503) {
                        if (!cancelled) {
                            setIsAdminAuthorized(false);
                            setData(null);
                        }
                    }
                    const message = payload && typeof payload === 'object' && typeof payload.error === 'string'
                        ? payload.error
                        : `진단 데이터를 불러오지 못했습니다. status=${response.status}`;
                    throw new Error(message);
                }

                if (!payload) {
                    throw new Error('진단 API가 비어 있는 응답을 반환했습니다.');
                }

                const completedAt = new Date().toISOString();
                const durationMs = Date.now() - startedAtMs;
                if (!cancelled) {
                    setIsAdminAuthorized(true);
                    setData(payload as DiagnosticsResponse);
                    setError(null);
                    setFetchTelemetry((current) => {
                        const requestCount = current.requestCount + 1;
                        const successCount = current.successCount + 1;
                        const durationTotal = current.averageDurationMs * current.requestCount + durationMs;

                        return {
                            ...current,
                            lastCompletedAt: completedAt,
                            lastSuccessfulAt: completedAt,
                            lastDurationMs: durationMs,
                            averageDurationMs: Math.round(durationTotal / requestCount),
                            requestCount,
                            successCount,
                            failureCount: current.failureCount,
                            consecutiveFailures: 0,
                        };
                    });
                }
                return true;
            } catch (fetchError) {
                const completedAt = new Date().toISOString();
                const durationMs = Date.now() - startedAtMs;
                const message = fetchError instanceof Error ? fetchError.message : '진단 데이터를 불러오지 못했습니다.';
                if (!cancelled) {
                    setError(message);
                    setFetchTelemetry((current) => {
                        const requestCount = current.requestCount + 1;
                        const failureCount = current.failureCount + 1;
                        const durationTotal = current.averageDurationMs * current.requestCount + durationMs;

                        return {
                            ...current,
                            lastCompletedAt: completedAt,
                            lastErrorAt: completedAt,
                            lastDurationMs: durationMs,
                            averageDurationMs: Math.round(durationTotal / requestCount),
                            requestCount,
                            successCount: current.successCount,
                            failureCount,
                            consecutiveFailures: current.consecutiveFailures + 1,
                            recentErrors: [
                                { message, at: completedAt },
                                ...current.recentErrors,
                            ].slice(0, 5),
                        };
                    });
                }
                return false;
            } finally {
                if (!cancelled) {
                    setIsFetching(false);
                }
            }
        };

        void (async () => {
            const shouldPoll = await fetchDiagnostics();
            if (!cancelled && shouldPoll) {
                intervalId = setInterval(() => {
                    void fetchDiagnostics();
                }, 15_000);
            }
        })();

        return () => {
            cancelled = true;
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [user]);

    useEffect(() => {
        const firstSource = data?.summary.sources[0]?.source || null;
        if (!firstSource) return;
        if (!selectedSource || !data?.summary.sources.some((entry) => entry.source === selectedSource)) {
            setSelectedSource(firstSource);
        }
    }, [data, selectedSource]);

    return {
        data,
        setData,
        isFetching,
        error,
        isAdminAuthorized,
        selectedSource,
        setSelectedSource,
        fetchTelemetry,
    };
}
