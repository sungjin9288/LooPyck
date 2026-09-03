import { defineConfig } from '@apps-in-toss/web-framework/config';

/**
 * Apps in Toss (앱인토스) 설정
 * SDK dev/runtime bridge 설정이다. `ait build`는 CSR/SSG index.html output을
 * 요구하므로 Next standalone 배포와는 별도 static mini-app architecture가 필요하다.
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
