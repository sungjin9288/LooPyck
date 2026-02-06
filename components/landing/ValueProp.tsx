'use client';

/**
 * Value Proposition - C-Level용 30초 ROI 전달 랜딩 섹션
 * 전문 컨설팅 펌 톤앤매너
 */

import { useEffect, useState } from 'react';
import { getHeroMetrics, getAnimatedCounters } from '@/lib/analytics/publicStats';

export default function ValueProp() {
    const hero = getHeroMetrics();
    const counters = getAnimatedCounters();

    return (
        <section style={styles.section}>
            {/* Hero Headline */}
            <div style={styles.heroContainer}>
                <span style={styles.badge}>AI-Powered Fashion Intelligence</span>
                <h1 style={styles.headline}>
                    <span style={styles.highlight}>99.8%</span> 비용 절감,
                    <br />
                    7개 쇼핑몰 자동 분석
                </h1>
                <p style={styles.subheadline}>
                    수동 분석 대비 <strong>₩24,950/건</strong> 절감.
                    Zero-Cost AI로 연간 <strong>₩3억+</strong> 가치 창출.
                </p>

                <div style={styles.ctaContainer}>
                    <button style={styles.primaryCta}>무료로 시작하기</button>
                    <button style={styles.secondaryCta}>데모 체험</button>
                </div>
            </div>

            {/* Hero Metrics */}
            <div style={styles.metricsGrid}>
                <MetricCard
                    value={hero.costReduction}
                    label="비용 절감"
                    subtext="수동 분석 대비"
                    icon="💰"
                    color="#10b981"
                />
                <MetricCard
                    value={hero.automationRate}
                    label="자동화율"
                    subtext="7개 쇼핑몰"
                    icon="🤖"
                    color="#3b82f6"
                />
                <MetricCard
                    value={hero.annualSavings}
                    label="연간 절감"
                    subtext="예상 가치"
                    icon="📈"
                    color="#8b5cf6"
                />
                <MetricCard
                    value="₩0"
                    label="인프라 비용"
                    subtext="Zero-Cost 아키텍처"
                    icon="☁️"
                    color="#06b6d4"
                />
            </div>

            {/* Social Proof */}
            <div style={styles.socialProof}>
                <AnimatedCounter {...counters.analyses} label="누적 분석" />
                <AnimatedCounter {...counters.savings} label="절감액" />
                <AnimatedCounter {...counters.malls} label="지원 쇼핑몰" />
            </div>

            {/* Feature Highlights */}
            <div style={styles.features}>
                <FeatureCard
                    icon="🧠"
                    title="AI Vision Parsing"
                    description="스크린샷만으로 가격, 소재, 스타일 자동 추출"
                />
                <FeatureCard
                    icon="🔄"
                    title="Self-Healing Agent"
                    description="팝업, 지연 로딩 등 오류 자동 복구"
                />
                <FeatureCard
                    icon="💬"
                    title="Conversational Search"
                    description="'올드머니룩 추천해줘' 자연어 검색"
                />
                <FeatureCard
                    icon="📊"
                    title="RAG Trend Engine"
                    description="팬톤 컬러, 트렌드 기반 추천"
                />
            </div>

            {/* Trust Badges */}
            <div style={styles.trustSection}>
                <span style={styles.trustBadge}>✅ Gemini 2.5 Flash</span>
                <span style={styles.trustBadge}>✅ Firebase Auth</span>
                <span style={styles.trustBadge}>✅ Vercel Edge</span>
                <span style={styles.trustBadge}>✅ 99.5% Uptime SLA</span>
            </div>
        </section>
    );
}

// Metric Card Component
function MetricCard({ value, label, subtext, icon, color }: {
    value: string;
    label: string;
    subtext: string;
    icon: string;
    color: string;
}) {
    return (
        <div style={{ ...styles.metricCard, borderTopColor: color }}>
            <span style={styles.metricIcon}>{icon}</span>
            <span style={{ ...styles.metricValue, color }}>{value}</span>
            <span style={styles.metricLabel}>{label}</span>
            <span style={styles.metricSubtext}>{subtext}</span>
        </div>
    );
}

