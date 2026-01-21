'use client';

import { useState } from 'react';

export interface FilterOptions {
  minPrice: number | null;
  maxPrice: number | null;
  brands: string[];
}

interface FilterBarProps {
  onFilterChange: (filters: FilterOptions) => void;
  availableBrands: string[];
}

export default function FilterBar({ onFilterChange, availableBrands }: FilterBarProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  const handleApplyFilters = () => {
    onFilterChange({
      minPrice: minPrice ? parseInt(minPrice) : null,
      maxPrice: maxPrice ? parseInt(maxPrice) : null,
      brands: selectedBrands,
    });
  };

  const handleResetFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setSelectedBrands([]);
    onFilterChange({
      minPrice: null,
      maxPrice: null,
      brands: [],
    });
  };

  const toggleBrand = (brand: string) => {
    if (selectedBrands.includes(brand)) {
      setSelectedBrands(selectedBrands.filter((b) => b !== brand));
    } else {
      setSelectedBrands([...selectedBrands, brand]);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
        필터
        {(minPrice || maxPrice || selectedBrands.length > 0) && (
          <span className="ml-2 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
            {[minPrice, maxPrice, ...selectedBrands].filter(Boolean).length}
          </span>
        )}
      </button>

      {showFilters && (
        <div className="mt-4 p-4 bg-white border border-gray-300 rounded-lg space-y-4">
          {/* 가격 범위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              가격 범위
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                placeholder="최소 가격"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">~</span>
              <input
                type="number"
                placeholder="최대 가격"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 브랜드 필터 */}
          {availableBrands.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                브랜드 ({selectedBrands.length}개 선택)
              </label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {availableBrands.slice(0, 20).map((brand) => (
                  <button
                    key={brand}
                    onClick={() => toggleBrand(brand)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                      selectedBrands.includes(brand)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3">
            <button
              onClick={handleApplyFilters}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              적용
            </button>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              초기화
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
