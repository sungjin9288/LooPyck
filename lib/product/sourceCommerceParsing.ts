import type { ProductStockStatus, UnifiedProduct } from '../api/types.ts';
import { normalizePrice } from '../core/dataNormalizer.ts';

export type ParsedCommerceData = Pick<
    UnifiedProduct,
    'shippingFee' | 'shippingFreeThreshold' | 'shippingText' | 'benefitPrice' | 'benefitText' | 'stockStatus' | 'stockText'
>;

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function hasUnresolvedTemplateSyntax(value: string): boolean {
    return /\{\{|\}\}|<%|%>|\$\{/.test(value);
}

function normalizeOptionalText(value: unknown, maxLength: number = 160): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalizedValue = normalizeWhitespace(value);
    if (hasUnresolvedTemplateSyntax(normalizedValue)) return undefined;
    const normalized = normalizedValue.slice(0, maxLength);
    return normalized.length > 0 ? normalized : undefined;
}

function normalizeOptionalMoney(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return Math.floor(value);
    }

    if (typeof value === 'string') {
        if (!/\d/.test(value)) {
            return undefined;
        }
        const parsed = normalizePrice(value);
        return parsed >= 0 ? parsed : undefined;
    }

    if (value && typeof value === 'object') {
        const candidate = value as Record<string, unknown>;
        return normalizeOptionalMoney(candidate.value ?? candidate.amount ?? candidate.price);
    }

    return undefined;
}

function normalizeBooleanFlag(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['y', 'yes', 'true', '1'].includes(normalized)) return true;
        if (['n', 'no', 'false', '0'].includes(normalized)) return false;
    }
    if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
    }
    return undefined;
}

export function mergeCommerceData(...parts: Array<ParsedCommerceData | undefined>): ParsedCommerceData {
    return parts.reduce<ParsedCommerceData>((merged, part) => {
        if (!part) return merged;

        for (const [key, value] of Object.entries(part)) {
            if (value !== undefined && value !== '') {
                (merged as Record<string, unknown>)[key] = value;
            }
        }

        return merged;
    }, {});
}

export function inferAvailabilityStatus(rawText: unknown): ProductStockStatus | undefined {
    const text = normalizeOptionalText(rawText, 200)?.toLowerCase();
    if (!text) return undefined;

    if (
        text.includes('품절') ||
        text.includes('일시품절') ||
        text.includes('soldout') ||
        text.includes('sold out') ||
        text.includes('outofstock') ||
        text.includes('out of stock') ||
        text.includes('discontinued')
    ) {
        return 'sold_out';
    }

    if (
        text.includes('few left') ||
        text.includes('last one') ||
        text.includes('limited stock') ||
        text.includes('limitedavailability') ||
        text.includes('low stock') ||
        text.includes('재고소량') ||
        text.includes('재고한정') ||
        text.includes('마지막')
    ) {
        return 'low_stock';
    }

    if (
        text.includes('in stock') ||
        text.includes('instock') ||
        text.includes('판매중') ||
        text.includes('구매가능')
    ) {
        return 'in_stock';
    }

    return undefined;
}

export function parseShippingText(rawText: unknown): ParsedCommerceData {
    const text = normalizeOptionalText(rawText);
    if (!text) return {};

    let shippingFee: number | undefined;
    let shippingFreeThreshold: number | undefined;

    const thresholdMatch = text.match(/([₩]?\s*[\d,]+)\s*원?\s*(?:이상|over)\s*(?:구매(?:시)?\s*)?(?:무료배송|무료|free)/i)
        || text.match(/(?:무료배송|free shipping)[^\d]{0,12}([₩]?\s*[\d,]+)\s*원?\s*(?:이상|over)/i);
    if (thresholdMatch?.[1]) {
        shippingFreeThreshold = normalizePrice(thresholdMatch[1]);
    }

    const feeMatch = text.match(/(?:배송비|delivery|shipping(?: fee)?)\s*[:\-]?\s*(무료|free|[₩]?\s*[\d,]+)\s*원?/i)
        || text.match(/([₩]?\s*[\d,]+)\s*원?\s*(?:배송비|delivery|shipping)/i);

    if (feeMatch?.[1]) {
        shippingFee = /무료|free/i.test(feeMatch[1]) ? 0 : normalizePrice(feeMatch[1]);
    } else if ((/무료배송|free shipping/i.test(text)) && typeof shippingFreeThreshold !== 'number') {
        shippingFee = 0;
    }

    return {
        shippingFee,
        shippingFreeThreshold,
        shippingText: text,
    };
}

