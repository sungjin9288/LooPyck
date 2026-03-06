import type { GroupedProduct, ProductSource, ProductStockStatus, UnifiedProduct } from '../api/types.ts';
import { getCouponsForSource, getShippingRule, type CouponInfo } from './commerceRules.ts';

export type StockStatus = ProductStockStatus;

export interface PurchasePriceEstimate {
    product: UnifiedProduct;
    basePrice: number;
    shippingFee: number;
    shippingLabel: string;
    shippingEstimated: boolean;
    shippingFreeThreshold?: number;
    checkoutPrice: number;
    potentialCouponDiscount: number;
    potentialCouponLabel?: string;
    bestCasePrice: number;
    stockStatus: StockStatus;
    stockLabel: string;
    isAvailable: boolean;
}

const SOLD_OUT_KEYWORDS = [
    '품절',
    '일시품절',
    'soldout',
    'sold out',
    'outofstock',
    'out of stock',
    '재고없음',
];

const LOW_STOCK_KEYWORDS = [
    'last one',
    'few left',
    '마지막',
    '재고소량',
    '재고한정',
    'low stock',
    'limited stock',
];

function containsKeyword(value: string, keywords: string[]): boolean {
    const normalized = value.toLowerCase().replace(/\s+/g, '');
    return keywords.some((keyword) => normalized.includes(keyword.replace(/\s+/g, '').toLowerCase()));
}

function inferStockStatusFromText(value: string): StockStatus {
    if (containsKeyword(value, SOLD_OUT_KEYWORDS)) {
        return 'sold_out';
    }
    if (containsKeyword(value, LOW_STOCK_KEYWORDS)) {
        return 'low_stock';
    }
    return 'unknown';
}

export function inferStockStatus(product: UnifiedProduct): StockStatus {
    if (product.stockStatus && product.stockStatus !== 'unknown') {
        return product.stockStatus;
    }

    if (product.stockText) {
        const stockFromText = inferStockStatusFromText(product.stockText);
        if (stockFromText !== 'unknown') {
            return stockFromText;
        }
    }

    const sourceText = `${product.title} ${product.mallName} ${product.brand || ''}`;
    const inferred = inferStockStatusFromText(sourceText);
    if (inferred !== 'unknown') {
        return inferred;
    }

    if (product.stockStatus) {
        return product.stockStatus;
    }

    return 'unknown';
}

export function getStockStatusLabel(status: StockStatus): string {
    switch (status) {
        case 'in_stock':
            return '구매 가능';
        case 'low_stock':
            return '재고 적음';
        case 'sold_out':
            return '품절 추정';
        default:
            return '재고 확인 필요';
    }
}

function calculateCouponSavings(basePrice: number, coupon: CouponInfo): number {
    if (coupon.minOrderAmount && basePrice < coupon.minOrderAmount) {
        return 0;
    }

    if (coupon.type === 'fixed') {
        return Math.max(0, coupon.value);
    }

    if (coupon.type === 'points') {
        const raw = Math.floor(basePrice * (coupon.value / 100));
        return coupon.capAmount ? Math.min(raw, coupon.capAmount) : raw;
    }

    const raw = Math.floor(basePrice * (coupon.value / 100));
    return coupon.capAmount ? Math.min(raw, coupon.capAmount) : raw;
}

function pickBestPotentialCoupon(source: ProductSource, basePrice: number): {
    discount: number;
    label?: string;
} {
    const coupons = getCouponsForSource(source);

    return coupons.reduce((best, coupon) => {
        const discount = calculateCouponSavings(basePrice, coupon);
        if (discount <= best.discount) return best;

        return {
            discount,
            label: coupon.description,
        };
    }, { discount: 0, label: undefined as string | undefined });
}

