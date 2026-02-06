/**
 * Usage Tracker for Gemini AI API
 * 일일 사용량 추적 및 경고 시스템
 */

import { AI_RATE_LIMITS } from './config';

interface UsageRecord {
    date: string;        // YYYY-MM-DD
    requestCount: number;
    totalTokens: number;
    successCount: number;
    failureCount: number;
    lastRequestAt: string;
}

interface UsageStats {
    today: UsageRecord;
    remainingRequests: number;
    usagePercentage: number;
    warningLevel: 'safe' | 'caution' | 'danger';
    estimatedExhaustion: Date | null;

    // Phase 4.1: 유료 전환 UI 데이터
    shouldShowUpgrade: boolean;     // 업그레이드 배너 표시 여부
    upgradeReason: UpgradeReason | null;
    tier: 'free' | 'basic' | 'pro';
}

// 유료 전환 이유
type UpgradeReason =
    | 'quota_exceeded'          // 쿼터 초과
    | 'quota_almost_exhausted'  // 쿼터 거의 소진 (90%+)
    | 'high_usage_pattern'      // 높은 사용 패턴 (3일 연속 70%+)
    | 'premium_feature';        // 프리미엄 기능 시도

// 사용자 티어 설정
const TIER_LIMITS = {
    free: 20,   // 일 20회
    basic: 100, // 일 100회
    pro: 500,   // 일 500회
} as const;

class UsageTracker {
    private readonly STORAGE_KEY = 'loopyck_ai_usage';
    private readonly WARNING_THRESHOLDS = {
        CAUTION: 0.7,  // 70% 사용 시 주의
        DANGER: 0.9,   // 90% 사용 시 위험
    };

    /**
     * 오늘 날짜 문자열 (YYYY-MM-DD)
     */
    private getTodayKey(): string {
        return new Date().toISOString().split('T')[0];
    }

    /**
     * 사용 기록 로드
     */
    private loadUsage(): UsageRecord {
        if (typeof window === 'undefined') {
            return this.getEmptyRecord();
        }

        const saved = localStorage.getItem(this.STORAGE_KEY);
        if (!saved) {
            return this.getEmptyRecord();
        }

        try {
            const record: UsageRecord = JSON.parse(saved);

            // 날짜가 다르면 새로운 기록 시작
            if (record.date !== this.getTodayKey()) {
                return this.getEmptyRecord();
            }

            return record;
        } catch {
            return this.getEmptyRecord();
        }
    }

    /**
     * 빈 기록 생성
     */
    private getEmptyRecord(): UsageRecord {
        return {
            date: this.getTodayKey(),
            requestCount: 0,
            totalTokens: 0,
            successCount: 0,
            failureCount: 0,
            lastRequestAt: '',
        };
    }

    /**
     * 사용 기록 저장
     */
    private saveUsage(record: UsageRecord): void {
        if (typeof window === 'undefined') return;
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(record));
    }

    /**
     * 요청 기록 (성공)
     */
    recordSuccess(tokensUsed: number): void {
        const record = this.loadUsage();
        record.requestCount += 1;
        record.successCount += 1;
        record.totalTokens += tokensUsed;
        record.lastRequestAt = new Date().toISOString();
        this.saveUsage(record);

        // 경고 체크
        const stats = this.getStats();
        if (stats.warningLevel === 'danger') {
            console.warn('[UsageTracker] ⚠️ DANGER: 일일 쿼터 거의 소진!', stats);
        } else if (stats.warningLevel === 'caution') {
            console.warn('[UsageTracker] ⚡ CAUTION: 일일 쿼터 70% 이상 사용', stats);
        }
    }

    /**
     * 요청 기록 (실패)
     */
    recordFailure(): void {
        const record = this.loadUsage();
        record.requestCount += 1;
        record.failureCount += 1;
        record.lastRequestAt = new Date().toISOString();
        this.saveUsage(record);
    }

    /**
     * 현재 통계 조회
     */
    getStats(): UsageStats {
        const record = this.loadUsage();
        const remaining = Math.max(0, AI_RATE_LIMITS.RPD - record.requestCount);
        const percentage = record.requestCount / AI_RATE_LIMITS.RPD;

        let warningLevel: 'safe' | 'caution' | 'danger' = 'safe';
        if (percentage >= this.WARNING_THRESHOLDS.DANGER) {
            warningLevel = 'danger';
        } else if (percentage >= this.WARNING_THRESHOLDS.CAUTION) {
            warningLevel = 'caution';
        }

        // 소진 예상 시간 계산 (현재 사용 속도 기반)
        let estimatedExhaustion: Date | null = null;
        if (record.requestCount > 0 && remaining > 0) {
            const firstRequest = new Date(record.lastRequestAt);
            const now = new Date();
            const elapsedMs = now.getTime() - firstRequest.getTime();
            const avgRequestTime = elapsedMs / record.requestCount;
            const remainingMs = avgRequestTime * remaining;
            estimatedExhaustion = new Date(now.getTime() + remainingMs);
        }

        // 유료 전환 UI 데이터 계산
        const shouldShowUpgrade = warningLevel === 'danger' || remaining === 0;
        let upgradeReason: UpgradeReason | null = null;
        if (remaining === 0) {
            upgradeReason = 'quota_exceeded';
        } else if (warningLevel === 'danger') {
            upgradeReason = 'quota_almost_exhausted';
        }

        return {
            today: record,
            remainingRequests: remaining,
            usagePercentage: Math.round(percentage * 100),
            warningLevel,
            estimatedExhaustion,
            shouldShowUpgrade,
            upgradeReason,
            tier: 'free', // 현재는 무료 티어만 지원
        };
    }

    /**
     * 요청 가능 여부 (쿼터 기반)
     */
    canMakeRequest(): boolean {
        const stats = this.getStats();
        return stats.remainingRequests > 0;
    }

    /**
     * 사용량 리셋 (테스트용)
     */
    reset(): void {
        if (typeof window === 'undefined') return;
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('[UsageTracker] Usage reset');
    }

    /**
     * 사용량 요약 출력
     */
    printSummary(): void {
        const stats = this.getStats();
        console.log(`
╔════════════════════════════════════════╗
║       LooPyck AI Usage Summary         ║
╠════════════════════════════════════════╣
║ Date:        ${stats.today.date.padEnd(25)}║
║ Requests:    ${(stats.today.requestCount + '/' + AI_RATE_LIMITS.RPD).padEnd(25)}║
║ Remaining:   ${String(stats.remainingRequests).padEnd(25)}║
║ Usage:       ${(stats.usagePercentage + '%').padEnd(25)}║
║ Status:      ${stats.warningLevel.toUpperCase().padEnd(25)}║
║ Success:     ${String(stats.today.successCount).padEnd(25)}║
║ Failures:    ${String(stats.today.failureCount).padEnd(25)}║
╚════════════════════════════════════════╝
    `);
    }
}

// 싱글톤 인스턴스
export const usageTracker = new UsageTracker();
