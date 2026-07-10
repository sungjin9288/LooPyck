import { Logger, toErrorMessage } from '@/lib/core/observability';
/**
 * Native Bridge for iOS/Android WebViews
 * Handles safe execution of native app features like haptics when wrapped in a WebView.
 */

declare global {
    interface Window {
        webkit?: {
            messageHandlers?: {
                hapticFallback?: {
                    postMessage: (message: string) => void;
                };
                [key: string]: any;
            };
        };
    }
}

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Triggers haptic feedback.
 * 1. Checks if running inside an iOS WebView that has a `hapticFallback` message handler.
 * 2. If not, falls back to `navigator.vibrate` for Android and supported web browsers.
 */
export const triggerHaptic = (type: HapticFeedbackType = 'light') => {
    if (typeof window === 'undefined') return;

    // 1. Try iOS WebView Javascript Bridge
    if (window.webkit?.messageHandlers?.hapticFallback) {
        try {
            window.webkit.messageHandlers.hapticFallback.postMessage(type);
            return;
        } catch (error) {
            Logger.warn('Native haptic bridge failed', { error: toErrorMessage(error) });
        }
    }

    // 2. Fallback to web vibration API (mostly Android)
    if ('vibrate' in navigator) {
        switch (type) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(20);
                break;
            case 'heavy':
                navigator.vibrate(30);
                break;
            case 'success':
                navigator.vibrate([10, 30, 10]);
                break;
            case 'error':
                navigator.vibrate([20, 40, 20]);
                break;
            default:
                navigator.vibrate(10);
        }
    }
};
