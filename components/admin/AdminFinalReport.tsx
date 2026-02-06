'use client';

/**
 * Admin Final Report - 프로젝트 연표 + PDF 출력
 * Professional 수준 최종 대시보드
 */

import { LOOPYCK_GOLD_STANDARD, getSnapshotSummary } from '@/lib/core/final_snapshot';

export default function AdminFinalReport() {
    const snapshot = LOOPYCK_GOLD_STANDARD;
    const summary = getSnapshotSummary();

    // Phase 타임라인 데이터
    const phases = [
        { num: 4, date: 'Jan 15', title: 'Zero-Cost AI Pipeline', highlight: 'Gemini 2.5 Flash' },
        { num: 5, date: 'Jan 18', title: 'AI Personalization', highlight: 'StyleVector' },
        { num: 6, date: 'Jan 22', title: 'Conversational Discovery', highlight: 'FashionBot' },
        { num: 7, date: 'Jan 26', title: 'Launch Hardening', highlight: 'W-Concept 100%' },
        { num: 8, date: 'Jan 30', title: 'Autonomous Scaling', highlight: 'Self-Optimizer' },
        { num: 9, date: 'Feb 02', title: 'Market Proof', highlight: 'ROI Calculator' },
        { num: 10, date: 'Feb 04', title: 'Grand Finale', highlight: 'Handover Manual' },
        { num: 11, date: 'Feb 05', title: 'Market Validation', highlight: 'Case Study' },
        { num: 12, date: 'Feb 06', title: 'Final Strategy', highlight: '2027 Roadmap' },
        { num: 13, date: 'Feb 07', title: 'Project Closure', highlight: 'ARCHIVED' },
    ];

    // PDF 다운로드 시뮬레이션
    const handleExportPDF = () => {
        const content = generatePDFContent();
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'LooPyck_Final_Report_2026.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    function generatePDFContent(): string {
        return `
╔═══════════════════════════════════════════════════════════╗
║               LooPyck Final Project Report                ║
║                   February 2026                           ║
╚═══════════════════════════════════════════════════════════╝

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     EXECUTIVE SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Project:          LooPyck AI Platform
Version:          ${summary.version}
Completed Phases: ${summary.phases}
Status:           ARCHIVED & ASSETIZED

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     KEY ACHIEVEMENTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

│ Metric              │ Value                │
├─────────────────────┼──────────────────────┤
│ Cost Reduction      │ ${summary.costReduction}              │
│ Success Rate        │ ${summary.successRate}              │
│ Annual Savings      │ ${summary.annualSavings}                │
│ Infrastructure      │ ${summary.infrastructure}                │
│ FTE Replacement     │ 1.4 employees/month  │

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     PHASE TIMELINE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${phases.map(p => `Phase ${p.num} [${p.date}] ${p.title} → ${p.highlight}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     MALL PERFORMANCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${snapshot.malls.map(m => `${m.name.padEnd(12)} [${m.successRate}%]`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                     TECHNOLOGY STACK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Frontend:    ${snapshot.architecture.frontend}
Runtime:     ${snapshot.architecture.runtime}
AI Model:    ${snapshot.infrastructure.aiModel}
Database:    ${snapshot.infrastructure.database}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generated: ${new Date().toISOString()}
© 2026 LooPyck. All rights reserved.
    `.trim();
    }

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerLeft}>
                    <span style={styles.logo}>🏆</span>
                    <div>
                        <h1 style={styles.title}>LooPyck Final Report</h1>
                        <p style={styles.subtitle}>Phase 4-13 Complete • February 2026</p>
                    </div>
                </div>
                <div style={styles.headerRight}>
                    <span style={styles.statusBadge}>ARCHIVED</span>
                    <button style={styles.exportBtn} onClick={handleExportPDF}>
                        📄 Export Report
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <section style={styles.summaryGrid}>
                <SummaryCard value={summary.costReduction} label="Cost Reduction" icon="💰" />
                <SummaryCard value={summary.successRate} label="Success Rate" icon="🎯" />
                <SummaryCard value={summary.annualSavings} label="Annual Savings" icon="📈" />
                <SummaryCard value={`${summary.phases} Phases`} label="Completed" icon="✅" />
            </section>

            {/* Timeline */}
            <section style={styles.timelineSection}>
                <h2 style={styles.sectionTitle}>📅 Project Timeline</h2>
                <div style={styles.timeline}>
                    {phases.map((phase, i) => (
                        <div key={i} style={styles.timelineItem}>
                            <div style={styles.timelineDot}>
                                <span style={styles.phaseNum}>{phase.num}</span>
                            </div>
                            <div style={styles.timelineCard}>
                                <div style={styles.timelineHeader}>
                                    <span style={styles.phaseTitle}>{phase.title}</span>
                                    <span style={styles.phaseDate}>{phase.date}</span>
                                </div>
                                <span style={styles.phaseHighlight}>{phase.highlight}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Mall Performance */}
            <section style={styles.mallSection}>
                <h2 style={styles.sectionTitle}>🏪 Mall Performance</h2>
                <div style={styles.mallGrid}>
                    {snapshot.malls.map((mall, i) => (
                        <div key={i} style={styles.mallCard}>
                            <span style={styles.mallName}>{mall.name}</span>
                            <div style={styles.progressContainer}>
                                <div
                                    style={{
                                        ...styles.progressBar,
                                        width: `${mall.successRate}%`,
                                        backgroundColor: mall.successRate >= 90 ? '#10b981' : mall.successRate >= 70 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                            </div>
                            <span style={styles.mallRate}>{mall.successRate}%</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <span>LooPyck AI Platform v{summary.version}</span>
                    <span>•</span>
                    <span>13 Phases Complete</span>
                    <span>•</span>
                    <span>Status: ARCHIVED & ASSETIZED</span>
                </div>
            </footer>
        </div>
    );
}

// Summary Card Component
function SummaryCard({ value, label, icon }: { value: string; label: string; icon: string }) {
    return (
        <div style={styles.summaryCard}>
            <span style={styles.summaryIcon}>{icon}</span>
            <span style={styles.summaryValue}>{value}</span>
            <span style={styles.summaryLabel}>{label}</span>
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
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 32,
        paddingBottom: 24,
        borderBottom: '1px solid #334155',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    logo: { fontSize: 48 },
    title: { margin: 0, fontSize: 24, fontWeight: 700 },
    subtitle: { margin: 0, color: '#94a3b8', fontSize: 14 },
    headerRight: { display: 'flex', alignItems: 'center', gap: 16 },
    statusBadge: {
        padding: '6px 12px',
        backgroundColor: '#10b981',
        color: 'white',
        borderRadius: 16,
        fontSize: 12,
        fontWeight: 600,
    },
    exportBtn: {
        padding: '10px 20px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: 8,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
    },
    summaryGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 16,
        marginBottom: 32,
    },
    summaryCard: {
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 20,
        textAlign: 'center',
    },
    summaryIcon: { fontSize: 28, display: 'block', marginBottom: 8 },
    summaryValue: { fontSize: 24, fontWeight: 800, color: '#10b981', display: 'block' },
    summaryLabel: { fontSize: 12, color: '#94a3b8' },
    timelineSection: { marginBottom: 32 },
    sectionTitle: { fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#f1f5f9' },
    timeline: { display: 'flex', flexDirection: 'column', gap: 12 },
    timelineItem: { display: 'flex', alignItems: 'center', gap: 16 },
    timelineDot: {
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #667eea, #764ba2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    phaseNum: { fontSize: 14, fontWeight: 700, color: 'white' },
    timelineCard: {
        flex: 1,
        background: '#1e293b',
        borderRadius: 8,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    timelineHeader: { display: 'flex', alignItems: 'center', gap: 16 },
    phaseTitle: { fontSize: 14, fontWeight: 600 },
    phaseDate: { fontSize: 11, color: '#64748b' },
    phaseHighlight: { fontSize: 12, color: '#10b981', fontWeight: 500 },
    mallSection: { marginBottom: 32 },
    mallGrid: { display: 'flex', flexDirection: 'column', gap: 8 },
    mallCard: { display: 'flex', alignItems: 'center', gap: 12 },
    mallName: { width: 80, fontSize: 13 },
    progressContainer: { flex: 1, height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 5, transition: 'width 0.3s' },
    mallRate: { width: 50, fontSize: 13, fontWeight: 600, textAlign: 'right' },
    footer: { paddingTop: 24, borderTop: '1px solid #334155', textAlign: 'center' },
    footerContent: { display: 'flex', justifyContent: 'center', gap: 16, color: '#64748b', fontSize: 12 },
};
