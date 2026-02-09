'use client';

import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PricePoint {
    date: string;
    price: number;
}

// Mock Data Generator for "Visual" Logic
const generateMockData = (currentPrice: number): PricePoint[] => {
    const data: PricePoint[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setMonth(now.getMonth() - i);

        // Random fluctuation +/- 20%
        const volatility = (Math.random() - 0.5) * 0.4;
        const price = Math.round(currentPrice * (1 + volatility));

        data.push({
            date: `${date.getMonth() + 1}월`,
            price: i === 0 ? currentPrice : price
        });
    }
    return data;
};

export default function PriceHistoryChart({ currentPrice }: { currentPrice: number }) {
    const data = React.useMemo(() => generateMockData(currentPrice), [currentPrice]);

    return (
        <div className="w-full h-[200px] bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-wider">
                6-Month Price Trend
            </h3>
            <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#000" stopOpacity={0.1} />
                            <stop offset="95%" stopColor="#000" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: '#999' }}
                    />
                    <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#000',
                            border: 'none',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '12px'
                        }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(value: number) => [`${value.toLocaleString()}원`, 'Price']}
                    />
                    <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#000"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        animationDuration={1500}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
