/**
 * 공유 전략 순수 로직 — React/브라우저 의존 없음(테스트 러너 도달 가능).
 * 실행기(동적 임포트·navigator 호출)는 tossShare.ts에 있다.
 */

export type ShareStrategy = 'toss' | 'web' | 'clipboard';

interface ShareStrategyContext {
    /** Toss WebView 환경 여부 (isTossWebView() 결과) */
    isToss: boolean;
    /** navigator.share 사용 가능 여부 */
    canWebShare: boolean;
}

/**
 * 우선순위: Toss 네이티브 공유 시트 > Web Share API > 클립보드 복사.
 * Toss 안에서는 navigator.share 지원 여부와 무관하게 네이티브 시트가 맞다.
 */
export function pickShareStrategy(context: ShareStrategyContext): ShareStrategy {
    if (context.isToss) return 'toss';
    if (context.canWebShare) return 'web';
    return 'clipboard';
}

interface ShareMessageInput {
    productTitle: string;
    currentPrice: number;
    shareUrl: string;
}

/**
 * 공유 시트에 넣을 텍스트. 가격이 신뢰 불가(0 이하·비유한)면 가격 줄을
 * 생략한다 — 잘못된 가격을 외부로 퍼뜨리지 않는 것이 빈 줄보다 낫다.
 */
export function buildShareMessage(input: ShareMessageInput): string {
    const title = input.productTitle.trim();
    const hasValidPrice = Number.isFinite(input.currentPrice) && input.currentPrice > 0;

    const lines = [
        hasValidPrice
            ? `${title} — ${input.currentPrice.toLocaleString('ko-KR')}원`
            : title,
        'LooPyck에서 실시간 최저가 비교하기',
        input.shareUrl,
    ];

    return lines.join('\n');
}
