/**
 * Analytics Layer - Firebase Analytics 기반 이벤트 추적
 * 익명성 보장, 핵심 이벤트만 수집
 */

// Analytics 이벤트 타입
export type AnalyticsEvent =
    | 'search'
    | 'ai_recommendation_view'
    | 'ai_recommendation_click'
    | 'wishlist_add'
    | 'wishlist_remove'
    | 'product_view'
    | 'chat_open'
    | 'chat_message'
    | 'price_compare'
    // Funnel 이벤트
    | 'funnel_search'
    | 'funnel_ai_analysis'
    | 'funnel_recommendation_click'
    | 'funnel_external_redirect'
    | 'funnel_drop_off';

// 이벤트 파라미터, 익명 데이터만
export interface EventParams {
    // 검색
    search_query?: string;
    search_results_count?: number;

    // 추천
    recommendation_score?: number;
    recommendation_position?: number;

    // 상품
    product_category?: string;
    product_price_range?: string;
    product_mall?: string;

    // 채팅
    chat_query_type?: string;
    chat_response_time_ms?: number;

    // 공통
    session_duration_ms?: number;
    page_path?: string;
}

// 가격대 분류
function getPriceRange(price: number): string {
    if (price < 30000) return 'under_30k';
    if (price < 50000) return '30k_50k';
    if (price < 100000) return '50k_100k';
    if (price < 200000) return '100k_200k';
    return 'over_200k';
}

// Firebase Analytics는 클라이언트에서만 사용
let analytics: ReturnType<typeof import('firebase/analytics').getAnalytics> | null = null;
let logEventFn: typeof import('firebase/analytics').logEvent | null = null;

/**
 * Analytics 초기화 (클라이언트 전용)
 */
export async function initAnalytics(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
        const { getAnalytics, logEvent } = await import('firebase/analytics');
        const { getApps } = await import('firebase/app');

        if (getApps().length > 0) {
            analytics = getAnalytics();
            logEventFn = logEvent;
            console.log('[Analytics] Initialized');
        }
    } catch (error) {
        console.warn('[Analytics] Init failed:', error);
    }
}

/**
 * 이벤트 로깅 (클라이언트 전용)
 */
export function trackEvent(event: AnalyticsEvent, params?: EventParams): void {
    // 서버 사이드에서는 무시
    if (typeof window === 'undefined') return;

    // 개발 모드에서는 콘솔 로그만
    if (process.env.NODE_ENV === 'development') {
        console.log(`[Analytics] ${event}`, params);
        return;
    }

    // 프로덕션에서 Firebase로 전송
    if (analytics && logEventFn) {
        try {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            logEventFn(analytics, event as any, params as any);
        } catch (error) {
            console.warn('[Analytics] Track failed:', error);
        }
    }
}

/**
 * 검색 이벤트
 */
export function trackSearch(query: string, resultsCount: number): void {
    trackEvent('search', {
        search_query: query.slice(0, 50), // 길이 제한
        search_results_count: resultsCount,
    });
}

/**
 * AI 추천 노출
 */
export function trackRecommendationView(score: number, position: number): void {
    trackEvent('ai_recommendation_view', {
        recommendation_score: score,
        recommendation_position: position,
    });
}

/**
 * AI 추천 클릭
 */
export function trackRecommendationClick(score: number, position: number, mall: string): void {
    trackEvent('ai_recommendation_click', {
        recommendation_score: score,
        recommendation_position: position,
        product_mall: mall,
    });
}

/**
 * 찜하기
 */
export function trackWishlistAdd(price: number, category: string, mall: string): void {
    trackEvent('wishlist_add', {
        product_price_range: getPriceRange(price),
        product_category: category,
        product_mall: mall,
    });
}

/**
 * 찜 해제
 */
export function trackWishlistRemove(): void {
    trackEvent('wishlist_remove');
}

/**
 * 상품 상세 보기
 */
export function trackProductView(price: number, category: string, mall: string): void {
    trackEvent('product_view', {
        product_price_range: getPriceRange(price),
        product_category: category,
        product_mall: mall,
    });
}

/**
 * 채팅창 열기
 */
export function trackChatOpen(): void {
    trackEvent('chat_open');
}

/**
 * 채팅 메시지
 */
export function trackChatMessage(queryType: string, responseTimeMs: number): void {
    trackEvent('chat_message', {
        chat_query_type: queryType,
        chat_response_time_ms: responseTimeMs,
    });
}

/**
 * 가격 비교
 */
export function trackPriceCompare(mall: string): void {
    trackEvent('price_compare', {
        product_mall: mall,
    });
}

// ========== Funnel Analytics ==========

// 세션 ID 생성/관리
let currentSessionId: string | null = null;

function getSessionId(): string {
    if (!currentSessionId) {
        currentSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    return currentSessionId;
}

/**
 * Funnel - 검색 시작
 */
export function trackFunnelSearch(query: string): void {
    trackEvent('funnel_search' as AnalyticsEvent, {
        search_query: query.slice(0, 50),
        page_path: typeof window !== 'undefined' ? window.location.pathname : '',
    });
}

/**
 * Funnel - AI 분석 요청
 */
export function trackFunnelAIAnalysis(resultsCount: number): void {
    trackEvent('funnel_ai_analysis' as AnalyticsEvent, {
        search_results_count: resultsCount,
    });
}

/**
 * Funnel - 추천 클릭
 */
export function trackFunnelRecommendationClick(score: number, position: number, mall: string): void {
    trackEvent('funnel_recommendation_click' as AnalyticsEvent, {
        recommendation_score: score,
        recommendation_position: position,
        product_mall: mall,
    });
}

/**
 * Funnel - 외부 쇼핑몰 이동
 */
export function trackFunnelExternalRedirect(mall: string, price: number): void {
    trackEvent('funnel_external_redirect' as AnalyticsEvent, {
        product_mall: mall,
        product_price_range: getPriceRange(price),
    });
}

// Drop-off 원인
export type DropOffReason =
    | 'no_results'
    | 'low_relevance'
    | 'high_price'
    | 'page_leave'
    | 'timeout'
    | 'error';

/**
 * Funnel - Drop-off (이탈) 추적
 */
export function trackFunnelDropOff(
    step: 'search' | 'ai_analysis' | 'recommendation' | 'redirect',
    reason: DropOffReason
): void {
    trackEvent('funnel_drop_off' as AnalyticsEvent, {
        page_path: step,
        chat_query_type: reason, // 재활용
    });
}

// 내보내기
export const analytics_api = {
    init: initAnalytics,
    track: trackEvent,
    search: trackSearch,
    recommendationView: trackRecommendationView,
    recommendationClick: trackRecommendationClick,
    wishlistAdd: trackWishlistAdd,
    wishlistRemove: trackWishlistRemove,
    productView: trackProductView,
    chatOpen: trackChatOpen,
    chatMessage: trackChatMessage,
    priceCompare: trackPriceCompare,
    // Funnel
    funnel: {
        search: trackFunnelSearch,
        aiAnalysis: trackFunnelAIAnalysis,
        recommendationClick: trackFunnelRecommendationClick,
        externalRedirect: trackFunnelExternalRedirect,
        dropOff: trackFunnelDropOff,
        getSessionId,
    },
};
