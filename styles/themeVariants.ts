/**
 * Theme Variants
 * 유저 심리에 맞춘 3가지 디자인 모드 정의.
 */

export type ThemeMode = 'minimal' | 'informative' | 'bold';

export const ThemePresets: Record<ThemeMode, Record<string, string>> = {
    minimal: {
        '--font-primary': '"Inter", sans-serif',
        '--spacing-unit': '1.5rem',
        '--border-radius': '0px', // Sharp edges
        '--information-density': 'low',
        '--accent-color': '#FFFFFF'
    },
    informative: {
        '--font-primary': '"Roboto", sans-serif',
        '--spacing-unit': '1rem', // Tighter spacing
        '--border-radius': '8px',
        '--information-density': 'high',
        '--accent-color': '#3B82F6' // Trust Blue
    },
    bold: {
        '--font-primary': '"Oswald", sans-serif', // Strong typographic
        '--spacing-unit': '2rem',
        '--border-radius': '24px', // Soft edges
        '--information-density': 'medium',
        '--accent-color': '#F43F5E' // Passionate Red
    }
};

export const applyTheme = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;

    const theme = ThemePresets[mode];
    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]) => {
        root.style.setProperty(key, value);
    });
};
