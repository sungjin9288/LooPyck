'use client';

import { useRouter } from 'next/navigation';
import FavoritesPage, { type FavoriteFilter } from './FavoritesPage';
import FavoritesShell from './FavoritesShell';

interface FavoritesRouteViewProps {
    initialFilter?: FavoriteFilter;
}

export default function FavoritesRouteView({ initialFilter = 'all' }: FavoritesRouteViewProps) {
    const router = useRouter();

    return (
        <FavoritesShell>
            <FavoritesPage
                initialFilter={initialFilter}
                onFilterChange={(filter) => router.replace(filter === 'alerts' ? '/favorites/alerts' : '/favorites')}
            />
        </FavoritesShell>
    );
}
