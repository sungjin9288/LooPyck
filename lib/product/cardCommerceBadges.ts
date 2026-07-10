/**
 * 검색 결과 카드에 표시할 커머스 신호 배지를 파생하는 순수 함수.
 * PurchaseComparisonTable의 상세 배지와 달리, 카드에서는 최대 2개만 압축 노출한다.
 */

export interface CardCommerceSignalInput {
    shippingText?: string;
    shippingFee?: number;
    benefitPrice?: number;
    benefitText?: string;
}

export type CardCommerceBadgeKind = 'shipping' | 'benefit';

export interface CardCommerceBadge {
    kind: CardCommerceBadgeKind;
    label: string;
}

const MAX_CARD_COMMERCE_BADGES = 2;
const FREE_SHIPPING_LABEL = '무료배송';

function deriveShippingBadge(product: CardCommerceSignalInput): CardCommerceBadge | null {
    const trimmedShippingText = product.shippingText?.trim();
    if (trimmedShippingText) {
        return { kind: 'shipping', label: trimmedShippingText };
    }

    if (product.shippingFee === 0) {
        return { kind: 'shipping', label: FREE_SHIPPING_LABEL };
    }

    return null;
}

function deriveBenefitBadge(product: CardCommerceSignalInput): CardCommerceBadge | null {
    if (typeof product.benefitPrice !== 'number') {
        return null;
    }

    const trimmedBenefitText = product.benefitText?.trim();
    if (!trimmedBenefitText) {
        return null;
    }

    return { kind: 'benefit', label: trimmedBenefitText };
}

/**
 * 우선순위: (1) 배송 속도/무료배송 배지, (2) 혜택(쿠폰) 배지.
 * 신호가 없으면 빈 배열을 반환하며, 카드 레이아웃에는 아무 영향도 주지 않는다.
 */
export function deriveCardCommerceBadges(product: CardCommerceSignalInput): CardCommerceBadge[] {
    const badges = [deriveShippingBadge(product), deriveBenefitBadge(product)]
        .filter((badge): badge is CardCommerceBadge => badge !== null);

    return badges.slice(0, MAX_CARD_COMMERCE_BADGES);
}

/**
 * product_open 진단 로그의 context에 실을 배지 상태 직렬화 —
 * 배지 노출 상품과 미노출 상품의 상세 진입 전환을 비교 관찰하기 위한 계측.
 * 예: 'badges=shipping+benefit' / 'badges=none'
 */
export function describeCommerceBadgeContext(product: CardCommerceSignalInput): string {
    const kinds = deriveCardCommerceBadges(product).map((badge) => badge.kind);
    return kinds.length > 0 ? `badges=${kinds.join('+')}` : 'badges=none';
}
