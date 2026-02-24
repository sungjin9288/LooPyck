/**
 * PWA Configuration
 * 모바일 웹앱 경험을 위한 설정 생성기.
 */

export const PWAConfig = {
    manifest: {
        name: 'LooPyck - AI Fashion Search',
        short_name: 'LooPyck',
        description: 'Multi-Source Fashion Price Comparison & AI Curation',
        start_url: '/',
        display: 'standalone',
        background_color: '#FFFFFF',
        theme_color: '#1A1A1A',
        icons: [
            {
                src: '/icons/icon-192x192.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
            },
            {
                src: '/icons/icon-512x512.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
            }
        ]
    },
    viewport: {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false, // App-like feel (prevent zoom)
        viewportFit: 'cover'
    }
};

export function getPWAMetaTags() {
    return {
        'application-name': 'LooPyck',
        'apple-mobile-web-app-capable': 'yes',
        'apple-mobile-web-app-status-bar-style': 'default',
        'apple-mobile-web-app-title': 'LooPyck',
        'format-detection': {
            telephone: false
        },
        'mobile-web-app-capable': 'yes',
        'theme-color': '#1A1A1A'
    };
}
