'use client';

import { useState, useEffect } from 'react';
import { getRecentSearches, clearRecentSearches } from '@/lib/favorites';

interface RecentSearchesProps {
  onSearch: (query: string) => void;
}

export default function RecentSearches({ onSearch }: RecentSearchesProps) {
  const [searches, setSearches] = useState<string[]>([]);

  useEffect(() => {
    setSearches(getRecentSearches());
  }, []);

  const handleClear = () => {
    clearRecentSearches();
    setSearches([]);
  };

  if (searches.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700">최근 검색어</h3>
        <button
          onClick={handleClear}
          className="text-xs text-gray-500 hover:text-gray-700"
        >
          전체 삭제
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {searches.map((search, index) => (
          <button
            key={index}
            onClick={() => onSearch(search)}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
          >
            {search}
          </button>
        ))}
      </div>
    </div>
  );
}
