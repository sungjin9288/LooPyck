'use client';

/**
 * ROI Chart - Interactive Recharts Visualization
 * 사용자가 입력값을 변경하면 즉시 반영되는 대화형 차트
 */

import React, { useState, useEffect } from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LineChart,
    Line,
    ComposedChart,
    Area
} from 'recharts';
import { calculateROI, DEFAULT_ROI_INPUTS, RoiInputs, RoiOutputs } from '@/lib/analytics/roiEstimator';

export default function ROIChart() {
    const [inputs, setInputs] = useState<RoiInputs>(DEFAULT_ROI_INPUTS);
    const [roiMetrics, setRoiMetrics] = useState<RoiOutputs | null>(null);

    useEffect(() => {
        const results = calculateROI(inputs);
        setRoiMetrics(results);
    }, [inputs]);

    if (!roiMetrics) return null;

    // 차트 데이터 생성
    const costData = [
        {
            name: 'Monthly Cost',
            Manual: roiMetrics.details.manualCost,
            LooPyck: roiMetrics.details.automatedCost,
        },
    ];

    // 연간 누적 절감액 데이터 (12개월)
    const savingsProjection = Array.from({ length: 12 }, (_, i) => ({
        month: `M${i + 1}`,
        CumulativeSavings: roiMetrics.monthlySavings * (i + 1),
        Investment: i === 0 ? 5000000 + 100000 : 100000, // 첫 달 개발비+유지비, 이후 유지비
    }));

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({
            ...prev,
            [name]: Number(value),
        }));
    };

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>💰 Validated ROI Simulator</h2>

            <div style={styles.grid}>
                {/* Controls */}
                <div style={styles.controls}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Monthly Items</label>
                        <input
                            type="number"
                            name="monthlyVolume"
                            value={inputs.monthlyVolume}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Manual Cost (₩)</label>
                        <input
                            type="number"
                            name="manualCostPerItem"
                            value={inputs.manualCostPerItem}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>Manual Time (min)</label>
                        <input
                            type="number"
                            name="manualTimePerItem"
                            value={inputs.manualTimePerItem}
                            onChange={handleInputChange}
                            style={styles.input}
                        />
                    </div>
                </div>

                {/* Big Metrics */}
                <div style={styles.metrics}>
                    <MetricCard
                        label="Annual Savings"
                        value={`₩${(roiMetrics.annualSavings / 1000000).toFixed(1)}M`}
                        highlight
                    />
                    <MetricCard
                        label="ROI (1st Year)"
                        value={`${roiMetrics.roiPercent}%`}
                        color="#3b82f6"
                    />
                    <MetricCard
                        label="Payback Period"
                        value={`${roiMetrics.paybackDays} Days`}
                        color="#f59e0b"
                    />
                    <MetricCard
                        label="FTE Saved"
                        value={`${roiMetrics.fteFreed} People`}
                        color="#8b5cf6"
                    />
                </div>
            </div>

            {/* Charts Row */}
            <div style={styles.chartRow}>
                {/* Cost Comparison Chart */}
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Business Cost Comparison (Monthly)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={costData} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" hide />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                                formatter={(value: number) => `₩${value.toLocaleString()}`}
                            />
                            <Legend />
                            <Bar dataKey="Manual" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={40} />
                            <Bar dataKey="LooPyck" fill="#10b981" radius={[0, 4, 4, 0]} barSize={40} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Savings Projection Chart */}
                <div style={styles.chartCard}>
                    <h3 style={styles.chartTitle}>Cumulative Savings Projection (1 Year)</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <ComposedChart data={savingsProjection}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="month" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" tickFormatter={(val) => `₩${val / 1000000}M`} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: 8 }}
                                formatter={(value: number) => `₩${value.toLocaleString()}`}
                            />
                            <Area type="monotone" dataKey="CumulativeSavings" fill="#10b981" stroke="#10b981" fillOpacity={0.2} />
                            <Line type="monotone" dataKey="Investment" stroke="#ef4444" strokeDasharray="5 5" />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function MetricCard({ label, value, highlight, color }: { label: string; value: string; highlight?: boolean; color?: string }) {
    return (
        <div style={styles.metricCard}>
            <span style={styles.metricLabel}>{label}</span>
            <span style={{
                ...styles.metricValue,
                color: color || (highlight ? '#10b981' : '#f8fafc')
            }}>
                {value}
            </span>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        background: '#0f172a',
        padding: 24,
        borderRadius: 12,
        color: '#f8fafc',
        marginBottom: 32,
        border: '1px solid #334155',
    },
    title: {
        fontSize: 20,
        fontWeight: 600,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: 24,
        marginBottom: 32,
    },
    controls: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        background: '#1e293b',
        padding: 20,
        borderRadius: 8,
    },
    inputGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    label: {
        fontSize: 12,
        color: '#94a3b8',
        fontWeight: 500,
    },
    input: {
        background: '#0f172a',
        border: '1px solid #334155',
        borderRadius: 6,
        padding: '8px 12px',
        color: 'white',
        fontSize: 14,
    },
    metrics: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
    },
    metricCard: {
        background: '#1e293b',
        padding: 20,
        borderRadius: 8,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center',
    },
    metricLabel: {
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 8,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: 700,
    },
    chartRow: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
    },
    chartCard: {
        background: '#1e293b',
        padding: 20,
        borderRadius: 8,
        minHeight: 350,
    },
    chartTitle: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: 16,
        color: '#cbd5e1',
        textAlign: 'center',
    },
};
