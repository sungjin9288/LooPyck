/**
 * 토스 WebView 환경 감지 유틸
 * Apps in Toss WebView 안에서 실행 중인지 판단하여
 * TDS 컴포넌트 사용 여부를 결정합니다.
 *
 * 판별이 틀리면 iOS에서 UI가 깨지므로(잘못된 컴포넌트 분기), 순수 판별
 * 로직을 분리해 단위 테스트로 회귀를 막는다.
 */

/**
 * 토스 WebView 여부를 순수하게 판별한다(navigator/window에 의존하지 않음).
 * - User-Agent에 'toss'가 포함되거나
 * - Apps in Toss SDK가 주입하는 전역 객체(`__TOSS_APP__` / `TossApp`)가 있으면 true.
 *
 * @param userAgent    navigator.userAgent (없으면 빈 문자열 취급)
 * @param hasTossGlobal 토스 전역 객체 주입 여부
 */
export function detectTossWebView(
    userAgent: string | null | undefined,
    hasTossGlobal = false
): boolean {
    if (hasTossGlobal) return true;
    const ua = (userAgent ?? '').toLowerCase();
    return ua.includes('toss');
}

/**
 * 현재 토스 앱 WebView 안에서 실행 중인지 확인
 */
export function isTossWebView(): boolean {
    if (typeof window === 'undefined') return false;

    const hasTossGlobal = '__TOSS_APP__' in window || 'TossApp' in window;
    return detectTossWebView(navigator.userAgent, hasTossGlobal);
}

/**
 * 토스 WebView 여부를 반환하는 React 훅
 */
export function useIsTossWebView(): boolean {
    if (typeof window === 'undefined') return false;
    return isTossWebView();
}
