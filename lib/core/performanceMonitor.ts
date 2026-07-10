import { Logger } from './observability';
/**
 * Performance Monitor
 * 시스템 병목 현상을 실시간으로 추적하고 로깅하는 모듈.
 * 
 * 기능:
 * - 함수 실행 시간 측정 (Latency Tracking)
 * - 500ms 이상 소요되는 Slow Operation 경고
 * - 메모리 사용량 스냅샷 (Node.js 환경)
 */

export type PerformanceMetric = {
    operationName: string;
    startTime: number;
    endTime: number;
    durationMs: number;
    memoryUsage?: NodeJS.MemoryUsage;
    timestamp: string;
};

const metricsHistory: PerformanceMetric[] = [];
const SLOW_THRESHOLD_MS = 500;
const MAX_HISTORY_SIZE = 1000;

export const performanceMonitor = {
    /**
     * 비동기 작업의 실행 시간을 측정합니다.
     */
    async trackAsync<T>(operationName: string, fn: () => Promise<T>): Promise<T> {
        const startTime = Date.now();
        const startMemory = typeof process !== 'undefined' ? process.memoryUsage() : undefined;

        try {
            const result = await fn();
            return result;
        } finally {
            const endTime = Date.now();
            const durationMs = endTime - startTime;

            const metric: PerformanceMetric = {
                operationName,
                startTime,
                endTime,
                durationMs,
                memoryUsage: startMemory,
                timestamp: new Date().toISOString()
            };

            this.logMetric(metric);
        }
    },

    /**
     * 동기 작업의 실행 시간을 측정합니다.
     */
    trackSync<T>(operationName: string, fn: () => T): T {
        const startTime = Date.now();
        const startMemory = typeof process !== 'undefined' ? process.memoryUsage() : undefined;

        try {
            return fn();
        } finally {
            const endTime = Date.now();
            const durationMs = endTime - startTime;

            const metric: PerformanceMetric = {
                operationName,
                startTime,
                endTime,
                durationMs,
                memoryUsage: startMemory,
                timestamp: new Date().toISOString()
            };

            this.logMetric(metric);
        }
    },

    /**
     * 메트릭을 기록하고 임계값 초과 시 경고를 출력합니다.
     */
    logMetric(metric: PerformanceMetric) {
        // Ring Buffer 유지
        if (metricsHistory.length >= MAX_HISTORY_SIZE) {
            metricsHistory.shift();
        }
        metricsHistory.push(metric);

        // Slow Operation Warning
        if (metric.durationMs > SLOW_THRESHOLD_MS) {
            Logger.warn(`[Performance Warning] '${metric.operationName}' took ${metric.durationMs}ms (Threshold: ${SLOW_THRESHOLD_MS}ms)`);
        }
    },

    /**
     * 최근 메트릭 조회 (Admin Dashboard용)
     */
    getRecentMetrics(limit: number = 50): PerformanceMetric[] {
        return metricsHistory.slice(-limit).reverse();
    },

    /**
     * 평균 지연 시간 계산
     */
    getAverageLatency(operationName?: string): number {
        const targetMetrics = operationName
            ? metricsHistory.filter(m => m.operationName === operationName)
            : metricsHistory;

        if (targetMetrics.length === 0) return 0;

        const total = targetMetrics.reduce((sum, m) => sum + m.durationMs, 0);
        return Math.round(total / targetMetrics.length);
    }
};
