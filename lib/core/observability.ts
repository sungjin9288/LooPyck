/**
 * Observability & Logging Utility
 * 중앙 집중식 로깅 시스템. PII(개인정보) 마스킹 기능 포함.
 * 추후 Sentry, Datadog 등으로 확장 가능하도록 인터페이스 설계.
 */

type LogLevel = 'info' | 'warn' | 'error';

interface LogContext {
    userId?: string;
    path?: string;
    [key: string]: any;
}

const isProduction = process.env.NODE_ENV === 'production';

export const Logger = {
    // PII 마스킹 (이메일, 전화번호 등)
    maskPII: (data: any): any => {
        if (typeof data === 'string') {
            return data
                .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
                .replace(/\d{3}-\d{3,4}-\d{4}/g, '[PHONE]');
        }
        if (typeof data === 'object' && data !== null) {
            const masked: any = Array.isArray(data) ? [] : {};
            for (const key in data) {
                if (key.toLowerCase().includes('password') || key.toLowerCase().includes('token')) {
                    masked[key] = '[REDACTED]';
                } else {
                    masked[key] = Logger.maskPII(data[key]);
                }
            }
            return masked;
        }
        return data;
    },

    log: (level: LogLevel, message: string, context?: LogContext) => {
        const timestamp = new Date().toISOString();
        const safeContext = context ? Logger.maskPII(context) : {};

        const logEntry = {
            timestamp,
            level,
            message,
            ...safeContext
        };

        if (isProduction) {
            // Production: Send to aggregation service (e.g., Sentry)
            // console.log(JSON.stringify(logEntry)); // Structured logging for now
        } else {
            // Development: Pretty print
            const color = level === 'error' ? '\x1b[31m' : level === 'warn' ? '\x1b[33m' : '\x1b[36m';
            console.log(`${color}[${level.toUpperCase()}] ${message}`, safeContext, '\x1b[0m');
        }
    },

    info: (message: string, context?: LogContext) => Logger.log('info', message, context),
    warn: (message: string, context?: LogContext) => Logger.log('warn', message, context),
    error: (message: string, error?: any, context?: LogContext) => {
        Logger.log('error', message, { ...context, error: error?.message || error });
    }
};
