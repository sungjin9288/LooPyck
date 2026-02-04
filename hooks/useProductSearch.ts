import { useState, useMemo } from 'react';
import { Product } from '@/types/product';
import { searchProducts, parsePrice } from '@/lib/api';
import { addRecentSearch } from '@/lib/favorites';

export interface FilterOptions {
  minPrice: number | null;
  maxPrice: number | null;
  brands: string[];
}

export function useProductSearch() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    minPrice: null,
    maxPrice: null,
    brands: [],
  });

  // 필터링된 상품 목록 계산
  const applyFilters = (productList: Product[], currentFilters: FilterOptions) => {
    let filtered = [...productList];

    // 가격 필터
    if (currentFilters.minPrice !== null) {
      filtered = filtered.filter((p) => parsePrice(p.lprice) >= currentFilters.minPrice!);
    }
    if (currentFilters.maxPrice !== null) {
      filtered = filtered.filter((p) => parsePrice(p.lprice) <= currentFilters.maxPrice!);
    }

    // 브랜드 필터
    if (currentFilters.brands.length > 0) {
      filtered = filtered.filter((p) => currentFilters.brands.includes(p.brand));
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
      setFilteredProducts(applyFilters(data.items, filters));
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
    setFilteredProducts(applyFilters(products, newFilters));
  };

  return {
    products,
    filteredProducts,
    isLoading,
    error,
    hasSearched,
    filters,
    availableBrands,
    handleSearch,
    handleFilterChange
  };
}
