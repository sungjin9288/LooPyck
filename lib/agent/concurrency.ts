/**
 * Concurrency Manager for AWS Fargate
 * 세션 수와 대기열 관리로 리소스 초과 방지
 */

// 동시성 설정
const CONCURRENCY_CONFIG = {
    MAX_CONCURRENT_SESSIONS: 5,    // 최대 동시 세션
    MAX_QUEUE_SIZE: 50,            // 최대 대기열 크기
    SESSION_TIMEOUT_MS: 60_000,    // 세션 타임아웃 (1분)
    QUEUE_TIMEOUT_MS: 30_000,      // 대기열 타임아웃 (30초)
} as const;

// 작업 상태
type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout';

// 작업 정의
interface QueuedTask<T> {
    id: string;
    status: TaskStatus;
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

// 세션 정보
interface SessionInfo {
    id: string;
    startedAt: Date;
    taskId: string;
    isActive: boolean;
}

// 큐 통계
export interface QueueStats {
    activeSessions: number;
    maxSessions: number;
    queueLength: number;
    maxQueueSize: number;
    completedTasks: number;
    failedTasks: number;
    avgWaitTimeMs: number;
    avgExecutionTimeMs: number;
}

class ConcurrencyManager {
    private queue: QueuedTask<unknown>[] = [];
    private activeSessions: Map<string, SessionInfo> = new Map();
    private completedCount = 0;
    private failedCount = 0;
    private totalWaitTimeMs = 0;
    private totalExecutionTimeMs = 0;
    private processedCount = 0;

    /**
     * 작업을 큐에 추가하고 실행 대기
     */
    async enqueue<T>(execute: () => Promise<T>): Promise<T> {
        // 큐 크기 체크
        if (this.queue.length >= CONCURRENCY_CONFIG.MAX_QUEUE_SIZE) {
            throw new Error(`Queue full: ${this.queue.length}/${CONCURRENCY_CONFIG.MAX_QUEUE_SIZE}`);
        }

        const taskId = this.generateTaskId();
        const createdAt = new Date();

        return new Promise<T>((resolve, reject) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const task: QueuedTask<any> = {
                id: taskId,
                status: 'pending',
                createdAt,
                execute,
                resolve,
                reject,
            };

            this.queue.push(task);
            console.log(`[Concurrency] Task ${taskId} queued. Queue size: ${this.queue.length}`);

            // 큐 타임아웃 설정
            setTimeout(() => {
                if (task.status === 'pending') {
                    task.status = 'timeout';
                    this.removeFromQueue(taskId);
                    reject(new Error(`Queue timeout after ${CONCURRENCY_CONFIG.QUEUE_TIMEOUT_MS}ms`));
                }
            }, CONCURRENCY_CONFIG.QUEUE_TIMEOUT_MS);

            // 처리 시도
            this.processQueue();
        });
    }

    /**
     * 큐 처리
     */
    private async processQueue(): Promise<void> {
        // 가용 슬롯 체크
        if (this.activeSessions.size >= CONCURRENCY_CONFIG.MAX_CONCURRENT_SESSIONS) {
            console.log(`[Concurrency] Max sessions reached (${this.activeSessions.size})`);
            return;
        }

        // 대기 중인 작업 가져오기
        const task = this.queue.find(t => t.status === 'pending');
        if (!task) return;

        // 세션 시작
        const sessionId = this.generateSessionId();
        const now = new Date();

        task.status = 'running';
        task.startedAt = now;

        this.activeSessions.set(sessionId, {
            id: sessionId,
            startedAt: now,
            taskId: task.id,
            isActive: true,
        });

        // 대기 시간 기록
        const waitTimeMs = now.getTime() - task.createdAt.getTime();
        this.totalWaitTimeMs += waitTimeMs;

        console.log(`[Concurrency] Task ${task.id} started. Sessions: ${this.activeSessions.size}/${CONCURRENCY_CONFIG.MAX_CONCURRENT_SESSIONS}`);

        // 세션 타임아웃 설정
        const timeoutId = setTimeout(() => {
            if (task.status === 'running') {
                this.handleTaskTimeout(task, sessionId);
            }
        }, CONCURRENCY_CONFIG.SESSION_TIMEOUT_MS);

        try {
            // 작업 실행
            const result = await task.execute();

            clearTimeout(timeoutId);
            task.status = 'completed';
            task.completedAt = new Date();

            // 실행 시간 기록
            const executionTimeMs = task.completedAt.getTime() - task.startedAt!.getTime();
            this.totalExecutionTimeMs += executionTimeMs;
            this.completedCount++;
            this.processedCount++;

            task.resolve(result);

        } catch (error) {
            clearTimeout(timeoutId);
            task.status = 'failed';
            task.completedAt = new Date();
            this.failedCount++;
            this.processedCount++;

            task.reject(error instanceof Error ? error : new Error(String(error)));

        } finally {
            // 세션 정리
            this.activeSessions.delete(sessionId);
            this.removeFromQueue(task.id);

            // 다음 작업 처리
            this.processQueue();
        }
    }

