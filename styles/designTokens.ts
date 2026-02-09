/**
 * Design Tokens (Premium Rebranding)
 * Theme: Deep Charcoal & Minimal White (29CM/SSENSE Style)
 */

import { PremiumTheme } from './premiumTheme';

export const designTokens = {
    colors: {
        ...PremiumTheme.colors,
        // Backward Compatibility
        surfaceHover: PremiumTheme.colors.secondary,
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#06b6d4',
        primaryHover: '#333333', // Darker charcoal
    },

    spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '80px',
        grid: (n: number) => `${n * 8}px`,
    },

    borderRadius: {
        none: '0px',
        sm: '2px', // Sharper edges for premium feel
        md: '4px',
        lg: '8px',
        full: '9999px',
    },

    typography: PremiumTheme.typography,

    shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: PremiumTheme.effects.shadow,
        lg: '0 10px 30px rgba(0,0,0,0.08)',
        hover: '0 20px 40px rgba(0,0,0,0.12)',
        // Backward Compatibility
        glow: '0 0 15px rgba(0, 0, 0, 0.1)', // Subtle dark glow
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.05)', // Subtle glass
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
        duration: '0.4s',
        curve: 'cubic-bezier(0.2, 0.0, 0.2, 1)', // Smooth architectural motion
        scale: 'scale(1.01)',
    },

    effects: PremiumTheme.effects
};
