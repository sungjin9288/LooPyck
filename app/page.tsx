'use client';

import { useState } from 'react';
import { useProductSearch } from '@/hooks/useProductSearch';
import SearchBar from '@/components/search/SearchBar';
import RecentSearches from '@/components/search/RecentSearches';
import ProductList from '@/components/product/ProductList';
import FilterBar from '@/components/product/FilterBar';
import FavoritesPage from '@/components/favorites/FavoritesPage';

export default function Home() {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white selection:bg-blue-100 selection:text-blue-900">
      {/* 헤더 */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div
              className="cursor-pointer group"
              onClick={() => setCurrentView('search')}
            >
              <h1 className="text-2xl sm:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 group-hover:from-blue-700 group-hover:to-purple-700 transition-all">
                LooPyck
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base group-hover:text-gray-900 transition-colors">
                여러 쇼핑몰의 가격을 한눈에 비교하고 가성비 있게 쇼핑하세요
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
            <SearchBar onSearch={handleSearch} isLoading={isLoading} />

            {/* 최근 검색어 */}
            {!hasSearched && <RecentSearches onSearch={(query) => handleSearch(query, 'sim')} />}

            {/* 필터바 */}
            {hasSearched && !isLoading && (
              <FilterBar
                onFilterChange={handleFilterChange}
                availableBrands={availableBrands}
              />
            )}

            {/* 상품 리스트 */}
            {hasSearched ? (
              <ProductList products={filteredProducts} isLoading={isLoading} error={error} />
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
                  원하는 상품을 검색해보세요
                </h2>
                <p className="text-gray-600">
                  청바지, 맨투맨, 운동화 등 찾고 싶은 패션 아이템을 입력하세요
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
            네이버 쇼핑 API를 활용한 가격 비교 서비스입니다
          </p>
        </div>
      </footer>
    </div>
  );
}
