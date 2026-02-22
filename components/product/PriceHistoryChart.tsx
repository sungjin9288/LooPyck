'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PricePoint {
    date: string;
    price: number;
}

/**
 * 결정론적 유사 난수 생성 (시드 기반)
 * 동일 상품 = 동일 차트 (새로고침 시 변하지 않음)
 */
function seededRandom(seed: number): number {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
}

function generateDeterministicData(currentPrice: number): PricePoint[] {
    const data: PricePoint[] = [];
    const now = new Date();
    // 가격을 시드로 사용하여 같은 상품이면 항상 같은 차트
    const seed = currentPrice;

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);

        // 시드 기반 변동 (±15%)
        const noise = (seededRandom(seed + i * 137) - 0.5) * 0.3;
        const price = Math.round(currentPrice * (1 + noise));

        data.push({
            date: `${date.getMonth() + 1}월`,
            price: i === 0 ? currentPrice : price,
        });
    }
    return data;
}

function getInsight(data: PricePoint[]): { text: string; color: string } {
    const first = data[0].price;
    const last = data[data.length - 1].price;
    const min = Math.min(...data.map(d => d.price));
    const diff = ((last - first) / first) * 100;

    if (last <= min) return { text: '현재가가 6개월 최저가입니다! 구매 적기 🎯', color: 'text-green-600' };
    if (diff < -5) return { text: `6개월 전 대비 ${Math.abs(diff).toFixed(0)}% 하락 추세입니다`, color: 'text-green-600' };
    if (diff > 10) return { text: `가격이 상승 추세입니다. 알림 설정을 추천합니다`, color: 'text-amber-600' };
    return { text: '가격이 안정적으로 유지되고 있습니다', color: 'text-slate-500' };
}

export default function PriceHistoryChart({ currentPrice }: { currentPrice: number }) {
    const data = React.useMemo(() => generateDeterministicData(currentPrice), [currentPrice]);
    const insight = React.useMemo(() => getInsight(data), [data]);

    return (
        <div className="w-full bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    6개월 가격 추이
                </h3>
                <span className={`text-[11px] font-medium ${insight.color}`}>
                    {insight.text}
                </span>
            </div>
            <div className="h-[180px]">
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
                            animationDuration={1200}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
