import type { PurchasePriceEstimate } from './purchasePricing.ts';
import { getFitGuide } from './fitGuide.ts';
import { analyzeVariantAlignment } from './variantAlignment.ts';

export type PurchaseDecisionTone = 'neutral' | 'positive' | 'warning' | 'danger';
export type PurchaseDecisionCardKey = 'option' | 'stock' | 'shipping' | 'fit';

export interface PurchaseDecisionCard {
    key: PurchaseDecisionCardKey;
    label: string;
    headline: string;
    detail: string;
    tone: PurchaseDecisionTone;
    pills: string[];
}

export interface PurchaseDecisionSummary {
    headline: string;
    detail: string;
    cards: PurchaseDecisionCard[];
}

function countActualShippingData(offers: PurchasePriceEstimate[]): number {
    return offers.filter((offer) => (
        typeof offer.product.shippingFee === 'number'
        || typeof offer.product.shippingFreeThreshold === 'number'
        || Boolean(offer.product.shippingText?.trim())
    )).length;
}

function summarizeOptionCard(
    offers: PurchasePriceEstimate[],
    selectedVariantLabel: string | undefined
): PurchaseDecisionCard {
    const alignment = analyzeVariantAlignment(offers.map((offer) => offer.product));
    const supportedSelectionCount = selectedVariantLabel
        ? offers.filter((offer) => !offer.product.stockText?.includes('선택 variant 미지원')).length
        : undefined;
    const sharedSignals = [
        alignment.sharedColors.length > 0 ? `공통 색상 ${alignment.sharedColors.join(', ')}` : null,
        alignment.sharedSizes.length > 0 ? `공통 사이즈 ${alignment.sharedSizes.join(', ')}` : null,
    ].filter(Boolean) as string[];

    let headline = '옵션 실데이터 부족';
    let detail = '선택 전 상세 옵션 확인이 필요합니다.';
    let tone: PurchaseDecisionTone = 'neutral';

    if (selectedVariantLabel && typeof supportedSelectionCount === 'number') {
        headline = `${selectedVariantLabel} · ${supportedSelectionCount}곳 지원`;
        detail = supportedSelectionCount > 0
            ? `${supportedSelectionCount}개 쇼핑몰에서 선택 variant 가격과 재고를 직접 비교합니다.`
            : '선택 variant를 직접 확인한 쇼핑몰이 없어 상세 페이지 재확인이 필요합니다.';
        tone = supportedSelectionCount > 1 ? 'positive' : supportedSelectionCount === 1 ? 'warning' : 'danger';
    } else if (alignment.overlapLevel === 'high' || alignment.overlapLevel === 'partial') {
        headline = alignment.overlapLabel;
        detail = alignment.verifiedOptionCount >= 2
            ? `검증 옵션 ${alignment.verifiedOptionCount}개 기준으로 비교합니다.`
            : '일부 쇼핑몰만 검증 옵션을 제공합니다.';
        tone = alignment.overlapLevel === 'high' ? 'positive' : 'warning';
    } else if (alignment.overlapLevel === 'none') {
        headline = '공통 옵션 미확인';
        detail = `옵션 혼재 위험: ${alignment.mismatchReasons.join(' · ') || alignment.summaryLabel}`;
        tone = 'danger';
    } else if (alignment.verifiedOptionCount > 0) {
        headline = `검증 옵션 ${alignment.verifiedOptionCount}곳 확보`;
        detail = '아직 공통 옵션 교집합은 부족하지만 일부 쇼핑몰은 실제 옵션을 제공합니다.';
        tone = 'warning';
    }

    const pills = [
        alignment.verifiedOptionCount > 0 ? `검증 옵션 ${alignment.verifiedOptionCount}곳` : '검증 옵션 부족',
        ...sharedSignals,
    ];

    return {
        key: 'option',
        label: '옵션/사이즈',
        headline,
        detail,
        tone,
        pills,
    };
}

