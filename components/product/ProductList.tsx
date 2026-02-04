'use client';

import { Product } from '@/types/product';
import ProductSkeleton from './ProductSkeleton';
import ProductCard from './ProductCard';

interface ProductListProps {
    products: Product[];
    isLoading: boolean;
    error: string | null;
}

export default function ProductList({ products, isLoading, error }: ProductListProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
                {[...Array(8)].map((_, index) => (
                    <div key={`skeleton-${index}`} style={{ animationDelay: `${index * 50}ms` }}>
                        <ProductSkeleton />
                    </div>
                ))}
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center animate-in fade-in slide-in-from-bottom-2">
                <p className="text-red-600 font-medium">{error}</p>
                <p className="text-sm text-red-500 mt-2">
                    .env.local 파일의 API 키를 확인해주세요
                </p>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500">
                <div className="text-6xl mb-4">🤔</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    검색 결과가 없습니다
                </h3>
                <p className="text-gray-500 dark:text-gray-400">
                    다른 키워드로 구경해볼까요? <br />
                    <span className="text-sm text-gray-400 dark:text-gray-500 mt-1 block">
                        "청바지", "원피스", "나이키" 등으로 검색해보세요
                    </span>
                </p>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="mb-4 text-sm text-gray-600 dark:text-gray-400 flex justify-between items-center px-1">
                <span>총 <span className="font-bold text-[color:var(--color-accent)]">{products.length}</span>개의 상품</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {products.map((product, index) => (
                    <div
                        key={`${product.productId}-${index}`}
                        className="animate-in fade-in slide-in-from-bottom-8 fill-mode-backwards"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <ProductCard product={product} relatedProducts={products} />
                    </div>
                ))}
            </div>
        </div>
    );
}