export function parseBenefitText(rawText: unknown, basePrice: number): ParsedCommerceData {
    const text = normalizeOptionalText(rawText);
    if (!text) return {};

    let benefitPrice: number | undefined;
    const directPriceMatch = text.match(/(?:회원가|혜택가|쿠폰가|최종가|즉시할인가?|할인가|sale price|member price|coupon price)[^\d]{0,8}([₩]?\s*[\d,]+)\s*원?/i)
        || text.match(/([₩]?\s*[\d,]+)\s*원?[^\d]{0,8}(?:회원가|혜택가|쿠폰가|최종가|즉시할인가?|할인가)/i);

    if (directPriceMatch?.[1]) {
        const parsed = normalizePrice(directPriceMatch[1]);
        if (parsed > 0 && parsed < basePrice) {
            benefitPrice = parsed;
        }
    } else if (text.includes('원')) {
        const parsed = normalizePrice(text);
        if (parsed >= 1_000 && parsed < basePrice) {
            benefitPrice = parsed;
        }
    }

    return {
        benefitPrice,
        benefitText: text,
    };
}

export function parseStockSignal(rawText: unknown): ParsedCommerceData {
    const text = normalizeOptionalText(rawText, 120);
    if (!text) return {};

    return {
        stockStatus: inferAvailabilityStatus(text) ?? 'unknown',
        stockText: text,
    };
}

export function buildCommerceDataFromTexts(input: {
    basePrice: number;
    shippingText?: string;
    benefitText?: string;
    stockText?: string;
}): ParsedCommerceData {
    return mergeCommerceData(
        parseShippingText(input.shippingText),
        parseBenefitText(input.benefitText, input.basePrice),
        parseStockSignal(input.stockText)
    );
}

function pickLowestCandidate(values: unknown[], basePrice: number): number | undefined {
    const candidates = values
        .map((value) => normalizeOptionalMoney(value))
        .filter((value): value is number => typeof value === 'number' && value >= 0 && value < basePrice);

    return candidates.sort((left, right) => left - right)[0];
}

