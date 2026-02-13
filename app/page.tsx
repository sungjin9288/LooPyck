'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import RecentSearches from '@/components/search/RecentSearches';
import FavoritesPage from '@/components/favorites/FavoritesPage';
import InfiniteProductGrid from '@/components/product/InfiniteProductGrid';
import Navbar from '@/components/layout/Navbar';
import { MoodEngine } from '@/lib/ai/moodEngine';
import TrendDiscovery from '@/components/home/TrendDiscovery';
import { SearchSort } from '@/types/searchSort';

export default function Home() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'search' | 'favorites'>('search');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSort, setSearchSort] = useState<SearchSort>('sim');

  const onSearch = (query: string, sort: SearchSort = 'sim') => {
    const expandedQuery = MoodEngine.analyze(query);

    setSearchQuery(expandedQuery);
    setSearchSort(sort);
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    setCurrentView('search');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-neutral-100 selection:text-black">
      {/* 헤더 */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogoClick={handleLogoClick}
      />

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-[calc(100vh-300px)]">
        {currentView === 'search' ? (
          <div className="space-y-6">
            <SearchBar onSearch={onSearch} />

            {!searchQuery && <RecentSearches onSearch={onSearch} />}

            {searchQuery ? (
              <InfiniteProductGrid query={searchQuery} sort={searchSort} />
            ) : (
              <TrendDiscovery onSearch={onSearch} />
            )}
          </div>
        ) : (
          <FavoritesPage />
        )}
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-600 text-sm">
            LooPyck — Smart Fashion Price Comparison
          </p>
        </div>
      </footer>
    </div>
  );
}
