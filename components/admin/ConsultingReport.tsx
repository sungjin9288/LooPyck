'use client';

/**
 * Consulting Report - 비즈니스 임팩트 요약 보고서
 * PDF 내보내기 시뮬레이션 포함
 */

import { useState } from 'react';
import { generateExecutiveSummary, calculateOpExSavings, calculateAgentROI } from '@/lib/analytics/roiCalculator';

export default function ConsultingReport() {
    const [monthlyAnalyses, setMonthlyAnalyses] = useState(1000);
    const [isExporting, setIsExporting] = useState(false);

    const roi = calculateOpExSavings(monthlyAnalyses);
    const agentROI = calculateAgentROI(monthlyAnalyses);
    const summary = generateExecutiveSummary(monthlyAnalyses);

    const handleExportPDF = async () => {
        setIsExporting(true);

        // PDF 내보내기 시뮬레이션
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 실제 구현에서는 html2pdf 또는 puppeteer 사용
        const blob = new Blob([summary], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `LooPyck_ROI_Report_${new Date().toISOString().split('T')[0]}.md`;
        a.click();
        URL.revokeObjectURL(url);

        setIsExporting(false);
    };

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div style={styles.logo}>📊</div>
                <h1 style={styles.title}>LooPyck Business Impact Report</h1>
                <p style={styles.subtitle}>AI-Powered Fashion Search Platform</p>
            </header>

            {/* Executive Summary */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>Executive Summary</h2>
                <div style={styles.heroGrid}>
                    <HeroMetric
                        icon="💰"
                        value="99.8%"
                        label="Cost Reduction"
                        detail="수동 대비 비용 절감"
                    />
                    <HeroMetric
                        icon="🎯"
                        value="94.2%"
                        label="Automation Rate"
                        detail="7개 쇼핑몰 자동화"
                    />
                    <HeroMetric
                        icon="⏱️"
                        value="1.4 FTE"
                        label="Resource Savings"
                        detail="월간 인력 절감"
                    />
                    <HeroMetric
                        icon="📈"
                        value={`₩${(roi.annualSavings / 100000000).toFixed(1)}억`}
                        label="Annual Savings"
                        detail="연간 절감 예상"
                    />
                </div>
            </section>

            {/* Problem Statement */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🔴 Problem Statement</h2>
                <div style={styles.problemCard}>
                    <div style={styles.problemIcon}>⚠️</div>
                    <div>
                        <h3 style={styles.problemTitle}>Manual Price Comparison is Expensive</h3>
                        <p style={styles.problemText}>
                            7개 쇼핑몰 가격 비교에 <strong>건당 ₩25,000</strong> 인건비 소모.
                            월 1,000건 분석 시 <strong>₩25,000,000</strong> 지출.
                        </p>
                    </div>
                </div>
            </section>

            {/* Solution */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🟢 Solution: Zero-Cost AI Agent</h2>
                <div style={styles.solutionGrid}>
                    <SolutionCard
                        icon="🧠"
                        title="Vision AI"
                        description="Gemini 2.5 Flash로 스크린샷 분석"
                    />
                    <SolutionCard
                        icon="🤖"
                        title="Self-Healing"
                        description="자동 오류 복구 및 재시도"
                    />
                    <SolutionCard
                        icon="🔄"
                        title="Hybrid Consensus"
                        description="Vision + DOM 이중 검증"
                    />
                    <SolutionCard
                        icon="📊"
                        title="RAG Trends"
                        description="실시간 패션 트렌드 연동"
                    />
                </div>
            </section>

            {/* ROI Calculator */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>💵 ROI Calculator</h2>
                <div style={styles.calculatorCard}>
                    <label style={styles.sliderLabel}>
                        Monthly Analyses: <strong>{monthlyAnalyses.toLocaleString()}</strong>
                        <input
                            type="range"
                            min="100"
                            max="10000"
                            value={monthlyAnalyses}
                            onChange={(e) => setMonthlyAnalyses(Number(e.target.value))}
                            style={styles.slider}
                        />
                    </label>

                    <div style={styles.roiGrid}>
                        <ROICard label="Manual Cost" value={`₩${(25000 * monthlyAnalyses).toLocaleString()}`} color="#ef4444" />
                        <ROICard label="AI Cost" value={`₩${(50 * monthlyAnalyses).toLocaleString()}`} color="#10b981" />
                        <ROICard label="Monthly Savings" value={`₩${roi.monthlySavings.toLocaleString()}`} color="#3b82f6" />
                        <ROICard label="ROI" value={`${agentROI.roiPercentage}%`} color="#8b5cf6" />
                    </div>
                </div>
            </section>

            {/* Technical Achievement */}
            <section style={styles.section}>
                <h2 style={styles.sectionTitle}>🏆 Technical Achievement</h2>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>Phase</th>
                            <th style={styles.th}>Achievement</th>
                            <th style={styles.th}>Impact</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td style={styles.td}>4.0</td><td style={styles.td}>Zero-Cost AI Pipeline</td><td style={styles.td}>₩0 인프라 비용</td></tr>
                        <tr><td style={styles.td}>5.0</td><td style={styles.td}>AI Personalization</td><td style={styles.td}>맞춤형 추천</td></tr>
                        <tr><td style={styles.td}>6.0</td><td style={styles.td}>Conversational Discovery</td><td style={styles.td}>자연어 검색</td></tr>
                        <tr><td style={styles.td}>7.0</td><td style={styles.td}>Launch Hardening</td><td style={styles.td}>W-Concept 100%</td></tr>
                        <tr><td style={styles.td}>8.0</td><td style={styles.td}>Autonomous Scaling</td><td style={styles.td}>자율 프롬프트 튜닝</td></tr>
                        <tr><td style={styles.td}>9.0</td><td style={styles.td}>Market Proof</td><td style={styles.td}>ROI 검증</td></tr>
                        <tr><td style={styles.td}>10.0</td><td style={styles.td}>Assetization</td><td style={styles.td}>컨설팅 자산화</td></tr>
                    </tbody>
                </table>
            </section>

            {/* Export Button */}
            <section style={styles.section}>
                <button
                    onClick={handleExportPDF}
                    disabled={isExporting}
                    style={isExporting ? { ...styles.exportButton, opacity: 0.6 } : styles.exportButton}
                >
                    {isExporting ? '⏳ Generating...' : '📄 Export Report'}
                </button>
            </section>

            <footer style={styles.footer}>
                <p>Generated by LooPyck AI Platform • {new Date().toLocaleDateString()}</p>
            </footer>
        </div>
    );
}

// Sub-components
function HeroMetric({ icon, value, label, detail }: { icon: string; value: string; label: string; detail: string }) {
    return (
        <div style={styles.heroCard}>
            <span style={styles.heroIcon}>{icon}</span>
            <span style={styles.heroValue}>{value}</span>
            <span style={styles.heroLabel}>{label}</span>
            <span style={styles.heroDetail}>{detail}</span>
        </div>
    );
}

function SolutionCard({ icon, title, description }: { icon: string; title: string; description: string }) {
    return (
        <div style={styles.solutionCard}>
            <span style={styles.solutionIcon}>{icon}</span>
            <h4 style={styles.solutionTitle}>{title}</h4>
            <p style={styles.solutionDesc}>{description}</p>
        </div>
    );
}

function ROICard({ label, value, color }: { label: string; value: string; color: string }) {
    return (
        <div style={{ ...styles.roiCard, borderLeftColor: color }}>
            <span style={styles.roiLabel}>{label}</span>
            <span style={{ ...styles.roiValue, color }}>{value}</span>
        </div>
    );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        maxWidth: 900,
        margin: '0 auto',
        padding: 32,
        fontFamily: "'Inter', sans-serif",
        backgroundColor: '#0f172a',
        minHeight: '100vh',
        color: '#e2e8f0',
    },
    header: {
        textAlign: 'center',
        marginBottom: 48,
        paddingBottom: 32,
        borderBottom: '1px solid #334155',
    },
    logo: { fontSize: 48, marginBottom: 16 },
    title: {
        fontSize: 32,
        fontWeight: 700,
        margin: 0,
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subtitle: { color: '#94a3b8', marginTop: 8 },
    section: { marginBottom: 40 },
    sectionTitle: { fontSize: 20, fontWeight: 600, marginBottom: 20, color: '#f1f5f9' },
    heroGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
    heroCard: {
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        borderRadius: 16,
        padding: 24,
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    heroIcon: { fontSize: 32 },
    heroValue: { fontSize: 28, fontWeight: 700, color: '#10b981' },
    heroLabel: { fontSize: 14, fontWeight: 600, color: '#f1f5f9' },
    heroDetail: { fontSize: 12, color: '#94a3b8' },
    problemCard: {
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        borderLeft: '4px solid #ef4444',
    },
    problemIcon: { fontSize: 48 },
    problemTitle: { margin: 0, fontSize: 18, color: '#f1f5f9' },
    problemText: { margin: '8px 0 0', color: '#94a3b8', lineHeight: 1.6 },
    solutionGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 },
    solutionCard: { background: '#1e293b', borderRadius: 12, padding: 20, textAlign: 'center' },
    solutionIcon: { fontSize: 32 },
    solutionTitle: { margin: '12px 0 8px', fontSize: 14, fontWeight: 600 },
    solutionDesc: { margin: 0, fontSize: 12, color: '#94a3b8' },
    calculatorCard: { background: '#1e293b', borderRadius: 12, padding: 24 },
    sliderLabel: { display: 'block', marginBottom: 20, color: '#94a3b8' },
    slider: { width: '100%', marginTop: 12, height: 8, borderRadius: 4, cursor: 'pointer' },
    roiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 },
    roiCard: { background: '#0f172a', borderRadius: 8, padding: 16, borderLeft: '3px solid' },
    roiLabel: { display: 'block', fontSize: 12, color: '#94a3b8' },
    roiValue: { display: 'block', fontSize: 20, fontWeight: 700, marginTop: 4 },
    table: { width: '100%', borderCollapse: 'collapse', background: '#1e293b', borderRadius: 12, overflow: 'hidden' },
    th: { textAlign: 'left', padding: '12px 16px', background: '#334155', fontSize: 12, textTransform: 'uppercase', color: '#94a3b8' },
    td: { padding: '12px 16px', borderBottom: '1px solid #334155' },
    exportButton: {
        display: 'block',
        width: '100%',
        padding: 16,
        fontSize: 16,
        fontWeight: 600,
        color: 'white',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: 12,
        cursor: 'pointer',
    },
    footer: { textAlign: 'center', marginTop: 48, paddingTop: 24, borderTop: '1px solid #334155', color: '#64748b', fontSize: 12 },
};
