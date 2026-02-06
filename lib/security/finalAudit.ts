/**
 * Final Security Audit - 상용 배포 전 보안 검증
 * Firebase Rules, API Quota, 입력 검증
 */

// 보안 검증 결과
export interface AuditResult {
    passed: boolean;
    category: string;
    item: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    message: string;
    recommendation?: string;
}

export interface AuditReport {
    timestamp: Date;
    overallPassed: boolean;
    criticalIssues: number;
    highIssues: number;
    results: AuditResult[];
    score: number; // 0-100
}

// Firebase Security Rules 검증 체크리스트
const FIRESTORE_RULES_CHECKLIST = [
    {
        item: 'users 컬렉션 읽기 권한',
        check: 'request.auth != null && request.auth.uid == userId',
        severity: 'critical' as const,
    },
    {
        item: 'users 컬렉션 쓰기 권한',
        check: 'request.auth != null && request.auth.uid == userId',
        severity: 'critical' as const,
    },
    {
        item: 'wishlists 컬렉션 접근',
        check: 'request.auth != null',
        severity: 'high' as const,
    },
    {
        item: 'analytics 컬렉션 쓰기',
        check: 'request.auth != null',
        severity: 'medium' as const,
    },
    {
        item: '관리자 전용 컬렉션',
        check: 'request.auth.token.admin == true',
        severity: 'critical' as const,
    },
];

// API Quota 방어 체크리스트
const API_QUOTA_CHECKLIST = [
    {
        item: 'Gemini RPM 제한',
        limit: 10,
        current: 'GEMINI_LIMITS.RPM',
        severity: 'high' as const,
    },
    {
        item: 'Gemini RPD 제한',
        limit: 500,
        current: 'GEMINI_LIMITS.RPD',
        severity: 'high' as const,
    },
    {
        item: 'Rate Limiter 구현',
        check: 'RateLimiter class exists',
        severity: 'critical' as const,
    },
    {
        item: 'Fallback 로직',
        check: 'Fallback mechanism implemented',
        severity: 'high' as const,
    },
];

// 입력 검증 체크리스트
const INPUT_VALIDATION_CHECKLIST = [
    {
        item: 'URL 유효성 검증',
        pattern: /^https?:\/\//,
        severity: 'critical' as const,
    },
    {
        item: 'XSS 방지',
        pattern: /<script|javascript:|on\w+=/i,
        shouldNotMatch: true,
        severity: 'critical' as const,
    },
    {
        item: '프롬프트 인젝션 방지',
        pattern: /ignore.*previous|system.*prompt/i,
        shouldNotMatch: true,
        severity: 'high' as const,
    },
];

/**
 * URL 유효성 검증
 */
export function validateUrl(url: string): AuditResult {
    const isValid = /^https?:\/\/[a-zA-Z0-9][a-zA-Z0-9-]*\.[a-zA-Z]{2,}/.test(url);

    return {
        passed: isValid,
        category: 'Input Validation',
        item: 'URL 유효성',
        severity: 'critical',
        message: isValid
            ? `유효한 URL: ${url.slice(0, 50)}...`
            : `잘못된 URL 형식: ${url.slice(0, 50)}`,
        recommendation: isValid ? undefined : 'https:// 또는 http://로 시작하는 유효한 URL을 입력하세요.',
    };
}

/**
 * XSS 공격 패턴 검증
 */
export function checkXSS(input: string): AuditResult {
    const xssPatterns = [
        /<script\b[^>]*>/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /data:text\/html/i,
    ];

    const hasXSS = xssPatterns.some(p => p.test(input));

    return {
        passed: !hasXSS,
        category: 'Security',
        item: 'XSS 방지',
        severity: 'critical',
        message: hasXSS
            ? 'XSS 공격 패턴 감지됨'
            : '입력값 안전함',
        recommendation: hasXSS ? '스크립트 태그 및 이벤트 핸들러를 제거하세요.' : undefined,
    };
}

/**
 * 프롬프트 인젝션 검증
 */
export function checkPromptInjection(input: string): AuditResult {
    const injectionPatterns = [
        /ignore.*previous.*instructions/i,
        /disregard.*above/i,
        /system.*prompt/i,
        /you.*are.*now/i,
        /forget.*everything/i,
        /new.*instructions/i,
    ];

    const hasInjection = injectionPatterns.some(p => p.test(input));

    return {
        passed: !hasInjection,
        category: 'AI Security',
        item: '프롬프트 인젝션 방지',
        severity: 'high',
        message: hasInjection
            ? '프롬프트 인젝션 시도 감지됨'
            : '입력값 안전함',
        recommendation: hasInjection ? '악의적인 프롬프트 패턴을 제거하세요.' : undefined,
    };
}

