/**
 * Aesthetic Engine
 * 디자인 인텔리전스 코어.
 * 색상 분석을 통해 최적의 텍스트 대비색과 프리미엄 그라디언트를 생성.
 */

export const AestheticEngine = {
    /**
     * Get Optimal Text Color (Black or White) based on background hex
     */
    getOptimalContrast: (hexColor: string): 'black' | 'white' => {
        const r = parseInt(hexColor.substr(1, 2), 16);
        const g = parseInt(hexColor.substr(3, 2), 16);
        const b = parseInt(hexColor.substr(5, 2), 16);

        // YIQ Equation for brightness
        const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
        return (yiq >= 128) ? 'black' : 'white';
    },

    /**
     * Generate Premium Gradient
     * Creates a subtle, elegant gradient based on a seed color.
     */
    generateGradient: (baseHex: string): string => {
        // Simplified logic: Create a linear gradient with a slight hue shift
        // In a real engine, we would use HSL manipulation
        return `linear-gradient(135deg, ${baseHex} 0%, #000000 100%)`;
    },

    /**
     * Get Reliability Color
     * Maps a trust score (0-100) to a semantic color.
     */
    getTrustColor: (score: number): string => {
        if (score >= 90) return '#10B981'; // Emerald 500
        if (score >= 70) return '#3B82F6'; // Blue 500
        if (score >= 50) return '#F59E0B'; // Amber 500
        return '#EF4444'; // Red 500
    }
};
