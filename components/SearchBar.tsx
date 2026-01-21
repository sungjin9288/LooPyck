'use client';

import { useState, FormEvent } from 'react';

interface SearchBarProps {
  onSearch: (query: string, sort: string) => void;
  isLoading: boolean;
}

export default function SearchBar({ onSearch, isLoading }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('sim');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query, sort);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="찾고 싶은 옷을 검색하세요 (예: 청바지, 맨투맨)"
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {isLoading ? '검색 중...' : '검색'}
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm font-medium text-gray-700">정렬:</label>
          {[
            { value: 'sim', label: '정확도순' },
            { value: 'date', label: '최신순' },
            { value: 'asc', label: '낮은 가격순' },
            { value: 'dsc', label: '높은 가격순' },
          ].map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                sort === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