    /**
     * 작업 타임아웃 처리
     */
    private handleTaskTimeout(task: QueuedTask<unknown>, sessionId: string): void {
        console.warn(`[Concurrency] Task ${task.id} timed out`);

        task.status = 'timeout';
        task.completedAt = new Date();
        this.failedCount++;
        this.processedCount++;

        this.activeSessions.delete(sessionId);
        this.removeFromQueue(task.id);

        task.reject(new Error(`Session timeout after ${CONCURRENCY_CONFIG.SESSION_TIMEOUT_MS}ms`));

        // 다음 작업 처리
        this.processQueue();
    }

    /**
     * 큐에서 작업 제거
     */
    private removeFromQueue(taskId: string): void {
        const index = this.queue.findIndex(t => t.id === taskId);
        if (index !== -1) {
            this.queue.splice(index, 1);
        }
    }

    /**
     * 작업 ID 생성
     */
    private generateTaskId(): string {
        return `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * 세션 ID 생성
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }

    /**
     * 통계 조회
     */
    getStats(): QueueStats {
        return {
            activeSessions: this.activeSessions.size,
            maxSessions: CONCURRENCY_CONFIG.MAX_CONCURRENT_SESSIONS,
            queueLength: this.queue.filter(t => t.status === 'pending').length,
            maxQueueSize: CONCURRENCY_CONFIG.MAX_QUEUE_SIZE,
            completedTasks: this.completedCount,
            failedTasks: this.failedCount,
            avgWaitTimeMs: this.processedCount > 0
                ? Math.round(this.totalWaitTimeMs / this.processedCount)
                : 0,
            avgExecutionTimeMs: this.processedCount > 0
                ? Math.round(this.totalExecutionTimeMs / this.processedCount)
                : 0,
        };
    }

    /**
     * 가용 슬롯 여부
     */
    hasAvailableSlot(): boolean {
        return this.activeSessions.size < CONCURRENCY_CONFIG.MAX_CONCURRENT_SESSIONS;
    }

    /**
     * 큐 비어있는지 확인
     */
    isQueueEmpty(): boolean {
        return this.queue.filter(t => t.status === 'pending').length === 0;
    }

    /**
     * 통계 출력
     */
    printStats(): void {
        const stats = this.getStats();
        console.log(`
╔════════════════════════════════════════╗
║       Concurrency Manager Stats        ║
╠════════════════════════════════════════╣
║ Active Sessions: ${String(stats.activeSessions).padEnd(22)}║
║ Max Sessions:    ${String(stats.maxSessions).padEnd(22)}║
║ Queue Length:    ${String(stats.queueLength).padEnd(22)}║
║ Completed:       ${String(stats.completedTasks).padEnd(22)}║
║ Failed:          ${String(stats.failedTasks).padEnd(22)}║
║ Avg Wait:        ${(stats.avgWaitTimeMs + 'ms').padEnd(22)}║
║ Avg Execution:   ${(stats.avgExecutionTimeMs + 'ms').padEnd(22)}║
╚════════════════════════════════════════╝
    `);
    }

    /**
     * 강제 정리 (종료 시)
     */
    async shutdown(): Promise<void> {
        console.log('[Concurrency] Shutting down...');

        // 대기 중인 작업 모두 거부
        for (const task of this.queue) {
            if (task.status === 'pending') {
                task.status = 'failed';
                task.reject(new Error('Shutdown in progress'));
            }
        }

        this.queue = [];
        this.activeSessions.clear();

        console.log('[Concurrency] Shutdown complete');
    }
}

// 싱글톤 인스턴스
export const concurrencyManager = new ConcurrencyManager();
