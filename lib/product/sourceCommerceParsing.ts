import type { ProductStockStatus, UnifiedProduct } from '../api/types.ts';
import { normalizePrice } from '../core/dataNormalizer.ts';

export type ParsedCommerceData = Pick<
    UnifiedProduct,
    'shippingFee' | 'shippingFreeThreshold' | 'shippingText' | 'benefitPrice' | 'benefitText' | 'stockStatus' | 'stockText'
>;

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeOptionalText(value: unknown, maxLength: number = 160): string | undefined {
    if (typeof value !== 'string') return undefined;
    const normalized = normalizeWhitespace(value).slice(0, maxLength);
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

    return mergeCommerceData(
        typeof benefitPrice === 'number'
            ? {
                benefitPrice,
                benefitText: 'HAGO 할인가',
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
