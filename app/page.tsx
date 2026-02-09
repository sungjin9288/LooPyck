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
    setSearchQuery(query);
    handleSearch(query, 'sim'); // Legacy call for side effects
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    setCurrentView('search');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-white text-black selection:bg-neutral-100 selection:text-black">
      {/* 헤더 */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div
              className="cursor-pointer group"
              onClick={handleLogoClick}
            >
              <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight group-hover:opacity-80 transition-all">
                LooPyck
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base group-hover:text-gray-900 transition-colors">
                Multi-Source Price Compare & AI Curation
              </p>
            </div>
            <nav className="flex gap-2 sm:gap-4 p-1 bg-gray-100/50 rounded-xl">
              <button
                onClick={() => setCurrentView('search')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${currentView === 'search'
                  ? 'bg-white text-blue-600 shadow-sm scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
              >
                🔍 검색
              </button>
              <button
                onClick={() => setCurrentView('favorites')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${currentView === 'favorites'
                  ? 'bg-white text-red-500 shadow-sm scale-105'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/50'
                  }`}
              >
                ❤️ 찜 목록
              </button>
            </nav>
          </div>
        </div>
      </header>

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
              <div className="text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6 hover:rotate-12 transition-transform duration-500">
                  <svg
                    className="w-16 h-16 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Global Fashion Search
                </h2>
                <p className="text-gray-600">
                  네이버, 무신사, 29CM... 전 세계 패션 데이터를 한곳에서 검색하세요.
                </p>
              </div>
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
