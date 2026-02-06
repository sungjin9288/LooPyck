/**
 * Production Cleanup - 상용 환경 최적화
 * 디버그 로그 제거, 테스트 코드 정리
 */

// 클린업 대상 패턴
const DEBUG_PATTERNS = [
    /console\.log\s*\(/g,
    /console\.debug\s*\(/g,
    /console\.info\s*\(/g,
    // console.warn과 console.error는 유지
];

const TEST_PATTERNS = [
    /\/\/\s*TODO:/gi,
    /\/\/\s*FIXME:/gi,
    /\/\/\s*HACK:/gi,
    /\/\/\s*DEBUG:/gi,
];

// 클린업 결과
export interface CleanupResult {
    file: string;
    removedLines: number;
    patterns: string[];
    status: 'cleaned' | 'skipped' | 'error';
}

export interface CleanupReport {
    totalFiles: number;
    cleanedFiles: number;
    totalRemovedLines: number;
    timestamp: Date;
    results: CleanupResult[];
}

/**
 * 코드에서 디버그 패턴 검출
 */
export function detectDebugPatterns(code: string): {
    hasDebug: boolean;
    matches: { pattern: string; count: number }[];
} {
    const matches: { pattern: string; count: number }[] = [];

    for (const pattern of DEBUG_PATTERNS) {
        const found = code.match(pattern);
        if (found && found.length > 0) {
            matches.push({
                pattern: pattern.source,
                count: found.length,
            });
        }
    }

    for (const pattern of TEST_PATTERNS) {
        const found = code.match(pattern);
        if (found && found.length > 0) {
            matches.push({
                pattern: pattern.source,
                count: found.length,
            });
        }
    }

    return {
        hasDebug: matches.length > 0,
        matches,
    };
}

/**
 * 디버그 로그 제거 (문자열 변환)
 */
export function removeDebugLogs(code: string): {
    cleanedCode: string;
    removedCount: number;
} {
    let cleanedCode = code;
    let removedCount = 0;

    for (const pattern of DEBUG_PATTERNS) {
        const matches = cleanedCode.match(pattern);
        if (matches) {
            removedCount += matches.length;
            // console.log(...) 전체 라인 제거
            cleanedCode = cleanedCode.replace(
                /^\s*console\.(log|debug|info)\s*\([^)]*\);\s*$/gm,
                ''
            );
        }
    }

    // 빈 줄 정리
    cleanedCode = cleanedCode.replace(/\n\n\n+/g, '\n\n');

    return {
        cleanedCode,
        removedCount,
    };
}

/**
 * 환경 변수 검증
 */
export function validateEnvVars(): {
    valid: boolean;
    missing: string[];
    warnings: string[];
} {
    const required = [
        'GEMINI_API_KEY',
        'NEXT_PUBLIC_FIREBASE_CONFIG',
    ];

    const optional = [
        'VERCEL_TOKEN',
        'VERCEL_ORG_ID',
        'VERCEL_PROJECT_ID',
    ];

    const missing: string[] = [];
    const warnings: string[] = [];

    for (const envVar of required) {
        if (!process.env[envVar]) {
            missing.push(envVar);
        }
    }

    for (const envVar of optional) {
        if (!process.env[envVar]) {
            warnings.push(`Optional: ${envVar} not set`);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
        warnings,
    };
}

/**
 * 프로덕션 준비 상태 체크
 */
export function checkProductionReadiness(): {
    ready: boolean;
    checks: { name: string; passed: boolean; message: string }[];
} {
    const checks: { name: string; passed: boolean; message: string }[] = [];

    // 1. 환경 변수 체크
    const envCheck = validateEnvVars();
    checks.push({
        name: 'Environment Variables',
        passed: envCheck.valid,
        message: envCheck.valid
            ? 'All required env vars present'
            : `Missing: ${envCheck.missing.join(', ')}`,
    });

    // 2. 노드 버전 체크
    const nodeVersion = process.version;
    const isNodeValid = parseInt(nodeVersion.slice(1)) >= 20;
    checks.push({
        name: 'Node.js Version',
        passed: isNodeValid,
        message: `Current: ${nodeVersion} (Required: 20+)`,
    });

    // 3. 프로덕션 모드 체크
    const isProduction = process.env.NODE_ENV === 'production';
    checks.push({
        name: 'Production Mode',
        passed: isProduction,
        message: isProduction ? 'Running in production' : 'Not in production mode',
    });

    return {
        ready: checks.every(c => c.passed),
        checks,
    };
}

/**
 * 클린업 리포트 생성
 */
export function generateCleanupReport(results: CleanupResult[]): CleanupReport {
    return {
        totalFiles: results.length,
        cleanedFiles: results.filter(r => r.status === 'cleaned').length,
        totalRemovedLines: results.reduce((sum, r) => sum + r.removedLines, 0),
        timestamp: new Date(),
        results,
    };
}

/**
 * 클린업 리포트 포맷팅
 */
export function formatCleanupReport(report: CleanupReport): string {
    const status = report.cleanedFiles > 0 ? '🧹' : '✅';

    let output = `
## ${status} Production Cleanup Report

**Date**: ${report.timestamp.toISOString()}
**Files Scanned**: ${report.totalFiles}
**Files Cleaned**: ${report.cleanedFiles}
**Lines Removed**: ${report.totalRemovedLines}

### Summary
`;

    if (report.cleanedFiles === 0) {
        output += '\n✅ No debug code found. Codebase is production-ready.';
    } else {
        output += '\n| File | Removed | Status |\n|------|---------|--------|\n';
        for (const result of report.results.filter(r => r.status === 'cleaned')) {
            output += `| ${result.file} | ${result.removedLines} | ${result.status} |\n`;
        }
    }

    return output.trim();
}

// Export
export const cleanup = {
    detectDebugPatterns,
    removeDebugLogs,
    validateEnvVars,
    checkProductionReadiness,
    generateCleanupReport,
    formatCleanupReport,
};
