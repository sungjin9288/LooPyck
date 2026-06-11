import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import VariantScopedCompareSections from '@/components/product/VariantScopedCompareSections';
import { buildCanonicalProductDetailHref, decodeProductSnapshot, normalizeProductSource } from '@/lib/api/productSnapshot';
import type { UnifiedProduct } from '@/lib/api/types';
import { classifyRetailerTrust, getRetailerTrustLabel } from '@/lib/api/sourceCatalog';
import { getFreshnessBadgeClassName, summarizeDetailFreshness } from '@/lib/product/dataFreshness';
import { comparePurchaseOffers } from '@/lib/product/purchasePricing';
import { analyzeVariantAlignment } from '@/lib/product/variantAlignment';
import { SITE_URL } from '@/lib/site';
import { escapeJsonForHtml, sanitizeExternalUrl } from '@/lib/security/urlSafety';
import { enrichProductsWithPdpDetails } from '@/lib/server/pdpDetailService';
import { readComparableGroup, readTrackedProduct } from '@/lib/server/priceHistoryStore';

type ProductPageParams = { id: string };
type ProductPageSearchParams = { [key: string]: string | string[] | undefined };

type Props = {
    params: Promise<ProductPageParams>;
    searchParams: Promise<ProductPageSearchParams>;
};

export const dynamic = 'force-dynamic';

function extractSingleValue(value: string | string[] | undefined): string | null {
    if (Array.isArray(value)) return value[0] || null;
    return value || null;
}

function extractSnapshot(searchParams: ProductPageSearchParams): string | null {
    return extractSingleValue(searchParams?.snapshot);
}

function extractSource(searchParams: ProductPageSearchParams) {
    return normalizeProductSource(extractSingleValue(searchParams?.source));
}

function extractVariantKey(searchParams: ProductPageSearchParams): string | null {
    const value = extractSingleValue(searchParams?.variantKey);
    return value?.trim() ? value.trim() : null;
}

function hasActualCommerceData(product: UnifiedProduct): boolean {
    return typeof product.shippingFee === 'number'
        || typeof product.shippingFreeThreshold === 'number'
        || Boolean(product.shippingText?.trim())
        || typeof product.benefitPrice === 'number'
        || Boolean(product.benefitText?.trim())
        || (product.stockStatus !== undefined && product.stockStatus !== 'unknown')
        || Boolean(product.stockText?.trim());
}

function hasPdpDetailData(product: UnifiedProduct): boolean {
    return Boolean(
        product.detailCollectedAt
        || product.variantId
        || product.variantSku
        || product.optionSummary
        || product.optionValues?.length
        || product.sizeOptions?.length
        || product.colorOptions?.length
        || product.variantCandidates?.length
    );
}

function resolveSchemaAvailability(product: UnifiedProduct): string {
    if (product.stockStatus === 'sold_out') {
        return 'https://schema.org/OutOfStock';
    }

    if (product.stockStatus === 'low_stock') {
        return 'https://schema.org/LimitedAvailability';
    }

    return 'https://schema.org/InStock';
}

async function resolveProduct(
    params: ProductPageParams,
    searchParams: ProductPageSearchParams
): Promise<UnifiedProduct | null> {
    const snapshotRaw = extractSnapshot(searchParams);
    if (snapshotRaw) {
        const fromSnapshot = decodeProductSnapshot(snapshotRaw);
        if (fromSnapshot && fromSnapshot.id === params.id) {
            return fromSnapshot;
        }
    }

    const source = extractSource(searchParams);
    if (!source) return null;

    return readTrackedProduct(source, params.id);
}

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const product = await resolveProduct(resolvedParams, resolvedSearchParams);

    if (!product) {
        return {
            title: 'Product Not Found | LooPyck',
        };
    }

    const previousImages = (await parent).openGraph?.images || [];
    const canonicalUrl = new URL(buildCanonicalProductDetailHref(product), SITE_URL).toString();

    return {
        title: `${product.title} | LooPyck Compare`,
        description: `${product.title}의 쇼핑몰별 결제가를 비교하고 가격 흐름을 확인하세요. 현재 기준 ${product.price.toLocaleString()}원.`,
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            url: canonicalUrl,
            images: [product.image, ...previousImages],
        },
    };
}

