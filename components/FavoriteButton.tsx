'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { addFavorite, removeFavorite, isFavorite } from '@/lib/favorites';

interface FavoriteButtonProps {
  product: Product;
}

export default function FavoriteButton({ product }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(false);

  useEffect(() => {
    setFavorite(isFavorite(product.productId));
  }, [product.productId]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (favorite) {
      removeFavorite(product.productId);
      setFavorite(false);
    } else {
      addFavorite(product);
      setFavorite(true);
    }
  };

  return (
    <button
      onClick={toggleFavorite}
      className="absolute top-3 right-3 w-10 h-10 bg-white rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center z-10"
      aria-label={favorite ? '찜 해제' : '찜하기'}
    >
      <svg
        className={`w-6 h-6 transition-colors ${
          favorite ? 'fill-red-500 text-red-500' : 'fill-none text-gray-400'
        }`}
        stroke="currentColor"
        strokeWidth={2}
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
