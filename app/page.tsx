'use client';

import { useState, useMemo } from 'react';
import SearchBar from '@/components/SearchBar';
import ProductList from '@/components/ProductList';
import RecentSearches from '@/components/RecentSearches';
import FavoritesPage from '@/components/FavoritesPage';
import FilterBar, { FilterOptions } from '@/components/FilterBar';
import { Product } from '@/types/product';
import { searchProducts, parsePrice } from '@/lib/api';
import { addRecentSearch } from '@/lib/favorites';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentView, setCurrentView] = useState<'search' | 'favorites'>('search');
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: null,
    maxPrice: null,
    brands: [],
  });

  // 필터링된 상품 목록 계산
  const applyFilters = (productList: Product[]) => {
    let filtered = [...productList];

    // 가격 필터
    if (filters.minPrice !== null) {
      filtered = filtered.filter((p) => parsePrice(p.lprice) >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter((p) => parsePrice(p.lprice) <= filters.maxPrice!);
    }

    // 브랜드 필터
    if (filters.brands.length > 0) {
      filtered = filtered.filter((p) => filters.brands.includes(p.brand));
    }

    return filtered;
  };

  // 사용 가능한 브랜드 목록
  const availableBrands = useMemo(() => {
    const brands = products
      .map((p) => p.brand)
      .filter((brand) => brand && brand.trim() !== '');
    return Array.from(new Set(brands));
  }, [products]);

  const handleSearch = async (query: string, sort: string) => {
    setIsLoading(true);
    setError(null);
    setHasSearched(true);
    setCurrentView('search');

    // 최근 검색어에 추가
    addRecentSearch(query);

    try {
      const data = await searchProducts({
        query,
        display: 40,
        start: 1,
        sort: sort as 'sim' | 'date' | 'asc' | 'dsc',
      });

      setProducts(data.items);
      setFilteredProducts(applyFilters(data.items));
    } catch (err) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다');
      setProducts([]);
      setFilteredProducts([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    setFilteredProducts(applyFilters(products));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                LooPyck
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                여러 쇼핑몰의 가격을 한눈에 비교하고 가성비 있게 쇼핑하세요
              </p>
            </div>
            <nav className="flex gap-2 sm:gap-4">
              <button
                onClick={() => setCurrentView('search')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  currentView === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔍 검색
              </button>
              <button
                onClick={() => setCurrentView('favorites')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base ${
                  currentView === 'favorites'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ❤️ 찜 목록
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'search' ? (
          <>
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
              <div className="text-center py-20">
                <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6">
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
          </>
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
