import { designTokens } from '@/styles/designTokens';

export type Mood = 'default' | 'lovely' | 'chic' | 'casual' | 'minimal' | 'luxury';

interface ThemeColors {
    primary: string;
    background: string;
    surface: string;
}

const MOOD_THEMES: Record<Mood, ThemeColors> = {
    default: {
        primary: designTokens.colors.primary, // Blue 500
        background: '#0f172a', // Slate 900
        surface: '#1e293b',    // Slate 800
    },
    lovely: {
        primary: '#ec4899', // Pink 500
        background: '#fff1f2', // Rose 50
        surface: '#ffe4e6',    // Rose 100
    },
    chic: {
        primary: '#171717', // Neutral 900
        background: '#ffffff', // White
        surface: '#f5f5f5',    // Neutral 100
    },
    casual: {
        primary: '#f59e0b', // Amber 500
        background: '#fffbeb', // Amber 50
        surface: '#fef3c7',    // Amber 100
    },
    minimal: {
        primary: '#475569', // Slate 600
        background: '#f8fafc', // Slate 50
        surface: '#ffffff',    // White
    },
    luxury: {
        primary: '#d4af37', // Gold
        background: '#1c1917', // Stone 900
        surface: '#292524',    // Stone 800
    }
};

// 키워드 매핑
const KEYWORD_MAP: Record<string, Mood> = {
    '원피스': 'lovely',
    '스커트': 'lovely',
    '블라우스': 'lovely',
    '핑크': 'lovely',
    '자켓': 'chic',
    '코트': 'chic',
    '부츠': 'chic',
    '블랙': 'chic',
    '후드': 'casual',
    '맨투맨': 'casual',
    '패딩': 'casual',
    '셔츠': 'minimal',
    '슬랙스': 'minimal',
    '구찌': 'luxury',
    '샤넬': 'luxury',
    '명품': 'luxury',
};

export function analyzeMood(keyword: string): Mood {
    const lowerKeyword = keyword.toLowerCase();

    // 1. Exact/Partial Match
    for (const [key, mood] of Object.entries(KEYWORD_MAP)) {
        if (lowerKeyword.includes(key)) return mood;
    }

    // 2. Default
    return 'default';
}

export function applyTheme(mood: Mood) {
    if (typeof document === 'undefined') return;

    const theme = MOOD_THEMES[mood];
    const root = document.documentElement;

    // Transition effect
    root.style.transition = 'background-color 0.5s ease, color 0.5s ease';

    // CSS Variables Update (가정: globals.css에서 이 변수들을 사용하고 있어야 함)
    // 하지만 현재는 designTokens.ts를 직접 쓰고 있으므로, 
    // 이 방식으로는 designTokens 값을 바꿀 수 없음.
    // 대안: CSS Variable을 사용하는 방식으로 변경하거나, 
    // React Context로 테마를 전파해야 함.

    // Phase 18 시간 제약상, document body background 변경 등 간단한 시각 효과만 적용
    // 혹은 CSS Filter를 활용.

    // Set Custom Properties for specialized components aware of them
    root.style.setProperty('--theme-primary', theme.primary);
    root.style.setProperty('--theme-background', theme.background);
    root.style.setProperty('--theme-surface', theme.surface);
}

export function getThemeColors(mood: Mood): ThemeColors {
    return MOOD_THEMES[mood];
}
