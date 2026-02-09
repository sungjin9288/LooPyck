/**
 * Viral Tracker
 * 공유 및 유입(Referral) 성과를 추적하여 K-Factor를 분석.
 */

import { Logger } from '../core/observability';

const REFERRAL_KEY = 'loopyck_ref_source';

export const ViralTracker = {
    // 공유 이벤트 추적
    trackShare: (platform: 'kakao' | 'instagram' | 'copy', contentType: string) => {
        Logger.info('Viral Share Event', {
            event: 'share',
            platform,
            content: contentType,
            timestamp: Date.now()
        });

        // In a real app, send to GA4 or Amplitude here
    },

    // 유입 추적 (URL 쿼리 파라미터 등에서 호출)
    trackReferral: () => {
        if (typeof window === 'undefined') return;

        const params = new URLSearchParams(window.location.search);
        const ref = params.get('ref');

        if (ref) {
            localStorage.setItem(REFERRAL_KEY, ref);
            Logger.info('Referral Visit', {
                event: 'referral_landing',
                source: ref
            });
        }
    },

    // 획득(가입/구매) 시 기여 추적
    getAttribution: (): string | null => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem(REFERRAL_KEY);
    }
};
