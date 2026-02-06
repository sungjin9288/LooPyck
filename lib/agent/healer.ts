import { HEALER_CONFIG, MALL_SELECTORS } from '../ai/config';
import type { HealerScenario } from '@/types/aiExtraction';

// 복구 결과 타입
interface HealingResult {
    success: boolean;
    scenario: HealerScenario;
    action: string;
    retryCount: number;
    error?: string;
}

// 복구 옵션
interface HealingOptions {
    maxRetries?: number;
    retryDelay?: number;
    onRetry?: (attempt: number, scenario: HealerScenario) => void;
    mall?: keyof typeof MALL_SELECTORS; // 쇼핑몰 힌트
}

// 실패 기록 (lessons 시스템용)
export interface FailureRecord {
    url: string;
    timestamp: Date;
    scenario: HealerScenario;
    prompt?: string;
    screenshotPath?: string;
    error: string;
    resolution?: string;
}

// 실패 기록 저장소
const failureLog: FailureRecord[] = [];

/**
 * 실패 기록 추가 (lessons 시스템)
 */
export function recordFailure(record: FailureRecord): void {
    failureLog.push(record);
    console.log(`[Healer] Failure recorded: ${record.scenario} at ${record.url}`);
}

/**
 * 실패 기록 조회
 */
export function getFailureLog(): FailureRecord[] {
    return [...failureLog];
}

/**
 * 실패 기록 내보내기 (lessons.md 업데이트용)
 */
export function exportFailuresForLessons(): string {
    if (failureLog.length === 0) return '';

    const lines = ['## Healer Failure Log\n'];

    for (const record of failureLog.slice(-10)) { // 최근 10개만
        lines.push(`### ${record.timestamp.toISOString().split('T')[0]}`);
        lines.push(`- **URL**: ${record.url}`);
        lines.push(`- **Scenario**: ${record.scenario}`);
        lines.push(`- **Error**: ${record.error}`);
        if (record.prompt) {
            lines.push(`- **Prompt (truncated)**: ${record.prompt.substring(0, 200)}...`);
        }
        if (record.resolution) {
            lines.push(`- **Resolution**: ${record.resolution}`);
        }
        lines.push('');
    }

    return lines.join('\n');
}

/**
 * 팝업/모달 닫기 시도 (쇼핑몰별 셀렉터 지원)
 */
export function tryClosePopup(document: Document, mall?: keyof typeof MALL_SELECTORS): boolean {
    // 쇼핑몰별 전용 셀렉터 우선
    const mallSpecificSelectors: string[] = [];
    if (mall && MALL_SELECTORS[mall]?.popupClose) {
        mallSpecificSelectors.push(...MALL_SELECTORS[mall].popupClose.split(', '));
    }

    // 일반적인 팝업 닫기 버튼 셀렉터들
    const genericSelectors = [
        '[class*="close"]',
        '[class*="modal"] button',
        '[aria-label="Close"]',
        '[aria-label="닫기"]',
        '.popup-close',
        '.modal-close',
        '#close-btn',
        'button[class*="cancel"]',
        '[class*="layer"] [class*="close"]',
        '[class*="dismiss"]',
    ];

    const allSelectors = [...mallSpecificSelectors, ...genericSelectors];

    for (const selector of allSelectors) {
        try {
            const closeBtn = document.querySelector<HTMLElement>(selector);
            if (closeBtn && closeBtn.offsetParent !== null) { // 보이는 요소인지 확인
                closeBtn.click();
                console.log('[Healer] Closed popup via:', selector);
                return true;
            }
        } catch {
            continue;
        }
    }

    // ESC 키 시뮬레이션
    try {
        const escEvent = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
            bubbles: true,
        });
        document.dispatchEvent(escEvent);
        console.log('[Healer] Sent ESC key event');
        return true;
    } catch (error) {
        console.error('[Healer] ESC key failed:', error);
        return false;
    }
}

/**
 * 요소가 뷰포트에 보이도록 스크롤
 */
