/**
 * Premium Theme (Rebranding)
 * 29CM/SSENSE Inspired 'Deep Charcoal & Minimal White'
 */

export const PremiumTheme = {
    colors: {
        background: '#FFFFFF',
        surface: '#FFFFFF',
        textPrimary: '#000000', // Jet Black
        textSecondary: '#4A4A4A', // Deep Gray
        textTertiary: '#888888', // Soft Gray
        border: '#E5E5E5',

        primary: '#1A1A1A', // Deep Charcoal (Brand Color)
        secondary: '#F4F4F4', // Light Gray for hovers
        accent: '#FF4800', // Minimal Accent (Orange-Red) for CTAs
    },
    typography: {
        fontFamily: '"Pretendard", "Inter", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
        headers: {
            h1: { fontSize: '2.5rem', fontWeight: 700, letterSpacing: '-0.02em', lineHeight: '1.2' },
            h2: { fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: '1.3' },
            h3: { fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.01em', lineHeight: '1.4' },
        },
        body: {
            large: { fontSize: '1.125rem', lineHeight: '1.6' },
            base: { fontSize: '1rem', lineHeight: '1.5' },
            small: { fontSize: '0.875rem', lineHeight: '1.4' },
        }
    },
    layout: {
        maxWidth: '1440px', // Wider layout for editorial feel
        gridGap: '20px',
        containerPadding: '40px',
    },
    effects: {
        shadow: '0 4px 20px rgba(0, 0, 0, 0.05)', // Softer shadow
        hoverTransform: 'translateY(-2px)',
        transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
        glass: 'rgba(255, 255, 255, 0.8)',
    }
};

// Fallback compatibility with existing designTokens structure if needed
export const designTokens = {
    colors: PremiumTheme.colors,
    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '40px',
        section: '80px',
    },
    breakpoints: {
        mobile: '320px',
        tablet: '768px',
        desktop: '1024px',
        wide: '1440px'
    }
};