// Animated Counter Component
function AnimatedCounter({ value, suffix, label }: {
    value: number;
    suffix: string;
    label: string;
}) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        const duration = 2000;
        const steps = 60;
        const increment = value / steps;
        let current = 0;

        const timer = setInterval(() => {
            current += increment;
            if (current >= value) {
                setDisplayValue(value);
                clearInterval(timer);
            } else {
                setDisplayValue(Math.floor(current));
            }
        }, duration / steps);

        return () => clearInterval(timer);
    }, [value]);

    return (
        <div style={styles.counterCard}>
            <span style={styles.counterValue}>
                {displayValue.toLocaleString()}<span style={styles.counterSuffix}>{suffix}</span>
            </span>
            <span style={styles.counterLabel}>{label}</span>
        </div>
    );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: {
    icon: string;
    title: string;
    description: string;
}) {
    return (
        <div style={styles.featureCard}>
            <span style={styles.featureIcon}>{icon}</span>
            <h3 style={styles.featureTitle}>{title}</h3>
            <p style={styles.featureDesc}>{description}</p>
        </div>
    );
}

// Styles
const styles: Record<string, React.CSSProperties> = {
    section: {
        backgroundColor: '#0f172a',
        color: '#e2e8f0',
        padding: '80px 24px',
        fontFamily: "'Inter', -apple-system, sans-serif",
    },
    heroContainer: {
        maxWidth: 800,
        margin: '0 auto 64px',
        textAlign: 'center',
    },
    badge: {
        display: 'inline-block',
        padding: '8px 16px',
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2) 0%, rgba(139, 92, 246, 0.2) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 20,
        color: '#a78bfa',
        marginBottom: 24,
    },
    headline: {
        fontSize: 48,
        fontWeight: 800,
        lineHeight: 1.2,
        margin: '0 0 24px',
        color: '#f8fafc',
    },
    highlight: {
        background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    subheadline: {
        fontSize: 18,
        color: '#94a3b8',
        lineHeight: 1.6,
        margin: '0 0 32px',
    },
    ctaContainer: {
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
    },
    primaryCta: {
        padding: '14px 32px',
        fontSize: 16,
        fontWeight: 600,
        color: 'white',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    secondaryCta: {
        padding: '14px 32px',
        fontSize: 16,
        fontWeight: 600,
        color: '#e2e8f0',
        background: 'transparent',
        border: '1px solid #475569',
        borderRadius: 8,
        cursor: 'pointer',
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 24,
        maxWidth: 1000,
        margin: '0 auto 64px',
    },
    metricCard: {
        background: '#1e293b',
        borderRadius: 16,
        padding: 24,
        textAlign: 'center',
        borderTop: '4px solid',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
    },
    metricIcon: { fontSize: 32 },
    metricValue: { fontSize: 32, fontWeight: 800 },
    metricLabel: { fontSize: 14, fontWeight: 600, color: '#f1f5f9' },
    metricSubtext: { fontSize: 12, color: '#64748b' },
    socialProof: {
        display: 'flex',
        justifyContent: 'center',
        gap: 48,
        marginBottom: 64,
        padding: '32px 0',
        borderTop: '1px solid #1e293b',
        borderBottom: '1px solid #1e293b',
    },
    counterCard: {
        textAlign: 'center',
    },
    counterValue: {
        fontSize: 36,
        fontWeight: 700,
        color: '#10b981',
        display: 'block',
    },
    counterSuffix: {
        fontSize: 18,
        color: '#64748b',
        marginLeft: 4,
    },
    counterLabel: {
        fontSize: 14,
        color: '#94a3b8',
        marginTop: 4,
        display: 'block',
    },
    features: {
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 24,
        maxWidth: 1000,
        margin: '0 auto 64px',
    },
    featureCard: {
        background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        border: '1px solid #334155',
        borderRadius: 12,
        padding: 24,
        textAlign: 'center',
    },
    featureIcon: { fontSize: 40, marginBottom: 16, display: 'block' },
    featureTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 8px', color: '#f1f5f9' },
    featureDesc: { fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.5 },
    trustSection: {
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        flexWrap: 'wrap',
    },
    trustBadge: {
        padding: '8px 16px',
        fontSize: 13,
        color: '#94a3b8',
        background: '#1e293b',
        borderRadius: 20,
    },
};
