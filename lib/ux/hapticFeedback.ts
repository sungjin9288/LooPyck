/**
 * Haptic Feedback Utility
 * Web Vibration API Wrapper for Mobile UX
 */

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning';

const PATTERNS: Record<HapticType, number | number[]> = {
    light: 5,            // Very short tap
    medium: 10,          // Regular tap
    heavy: 20,           // Strong tap
    success: [10, 30, 10], // Double tap
    error: [10, 30, 10, 30, 50], // Error buzz
    warning: [30, 50, 10],
};

export const haptics = {
    isSupported: typeof navigator !== 'undefined' && 'vibrate' in navigator,

    trigger: (type: HapticType = 'light') => {
        if (typeof navigator === 'undefined' || !navigator.vibrate) return;

        try {
            navigator.vibrate(PATTERNS[type]);
        } catch (e) {
            // Ignore errors in environments where vibration is blocked
        }
    },

    // Convenience methods
    tap: () => haptics.trigger('light'),
    press: () => haptics.trigger('medium'),
    impact: () => haptics.trigger('heavy'),
    success: () => haptics.trigger('success'),
    error: () => haptics.trigger('error'),
};
