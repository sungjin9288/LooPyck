'use client';

// Haptic Patterns (Milliseconds)
const PATTERNS = {
    light: 10, // Subtle tick
    medium: 40, // Standard click
    heavy: 70, // Firm press
    success: [50, 30, 50], // Double tap
    error: [50, 100, 50, 100], // Buzz buzz
};

// Sound Assets (Base64 or URL could be used here, but for simplicity we rely on Haptics primarily)
// We'll simulate a mechanical click sound if needed later.

class HapticEngine {
    private enabled: boolean = true;

    constructor() {
        if (typeof window !== 'undefined' && !window.navigator.vibrate) {
            this.enabled = false;
        }
    }

    trigger(type: keyof typeof PATTERNS) {
        if (!this.enabled || typeof window === 'undefined') return;

        try {
            const pattern = PATTERNS[type];
            window.navigator.vibrate(pattern);
        } catch (e) {
            // Ignore if vibration is blocked or unsupported
        }
    }

    // Optional: Add sound method here
    playClick() {
        // Implementation for click sound
    }
}

export const haptics = new HapticEngine();
