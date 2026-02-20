'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import SearchBar from '@/components/search/SearchBar';
import RecentSearches from '@/components/search/RecentSearches';
import FavoritesPage from '@/components/favorites/FavoritesPage';
import InfiniteProductGrid from '@/components/product/InfiniteProductGrid';
import Navbar from '@/components/layout/Navbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { MoodEngine } from '@/lib/ai/moodEngine';
import TrendDiscovery from '@/components/home/TrendDiscovery';
import { SearchSort } from '@/types/searchSort';
import { addRecentSearch } from '@/utils/recentSearches';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<'search' | 'favorites'>('search');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchSort, setSearchSort] = useState<SearchSort>('sim');

  const onSearch = (query: string, sort: SearchSort = 'sim') => {
    const trimmed = query.trim();
    if (!trimmed) return;

    const expandedQuery = MoodEngine.analyze(query);
    addRecentSearch(trimmed);

    setSearchQuery(expandedQuery);
    setSearchSort(sort);
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    setCurrentView('search');
    router.push('/');
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900 pb-16 sm:pb-0">
      {/* 헤더 */}
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onLogoClick={handleLogoClick}
      />

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-[calc(100vh-300px)]">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {currentView === 'search' ? (
              <div className="space-y-8 md:space-y-12">
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 모바일 하단 네비게이션 */}
      <MobileBottomNav
        currentView={currentView}
        setCurrentView={setCurrentView}
      />

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
