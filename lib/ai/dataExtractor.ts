/**
 * Data Extractor with Zod Schema Validation
 * AI 응답을 타입 안전하게 파싱 + Self-Correction 트리거
 */

import { z } from 'zod';
import { smartCall, ComplexityFactors } from './geminiProvider';
import { injectContext, PageContext } from './contextInjector';

// Zod 스키마 정의 (AI 응답 검증)
export const ProductExtractionSchema = z.object({
    productName: z.string().min(1),
    brand: z.string().nullable().optional(),
    price: z.number().positive(),
    originalPrice: z.number().positive().nullable().optional(),
    discountRate: z.number().min(0).max(100).nullable().optional(),
    available: z.boolean(),

    // 소재 분석
    material: z.enum([
        'cotton', 'polyester', 'nylon', 'wool', 'linen',
        'silk', 'leather', 'denim', 'knit', 'fleece', 'mixed', 'unknown'
    ]),
    materialConfidence: z.number().min(0).max(1),
    materialDetails: z.string().nullable().optional(),

    // 실루엣 분석
    silhouette: z.enum([
        'fitted', 'regular', 'relaxed', 'oversized',
        'boxy', 'slim', 'straight', 'wide', 'unknown'
    ]),
    silhouetteConfidence: z.number().min(0).max(1),

    // 핏 & 스타일
    fit: z.enum(['slim', 'regular', 'oversized', 'unknown']),
    styleCategory: z.enum([
        'casual', 'formal', 'streetwear', 'athleisure',
        'classic', 'minimal', 'unknown'
    ]),
    styleScore: z.number().min(1).max(10),

    // 전체 신뢰도
    confidence: z.number().min(0).max(1),
});

export type ProductExtraction = z.infer<typeof ProductExtractionSchema>;

// 파싱 결과
interface ExtractionResult {
    success: boolean;
    data?: ProductExtraction;
    error?: string;
    validationErrors?: z.ZodError;
    needsSelfCorrection: boolean;
    correctionHints?: string[];
}

// Self-Correction 트리거 조건
interface CorrectionTrigger {
    type: 'validation_failed' | 'low_confidence' | 'missing_critical_field' | 'price_anomaly';
    details: string;
    suggestedAction: string;
}

/**
 * Zod 검증 오류 분석
 */
function analyzeValidationErrors(error: z.ZodError): CorrectionTrigger[] {
    const triggers: CorrectionTrigger[] = [];

    for (const issue of error.issues) {
        const path = issue.path.join('.');

        if (path === 'price' || path === 'productName') {
            triggers.push({
                type: 'missing_critical_field',
                details: `Missing or invalid ${path}: ${issue.message}`,
                suggestedAction: 'Retry with enhanced prompt focusing on price/name',
            });
        } else if (path.includes('material') || path.includes('silhouette')) {
            triggers.push({
                type: 'validation_failed',
                details: `Invalid ${path}: ${issue.message}`,
                suggestedAction: 'Use "unknown" for uncertain fields',
            });
        }
    }

    return triggers;
}

/**
 * 데이터 품질 검증
 */
function validateDataQuality(data: ProductExtraction): CorrectionTrigger[] {
    const triggers: CorrectionTrigger[] = [];

    // 낮은 신뢰도
    if (data.confidence < 0.7) {
        triggers.push({
            type: 'low_confidence',
            details: `Overall confidence too low: ${data.confidence}`,
            suggestedAction: 'Consider using Pro model or manual review',
        });
    }

    // 가격 이상 감지
    if (data.price < 1000 || data.price > 10_000_000) {
        triggers.push({
            type: 'price_anomaly',
            details: `Suspicious price: ${data.price}`,
            suggestedAction: 'Cross-check with DOM extraction',
        });
    }

    // 소재 불확실
    if (data.material === 'unknown' && data.materialConfidence > 0.5) {
        triggers.push({
            type: 'validation_failed',
            details: 'Material unknown but high confidence',
            suggestedAction: 'Review material section HTML',
        });
    }

    return triggers;
}

