import { CapacitorConfig } from '@capacitor/cli';
import { loadEnvConfig } from '@next/env';
import { resolveCapacitorAppId, resolveCapacitorAppName, resolveCapacitorServerUrl } from './lib/config/appConfig';

loadEnvConfig(process.cwd());

/**
 * Capacitor 설정 — Remote URL 방식
 *
 * next.config.js의 output: 'standalone'을 유지하면서
 * Vercel에 배포된 웹앱을 네이티브 WebView로 로드합니다.
 * - API 라우트 / Firebase / Gemini 등 서버 기능 그대로 동작
 * - 앱 업데이트 시 App Store 재심사 불필요 (서버 코드 변경 한정)
 */
const config: CapacitorConfig = {
    appId: resolveCapacitorAppId(),
    appName: resolveCapacitorAppName(),
    webDir: 'public', // server.url 사용 시 실제론 무시됨
    server: {
        url: resolveCapacitorServerUrl(),
        cleartext: false,
    },
    ios: {
        contentInset: 'always',
        preferredContentMode: 'mobile',
        scrollEnabled: true,
        allowsLinkPreview: false,
    },
    android: {
        allowMixedContent: false,
        captureInput: true,
    },
    plugins: {
        PushNotifications: {
            presentationOptions: ['badge', 'sound', 'alert'],
        },
        SplashScreen: {
            launchShowDuration: 1500,
            launchAutoHide: true,
            backgroundColor: '#000000',
            showSpinner: false,
        },
        StatusBar: {
            style: 'DEFAULT',
            backgroundColor: '#000000',
        },
    },
};

export default config;