function getShippingFee(source: ProductSource, basePrice: number, product: UnifiedProduct): {
    fee: number;
    label: string;
    estimated: boolean;
    freeThreshold?: number;
} {
    const hasActualShippingFee = typeof product.shippingFee === 'number' && Number.isFinite(product.shippingFee) && product.shippingFee >= 0;
    const hasActualThreshold = typeof product.shippingFreeThreshold === 'number' && Number.isFinite(product.shippingFreeThreshold) && product.shippingFreeThreshold >= 0;
    const actualThreshold = hasActualThreshold ? product.shippingFreeThreshold : undefined;
    const actualLabel = product.shippingText?.trim();

    if (hasActualShippingFee || hasActualThreshold || actualLabel) {
        const qualifiesForFree = typeof actualThreshold === 'number' && basePrice >= actualThreshold;
        const actualFee = qualifiesForFree ? 0 : hasActualShippingFee ? product.shippingFee! : undefined;

        if (typeof actualFee === 'number') {
            return {
                fee: actualFee,
                label: qualifiesForFree
                    ? `${actualLabel || '검색 결과 배송 조건'} · 무료배송 구간`
                    : actualLabel || '검색 결과 수집 배송비',
                estimated: false,
                freeThreshold: actualThreshold,
            };
        }

        const fallbackRule = getShippingRule(source);
        return {
            fee: fallbackRule?.fee ?? 0,
            label: actualLabel || fallbackRule?.label || '배송비 추정',
            estimated: true,
            freeThreshold: actualThreshold ?? fallbackRule?.freeThreshold,
        };
    }

    const rule = getShippingRule(source);
    if (!rule) {
        return {
            fee: 0,
            label: '배송비 정보 없음',
            estimated: true,
        };
    }

    const isFree = typeof rule.freeThreshold === 'number' && basePrice >= rule.freeThreshold;

    return {
        fee: isFree ? 0 : rule.fee,
        label: isFree ? `${rule.label} · 무료배송 구간` : rule.label,
        estimated: rule.estimated,
        freeThreshold: rule.freeThreshold,
    };
}

function getBenefit(source: ProductSource, product: UnifiedProduct): {
    discount: number;
    label?: string;
    estimated: boolean;
} {
    if (typeof product.benefitPrice === 'number' && Number.isFinite(product.benefitPrice) && product.benefitPrice >= 0 && product.benefitPrice < product.price) {
        return {
            discount: product.price - product.benefitPrice,
            label: product.benefitText || '검색 결과 혜택가',
            estimated: false,
        };
    }

    const estimatedCoupon = pickBestPotentialCoupon(source, product.price);
    if (estimatedCoupon.discount > 0) {
        return {
            discount: estimatedCoupon.discount,
            label: estimatedCoupon.label,
            estimated: true,
        };
    }

    return {
        discount: 0,
        label: product.benefitText,
        estimated: false,
    };
}

export function estimatePurchasePrice(product: UnifiedProduct): PurchasePriceEstimate {
    const stockStatus = inferStockStatus(product);
    const shipping = getShippingFee(product.source, product.price, product);
    const benefit = getBenefit(product.source, product);
    const checkoutPrice = product.price + shipping.fee;
    const bestCasePrice = Math.max(0, checkoutPrice - benefit.discount);

    return {
        product,
        basePrice: product.price,
        shippingFee: shipping.fee,
        shippingLabel: shipping.label,
        shippingEstimated: shipping.estimated,
        shippingFreeThreshold: shipping.freeThreshold,
        checkoutPrice,
        potentialCouponDiscount: benefit.discount,
        potentialCouponLabel: benefit.label,
        bestCasePrice,
        stockStatus,
        stockLabel: getStockStatusLabel(stockStatus),
        isAvailable: stockStatus !== 'sold_out',
    };
}

export function comparePurchaseOffers(products: UnifiedProduct[]): PurchasePriceEstimate[] {
    return products
        .map((product) => estimatePurchasePrice(product))
        .sort((left, right) => {
            if (left.isAvailable !== right.isAvailable) {
                return left.isAvailable ? -1 : 1;
            }
            if (left.checkoutPrice !== right.checkoutPrice) {
                return left.checkoutPrice - right.checkoutPrice;
            }
            if (left.bestCasePrice !== right.bestCasePrice) {
                return left.bestCasePrice - right.bestCasePrice;
            }
            return left.basePrice - right.basePrice;
        });
}

export function getGroupPurchaseMetrics(group: GroupedProduct): {
    lowestCheckoutPrice: number;
    highestCheckoutPrice: number;
    lowestBestCasePrice: number;
} {
    const offers = comparePurchaseOffers(group.variants).filter((offer) => offer.isAvailable);
    const pool = offers.length > 0 ? offers : comparePurchaseOffers(group.variants);

    return {
        lowestCheckoutPrice: pool.reduce((min, offer) => Math.min(min, offer.checkoutPrice), Number.POSITIVE_INFINITY),
        highestCheckoutPrice: pool.reduce((max, offer) => Math.max(max, offer.checkoutPrice), 0),
        lowestBestCasePrice: pool.reduce((min, offer) => Math.min(min, offer.bestCasePrice), Number.POSITIVE_INFINITY),
    };
}
