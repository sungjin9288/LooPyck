'use client';

import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { designTokens } from '@/styles/designTokens';

/**
 * Generic Time Series Data Point
 */
export interface DataPoint {
    label: string;
    value: number;
    [key: string]: any;
}

interface DataVisualizerProps {
    data: DataPoint[];
    xKey?: string; // Default: 'label'
    yKey?: string; // Default: 'value'
    referenceValue?: number;
    color?: string;
    height?: number;
    tooltipFormatter?: (value: number) => [string, string];
    yAxisFormatter?: (value: number) => string;
}

export default function DataVisualizer({
    data,
    xKey = 'label',
    yKey = 'value',
    referenceValue,
    color = designTokens.colors.primary,
    height = 250,
    tooltipFormatter,
    yAxisFormatter
}: DataVisualizerProps) {
    return (
        <div style={{ width: '100%', height }}>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                        dataKey={xKey}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        dy={10}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 11, fill: '#94a3b8' }}
                        domain={['auto', 'auto']}
                        tickFormatter={yAxisFormatter}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        formatter={tooltipFormatter}
                    />
                    {referenceValue !== undefined && (
                        <ReferenceLine y={referenceValue} stroke="#cbd5e1" strokeDasharray="3 3" label="Current" />
                    )}
                    <Line
                        type="monotone"
                        dataKey={yKey}
                        stroke={color}
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#fff', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}
