/**
 * AI Extraction Types
 * Vision Parser와 DOM Extractor의 결과 타입 정의
 */

// AI 추출 기본 결과 (V2.0 - 고도화)
export interface AIExtractedProduct {
    productName: string;
    brand?: string;
    price: number;
    originalPrice?: number;
    discountRate?: number;
    available: boolean;
    confidence: number; // 0-1 (Overall AI 확신도)

    // Phase 4.1: 소재 분석 (95% 정확도 목표)
    material: 'cotton' | 'polyester' | 'nylon' | 'wool' | 'linen' | 'silk' | 'leather' | 'denim' | 'knit' | 'fleece' | 'mixed' | 'unknown';
    materialConfidence: number; // 0-1
    materialDetails?: string; // 원본 텍스트 (e.g., "면 100%")

    // Phase 4.1: 실루엣 분석 (95% 정확도 목표)
    silhouette: 'fitted' | 'regular' | 'relaxed' | 'oversized' | 'boxy' | 'slim' | 'straight' | 'wide' | 'unknown';
    silhouetteConfidence: number; // 0-1

    // 핏 & 스타일
    fit: 'slim' | 'regular' | 'oversized' | 'unknown';
    styleCategory: 'casual' | 'formal' | 'streetwear' | 'athleisure' | 'classic' | 'minimal' | 'unknown';
    styleScore: number; // 1-10
}

// DOM 추출 결과
export interface DOMExtractedData {
    price: number;
    originalPrice?: number;
    productName?: string;
    available: boolean;
    selector: string; // 사용된 셀렉터 (디버깅용)
}

// Cross-Check 결과 (합의)
export interface ConsensusResult {
    finalPrice: number;
    finalName: string;
    available: boolean;
    source: 'ai' | 'dom' | 'consensus';
    confidence: number;

    // 디버깅 정보
    aiData: AIExtractedProduct | null;
    domData: DOMExtractedData | null;
    discrepancy: boolean; // 불일치 여부
    discrepancyDetails?: string;
}

// Firestore 캐시 스키마
export interface CachedProductData {
    // Document ID: productUrl의 hash
    urlHash: string;
    originalUrl: string;

    // 추출 데이터
    extractedData: ConsensusResult;

    // 메타데이터
    extractedAt: Date;
    expiresAt: Date; // 캐시 만료 (기본 24시간)
    source: 'musinsa' | 'naver' | '29cm' | 'wconcept' | 'zigzag' | 'ssf' | 'ably' | 'other';

    // 통계
    hitCount: number; // 캐시 히트 횟수
}

// Rate Limiter 상태
export interface RateLimitState {
    rpm: number;      // 현재 분당 요청 수
    rpd: number;      // 현재 일당 요청 수
    tpm: number;      // 현재 분당 토큰 수
    lastReset: Date;  // 마지막 리셋 시간
    dailyReset: Date; // 일일 리셋 시간
}

// Healer 시나리오
export type HealerScenario =
    | 'element_hidden'    // 요소가 가려짐
    | 'popup_modal'       // 팝업/모달 발생
    | 'lazy_load'         // 지연 로딩 필요
    | 'timeout';          // 타임아웃
