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

    return (
        <a
            href={safeLink || '#'}
            target={safeLink ? '_blank' : undefined}
            rel={safeLink ? 'noopener noreferrer' : undefined}
            onClick={(event) => {
                if (!safeLink) {
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

                    {product.mallName && (
                        <p className="text-sm text-gray-600">{product.mallName}</p>
                    )}

                    {product.brand && (
                        <p className="text-sm text-gray-500">브랜드: {product.brand}</p>
                    )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-col gap-2">
                    <PriceInsight product={product} relatedProducts={relatedProducts} />
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-blue-600 font-medium group-hover:underline">
                            상세보기 →
                        </span>
                    </div>
                </div>
            </div>
        </a>
    );
});

export default ProductCard;
