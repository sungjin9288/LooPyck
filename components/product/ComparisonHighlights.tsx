'use client';

import React from 'react';
import type { GroupedProduct } from '@/lib/api/types';
import { classifyRetailerTrust, getRetailerTrustLabel } from '@/lib/api/sourceCatalog';
import { hasPdpDetailData } from '@/lib/product/pdpDetailEnrichment';
import { getGroupPurchaseMetrics, summarizePurchaseEvidence } from '@/lib/product/purchasePricing';
import { getMatchStrategyLabel } from '@/lib/product/matchStrategyLabel';
import { CompareHighlightCard, CompareWorkflowSectionHeader } from '@/components/product/compareWorkflowSections';

interface ComparisonHighlightsProps {
    groups: GroupedProduct[];
    onProductClick: (group: GroupedProduct) => void;
}

export default function ComparisonHighlights({ groups, onProductClick }: ComparisonHighlightsProps) {
    if (groups.length === 0) return null;

    return (
        <section className="mb-10">
            <CompareWorkflowSectionHeader
                title="비교 하이라이트"
                description="여러 쇼핑몰에서 동시에 잡힌 상품만 모아 최저가와 가격 차이를 바로 확인하세요."
                badgeLabel="Compare Ready"
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {groups.map((group, index) => {
                    const product = group.representative;
                    const metrics = getGroupPurchaseMetrics(group);
                    const spread = metrics.highestCheckoutPrice - metrics.lowestCheckoutPrice;
                    const confidence = Math.round(group.matchConfidence * 100);
                    const verifiedCount = group.variants.filter((variant) => hasPdpDetailData(variant)).length;
                    const variantCandidateCount = product.variantCandidates?.length || 0;
                    const retailerTrust = classifyRetailerTrust(product);
                    const lowestCheckoutOffer = metrics.lowestCheckoutOffer;
                    const lowestBestCaseOffer = metrics.lowestBestCaseOffer;
                    const checkoutEvidence = lowestCheckoutOffer ? summarizePurchaseEvidence(lowestCheckoutOffer) : null;
                    const bestCaseEvidence = lowestBestCaseOffer ? summarizePurchaseEvidence(lowestBestCaseOffer) : null;

                    return (
                        <CompareHighlightCard
                            key={group.groupKey}
                            animationIndex={index}
                            image={product.image}
                            title={product.title}
                            mallCount={group.mallCount}
                            confidence={confidence}
                            spread={spread}
                            verifiedCount={verifiedCount}
                            totalVariantCount={group.variants.length}
                            retailerTrustLabel={getRetailerTrustLabel(retailerTrust)}
                            matchStrategyLabel={getMatchStrategyLabel(group.matchStrategy)}
                            optionSummary={product.optionSummary}
                            variantCandidateCount={variantCandidateCount}
                            lowestCheckoutPrice={metrics.lowestCheckoutPrice}
                            lowestCheckoutMallName={lowestCheckoutOffer?.product.mallName || product.mallName}
                            lowestBestCasePrice={
                                lowestBestCaseOffer && lowestBestCaseOffer.potentialCouponDiscount > 0
                                    ? metrics.lowestBestCasePrice
                                    : undefined
                            }
                            checkoutEvidenceLabel={checkoutEvidence?.checkoutBasisLabel}
                            checkoutEvidenceDetails={checkoutEvidence?.detailLabels.slice(0, 2).join(' · ')}
                            bestCaseEvidenceLabel={
                                lowestBestCaseOffer && lowestBestCaseOffer.potentialCouponDiscount > 0
                                    ? bestCaseEvidence?.bestCaseBasisLabel
                                    : undefined
                            }
                            bestCaseMallName={lowestBestCaseOffer?.product.mallName}
                            onClick={() => onProductClick(group)}
                        />
                    );
                })}
            </div>
        </section>
    );
}
