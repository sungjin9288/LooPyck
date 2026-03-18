import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * Apps in Toss (앱인토스) 설정
 * WebView 방식: 토스 앱이 Netlify 호스팅 URL을 WebView로 로드
 */
export default defineConfig({
    appName: 'LooPyck',
    brand: {
        displayName: 'LooPyck',
        primaryColor: '#000000',
        icon: 'https://loo-pyck.netlify.app/icons/icon-192x192.png',
    },
    permissions: [],
    web: {
        host: 'localhost',
        port: 3000,
        commands: {
            dev: 'npm run dev',
            build: 'npm run build',
        },
    },
    webViewProps: {
        type: 'partner',
        pullToRefreshEnabled: true,
        allowsBackForwardNavigationGestures: false,
    },
    outdir: 'dist',
});
