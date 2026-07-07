'use client';

import { Logger } from '@/lib/core/observability';
import { isTossWebView } from './tossWebView';

/**
 * Toss 네이티브 공유 시트 실행기 — @apps-in-toss/web-framework의 share()를
 * 동적 임포트로 호출한다(tdsMobile.ts와 같은 graceful 폴백 패턴).
 * 성공 시 true, Toss 환경이 아니거나 브릿지 호출 실패 시 false를 반환해
 * 호출부가 웹 공유/클립보드로 폴백할 수 있게 한다.
 */
export async function shareViaToss(message: string): Promise<boolean> {
    if (!isTossWebView()) return false;

    try {
        const { share } = await import('@apps-in-toss/web-framework');
        await share({ message });
        return true;
    } catch (error: unknown) {
        Logger.warn('Toss 공유 브릿지 호출 실패 — 웹 폴백으로 전환', {
            error: error instanceof Error ? error.message : String(error ?? ''),
        });
        return false;
    }
}
