'use client';

/**
 * Market Intelligence - Advanced Admin BI Dashboard
 * Tier 전환율, 트렌드 기여도, ROI 시각화
 */

import { useState, useMemo } from 'react';
import { calculateOpExSavings, calculateLTV, projectAnnualSavings } from '@/lib/analytics/roiCalculator';
import { TIER_CONFIGS, AFFILIATE_CONFIGS } from '@/lib/analytics/businessModel';

// 시뮬레이션 데이터 타입
interface SimulationData {
    monthlyAnalyses: number;
    usersByTier: {
        free: number;
        basic: number;
        pro: number;
    };
    clicksByMall: Record<string, number>;
}

// 기본 시뮬레이션 데이터
const DEFAULT_DATA: SimulationData = {
    monthlyAnalyses: 1000,
    usersByTier: { free: 800, basic: 150, pro: 50 },
    clicksByMall: {
        musinsa: 500,
        '29cm': 300,
        wconcept: 200,
        zigzag: 400,
        ssf: 150,
        ably: 350,
        handsome: 100,
    },
};

export default function MarketIntelligence() {
    const [data, setData] = useState<SimulationData>(DEFAULT_DATA);

    // ROI 계산
    const roi = useMemo(() => calculateOpExSavings(data.monthlyAnalyses), [data.monthlyAnalyses]);

    // LTV 계산
    const ltv = useMemo(() => calculateLTV(data.usersByTier, data.clicksByMall), [data.usersByTier, data.clicksByMall]);

    // 3개년 예측
    const projection = useMemo(() => projectAnnualSavings(data.monthlyAnalyses), [data.monthlyAnalyses]);

    // Tier 전환율 계산
    const tierConversion = useMemo(() => {
        const total = data.usersByTier.free + data.usersByTier.basic + data.usersByTier.pro;
        return {
            freeToBasic: total > 0 ? ((data.usersByTier.basic + data.usersByTier.pro) / (data.usersByTier.free + data.usersByTier.basic + data.usersByTier.pro)) * 100 : 0,
            basicToPro: (data.usersByTier.basic + data.usersByTier.pro) > 0 ? (data.usersByTier.pro / (data.usersByTier.basic + data.usersByTier.pro)) * 100 : 0,
            paidRate: total > 0 ? ((data.usersByTier.basic + data.usersByTier.pro) / total) * 100 : 0,
        };
    }, [data.usersByTier]);

    // 트렌드 기여도 (가상 데이터)
    const trendContribution = [
        { trend: '올드머니룩', clicks: 450, conversion: 3.2 },
        { trend: '피치퍼즈', clicks: 320, conversion: 2.8 },
        { trend: '조용한럭셔리', clicks: 280, conversion: 3.5 },
        { trend: '지속가능소재', clicks: 200, conversion: 2.1 },
    ];

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>📊 Market Intelligence</h1>
                <p style={styles.subtitle}>Advanced Admin BI Dashboard</p>
            </header>

            {/* ROI Overview */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>💰 ROI Overview</h2>
                <div style={styles.cardGrid}>
                    <MetricCard
                        label="건당 절감액"
                        value={`₩${roi.savingsPerAnalysis.toLocaleString()}`}
                        subtext={`${roi.savingsPercentage}% 절감`}
                        color="#10b981"
                    />
                    <MetricCard
                        label="월간 절감액"
                        value={`₩${roi.monthlySavings.toLocaleString()}`}
                        subtext={`${data.monthlyAnalyses}건 기준`}
                        color="#3b82f6"
                    />
                    <MetricCard
                        label="연간 절감액"
                        value={`₩${roi.annualSavings.toLocaleString()}`}
                        subtext="예상 연간 절감"
                        color="#8b5cf6"
                    />
                    <MetricCard
                        label="FTE 환산"
                        value={`${roi.fteEquivalent}명`}
                        subtext={`${roi.timesSavedPerMonth}시간/월`}
                        color="#f59e0b"
                    />
                </div>
            </section>

            {/* Tier Conversion */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>📈 Tier Conversion</h2>
                <div style={styles.cardGrid}>
                    <MetricCard
                        label="유료 전환율"
                        value={`${tierConversion.paidRate.toFixed(1)}%`}
                        subtext={`${data.usersByTier.basic + data.usersByTier.pro}명 유료`}
                        color="#ec4899"
                    />
                    <MetricCard
                        label="Free → Basic"
                        value={`${tierConversion.freeToBasic.toFixed(1)}%`}
                        subtext="1차 전환"
                        color="#06b6d4"
                    />
                    <MetricCard
                        label="Basic → Pro"
                        value={`${tierConversion.basicToPro.toFixed(1)}%`}
                        subtext="2차 전환"
                        color="#84cc16"
                    />
                    <MetricCard
                        label="MRR"
                        value={`₩${ltv.monthlyRecurringRevenue.toLocaleString()}`}
                        subtext="월간 반복 수익"
                        color="#f97316"
                    />
                </div>

                {/* Tier Distribution Bar */}
                <div style={styles.tierBar}>
                    <div style={{ ...styles.tierSegment, backgroundColor: '#94a3b8', flex: data.usersByTier.free }}>
                        Free ({data.usersByTier.free})
                    </div>
                    <div style={{ ...styles.tierSegment, backgroundColor: '#3b82f6', flex: data.usersByTier.basic }}>
                        Basic ({data.usersByTier.basic})
                    </div>
                    <div style={{ ...styles.tierSegment, backgroundColor: '#8b5cf6', flex: data.usersByTier.pro }}>
                        Pro ({data.usersByTier.pro})
                    </div>
                </div>
            </section>

            {/* Trend Contribution */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🔥 Trend Contribution</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>트렌드</th>
                            <th style={styles.th}>클릭수</th>
                            <th style={styles.th}>전환율</th>
                            <th style={styles.th}>기여도</th>
                        </tr>
                    </thead>
                    <tbody>
                        {trendContribution.map((item, i) => (
                            <tr key={i}>
                                <td style={styles.td}>{item.trend}</td>
                                <td style={styles.td}>{item.clicks}</td>
                                <td style={styles.td}>{item.conversion}%</td>
                                <td style={styles.td}>
                                    <div style={{ ...styles.progressBar, width: `${(item.clicks / 450) * 100}%` }} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* 3-Year Projection */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🔮 3-Year Projection</h2>
                <div style={styles.projectionGrid}>
                    <div style={styles.projectionCard}>
                        <span style={styles.projectionYear}>Year 1</span>
                        <span style={styles.projectionValue}>₩{projection.year1.toLocaleString()}</span>
                    </div>
                    <div style={styles.projectionCard}>
                        <span style={styles.projectionYear}>Year 2</span>
                        <span style={styles.projectionValue}>₩{projection.year2.toLocaleString()}</span>
                    </div>
                    <div style={styles.projectionCard}>
                        <span style={styles.projectionYear}>Year 3</span>
                        <span style={styles.projectionValue}>₩{projection.year3.toLocaleString()}</span>
                    </div>
                    <div style={{ ...styles.projectionCard, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                        <span style={styles.projectionYear}>Total</span>
                        <span style={styles.projectionValue}>₩{projection.total3Years.toLocaleString()}</span>
                    </div>
                </div>
            </section>

            {/* Mall ROI */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🏪 Mall Performance</h2>
                <div style={styles.mallGrid}>
                    {Object.entries(AFFILIATE_CONFIGS).map(([key, config]) => {
                        const clicks = data.clicksByMall[key] || 0;
                        const revenue = Math.round(clicks * config.conversionRate * config.averageOrderValue * config.commissionRate);
                        return (
                            <div key={key} style={styles.mallCard}>
                                <div style={styles.mallName}>{config.mall}</div>
                                <div style={styles.mallClicks}>{clicks} clicks</div>
                                <div style={styles.mallRevenue}>₩{revenue.toLocaleString()}</div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Simulation Controls */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>⚙️ Simulation</h2>
                <div style={styles.controls}>
                    <label style={styles.controlLabel}>
                        월간 분석 수:
                        <input
                            type="range"
                            min="100"
                            max="5000"
                            value={data.monthlyAnalyses}
                            onChange={(e) => setData({ ...data, monthlyAnalyses: Number(e.target.value) })}
                            style={styles.slider}
                        />
                        <span>{data.monthlyAnalyses}</span>
                    </label>
                </div>
            </section>
        </div>
    );
}

// Metric Card Component
function MetricCard({ label, value, subtext, color }: { label: string; value: string; subtext: string; color: string }) {
    return (
        <div style={{ ...styles.metricCard, borderTopColor: color }}>
            <div style={styles.metricLabel}>{label}</div>
            <div style={{ ...styles.metricValue, color }}>{value}</div>
            <div style={styles.metricSubtext}>{subtext}</div>
        </div>
    );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        maxWidth: 1200,
        margin: '0 auto',
        padding: 24,
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        color: '#e2e8f0',
    },
    header: {
        marginBottom: 32,
        textAlign: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 700,
        margin: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: {
        color: '#94a3b8',
        marginTop: 4,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 600,
        marginBottom: 16,
        color: '#f1f5f9',
    },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16,
    },
    metricCard: {
        background: '#1e293b',
        borderRadius: 12,
        padding: 20,
        borderTop: '3px solid',
    },
    metricLabel: {
        fontSize: 12,
        color: '#94a3b8',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
    },
    metricValue: {
        fontSize: 28,
        fontWeight: 700,
        marginTop: 8,
    },
    metricSubtext: {
        fontSize: 13,
        color: '#64748b',
        marginTop: 4,
    },
    tierBar: {
        display: 'flex',
        borderRadius: 8,
        overflow: 'hidden',
        marginTop: 16,
        height: 40,
    },
    tierSegment: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 12,
        fontWeight: 500,
        minWidth: 60,
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
        background: '#1e293b',
        borderRadius: 12,
        overflow: 'hidden',
    },
    th: {
        textAlign: 'left',
        padding: '12px 16px',
        background: '#334155',
        fontSize: 12,
        textTransform: 'uppercase',
        color: '#94a3b8',
    },
    td: {
        padding: '12px 16px',
        borderBottom: '1px solid #334155',
    },
    progressBar: {
        height: 8,
        background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
        borderRadius: 4,
    },
    projectionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
    },
    projectionCard: {
        background: '#1e293b',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
    },
    projectionYear: {
        display: 'block',
        fontSize: 12,
        color: '#94a3b8',
        marginBottom: 8,
    },
    projectionValue: {
        fontSize: 20,
        fontWeight: 700,
        color: '#10b981',
    },
    mallGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12,
    },
    mallCard: {
        background: '#1e293b',
        borderRadius: 8,
        padding: 16,
        textAlign: 'center',
    },
    mallName: {
        fontWeight: 600,
        marginBottom: 4,
    },
    mallClicks: {
        fontSize: 12,
        color: '#94a3b8',
    },
    mallRevenue: {
        color: '#10b981',
        fontWeight: 500,
        marginTop: 4,
    },
    controls: {
        background: '#1e293b',
        borderRadius: 12,
        padding: 20,
    },
    controlLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        color: '#94a3b8',
    },
    slider: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        appearance: 'none',
        background: '#334155',
        cursor: 'pointer',
    },
};
