/**
 * Vision Parser for Gemini 2.5 Flash
 * 스크린샷을 구조화된 JSON으로 변환
 */

import { VISION_PROMPT_TEMPLATE, TOKEN_ESTIMATES } from './config';
import { rateLimiter } from './rateLimiter';
import { usageTracker } from './usageTracker';
import type { AIExtractedProduct } from '@/types/aiExtraction';

// Gemini API 응답 타입
interface GeminiResponse {
    candidates: Array<{
        content: {
            parts: Array<{
                text: string;
            }>;
        };
    }>;
    usageMetadata?: {
        promptTokenCount: number;
        candidatesTokenCount: number;
        totalTokenCount: number;
    };
}

/**
 * 이미지 크기 기반 토큰 추정
 */
function estimateTokens(imageBase64: string): number {
    // Base64 길이로 대략적인 이미지 크기 추정
    const imageSizeBytes = (imageBase64.length * 3) / 4;
    const estimatedPixels = imageSizeBytes / 3; // RGB 가정

    return Math.ceil(
        TOKEN_ESTIMATES.BASE_PROMPT +
        (estimatedPixels * TOKEN_ESTIMATES.IMAGE_PER_PIXEL) +
        TOKEN_ESTIMATES.RESPONSE_AVERAGE
    );
}

/**
 * Base64 이미지를 Gemini API로 분석
 */
export async function parseProductImage(
    imageBase64: string,
    mimeType: 'image/png' | 'image/jpeg' | 'image/webp' = 'image/png'
): Promise<AIExtractedProduct | null> {
    // Rate Limit 체크
    const estimatedTokens = estimateTokens(imageBase64);

    if (!rateLimiter.canMakeRequest(estimatedTokens)) {
        console.error('[VisionParser] Rate limit exceeded');
        usageTracker.recordFailure();
        return null;
    }

    // API 키 확인
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error('[VisionParser] GEMINI_API_KEY not configured');
        return null;
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    inlineData: {
                                        mimeType,
                                        data: imageBase64,
                                    },
                                },
                                {
                                    text: VISION_PROMPT_TEMPLATE,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.1, // 낮은 온도로 일관된 결과
                        maxOutputTokens: 500,
                    },
                }),
                signal: AbortSignal.timeout(30000), // 30초 타임아웃
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[VisionParser] API Error:', response.status, errorText);
            usageTracker.recordFailure();

            // 429 에러 시 Rate Limit 기록
            if (response.status === 429) {
                console.warn('[VisionParser] Rate limit hit from API');
            }

            return null;
        }

        const data: GeminiResponse = await response.json();

        // 토큰 사용량 기록
        const tokensUsed = data.usageMetadata?.totalTokenCount || estimatedTokens;
        rateLimiter.recordRequest(tokensUsed);
        usageTracker.recordSuccess(tokensUsed);

        // 응답 파싱
        const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!textContent) {
            console.error('[VisionParser] Empty response from API');
            return null;
        }

        // JSON 추출 (마크다운 코드 블록 처리)
        const jsonMatch = textContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error('[VisionParser] Could not find JSON in response:', textContent);
            return null;
        }

        const parsed = JSON.parse(jsonMatch[0]) as AIExtractedProduct;

        // 유효성 검사
        if (typeof parsed.price !== 'number' || parsed.price <= 0) {
            console.warn('[VisionParser] Invalid price extracted:', parsed.price);
            parsed.confidence = Math.min(parsed.confidence || 0, 0.5);
        }

        console.log('[VisionParser] Successfully extracted:', parsed.productName, parsed.price);
        return parsed;

    } catch (error) {
        console.error('[VisionParser] Parse error:', error);
        usageTracker.recordFailure();

        if (error instanceof SyntaxError) {
            console.error('[VisionParser] JSON parse failed');
        }

        return null;
    }
}

/**
 * URL에서 이미지 다운로드 후 분석 (유틸리티)
 */
export async function parseProductFromUrl(imageUrl: string): Promise<AIExtractedProduct | null> {
    try {
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const buffer = await blob.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');

        const mimeType = blob.type as 'image/png' | 'image/jpeg' | 'image/webp';
        return parseProductImage(base64, mimeType);
    } catch (error) {
        console.error('[VisionParser] Failed to fetch image:', error);
        return null;
    }
}
