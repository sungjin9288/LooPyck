'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { getFreshnessBadgeClassName, summarizePriceHistoryFreshness } from '@/lib/product/dataFreshness';
import { computePriceVerdict, type PriceVerdict, type PriceVerdictLevel } from '@/lib/product/priceVerdict';
import { Logger } from '@/lib/core/observability';

interface PricePoint {
    date: string;
    price: number;
    capturedAt: number;
    stockStatus?: 'in_stock' | 'low_stock' | 'sold_out' | 'unknown';
    stockText?: string;
}

interface PriceHistoryChartProps {
    source: string;
    productId: string;
    currentPrice: number;
    variantKey?: string;
    variantLabel?: string;
    optionKey?: string;
    optionLabel?: string;
}

function formatLabel(capturedAt: number): string {
    const date = new Date(capturedAt);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function verdictBadgeClass(level: PriceVerdictLevel): string {
    switch (level) {
        case 'great_deal':
            return 'border-emerald-300 bg-emerald-50 text-emerald-700';
        case 'good':
            return 'border-emerald-200 bg-emerald-50 text-emerald-600';
        case 'high':
            return 'border-amber-300 bg-amber-50 text-amber-700';
        case 'insufficient':
            return 'border-slate-200 bg-slate-50 text-slate-400';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-600';
    }
}

function verdictReasonClass(level: PriceVerdictLevel): string {
    switch (level) {
        case 'great_deal':
        case 'good':
            return 'text-emerald-600';
        case 'high':
            return 'text-amber-600';
        default:
            return 'text-slate-500';
    }
}

function resolveScopeHeading(scope: 'product' | 'option' | 'variant'): string {
    if (scope === 'variant') return '실제 SKU 기준 가격 흐름';
    if (scope === 'option') return '옵션 기준 가격 흐름';
    return '최근 수집된 가격 흐름';
}

function resolveScopeCaption(
    scope: 'product' | 'option' | 'variant',
    variantLabel?: string,
    optionLabel?: string
): string | null {
    if (scope === 'variant') {
        return variantLabel || optionLabel || null;
    }

    if (scope === 'option') {
        if (variantLabel && optionLabel) {
            return `실제 SKU 이력 미수집으로 옵션 기준 표시 · ${optionLabel}`;
        }
        return optionLabel || variantLabel || null;
    }

    if (variantLabel) {
        return `실제 SKU 이력 미수집으로 상품 기준 표시 · ${variantLabel}`;
    }

    if (optionLabel) {
        return `옵션 이력 미수집으로 상품 기준 표시 · ${optionLabel}`;
    }

    return null;
}

export default function PriceHistoryChart({
    source,
    productId,
    currentPrice,
    variantKey,
    variantLabel,
    optionKey,
    optionLabel,
}: PriceHistoryChartProps) {
    const [data, setData] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(true);
    const [scope, setScope] = useState<'product' | 'option' | 'variant'>('product');
    const [verdict, setVerdict] = useState<PriceVerdict | null>(null);
    const [latestRecordedAt, setLatestRecordedAt] = useState<number | null>(null);
    const chartContainerRef = useRef<HTMLDivElement | null>(null);
    const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

    useEffect(() => {
        if (!source || !productId) return;

        const controller = new AbortController();

        async function loadHistory() {
            setLoading(true);
            setLatestRecordedAt(null);
            try {
                const params = new URLSearchParams({
                    source,
                    id: productId,
                    limit: '24',
                });
                if (variantKey) {
                    params.set('variantKey', variantKey);
                }
                if (optionKey) {
                    params.set('optionKey', optionKey);
                }

                const res = await fetch(`/api/price-history?${params.toString()}`, { signal: controller.signal });
                if (!res.ok) {
                    throw new Error(`history request failed: ${res.status}`);
                }

                const payload = await res.json() as {
                    enabled?: boolean;
                    points?: Array<{
                        price: number;
                        capturedAt: number;
                        stockStatus?: 'in_stock' | 'low_stock' | 'sold_out' | 'unknown';
                        stockText?: string;
                    }>;
                    scope?: 'product' | 'option' | 'variant';
                };

                setEnabled(payload.enabled !== false);
                setScope(payload.scope === 'variant' ? 'variant' : payload.scope === 'option' ? 'option' : 'product');
                const points = Array.isArray(payload.points) ? payload.points : [];
                const sortedPoints = points
                    .filter((point) => Number.isFinite(point.price) && Number.isFinite(point.capturedAt))
                    .map((point) => ({
                        price: Math.round(point.price),
                        capturedAt: point.capturedAt,
                        date: formatLabel(point.capturedAt),
                        stockStatus: point.stockStatus,
                        stockText: point.stockText,
                    }))
                    .sort((a, b) => a.capturedAt - b.capturedAt);

                // verdict 는 통계 정확도를 위해 전체 수집 구간을, 차트는 가독성을
                // 위해 최근 7개만 사용한다.
                setVerdict(computePriceVerdict(sortedPoints, currentPrice));

                const normalized = sortedPoints.slice(-7);

                if (normalized.length === 0) {
                    setLatestRecordedAt(null);
                    setData([{
                        price: currentPrice,
                        capturedAt: Date.now(),
                        date: '현재',
                    }]);
                } else {
                    setLatestRecordedAt(normalized[normalized.length - 1]?.capturedAt ?? null);
                    setData(normalized);
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
                Logger.error('[PriceHistoryChart] load failed', error);
                setVerdict(computePriceVerdict([], currentPrice));
                setLatestRecordedAt(null);
                setData([{
                    price: currentPrice,
                    capturedAt: Date.now(),
                    date: '현재',
                }]);
            } finally {
                setLoading(false);
            }
        }

        void loadHistory();
        return () => controller.abort();
    }, [source, productId, currentPrice, variantKey, optionKey]);

    const scopeCaption = useMemo(
        () => resolveScopeCaption(scope, variantLabel, optionLabel),
        [scope, variantLabel, optionLabel]
    );

    const historyFreshness = useMemo(() => summarizePriceHistoryFreshness(latestRecordedAt), [latestRecordedAt]);
    const canRenderChart = !loading && chartSize.width > 0 && chartSize.height > 0;

    useEffect(() => {
        const element = chartContainerRef.current;
        if (!element) return;

        const updateSize = () => {
            const nextWidth = element.clientWidth;
            const nextHeight = element.clientHeight;
            setChartSize((current) => (
                current.width === nextWidth && current.height === nextHeight
                    ? current
                    : { width: nextWidth, height: nextHeight }
            ));
        };

        updateSize();

        if (typeof ResizeObserver === 'undefined') {
            const frameId = window.requestAnimationFrame(updateSize);
            return () => window.cancelAnimationFrame(frameId);
        }

        const observer = new ResizeObserver(() => updateSize());
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return (
        <div className="w-full bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        {resolveScopeHeading(scope)}
                    </h3>
                    {scopeCaption && (
                        <p className="mt-1 text-[11px] text-slate-400">
                            {scopeCaption}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2">
                    {verdict && verdict.level !== 'insufficient' && (
                        <span className={`rounded-full border px-2.5 py-1 text-[11px] font-bold ${verdictBadgeClass(verdict.level)}`}>
                            {verdict.label}
                        </span>
                    )}
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getFreshnessBadgeClassName(historyFreshness.status)}`}>
                        {historyFreshness.shortLabel}
                    </span>
                </div>
            </div>
            {verdict && (
                <p className={`mb-2 text-xs font-medium ${verdictReasonClass(verdict.level)}`}>
                    {verdict.reason}
                </p>
            )}
            {historyFreshness.status !== 'unknown' && (
                <p className="mb-3 text-[11px] text-slate-400">
                    마지막 가격 수집: {historyFreshness.detailLabel}
                </p>
            )}
            <div ref={chartContainerRef} className="h-[180px] min-w-0">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        가격 이력을 불러오는 중...
                    </div>
                ) : !canRenderChart ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        차트 영역을 준비하는 중...
                    </div>
                ) : (
                    <AreaChart width={chartSize.width} height={chartSize.height} data={data}>
                        <defs>
                            <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.12} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 10, fill: '#94a3b8' }}
                        />
                        <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: 'none',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number, _name, item) => {
                                const payload = item.payload as PricePoint | undefined;
                                const lines = [`${value.toLocaleString()}원`];
                                if (payload?.stockStatus === 'sold_out') {
                                    lines.push('품절');
                                } else if (payload?.stockStatus === 'low_stock') {
                                    lines.push('재고 적음');
                                }
                                return [lines.join(' · '), '가격'];
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="price"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorPrice)"
                            animationDuration={800}
                        />
                    </AreaChart>
                )}
            </div>
        </div>
    );
}
