'use client';

import { Product } from '@/types/product';
import { useCloudStorage } from '@/hooks/useCloudStorage';

interface FavoriteButtonProps {
    product: Product;
}

export default function FavoriteButton({ product }: FavoriteButtonProps) {
    const { isFavorite, addFavorite, removeFavorite, loading } = useCloudStorage();

    // We can use optimistic updates or rely on the hook's state.
    // The hook returns the live state from favorites list.
    const favorite = isFavorite(product.productId);

    const toggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (loading) return; // Prevent interaction during load

        if (favorite) {
            await removeFavorite(product.productId);
        } else {
            await addFavorite(product);
        }
    };

    if (loading) {
        return (
            <div className="absolute top-3 right-3 w-10 h-10 bg-white/50 backdrop-blur-sm rounded-full animate-pulse z-10" />
        );
    }

    return (
        <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full shadow-md hover:shadow-lg transition-all flex items-center justify-center z-10 hover:scale-110 active:scale-125"
            aria-label={favorite ? '찜 해제' : '찜하기'}
        >
            <svg
                className={`w-6 h-6 transition-colors duration-300 ${favorite ? 'fill-red-500 text-red-500 animate-in zoom-in duration-300' : 'fill-none text-gray-400 hover:text-red-400'
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
