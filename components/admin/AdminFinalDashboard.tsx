'use client';

/**
 * Admin Final Dashboard - Multi-Industry Ready
 * 프로젝트 최종 대시보드 + PoC 결과 시각화
 */

import { LOOPYCK_GOLD_STANDARD, getSnapshotSummary } from '@/lib/core/final_snapshot';
import { calculateReplicationMetrics } from '@/lib/industries/pocAgent';
import ThinkingProcess from '@/components/agent/ThinkingProcess';
import ROIChart from '@/components/admin/ROIChart';

export default function AdminFinalDashboard() {
    const snapshot = LOOPYCK_GOLD_STANDARD;
    const summary = getSnapshotSummary();
    const pocMetrics = calculateReplicationMetrics();

    // Badge Component (Inline for simplicity)
    const Badge = ({ text }: { text: string }) => (
        <span style={{
            padding: '6px 12px',
            background: 'rgba(59, 130, 246, 0.1)',
            color: '#60a5fa',
            borderRadius: 16,
            fontSize: 12,
            fontWeight: 500,
            border: '1px solid rgba(59, 130, 246, 0.2)'
        }}>
            {text}
        </span>
    );


    // 산업별 확장 데이터
    const industries = [
        { name: 'Fashion', status: 'PRODUCTION', successRate: 94.2, icon: '👗' },
        { name: 'Real Estate', status: 'POC_COMPLETE', successRate: 95.0, icon: '🏠' },
        { name: 'News', status: 'READY', successRate: 92.0, icon: '📰' },
        { name: 'Government', status: 'READY', successRate: 88.0, icon: '🏛️' },
        { name: 'E-Commerce', status: 'READY', successRate: 94.0, icon: '🛒' },
    ];

    // Phase 요약
    const phases = [
        { num: '4-7', title: 'Core Pipeline', highlight: 'Zero-Cost AI' },
        { num: '8-9', title: 'Autonomous Scaling', highlight: 'Self-Optimizer' },
        { num: '10-11', title: 'Market Validation', highlight: 'Case Study' },
        { num: '12-13', title: 'Final Strategy', highlight: 'Career Assets' },
        { num: '14-15', title: 'Generalization', highlight: 'Multi-Industry' },
    ];

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.headerLeft}>
                        <span style={styles.logo}>🚀</span>
                        <div>
                            <h1 style={styles.title}>LooPyck Framework</h1>
                            <p style={styles.subtitle}>Multi-Industry AI Platform • Phase 4-15 Complete</p>
                        </div>
                    </div>
                    <div style={styles.statusBadge}>
                        <span style={styles.statusIcon}>✅</span>
                        MISSION COMPLETE
                    </div>
                </div>
            </header>

            {/* Hero Stats */}
            <section style={styles.heroSection}>
                <StatCard value="99.8%" label="Cost Reduction" icon="💰" color="#10b981" />
                <StatCard value="94.2%" label="Automation Rate" icon="🤖" color="#3b82f6" />
                <StatCard value="₩299M" label="Annual Savings" icon="📈" color="#8b5cf6" />
                <StatCard value="16" label="Phases Complete" icon="🏆" color="#f59e0b" />
            </section>

            {/* Visual Intelligence Demo */}
            <section style={{ ...styles.section, display: 'flex', gap: 24, marginBottom: 32 }}>
                <div style={{ flex: 1 }}>
                    <h2 style={styles.sectionTitle}>🧠 Visual Intelligence Engine</h2>
                    <div style={{ background: '#1e293b', padding: 24, borderRadius: 12, minHeight: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ThinkingProcess isAnalyzing={true} />
                    </div>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 700 }}>Human-like Perception</h3>
                    <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
                        LooPyck doesn't just parse HTML. It <strong>sees</strong> the page.
                        <br />
                        By analyzing visual vectors, it understands context, identifies price tags (even in images),
                        and self-heals when the layout changes.
                    </p>
                    <div style={{ display: 'flex', gap: 12 }}>
                        <Badge text="Vision AI" />
                        <Badge text="Self-Healing" />
                        <Badge text="Context Aware" />
                    </div>
                </div>
            </section>

            {/* ROI Interactive Simulator */}
            <ROIChart />

            {/* Two Column Layout (Existing) */}
            <div style={styles.twoColumn}>
                {/* Left: Industry Status */}
                <section style={styles.leftColumn}>
                    <h2 style={styles.sectionTitle}>🌐 Multi-Industry Status</h2>
                    <div style={styles.industryGrid}>
                        {industries.map((ind, i) => (
                            <div key={i} style={styles.industryCard}>
                                <span style={styles.industryIcon}>{ind.icon}</span>
                                <div style={styles.industryInfo}>
                                    <span style={styles.industryName}>{ind.name}</span>
                                    <span style={{
                                        ...styles.industryStatus,
                                        color: ind.status === 'PRODUCTION' ? '#10b981' :
                                            ind.status === 'POC_COMPLETE' ? '#3b82f6' : '#f59e0b'
                                    }}>
                                        {ind.status}
                                    </span>
                                </div>
                                <div style={styles.successRate}>
                                    <span style={styles.rateValue}>{ind.successRate}%</span>
                                    <div style={styles.rateBar}>
                                        <div style={{
                                            ...styles.rateProgress,
                                            width: `${ind.successRate}%`,
                                            backgroundColor: ind.successRate >= 90 ? '#10b981' : '#f59e0b'
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Right: PoC Metrics */}
                <section style={styles.rightColumn}>
                    <h2 style={styles.sectionTitle}>📊 PoC Replication Metrics</h2>
                    <div style={styles.metricsCard}>
                        <MetricRow label="Domain" value={pocMetrics.domain} />
                        <MetricRow label="Code Modification" value={`${pocMetrics.codeModificationPercent}%`} highlight />
                        <MetricRow label="Build Time" value={`${pocMetrics.buildTimeHours} hours`} />
                        <MetricRow label="Success Rate" value={`${pocMetrics.successRate}%`} />
                        <MetricRow label="Framework Reused" value={`${pocMetrics.frameworkReusedPercent}%`} />
                        <MetricRow label="Cost Savings" value={`${pocMetrics.costSavingsPercent}%`} highlight />
                    </div>

                    <h2 style={{ ...styles.sectionTitle, marginTop: 24 }}>📅 Phase Summary</h2>
                    <div style={styles.phaseList}>
                        {phases.map((phase, i) => (
                            <div key={i} style={styles.phaseItem}>
                                <span style={styles.phaseNum}>Phase {phase.num}</span>
                                <span style={styles.phaseTitle}>{phase.title}</span>
                                <span style={styles.phaseHighlight}>{phase.highlight}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Bottom: Achievement Banner */}
            <section style={styles.achievementBanner}>
                <h2 style={styles.achievementTitle}>🎯 Key Achievements</h2>
                <div style={styles.achievementGrid}>
                    <AchievementTag icon="💰" text="₩0 Infrastructure" />
                    <AchievementTag icon="⚡" text="2-week Deployment" />
                    <AchievementTag icon="🔄" text="95.8% Code Reuse" />
                    <AchievementTag icon="🏪" text="7 Malls Automated" />
                    <AchievementTag icon="🌍" text="5 Industries Ready" />
                    <AchievementTag icon="📈" text="8,882% ROI" />
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                <div style={styles.footerContent}>
                    <span>LooPyck v{summary.version}</span>
                    <span>•</span>
                    <span>15 Phases Complete</span>
                    <span>•</span>
                    <span>Status: MISSION COMPLETE</span>
                    <span>•</span>
                    <span>February 2026</span>
                </div>
            </footer>
        </div>
    );
}

// Stat Card Component
function StatCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
    return (
        <div style={{ ...styles.statCard, borderTop: `3px solid ${color}` }}>
            <span style={styles.statIcon}>{icon}</span>
            <span style={{ ...styles.statValue, color }}>{value}</span>
            <span style={styles.statLabel}>{label}</span>
        </div>
    );
}

// Metric Row Component
function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div style={styles.metricRow}>
            <span style={styles.metricLabel}>{label}</span>
            <span style={{ ...styles.metricValue, color: highlight ? '#10b981' : '#f1f5f9' }}>{value}</span>
        </div>
    );
}

// Achievement Tag Component
function AchievementTag({ icon, text }: { icon: string; text: string }) {
    return (
        <div style={styles.achievementTag}>
            <span>{icon}</span>
            <span>{text}</span>
        </div>
    );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        minHeight: '100vh',
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        fontFamily: "'Inter', sans-serif",
        padding: 32,
    },
    header: {
        marginBottom: 32,
        borderBottom: '1px solid #334155',
        paddingBottom: 24,
    },
    headerContent: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1200,
        margin: '0 auto',
    },
    headerLeft: { display: 'flex', alignItems: 'center', gap: 16 },
    logo: { fontSize: 48 },
    title: { margin: 0, fontSize: 28, fontWeight: 700 },
    subtitle: { margin: 0, color: '#94a3b8', fontSize: 14 },
    statusBadge: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 16px',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        borderRadius: 20,
        fontSize: 13,
        fontWeight: 600,
        color: 'white',
    },
    statusIcon: { fontSize: 14 },
    heroSection: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 20,
        maxWidth: 1200,
        margin: '0 auto 32px',
    },
    statCard: {
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center',
        border: '1px solid #334155',
    },
    statIcon: { fontSize: 28, display: 'block', marginBottom: 8 },
    statValue: { fontSize: 32, fontWeight: 800, display: 'block' },
    statLabel: { fontSize: 12, color: '#94a3b8' },
    twoColumn: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        maxWidth: 1200,
        margin: '0 auto 32px',
    },
    leftColumn: {
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #334155',
    },
    rightColumn: {
        background: '#1e293b',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #334155',
    },
    sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#f1f5f9' },
    industryGrid: { display: 'flex', flexDirection: 'column', gap: 12 },
    industryCard: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: '#0f172a',
        borderRadius: 8,
    },
    industryIcon: { fontSize: 24 },
    industryInfo: { flex: 1, display: 'flex', flexDirection: 'column' },
    industryName: { fontSize: 14, fontWeight: 600 },
    industryStatus: { fontSize: 11, fontWeight: 500 },
    successRate: { width: 80, textAlign: 'right' },
    rateValue: { fontSize: 13, fontWeight: 600, display: 'block' },
    rateBar: { height: 4, background: '#334155', borderRadius: 2, marginTop: 4 },
    rateProgress: { height: '100%', borderRadius: 2 },
    metricsCard: { background: '#0f172a', borderRadius: 8, padding: 16 },
    metricRow: {
        display: 'flex',
        justifyContent: 'space-between',
        padding: '8px 0',
        borderBottom: '1px solid #334155',
    },
    metricLabel: { fontSize: 13, color: '#94a3b8' },
    metricValue: { fontSize: 13, fontWeight: 600 },
    phaseList: { display: 'flex', flexDirection: 'column', gap: 8 },
    phaseItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 8,
        background: '#0f172a',
        borderRadius: 6,
    },
    phaseNum: { fontSize: 11, fontWeight: 600, color: '#64748b', width: 70 },
    phaseTitle: { flex: 1, fontSize: 13 },
    phaseHighlight: { fontSize: 11, color: '#10b981', fontWeight: 500 },
    achievementBanner: {
        maxWidth: 1200,
        margin: '0 auto 32px',
        background: 'linear-gradient(135deg, #1e293b, #0f172a)',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #334155',
    },
    achievementTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, textAlign: 'center' },
    achievementGrid: {
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 12,
    },
    achievementTag: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        background: '#334155',
        borderRadius: 20,
        fontSize: 13,
    },
    footer: {
        maxWidth: 1200,
        margin: '0 auto',
        paddingTop: 24,
        borderTop: '1px solid #334155',
        textAlign: 'center',
    },
    footerContent: {
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        color: '#64748b',
        fontSize: 12,
    },
};
