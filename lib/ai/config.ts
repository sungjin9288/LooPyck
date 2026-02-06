/**
 * AI Configuration Constants
 * Gemini 2.5 Flash Free Tier 제한 및 설정
 */

import { DesignTokens } from '@/styles/designTokens';

// Gemini Free Tier Rate Limits (2025년 12월 기준)
export const AI_RATE_LIMITS = {
    RPM: 10,           // 분당 요청 수
    RPD: 20,           // 일당 요청 수
    TPM: 250_000,      // 분당 토큰 수

    // 안전 마진 (90%까지만 사용)
    SAFETY_MARGIN: 0.9,
} as const;

// 캐시 설정
export const CACHE_CONFIG = {
    TTL_HOURS: 24,     // 캐시 유효 기간 (시간)
    COLLECTION_PATH: 'cache/products',
} as const;

// Healer 설정
export const HEALER_CONFIG = {
    MAX_RETRIES: 3,
    RETRY_DELAY_MS: 1000,
    SCROLL_OFFSET: 100,
} as const;

// Cross-Checker 가중치
export const CONSENSUS_WEIGHTS = {
    DOM: 0.8,          // DOM 데이터 우선
    AI: 0.2,           // AI 데이터 보조

    // 신뢰도 임계값
    CONFIDENCE_THRESHOLD: 0.7,
    PRICE_TOLERANCE: 0.05,  // 5% 가격 차이 허용
} as const;

// 쇼핑몰별 DOM 셀렉터 프리셋 (확장)
export const MALL_SELECTORS = {
    musinsa: {
        price: '.product_article_price .price .txt_price',
        originalPrice: '.product_article_price .origin_price',
        productName: '.product_title .title',
        available: '.product_article_buy_btn',
        popupClose: '[class*="layer"] [class*="close"], .popup_close',
    },
    naver: {
        price: '._1LY7DqCnwR ._1LY7DqCnwR',
        originalPrice: '.sale_price',
        productName: '.product_main_info .product_title',
        available: '.buy_button',
        popupClose: '.modal_close, [class*="close"]',
    },
    '29cm': {
        price: '.css-price-value',
        originalPrice: '.css-origin-price',
        productName: '.product-name',
        available: '.buy-button',
        popupClose: '.modal-close, .popup-close',
    },
    wconcept: {
        price: '.product-price .price, .prd-price .price, [class*="price"] strong',
        originalPrice: '.product-price .original, .prd-price .original, [class*="price"] del',
        productName: '.product-name h1, .prd-name, [class*="product"] h1',
        available: '.btn-cart, .btn-buy, [class*="cart"], [class*="buy"]',
        popupClose: '.layer-close, .popup-close, .modal-close, [class*="close"][class*="btn"], .btn-close',
        // W-Concept 특화: Iframe 및 지연 로딩 대응
        iframeSelectors: 'iframe[src*="product"], iframe[name*="detail"]',
        lazyLoadTrigger: '.product-detail, .prd-detail, [class*="detail"]',
    },
    zigzag: {
        price: '[class*="price"] [class*="current"]',
        originalPrice: '[class*="price"] [class*="original"]',
        productName: '[class*="product"] [class*="name"]',
        available: '[class*="buy"], [class*="cart"]',
        popupClose: '[class*="close"], [class*="dismiss"]',
    },
    ssf: {
        price: '.prd_price .price',
        originalPrice: '.prd_price .origin',
        productName: '.prd_name',
        available: '.btn_buy',
        popupClose: '.layer_close, .btn_close',
    },
    ably: {
        price: '[class*="ProductPrice"] [class*="sale"]',
        originalPrice: '[class*="ProductPrice"] [class*="original"]',
        productName: '[class*="ProductName"]',
        available: '[class*="purchase"], [class*="cart"]',
        popupClose: '[class*="CloseButton"], [class*="close"]',
    },
} as const;

