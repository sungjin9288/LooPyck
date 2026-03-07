import type { Metadata } from 'next';
import FavoritesRouteView from '@/components/favorites/FavoritesRouteView';

export const metadata: Metadata = {
    title: 'My Favorites | LooPyck',
    description: '찜한 상품과 variant별 가격 알림을 한 곳에서 관리하세요.',
};

export default function FavoritesRoutePage() {
    return <FavoritesRouteView initialFilter="all" />;
}
