/**
 * Cross-Checker for AI vs DOM Data
 * 하이브리드 가중치 기반 합의(Consensus) 알고리즘
 */

import { CONSENSUS_WEIGHTS } from '../ai/config';
import type {
    AIExtractedProduct,
    DOMExtractedData,
    ConsensusResult
} from '@/types/aiExtraction';

/**
 * 가격 차이 비율 계산
 */
function calculatePriceDiscrepancy(price1: number, price2: number): number {
    if (price1 === 0 || price2 === 0) return 1;
    return Math.abs(price1 - price2) / Math.max(price1, price2);
}

/**
 * 문자열 유사도 계산 (간단한 Jaccard 유사도)
 */
function calculateNameSimilarity(name1: string, name2: string): number {
    if (!name1 || !name2) return 0;

    const words1 = new Set(name1.toLowerCase().split(/\s+/));
    const words2 = new Set(name2.toLowerCase().split(/\s+/));

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
}

/**
 * AI 데이터만 사용 (DOM 실패 시)
 */
function useAIOnly(aiData: AIExtractedProduct): ConsensusResult {
    return {
        finalPrice: aiData.price,
        finalName: aiData.productName,
        available: aiData.available,
        source: 'ai',
        confidence: aiData.confidence * 0.8, // AI 단독 시 신뢰도 감소
        aiData,
        domData: null,
        discrepancy: false,
    };
}

/**
 * DOM 데이터만 사용 (AI 실패 시)
 */
function useDOMOnly(domData: DOMExtractedData): ConsensusResult {
    return {
        finalPrice: domData.price,
        finalName: domData.productName || 'Unknown Product',
        available: domData.available,
        source: 'dom',
        confidence: 0.9, // DOM은 높은 신뢰도
        aiData: null,
        domData,
        discrepancy: false,
    };
}

/**
 * Cross-Check: AI와 DOM 데이터 비교 및 합의
 * 
 * 알고리즘:
 * 1. 가격 차이가 PRICE_TOLERANCE(5%) 이내면 DOM 가격 사용
 * 2. 가격 차이가 크면 DOM 우선 (가중치 0.8)
 * 3. 상품명은 AI가 더 정확할 수 있으므로 유사도 체크
 * 4. 최종 신뢰도 = (AI 신뢰도 * AI 가중치) + (DOM 가중치)
 */
export function crossCheck(
    aiData: AIExtractedProduct | null,
    domData: DOMExtractedData | null
): ConsensusResult {
    // 둘 다 없으면 실패
    if (!aiData && !domData) {
        return {
            finalPrice: 0,
            finalName: 'Extraction Failed',
            available: false,
            source: 'consensus',
            confidence: 0,
            aiData: null,
            domData: null,
            discrepancy: true,
            discrepancyDetails: 'Both AI and DOM extraction failed',
        };
    }

    // AI만 있는 경우
    if (!domData) {
        return useAIOnly(aiData!);
    }

    // DOM만 있는 경우
    if (!aiData) {
        return useDOMOnly(domData);
    }

    // 둘 다 있는 경우: 교차 검증
    const priceDiscrepancy = calculatePriceDiscrepancy(aiData.price, domData.price);
    const nameSimilarity = domData.productName
        ? calculateNameSimilarity(aiData.productName, domData.productName)
        : 0;

    const hasDiscrepancy = priceDiscrepancy > CONSENSUS_WEIGHTS.PRICE_TOLERANCE;

    // 가격 결정: DOM 우선
    let finalPrice: number;
    let priceSource: 'ai' | 'dom';

    if (domData.price > 0) {
        finalPrice = domData.price;
        priceSource = 'dom';
    } else {
        finalPrice = aiData.price;
        priceSource = 'ai';
    }

    // 상품명 결정: AI가 더 상세한 경우가 많음
    const finalName = aiData.productName || domData.productName || 'Unknown Product';

    // 재고 상태: 둘 중 하나라도 불가면 불가
    const available = aiData.available && domData.available;

    // 최종 신뢰도 계산
    let confidence: number;
    if (hasDiscrepancy) {
        // 불일치 시 신뢰도 감소
        confidence = Math.min(
            aiData.confidence * CONSENSUS_WEIGHTS.AI + CONSENSUS_WEIGHTS.DOM * 0.7,
            0.85
        );
    } else {
        // 일치 시 신뢰도 증가
        confidence = Math.min(
            aiData.confidence * CONSENSUS_WEIGHTS.AI + CONSENSUS_WEIGHTS.DOM,
            0.98
        );
    }

    const result: ConsensusResult = {
        finalPrice,
        finalName,
        available,
        source: 'consensus',
        confidence,
        aiData,
        domData,
        discrepancy: hasDiscrepancy,
    };

    if (hasDiscrepancy) {
        result.discrepancyDetails = `Price mismatch: AI=${aiData.price}, DOM=${domData.price} (${(priceDiscrepancy * 100).toFixed(1)}% diff). Using ${priceSource} price.`;
        console.warn('[CrossChecker] Discrepancy detected:', result.discrepancyDetails);
    } else {
        console.log('[CrossChecker] Consensus reached:', finalPrice, finalName);
    }

    return result;
}