export function scrollToElement(element: HTMLElement, offset: number = HEALER_CONFIG.SCROLL_OFFSET): boolean {
    try {
        element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
        });

        // 추가 오프셋 조정
        if (offset !== 0) {
            window.scrollBy(0, -offset);
        }

        console.log('[Healer] Scrolled to element');
        return true;
    } catch (error) {
        console.error('[Healer] Scroll failed:', error);
        return false;
    }
}

/**
 * 요소가 가려져 있는지 확인
 */
export function isElementObscured(element: HTMLElement): boolean {
    try {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const topElement = document.elementFromPoint(centerX, centerY);

        // 자신 또는 자식이 아니면 가려진 것
        return topElement !== element && !element.contains(topElement);
    } catch {
        return false;
    }
}

/**
 * 지연 로딩 트리거
 */
export async function triggerLazyLoad(document: Document): Promise<boolean> {
    try {
        // 스크롤 이벤트 트리거
        window.scrollTo(0, document.body.scrollHeight);
        await delay(500);
        window.scrollTo(0, 0);
        await delay(500);

        // Intersection Observer가 있을 수 있으므로 스크롤 반복
        for (let i = 0; i < 3; i++) {
            window.scrollBy(0, window.innerHeight);
            await delay(300);
        }

        window.scrollTo(0, 0);
        console.log('[Healer] Triggered lazy load via scrolling');
        return true;
    } catch (error) {
        console.error('[Healer] Lazy load trigger failed:', error);
        return false;
    }
}

/**
 * W-Concept 전용 복구 로직
 * Iframe 탐색 + networkidle 후 추가 대기
 */
export async function healWConcept(document: Document): Promise<boolean> {
    console.log('[Healer] Starting W-Concept specialized healing...');

    try {
        // 1. 팝업 먼저 닫기
        tryClosePopup(document, 'wconcept');
        await delay(500);

        // 2. Iframe 내부 탐색 시도
        const iframes = document.querySelectorAll('iframe');
        for (const iframe of iframes) {
            try {
                const iframeDoc = (iframe as HTMLIFrameElement).contentDocument;
                if (iframeDoc) {
                    console.log('[Healer] Found accessible iframe');
                    // Iframe 내부에서도 팝업 닫기 시도
                    tryClosePopup(iframeDoc);
                }
            } catch {
                // Cross-origin iframe - 접근 불가
                console.log('[Healer] Cross-origin iframe detected');
            }
        }

        // 3. 지연 렌더링 대기 (SPA 특성)
        await delay(1500); // networkidle 후 추가 대기

        // 4. 가격 영역 스크롤
        const priceSelectors = [
            '.product-price',
            '.prd-price',
            '[class*="price"]',
        ];

        for (const selector of priceSelectors) {
            const priceEl = document.querySelector<HTMLElement>(selector);
            if (priceEl) {
                scrollToElement(priceEl, 50);
                console.log('[Healer] Scrolled to price element');
                break;
            }
        }

        // 5. 추가 지연 로딩 트리거
        await triggerLazyLoad(document);

        console.log('[Healer] W-Concept healing complete');
        return true;
    } catch (error) {
        console.error('[Healer] W-Concept healing failed:', error);
        return false;
    }
}

/**
 * 쇼핑몰별 특화 복구 실행
 */
export async function executeSpecializedHealing(
    document: Document,
    mall: keyof typeof MALL_SELECTORS
): Promise<boolean> {
    switch (mall) {
        case 'wconcept':
            return healWConcept(document);
        default:
            // 일반적인 복구 절차
            tryClosePopup(document, mall);
            await delay(500);
            return triggerLazyLoad(document);
    }
}

/**
 * 지연 함수
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 시나리오 감지
 */
export function detectScenario(
    document: Document,
    targetSelector: string
): HealerScenario | null {
    const target = document.querySelector<HTMLElement>(targetSelector);

    // 요소가 아예 없음 (지연 로딩 필요할 수 있음)
    if (!target) {
        console.log('[Healer] Element not found, might need lazy load');
        return 'lazy_load';
    }

    // 요소가 가려져 있음
    if (isElementObscured(target)) {
        console.log('[Healer] Element is obscured');
        return 'element_hidden';
    }

    // 모달/팝업 감지
    const modalSelectors = [
        '[class*="modal"]',
        '[class*="popup"]',
        '[class*="overlay"]',
        '[role="dialog"]',
    ];

    for (const selector of modalSelectors) {
        const modal = document.querySelector<HTMLElement>(selector);
        if (modal && modal.offsetParent !== null) {
            console.log('[Healer] Modal/popup detected');
            return 'popup_modal';
        }
    }

    return null;
}

