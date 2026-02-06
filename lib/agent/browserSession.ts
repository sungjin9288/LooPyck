/**
 * Browser Session Manager
 * AWS Fargate 환경에서 메모리 누수 방지를 위한 브라우저 세션 관리
 */

// Playwright/Puppeteer 타입 (실제 사용 시 import)
type Browser = {
    close: () => Promise<void>;
    contexts: () => unknown[];
    newContext: (options?: unknown) => Promise<BrowserContext>;
};

type BrowserContext = {
    close: () => Promise<void>;
    pages: () => Page[];
    newPage: () => Promise<Page>;
};

type Page = {
    close: () => Promise<void>;
    goto: (url: string, options?: unknown) => Promise<unknown>;
    screenshot: (options?: unknown) => Promise<Buffer>;
    content: () => Promise<string>;
    evaluate: <T>(fn: () => T) => Promise<T>;
};

// 세션 상태
interface SessionState {
    id: string;
    createdAt: Date;
    lastActivityAt: Date;
    pageCount: number;
    memoryUsageMB: number;
    isHealthy: boolean;
}

// 설정
const SESSION_CONFIG = {
    MAX_PAGES_PER_SESSION: 10,      // 세션당 최대 페이지 수
    MAX_SESSION_AGE_MS: 5 * 60_000, // 5분 후 세션 재생성
    MAX_MEMORY_MB: 512,             // 최대 메모리 사용량
    CLEANUP_INTERVAL_MS: 30_000,    // 30초마다 정리
} as const;

class BrowserSessionManager {
    private browser: Browser | null = null;
    private context: BrowserContext | null = null;
    private sessionState: SessionState | null = null;
    private cleanupTimer: NodeJS.Timeout | null = null;

    /**
     * 세션 초기화
     */
    async initialize(launchBrowser: () => Promise<Browser>): Promise<void> {
        if (this.browser) {
            console.log('[BrowserSession] Already initialized');
            return;
        }

        console.log('[BrowserSession] Initializing browser...');
        this.browser = await launchBrowser();
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            viewport: { width: 1280, height: 800 },
        });

        this.sessionState = {
            id: this.generateSessionId(),
            createdAt: new Date(),
            lastActivityAt: new Date(),
            pageCount: 0,
            memoryUsageMB: 0,
            isHealthy: true,
        };

        // 주기적 정리 시작
        this.startCleanupTimer();
        console.log(`[BrowserSession] Session ${this.sessionState.id} created`);
    }

    /**
     * 세션 ID 생성
     */
    private generateSessionId(): string {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 페이지 생성 (메모리 관리)
     */
    async createPage(): Promise<Page | null> {
        if (!this.context || !this.sessionState) {
            console.error('[BrowserSession] Not initialized');
            return null;
        }

        // 헬스 체크
        await this.healthCheck();

        if (!this.sessionState.isHealthy) {
            console.warn('[BrowserSession] Session unhealthy, recreating...');
            await this.recreateSession();
        }

        // 페이지 수 제한 체크
        if (this.sessionState.pageCount >= SESSION_CONFIG.MAX_PAGES_PER_SESSION) {
            console.warn('[BrowserSession] Max pages reached, cleaning up...');
            await this.cleanupPages();
        }

        const page = await this.context.newPage();
        this.sessionState.pageCount++;
        this.sessionState.lastActivityAt = new Date();

        console.log(`[BrowserSession] Page created (${this.sessionState.pageCount}/${SESSION_CONFIG.MAX_PAGES_PER_SESSION})`);
        return page;
    }

    /**
     * 페이지 안전 종료
     */
    async closePage(page: Page): Promise<void> {
        if (!page) return;

        try {
            await page.close();
            if (this.sessionState) {
                this.sessionState.pageCount = Math.max(0, this.sessionState.pageCount - 1);
            }
            console.log('[BrowserSession] Page closed');
        } catch (error) {
            console.error('[BrowserSession] Error closing page:', error);
        }
    }

    /**
     * 모든 페이지 정리
     */
    private async cleanupPages(): Promise<void> {
        if (!this.context) return;

        const pages = this.context.pages();
        console.log(`[BrowserSession] Cleaning up ${pages.length} pages...`);

        for (const page of pages) {
            try {
                await (page as Page).close();
            } catch {
                // 이미 닫힌 페이지 무시
            }
        }

        if (this.sessionState) {
            this.sessionState.pageCount = 0;
        }
    }

    /**
     * 헬스 체크
     */
    private async healthCheck(): Promise<void> {
        if (!this.sessionState) return;

        const now = new Date();
        const age = now.getTime() - this.sessionState.createdAt.getTime();

        // 세션 수명 체크
        if (age > SESSION_CONFIG.MAX_SESSION_AGE_MS) {
            console.warn('[BrowserSession] Session expired');
            this.sessionState.isHealthy = false;
            return;
        }

        // 메모리 사용량 체크 (Node.js 환경)
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const memUsage = process.memoryUsage();
            this.sessionState.memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);

            if (this.sessionState.memoryUsageMB > SESSION_CONFIG.MAX_MEMORY_MB) {
                console.warn(`[BrowserSession] Memory limit exceeded: ${this.sessionState.memoryUsageMB}MB`);
                this.sessionState.isHealthy = false;
                return;
            }
        }

        this.sessionState.isHealthy = true;
    }

    /**
     * 세션 재생성
     */
    private async recreateSession(): Promise<void> {
        console.log('[BrowserSession] Recreating session...');

        // 기존 리소스 정리
        await this.cleanup();

        // 새 세션 생성은 외부에서 initialize 재호출 필요
        // 여기서는 상태만 리셋
        this.sessionState = null;
    }

    /**
     * 정리 타이머 시작
     */
    private startCleanupTimer(): void {
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }

        this.cleanupTimer = setInterval(async () => {
            await this.healthCheck();

            if (this.sessionState && !this.sessionState.isHealthy) {
                await this.recreateSession();
            }
        }, SESSION_CONFIG.CLEANUP_INTERVAL_MS);
    }

    /**
     * 전체 리소스 정리 (AWS Fargate 종료 시 필수!)
     */
    async cleanup(): Promise<void> {
        console.log('[BrowserSession] Starting cleanup...');

        // 타이머 정지
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }

        // 페이지 정리
        if (this.context) {
            await this.cleanupPages();
            try {
                await this.context.close();
            } catch {
                // 무시
            }
            this.context = null;
        }

        // 브라우저 종료
        if (this.browser) {
            try {
                await this.browser.close();
                console.log('[BrowserSession] Browser closed successfully');
            } catch (error) {
                console.error('[BrowserSession] Error closing browser:', error);
            }
            this.browser = null;
        }

        this.sessionState = null;
        console.log('[BrowserSession] Cleanup complete');
    }

    /**
     * 세션 상태 조회
     */
    getStatus(): SessionState | null {
        return this.sessionState ? { ...this.sessionState } : null;
    }

    /**
     * 세션 활성 여부
     */
    isActive(): boolean {
        return this.browser !== null && this.sessionState?.isHealthy === true;
    }
}

// 싱글톤 인스턴스
export const browserSession = new BrowserSessionManager();

// Graceful shutdown 핸들러 (AWS Fargate용)
if (typeof process !== 'undefined') {
    const gracefulShutdown = async (signal: string) => {
        console.log(`[BrowserSession] Received ${signal}, cleaning up...`);
        await browserSession.cleanup();
        process.exit(0);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}
