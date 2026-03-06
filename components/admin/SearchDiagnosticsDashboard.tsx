'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';

type SourceSummary = {
    source: string;
    collectionMode: 'api' | 'direct' | 'classified';
    searches: number;
    successCount: number;
    directHits: number;
    fallbackHits: number;
    emptyHits: number;
    totalItems: number;
    avgLatencyMs: number;
    successRate: number;
    lastSeenAt: string;
    lastStrategy: string;
    lastFallbackReason?: string;
};

type RecentSnapshot = {
    query: string;
    effectiveQuery?: string;
    page: number;
    sort: string;
    generatedAt: string;
    queryIntent?: string;
    resultQuality?: 'strong' | 'mixed' | 'weak';
    exactMatchCount?: number;
    strongMatchCount?: number;
    suggestedQueries?: string[];
    totalProducts: number;
    directSourceCount: number;
    fallbackSourceCount: number;
    sources: Array<{
        source: string;
        finalCount: number;
        strategy: string;
        fallbackReason?: string;
        requestedQueries?: string[];
        resolvedQuery?: string;
    }>;
};

type RecentInteraction = {
    type: 'suggestion_click' | 'product_open' | 'store_click';
    query: string;
    generatedAt: string;
    selectedQuery?: string;
    source?: string;
    productId?: string;
    productTitle?: string;
    brand?: string;
    context?: string;
};

type SourceDrilldownItem = {
    query: string;
    effectiveQuery?: string;
    generatedAt: string;
    totalProducts: number;
    finalCount: number;
    strategy: string;
    fallbackReason?: string;
    requestedQueries?: string[];
    resolvedQuery?: string;
};

type SourceTrendPoint = {
    day: string;
    samples: number;
    successSamples: number;
    directSamples: number;
    fallbackSamples: number;
    emptySamples: number;
    totalItems: number;
    successRate: number;
};

type PdpSourceSummary = {
    source: string;
    requests: number;
    cacheHits: number;
    fetchAttempts: number;
    fetchSuccesses: number;
    parseSuccesses: number;
    unsupportedCount: number;
    avgLatencyMs: number;
    cacheHitRate: number;
    fetchSuccessRate: number;
    parseSuccessRate: number;
    lastSeenAt: string;
    lastStrategy: 'cache_hit' | 'fetched' | 'stale_cache_refreshed' | 'fetch_failed' | 'parse_empty' | 'unsupported';
    lastReason?: string;
};

type PdpRecentEvent = {
    source: string;
    strategy: 'cache_hit' | 'fetched' | 'stale_cache_refreshed' | 'fetch_failed' | 'parse_empty' | 'unsupported';
    generatedAt: string;
    durationMs: number;
    cacheHit: boolean;
    fetchAttempted: boolean;
    fetchSucceeded: boolean;
    parseSucceeded: boolean;
    reason?: string;
    productId?: string;
    queryContext?: string;
};

type DiagnosticsResponse = {
    summary: {
        trackedSearches: number;
        lastUpdatedAt: string | null;
        sources: SourceSummary[];
    };
    recent: RecentSnapshot[];
    recentInteractions: RecentInteraction[];
    quality: {
        strong: number;
        mixed: number;
        weak: number;
        lowFitShare: number;
        avgStrongMatches: number;
        avgExactMatches: number;
    };
    interactionSummary: {
        total: number;
        suggestionClicks: number;
        productOpens: number;
        storeClicks: number;
        topSelectedQueries: Array<{ query: string; count: number }>;
        topOpenedBrands: Array<{ brand: string; count: number }>;
    };
    storage: 'memory' | 'firestore';
    pdp: {
        summary: {
            trackedEvents: number;
            lastUpdatedAt: string | null;
            cacheHitRate: number;
            fetchSuccessRate: number;
            parseSuccessRate: number;
            sources: PdpSourceSummary[];
        };
        recent: PdpRecentEvent[];
        storage: 'memory' | 'firestore';
    };
    error?: string;
};

