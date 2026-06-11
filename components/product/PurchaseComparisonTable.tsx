import CouponBadge from './CouponBadge';
import { classifyRetailerTrust, getRetailerTrustLabel } from '@/lib/api/sourceCatalog';
import { getFreshnessBadgeClassName, summarizeDetailFreshness } from '@/lib/product/dataFreshness';
import type { PurchasePriceEstimate } from '@/lib/product/purchasePricing';
import { analyzeVariantAlignment, getProductOptionKey } from '@/lib/product/variantAlignment';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';

interface PurchaseComparisonTableProps {
    offers: PurchasePriceEstimate[];
    selectedProductId?: string;
    selectedVariantLabel?: string;
    showDisclaimer?: boolean;
}

function hasActualShippingData(offer: PurchasePriceEstimate): boolean {
    return typeof offer.product.shippingFee === 'number'
        || typeof offer.product.shippingFreeThreshold === 'number'
        || Boolean(offer.product.shippingText?.trim());
}

function hasActualBenefitData(offer: PurchasePriceEstimate): boolean {
    return typeof offer.product.benefitPrice === 'number'
        || Boolean(offer.product.benefitText?.trim());
}

function hasActualStockData(offer: PurchasePriceEstimate): boolean {
    return (offer.product.stockStatus !== undefined && offer.product.stockStatus !== 'unknown')
        || Boolean(offer.product.stockText?.trim());
}

function hasPdpDetailData(offer: PurchasePriceEstimate): boolean {
    return Boolean(
        offer.product.detailCollectedAt
        || offer.product.variantId
        || offer.product.variantSku
        || offer.product.optionSummary
        || offer.product.optionValues?.length
        || offer.product.sizeOptions?.length
        || offer.product.colorOptions?.length
        || offer.product.variantCandidates?.length
    );
}

function getRetailerTrustBadgeClassName(trust: ReturnType<typeof classifyRetailerTrust>): string {
    if (trust === 'official_mall') {
        return 'bg-emerald-50 text-emerald-700';
    }

    if (trust === 'reseller') {
        return 'bg-amber-50 text-amber-700';
    }

    return 'bg-sky-50 text-sky-700';
}

