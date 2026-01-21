'use client';

import { Product } from '@/types/product';
import ProductCard from './ProductCard';

interface ProductListProps {
  products: Product[];
  isLoading: boolean;
  error: string | null;
}

export default function ProductList({ products, isLoading, error }: ProductListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-sm text-red-500 mt-2">
          .env.local 파일의 API 키를 확인해주세요
        </p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">
          검색 결과가 없습니다
        </p>
        <p className="text-gray-400 text-sm mt-2">
          다른 검색어로 시도해보세요
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 text-sm text-gray-600">
        총 <span className="font-bold text-blue-600">{products.length}</span>개의 상품
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((product, index) => (
          <ProductCard key={`${product.productId}-${index}`} product={product} />
        ))}
      </div>
    </div>
  );
}
