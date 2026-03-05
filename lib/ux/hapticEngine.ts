'use client';

import type { HapticsPlugin, ImpactStyle, NotificationType } from '@capacitor/haptics';

// Web Vibration fallback patterns (ms)
const WEB_PATTERNS: Record<string, number | number[]> = {
    light:   10,
    medium:  40,
    heavy:   70,
    success: [50, 30, 50],
    error:   [50, 100, 50, 100],
};

type HapticType = keyof typeof WEB_PATTERNS;

// Capacitor Haptics — lazy loaded when running in native iOS/Android
type CapHapticsModule = {
    Haptics: HapticsPlugin;
    ImpactStyle: typeof ImpactStyle;
    NotificationType: typeof NotificationType;
};
let capMod: CapHapticsModule | null = null;

if (typeof window !== 'undefined') {
    // Non-blocking: pre-load Capacitor haptics for native platforms
    import('@capacitor/core')
        .then(({ Capacitor }) => {
            if (Capacitor.isNativePlatform()) {
                return import('@capacitor/haptics').then(mod => { capMod = mod as CapHapticsModule; });
            }
        })
        .catch(() => { /* not in Capacitor env — use web vibration */ });
}

class HapticEngine {
    trigger(type: HapticType): void {
        if (typeof window === 'undefined') return;

        // 1. Capacitor native haptics (iOS / Android — precise, no permission needed)
        if (capMod) {
            const { Haptics, ImpactStyle: IS, NotificationType: NT } = capMod;
            try {
                switch (type) {
                    case 'light':   void Haptics.impact({ style: IS.Light });   return;
                    case 'medium':  void Haptics.impact({ style: IS.Medium });  return;
                    case 'heavy':   void Haptics.impact({ style: IS.Heavy });   return;
                    case 'success': void Haptics.notification({ type: NT.Success }); return;
                    case 'error':   void Haptics.notification({ type: NT.Error });   return;
                    default:        void Haptics.impact({ style: IS.Light });   return;
                }
            } catch { /* fall through to web */ }
        }

        // 2. Web Vibration API (Android Chrome PWA, some desktops)
        if ('vibrate' in navigator) {
            try { navigator.vibrate(WEB_PATTERNS[type]); } catch { /* ignore */ }
        }
    }
}

export const haptics = new HapticEngine();
