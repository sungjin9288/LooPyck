'use client';

import { memo } from 'react';
import Image from 'next/image';
import { Product } from '@/types/product';
import { formatPrice, stripHtmlTags } from '@/lib/api';
import FavoriteButton from './FavoriteButton';
import PriceAlertButton from './PriceAlertButton';
import PriceInsight from './PriceInsight';
import SocialCounter from './SocialCounter';
import { sanitizeExternalUrl } from '@/lib/security/urlSafety';
import { deriveCardCommerceBadges } from '@/lib/product/cardCommerceBadges';

interface ProductCardProps {
    product: Product;
    relatedProducts?: Product[];
}

const ProductCard = memo(function ProductCard({ product, relatedProducts }: ProductCardProps) {
    const title = stripHtmlTags(product.title);
    const price = formatPrice(product.lprice);
    const safeLink = sanitizeExternalUrl(product.link);
    const internalHref = typeof product.deepLink === 'string' && product.deepLink.startsWith('/') ? product.deepLink : null;
    const href = internalHref || safeLink || '#';
    const targetPriceLabel = typeof product.targetPrice === 'number'
        ? `${product.targetPrice.toLocaleString()}원`
        : null;
    const variantMeta = [product.variantSku ? `SKU ${product.variantSku}` : null, product.variantId ? `Variant ${product.variantId}` : null]
        .filter(Boolean)
        .join(' · ');
    const commerceBadges = deriveCardCommerceBadges(product);

    return (
        <a
            href={href}
            target={!internalHref && safeLink ? '_blank' : undefined}
            rel={!internalHref && safeLink ? 'noopener noreferrer' : undefined}
            onClick={(event) => {
                if (!internalHref && !safeLink) {
                    event.preventDefault();
                }
            }}
            className="group block h-full overflow-hidden rounded-2xl bg-white ring-1 ring-black/[0.05] transition-all duration-300 hover:ring-black/15"
        >
            <div className="relative aspect-[4/5] overflow-hidden bg-stone-100">
                <FavoriteButton product={product} />
                <PriceAlertButton product={product} />
                <Image
                    src={product.image}
                    alt={title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                />
            </div>

            <div className="p-4">
                {product.brand && (
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                        {product.brand}
                    </p>
                )}
                <h3 className="mb-2 line-clamp-2 min-h-[40px] text-sm font-medium leading-snug text-slate-900 underline-offset-4 decoration-slate-300 group-hover:underline">
                    {title}
                </h3>

                <SocialCounter productId={product.productId} />

                <div className="mt-1 space-y-1">
                    <p className="text-lg font-bold tracking-tight text-slate-900">{price}</p>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        {product.mallName && (
                            <span>{product.mallName}</span>
                        )}
                        {product.source && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                {product.source}
                            </span>
                        )}
                    </div>

                    {commerceBadges.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5">
                            {commerceBadges.map((badge) => (
                                <span
                                    key={badge.kind}
                                    className={
                                        badge.kind === 'shipping'
                                            ? 'rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700'
                                            : 'max-w-[140px] truncate rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600'
                                    }
                                >
                                    {badge.label}
                                </span>
                            ))}
                        </div>
                    )}

                    {product.variantLabel && (
                        <p className="text-xs font-medium text-slate-500">
                            선택 variant: {product.variantLabel}
                        </p>
                    )}
                    {targetPriceLabel && (
                        <p className="text-xs font-semibold text-emerald-700">
                            목표가 {targetPriceLabel}
                        </p>
                    )}
                    {variantMeta && (
                        <p className="text-[11px] text-slate-400">{variantMeta}</p>
                    )}
                </div>

                <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <PriceInsight product={product} relatedProducts={relatedProducts} />
                    <span className="mt-1 text-xs font-medium text-slate-500 transition-colors group-hover:text-slate-900">
                        {internalHref ? '비교 페이지 →' : '상세보기 →'}
                    </span>
                </div>
            </div>
        </a>
    );
});

export default ProductCard;
