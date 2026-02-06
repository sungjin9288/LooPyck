'use client';

/**
 * Agent Dashboard - Admin 전용
 * 실시간 에이전트 상태, 성공률, 비용 모니터링
 */

import { useState, useEffect, useCallback } from 'react';
import { useUser } from '@/contexts/UserContext';
import { costTracker, DailyCostSummary } from '@/lib/ai/costTracker';
import { concurrencyManager, QueueStats } from '@/lib/agent/concurrency';
import { usageTracker } from '@/lib/ai/usageTracker';

// Admin UID 목록 (환경변수로 관리 권장)
const ADMIN_UIDS = ['admin_uid_here']; // TODO: 실제 UID로 교체

// 대시보드 데이터 타입
interface DashboardData {
    // 쿼터 상태
    quota: {
        used: number;
        remaining: number;
        percentage: number;
        warningLevel: 'safe' | 'caution' | 'danger';
    };
    // 비용 추적
    cost: DailyCostSummary;
    // 동시성 상태
    concurrency: QueueStats;
    // 모델 분포
    modelDistribution: { flash: number; pro: number };
    // 마지막 업데이트
    lastUpdated: Date;
}

// 스타일
const styles = {
    container: {
        padding: '24px',
        backgroundColor: '#0a0a0a',
        minHeight: '100vh',
        color: '#fff',
    } as React.CSSProperties,
    header: {
        fontSize: '24px',
        fontWeight: 700,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    } as React.CSSProperties,
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '16px',
    } as React.CSSProperties,
    card: {
        backgroundColor: '#1a1a1a',
        borderRadius: '12px',
        padding: '20px',
        border: '1px solid #333',
    } as React.CSSProperties,
    cardTitle: {
        fontSize: '14px',
        color: '#888',
        marginBottom: '8px',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
    } as React.CSSProperties,
    cardValue: {
        fontSize: '32px',
        fontWeight: 700,
    } as React.CSSProperties,
    cardSubtext: {
        fontSize: '12px',
        color: '#666',
        marginTop: '4px',
    } as React.CSSProperties,
    statusBadge: {
        display: 'inline-block',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 600,
    } as React.CSSProperties,
    progressBar: {
        width: '100%',
        height: '8px',
        backgroundColor: '#333',
        borderRadius: '4px',
        overflow: 'hidden',
        marginTop: '12px',
    } as React.CSSProperties,
    accessDenied: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#888',
    } as React.CSSProperties,
};

// 숫자 포맷터
function formatNumber(num: number): string {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
}

// 상태 색상
function getStatusColor(level: 'safe' | 'caution' | 'danger'): string {
    switch (level) {
        case 'safe': return '#22c55e';
        case 'caution': return '#f59e0b';
        case 'danger': return '#ef4444';
    }
}

