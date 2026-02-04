'use client';

import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Product } from '@/types/product';
import ProductCard from '../product/ProductCard';

export default function FavoritesPage() {
    const [favorites] = useLocalStorage<Product[]>('fashion-favorites', []);

    if (favorites.length === 0) {
        return (
            <div className="text-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6 animate-bounce">
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
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                    <div
                        key={`${product.productId}-${index}`}
                        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-backwards"
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
}
