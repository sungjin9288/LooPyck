'use client';

import { useEffect, useState, FormEvent } from 'react';
import VisualSearch from './VisualSearch';
import { analyzeFashionQuery } from '@/lib/search/fashionQueryAssistant';
import { pushAppNotification } from '@/lib/core/notifications';
import { SearchSort } from '@/types/searchSort';
import { logSearchInteraction } from '@/lib/search/searchInteractionClient';

interface SearchBarProps {
    query?: string;
    onSearch: (query: string, sort: SearchSort) => void;
    isLoading?: boolean;
}

export default function SearchBar({ query: initialQuery = '', onSearch, isLoading }: SearchBarProps) {
    const [query, setQuery] = useState(initialQuery);
    const [sort, setSort] = useState<SearchSort>('sim');
    const [feedback, setFeedback] = useState<{
        tone: 'alert' | 'info';
        message: string;
        suggestions: string[];
    } | null>(null);
    const sortOptions: Array<{ value: SearchSort; label: string }> = [
        { value: 'sim', label: '정확도순' },
        { value: 'asc', label: '낮은 가격순' },
        { value: 'dsc', label: '높은 가격순' },
    ];

    useEffect(() => {
        setQuery(initialQuery);
        setFeedback(null);
    }, [initialQuery]);

    useEffect(() => {
        const trimmed = query.trim();
        if (!trimmed) {
            setFeedback(null);
            return;
        }

        const analysis = analyzeFashionQuery(trimmed);
        if (!analysis.allowed) {
            setFeedback({
                tone: 'alert',
                message: analysis.reason || '패션 관련 검색어로 다시 시도해주세요.',
                suggestions: analysis.suggestedQueries,
            });
            return;
        }

        setFeedback((previous) => (
            previous?.tone === 'alert'
                ? null
                : previous
        ));
    }, [query]);

    const submitSearch = (rawQuery: string) => {
        const trimmed = rawQuery.trim();
        if (!trimmed) return;

        const analysis = analyzeFashionQuery(trimmed);
        if (!analysis.allowed) {
            setFeedback({
                tone: 'alert',
                message: analysis.reason || '패션 검색어로 다시 시도해주세요.',
                suggestions: analysis.suggestedQueries,
            });
            pushAppNotification({ title: '검색어 추천', message: analysis.reason || '패션 검색어 추천을 확인해주세요.', type: 'alert' });
            return;
        }

        if (analysis.normalizedQuery !== trimmed) {
            setFeedback({
                tone: 'info',
                message: `"${analysis.normalizedQuery}" 기준으로 검색어를 정리해 정확도를 높였습니다.`,
                suggestions: analysis.suggestedQueries.slice(0, 3),
            });
        } else if (analysis.intent === 'mixed' && analysis.suggestedQueries.length > 0) {
            setFeedback({
                tone: 'info',
                message: '검색 의도와 가까운 패션 키워드도 함께 추천합니다.',
                suggestions: analysis.suggestedQueries.slice(0, 3),
            });
        } else {
            setFeedback(null);
        }

        onSearch(trimmed, sort);
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        submitSearch(query);
    };

    return (
        <div className="w-full max-w-4xl mx-auto mb-8 animate-fade-in-up">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-3 relative group z-20">
                    <div className="flex-1 relative">
                        {/* 돋보기 아이콘 추가 */}
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="w-5 h-5 text-slate-400 group-focus-within:text-accent-dark transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="찾고 싶은 옷을 검색하세요 (예: 청바지, 맨투맨)"
                            className="w-full px-4 py-4 pl-12 pr-4 bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-accent-light/50 focus:border-accent-light text-slate-900 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg focus:bg-white sm:text-lg"
                            disabled={isLoading}
                        />
                    </div>
                    {/* Independent Visual Search Button */}
                    <div className="flex items-center">
                        <VisualSearch onSearch={(term) => submitSearch(term)} />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !query.trim()}
                        className="px-8 py-4 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 disabled:bg-slate-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-all duration-300 font-semibold hover:scale-[1.02] active:scale-95 shadow-md hover:shadow-xl whitespace-nowrap"
                    >
                        {isLoading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                검색 중
                            </span>
                        ) : '가격 비교 시작'}
                    </button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3 flex-wrap animate-fade-in-up" style={{ animationDelay: '100ms' }}>
                    <span className="text-sm font-medium text-slate-500 mr-1">정렬:</span>
                    {sortOptions.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => setSort(option.value)}
                            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 border ${sort === option.value
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-105'
                                : 'bg-white/60 text-slate-600 border-slate-200 hover:bg-white hover:border-slate-300 hover:text-slate-900 hover:scale-105 hover:shadow-sm'
                                }`}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>

                {feedback && (
                    <div
                        className={`rounded-2xl border px-4 py-4 shadow-sm ${feedback.tone === 'alert'
                            ? 'border-amber-200 bg-amber-50 text-amber-900'
                            : 'border-slate-200 bg-white/80 text-slate-800'
                            }`}
                    >
                        <p className="text-sm font-medium leading-6">{feedback.message}</p>
                        {feedback.suggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {feedback.suggestions.map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                            void logSearchInteraction({
                                                type: 'suggestion_click',
                                                query: query.trim() || suggestion,
                                                selectedQuery: suggestion,
                                                context: feedback.tone === 'alert' ? 'search_bar_blocked' : 'search_bar_refinement',
                                            });
                                            setQuery(suggestion);
                                            submitSearch(suggestion);
                                        }}
                                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${feedback.tone === 'alert'
                                            ? 'bg-white text-amber-900 hover:bg-amber-100'
                                            : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                                            }`}
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
}
