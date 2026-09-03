/**
 * Observability & Logging Utility
 * 중앙 집중식 로깅 시스템. PII(개인정보) 마스킹 기능 포함.
 * 추후 Sentry, Datadog 등으로 확장 가능하도록 인터페이스 설계.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
    userId?: string;
    path?: string;
    [key: string]: unknown;
}

/** unknown 오류를 로그 문자열로 안전 축약 — 여러 catch 블록에서 공유 */
export function toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error ?? '');
}

export const Logger = {
    // PII 마스킹 (이메일, 전화번호 등)
    maskPII: (data: unknown): unknown => {
        if (typeof data === 'string') {
            return data
                .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
                .replace(/\d{3}-\d{3,4}-\d{4}/g, '[PHONE]');
        }
        if (Array.isArray(data)) {
            return data.map((entry) => Logger.maskPII(entry));
        }
        if (typeof data === 'object' && data !== null) {
            const masked: Record<string, unknown> = {};
            for (const key in data as Record<string, unknown>) {
                if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
                    masked[key] = '[REDACTED]';
                } else {
                    masked[key] = Logger.maskPII((data as Record<string, unknown>)[key]);
                }
            }
            return masked;
        }
        return data;
    },

    log: (level: LogLevel, message: string, context?: LogContext) => {
        const safeContext = context ? Logger.maskPII(context) : {};
        // NODE_ENV는 호출 시점에 읽는다 — 모듈 로드 시점 고정은 테스트 불가.
        const isProduction = process.env.NODE_ENV === 'production';

        if (isProduction) {
            // Netlify/Vercel 함수 로그가 stdout/stderr를 수집한다 — 구조화 단일
            // 라인으로 emit. (이전엔 이 분기가 비어 있어 프로덕션 로그가 전부
            // 소실됐음 — Sentry 도입 전까지는 이것이 실체다.)
            const line = JSON.stringify({ level, message, context: safeContext });
            if (level === 'error') {
                console.error(line);
            } else if (level === 'warn') {
                console.warn(line);
            } else {
                console.log(line);
            }
        } else {
            // Development: Pretty print
            const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
            console.log(`${color}[${level.toUpperCase()}] ${message}`, safeContext, '\x1b[0m');
        }
    },

    info: (message: string, context?: LogContext) => Logger.log('info', message, context),
    warn: (message: string, context?: LogContext) => Logger.log('warn', message, context),
    error: (message: string, error?: unknown, context?: LogContext) => {
        const errorMsg = error instanceof Error ? error.message : String(error ?? '');
        Logger.log('error', message, { ...context, error: errorMsg });
    },
};
