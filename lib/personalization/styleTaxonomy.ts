/**
 * Style taxonomy — the single source of truth for "which brands map to which
 * style" across the app. Before this module, StyleDashboard and StyleProfileCard
 * each carried their own brand→style mapping, and they disagreed (Nike was
 * "Sporty" in one and "Street" in the other), so the app told the same user two
 * different things about their taste. Everything style-related now derives from
 * STYLE_AXES, so the bar chart and the persona card can never contradict.
 */

import type { Product } from '@/types/product';

export interface StylePersona {
    label: string;
    icon: string;
    description: string;
    gradient: string;
}

export interface StyleAxis {
    key: string;
    /** Short label used by the DNA bar chart. */
    label: string;
    /** Tailwind color class for the bar. */
    color: string;
    /** Lowercased brand/title keywords that signal this axis. */
    keywords: string[];
    /** Presentation for the dominant-persona card. */
    persona: StylePersona;
}

export const STYLE_AXES: StyleAxis[] = [
    {
        key: 'minimal',
        label: 'Minimal',
        color: 'bg-stone-800',
        keywords: ['uniqlo', '유니클로', 'cos ', 'muji', '무신사 스탠다드', '무지', 'lemaire', 'a.p.c', 'apc', 'toteme', 'theory'],
        persona: { label: '미니멀리스트', icon: '⬜', description: '군더더기 없는 깔끔함과 기본에 충실한 스타일', gradient: 'from-slate-500 to-slate-700' },
    },
    {
        key: 'street',
        label: 'Street',
        color: 'bg-blue-600',
        keywords: ['supreme', '슈프림', 'stussy', '스투시', 'palace', 'kith', 'carhartt', '카하트', 'new era', 'vans'],
        persona: { label: '스트릿 키드', icon: '🔥', description: '힙한 스트릿 컬처와 스니커즈 문화를 즐기는 스타일', gradient: 'from-orange-500 to-red-500' },
    },
    {
        key: 'sporty',
        label: 'Sporty',
        color: 'bg-green-600',
        keywords: ['nike', '나이키', 'adidas', '아디다스', 'jordan', '조던', 'new balance', '뉴발란스', 'puma', 'asics', '아식스'],
        persona: { label: '스포티 무버', icon: '👟', description: '액티브하고 편안한 스포츠 감성을 즐기는 스타일', gradient: 'from-emerald-500 to-green-600' },
    },
    {
        key: 'gorpcore',
        label: 'Gorpcore',
        color: 'bg-teal-600',
        keywords: ["arc'teryx", 'arcteryx', '아크테릭스', 'salomon', '살로몬', 'north face', '노스페이스', 'patagonia', '파타고니아', 'hoka', 'mammut', 'columbia', 'merrell'],
        persona: { label: '고프코어 마니아', icon: '🏔️', description: '기능성과 패션을 동시에 추구하는 아웃도어 감성', gradient: 'from-green-500 to-teal-600' },
    },
    {
        key: 'luxury',
        label: 'Luxury',
        color: 'bg-purple-700',
        keywords: ['moncler', '몽클레르', 'stone island', '스톤아일랜드', 'polo', 'lacoste', '라코스테', 'loro piana', 'brunello', 'human made', '아더에러', 'ader error'],
        persona: { label: '올드머니 클래식', icon: '🎩', description: '절제된 럭셔리와 타임리스 엘레강스를 추구하는 스타일', gradient: 'from-amber-600 to-yellow-700' },
    },
    {
        key: 'vintage',
        label: 'Vintage',
        color: 'bg-amber-700',
        keywords: ['vintage', '빈티지', "levi's", 'levis', '리바이스', '리바이', 'wrangler', '복고', 'retro'],
        persona: { label: '빈티지 컬렉터', icon: '🕰️', description: '시간이 만든 멋, 레트로 무드를 사랑하는 스타일', gradient: 'from-amber-700 to-orange-800' },
    },
];

export const EXPLORER_PERSONA: StylePersona = {
    label: '패션 탐험가',
    icon: '🌟',
    description: '다양한 스타일을 자유롭게 탐구하는 개성파',
    gradient: 'from-purple-500 to-pink-500',
};

export interface StyleAxisScore {
    key: string;
    label: string;
    color: string;
    /** Relative share 0..100 (top axis = 100). */
    value: number;
}

function countAxes(favorites: readonly Product[]): Map<string, number> {
    const counts = new Map<string, number>();
    for (const fav of favorites) {
        const haystack = [fav?.brand, fav?.title, fav?.category1].filter(Boolean).join(' ').toLowerCase();
        if (!haystack) continue;
        for (const axis of STYLE_AXES) {
            if (axis.keywords.some((keyword) => haystack.includes(keyword))) {
                counts.set(axis.key, (counts.get(axis.key) ?? 0) + 1);
            }
        }
    }
    return counts;
}

/**
 * Score every style axis as a relative share (top axis = 100). Returns an empty
 * array when nothing matched, so callers can render an honest empty state
 * instead of a fabricated profile.
 */
export function scoreStyleAxes(favorites: readonly Product[] | undefined | null): StyleAxisScore[] {
    if (!Array.isArray(favorites) || favorites.length === 0) {
        return [];
    }

    const counts = countAxes(favorites);
    if (counts.size === 0) {
        return [];
    }

    const maxRaw = Math.max(1, ...counts.values());
    return STYLE_AXES.map((axis) => ({
        key: axis.key,
        label: axis.label,
        color: axis.color,
        value: Math.round(((counts.get(axis.key) ?? 0) / maxRaw) * 100),
    })).sort((left, right) => right.value - left.value);
}

/**
 * The single dominant persona, derived from the SAME signal as scoreStyleAxes,
 * so the persona card can never disagree with the bar chart. Ties resolve to the
 * earlier axis in STYLE_AXES order (deterministic).
 */
export function getDominantPersona(favorites: readonly Product[] | undefined | null): StylePersona {
    if (!Array.isArray(favorites) || favorites.length === 0) {
        return EXPLORER_PERSONA;
    }

    const counts = countAxes(favorites);
    if (counts.size === 0) {
        return EXPLORER_PERSONA;
    }

    let topAxis = STYLE_AXES[0];
    let topCount = -1;
    for (const axis of STYLE_AXES) {
        const count = counts.get(axis.key) ?? 0;
        if (count > topCount) {
            topCount = count;
            topAxis = axis;
        }
    }
    return topAxis.persona;
}
