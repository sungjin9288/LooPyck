/**
 * Self-Optimizer - 자율 프롬프트 튜닝
 * 낮은 confidence 시 프롬프트를 미세 조정하여 재시도
 */

import { VISION_PROMPT_TEMPLATE } from '../ai/config';

// 실패 유형
export type FailureType =
    | 'price_missing'
    | 'material_unknown'
    | 'low_confidence'
    | 'parse_error'
    | 'timeout'
    | 'unknown';

// 최적화 결과
export interface OptimizationResult {
    originalPrompt: string;
    optimizedPrompt: string;
    adjustments: string[];
    failureType: FailureType;
    safeGuardPassed: boolean;
}

// 재시도 결과
export interface RetryResult<T> {
    success: boolean;
    data: T | null;
    attempts: number;
    optimizations: string[];
    finalConfidence: number;
}

// 프롬프트 보정 전략
const ADJUSTMENT_STRATEGIES: Record<FailureType, string[]> = {
    price_missing: [
        '\n\n## CRITICAL: Price Extraction Priority\nPay EXTRA attention to price elements. Look for:\n- Numbers with ₩ or 원 suffix\n- Elements with class containing "price", "cost", "amount"\n- Strike-through prices for discounts\n- Sale/regular price pairs',
    ],
    material_unknown: [
        '\n\n## CRITICAL: Material Detection\nScroll down or look for:\n- "소재", "원단", "Material" sections\n- Percentage compositions (e.g., "면 100%", "울 80%")\n- Common material keywords: 폴리, 면, 울, 린넨, 실크\n- Product specification tables',
    ],
    low_confidence: [
        '\n\n## Focus Areas for Better Accuracy\n- Examine image more carefully\n- Look for text overlays on product images\n- Check both main area and sidebar/footer for details\n- Cross-reference visible elements with expected data',
    ],
    parse_error: [
        '\n\n## JSON Format Reminder\nRespond ONLY with valid JSON. No markdown, no explanations.\nEnsure all strings are properly quoted and escaped.',
    ],
    timeout: [
        '\n\n## Quick Response Mode\nProvide essential data only: price, productName, material, silhouette.\nSkip detailed analysis if unsure, use "unknown" for uncertain fields.',
    ],
    unknown: [],
};