export function parseTwentyNineCmCommerceData(item: Record<string, unknown>, basePrice: number): ParsedCommerceData {
    const shippingText = normalizeOptionalText(
        item.deliveryInfo
            ?? item.shippingInfo
            ?? item.shippingText
            ?? item.deliveryNotice
            ?? item.deliveryFeeInfo
    );
    const benefitText = normalizeOptionalText(
        item.benefitText
            ?? item.memberBenefitText
            ?? item.couponText
            ?? item.discountText
    );
    const stockText = normalizeOptionalText(
        item.stockText
            ?? item.saleState
            ?? item.stockState
            ?? item.displayState
            ?? item.status
    );

    const freeShipping = normalizeBooleanFlag(item.freeShippingYn ?? item.freeDeliveryYn ?? item.freeShipping ?? item.freeDelivery);
    const shippingFee = freeShipping
        ? 0
        : normalizeOptionalMoney(item.shippingPrice ?? item.deliveryPrice ?? item.shippingFee ?? item.deliveryFee);
    const shippingFreeThreshold = normalizeOptionalMoney(
        item.freeShippingStandardAmount
            ?? item.freeDeliveryStandardPrice
            ?? item.shippingFreeThreshold
            ?? item.freeShippingThreshold
    );
    const benefitPrice = pickLowestCandidate([
        item.couponPrice,
        item.memberPrice,
        item.discountPrice,
        item.finalPrice,
        item.bestPrice,
        item.immediateDiscountPrice,
    ], basePrice);

    const explicitSoldOut = normalizeBooleanFlag(item.soldOut ?? item.isSoldOut ?? item.soldout);

    return mergeCommerceData(
        shippingText ? parseShippingText(shippingText) : undefined,
        typeof shippingFee === 'number' || typeof shippingFreeThreshold === 'number' || shippingText
            ? {
                shippingFee,
                shippingFreeThreshold,
                shippingText,
            }
            : undefined,
        benefitText ? parseBenefitText(benefitText, basePrice) : undefined,
        typeof benefitPrice === 'number'
            ? {
                benefitPrice,
                benefitText: benefitText || '29CM 혜택가',
            }
            : undefined,
        stockText ? parseStockSignal(stockText) : undefined,
        explicitSoldOut === true
            ? {
                stockStatus: 'sold_out',
                stockText: stockText || '품절',
            }
            : explicitSoldOut === false
                ? {
                    stockStatus: inferAvailabilityStatus(stockText || '판매중') || 'in_stock',
                    stockText: stockText || '판매중',
                }
                : undefined
    );
}

export function parseMusinsaCommerceData(item: Record<string, unknown>, basePrice: number): ParsedCommerceData {
    const guideText = normalizeOptionalText(item.plusDeliveryGuideText);
    const isPlusDelivery = normalizeBooleanFlag(item.isPlusDelivery);
    const shippingText = guideText ?? (isPlusDelivery === true ? '플러스배송' : undefined);

    // couponPrice/finalPrice가 판매가(basePrice)보다 낮을 때만 혜택가로 취급.
    const benefitPrice = pickLowestCandidate([
        item.couponPrice,
        item.finalPrice,
    ], basePrice);

    const explicitSoldOut = normalizeBooleanFlag(item.isSoldOut ?? item.soldOut);

    return mergeCommerceData(
        shippingText ? parseShippingText(shippingText) : undefined,
        shippingText ? { shippingText } : undefined,
        typeof benefitPrice === 'number'
            ? {
                benefitPrice,
                benefitText: '무신사 혜택가',
            }
            : undefined,
        explicitSoldOut === true
            ? {
                stockStatus: 'sold_out',
                stockText: '품절',
            }
            : explicitSoldOut === false
                ? {
                    stockStatus: 'in_stock',
                    stockText: '판매중',
                }
                : undefined
    );
}

export function parseWConceptCommerceData(item: Record<string, unknown>, basePrice: number): ParsedCommerceData {
    // finalPrice(쿠폰 적용가)가 salePrice(판매가)보다 낮을 때만 혜택가로 취급.
    const benefitPrice = pickLowestCandidate([item.finalPrice], basePrice);

    // statusCd는 관찰상 '01'(판매중) 외 값의 의미가 불확실(타이틀 텍스트와 상관관계 없음)해
    // '01'일 때만 in_stock으로 단정하고, 그 외에는 재고 상태를 설정하지 않는다.
    const statusCd = normalizeOptionalText(item.statusCd);

    return mergeCommerceData(
        typeof benefitPrice === 'number'
            ? {
                benefitPrice,
                benefitText: 'W컨셉 쿠폰가',
            }
            : undefined,
        statusCd === '01'
            ? {
                stockStatus: 'in_stock',
                stockText: '판매중',
            }
            : undefined
    );
}

