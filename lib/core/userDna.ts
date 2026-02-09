/**
 * User DNA Profiling System
 * 사용자의 행동(View, Like, Cart)을 분석하여 선호 스타일 점수를 계산.
 * Privacy-First: 로컬 스토리지 기반, 익명 데이터 처리.
 */

export interface StyleProfile {
    minimal: number;
    street: number;
    luxury: number;
    casual: number;
    sporty: number;
    vintage: number;
    lastUpdated: number;
}

const INITIAL_PROFILE: StyleProfile = {
    minimal: 0,
    street: 0,
    luxury: 0,
    casual: 0,
    sporty: 0,
    vintage: 0,
    lastUpdated: Date.now(),
};

const STORAGE_KEY = 'loopyck_user_dna_v1';

export const UserDna = {
    // 프로필 로드
    getProfile: (): StyleProfile => {
        if (typeof window === 'undefined') return INITIAL_PROFILE;
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : INITIAL_PROFILE;
    },

    // 상호작용 추적 및 점수 업데이트
    trackInteraction: (tags: string[], weight: number = 1) => {
        if (typeof window === 'undefined') return;

        const profile = UserDna.getProfile();
        let updated = false;

        tags.forEach(tag => {
            const normalizedTag = tag.toLowerCase();
            if (normalizedTag in profile) {
                // @ts-ignore - dynamic key access
                profile[normalizedTag] += weight;
                updated = true;
            }
        });

        if (updated) {
            profile.lastUpdated = Date.now();
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        }
    },

    // 상위 선호 스타일 반환
    getTopStyles: (limit: number = 3): string[] => {
        const profile = UserDna.getProfile();
        const entries = Object.entries(profile).filter(([key]) => key !== 'lastUpdated');

        // 점수 기준 내림차순 정렬
        return entries
            .sort(([, a], [, b]) => b - a)
            .slice(0, limit)
            .map(([key]) => key);
    }
};