export default function PurchaseComparisonTable({
    offers,
    selectedProductId,
    selectedVariantLabel,
    showDisclaimer = true,
}: PurchaseComparisonTableProps) {
    if (offers.length === 0) {
        return null;
    }

    const lowestCheckoutOffer = offers[0];
    const alignment = analyzeVariantAlignment(offers.map((offer) => offer.product));
    const availableOfferCount = offers.filter((offer) => offer.isAvailable).length;
    const freeShippingCount = offers.filter((offer) => offer.shippingFee === 0).length;
    const actualSignalCount = offers.filter((offer) =>
        hasActualShippingData(offer) || hasActualBenefitData(offer) || hasActualStockData(offer)
    ).length;
    const verifiedDetailCount = offers.filter((offer) => summarizeDetailFreshness(offer.product.detailCollectedAt).status !== 'unknown').length;

    function renderOptionPills(offer: PurchasePriceEstimate) {
        const signal = alignment.signalsByKey[getProductOptionKey(offer.product)];
        if (!signal) {
            return null;
        }

        const pills = [
            signal.color ? `색상 ${signal.color}` : null,
            signal.size ? `사이즈 ${signal.size}` : null,
            signal.gender ? `성별 ${signal.gender}` : null,
        ].filter(Boolean) as string[];

        if (pills.length === 0) {
            return null;
        }

        return (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                {pills.map((pill) => (
                    <span
                        key={`${offer.product.source}:${offer.product.id}:${pill}`}
                        className="rounded-full border border-slate-200 bg-white px-2 py-1"
                    >
                        {pill}
                    </span>
                ))}
            </div>
        );
    }

    function renderCoveragePills(offer: PurchasePriceEstimate) {
        const signal = alignment.signalsByKey[getProductOptionKey(offer.product)];
        if (!signal) {
            return null;
        }

        const pills: string[] = [];
        const sharedColors = signal.colors.filter((color) => alignment.sharedColors.includes(color));
        const sharedSizes = signal.sizes.filter((size) => alignment.sharedSizes.includes(size));

        if (signal.hasVerifiedOptions) {
            pills.push('검증 옵션');
        }
        if (sharedColors.length > 0) {
            pills.push(`공통 색상 ${sharedColors.join(', ')}`);
        }
        if (sharedSizes.length > 0) {
            pills.push(`공통 사이즈 ${sharedSizes.join(', ')}`);
        }
        if (alignment.verifiedOptionCount >= 2 && signal.hasVerifiedOptions && sharedColors.length === 0 && sharedSizes.length === 0) {
            pills.push('공통 옵션 미확인');
        }

        if (pills.length === 0) {
            return null;
        }

        return (
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500">
                {pills.map((pill) => (
                    <span
                        key={`${offer.product.source}:${offer.product.id}:coverage:${pill}`}
                        className={`rounded-full border px-2 py-1 ${
                            pill === '공통 옵션 미확인'
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : pill === '검증 옵션'
                                    ? 'border-violet-200 bg-violet-50 text-violet-700'
                                    : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}
                    >
                        {pill}
                    </span>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {alignment.hasMismatchRisk && (
                <div className={`rounded-2xl border px-4 py-3 ${
                    alignment.riskLevel === 'high'
                        ? 'border-amber-300 bg-amber-50'
                        : 'border-sky-200 bg-sky-50'
                }`}>
                    <p className="text-sm font-bold text-slate-900">
                        옵션 혼재 주의: {alignment.summaryLabel}
                    </p>
                    <p className="mt-1 text-xs text-slate-600">
                        {alignment.mismatchReasons.join(' · ')}
                        {alignment.distinctColors.length > 1 ? ` · 감지 색상 ${alignment.distinctColors.join(', ')}` : ''}
                        {alignment.distinctSizes.length > 1 ? ` · 감지 사이즈 ${alignment.distinctSizes.join(', ')}` : ''}
                        {alignment.distinctGenders.length > 1 ? ` · 감지 성별 ${alignment.distinctGenders.join(', ')}` : ''}
                    </p>
                </div>
            )}
            {!alignment.hasMismatchRisk && alignment.verifiedOptionCount >= 2 && alignment.overlapLevel !== 'unknown' && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <p className="text-sm font-bold text-emerald-900">
                        옵션 정렬 확인: {alignment.overlapLabel}
                    </p>
                    <p className="mt-1 text-xs text-emerald-700">
                        검증 옵션 보유 쇼핑몰 {alignment.verifiedOptionCount}개 기준으로 공통 옵션을 확인했습니다.
                    </p>
                </div>
            )}
            {selectedVariantLabel && (
                <div className="rounded-2xl border border-fuchsia-200 bg-fuchsia-50 px-4 py-3">
                    <p className="text-sm font-bold text-fuchsia-900">
                        선택 variant 기준 비교: {selectedVariantLabel}
                    </p>
                    <p className="mt-1 text-xs text-fuchsia-700">
                        지원하는 쇼핑몰은 해당 variant 가격과 재고를 반영하고, 미지원 쇼핑몰은 분리해서 표시합니다.
                    </p>
                </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">재고 있음</p>
                    <p className="mt-2 text-xl font-black text-slate-950">{availableOfferCount}</p>
                    <p className="mt-1 text-[11px] text-slate-500">지금 구매 가능한 쇼핑몰</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">무료배송</p>
                    <p className="mt-2 text-xl font-black text-slate-950">{freeShippingCount}</p>
                    <p className="mt-1 text-[11px] text-slate-500">선택 variant 기준 결제가 반영</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">실데이터</p>
                    <p className="mt-2 text-xl font-black text-slate-950">{actualSignalCount}</p>
                    <p className="mt-1 text-[11px] text-slate-500">배송·혜택·재고 확인 쇼핑몰</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-500">옵션/수집</p>
                    <p className="mt-2 text-xl font-black text-slate-950">
                        {alignment.verifiedOptionCount} / {verifiedDetailCount}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">검증 옵션 / PDP 확인 쇼핑몰</p>
                </div>
            </div>

            {offers.map((offer) => {
                const product = offer.product;
                const safeVariantLink = sanitizeExternalUrl(product.link);
                const isLowestCheckout = product.id === lowestCheckoutOffer.product.id;
                const isSelectedProduct = selectedProductId === product.id;
                const shippingActual = hasActualShippingData(offer);
                const benefitActual = hasActualBenefitData(offer);
                const stockActual = hasActualStockData(offer);
                const hasDetailData = hasPdpDetailData(offer);
                const retailerTrust = classifyRetailerTrust(product);
                const detailFreshness = summarizeDetailFreshness(product.detailCollectedAt);

                return (
                    <div
                        key={`${product.source}:${product.id}`}
                        className={`flex items-center justify-between gap-4 rounded-2xl border p-4 ${
                            isLowestCheckout
                                ? 'border-accent-light bg-accent/5'
                                : 'border-slate-100 bg-slate-50'
                        }`}
                    >
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                {isLowestCheckout && (
                                    <span className="rounded-full bg-accent px-2 py-1 text-[10px] font-bold text-white">
                                        최저 결제가
                                    </span>
                                )}
                                {isSelectedProduct && (
                                    <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-bold text-white">
                                        현재 상품
                                    </span>
                                )}
                                <span
                                    className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                                        offer.isAvailable
                                            ? 'bg-slate-900 text-white'
                                            : 'bg-rose-100 text-rose-700'
                                    }`}
                                >
                                    {offer.stockLabel}
                                </span>
                                {product.stockText?.includes('선택 variant 미지원') && (
                                    <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                                        선택 variant 미지원
                                    </span>
                                )}
                                {offer.potentialCouponDiscount > 0 && (
                                    <span className="rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
                                        혜택 최대 {offer.potentialCouponDiscount.toLocaleString()}원
                                    </span>
                                )}
                                {shippingActual && (
                                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                                        배송 실데이터
                                    </span>
                                )}
                                {benefitActual && (
                                    <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-bold text-sky-700">
                                        혜택 실데이터
                                    </span>
                                )}
                                {stockActual && (
                                    <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">
                                        재고 실데이터
                                    </span>
                                )}
                                {hasDetailData && (
                                    <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-bold text-violet-700">
                                        PDP 실데이터
                                    </span>
                                )}
                                {(product.variantSku || product.variantId) && (
                                    <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-700">
                                        실제 SKU
                                    </span>
                                )}
                                {product.variantCandidates && product.variantCandidates.length > 0 && (
                                    <span className="rounded-full bg-fuchsia-50 px-2 py-1 text-[10px] font-bold text-fuchsia-700">
                                        선택 variant {product.variantCandidates.length}개
                                    </span>
                                )}
                            </div>

                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold text-slate-800">{product.mallName}</span>
                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${getRetailerTrustBadgeClassName(retailerTrust)}`}>
                                    {getRetailerTrustLabel(retailerTrust)}
                                </span>
                                <span className={`rounded-full border px-2 py-1 text-[10px] font-bold ${getFreshnessBadgeClassName(detailFreshness.status)}`}>
                                    {detailFreshness.shortLabel}
                                </span>
                                <CouponBadge mallName={product.mallName} source={product.source} />
                            </div>
                            {product.optionSummary && (
                                <p className="mt-2 text-xs font-medium text-slate-600">
                                    상세 옵션: {product.optionSummary}
                                </p>
                            )}
                            {(product.variantSku || product.variantId) && (
                                <p className="mt-2 text-xs text-slate-500">
                                    {product.variantSku ? `SKU ${product.variantSku}` : ''}
                                    {product.variantSku && product.variantId ? ' · ' : ''}
                                    {product.variantId ? `Variant ${product.variantId}` : ''}
                                </p>
                            )}
                            {product.variantCandidates && product.variantCandidates.length > 0 && (
                                <p className="mt-2 text-xs text-slate-500">
                                    선택 가능: {product.variantCandidates.slice(0, 3).map((candidate) => candidate.label).join(', ')}
                                    {product.variantCandidates.length > 3 ? ` 외 ${product.variantCandidates.length - 3}` : ''}
                                </p>
                            )}
                            {renderOptionPills(offer)}
                            {renderCoveragePills(offer)}

                            <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                                <span className="rounded-full border border-slate-200 px-2 py-1">
                                    표시가 {offer.basePrice.toLocaleString()}원
                                </span>
                                <span className="rounded-full border border-slate-200 px-2 py-1">
                                    배송 {offer.shippingFee === 0 ? '무료' : `${offer.shippingFee.toLocaleString()}원`}
                                </span>
                                <span className="rounded-full border border-slate-200 px-2 py-1">
                                    결제가 {offer.checkoutPrice.toLocaleString()}원
                                </span>
                                {offer.potentialCouponDiscount > 0 && (
                                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-rose-700">
                                        혜택 적용시 {offer.bestCasePrice.toLocaleString()}원
                                    </span>
                                )}
                            </div>

                            <p className="mt-2 text-[11px] text-slate-400">
                                {offer.shippingLabel}
                                {offer.potentialCouponLabel ? ` · ${offer.potentialCouponLabel}` : ''}
                                {product.stockText ? ` · ${product.stockText}` : ''}
                                {detailFreshness.status !== 'unknown' ? ` · ${detailFreshness.detailLabel}` : ''}
                            </p>
                        </div>

                        <div className="shrink-0 text-right">
                            <p className={`text-sm font-bold ${isLowestCheckout ? 'text-accent-dark' : 'text-slate-700'}`}>
                                {offer.checkoutPrice.toLocaleString()}원
                            </p>
                            {offer.potentialCouponDiscount > 0 && (
                                <p className="mt-1 text-xs text-rose-600">
                                    최저 {offer.bestCasePrice.toLocaleString()}원
                                </p>
                            )}
                            {safeVariantLink && offer.isAvailable ? (
                                <a
                                    href={safeVariantLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 inline-flex rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-slate-700"
                                >
                                    이동
                                </a>
                            ) : safeVariantLink ? (
                                <a
                                    href={safeVariantLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 inline-flex rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-200"
                                >
                                    품절 확인
                                </a>
                            ) : (
                                <span className="mt-3 inline-flex rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500">
                                    링크 없음
                                </span>
                            )}
                        </div>
                    </div>
                );
            })}

            {showDisclaimer && (
                <p className="mt-3 text-[11px] text-slate-400">
                    배송비와 혜택은 쇼핑몰 정책, 회원 상태, 옵션 구성에 따라 달라질 수 있습니다. PDP 실데이터가 없는 옵션 신호는 title/category 기반 추정으로 보완합니다.
                </p>
            )}
        </div>
    );
}