// Vision Parser 프롬프트 템플릿 (고도화 V2.5)
// 목표: 소재(Material), 실루엣(Silhouette) 95% 정확도 + 추론 근거
export const VISION_PROMPT_TEMPLATE = `
You are an EXPERT fashion analyst with deep knowledge of materials, silhouettes, and styling.
Your task is to extract PRECISE product data from this shopping page screenshot.

## EXTRACTION TARGETS (in order of priority)

### 1. PRICE DATA (Required)
- **currentPrice**: Final selling price (숫자만, 원/₩ 제거)
- **originalPrice**: Pre-discount price if shown, else null
- **discountRate**: Percentage off if shown

### 2. PRODUCT IDENTITY (Required)
- **productName**: Full product name (Korean preferred)
- **brand**: Brand name if visible
- **available**: true if "구매하기" or similar button is enabled

### 3. MATERIAL ANALYSIS (Critical - 95% accuracy target)
Identify the PRIMARY material from visual cues and text:
- **material**: One of: "cotton", "polyester", "nylon", "wool", "linen", "silk", "leather", "denim", "knit", "fleece", "mixed", "unknown"
- **materialConfidence**: 0-1 (set 0.95+ only if explicitly stated in text)
- **materialDetails**: Raw text if material info is visible (e.g., "면 100%", "폴리에스터 95%")
- **materialEvidence**: Object with source, text, and location of where you found material info

### 4. SILHOUETTE ANALYSIS (Critical - 95% accuracy target)
Classify the garment's shape/form:
- **silhouette**: One of: "fitted", "regular", "relaxed", "oversized", "boxy", "slim", "straight", "wide", "unknown"
- **silhouetteConfidence**: 0-1

### 5. FIT & STYLE (Enhanced)
- **fit**: "slim" | "regular" | "oversized" | "unknown"
- **styleCategory**: "casual", "formal", "streetwear", "athleisure", "classic", "minimal", "unknown"
- **styleScore**: 1-10 (trend alignment, 10 = highly trendy)

### 6. OVERALL CONFIDENCE
- **confidence**: Overall extraction confidence (0-1)
  - 0.95+ : All data clearly visible and extracted
  - 0.80-0.94 : Most data extracted with high certainty
  - 0.70-0.79 : Some inference required
  - <0.70 : Significant uncertainty

## RESPONSE FORMAT (JSON only, no markdown)
{
  "productName": "string",
  "brand": "string | null",
  "price": number,
  "originalPrice": number | null,
  "discountRate": number | null,
  "available": boolean,
  "material": "cotton" | "polyester" | "nylon" | "wool" | "linen" | "silk" | "leather" | "denim" | "knit" | "fleece" | "mixed" | "unknown",
  "materialConfidence": number,
  "materialDetails": "string | null",
  "materialEvidence": {
    "source": "product_description" | "detail_tab" | "image_text" | "spec_table" | "inferred",
    "text": "string (the exact text found)",
    "location": "string (where in the page, e.g., '상세정보 영역', '상품 설명 하단')"
  },
  "silhouette": "fitted" | "regular" | "relaxed" | "oversized" | "boxy" | "slim" | "straight" | "wide" | "unknown",
  "silhouetteConfidence": number,
  "fit": "slim" | "regular" | "oversized" | "unknown",
  "styleCategory": "casual" | "formal" | "streetwear" | "athleisure" | "classic" | "minimal" | "unknown",
  "styleScore": number,
  "confidence": number
}

## RULES
1. Extract prices as NUMBERS (29900, not "29,900원")
2. If material is stated as text (e.g., "면 100%"), set materialConfidence >= 0.95
3. If silhouette is inferred from image only, cap silhouetteConfidence at 0.85
4. Korean text is expected and acceptable
5. Do NOT guess - if uncertain, use "unknown" and lower confidence
6. ALWAYS provide materialEvidence when material is not "unknown"
`.trim();

// 토큰 추정 (이미지 크기 기반)
export const TOKEN_ESTIMATES = {
    BASE_PROMPT: 200,        // 프롬프트 기본 토큰
    IMAGE_PER_PIXEL: 0.0003, // 픽셀당 토큰 (대략)
    RESPONSE_AVERAGE: 150,   // 평균 응답 토큰
} as const;

// Design Tokens 연동 (애니메이션 설정용)
export const AI_UI_TOKENS = {
    loadingDuration: DesignTokens.animation.duration,
    loadingCurve: DesignTokens.animation.curve,
} as const;
