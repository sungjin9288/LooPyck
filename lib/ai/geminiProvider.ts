/**
 * Gemini Provider with Multi-Model Routing
 * 분석 난이도에 따라 Pro/Flash 모델 선택
 */

import { AI_RATE_LIMITS } from './config';
import { rateLimiter } from './rateLimiter';
import { usageTracker } from './usageTracker';

// 모델 설정
export const GEMINI_MODELS = {
    flash: {
        name: 'gemini-2.5-flash',
        costPer1MTokens: 0,     // Free tier
        maxTokens: 8192,
        speed: 'fast',
        accuracy: 'good',
    },
    pro: {
        name: 'gemini-2.5-pro',
        costPer1MTokens: 1.25,  // $1.25 / 1M tokens
        maxTokens: 32768,
        speed: 'medium',
        accuracy: 'excellent',
    },
} as const;

export type ModelTier = keyof typeof GEMINI_MODELS;

// 분석 복잡도 판단 기준
export interface ComplexityFactors {
    hasMultipleProducts: boolean;    // 여러 상품이 있는 페이지
    hasComplexLayout: boolean;       // 복잡한 레이아웃
    requiresMaterialAnalysis: boolean; // 소재 분석 필요
    previousFailures: number;        // 이전 실패 횟수
    imageSize: number;               // 이미지 크기 (bytes)
}

// 라우팅 결과
interface RoutingDecision {
    model: ModelTier;
    reason: string;
    estimatedTokens: number;
    canProceed: boolean;
    fallbackModel?: ModelTier;
}

/**
 * 복잡도 분석 및 모델 선택
 */
export function routeToModel(factors: ComplexityFactors): RoutingDecision {
    const {
        hasMultipleProducts,
        hasComplexLayout,
        requiresMaterialAnalysis,
        previousFailures,
        imageSize
    } = factors;

    // 복잡도 점수 계산 (0-10)
    let complexityScore = 0;

    if (hasMultipleProducts) complexityScore += 3;
    if (hasComplexLayout) complexityScore += 2;
    if (requiresMaterialAnalysis) complexityScore += 2;
    if (previousFailures > 0) complexityScore += previousFailures * 2;
    if (imageSize > 500_000) complexityScore += 1; // 큰 이미지

    // 토큰 추정
    const baseTokens = 200; // 프롬프트 기본
    const imageTokens = Math.ceil(imageSize * 0.0003);
    const responseTokens = complexityScore > 5 ? 300 : 150;
    const estimatedTokens = baseTokens + imageTokens + responseTokens;

    // Rate limit 확인
    const canUseFlash = rateLimiter.canMakeRequest(estimatedTokens);

    // 모델 결정
    let model: ModelTier = 'flash';
    let reason = '';

    if (complexityScore >= 7) {
        // 매우 복잡 - Pro 권장
        model = 'pro';
        reason = `High complexity (${complexityScore}/10): Multiple failures or complex layout`;
    } else if (complexityScore >= 4) {
        // 중간 복잡도 - Flash + fallback Pro
        model = 'flash';
        reason = `Medium complexity (${complexityScore}/10): Using Flash with Pro fallback`;
    } else {
        // 단순 - Flash
        model = 'flash';
        reason = `Low complexity (${complexityScore}/10): Flash is sufficient`;
    }

    // Free tier 제한으로 Flash 불가 시 Pro로 전환
    if (model === 'flash' && !canUseFlash) {
        console.warn('[GeminiProvider] Flash quota exhausted, routing to Pro');
        model = 'pro';
        reason = 'Flash quota exhausted - using Pro';
    }

    return {
        model,
        reason,
        estimatedTokens,
        canProceed: model === 'pro' || canUseFlash,
        fallbackModel: model === 'flash' ? 'pro' : undefined,
    };
}

/**
 * API 호출 (모델별)
 */
export async function callGeminiAPI(
    model: ModelTier,
    prompt: string,
    imageBase64: string,
    mimeType: string = 'image/png'
): Promise<{ success: boolean; data?: unknown; error?: string; tokensUsed: number }> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return { success: false, error: 'GEMINI_API_KEY not configured', tokensUsed: 0 };
    }

    const modelConfig = GEMINI_MODELS[model];
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelConfig.name}:generateContent?key=${apiKey}`;

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: mimeType,
                                data: imageBase64
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: modelConfig.maxTokens,
                }
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            return {
                success: false,
                error: `API Error ${response.status}: ${errorText}`,
                tokensUsed: 0
            };
        }

        const result = await response.json();

        // 토큰 사용량 추정
        const tokensUsed = result.usageMetadata?.totalTokenCount || 500;

        // Flash 사용 시 rate limiter 기록
        if (model === 'flash') {
            rateLimiter.recordRequest(tokensUsed);
            usageTracker.recordSuccess(tokensUsed);
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            return { success: false, error: 'Empty response from API', tokensUsed };
        }

        // JSON 추출
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            return { success: false, error: 'No JSON in response', tokensUsed };
        }

        const data = JSON.parse(jsonMatch[0]);
        return { success: true, data, tokensUsed };

    } catch (error) {
        if (model === 'flash') {
            usageTracker.recordFailure();
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            tokensUsed: 0
        };
    }
}

/**
 * 자동 라우팅 + 폴백 호출
 */
export async function smartCall(
    factors: ComplexityFactors,
    prompt: string,
    imageBase64: string,
    mimeType?: string
): Promise<{ success: boolean; data?: unknown; error?: string; modelUsed: ModelTier }> {
    const routing = routeToModel(factors);

    if (!routing.canProceed) {
        return {
            success: false,
            error: 'All quotas exhausted',
            modelUsed: routing.model
        };
    }

    // 1차 시도
    const result = await callGeminiAPI(routing.model, prompt, imageBase64, mimeType);

    if (result.success) {
        return {
            success: true,
            data: result.data,
            modelUsed: routing.model
        };
    }

    // 폴백 시도
    if (routing.fallbackModel) {
        console.warn(`[GeminiProvider] ${routing.model} failed, trying ${routing.fallbackModel}`);
        const fallbackResult = await callGeminiAPI(routing.fallbackModel, prompt, imageBase64, mimeType);

        return {
            success: fallbackResult.success,
            data: fallbackResult.data,
            error: fallbackResult.error,
            modelUsed: routing.fallbackModel,
        };
    }

    return {
        success: false,
        error: result.error,
        modelUsed: routing.model
    };
}
