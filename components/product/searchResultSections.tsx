import { motion } from 'framer-motion';
import type { GroupedProduct } from '@/lib/api/types';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';
import { classifyRetailerTrust, getRetailerTrustLabel } from '@/lib/api/sourceCatalog';
import { hasPdpDetailData } from '@/lib/product/pdpDetailEnrichment';
import { getGroupPurchaseMetrics, summarizePurchaseEvidence } from '@/lib/product/purchasePricing';
import { getMatchStrategyLabel } from '@/lib/product/matchStrategyLabel';
import { buildFavoriteProductFromUnified } from '@/lib/favorites/favoriteProduct';
import { deriveCardCommerceBadges } from '@/lib/product/cardCommerceBadges';
import CompareShortlistButton from '@/components/product/CompareShortlistButton';

interface SearchSummaryMetricsSectionProps {
    lowestVisiblePrice: number;
    comparisonReadyCount: number;
    biggestSpread: number;
    highestVisiblePrice: number;
}

interface SearchResultCardProps {
    group: GroupedProduct;
    index: number;
    gridClassName: string;
    onProductClick: (group: GroupedProduct) => void;
}

export function SearchSummaryMetricsSection({
    lowestVisiblePrice,
    comparisonReadyCount,
    biggestSpread,
    highestVisiblePrice,
}: SearchSummaryMetricsSectionProps) {
    return (
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 h-1 w-8 rounded-full bg-[#F4FF3A]" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">최저 결제가</p>
                <p className="text-3xl font-black tracking-tight text-slate-900">
                    {Number.isFinite(lowestVisiblePrice) ? lowestVisiblePrice.toLocaleString() : 0}원
                </p>
                <p className="text-sm text-slate-500 mt-2">배송비를 반영한 예상 결제가 기준입니다.</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 h-1 w-8 rounded-full bg-[#F4FF3A]" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">비교 가능 상품</p>
                <p className="text-3xl font-black tracking-tight text-slate-900">
                    {comparisonReadyCount.toLocaleString()}개
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    같은 상품이 2개 이상 쇼핑몰에서 잡힌 경우만 카운트합니다.
                </p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-2 h-1 w-8 rounded-full bg-[#F4FF3A]" />
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-2">최대 결제가 차이</p>
                <p className="text-3xl font-black tracking-tight text-slate-900">
                    {biggestSpread.toLocaleString()}원
                </p>
                <p className="text-sm text-slate-500 mt-2">
                    현재 결과 내 최고 결제가 {highestVisiblePrice.toLocaleString()}원까지 비교됩니다.
                </p>
            </div>
        </section>
    );
}

export function SearchResultCard({
    group,
    index,
    gridClassName,
    onProductClick,
}: SearchResultCardProps) {
    const product = group.representative;
    const metrics = getGroupPurchaseMetrics(group);
    const checkoutEvidence = metrics.lowestCheckoutOffer ? summarizePurchaseEvidence(metrics.lowestCheckoutOffer) : null;
    const bestCaseOffer = metrics.lowestBestCaseOffer;
    const retailerTrust = classifyRetailerTrust(product);
    const shortlistProduct = buildFavoriteProductFromUnified(product);
    const commerceBadges = deriveCardCommerceBadges(product);

    return (
        <motion.div
            className={`relative group overflow-hidden rounded-xl bg-slate-100 ${gridClassName}`}
            variants={InteractionNarrative.parallaxReveal}
            custom={index % 5}
            onClick={() => onProductClick(group)}
        >
            {/* Image Layer */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                loading="lazy"
            />

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Compare-signal badge stack: mall-compare first, then trust / PDP */}
            <div className="absolute top-2 left-2 z-10">
                <div className="flex flex-col gap-1">
                    {group.mallCount > 1 && (
                        <span className="bg-[#0D1117]/90 text-[#F4FF3A] text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {group.mallCount}개 쇼핑몰 비교
                        </span>
                    )}
                    <span className="bg-white/90 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        {getRetailerTrustLabel(retailerTrust)}
                    </span>
                    {group.variants.some((variant) => hasPdpDetailData(variant)) && (
                        <span className="bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            PDP 확인
                        </span>
                    )}
                </div>
            </div>
            <div className="absolute right-2 top-2 z-10">
                <CompareShortlistButton
                    product={shortlistProduct}
                    compact
                    className="shadow-sm"
                />
            </div>

            {/* Content Layer */}
            <div className="absolute bottom-0 left-0 p-4 w-full text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 opacity-0 group-hover:opacity-100">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold tracking-widest uppercase text-yellow-400">
                        {metrics.lowestCheckoutOffer?.product.mallName || product.mallName}
                    </span>
                    <span className="rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-semibold text-white/90">
                        {getMatchStrategyLabel(group.matchStrategy)}
                    </span>
                </div>
                <h3 className="text-sm md:text-base font-serif leading-tight mb-1 line-clamp-2">
                    {product.title}
                </h3>
                <div className="flex items-baseline gap-2">
                    <p className="text-sm font-bold text-white">
                        {metrics.lowestCheckoutPrice.toLocaleString()}원
                    </p>
                    {group.mallCount > 1 && (
                        <p className="text-xs text-slate-300 line-through">
                            최고 {metrics.highestCheckoutPrice.toLocaleString()}원
                        </p>
                    )}
                </div>
                {commerceBadges.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        {commerceBadges.map((badge) => (
                            <span
                                key={badge.kind}
                                className={
                                    badge.kind === 'shipping'
                                        ? 'rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200'
                                        : 'max-w-[140px] truncate rounded-full bg-rose-500/20 px-2 py-0.5 text-[10px] font-semibold text-rose-200'
                                }
                            >
                                {badge.label}
                            </span>
                        ))}
                    </div>
                )}
                {checkoutEvidence && (
                    <p className="mt-1 text-[11px] text-slate-200 line-clamp-2">
                        {checkoutEvidence.checkoutBasisLabel} · {checkoutEvidence.detailLabels.slice(1, 3).join(' · ')}
                    </p>
                )}
                {bestCaseOffer && bestCaseOffer.potentialCouponDiscount > 0 && (
                    <p className="mt-1 text-[11px] text-rose-200">
                        혜택 적용 최저 {bestCaseOffer.bestCasePrice.toLocaleString()}원
                    </p>
                )}
            </div>
        </motion.div>
    );
}