export default function AgentDashboard() {
    const { user, loading: authLoading } = useUser();
    const [data, setData] = useState<DashboardData | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [refreshCount, setRefreshCount] = useState(0);

    // Admin 권한 체크
    useEffect(() => {
        if (user && ADMIN_UIDS.includes(user.uid)) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    }, [user]);

    // 데이터 로드
    const loadData = useCallback(() => {
        const stats = usageTracker.getStats();
        const costData = costTracker.getTodaySummary();
        const queueStats = concurrencyManager.getStats();
        const modelDist = costTracker.getModelDistribution();

        setData({
            quota: {
                used: stats.today.requestCount,
                remaining: stats.remainingRequests,
                percentage: stats.usagePercentage,
                warningLevel: stats.warningLevel,
            },
            cost: costData,
            concurrency: queueStats,
            modelDistribution: modelDist,
            lastUpdated: new Date(),
        });
    }, []);

    // 자동 새로고침 (5초)
    useEffect(() => {
        if (!isAdmin) return;

        loadData();
        const interval = setInterval(() => {
            loadData();
            setRefreshCount(c => c + 1);
        }, 5000);

        return () => clearInterval(interval);
    }, [isAdmin, loadData]);

    // 로딩 중
    if (authLoading) {
        return (
            <div style={styles.accessDenied}>
                <p>Loading...</p>
            </div>
        );
    }

    // 접근 거부
    if (!user || !isAdmin) {
        return (
            <div style={styles.accessDenied}>
                <h2 style={{ fontSize: '24px', marginBottom: '16px' }}>🔒 Access Denied</h2>
                <p>Admin 권한이 필요합니다.</p>
                {user && <p style={{ marginTop: '8px', fontSize: '12px' }}>UID: {user.uid}</p>}
            </div>
        );
    }

    if (!data) {
        return (
            <div style={styles.accessDenied}>
                <p>Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            {/* 헤더 */}
            <header style={styles.header}>
                <span>🤖</span>
                <span>Agent Dashboard</span>
                <span style={{
                    fontSize: '12px',
                    color: '#666',
                    marginLeft: 'auto'
                }}>
                    Last updated: {data.lastUpdated.toLocaleTimeString()} (#{refreshCount})
                </span>
            </header>

            {/* 메트릭 그리드 */}
            <div style={styles.grid}>
                {/* 일일 쿼터 */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Daily Quota</div>
                    <div style={styles.cardValue}>
                        {data.quota.used}
                        <span style={{ fontSize: '16px', color: '#666' }}> / 20</span>
                    </div>
                    <div style={styles.progressBar}>
                        <div style={{
                            width: `${data.quota.percentage}%`,
                            height: '100%',
                            backgroundColor: getStatusColor(data.quota.warningLevel),
                            transition: 'width 0.3s ease',
                        }} />
                    </div>
                    <div style={styles.cardSubtext}>
                        Remaining: {data.quota.remaining} requests
                    </div>
                </div>

                {/* 성공률 */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Success Rate</div>
                    <div style={styles.cardValue}>
                        {data.concurrency.completedTasks + data.concurrency.failedTasks > 0
                            ? Math.round((data.concurrency.completedTasks /
                                (data.concurrency.completedTasks + data.concurrency.failedTasks)) * 100)
                            : 100}%
                    </div>
                    <div style={styles.cardSubtext}>
                        ✅ {data.concurrency.completedTasks} succeeded | ❌ {data.concurrency.failedTasks} failed
                    </div>
                </div>

                {/* 평균 지연시간 */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Avg Latency</div>
                    <div style={styles.cardValue}>
                        {data.concurrency.avgExecutionTimeMs}
                        <span style={{ fontSize: '16px', color: '#666' }}>ms</span>
                    </div>
                    <div style={styles.cardSubtext}>
                        Queue wait: {data.concurrency.avgWaitTimeMs}ms
                    </div>
                </div>

                {/* 동시성 상태 */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Active Sessions</div>
                    <div style={styles.cardValue}>
                        {data.concurrency.activeSessions}
                        <span style={{ fontSize: '16px', color: '#666' }}> / {data.concurrency.maxSessions}</span>
                    </div>
                    <div style={styles.cardSubtext}>
                        Queue: {data.concurrency.queueLength} / {data.concurrency.maxQueueSize}
                    </div>
                </div>

                {/* 모델 분포 */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Model Distribution</div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#22c55e' }}>
                                {data.modelDistribution.flash}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Flash (Free)</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '24px', fontWeight: 700, color: '#f59e0b' }}>
                                {data.modelDistribution.pro}%
                            </div>
                            <div style={{ fontSize: '12px', color: '#666' }}>Pro (Paid)</div>
                        </div>
                    </div>
                </div>

                {/* 오늘 비용 */}
                <div style={styles.card}>
                    <div style={styles.cardTitle}>Today&apos;s Cost</div>
                    <div style={styles.cardValue}>
                        ${data.cost.totalCostUsd.toFixed(4)}
                    </div>
                    <div style={styles.cardSubtext}>
                        Monthly projection: ${data.cost.projectedMonthlyCostUsd.toFixed(2)}
                    </div>
                    <div style={{
                        ...styles.statusBadge,
                        marginTop: '8px',
                        backgroundColor: data.cost.budgetUsagePercent > 80 ? '#7f1d1d' : '#14532d',
                        color: data.cost.budgetUsagePercent > 80 ? '#fca5a5' : '#86efac',
                    }}>
                        {data.cost.budgetUsagePercent.toFixed(0)}% of budget
                    </div>
                </div>
            </div>

            {/* 토큰 통계 */}
            <div style={{ ...styles.card, marginTop: '16px' }}>
                <div style={styles.cardTitle}>Token Usage</div>
                <div style={{ display: 'flex', gap: '32px', marginTop: '12px' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            {formatNumber(data.cost.flashTokens)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Flash Tokens</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            {formatNumber(data.cost.proTokens)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Pro Tokens</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 600 }}>
                            {data.cost.flashRequests + data.cost.proRequests}
                        </div>
                        <div style={{ fontSize: '12px', color: '#666' }}>Total Requests</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
