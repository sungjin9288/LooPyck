'use client';

import Image from 'next/image';
import { Product } from '@/types/product';
import { formatPrice, stripHtmlTags } from '@/lib/api';
import FavoriteButton from './FavoriteButton';
import PriceAlertButton from './PriceAlertButton';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const title = stripHtmlTags(product.title);
  const price = formatPrice(product.lprice);

  return (
    <a
      href={product.link}
      target="_blank"
      rel="noopener noreferrer"
      className="block bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden group"
    >
      <div className="relative h-64 bg-gray-100">
        <FavoriteButton product={product} />
        <PriceAlertButton product={product} />
        <Image
          src={product.image}
          alt={title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      <div className="p-4">
        <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 min-h-[48px]">
          {title}
        </h3>

        <div className="space-y-1">
          <p className="text-xl font-bold text-blue-600">{price}</p>

          {product.mallName && (
            <p className="text-sm text-gray-600">{product.mallName}</p>
          )}

          {product.brand && (
            <p className="text-sm text-gray-500">브랜드: {product.brand}</p>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-blue-600 font-medium">
            상세보기 →
          </span>
        </div>
      </div>
    </a>
  );
}
