/**
 * Demo Guard - 공개 데모 환경 Abuse 방지
 * 엄격한 Rate Limit 및 악용 탐지
 */

// Rate Limit 설정
const DEMO_LIMITS = {
    RPM_PER_IP: 5,           // IP당 분당 5회
    RPH_PER_IP: 50,          // IP당 시간당 50회
    RPD_PER_IP: 100,         // IP당 일일 100회
    MAX_CONCURRENT: 2,       // 동시 요청 2개
    BLOCK_DURATION_MS: 60 * 60 * 1000, // 1시간 차단
} as const;

// 요청 기록
interface RequestRecord {
    timestamps: number[];
    blocked: boolean;
    blockedUntil: number | null;
    suspiciousScore: number;
}

// IP별 요청 기록 (메모리 기반, 프로덕션에서는 Redis 사용)
const requestStore = new Map<string, RequestRecord>();

// Abuse 패턴
const ABUSE_PATTERNS = {
    rapidFire: { threshold: 10, window: 10000 },      // 10초에 10회 이상
    scripted: { pattern: /curl|wget|python|bot/i },   // 스크립트 User-Agent
    massUrls: { threshold: 20, window: 60000 },       // 1분에 20개 다른 URL
};

/**
 * 요청 기록 초기화
 */
function getOrCreateRecord(ip: string): RequestRecord {
    if (!requestStore.has(ip)) {
        requestStore.set(ip, {
            timestamps: [],
            blocked: false,
            blockedUntil: null,
            suspiciousScore: 0,
        });
    }
    return requestStore.get(ip)!;
}

/**
 * 오래된 타임스탬프 정리
 */
function cleanOldTimestamps(record: RequestRecord, windowMs: number): void {
    const now = Date.now();
    record.timestamps = record.timestamps.filter(ts => now - ts < windowMs);
}

/**
 * Rate Limit 검사
 */
export function checkRateLimit(ip: string): {
    allowed: boolean;
    remaining: number;
    resetIn: number;
    reason?: string;
} {
    const record = getOrCreateRecord(ip);
    const now = Date.now();

    // 차단 상태 확인
    if (record.blocked && record.blockedUntil) {
        if (now < record.blockedUntil) {
            return {
                allowed: false,
                remaining: 0,
                resetIn: Math.ceil((record.blockedUntil - now) / 1000),
                reason: 'IP temporarily blocked due to abuse',
            };
        } else {
            // 차단 해제
            record.blocked = false;
            record.blockedUntil = null;
            record.suspiciousScore = 0;
        }
    }

    // 분당 제한 검사
    cleanOldTimestamps(record, 60 * 1000);
    if (record.timestamps.length >= DEMO_LIMITS.RPM_PER_IP) {
        return {
            allowed: false,
            remaining: 0,
            resetIn: 60,
            reason: 'Rate limit exceeded (per minute)',
        };
    }

    // 허용
    record.timestamps.push(now);
    return {
        allowed: true,
        remaining: DEMO_LIMITS.RPM_PER_IP - record.timestamps.length,
        resetIn: 60,
    };
}

/**
 * Abuse 탐지
 */
export function detectAbuse(
    ip: string,
    userAgent: string,
    requestPath: string
): {
    isAbusive: boolean;
    score: number;
    action: 'allow' | 'warn' | 'block';
} {
    const record = getOrCreateRecord(ip);
    let score = record.suspiciousScore;

    // 1. Scripted User-Agent 검사
    if (ABUSE_PATTERNS.scripted.pattern.test(userAgent)) {
        score += 30;
    }

    // 2. Rapid Fire 검사
    const recentRequests = record.timestamps.filter(
        ts => Date.now() - ts < ABUSE_PATTERNS.rapidFire.window
    );
    if (recentRequests.length >= ABUSE_PATTERNS.rapidFire.threshold) {
        score += 50;
    }

    // 3. 비정상적인 경로 패턴
    if (/\.\.|%00|<script/i.test(requestPath)) {
        score += 100;
    }

    // 점수 저장
    record.suspiciousScore = Math.min(score, 200);

    // 액션 결정
    let action: 'allow' | 'warn' | 'block' = 'allow';
    if (score >= 100) {
        action = 'block';
        record.blocked = true;
        record.blockedUntil = Date.now() + DEMO_LIMITS.BLOCK_DURATION_MS;
    } else if (score >= 50) {
        action = 'warn';
    }

    return {
        isAbusive: score >= 50,
        score,
        action,
    };
}

/**
 * 데모 요청 가드 (미들웨어용)
 */
export function demoRequestGuard(
    ip: string,
    userAgent: string,
    path: string
): {
    allowed: boolean;
    statusCode: number;
    message: string;
    headers: Record<string, string>;
} {
    // Abuse 탐지
    const abuse = detectAbuse(ip, userAgent, path);
    if (abuse.action === 'block') {
        return {
            allowed: false,
            statusCode: 403,
            message: 'Access denied due to suspicious activity',
            headers: {
                'X-RateLimit-Limit': String(DEMO_LIMITS.RPM_PER_IP),
                'X-RateLimit-Remaining': '0',
                'Retry-After': String(DEMO_LIMITS.BLOCK_DURATION_MS / 1000),
            },
        };
    }

    // Rate Limit 검사
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
        return {
            allowed: false,
            statusCode: 429,
            message: rateLimit.reason || 'Too many requests',
            headers: {
                'X-RateLimit-Limit': String(DEMO_LIMITS.RPM_PER_IP),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(rateLimit.resetIn),
                'Retry-After': String(rateLimit.resetIn),
            },
        };
    }

    // 허용
    return {
        allowed: true,
        statusCode: 200,
        message: 'OK',
        headers: {
            'X-RateLimit-Limit': String(DEMO_LIMITS.RPM_PER_IP),
            'X-RateLimit-Remaining': String(rateLimit.remaining),
            'X-RateLimit-Reset': String(rateLimit.resetIn),
        },
    };
}

/**
 * 통계 리셋 (테스트용)
 */
export function resetDemoStats(): void {
    requestStore.clear();
}

// Export
export const demoGuard = {
    checkRateLimit,
    detectAbuse,
    guard: demoRequestGuard,
    reset: resetDemoStats,
    LIMITS: DEMO_LIMITS,
};