/**
 * 신뢰도 기반 결과 검증
 */
export function isResultReliable(result: ConsensusResult): boolean {
    return result.confidence >= CONSENSUS_WEIGHTS.CONFIDENCE_THRESHOLD && result.finalPrice > 0;
}

/**
 * 결과 요약 출력
 */
export function summarizeResult(result: ConsensusResult): string {
    const reliability = isResultReliable(result) ? '✅ Reliable' : '⚠️ Unreliable';
    const discrepancy = result.discrepancy ? '⚡ Discrepancy' : '✓ Matched';

    return `
[CrossCheck Result]
  Product: ${result.finalName}
  Price: ${result.finalPrice.toLocaleString()}원
  Available: ${result.available}
  Source: ${result.source}
  Confidence: ${(result.confidence * 100).toFixed(1)}%
  Status: ${reliability} | ${discrepancy}
  ${result.discrepancyDetails ? `Note: ${result.discrepancyDetails}` : ''}
  `.trim();
}

// ============================================
// 유닛 테스트용 함수들
// ============================================

/**
 * 테스트: 가격 일치 시나리오
 */
export function __test_priceMatch(): ConsensusResult {
    const ai: AIExtractedProduct = {
        productName: '테스트 상품 A',
        price: 29900,
        available: true,
        confidence: 0.85,
        material: 'cotton',
        materialConfidence: 0.9,
        silhouette: 'regular',
        silhouetteConfidence: 0.85,
        fit: 'regular',
        styleCategory: 'casual',
        styleScore: 7,
    };
    const dom: DOMExtractedData = {
        price: 29900,
        productName: '테스트 상품',
        available: true,
        selector: '.price',
    };
    return crossCheck(ai, dom);
}

/**
 * 테스트: 가격 불일치 시나리오 (DOM 우선)
 */
export function __test_priceMismatch(): ConsensusResult {
    const ai: AIExtractedProduct = {
        productName: '테스트 상품 B',
        price: 29000, // AI가 할인가로 오인
        available: true,
        confidence: 0.75,
        material: 'polyester',
        materialConfidence: 0.8,
        silhouette: 'oversized',
        silhouetteConfidence: 0.75,
        fit: 'oversized',
        styleCategory: 'streetwear',
        styleScore: 8,
    };
    const dom: DOMExtractedData = {
        price: 29900, // DOM이 정확
        productName: '테스트 상품',
        available: true,
        selector: '.price',
    };
    return crossCheck(ai, dom);
}

/**
 * 테스트: AI만 성공
 */
export function __test_aiOnly(): ConsensusResult {
    const ai: AIExtractedProduct = {
        productName: '테스트 상품 C',
        price: 39900,
        available: true,
        confidence: 0.9,
        material: 'denim',
        materialConfidence: 0.95,
        silhouette: 'straight',
        silhouetteConfidence: 0.9,
        fit: 'regular',
        styleCategory: 'classic',
        styleScore: 6,
    };
    return crossCheck(ai, null);
}

/**
 * 테스트: DOM만 성공
 */
export function __test_domOnly(): ConsensusResult {
    const dom: DOMExtractedData = {
        price: 49900,
        productName: '테스트 상품 D',
        available: true,
        selector: '.price',
    };
    return crossCheck(null, dom);
}

/**
 * 모든 테스트 실행
 */
export function runCrossCheckerTests(): void {
    console.log('=== CrossChecker Unit Tests ===\n');

    console.log('Test 1: Price Match');
    console.log(summarizeResult(__test_priceMatch()));
    console.log('\n---\n');

    console.log('Test 2: Price Mismatch (DOM Priority)');
    console.log(summarizeResult(__test_priceMismatch()));
    console.log('\n---\n');

    console.log('Test 3: AI Only');
    console.log(summarizeResult(__test_aiOnly()));
    console.log('\n---\n');

    console.log('Test 4: DOM Only');
    console.log(summarizeResult(__test_domOnly()));
    console.log('\n===========================\n');
}
