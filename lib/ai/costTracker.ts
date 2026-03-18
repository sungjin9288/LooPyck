/**
 * Cost Tracker for AI API Usage
 * Pro/Flash 사용 비중 및 예상 비용 산출
 */

import { GEMINI_MODELS, ModelTier } from './geminiProvider';

// 비용 기록
interface CostRecord {
    timestamp: Date;
    model: ModelTier;
    tokensUsed: number;
    costUsd: number;
    reason: string; // 왜 이 모델을 사용했는지
}

// 일일 비용 요약
export interface DailyCostSummary {
    date: string; // YYYY-MM-DD
    flashRequests: number;
    proRequests: number;
    flashTokens: number;
    proTokens: number;
    totalCostUsd: number;
    projectedMonthlyCostUsd: number;
    budgetUsagePercent: number; // 월 예산 대비
}

// 설정
const MONTHLY_BUDGET_USD = 50; // 월 예산 (기본값)
const STORAGE_KEY = 'loopyck_cost_tracker';

class CostTracker {
    private records: CostRecord[] = [];
    private dailySummary: Map<string, DailyCostSummary> = new Map();

    constructor() {
        this.loadFromStorage();
    }

    /**
     * localStorage에서 로드
     */
    private loadFromStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                this.records = (data.records || []).map((r: CostRecord) => ({
                    ...r,
                    timestamp: new Date(r.timestamp),
                }));
                this.rebuildDailySummary();
            }
        } catch (error) {
            console.error('[CostTracker] Load failed:', error);
        }
    }

    /**
     * localStorage에 저장
     */
    private saveToStorage(): void {
        if (typeof window === 'undefined') return;

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                records: this.records.slice(-1000), // 최근 1000개만 유지
                lastUpdated: new Date().toISOString(),
            }));
        } catch (error) {
            console.error('[CostTracker] Save failed:', error);
        }
    }

    /**
     * 일일 요약 재계산
     */
    private rebuildDailySummary(): void {
        this.dailySummary.clear();

        for (const record of this.records) {
            const date = record.timestamp.toISOString().split('T')[0];
            this.updateDailySummary(date, record);
        }
    }

    /**
     * 일일 요약 업데이트
     */
    private updateDailySummary(date: string, record: CostRecord): void {
        const existing = this.dailySummary.get(date) || {
            date,
            flashRequests: 0,
            proRequests: 0,
            flashTokens: 0,
            proTokens: 0,
            totalCostUsd: 0,
            projectedMonthlyCostUsd: 0,
            budgetUsagePercent: 0,
        };

        if (record.model === 'flash') {
            existing.flashRequests++;
            existing.flashTokens += record.tokensUsed;
        } else {
            existing.proRequests++;
            existing.proTokens += record.tokensUsed;
        }

        existing.totalCostUsd += record.costUsd;
        existing.projectedMonthlyCostUsd = existing.totalCostUsd * 30; // 30일 기준
        existing.budgetUsagePercent = (existing.projectedMonthlyCostUsd / MONTHLY_BUDGET_USD) * 100;

        this.dailySummary.set(date, existing);
    }

    /**
     * API 호출 비용 기록
     */
    recordUsage(
        model: ModelTier,
        tokensUsed: number,
        reason: string = 'extraction'
    ): CostRecord {
        const modelConfig = GEMINI_MODELS[model];
        const costUsd = (tokensUsed / 1_000_000) * modelConfig.costPer1MTokens;

        const record: CostRecord = {
            timestamp: new Date(),
            model,
            tokensUsed,
            costUsd,
            reason,
        };

        this.records.push(record);

        const date = record.timestamp.toISOString().split('T')[0];
        this.updateDailySummary(date, record);

        this.saveToStorage();

        return record;
    }

    /**
     * 오늘 비용 요약 조회
     */
    getTodaySummary(): DailyCostSummary {
        const today = new Date().toISOString().split('T')[0];
        return this.dailySummary.get(today) || {
            date: today,
            flashRequests: 0,
            proRequests: 0,
            flashTokens: 0,
            proTokens: 0,
            totalCostUsd: 0,
            projectedMonthlyCostUsd: 0,
            budgetUsagePercent: 0,
        };
    }

    /**
     * 최근 N일 비용 조회
     */
    getRecentDays(days: number = 7): DailyCostSummary[] {
        const result: DailyCostSummary[] = [];
        const now = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];

            result.push(this.dailySummary.get(dateStr) || {
                date: dateStr,
                flashRequests: 0,
                proRequests: 0,
                flashTokens: 0,
                proTokens: 0,
                totalCostUsd: 0,
                projectedMonthlyCostUsd: 0,
                budgetUsagePercent: 0,
            });
        }

        return result;
    }

    /**
     * 월간 총 비용
     */
    getMonthlyTotal(): number {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        return this.records
            .filter(r => r.timestamp >= monthStart)
            .reduce((sum, r) => sum + r.costUsd, 0);
    }

    /**
     * 모델 사용 비율
     */
    getModelDistribution(): { flash: number; pro: number } {
        const total = this.records.length;
        if (total === 0) return { flash: 0, pro: 0 };

        const flashCount = this.records.filter(r => r.model === 'flash').length;
        return {
            flash: Math.round((flashCount / total) * 100),
            pro: Math.round(((total - flashCount) / total) * 100),
        };
    }

    /**
     * 예산 경고 체크
     */
    checkBudgetWarning(): { level: 'safe' | 'caution' | 'danger'; message: string } {
        const today = this.getTodaySummary();
        const percent = today.budgetUsagePercent;

        if (percent >= 100) {
            return { level: 'danger', message: `월 예산 초과! (${percent.toFixed(0)}%)` };
        }
        if (percent >= 80) {
            return { level: 'caution', message: `월 예산 80% 도달 (${percent.toFixed(0)}%)` };
        }
        return { level: 'safe', message: `예산 여유 (${percent.toFixed(0)}%)` };
    }

    /**
     * 비용 요약 출력
     */
    printSummary(): void {
        const today = this.getTodaySummary();
        const dist = this.getModelDistribution();
        const warning = this.checkBudgetWarning();

        console.log(`
╔════════════════════════════════════════╗
║       LooPyck Cost Tracker             ║
╠════════════════════════════════════════╣
║ Date:          ${today.date.padEnd(23)}║
║ Flash:         ${String(today.flashRequests).padEnd(23)}║
║ Pro:           ${String(today.proRequests).padEnd(23)}║
║ Today Cost:    $${today.totalCostUsd.toFixed(4).padEnd(21)}║
║ Monthly Est:   $${today.projectedMonthlyCostUsd.toFixed(2).padEnd(21)}║
║ Budget:        ${warning.message.padEnd(23)}║
║ Model Split:   Flash ${dist.flash}% / Pro ${dist.pro}%`.padEnd(39) + `║
╚════════════════════════════════════════╝
    `);
    }

    /**
     * 데이터 리셋 (테스트용)
     */
    reset(): void {
        this.records = [];
        this.dailySummary.clear();
        if (typeof window !== 'undefined') {
            localStorage.removeItem(STORAGE_KEY);
        }
        console.log('[CostTracker] Reset complete');
    }
}

// 싱글톤 인스턴스
export const costTracker = new CostTracker();
