'use client';

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { UnifiedProduct } from '@/lib/api/types';
import { buildOptionHistoryIdentity } from '@/lib/product/optionHistory';
import { comparePurchaseOffers } from '@/lib/product/purchasePricing';
import { applyVariantSelectionToProducts, findSelectedVariantOption, getDefaultVariantSelectionKey, listVariantSelectionOptions } from '@/lib/product/variantSelection';
import { buildVariantHistoryIdentity } from '@/lib/product/variantHistory';
import { buildFavoriteProductFromUnified } from '@/lib/favorites/favoriteProduct';
import PriceHistoryChart from './PriceHistoryChart';
import PurchaseComparisonTable from './PurchaseComparisonTable';
import VariantPicker from './VariantPicker';
import ComparePriceAlertButton from './ComparePriceAlertButton';

interface VariantScopedCompareSectionsProps {
    products: UnifiedProduct[];
    primaryProductId: string;
    primaryProductSource: UnifiedProduct['source'];
    initialVariantKey?: string | null;
}

export default function VariantScopedCompareSections({
    products,
    primaryProductId,
    primaryProductSource,
    initialVariantKey,
}: VariantScopedCompareSectionsProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const primaryProduct = React.useMemo(
        () => products.find((product) => product.id === primaryProductId && product.source === primaryProductSource) || products[0],
        [primaryProductId, primaryProductSource, products]
    );
    const variantOptions = React.useMemo(
        () => listVariantSelectionOptions(products, primaryProduct),
        [primaryProduct, products]
    );
    const urlVariantKey = searchParams.get('variantKey') || initialVariantKey || undefined;
    const [selectedVariantKey, setSelectedVariantKey] = React.useState<string | undefined>(
        () => initialVariantKey || getDefaultVariantSelectionKey(products, primaryProduct)
    );

    React.useEffect(() => {
        if (urlVariantKey && urlVariantKey !== selectedVariantKey && variantOptions.some((option) => option.key === urlVariantKey)) {
            setSelectedVariantKey(urlVariantKey);
            return;
        }

        const hasCurrentSelection = selectedVariantKey && variantOptions.some((option) => option.key === selectedVariantKey);
        if (!hasCurrentSelection) {
            setSelectedVariantKey(initialVariantKey || getDefaultVariantSelectionKey(products, primaryProduct));
        }
    }, [initialVariantKey, primaryProduct, products, selectedVariantKey, urlVariantKey, variantOptions]);

    const selectedVariant = React.useMemo(
        () => findSelectedVariantOption(variantOptions, selectedVariantKey),
        [selectedVariantKey, variantOptions]
    );
    const scopedProducts = React.useMemo(
        () => applyVariantSelectionToProducts(products, selectedVariant),
        [products, selectedVariant]
    );
    const scopedPrimaryProduct = React.useMemo(
        () => scopedProducts.find((product) => product.id === primaryProductId && product.source === primaryProductSource) || scopedProducts[0],
        [primaryProductId, primaryProductSource, scopedProducts]
    );
    const offers = React.useMemo(
        () => comparePurchaseOffers(scopedProducts),
        [scopedProducts]
    );
    const variantHistory = React.useMemo(
        () => scopedPrimaryProduct ? buildVariantHistoryIdentity(scopedPrimaryProduct) : {},
        [scopedPrimaryProduct]
    );
    const optionHistory = React.useMemo(
        () => scopedPrimaryProduct ? buildOptionHistoryIdentity(scopedPrimaryProduct) : {},
        [scopedPrimaryProduct]
    );
    const favoriteProduct = React.useMemo(
        () => scopedPrimaryProduct ? buildFavoriteProductFromUnified(scopedPrimaryProduct, {
            variantKey: selectedVariant?.key,
            variantLabel: selectedVariant?.label,
            optionKey: optionHistory.optionKey,
        }) : null,
        [optionHistory.optionKey, scopedPrimaryProduct, selectedVariant]
    );

    React.useEffect(() => {
        const currentVariantKey = searchParams.get('variantKey') || undefined;
        if (currentVariantKey === selectedVariantKey) {
            return;
        }

        const nextParams = new URLSearchParams(searchParams.toString());
        if (selectedVariantKey) {
            nextParams.set('variantKey', selectedVariantKey);
        } else {
            nextParams.delete('variantKey');
        }

        const nextQuery = nextParams.toString();
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }, [pathname, router, searchParams, selectedVariantKey]);

    if (!scopedPrimaryProduct) {
        return null;
    }

    return (
        <>
            <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Compare Page</p>
                        <h2 className="mt-2 text-2xl font-black text-slate-950">선택 variant 기준 쇼핑몰 비교</h2>
                    </div>
                    <p className="max-w-xl text-sm text-slate-500">
                        같은 상품이라도 선택 variant에 따라 가격과 재고가 달라질 수 있습니다. 원하는 variant를 고르면 비교표를 다시 계산합니다.
                    </p>
                </div>
                <div className="mb-5 flex flex-wrap items-center gap-3">
                    {favoriteProduct && <ComparePriceAlertButton product={favoriteProduct} />}
                    {selectedVariant && (
                        <span className="rounded-full bg-fuchsia-50 px-3 py-2 text-xs font-bold text-fuchsia-700">
                            현재 선택 {selectedVariant.label}
                        </span>
                    )}
                </div>

                {variantOptions.length > 0 && (
                    <div className="mb-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Variant Picker</p>
                        <p className="mt-2 text-sm text-slate-600">
                            {selectedVariant
                                ? `${selectedVariant.label} · ${selectedVariant.matchedMallCount}개 쇼핑몰에서 확인`
                                : '선택 가능한 variant를 고르면 해당 옵션 기준으로 재고와 결제가를 다시 비교합니다.'}
                        </p>
                        <VariantPicker
                            className="mt-4"
                            options={variantOptions}
                            selectedKey={selectedVariantKey}
                            onChange={setSelectedVariantKey}
                        />
                    </div>
                )}

                <PurchaseComparisonTable
                    offers={offers}
                    selectedProductId={scopedPrimaryProduct.id}
                    selectedVariantLabel={selectedVariant?.label}
                />
            </section>

            <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Price History</p>
                    <h2 className="mt-2 text-2xl font-black text-slate-950">선택 variant 가격 흐름</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        실제 SKU가 있으면 variant 이력을 우선 사용하고, 없으면 선택 옵션 이력이나 상품 이력으로 자동 fallback 합니다.
                    </p>
                </div>
                <PriceHistoryChart
                    source={scopedPrimaryProduct.source}
                    productId={scopedPrimaryProduct.id}
                    currentPrice={scopedPrimaryProduct.price}
                    variantKey={variantHistory.variantKey}
                    variantLabel={selectedVariant?.label || variantHistory.variantLabel}
                    optionKey={optionHistory.optionKey}
                    optionLabel={optionHistory.optionLabel}
                />
            </section>
        </>
    );
}
