'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/types/product';
import { getFavorites } from '@/lib/favorites';
import ProductCard from './ProductCard';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<Product[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());

    // 스토리지 변경 감지
    const handleStorageChange = () => {
      setFavorites(getFavorites());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6">
          <svg
            className="w-16 h-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          찜한 상품이 없습니다
        </h2>
        <p className="text-gray-600">
          마음에 드는 상품의 하트 버튼을 눌러보세요
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          찜한 상품 ({favorites.length})
        </h2>
        <p className="text-gray-600">
          저장한 상품들을 확인하고 가격을 비교해보세요
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {favorites.map((product, index) => (
          <ProductCard key={`${product.productId}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );
}