/**
 * 시나리오별 복구 실행
 */
export async function executeHealing(
    document: Document,
    scenario: HealerScenario,
    targetSelector?: string
): Promise<boolean> {
    switch (scenario) {
        case 'element_hidden':
            if (targetSelector) {
                const target = document.querySelector<HTMLElement>(targetSelector);
                if (target) {
                    return scrollToElement(target);
                }
            }
            return false;

        case 'popup_modal':
            return tryClosePopup(document);

        case 'lazy_load':
            return triggerLazyLoad(document);

        case 'timeout':
            // 타임아웃은 단순 재시도
            await delay(HEALER_CONFIG.RETRY_DELAY_MS);
            return true;

        default:
            console.warn('[Healer] Unknown scenario:', scenario);
            return false;
    }
}

/**
 * 자가 복구 with 재시도 래퍼
 */
export async function healAndRetry<T>(
    action: () => Promise<T | null>,
    document: Document,
    targetSelector: string,
    options: HealingOptions = {}
): Promise<{ result: T | null; healing: HealingResult | null }> {
    const maxRetries = options.maxRetries || HEALER_CONFIG.MAX_RETRIES;
    const retryDelay = options.retryDelay || HEALER_CONFIG.RETRY_DELAY_MS;

    let retryCount = 0;
    let lastScenario: HealerScenario | null = null;

    while (retryCount <= maxRetries) {
        try {
            // 첫 시도 또는 복구 후 액션 실행
            const result = await action();

            if (result !== null) {
                return {
                    result,
                    healing: retryCount > 0 ? {
                        success: true,
                        scenario: lastScenario!,
                        action: 'Recovered after healing',
                        retryCount,
                    } : null
                };
            }

            // 실패 시 시나리오 감지
            const scenario = detectScenario(document, targetSelector);

            if (!scenario) {
                // 시나리오 감지 안됨 - 재시도만
                console.log('[Healer] No specific scenario detected, simple retry');
                await delay(retryDelay);
                retryCount++;
                continue;
            }

            lastScenario = scenario;
            options.onRetry?.(retryCount + 1, scenario);

            console.log(`[Healer] Attempt ${retryCount + 1}/${maxRetries}: Healing scenario "${scenario}"`);

            const healed = await executeHealing(document, scenario, targetSelector);

            if (!healed) {
                console.warn('[Healer] Healing failed for scenario:', scenario);
            }

            await delay(retryDelay);
            retryCount++;

        } catch (error) {
            console.error('[Healer] Action error:', error);
            retryCount++;
            await delay(retryDelay);
        }
    }

    // 모든 재시도 실패
    return {
        result: null,
        healing: {
            success: false,
            scenario: lastScenario || 'timeout',
            action: 'All retries exhausted',
            retryCount,
            error: 'Max retries exceeded',
        },
    };
}

/**
 * 빠른 진단 (디버깅용)
 */
export function diagnose(document: Document): {
    hasModals: boolean;
    hiddenElements: number;
    loadingIndicators: number;
    pageReady: boolean;
} {
    const modals = document.querySelectorAll('[class*="modal"], [class*="popup"], [role="dialog"]');
    const loadingSelectors = ['[class*="loading"]', '[class*="spinner"]', '.skeleton'];

    let loadingCount = 0;
    for (const sel of loadingSelectors) {
        loadingCount += document.querySelectorAll(sel).length;
    }

    // 문서 로딩 상태
    const pageReady = document.readyState === 'complete';

    return {
        hasModals: modals.length > 0,
        hiddenElements: 0, // 실제로는 특정 요소에 대해 체크해야 함
        loadingIndicators: loadingCount,
        pageReady,
    };
}
