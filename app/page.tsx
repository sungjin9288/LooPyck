'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useProductSearch } from '@/hooks/useProductSearch';
import SearchBar from '@/components/search/SearchBar';
import RecentSearches from '@/components/search/RecentSearches';
import ProductList from '@/components/product/ProductList';
import FilterBar from '@/components/product/FilterBar';
import FavoritesPage from '@/components/favorites/FavoritesPage';
import InfiniteProductGrid from '@/components/product/InfiniteProductGrid';
import Navbar from '@/components/layout/Navbar';
import { MoodEngine } from '@/lib/ai/moodEngine';
import TrendDiscovery from '@/components/home/TrendDiscovery';

export default function Home() {
  const router = useRouter();
  // Legacy Hook for Analytics & History
  const {
    filteredProducts,
    isLoading,
    error,
    hasSearched,
    availableBrands,
    handleSearch,
    handleFilterChange
  } = useProductSearch();

  const [currentView, setCurrentView] = useState<'search' | 'favorites'>('search');

  // Phase 18: New Search State
  const [searchQuery, setSearchQuery] = useState('');

  const onSearch = (query: string) => {
    // Phase 33: Mood Engine Integration
    // Expands abstract queries (e.g., "가을 데이트룩") into concrete keywords
    const expandedQuery = MoodEngine.analyze(query);

    setSearchQuery(expandedQuery);
    handleSearch(expandedQuery, 'sim');
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
            {/* 검색바 */}
            <SearchBar onSearch={onSearch} isLoading={isLoading} />

            {/* 최근 검색어 */}
            {!searchQuery && <RecentSearches onSearch={onSearch} />}

            {/* 필터바 (Phase 18에서는 잠시 숨김 or 호환성 확인 필요) */}
            {/* 
            {hasSearched && !isLoading && (
              <FilterBar
                onFilterChange={handleFilterChange}
                availableBrands={availableBrands}
              />
            )}
            */}

            {/* 상품 리스트 (Phase 18 Grid) */}
            {searchQuery ? (
              <InfiniteProductGrid query={searchQuery} />
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
            Phase 18: Multi-Source Orchestration & Infinite Scaling
          </p>
        </div>
      </footer>
    </div>
  );
}
