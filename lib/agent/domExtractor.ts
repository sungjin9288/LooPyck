/**
 * DOM Extractor for Shopping Malls
 * 쇼핑몰별 DOM 기반 가격/상품명 추출
 */

import { MALL_SELECTORS } from '../ai/config';
import type { DOMExtractedData } from '@/types/aiExtraction';

type MallName = keyof typeof MALL_SELECTORS;

/**
 * URL에서 쇼핑몰 식별
 */
export function identifyMall(url: string): MallName | null {
    const hostname = new URL(url).hostname.toLowerCase();

    if (hostname.includes('musinsa')) return 'musinsa';
    if (hostname.includes('naver') || hostname.includes('shopping.naver')) return 'naver';
    if (hostname.includes('29cm')) return '29cm';

    return null;
}

/**
 * 가격 문자열 파싱 (50,000원 → 50000)
 */
export function parsePrice(priceText: string): number {
    if (!priceText) return 0;

    // 숫자와 쉼표만 추출
    const numericString = priceText.replace(/[^\d,]/g, '').replace(/,/g, '');
    const parsed = parseInt(numericString, 10);

    return isNaN(parsed) ? 0 : parsed;
}

/**
 * DOM에서 텍스트 추출 (단일 셀렉터)
 */
function extractText(document: Document, selector: string): string {
    try {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
    } catch {
        return '';
    }
}

/**
 * 요소 존재 여부 확인
 */
function elementExists(document: Document, selector: string): boolean {
    try {
        return document.querySelector(selector) !== null;
    } catch {
        return false;
    }
}

/**
 * 쇼핑몰 DOM에서 상품 정보 추출
 * Note: 이 함수는 브라우저 환경에서 사용됨 (document 전달 필요)
 */
export function extractFromDOM(
    document: Document,
    url: string
): DOMExtractedData | null {
    const mall = identifyMall(url);

    if (!mall) {
        console.warn('[DOMExtractor] Unknown mall:', url);
        return null;
    }

    const selectors = MALL_SELECTORS[mall];

    try {
        const priceText = extractText(document, selectors.price);
        const originalPriceText = extractText(document, selectors.originalPrice);
        const productName = extractText(document, selectors.productName);
        const available = elementExists(document, selectors.available);

        const price = parsePrice(priceText);
        const originalPrice = parsePrice(originalPriceText);

        if (price === 0) {
            console.warn('[DOMExtractor] Could not extract price from:', mall);
            return null;
        }

        const result: DOMExtractedData = {
            price,
            originalPrice: originalPrice > 0 ? originalPrice : undefined,
            productName: productName || undefined,
            available,
            selector: selectors.price, // 디버깅용
        };

        console.log('[DOMExtractor] Extracted from', mall, ':', result);
        return result;

    } catch (error) {
        console.error('[DOMExtractor] Extraction failed:', error);
        return null;
    }
}

/**
 * HTML 문자열에서 추출 (서버 사이드용)
 */
export function extractFromHTML(
    html: string,
    url: string
): DOMExtractedData | null {
    // DOMParser는 브라우저에서만 사용 가능
    if (typeof window === 'undefined') {
        console.warn('[DOMExtractor] DOMParser not available in server environment');
        return null;
    }

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        return extractFromDOM(doc, url);
    } catch (error) {
        console.error('[DOMExtractor] HTML parsing failed:', error);
        return null;
    }
}

/**
 * 폴백 셀렉터로 가격 추출 시도
 * 기본 셀렉터 실패 시 범용 패턴 시도
 */
export function extractPriceWithFallback(document: Document): number {
    // 범용 가격 패턴들
    const fallbackSelectors = [
        '[class*="price"]:not([class*="original"]):not([class*="before"])',
        '[class*="cost"]',
        '[data-price]',
        '.price',
        '#price',
    ];

    for (const selector of fallbackSelectors) {
        try {
            const elements = document.querySelectorAll(selector);
            for (const el of elements) {
                const price = parsePrice(el.textContent || '');
                if (price > 0 && price < 10_000_000) { // 1천만원 미만
                    console.log('[DOMExtractor] Fallback found price:', price, 'via', selector);
                    return price;
                }
            }
        } catch {
            continue;
        }
    }

    return 0;
}

/**
 * 쇼핑몰 지원 여부 확인
 */
export function isMallSupported(url: string): boolean {
    return identifyMall(url) !== null;
}

/**
 * 지원 쇼핑몰 목록
 */
export function getSupportedMalls(): string[] {
    return Object.keys(MALL_SELECTORS);
}