function buildLowFitQueries(recent: RecentSnapshot[]): Array<{ query: string; quality: string; generatedAt: string; suggestedQueries: string[]; totalProducts: number }> {
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

function formatTime(value: string | null | undefined): string {
    if (!value) return '-';
    return new Date(value).toLocaleString('ko-KR', {
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function strategyLabel(strategy: string): string {
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

function collectionModeLabel(mode: SourceSummary['collectionMode']): string {
    switch (mode) {
        case 'api':
            return 'API';
        case 'direct':
            return 'DIRECT';
        default:
            return 'CLASSIFIED';
    }
}

function collectionModeClass(mode: SourceSummary['collectionMode']): string {
    switch (mode) {
        case 'api':
            return 'border-sky-400/30 bg-sky-400/10 text-sky-200';
        case 'direct':
            return 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200';
        default:
            return 'border-amber-400/30 bg-amber-400/10 text-amber-200';
    }
}

function interactionLabel(type: RecentInteraction['type']): string {
    switch (type) {
        case 'suggestion_click':
            return '추천 클릭';
        case 'product_open':
            return '상품 열람';
        default:
            return '쇼핑몰 이동';
    }
}

function pdpStrategyLabel(strategy: PdpRecentEvent['strategy']): string {
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

function isFailureStrategy(strategy: string): boolean {
    return strategy === 'empty' || strategy === 'naver_classified_fallback' || strategy === 'classified_naver';
}

function isDirectStrategy(strategy: string): boolean {
    return strategy === 'direct' || strategy === 'direct_preferred_over_naver';
}

function isFallbackStrategy(strategy: string): boolean {
    return strategy === 'naver_classified_fallback' || strategy === 'classified_naver';
}

function buildSourceDrilldown(recent: RecentSnapshot[], source: string): {
    samples: SourceDrilldownItem[];
    failureSamples: SourceDrilldownItem[];
    fallbackSamples: SourceDrilldownItem[];
    directSamples: SourceDrilldownItem[];
    successSamples: SourceDrilldownItem[];
} {
    const samples = recent.flatMap((snapshot) => {
        const match = snapshot.sources.find((entry) => entry.source === source);
        if (!match) return [];

        return [{
            query: snapshot.query,
            effectiveQuery: snapshot.effectiveQuery,
            generatedAt: snapshot.generatedAt,
            totalProducts: snapshot.totalProducts,
            finalCount: match.finalCount,
            strategy: match.strategy,
            fallbackReason: match.fallbackReason,
            requestedQueries: match.requestedQueries,
            resolvedQuery: match.resolvedQuery,
        }];
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

function buildSourceTrend(recent: RecentSnapshot[], source: string): SourceTrendPoint[] {
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
            successRate: entry.samples > 0
                ? Math.round((entry.successSamples / entry.samples) * 100)
                : 0,
        }))
        .sort((left, right) => left.day.localeCompare(right.day))
        .slice(-7);
}

export default function SearchDiagnosticsDashboard() {
    const { user, loading } = useUser();
    const [data, setData] = useState<DiagnosticsResponse | null>(null);
    const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedSource, setSelectedSource] = useState<string | null>(null);
    const [isAdminAuthorized, setIsAdminAuthorized] = useState<boolean | null>(null);

    useEffect(() => {
        if (!user) {
            setData(null);
            setError(null);
            setIsAdminAuthorized(null);
            return;
        }

        let cancelled = false;
        let intervalId: ReturnType<typeof setInterval> | null = null;

        const fetchDiagnostics = async (): Promise<boolean> => {
            setIsFetching(true);
            try {
                const token = await user.getIdToken();
                const response = await fetch('/api/realtime-search/diagnostics?include=recent&limit=60', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: 'no-store',
                });
                const payload = await response.json();

                if (!response.ok) {
                    if (response.status === 401 || response.status === 403 || response.status === 503) {
                        if (!cancelled) {
                            setIsAdminAuthorized(false);
                            setData(null);
                        }
                    }
                    throw new Error(payload.error || '진단 데이터를 불러오지 못했습니다.');
                }

                if (!cancelled) {
                    setIsAdminAuthorized(true);
                    setData(payload);
                    setError(null);
                }
                return true;
            } catch (fetchError) {
                if (!cancelled) {
                    setError(fetchError instanceof Error ? fetchError.message : '진단 데이터를 불러오지 못했습니다.');
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

    if (loading) {
        return <div className="min-h-screen bg-slate-950 text-slate-200 p-8">Loading...</div>;
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
                <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Only</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Sign In Required</h1>
                    <p className="mt-3 text-sm text-slate-400">관리자 진단 화면을 보려면 먼저 로그인해야 합니다.</p>
                </div>
            </div>
        );
    }

    if (isAdminAuthorized === false) {
        return (
            <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-8">
                <div className="max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-8 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Admin Only</p>
                    <h1 className="mt-3 text-3xl font-black tracking-tight text-white">Access Denied</h1>
                    <p className="mt-3 text-sm text-slate-400">{error || '관리자 권한이 필요합니다.'}</p>
                </div>
            </div>
        );
    }

    if (isAdminAuthorized === null && isFetching && !data) {
        return <div className="min-h-screen bg-slate-950 text-slate-200 p-8">Loading...</div>;
    }

    const summary = data?.summary;
    const totalSources = summary?.sources.length || 0;
    const directSources = summary?.sources.filter((entry) => entry.collectionMode === 'direct').length || 0;
    const fallbackSources = summary?.sources.filter((entry) => entry.fallbackHits > 0).length || 0;
    const selectedSummary = summary?.sources.find((entry) => entry.source === selectedSource) || null;
    const drilldown = buildSourceDrilldown(data?.recent || [], selectedSource || '');
    const trendPoints = buildSourceTrend(data?.recent || [], selectedSource || '');
    const recentSnapshots = (data?.recent || []).slice(0, 12);
    const lowFitQueries = buildLowFitQueries(data?.recent || []);
    const recentInteractions = (data?.recentInteractions || []).slice(0, 12);
    const pdpSummary = data?.pdp.summary;
    const selectedPdpSummary = pdpSummary?.sources.find((entry) => entry.source === selectedSource)
        || pdpSummary?.sources[0]
        || null;
    const recentPdpEvents = (data?.pdp.recent || []).slice(0, 16);
    const pdpFailures = recentPdpEvents.filter((entry) => entry.strategy === 'fetch_failed' || entry.strategy === 'parse_empty');
    const pdpSelectedEvents = recentPdpEvents.filter((entry) => !selectedPdpSummary || entry.source === selectedPdpSummary.source);

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_100%)] text-slate-100">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-sky-300">Search Ops</p>
                        <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Realtime Search Diagnostics</h1>
                        <p className="mt-3 text-sm text-slate-400">
                            소스별 직접 수집 성공률과 Naver fallback 상태를 추적합니다.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
                        <div>Search storage: <span className="font-semibold text-slate-200">{data?.storage || 'memory'}</span></div>
                        <div className="mt-1">PDP storage: <span className="font-semibold text-slate-200">{data?.pdp.storage || 'memory'}</span></div>
                        <div className="mt-1">Last updated: <span className="font-semibold text-slate-200">{formatTime(summary?.lastUpdatedAt)}</span></div>
                        <div className="mt-1">{isFetching ? 'Refreshing...' : 'Auto refresh 15s'}</div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                        {error}
                    </div>
                )}

                <section className="grid gap-4 md:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Tracked Searches</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-white">{summary?.trackedSearches ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Observed Sources</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-white">{totalSources}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Direct-capable Sources</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{directSources}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Fallback Sources</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{fallbackSources}</p>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Strong Fit</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{data?.quality.strong ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Low-fit Share</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-amber-300">{data?.quality.lowFitShare ?? 0}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Suggestion Clicks</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{data?.interactionSummary.suggestionClicks ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Product Opens</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{data?.interactionSummary.productOpens ?? 0}</p>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-4">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Events</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-white">{pdpSummary?.trackedEvents ?? 0}</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Cache Hit</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-emerald-300">{pdpSummary?.cacheHitRate ?? 0}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Fetch Success</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-sky-300">{pdpSummary?.fetchSuccessRate ?? 0}%</p>
                    </div>
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">PDP Parse Success</p>
                        <p className="mt-2 text-4xl font-black tracking-tight text-violet-300">{pdpSummary?.parseSuccessRate ?? 0}%</p>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-bold text-white">PDP Enrichment Sources</h2>
                                <p className="mt-2 text-sm text-slate-400">
                                    캐시 재사용률과 live fetch/parse 성공률을 소스별로 추적합니다.
                                </p>
                            </div>
                            <div className="text-right text-xs text-slate-400">
                                <div>Last PDP update</div>
                                <div className="mt-1 font-semibold text-slate-200">{formatTime(pdpSummary?.lastUpdatedAt)}</div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {(pdpSummary?.sources || []).map((entry) => {
                                const isSelected = selectedPdpSummary?.source === entry.source;
                                return (
                                    <button
                                        key={`pdp_${entry.source}`}
                                        type="button"
                                        onClick={() => setSelectedSource(entry.source)}
                                        className={`w-full rounded-2xl border p-4 text-left transition-colors ${isSelected ? 'border-sky-500/40 bg-slate-900/90' : 'border-slate-800 bg-slate-900/60 hover:bg-slate-900/80'}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <p className="text-sm font-semibold text-white">{entry.source}</p>
                                                <p className="mt-2 text-xs text-slate-400">
                                                    req {entry.requests} · avg {entry.avgLatencyMs}ms · unsupported {entry.unsupportedCount}
                                                </p>
                                            </div>
                                            <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                {pdpStrategyLabel(entry.lastStrategy)}
                                            </span>
                                        </div>
                                        <div className="mt-3 grid gap-2 sm:grid-cols-3">
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                cache <span className="font-semibold text-emerald-200">{entry.cacheHitRate}%</span>
                                            </div>
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                fetch <span className="font-semibold text-sky-200">{entry.fetchSuccessRate}%</span>
                                            </div>
                                            <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-xs text-slate-400">
                                                parse <span className="font-semibold text-violet-200">{entry.parseSuccessRate}%</span>
                                            </div>
                                        </div>
                                        {entry.lastReason && (
                                            <p className="mt-3 text-xs text-amber-200">{entry.lastReason}</p>
                                        )}
                                    </button>
                                );
                            })}
                            {(pdpSummary?.sources || []).length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    PDP enrichment 진단 데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">PDP Recent Events</h2>
                        <p className="mt-2 text-sm text-slate-400">
                            {selectedPdpSummary
                                ? `${selectedPdpSummary.source} 기준 recent cache/fetch/parse 흐름입니다.`
                                : '최근 PDP enrichment 이벤트입니다.'}
                        </p>
                        <div className="mt-4 space-y-3">
                            {(pdpSelectedEvents.length > 0 ? pdpSelectedEvents : pdpFailures).slice(0, 10).map((entry) => (
                                <div key={`${entry.generatedAt}_${entry.source}_${entry.productId || entry.strategy}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{entry.source}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.strategy === 'fetch_failed' || entry.strategy === 'parse_empty' ? 'bg-rose-500/15 text-rose-200' : entry.strategy === 'cache_hit' ? 'bg-emerald-500/15 text-emerald-200' : 'bg-sky-500/15 text-sky-200'}`}>
                                            {pdpStrategyLabel(entry.strategy)}
                                        </span>
                                    </div>
                                    <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                        <span className="rounded-full border border-slate-800 px-2 py-1">latency {entry.durationMs}ms</span>
                                        <span className="rounded-full border border-slate-800 px-2 py-1">{entry.cacheHit ? 'cache' : 'live'}</span>
                                        {entry.fetchAttempted && (
                                            <span className="rounded-full border border-slate-800 px-2 py-1">
                                                fetch {entry.fetchSucceeded ? 'ok' : 'fail'}
                                            </span>
                                        )}
                                        <span className="rounded-full border border-slate-800 px-2 py-1">
                                            parse {entry.parseSucceeded ? 'ok' : 'miss'}
                                        </span>
                                    </div>
                                    {(entry.reason || entry.productId || entry.queryContext) && (
                                        <div className="mt-3 text-xs text-slate-400">
                                            {entry.reason && <div>reason: <span className="text-amber-200">{entry.reason}</span></div>}
                                            {entry.productId && <div>product: <span className="text-slate-200">{entry.productId}</span></div>}
                                            {entry.queryContext && <div>query: <span className="text-slate-200">{entry.queryContext}</span></div>}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {recentPdpEvents.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 PDP enrichment 이벤트가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-8 grid gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Low-fit Queries</h2>
                        <div className="mt-4 space-y-3">
                            {lowFitQueries.map((entry) => (
                                <div key={`${entry.generatedAt}_${entry.query}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{entry.query}</p>
                                        </div>
                                        <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${entry.quality === 'weak' ? 'bg-rose-500/15 text-rose-200' : 'bg-amber-500/15 text-amber-200'}`}>
                                            {entry.quality}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-xs text-slate-400">totalProducts {entry.totalProducts}</div>
                                    {entry.suggestedQueries.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {entry.suggestedQueries.map((suggestion) => (
                                                <span key={`${entry.generatedAt}_${suggestion}`} className="rounded-full border border-slate-800 px-2 py-1 text-[11px] text-slate-300">
                                                    {suggestion}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {lowFitQueries.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 low-fit query가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-slate-800 bg-slate-950/60 p-5">
                        <h2 className="text-lg font-bold text-white">Interaction Signals</h2>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Suggested Queries</p>
                                <div className="mt-3 space-y-2">
                                    {(data?.interactionSummary.topSelectedQueries || []).map((entry) => (
                                        <div key={entry.query} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                                            <span>{entry.query}</span>
                                            <span className="font-semibold text-sky-200">{entry.count}</span>
                                        </div>
                                    ))}
                                    {(data?.interactionSummary.topSelectedQueries || []).length === 0 && (
                                        <div className="text-sm text-slate-500">추천 클릭 데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Top Opened Brands</p>
                                <div className="mt-3 space-y-2">
                                    {(data?.interactionSummary.topOpenedBrands || []).map((entry) => (
                                        <div key={entry.brand} className="flex items-center justify-between gap-3 text-sm text-slate-300">
                                            <span>{entry.brand}</span>
                                            <span className="font-semibold text-violet-200">{entry.count}</span>
                                        </div>
                                    ))}
                                    {(data?.interactionSummary.topOpenedBrands || []).length === 0 && (
                                        <div className="text-sm text-slate-500">상품 열람 데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {recentInteractions.map((entry) => (
                                <div key={`${entry.generatedAt}_${entry.type}_${entry.productId || entry.selectedQuery || entry.query}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(entry.generatedAt)}</p>
                                            <p className="mt-1 text-sm font-semibold text-white">{interactionLabel(entry.type)}</p>
                                        </div>
                                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                            {entry.context || 'general'}
                                        </span>
                                    </div>
                                    <div className="mt-3 text-xs text-slate-400">
                                        <div>query: <span className="text-slate-200">{entry.query}</span></div>
                                        {entry.selectedQuery && <div>selected: <span className="text-sky-200">{entry.selectedQuery}</span></div>}
                                        {entry.productTitle && <div>product: <span className="text-slate-200">{entry.productTitle}</span></div>}
                                        {entry.brand && <div>brand: <span className="text-slate-200">{entry.brand}</span></div>}
                                        {entry.source && <div>source: <span className="text-slate-200">{entry.source}</span></div>}
                                    </div>
                                </div>
                            ))}
                            {recentInteractions.length === 0 && (
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-500">
                                    최근 interaction 데이터가 없습니다.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section className="mt-8 overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/60">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="text-lg font-bold text-white">Source Summary</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="bg-slate-900/80 text-left text-xs uppercase tracking-[0.16em] text-slate-500">
                                <tr>
                                    <th className="px-5 py-3">Source</th>
                                    <th className="px-5 py-3">Success</th>
                                    <th className="px-5 py-3">Avg Latency</th>
                                    <th className="px-5 py-3">Direct</th>
                                    <th className="px-5 py-3">Fallback</th>
                                    <th className="px-5 py-3">Empty</th>
                                    <th className="px-5 py-3">Last Strategy</th>
                                    <th className="px-5 py-3">Last Seen</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(summary?.sources || []).map((entry) => {
                                    const isSelected = selectedSource === entry.source;
                                    return (
                                    <tr
                                        key={entry.source}
                                        className={`border-t border-slate-800 text-slate-200 transition-colors ${isSelected ? 'bg-slate-900/80' : 'hover:bg-slate-900/40'}`}
                                    >
                                        <td className="px-5 py-4">
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSource(entry.source)}
                                                className="text-left"
                                            >
                                                <div className="font-semibold text-white">{entry.source}</div>
                                            </button>
                                            <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-[0.14em] ${collectionModeClass(entry.collectionMode)}`}>
                                                {collectionModeLabel(entry.collectionMode)}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">{entry.successRate}%</td>
                                        <td className="px-5 py-4">{entry.avgLatencyMs}ms</td>
                                        <td className="px-5 py-4">{entry.directHits}</td>
                                        <td className="px-5 py-4 text-amber-300">{entry.fallbackHits}</td>
                                        <td className="px-5 py-4 text-rose-300">{entry.emptyHits}</td>
                                        <td className="px-5 py-4">
                                            <div>{strategyLabel(entry.lastStrategy)}</div>
                                            {entry.lastFallbackReason && (
                                                <div className="mt-1 text-xs text-slate-500">{entry.lastFallbackReason}</div>
                                            )}
                                        </td>
                                        <td className="px-5 py-4 text-slate-400">{formatTime(entry.lastSeenAt)}</td>
                                    </tr>
                                )})}
                                {(summary?.sources || []).length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-10 text-center text-slate-500">
                                            수집된 진단 데이터가 없습니다.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="text-lg font-bold text-white">Source Drill-down</h2>
                    </div>
                    {selectedSummary ? (
                        <div className="p-5">
                            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-2xl font-black tracking-tight text-white">{selectedSummary.source}</h3>
                                        <span className={`inline-flex rounded-full border px-2 py-1 text-[10px] font-bold tracking-[0.16em] ${collectionModeClass(selectedSummary.collectionMode)}`}>
                                            {collectionModeLabel(selectedSummary.collectionMode)}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-400">
                                        최근 실패 샘플 query, source별 resolved query, fallback reason을 바로 확인할 수 있습니다.
                                    </p>
                                </div>
                                <div className="grid grid-cols-3 gap-3 text-xs text-slate-400">
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                        <div>Direct Hits</div>
                                        <div className="mt-1 text-lg font-bold text-emerald-300">{selectedSummary.directHits}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                        <div>Fallback Hits</div>
                                        <div className="mt-1 text-lg font-bold text-amber-300">{selectedSummary.fallbackHits}</div>
                                    </div>
                                    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3">
                                        <div>Empty Hits</div>
                                        <div className="mt-1 text-lg font-bold text-rose-300">{selectedSummary.emptyHits}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <h4 className="text-sm font-bold text-white">Failure / Fallback Samples</h4>
                                    <div className="mt-4 space-y-3">
                                        {drilldown.failureSamples.slice(0, 8).map((sample) => (
                                            <div key={`${sample.generatedAt}_${sample.query}_${sample.strategy}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(sample.generatedAt)}</p>
                                                        <p className="mt-1 text-sm font-semibold text-white">{sample.query}</p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                        {strategyLabel(sample.strategy)}
                                                    </span>
                                                </div>
                                                <div className="mt-3 text-xs text-slate-400">
                                                    <div>finalCount: {sample.finalCount}</div>
                                                    {sample.resolvedQuery && <div>resolved: <span className="text-sky-200">{sample.resolvedQuery}</span></div>}
                                                    {sample.requestedQueries && sample.requestedQueries.length > 1 && (
                                                        <div>candidates: <span className="text-slate-300">{sample.requestedQueries.join(' / ')}</span></div>
                                                    )}
                                                    <div>reason: <span className="text-amber-200">{sample.fallbackReason || 'none'}</span></div>
                                                </div>
                                            </div>
                                        ))}
                                        {drilldown.failureSamples.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                                최근 window에서 failure / fallback 샘플이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                    <h4 className="text-sm font-bold text-white">Successful Samples</h4>
                                    <div className="mt-4 space-y-3">
                                        {drilldown.successSamples.slice(0, 8).map((sample) => (
                                            <div key={`${sample.generatedAt}_${sample.query}_${sample.strategy}_activity`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{formatTime(sample.generatedAt)}</p>
                                                        <p className="mt-1 text-sm font-semibold text-white">{sample.query}</p>
                                                    </div>
                                                    <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">
                                                        {strategyLabel(sample.strategy)}
                                                    </span>
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                                                    <span className="rounded-full border border-slate-800 px-2 py-1">final {sample.finalCount}</span>
                                                    <span className="rounded-full border border-slate-800 px-2 py-1">total {sample.totalProducts}</span>
                                                    {sample.resolvedQuery && (
                                                        <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-sky-200">
                                                            resolved {sample.resolvedQuery}
                                                        </span>
                                                    )}
                                                    {sample.fallbackReason && (
                                                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-amber-200">
                                                            {sample.fallbackReason}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                        {drilldown.successSamples.length === 0 && (
                                            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                                최근 성공 샘플이 없습니다.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <h4 className="text-sm font-bold text-white">Recent Daily Trend</h4>
                                <div className="mt-4 space-y-3">
                                    {trendPoints.map((point) => (
                                        <div key={`${selectedSummary.source}_${point.day}`} className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3">
                                            <div className="mb-2 flex items-center justify-between gap-3">
                                                <div>
                                                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{point.day}</p>
                                                    <p className="mt-1 text-sm text-slate-300">{point.samples} samples · {point.totalItems} items</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-white">{point.successRate}%</p>
                                                    <p className="text-[11px] text-slate-500">success rate</p>
                                                </div>
                                            </div>
                                            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                                                <div
                                                    className="h-full bg-emerald-400"
                                                    style={{ width: `${point.samples > 0 ? (point.directSamples / point.samples) * 100 : 0}%` }}
                                                />
                                                <div
                                                    className="h-full bg-amber-400"
                                                    style={{ width: `${point.samples > 0 ? (point.fallbackSamples / point.samples) * 100 : 0}%`, marginTop: '-0.75rem' }}
                                                />
                                                <div
                                                    className="h-full bg-rose-400"
                                                    style={{ width: `${point.samples > 0 ? (point.emptySamples / point.samples) * 100 : 0}%`, marginTop: '-0.75rem' }}
                                                />
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
                                                <span className="rounded-full border border-slate-800 px-2 py-1 text-emerald-300">direct {point.directSamples}</span>
                                                <span className="rounded-full border border-slate-800 px-2 py-1 text-amber-300">fallback {point.fallbackSamples}</span>
                                                <span className="rounded-full border border-slate-800 px-2 py-1 text-rose-300">empty {point.emptySamples}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {trendPoints.length === 0 && (
                                        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 text-sm text-slate-500">
                                            최근 추이 데이터가 없습니다.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="p-5 text-sm text-slate-500">선택된 소스가 없습니다.</div>
                    )}
                </section>

                <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-950/60">
                    <div className="border-b border-slate-800 px-5 py-4">
                        <h2 className="text-lg font-bold text-white">Recent Searches</h2>
                    </div>
                    <div className="grid gap-4 p-5 lg:grid-cols-2">
                        {recentSnapshots.map((snapshot) => (
                            <article key={`${snapshot.generatedAt}_${snapshot.query}_${snapshot.page}`} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">{formatTime(snapshot.generatedAt)}</p>
                                        <h3 className="mt-2 text-lg font-bold text-white">{snapshot.query}</h3>
                                        <p className="mt-1 text-sm text-slate-400">
                                            page {snapshot.page} · {snapshot.sort} · {snapshot.totalProducts} products
                                        </p>
                                        {snapshot.effectiveQuery && snapshot.effectiveQuery !== snapshot.query && (
                                            <p className="mt-1 text-xs text-sky-200">effective {snapshot.effectiveQuery}</p>
                                        )}
                                    </div>
                                    <div className="text-right text-xs text-slate-400">
                                        <div>Direct {snapshot.directSourceCount}</div>
                                        <div>Fallback {snapshot.fallbackSourceCount}</div>
                                        {snapshot.resultQuality && <div>Fit {snapshot.resultQuality}</div>}
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    {snapshot.sources
                                        .filter((source) => source.finalCount > 0)
                                        .map((source) => (
                                            <span key={`${snapshot.generatedAt}_${source.source}`} className="rounded-full border border-slate-700 bg-slate-950/80 px-3 py-1 text-xs text-slate-300">
                                                {source.source} · {strategyLabel(source.strategy)} · {source.finalCount}
                                            </span>
                                        ))}
                                </div>
                            </article>
                        ))}
                        {(data?.recent || []).length === 0 && (
                            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-sm text-slate-500">
                                최근 검색 진단 데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}
