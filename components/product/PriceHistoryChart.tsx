'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PricePoint {
    date: string;
    price: number;
    capturedAt: number;
}

interface PriceHistoryChartProps {
    source: string;
    productId: string;
    currentPrice: number;
}

function formatLabel(capturedAt: number): string {
    const date = new Date(capturedAt);
    return `${date.getMonth() + 1}/${date.getDate()}`;
}

function getInsight(
    data: PricePoint[],
    enabled: boolean
): { text: string; color: string } {
    if (!enabled) {
        return { text: '서버 가격 이력 기능이 비활성화되어 있습니다', color: 'text-slate-500' };
    }
    if (data.length < 2) {
        return { text: '가격 이력 수집 중입니다', color: 'text-slate-500' };
    }

    const first = data[0].price;
    const last = data[data.length - 1].price;
    const min = Math.min(...data.map(d => d.price));
    const diff = ((last - first) / first) * 100;

    if (last <= min) return { text: '현재 가격대가 상대적으로 낮게 추정됩니다', color: 'text-green-600' };
    if (diff < -5) return { text: `변동 추정치 기준 하락 흐름이 관찰됩니다`, color: 'text-green-600' };
    if (diff > 10) return { text: `변동 추정치 기준 상승 흐름입니다`, color: 'text-amber-600' };
    return { text: '최근 가격 변동이 크지 않은 패턴입니다', color: 'text-slate-500' };
}

export default function PriceHistoryChart({ source, productId, currentPrice }: PriceHistoryChartProps) {
    const [data, setData] = useState<PricePoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [enabled, setEnabled] = useState(true);

    useEffect(() => {
        if (!source || !productId) return;

        const controller = new AbortController();

        async function loadHistory() {
            setLoading(true);
            try {
                const res = await fetch(
                    `/api/price-history?source=${encodeURIComponent(source)}&id=${encodeURIComponent(productId)}&limit=24`,
                    { signal: controller.signal }
                );
                if (!res.ok) {
                    throw new Error(`history request failed: ${res.status}`);
                }

                const payload = await res.json() as {
                    enabled?: boolean;
                    points?: Array<{ price: number; capturedAt: number }>;
                };

                setEnabled(payload.enabled !== false);
                const points = Array.isArray(payload.points) ? payload.points : [];
                const normalized = points
                    .filter((point) => Number.isFinite(point.price) && Number.isFinite(point.capturedAt))
                    .map((point) => ({
                        price: Math.round(point.price),
                        capturedAt: point.capturedAt,
                        date: formatLabel(point.capturedAt),
                    }))
                    .sort((a, b) => a.capturedAt - b.capturedAt)
                    .slice(-7);

                if (normalized.length === 0) {
                    setData([{
                        price: currentPrice,
                        capturedAt: Date.now(),
                        date: '현재',
                    }]);
                } else {
                    setData(normalized);
                }
            } catch (error) {
                if (error instanceof DOMException && error.name === 'AbortError') {
                    return;
                }
                console.error('[PriceHistoryChart] load failed:', error);
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
    }, [source, productId, currentPrice]);

    const insight = useMemo(() => getInsight(data, enabled), [data, enabled]);

    return (
        <div className="w-full bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    6개월 가격 변동 추정
                </h3>
                <span className={`text-[11px] font-medium ${insight.color}`}>
                    {insight.text}
                </span>
            </div>
            <div className="h-[180px]">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">
                        가격 이력을 불러오는 중...
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data}>
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
                                formatter={(value: number) => [`${value.toLocaleString()}원`, '가격']}
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
                    </ResponsiveContainer>
                )}
            </div>
        </div>
    );
}
