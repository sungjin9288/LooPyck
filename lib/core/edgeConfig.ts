/**
 * Global Edge Configuration
 * Vercel Edge Functions 및 CDN 캐싱 전략을 정의합니다.
 */

// Edge Region Config
export const EDGE_REGIONS = [
    'icn1', // Seoul
    'hnd1', // Tokyo
    'sfo1', // San Francisco
    'iad1', // Washington DC
    'lhr1', // London
];

export const CACHE_STRATEGIES = {
    STATIC_ASSETS: 'public, max-age=31536000, immutable',
    API_RESPONSES: 'public, s-maxage=60, stale-while-revalidate=300', // ISR Pattern
    REALTIME_DATA: 'public, max-age=0, s-maxage=1', // Do not cache at edge if strictly realtime
};

/**
 * 사용자 위치에 따른 통화 코드 반환 (Mock GeoIP)
 */
export function getCurrencyFormRegion(regionCode: string): string {
    const map: Record<string, string> = {
        'KR': 'KRW',
        'US': 'USD',
        'JP': 'JPY',
        'EU': 'EUR'
    };
    return map[regionCode] || 'KRW';
}
