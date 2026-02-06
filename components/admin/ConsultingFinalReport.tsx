'use client';

/**
 * Consulting Final Report - Phase 1-12 전체 성과 인포그래픽
 * 단일 페이지 요약 대시보드
 */

import { calculateOpExSavings, calculateAgentROI } from '@/lib/analytics/roiCalculator';
import { getHeroMetrics } from '@/lib/analytics/publicStats';

export default function ConsultingFinalReport() {
    const roi = calculateOpExSavings(1000);
    const agentROI = calculateAgentROI(1000);
    const hero = getHeroMetrics();

    // Phase 데이터
    const phases = [
        { num: 4, name: 'Zero-Cost AI Pipeline', status: 'complete', highlight: '₩0 인프라' },
        { num: 5, name: 'AI Personalization', status: 'complete', highlight: 'StyleVector' },
        { num: 6, name: 'Conversational Discovery', status: 'complete', highlight: '자연어 검색' },
        { num: 7, name: 'Launch Hardening', status: 'complete', highlight: 'W-Concept 100%' },
        { num: 8, name: 'Autonomous Scaling', status: 'complete', highlight: 'Self-Optimizer' },
        { num: 9, name: 'Market Proof', status: 'complete', highlight: 'ROI 검증' },
        { num: 10, name: 'Grand Finale', status: 'complete', highlight: '자산화' },
        { num: 11, name: 'Market Validation', status: 'complete', highlight: '케이스 스터디' },
        { num: 12, name: 'Final Strategy', status: 'complete', highlight: '2027 로드맵' },
    ];

    // 쇼핑몰 성과
    const malls = [
        { name: '무신사', rate: 100, color: '#10b981' },
        { name: '29cm', rate: 100, color: '#10b981' },
        { name: 'W컨셉', rate: 100, color: '#10b981' },
        { name: '에이블리', rate: 100, color: '#10b981' },
        { name: '지그재그', rate: 86, color: '#f59e0b' },
        { name: 'SSF샵', rate: 71, color: '#f59e0b' },
        { name: '한섬', rate: 43, color: '#ef4444' },
    ];

    return (
        <div style={styles.container}>
            {/* Header */}
            <header style={styles.header}>
                <div style={styles.logoSection}>
                    <span style={styles.logo}>🚀</span>
                    <div>
                        <h1 style={styles.title}>LooPyck Project Complete</h1>
                        <p style={styles.subtitle}>AI-Powered Fashion Intelligence Platform</p>
                    </div>
                </div>
                <div style={styles.dateBadge}>2026-02-06</div>
            </header>

            {/* Hero Metrics */}
            <section style={styles.heroSection}>
                <HeroCard value="99.8%" label="비용 절감" icon="💰" color="#10b981" />
                <HeroCard value="94.2%" label="자동화율" icon="🤖" color="#3b82f6" />
                <HeroCard value="₩3억+" label="연간 절감" icon="📈" color="#8b5cf6" />
                <HeroCard value="12" label="완료 Phase" icon="✅" color="#06b6d4" />
            </section>

            {/* Two Column Layout */}
            <div style={styles.twoColumn}>
                {/* Left: Phase Timeline */}
                <section style={styles.leftColumn}>
                    <h2 style={styles.sectionTitle}>📅 Phase Timeline</h2>
                    <div style={styles.timeline}>
                        {phases.map((phase, i) => (
                            <div key={i} style={styles.timelineItem}>
                                <div style={styles.timelineNode}>
                                    <span style={styles.phaseNum}>{phase.num}</span>
                                </div>
                                <div style={styles.timelineContent}>
                                    <span style={styles.phaseName}>{phase.name}</span>
                                    <span style={styles.phaseHighlight}>{phase.highlight}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Right: Mall Performance */}
                <section style={styles.rightColumn}>
                    <h2 style={styles.sectionTitle}>🏪 Mall Performance</h2>
                    <div style={styles.mallList}>
                        {malls.map((mall, i) => (
                            <div key={i} style={styles.mallItem}>
                                <span style={styles.mallName}>{mall.name}</span>
                                <div style={styles.progressContainer}>
                                    <div style={{ ...styles.progressBar, width: `${mall.rate}%`, backgroundColor: mall.color }} />
                                </div>
                                <span style={{ ...styles.mallRate, color: mall.color }}>{mall.rate}%</span>
                            </div>
                        ))}
                    </div>

                    {/* ROI Summary */}
                    <div style={styles.roiBox}>
                        <h3 style={styles.roiTitle}>💵 ROI Summary</h3>
                        <div style={styles.roiGrid}>
                            <div style={styles.roiItem}>
                                <span style={styles.roiLabel}>건당 절감</span>
                                <span style={styles.roiValue}>₩{roi.savingsPerAnalysis.toLocaleString()}</span>
                            </div>
                            <div style={styles.roiItem}>
                                <span style={styles.roiLabel}>손익분기</span>
                                <span style={styles.roiValue}>{roi.breakEvenMonths}개월</span>
                            </div>
                            <div style={styles.roiItem}>
                                <span style={styles.roiLabel}>ROI</span>
                                <span style={styles.roiValue}>{agentROI.roiPercentage}%</span>
                            </div>
                            <div style={styles.roiItem}>
                                <span style={styles.roiLabel}>FTE 절감</span>
                                <span style={styles.roiValue}>{roi.fteEquivalent}명/월</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Tech Stack */}
            <section style={styles.techSection}>
                <h2 style={styles.sectionTitle}>🛠️ Technology Stack</h2>
                <div style={styles.techGrid}>
                    <TechBadge name="Next.js 16" icon="⚡" />
                    <TechBadge name="React 19" icon="⚛️" />
                    <TechBadge name="TypeScript" icon="📘" />
                    <TechBadge name="Gemini 2.5" icon="🧠" />
                    <TechBadge name="Firebase" icon="🔥" />
                    <TechBadge name="Vercel" icon="▲" />
                </div>
            </section>

            {/* Future Roadmap */}
            <section style={styles.roadmapSection}>
                <h2 style={styles.sectionTitle}>🔮 2027 Roadmap</h2>
                <div style={styles.roadmapGrid}>
                    <RoadmapCard
                        phase="A"
                        title="Vector Search"
                        date="Q2 2026"
                        icon="🔍"
                    />
                    <RoadmapCard
                        phase="B"
                        title="On-Device AI"
                        date="Q4 2026"
                        icon="📱"
                    />
                    <RoadmapCard
                        phase="C"
                        title="Global Expansion"
                        date="Q2 2027"
                        icon="🌏"
                    />
                </div>
            </section>

            {/* Footer */}
            <footer style={styles.footer}>
                <div style={styles.footerBadge}>🏆 PROJECT COMPLETE</div>
                <p style={styles.footerText}>
                    LooPyck AI Platform • Phase 4-12 Complete • February 2026
                </p>
            </footer>
        </div>
    );
}

// Sub-components
function HeroCard({ value, label, icon, color }: { value: string; label: string; icon: string; color: string }) {
    return (
        <div style={{ ...styles.heroCard, borderTopColor: color }}>
            <span style={styles.heroIcon}>{icon}</span>
            <span style={{ ...styles.heroValue, color }}>{value}</span>
            <span style={styles.heroLabel}>{label}</span>
        </div>
    );
}

function TechBadge({ name, icon }: { name: string; icon: string }) {
    return (
        <div style={styles.techBadge}>
            <span>{icon}</span>
            <span>{name}</span>
        </div>
    );
}

function RoadmapCard({ phase, title, date, icon }: { phase: string; title: string; date: string; icon: string }) {
    return (
        <div style={styles.roadmapCard}>
            <div style={styles.roadmapPhase}>Phase {phase}</div>
            <span style={styles.roadmapIcon}>{icon}</span>
            <span style={styles.roadmapTitle}>{title}</span>
            <span style={styles.roadmapDate}>{date}</span>
        </div>
    );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
    container: {
        maxWidth: 1000,
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
    logoSection: { display: 'flex', alignItems: 'center', gap: 16 },
    logo: { fontSize: 48 },
    title: { margin: 0, fontSize: 24, fontWeight: 700 },
    subtitle: { margin: 0, color: '#94a3b8', fontSize: 14 },
    dateBadge: { padding: '8px 16px', background: '#1e293b', borderRadius: 20, fontSize: 12, color: '#94a3b8' },
    heroSection: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 },
    heroCard: { background: '#1e293b', borderRadius: 12, padding: 20, textAlign: 'center', borderTop: '4px solid' },
    heroIcon: { fontSize: 28, display: 'block', marginBottom: 8 },
    heroValue: { fontSize: 28, fontWeight: 800, display: 'block' },
    heroLabel: { fontSize: 12, color: '#94a3b8' },
    twoColumn: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 32 },
    leftColumn: { background: '#1e293b', borderRadius: 12, padding: 20 },
    rightColumn: { display: 'flex', flexDirection: 'column', gap: 16 },
    sectionTitle: { fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#f1f5f9' },
    timeline: { display: 'flex', flexDirection: 'column', gap: 8 },
    timelineItem: { display: 'flex', alignItems: 'center', gap: 12 },
    timelineNode: { width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    phaseNum: { fontSize: 12, fontWeight: 700, color: 'white' },
    timelineContent: { flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    phaseName: { fontSize: 13, color: '#e2e8f0' },
    phaseHighlight: { fontSize: 11, color: '#94a3b8', background: '#0f172a', padding: '2px 8px', borderRadius: 10 },
    mallList: { background: '#1e293b', borderRadius: 12, padding: 16 },
    mallItem: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 },
    mallName: { width: 60, fontSize: 12 },
    progressContainer: { flex: 1, height: 8, background: '#0f172a', borderRadius: 4, overflow: 'hidden' },
    progressBar: { height: '100%', borderRadius: 4, transition: 'width 0.3s' },
    mallRate: { width: 40, fontSize: 12, fontWeight: 600, textAlign: 'right' },
    roiBox: { background: '#1e293b', borderRadius: 12, padding: 16 },
    roiTitle: { fontSize: 14, fontWeight: 600, marginBottom: 12, color: '#f1f5f9' },
    roiGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 },
    roiItem: { display: 'flex', flexDirection: 'column' },
    roiLabel: { fontSize: 11, color: '#64748b' },
    roiValue: { fontSize: 18, fontWeight: 700, color: '#10b981' },
    techSection: { marginBottom: 32 },
    techGrid: { display: 'flex', flexWrap: 'wrap', gap: 12 },
    techBadge: { display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#1e293b', borderRadius: 20, fontSize: 13 },
    roadmapSection: { marginBottom: 32 },
    roadmapGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 },
    roadmapCard: { background: 'linear-gradient(135deg, #1e293b, #0f172a)', border: '1px solid #334155', borderRadius: 12, padding: 20, textAlign: 'center' },
    roadmapPhase: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', marginBottom: 8 },
    roadmapIcon: { fontSize: 32, display: 'block', marginBottom: 8 },
    roadmapTitle: { fontSize: 14, fontWeight: 600, display: 'block', marginBottom: 4 },
    roadmapDate: { fontSize: 12, color: '#94a3b8' },
    footer: { textAlign: 'center', paddingTop: 24, borderTop: '1px solid #334155' },
    footerBadge: { display: 'inline-block', padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #06b6d4)', borderRadius: 24, fontSize: 14, fontWeight: 700, marginBottom: 12 },
    footerText: { color: '#64748b', fontSize: 12 },
};