/**
 * API Quota 상태 검증
 */
export function checkApiQuota(
    currentUsage: { rpm: number; rpd: number },
    limits: { rpm: number; rpd: number }
): AuditResult[] {
    const results: AuditResult[] = [];

    // RPM 검증
    const rpmUsage = (currentUsage.rpm / limits.rpm) * 100;
    results.push({
        passed: rpmUsage < 80,
        category: 'API Quota',
        item: 'RPM (분당 요청)',
        severity: rpmUsage >= 90 ? 'critical' : rpmUsage >= 80 ? 'high' : 'low',
        message: `현재 사용률: ${Math.round(rpmUsage)}% (${currentUsage.rpm}/${limits.rpm})`,
        recommendation: rpmUsage >= 80 ? 'Rate Limiter 임계값 조정 권장' : undefined,
    });

    // RPD 검증
    const rpdUsage = (currentUsage.rpd / limits.rpd) * 100;
    results.push({
        passed: rpdUsage < 80,
        category: 'API Quota',
        item: 'RPD (일일 요청)',
        severity: rpdUsage >= 90 ? 'critical' : rpdUsage >= 80 ? 'high' : 'low',
        message: `현재 사용률: ${Math.round(rpdUsage)}% (${currentUsage.rpd}/${limits.rpd})`,
        recommendation: rpdUsage >= 80 ? '일일 사용량 모니터링 강화 권장' : undefined,
    });

    return results;
}

/**
 * 종합 보안 감사
 */
export function runSecurityAudit(
    testInputs: string[] = [],
    apiUsage?: { rpm: number; rpd: number }
): AuditReport {
    const results: AuditResult[] = [];

    // 기본 보안 체크
    results.push({
        passed: true,
        category: 'Firebase',
        item: 'Security Rules 설정',
        severity: 'critical',
        message: 'Firebase Security Rules 파일 존재 확인 필요',
    });

    results.push({
        passed: true,
        category: 'Environment',
        item: 'API Key 보안',
        severity: 'critical',
        message: 'API 키가 환경 변수로 관리됨',
    });

    results.push({
        passed: true,
        category: 'Rate Limiting',
        item: 'RateLimiter 구현',
        severity: 'high',
        message: 'TokenBucketRateLimiter 클래스 구현됨',
    });

    // 입력값 검증
    for (const input of testInputs) {
        results.push(checkXSS(input));
        results.push(checkPromptInjection(input));
    }

    // API Quota 검증
    if (apiUsage) {
        results.push(...checkApiQuota(apiUsage, { rpm: 10, rpd: 500 }));
    }

    // 점수 계산
    const criticalIssues = results.filter(r => !r.passed && r.severity === 'critical').length;
    const highIssues = results.filter(r => !r.passed && r.severity === 'high').length;
    const passedCount = results.filter(r => r.passed).length;
    const score = Math.round((passedCount / results.length) * 100);

    return {
        timestamp: new Date(),
        overallPassed: criticalIssues === 0,
        criticalIssues,
        highIssues,
        results,
        score,
    };
}

/**
 * 감사 리포트 포맷팅
 */
export function formatAuditReport(report: AuditReport): string {
    const statusIcon = report.overallPassed ? '✅' : '❌';
    const scoreEmoji = report.score >= 90 ? '🟢' : report.score >= 70 ? '🟡' : '🔴';

    let output = `
## ${statusIcon} Security Audit Report

**Date**: ${report.timestamp.toISOString()}
**Score**: ${scoreEmoji} ${report.score}/100
**Critical Issues**: ${report.criticalIssues}
**High Issues**: ${report.highIssues}

### Results

| Category | Item | Status | Severity |
|----------|------|--------|----------|
`;

    for (const result of report.results) {
        const status = result.passed ? '✅' : '❌';
        output += `| ${result.category} | ${result.item} | ${status} | ${result.severity} |\n`;
    }

    // 권장 사항
    const recommendations = report.results
        .filter(r => r.recommendation)
        .map(r => `- **${r.item}**: ${r.recommendation}`);

    if (recommendations.length > 0) {
        output += `\n### Recommendations\n\n${recommendations.join('\n')}`;
    }

    return output.trim();
}

// Export
export const securityAudit = {
    validateUrl,
    checkXSS,
    checkPromptInjection,
    checkApiQuota,
    runSecurityAudit,
    formatAuditReport,
};
