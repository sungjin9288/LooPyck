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
            className="block bg-white dark:bg-gray-800 rounded-lg shadow-md dark:border dark:border-gray-700 hover:shadow-xl dark:hover:border-gray-500 transition-all duration-300 hover:-translate-y-1 overflow-hidden group h-full"
        >
            <div className="relative h-64 bg-gray-100 overflow-hidden">
                <FavoriteButton product={product} />
                <PriceAlertButton product={product} />
                <Image
                    src={product.image}
                    alt={title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    loading="lazy"
                />
                {/* Overlay effect on hover */}
                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            </div>

            <div className="p-4">
                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 min-h-[48px] group-hover:text-blue-600 transition-colors">
                    {title}
                </h3>

                <SocialCounter productId={product.productId} />

                <div className="space-y-1">
                    <p className="text-xl font-bold text-blue-600">{price}</p>

                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        {product.mallName && (
                            <p>{product.mallName}</p>
                        )}
                        {product.source && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                                {product.source}
                            </span>
                        )}
                    </div>

                    {product.brand && (
                        <p className="text-sm text-gray-500">브랜드: {product.brand}</p>
                    )}
                    {product.variantLabel && (
                        <p className="text-sm font-medium text-fuchsia-700">
                            선택 variant: {product.variantLabel}
                        </p>
                    )}
                    {targetPriceLabel && (
                        <p className="text-xs font-semibold text-emerald-700">
                            목표가 {targetPriceLabel}
                        </p>
                    )}
                    {variantMeta && (
                        <p className="text-xs text-gray-400">{variantMeta}</p>
                    )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
                    <PriceInsight product={product} relatedProducts={relatedProducts} />
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-blue-600 font-medium group-hover:underline">
                            {internalHref ? '비교 페이지 →' : '상세보기 →'}
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
});

export default ProductCard;