/**
 * AI 응답 파싱 + 검증
 */
export function parseAIResponse(rawData: unknown): ExtractionResult {
    try {
        const parsed = ProductExtractionSchema.parse(rawData);

        // 품질 검증
        const qualityIssues = validateDataQuality(parsed);

        return {
            success: true,
            data: parsed,
            needsSelfCorrection: qualityIssues.length > 0,
            correctionHints: qualityIssues.map(t => `${t.type}: ${t.suggestedAction}`),
        };

    } catch (error) {
        if (error instanceof z.ZodError) {
            const triggers = analyzeValidationErrors(error);

            return {
                success: false,
                validationErrors: error,
                error: `Validation failed: ${error.issues.length} issues`,
                needsSelfCorrection: true,
                correctionHints: triggers.map(t => `${t.type}: ${t.suggestedAction}`),
            };
        }

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown parsing error',
            needsSelfCorrection: true,
            correctionHints: ['Retry with simpler prompt'],
        };
    }
}

/**
 * Self-Correction 프롬프트 생성
 */
export function generateCorrectionPrompt(
    originalPrompt: string,
    failedResponse: unknown,
    correctionHints: string[]
): string {
    return `
${originalPrompt}

## PREVIOUS ATTEMPT FAILED
The previous response was invalid. Here's what went wrong:
${correctionHints.map(h => `- ${h}`).join('\n')}

Previous (invalid) response:
${JSON.stringify(failedResponse, null, 2)}

## CORRECTION INSTRUCTIONS
1. Fix the issues mentioned above
2. Ensure all required fields are present
3. Use "unknown" for uncertain fields instead of guessing
4. Ensure price is a positive number (no currency symbols)
5. Ensure confidence reflects actual certainty

Provide a CORRECTED JSON response:
`.trim();
}

/**
 * 전체 추출 파이프라인 (with Self-Correction)
 */
export async function extractProductData(
    context: PageContext,
    maxRetries: number = 2
): Promise<ExtractionResult & { attempts: number }> {
    const enrichedPrompt = injectContext(context);

    const factors: ComplexityFactors = {
        hasMultipleProducts: false,
        hasComplexLayout: !!context.html?.fullText && context.html.fullText.length > 3000,
        requiresMaterialAnalysis: true,
        previousFailures: 0,
        imageSize: enrichedPrompt.imageBase64.length,
    };

    let attempt = 0;
    let lastResult: ExtractionResult | null = null;
    let currentPrompt = enrichedPrompt.text;

    while (attempt < maxRetries) {
        attempt++;
        factors.previousFailures = attempt - 1;

        const apiResult = await smartCall(
            factors,
            currentPrompt,
            enrichedPrompt.imageBase64,
            enrichedPrompt.imageMimeType
        );

        if (!apiResult.success) {
            console.error(`[DataExtractor] API call failed: ${apiResult.error}`);
            lastResult = {
                success: false,
                error: apiResult.error,
                needsSelfCorrection: attempt < maxRetries,
            };
            continue;
        }

        // Zod 검증
        const parseResult = parseAIResponse(apiResult.data);
        lastResult = parseResult;

        if (parseResult.success && !parseResult.needsSelfCorrection) {
            return { ...parseResult, attempts: attempt };
        }

        // Self-Correction 필요
        if (parseResult.needsSelfCorrection && attempt < maxRetries) {
            console.warn('[DataExtractor] Triggering self-correction...');
            currentPrompt = generateCorrectionPrompt(
                enrichedPrompt.text,
                apiResult.data,
                parseResult.correctionHints || []
            );
        }
    }

    return {
        ...(lastResult || { success: false, error: 'Max retries exceeded', needsSelfCorrection: false }),
        attempts: attempt
    };
}

/**
 * 빠른 검증 (캐시된 데이터용)
 */
export function quickValidate(data: unknown): boolean {
    const result = ProductExtractionSchema.safeParse(data);
    return result.success;
}
