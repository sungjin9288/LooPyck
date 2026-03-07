'use client';

import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';

interface FavoritesShellProps {
    children: ReactNode;
}

export default function FavoritesShell({ children }: FavoritesShellProps) {
    const router = useRouter();

    function handleViewChange(view: 'search' | 'favorites' | 'recommend') {
        if (view === 'search') {
            router.push('/');
            return;
        }

        if (view === 'recommend') {
            router.push('/?view=recommend');
            return;
        }

        router.push('/favorites');
    }

    return (
        <div className="min-h-screen mesh-bg text-slate-900 pb-16 sm:pb-0">
            <Navbar
                currentView="favorites"
                setCurrentView={handleViewChange}
                onLogoClick={() => router.push('/')}
                onNotificationClick={() => router.push('/favorites/alerts')}
            />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-[calc(100vh-300px)]">
                {children}
            </main>

            <MobileBottomNav
                currentView="favorites"
                setCurrentView={handleViewChange}
            />
        </div>
    );
}
