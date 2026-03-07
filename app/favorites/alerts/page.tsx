import type { Metadata } from 'next';
import FavoritesRouteView from '@/components/favorites/FavoritesRouteView';

export const metadata: Metadata = {
    title: 'Price Alerts | LooPyck',
    description: 'variant별 목표가 알림과 최근 도착한 가격 알림을 관리하세요.',
};

export default function FavoriteAlertsRoutePage() {
    return <FavoritesRouteView initialFilter="alerts" />;
}
