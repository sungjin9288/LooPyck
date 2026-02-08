/**
 * Design Tokens
 * WCAG 2.1 Compliant Colors, 8px Grid System, Typography Scale
 */

export const designTokens = {
    colors: {
        // Semantic Colors (WCAG AA+ Contrast)
        primary: '#3b82f6', // Blue 500
        primaryHover: '#2563eb',
        success: '#10b981', // Emerald 500
        warning: '#f59e0b', // Amber 500
        error: '#ef4444',   // Red 500
        info: '#06b6d4',    // Cyan 500

        // Neutral Scale (Deep Charcoal Theme)
        background: '#121212', // Deep Charcoal (OLED Optimized)
        surface: '#1E1E1E',    // Slightly lighter for contrast
        surfaceHover: '#2A2A2A',
        border: '#334155',     // Slate 700

        // Text Colors
        textPrimary: '#EDEDED',   // Off-white (Reduced Eye Strain)
        textSecondary: '#A1A1AA', // Zinc 400
        textTertiary: '#71717A',  // Zinc 500
    },

    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        grid: (n: number) => `${n * 8}px`,
    },

    borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        xl: '16px',
        full: '9999px',
    },

    typography: {
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        h1: { fontSize: '32px', lineHeight: '40px', fontWeight: 700 }, // Mobile 32, Desktop 48
        h2: { fontSize: '24px', lineHeight: '32px', fontWeight: 700 },
        h3: { fontSize: '20px', lineHeight: '28px', fontWeight: 600 },
        body1: { fontSize: '16px', lineHeight: '24px', fontWeight: 400 },
        body2: { fontSize: '14px', lineHeight: '20px', fontWeight: 400 },
        caption: { fontSize: '12px', lineHeight: '16px', fontWeight: 400 },
        button: { fontSize: '14px', lineHeight: '20px', fontWeight: 600, letterSpacing: '0.02em' },
    },

    shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        glow: '0 0 15px rgba(59, 130, 246, 0.5)', // Primary Glow
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', // Glassmorphism 2.0
    },

    zIndex: {
        toast: 5000,
        modal: 4000,
        overlay: 3000,
        drawer: 3000,
        appBar: 2000,
        fab: 1500,
    },

    animation: {
        duration: '0.3s',
        curve: 'cubic-bezier(0.4, 0, 0.2, 1)',
        scale: 'scale(1.02)',
    },
};
