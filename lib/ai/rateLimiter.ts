/**
 * Rate Limiter for Gemini AI API
 * Token Bucket 알고리즘 기반 Rate Limiting
 */

import { AI_RATE_LIMITS } from './config';
import type { RateLimitState } from '@/types/aiExtraction';

class RateLimiter {
    private state: RateLimitState;
    private readonly limits = AI_RATE_LIMITS;

    constructor() {
        this.state = this.loadState();
    }

    /**
     * localStorage에서 상태 로드 (또는 초기화)
     */
    private loadState(): RateLimitState {
        if (typeof window === 'undefined') {
            return this.getInitialState();
        }

        const saved = localStorage.getItem('loopyck_rate_limit');
        if (!saved) {
            return this.getInitialState();
        }

        try {
            const parsed = JSON.parse(saved);
            const state: RateLimitState = {
                rpm: parsed.rpm || 0,
                rpd: parsed.rpd || 0,
                tpm: parsed.tpm || 0,
                lastReset: new Date(parsed.lastReset),
                dailyReset: new Date(parsed.dailyReset),
            };

            // 리셋 타이밍 체크
            return this.checkAndReset(state);
        } catch {
            return this.getInitialState();
        }
    }

    /**
     * 초기 상태 생성
     */
    private getInitialState(): RateLimitState {
        const now = new Date();
        return {
            rpm: 0,
            rpd: 0,
            tpm: 0,
            lastReset: now,
            dailyReset: this.getNextMidnight(),
        };
    }

    /**
     * 다음 자정 시간 계산 (Pacific Time 기준이나 로컬로 단순화)
     */
    private getNextMidnight(): Date {
        const now = new Date();
        const midnight = new Date(now);
        midnight.setHours(24, 0, 0, 0);
        return midnight;
    }

    /**
     * 리셋 타이밍 체크 및 카운터 초기화
     */
    private checkAndReset(state: RateLimitState): RateLimitState {
        const now = new Date();

        // 분당 리셋 (1분 경과 시)
        const minuteElapsed = (now.getTime() - state.lastReset.getTime()) >= 60_000;
        if (minuteElapsed) {
            state.rpm = 0;
            state.tpm = 0;
            state.lastReset = now;
        }

        // 일일 리셋
        if (now >= state.dailyReset) {
            state.rpd = 0;
            state.dailyReset = this.getNextMidnight();
        }

        return state;
    }

    /**
     * 상태 저장
     */
    private saveState(): void {
        if (typeof window === 'undefined') return;

        localStorage.setItem('loopyck_rate_limit', JSON.stringify({
            rpm: this.state.rpm,
            rpd: this.state.rpd,
            tpm: this.state.tpm,
            lastReset: this.state.lastReset.toISOString(),
            dailyReset: this.state.dailyReset.toISOString(),
        }));
    }

    /**
     * 요청 가능 여부 확인
     */
    canMakeRequest(estimatedTokens: number = 0): boolean {
        this.state = this.checkAndReset(this.state);

        const safeRPM = this.limits.RPM * this.limits.SAFETY_MARGIN;
        const safeRPD = this.limits.RPD * this.limits.SAFETY_MARGIN;
        const safeTPM = this.limits.TPM * this.limits.SAFETY_MARGIN;

        if (this.state.rpm >= safeRPM) {
            console.warn('[RateLimiter] RPM limit reached');
            return false;
        }

        if (this.state.rpd >= safeRPD) {
            console.warn('[RateLimiter] RPD limit reached');
            return false;
        }

        if (this.state.tpm + estimatedTokens > safeTPM) {
            console.warn('[RateLimiter] TPM limit would be exceeded');
            return false;
        }

        return true;
    }

    /**
     * 요청 기록
     */
    recordRequest(tokensUsed: number): void {
        this.state.rpm += 1;
        this.state.rpd += 1;
        this.state.tpm += tokensUsed;
        this.saveState();
    }

    /**
     * 현재 상태 조회
     */
    getStatus(): {
        canRequest: boolean;
        rpm: { current: number; max: number };
        rpd: { current: number; max: number };
        tpm: { current: number; max: number };
        nextReset: Date;
        dailyReset: Date;
    } {
        this.state = this.checkAndReset(this.state);

        return {
            canRequest: this.canMakeRequest(),
            rpm: { current: this.state.rpm, max: this.limits.RPM },
            rpd: { current: this.state.rpd, max: this.limits.RPD },
            tpm: { current: this.state.tpm, max: this.limits.TPM },
            nextReset: new Date(this.state.lastReset.getTime() + 60_000),
            dailyReset: this.state.dailyReset,
        };
    }

    /**
     * 남은 일일 쿼터
     */
    getRemainingDaily(): number {
        this.state = this.checkAndReset(this.state);
        return Math.max(0, this.limits.RPD - this.state.rpd);
    }

    /**
     * 강제 리셋 (테스트용)
     */
    reset(): void {
        this.state = this.getInitialState();
        this.saveState();
        console.log('[RateLimiter] State reset');
    }
}

// 싱글톤 인스턴스
export const rateLimiter = new RateLimiter();