// Safe-Guard 금지 패턴
const FORBIDDEN_PATTERNS = [
    /\bscript\b/i,
    /\beval\s*\(/i,
    /\bonclick\b/i,
    /\bonerror\b/i,
    /javascript:/i,
    /<script/i,
    /\bexec\s*\(/i,
    /\bsystem\s*\(/i,
    /\bdocument\.write/i,
    /\bwindow\.location/i,
];

// 프롬프트 최대 길이
const MAX_PROMPT_LENGTH = 8000;

/**
 * Safe-Guard 검증
 */
export function validatePromptSafety(prompt: string): { safe: boolean; violations: string[] } {
    const violations: string[] = [];

    for (const pattern of FORBIDDEN_PATTERNS) {
        if (pattern.test(prompt)) {
            violations.push(`Forbidden pattern detected: ${pattern.source}`);
        }
    }

    if (prompt.length > MAX_PROMPT_LENGTH) {
        violations.push(`Prompt exceeds max length: ${prompt.length}/${MAX_PROMPT_LENGTH}`);
    }

    return {
        safe: violations.length === 0,
        violations,
    };
}

/**
 * 추출 결과에서 실패 유형 분석
 */
export function analyzeFailure(
    result: { price?: number; material?: string; confidence?: number } | null,
    error?: Error
): FailureType {
    if (error) {
        if (error.message.includes('timeout')) return 'timeout';
        if (error.message.includes('JSON') || error.message.includes('parse')) return 'parse_error';
        return 'unknown';
    }

    if (!result) return 'unknown';

    // 가격 누락
    if (!result.price || result.price === 0) {
        return 'price_missing';
    }

    // 소재 unknown
    if (!result.material || result.material === 'unknown') {
        return 'material_unknown';
    }

    // 낮은 신뢰도
    if (result.confidence !== undefined && result.confidence < 0.7) {
        return 'low_confidence';
    }

    return 'unknown';
}

/**
 * 프롬프트 미세 조정
 */
export function adjustPrompt(
    basePrompt: string,
    failureType: FailureType
): OptimizationResult {
    const adjustments = ADJUSTMENT_STRATEGIES[failureType] || [];

    let optimizedPrompt = basePrompt;

    // 조정 사항 추가
    for (const adjustment of adjustments) {
        optimizedPrompt += adjustment;
    }

    // Safe-Guard 검증
    const safetyCheck = validatePromptSafety(optimizedPrompt);

    return {
        originalPrompt: basePrompt,
        optimizedPrompt: safetyCheck.safe ? optimizedPrompt : basePrompt,
        adjustments: safetyCheck.safe ? adjustments : [],
        failureType,
        safeGuardPassed: safetyCheck.safe,
    };
}

/**
 * 자율 재시도 래퍼
 */
export async function retryWithOptimization<T extends { confidence?: number; price?: number; material?: string }>(
    extractFn: (prompt: string) => Promise<T | null>,
    maxAttempts: number = 3,
    initialPrompt: string = VISION_PROMPT_TEMPLATE
): Promise<RetryResult<T>> {
    let currentPrompt = initialPrompt;
    const optimizations: string[] = [];
    let lastResult: T | null = null;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            console.log(`[SelfOptimizer] Attempt ${attempt}/${maxAttempts}`);

            const result = await extractFn(currentPrompt);

            if (result) {
                lastResult = result;

                // 성공 기준 확인
                const confidence = result.confidence ?? 0;
                if (confidence >= 0.7 && result.price && result.material !== 'unknown') {
                    console.log(`[SelfOptimizer] Success at attempt ${attempt} with confidence ${confidence}`);
                    return {
                        success: true,
                        data: result,
                        attempts: attempt,
                        optimizations,
                        finalConfidence: confidence,
                    };
                }

                // 부분 성공 - 최적화 후 재시도
                const failureType = analyzeFailure(result);
                if (failureType !== 'unknown') {
                    const optimization = adjustPrompt(currentPrompt, failureType);
                    if (optimization.safeGuardPassed && optimization.adjustments.length > 0) {
                        currentPrompt = optimization.optimizedPrompt;
                        optimizations.push(`Attempt ${attempt}: ${failureType} → adjusted`);
                        console.log(`[SelfOptimizer] Optimizing for: ${failureType}`);
                    }
                }
            }
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            console.error(`[SelfOptimizer] Attempt ${attempt} failed:`, lastError.message);

            const failureType = analyzeFailure(null, lastError);
            const optimization = adjustPrompt(currentPrompt, failureType);
            if (optimization.safeGuardPassed) {
                currentPrompt = optimization.optimizedPrompt;
                optimizations.push(`Attempt ${attempt}: ${failureType} (error) → adjusted`);
            }
        }
    }

    // 모든 시도 실패
    return {
        success: lastResult !== null,
        data: lastResult,
        attempts: maxAttempts,
        optimizations,
        finalConfidence: lastResult?.confidence ?? 0,
    };
}

/**
 * 텔레메트리 기반 프롬프트 개선 제안
 */
export function suggestPromptImprovements(
    failureStats: Record<FailureType, number>
): string[] {
    const suggestions: string[] = [];
    const total = Object.values(failureStats).reduce((a, b) => a + b, 0);

    if (total === 0) return suggestions;

    // 가장 빈번한 실패 유형 분석
    const sorted = Object.entries(failureStats)
        .filter(([_, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]);

    for (const [type, count] of sorted) {
        const percentage = Math.round((count / total) * 100);

        if (percentage >= 30) {
            switch (type as FailureType) {
                case 'price_missing':
                    suggestions.push(`${percentage}%의 실패가 가격 누락입니다. DOM 셀렉터 업데이트를 권장합니다.`);
                    break;
                case 'material_unknown':
                    suggestions.push(`${percentage}%의 실패가 소재 추출 실패입니다. 스크롤 트리거 로직 강화를 권장합니다.`);
                    break;
                case 'low_confidence':
                    suggestions.push(`${percentage}%가 낮은 신뢰도입니다. 이미지 해상도 또는 프롬프트 개선을 권장합니다.`);
                    break;
                case 'timeout':
                    suggestions.push(`${percentage}%가 타임아웃입니다. 네트워크 또는 대상 사이트 응답 시간 확인이 필요합니다.`);
                    break;
            }
        }
    }

    return suggestions;
}