export function parseHagoCommerceData(item: Record<string, unknown>, basePrice: number): ParsedCommerceData {
    // dc_1_price(추가 할인가)가 sell_price(판매가)보다 낮을 때만 혜택가로 취급.
    const benefitPrice = pickLowestCandidate([item.dc_1_price], basePrice);

    const explicitSoldOut = normalizeBooleanFlag(item.is_soldout);

    const addInfo = (item.addInfo && typeof item.addInfo === 'object')
        ? item.addInfo as Record<string, unknown>
        : undefined;
    const isFreeDelivery = normalizeBooleanFlag(addInfo?.is_free_delivery);

    // discount_step1_v2.coupon_title: dc_1_price를 만드는 실제 쿠폰명(관찰상 sell_price - discount_amount_krw === dc_1_price로 항상 일치).
    // 있으면 구체적인 쿠폰명을, 없으면 기존 일반 문구를 사용.
    const discountStep1V2 = (item.discount_step1_v2 && typeof item.discount_step1_v2 === 'object')
        ? item.discount_step1_v2 as Record<string, unknown>
        : undefined;
    const couponTitle = normalizeOptionalText(discountStep1V2?.coupon_title);

    return mergeCommerceData(
        typeof benefitPrice === 'number'
            ? {
                benefitPrice,
                benefitText: couponTitle || 'HAGO 할인가',
            }
            : undefined,
        isFreeDelivery === true
            ? {
                shippingFee: 0,
                shippingText: '무료배송',
            }
            : undefined,
        explicitSoldOut === true
            ? {
                stockStatus: 'sold_out',
                stockText: '품절',
            }
            : explicitSoldOut === false
                ? {
                    stockStatus: 'in_stock',
                    stockText: '판매중',
                }
                : undefined
    );
}

// 에이블리 delivery_type 관찰값(standard/today/shak/third_pl) → 사람이 읽을 수 있는 배송 라벨.
// shak(샥배송)/today(오늘출발)는 에이블리의 빠른배송 프로그램, third_pl은 위탁(3PL)배송, standard는 일반배송.
const ABLY_DELIVERY_TYPE_LABELS: Record<string, string> = {
    standard: '일반배송',
    today: '오늘출발',
    shak: '샥배송',
    third_pl: '위탁배송',
};

export function parseAblyCommerceData(item: Record<string, unknown>, _basePrice: number): ParsedCommerceData {
    // 품절/재고 신호: 에이블리 검색 결과 아이템 스키마에는 sold-out류 필드가 전혀 없음(검색 결과 자체가 판매중 상품만 노출하는 것으로 관찰됨).
    // first_page_rendering.original_price는 실측상 항상 실제 숫자이며 price보다 높은 "정가"이므로,
    // benefitPrice(판매가보다 낮아야 함) 규칙에 위배되어 매핑하지 않는다.
    const deliveryType = normalizeOptionalText(item.delivery_type);
    const shippingLabel = deliveryType ? ABLY_DELIVERY_TYPE_LABELS[deliveryType] : undefined;

    return mergeCommerceData(
        shippingLabel
            ? {
                shippingText: shippingLabel,
            }
            : undefined
    );
}

export function parseNaverCommerceData(item: Record<string, unknown>, basePrice: number): ParsedCommerceData {
    const shippingText = normalizeOptionalText(
        item.deliveryFeeContent
            ?? item.delivery
            ?? item.shippingText
            ?? item.shippingInfo
    );
    const benefitText = normalizeOptionalText(
        item.benefitText
            ?? item.discountText
            ?? item.cardBenefitText
            ?? item.eventText
    );
    const stockText = normalizeOptionalText(
        item.stockText
            ?? item.availability
            ?? item.status
    );

    const benefitPrice = pickLowestCandidate([
        item.benefitPrice,
        item.discountPrice,
        item.memberPrice,
        item.finalPrice,
    ], basePrice);

    return mergeCommerceData(
        shippingText ? parseShippingText(shippingText) : undefined,
        benefitText ? parseBenefitText(benefitText, basePrice) : undefined,
        typeof benefitPrice === 'number'
            ? {
                benefitPrice,
                benefitText: benefitText || '검색 결과 혜택가',
            }
            : undefined,
        stockText ? parseStockSignal(stockText) : undefined
    );
}
