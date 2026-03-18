/**
 * 토스 WebView 환경 감지 유틸
 * Apps in Toss WebView 안에서 실행 중인지 판단하여
 * TDS 컴포넌트 사용 여부를 결정합니다.
 */

/**
 * 현재 토스 앱 WebView 안에서 실행 중인지 확인
 */
export function isTossWebView(): boolean {
    if (typeof window === 'undefined') return false;

    // 토스 앱 WebView는 User-Agent에 'toss' 포함
    const ua = navigator.userAgent.toLowerCase();
    if (ua.includes('toss')) return true;

    // Apps in Toss SDK가 주입하는 전역 객체
    if ('__TOSS_APP__' in window) return true;
    if ('TossApp' in window) return true;

    return false;
}

/**
 * 토스 WebView 여부를 반환하는 React 훅
 */
export function useIsTossWebView(): boolean {
    if (typeof window === 'undefined') return false;
    return isTossWebView();
}