export default async function ProductPage({ params, searchParams }: Props) {
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;
    const product = await resolveProduct(resolvedParams, resolvedSearchParams);

    if (!product) {
        notFound();
    }

    const comparableGroup = await readComparableGroup(product);
    const comparedProducts = await enrichProductsWithPdpDetails(comparableGroup?.variants || [product]);
    const resolvedProduct = comparedProducts.find((entry) => entry.id === product.id && entry.source === product.source) || product;
    const compareOffers = comparePurchaseOffers(comparedProducts);
    const optionAlignment = analyzeVariantAlignment(comparedProducts);
    const metricPool = compareOffers.filter((offer) => offer.isAvailable);
    const compareMetricPool = metricPool.length > 0 ? metricPool : compareOffers;
    const compareMetrics = {
        lowestCheckoutPrice: compareMetricPool[0]?.checkoutPrice ?? resolvedProduct.price,
        highestCheckoutPrice: compareMetricPool[compareMetricPool.length - 1]?.checkoutPrice ?? resolvedProduct.price,
        lowestBestCasePrice: compareMetricPool.reduce(
            (lowest, offer) => Math.min(lowest, offer.bestCasePrice),
            compareMetricPool[0]?.bestCasePrice ?? resolvedProduct.price
        ),
    };
    const actualDataCount = compareOffers.filter((offer) => hasActualCommerceData(offer.product)).length;
    const detailVerifiedCount = comparedProducts.filter((entry) => hasPdpDetailData(entry)).length;
    const compareMallCount = comparableGroup?.mallCount || compareOffers.length;
    const selectedOffer = compareOffers.find((offer) => offer.product.id === resolvedProduct.id && offer.product.source === resolvedProduct.source) || compareOffers[0];
    const safeStoreUrl = sanitizeExternalUrl(resolvedProduct.link);
    const canonicalUrl = new URL(buildCanonicalProductDetailHref(resolvedProduct), SITE_URL).toString();
    const maxCheckoutSpread = Math.max(0, compareMetrics.highestCheckoutPrice - compareMetrics.lowestCheckoutPrice);
    const initialVariantKey = extractVariantKey(resolvedSearchParams);
    const retailerTrust = classifyRetailerTrust(resolvedProduct);
    const detailFreshness = summarizeDetailFreshness(resolvedProduct.detailCollectedAt);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: resolvedProduct.title,
        image: resolvedProduct.image,
        description: `${resolvedProduct.title}의 쇼핑몰별 가격 비교와 가격 흐름을 LooPyck에서 제공합니다.`,
        url: canonicalUrl,
        sku: resolvedProduct.id,
        brand: {
            '@type': 'Brand',
            name: resolvedProduct.brand || 'Unknown',
        },
        offers: {
            '@type': 'Offer',
            url: resolvedProduct.link,
            priceCurrency: 'KRW',
            price: resolvedProduct.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: resolveSchemaAvailability(resolvedProduct),
            seller: {
                '@type': 'Organization',
                name: resolvedProduct.mallName,
            },
        },
    };
    const escapedJsonLd = escapeJsonForHtml(JSON.stringify(jsonLd));

    return (
        <div className="min-h-screen bg-[#f5f1ea]">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: escapedJsonLd }}
            />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
                    <div className="space-y-8">
                        <section className="grid gap-6 lg:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
                            <div className="overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                                <div className="aspect-[3/4] bg-[#ebe4d8]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={resolvedProduct.image}
                                        alt={resolvedProduct.title}
                                        className="h-full w-full object-cover"
                                    />
                                </div>
                            </div>

                            <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                                <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
                                    <span>{resolvedProduct.mallName}</span>
                                    <span className="text-slate-300">•</span>
                                    <span>{resolvedProduct.source}</span>
                                    {resolvedProduct.brand && (
                                        <>
                                            <span className="text-slate-300">•</span>
                                            <span>{resolvedProduct.brand}</span>
                                        </>
                                    )}
                                </div>

                                <h1 className="mt-4 text-3xl font-black leading-tight text-slate-950 sm:text-4xl">
                                    {resolvedProduct.title}
                                </h1>

                                <div className="mt-5 flex flex-wrap items-center gap-3">
                                    <div className="rounded-full bg-slate-950 px-4 py-2 text-white">
                                        <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Current</span>
                                        <p className="text-2xl font-black">{resolvedProduct.price.toLocaleString()}원</p>
                                    </div>
                                    {compareMallCount > 1 && comparableGroup && (
                                        <div className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-emerald-800">
                                            <p className="text-xs font-bold uppercase tracking-[0.18em]">Match</p>
                                            <p className="text-sm font-semibold">
                                                {compareMallCount}개 쇼핑몰 비교 · 신뢰도 {Math.round(comparableGroup.matchConfidence * 100)}%
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
                                        {getRetailerTrustLabel(retailerTrust)}
                                    </span>
                                    <span className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getFreshnessBadgeClassName(detailFreshness.status)}`}>
                                        {detailFreshness.shortLabel}
                                    </span>
                                    {detailFreshness.status !== 'unknown' && (
                                        <span className="text-xs text-slate-500">
                                            {detailFreshness.detailLabel}
                                        </span>
                                    )}
                                </div>

                                <p className="mt-5 max-w-2xl text-sm leading-6 text-slate-600">
                                    고정 compare page입니다. 검색 결과가 없어도 추적된 상품 데이터를 기준으로 쇼핑몰별 결제가, 혜택 적용 최저가, 가격 흐름을 다시 복원합니다.
                                </p>
                                {detailVerifiedCount > 0 && (
                                    <p className="mt-3 text-sm leading-6 text-slate-600">
                                        현재 비교군 중 {detailVerifiedCount}개 쇼핑몰은 실제 상세 페이지에서 옵션/재고/배송 신호를 다시 확인했습니다.
                                    </p>
                                )}
                                {resolvedProduct.optionSummary && (
                                    <p className="mt-3 text-sm font-medium text-slate-700">
                                        상세 옵션 확인: {resolvedProduct.optionSummary}
                                    </p>
                                )}
                                {resolvedProduct.variantCandidates && resolvedProduct.variantCandidates.length > 0 && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        선택 가능 variant {resolvedProduct.variantCandidates.length}개
                                        {resolvedProduct.variantCandidates[0]?.label
                                            ? ` · ${resolvedProduct.variantCandidates.slice(0, 3).map((candidate) => candidate.label).join(', ')}`
                                            : ''}
                                    </p>
                                )}
                                {(resolvedProduct.variantSku || resolvedProduct.variantId) && (
                                    <p className="mt-2 text-sm text-slate-600">
                                        {resolvedProduct.variantSku ? `SKU ${resolvedProduct.variantSku}` : ''}
                                        {resolvedProduct.variantSku && resolvedProduct.variantId ? ' · ' : ''}
                                        {resolvedProduct.variantId ? `Variant ${resolvedProduct.variantId}` : ''}
                                    </p>
                                )}

                                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    <div className="rounded-2xl bg-[#f5f1ea] p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Compare Malls</p>
                                        <p className="mt-2 text-2xl font-black text-slate-950">{compareMallCount}</p>
                                        <p className="mt-1 text-xs text-slate-500">비교 가능한 쇼핑몰 수</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f5f1ea] p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Lowest Best Case</p>
                                        <p className="mt-2 text-2xl font-black text-slate-950">
                                            {compareMetrics.lowestBestCasePrice.toLocaleString()}원
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">혜택 적용 기준 최저가</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f5f1ea] p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Actual Data</p>
                                        <p className="mt-2 text-2xl font-black text-slate-950">{actualDataCount}</p>
                                        <p className="mt-1 text-xs text-slate-500">배송/혜택/재고 실데이터 보유</p>
                                    </div>
                                    <div className="rounded-2xl bg-[#f5f1ea] p-4">
                                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Variant Risk</p>
                                        <p className="mt-2 text-2xl font-black text-slate-950">
                                            {optionAlignment.riskLevel === 'high'
                                                ? '높음'
                                                : optionAlignment.riskLevel === 'medium'
                                                    ? '중간'
                                                    : '낮음'}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">{optionAlignment.summaryLabel}</p>
                                    </div>
                                </div>
                                {optionAlignment.verifiedOptionCount >= 2 && (
                                    <p className="mt-4 text-sm text-slate-600">
                                        검증 옵션 기준 정렬: {optionAlignment.overlapLabel}
                                    </p>
                                )}

                                <div className="mt-6 flex flex-wrap items-center gap-3">
                                    {safeStoreUrl ? (
                                        <a
                                            href={safeStoreUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex rounded-full bg-slate-950 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800"
                                        >
                                            현재 쇼핑몰 이동
                                        </a>
                                    ) : (
                                        <span className="inline-flex rounded-full bg-slate-200 px-5 py-3 text-sm font-bold text-slate-500">
                                            쇼핑몰 링크 없음
                                        </span>
                                    )}
                                    <span className="text-sm text-slate-500">
                                        현재 상품 결제가 {selectedOffer.checkoutPrice.toLocaleString()}원
                                        {selectedOffer.potentialCouponDiscount > 0
                                            ? ` · 혜택 적용시 ${selectedOffer.bestCasePrice.toLocaleString()}원`
                                            : ''}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <VariantScopedCompareSections
                            products={comparedProducts}
                            primaryProductId={resolvedProduct.id}
                            primaryProductSource={resolvedProduct.source}
                            initialVariantKey={initialVariantKey}
                        />
                    </div>

                    <aside className="space-y-6 xl:sticky xl:top-24 xl:self-start">
                        <section className="rounded-[2rem] border border-black/5 bg-[#111827] p-6 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)]">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-white/55">Intelligence</p>
                            <h2 className="mt-3 text-2xl font-black">비교 인사이트</h2>
                            <div className="mt-6 space-y-4">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Lowest Checkout</p>
                                    <p className="mt-1 text-2xl font-black">{compareMetrics.lowestCheckoutPrice.toLocaleString()}원</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Lowest Best Case</p>
                                    <p className="mt-1 text-2xl font-black">{compareMetrics.lowestBestCasePrice.toLocaleString()}원</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Max Checkout Spread</p>
                                    <p className="mt-1 text-2xl font-black">{maxCheckoutSpread.toLocaleString()}원</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Actual Data Coverage</p>
                                    <p className="mt-1 text-2xl font-black">{actualDataCount}/{compareOffers.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">PDP Verified</p>
                                    <p className="mt-1 text-2xl font-black">{detailVerifiedCount}/{comparedProducts.length}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.18em] text-white/55">Variant Risk</p>
                                    <p className="mt-1 text-2xl font-black">{optionAlignment.summaryLabel}</p>
                                </div>
                                {optionAlignment.verifiedOptionCount >= 2 && (
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.18em] text-white/55">Shared Options</p>
                                        <p className="mt-1 text-2xl font-black">{optionAlignment.overlapLabel}</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)]">
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-500">Recovery Source</p>
                            <h2 className="mt-2 text-xl font-black text-slate-950">비교 복원 상태</h2>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                snapshot이 없어도 추적된 Firestore 상품 문서에서 배송, 혜택, 재고 필드를 읽어 비교표를 복원합니다.
                            </p>
                            <div className="mt-4 space-y-3 text-sm text-slate-600">
                                <div className="flex items-center justify-between rounded-2xl bg-[#f5f1ea] px-4 py-3">
                                    <span>현재 기준 쇼핑몰</span>
                                    <span className="font-bold text-slate-950">{resolvedProduct.mallName}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-[#f5f1ea] px-4 py-3">
                                    <span>복원 변형 수</span>
                                    <span className="font-bold text-slate-950">{compareOffers.length}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-[#f5f1ea] px-4 py-3">
                                    <span>PDP 확인 수</span>
                                    <span className="font-bold text-slate-950">{detailVerifiedCount}</span>
                                </div>
                                <div className="flex items-center justify-between rounded-2xl bg-[#f5f1ea] px-4 py-3">
                                    <span>가격 스프레드</span>
                                    <span className="font-bold text-slate-950">{maxCheckoutSpread.toLocaleString()}원</span>
                                </div>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </div>
    );
}
