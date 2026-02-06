/**
 * Context Injector
 * 스크린샷과 HTML 텍스트를 결합하여 AI 프롬프트 구성
 */

import { VISION_PROMPT_TEMPLATE } from './config';

// Context 타입
export interface PageContext {
    screenshot: {
        base64: string;
        mimeType: string;
        width?: number;
        height?: number;
    };
    html?: {
        productSection?: string;   // 상품 정보 섹션 HTML
        priceSection?: string;     // 가격 섹션 HTML
        materialSection?: string;  // 소재 정보 섹션 HTML
        fullText?: string;         // 페이지 전체 텍스트
    };
    metadata?: {
        url: string;
        mall: string;
        timestamp: Date;
    };
}

// 결합된 프롬프트
interface EnrichedPrompt {
    text: string;
    imageBase64: string;
    imageMimeType: string;
    estimatedTokens: number;
}

/**
 * HTML 섹션 정리 (토큰 절약)
 */
function sanitizeHtml(html: string, maxLength: number = 2000): string {
    if (!html) return '';

    // 스크립트, 스타일 제거
    let cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<[^>]+>/g, ' ')  // HTML 태그 제거
        .replace(/\s+/g, ' ')       // 공백 정리
        .trim();

    // 길이 제한
    if (cleaned.length > maxLength) {
        cleaned = cleaned.substring(0, maxLength) + '...';
    }

    return cleaned;
}

/**
 * 가격 텍스트 추출
 */
function extractPriceText(html: string): string[] {
    const prices: string[] = [];

    // 한국 원화 패턴
    const pricePatterns = [
        /[\d,]+\s*원/g,
        /₩\s*[\d,]+/g,
        /KRW\s*[\d,]+/gi,
    ];

    for (const pattern of pricePatterns) {
        const matches = html.match(pattern);
        if (matches) {
            prices.push(...matches);
        }
    }

    return [...new Set(prices)]; // 중복 제거
}

/**
 * 소재 텍스트 추출
 */
function extractMaterialText(html: string): string[] {
    const materials: string[] = [];

    const materialPatterns = [
        /면\s*\d+%/g,
        /폴리에스터\s*\d+%/g,
        /나일론\s*\d+%/g,
        /울\s*\d+%/g,
        /린넨\s*\d+%/g,
        /실크\s*\d+%/g,
        /cotton\s*\d+%/gi,
        /polyester\s*\d+%/gi,
    ];

    for (const pattern of materialPatterns) {
        const matches = html.match(pattern);
        if (matches) {
            materials.push(...matches);
        }
    }

    return [...new Set(materials)];
}

/**
 * Context Injection으로 프롬프트 생성
 */
export function injectContext(context: PageContext): EnrichedPrompt {
    const parts: string[] = [];

    // 1. 기본 프롬프트
    parts.push(VISION_PROMPT_TEMPLATE);

    // 2. 추가 컨텍스트 (HTML에서 추출)
    if (context.html) {
        parts.push('\n\n## ADDITIONAL CONTEXT FROM PAGE');

        // 가격 정보
        if (context.html.priceSection) {
            const priceText = sanitizeHtml(context.html.priceSection, 500);
            const extractedPrices = extractPriceText(context.html.priceSection);
            if (extractedPrices.length > 0) {
                parts.push(`\n### Price Information (from DOM)`);
                parts.push(`Detected prices: ${extractedPrices.join(', ')}`);
            }
        }

        // 소재 정보
        if (context.html.materialSection) {
            const extractedMaterials = extractMaterialText(context.html.materialSection);
            if (extractedMaterials.length > 0) {
                parts.push(`\n### Material Information (from DOM)`);
                parts.push(`Detected materials: ${extractedMaterials.join(', ')}`);
                parts.push('Use this for high-confidence material extraction.');
            }
        }

        // 상품명 섹션
        if (context.html.productSection) {
            const productText = sanitizeHtml(context.html.productSection, 300);
            if (productText) {
                parts.push(`\n### Product Section Text`);
                parts.push(productText);
            }
        }
    }

    // 3. 메타데이터
    if (context.metadata) {
        parts.push(`\n\n## PAGE METADATA`);
        parts.push(`Mall: ${context.metadata.mall}`);
        parts.push(`URL: ${context.metadata.url}`);
    }

    // 4. 지시사항 강화
    parts.push(`\n\n## CRITICAL INSTRUCTION`);
    parts.push(`If DOM-extracted text shows explicit material info (e.g., "면 100%"), set materialConfidence to 0.95+.`);
    parts.push(`Cross-reference the screenshot with the text data for maximum accuracy.`);

    const fullPrompt = parts.join('\n');

    // 토큰 추정
    const textTokens = Math.ceil(fullPrompt.length / 4); // ~4 chars per token
    const imageTokens = Math.ceil(context.screenshot.base64.length * 0.75 / 1000); // base64 → bytes → tokens
    const estimatedTokens = textTokens + imageTokens + 200; // 응답 여유

    return {
        text: fullPrompt,
        imageBase64: context.screenshot.base64,
        imageMimeType: context.screenshot.mimeType,
        estimatedTokens,
    };
}

/**
 * DOM에서 섹션 HTML 추출 (브라우저 환경)
 */
export function extractSectionsFromDOM(selectors: {
    product?: string;
    price?: string;
    material?: string;
}): PageContext['html'] {
    if (typeof document === 'undefined') {
        return {};
    }

    const result: PageContext['html'] = {};

    if (selectors.product) {
        const el = document.querySelector(selectors.product);
        if (el) result.productSection = el.innerHTML;
    }

    if (selectors.price) {
        const el = document.querySelector(selectors.price);
        if (el) result.priceSection = el.innerHTML;
    }

    if (selectors.material) {
        const el = document.querySelector(selectors.material);
        if (el) result.materialSection = el.innerHTML;
    }

    // 전체 텍스트
    result.fullText = document.body?.innerText?.substring(0, 5000) || '';

    return result;
}

/**
 * 풍부한 컨텍스트 생성 헬퍼
 */
export function createPageContext(
    screenshotBase64: string,
    mimeType: string,
    url: string,
    mall: string,
    htmlSections?: PageContext['html']
): PageContext {
    return {
        screenshot: {
            base64: screenshotBase64,
            mimeType,
        },
        html: htmlSections,
        metadata: {
            url,
            mall,
            timestamp: new Date(),
        },
    };
}