function summarizeStockCard(offers: PurchasePriceEstimate[]): PurchaseDecisionCard {
    const availableOffers = offers.filter((offer) => offer.isAvailable);
    const lowStockCount = offers.filter((offer) => offer.stockStatus === 'low_stock').length;
    const soldOutCount = offers.filter((offer) => offer.stockStatus === 'sold_out').length;
    const bestAvailableOffer = availableOffers[0];

    let headline = '구매 가능 재고 없음';
    let detail = '현재 비교된 쇼핑몰은 모두 품절 추정입니다.';
    let tone: PurchaseDecisionTone = 'danger';

    if (availableOffers.length > 0) {
        headline = `${availableOffers.length}곳 구매 가능`;
        detail = bestAvailableOffer
            ? `${bestAvailableOffer.product.mallName}가 현재 가장 빠른 구매 후보입니다.`
            : '구매 가능한 쇼핑몰을 확인했습니다.';
        tone = lowStockCount > 0 || soldOutCount > 0 ? 'warning' : 'positive';
    }

    return {
        key: 'stock',
        label: '재고',
        headline,
        detail,
        tone,
        pills: [
            `재고 적음 ${lowStockCount}곳`,
            `품절 추정 ${soldOutCount}곳`,
        ],
    };
}

function summarizeShippingCard(offers: PurchasePriceEstimate[]): PurchaseDecisionCard {
    const availableOffers = offers.filter((offer) => offer.isAvailable);
    const freeShippingCount = availableOffers.filter((offer) => offer.shippingFee === 0).length;
    const actualShippingCount = countActualShippingData(offers);
    const shippingBase = availableOffers[0] || offers[0];

    let headline = '배송 정책 추정 중심';
    let detail = '현재 배송 조건은 쇼핑몰 기본 정책 또는 추정치 기반입니다.';
    let tone: PurchaseDecisionTone = 'warning';

    if (shippingBase) {
        if (freeShippingCount > 0) {
            headline = `무료배송 ${freeShippingCount}곳`;
            detail = `${shippingBase.product.mallName} 기준 결제가에 배송비가 먼저 반영됩니다.`;
            tone = actualShippingCount > 0 ? 'positive' : 'neutral';
        } else {
            headline = `최저 배송비 ${shippingBase.shippingFee.toLocaleString()}원`;
            detail = `${shippingBase.product.mallName} 기준 배송 정책이 현재 가장 유리합니다.`;
            tone = actualShippingCount > 0 ? 'neutral' : 'warning';
        }
    }

    return {
        key: 'shipping',
        label: '배송 정책',
        headline,
        detail,
        tone,
        pills: [
            `실배송 확인 ${actualShippingCount}곳`,
            `무료배송 ${freeShippingCount}곳`,
        ],
    };
}

function summarizeFitCard(productName: string, category: string | undefined, optionCard: PurchaseDecisionCard): PurchaseDecisionCard {
    const fitInfo = getFitGuide(productName, category || '');
    return {
        key: 'fit',
        label: '핏 가이드',
        headline: fitInfo.recommendation,
        detail: `${fitInfo.fit} · ${fitInfo.reason}`,
        tone: optionCard.tone === 'danger' ? 'warning' : 'neutral',
        pills: [fitInfo.fit, optionCard.headline],
    };
}

export function buildPurchaseDecisionSummary(input: {
    offers: PurchasePriceEstimate[];
    productName: string;
    category?: string;
    selectedVariantLabel?: string;
}): PurchaseDecisionSummary {
    const { offers, productName, category, selectedVariantLabel } = input;
    const optionCard = summarizeOptionCard(offers, selectedVariantLabel);
    const stockCard = summarizeStockCard(offers);
    const shippingCard = summarizeShippingCard(offers);
    const fitCard = summarizeFitCard(productName, category, optionCard);

    const bestOffer = offers.find((offer) => offer.isAvailable) || offers[0];
    let headline = '옵션과 재고를 먼저 확인하세요.';
    let detail = '가격 차이만 보지 말고 사이즈/배송/재고 조건을 함께 판단해야 합니다.';

    if (stockCard.tone === 'danger') {
        headline = '지금은 재고 재확인이 우선입니다.';
        detail = '현재 비교된 쇼핑몰 대부분이 품절 추정이어서 실제 구매 가능 여부를 먼저 확인해야 합니다.';
    } else if (optionCard.tone === 'danger') {
        headline = '공통 옵션 확인이 먼저 필요합니다.';
        detail = '색상·사이즈가 섞였을 수 있어 최저가보다 옵션 일치 여부를 먼저 검토해야 합니다.';
    } else if (bestOffer) {
        headline = `${bestOffer.product.mallName}가 현재 가장 무난한 구매 후보입니다.`;
        detail = `결제가 ${bestOffer.checkoutPrice.toLocaleString()}원 기준으로 재고와 배송 조건을 함께 확인했습니다.`;
    }

    return {
        headline,
        detail,
        cards: [optionCard, stockCard, shippingCard, fitCard],
    };
}
