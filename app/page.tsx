'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import RecentSearches from '@/components/search/RecentSearches';
import FavoritesPage from '@/components/favorites/FavoritesPage';
import InfiniteProductGrid from '@/components/product/InfiniteProductGrid';
import Navbar from '@/components/layout/Navbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import RecentlyViewedSection from '@/components/product/RecentlyViewedSection';
import StyleRecommender from '@/components/recommend/StyleRecommender';
import TrendDiscovery from '@/components/home/TrendDiscovery';
import { SearchSort } from '@/types/searchSort';
import { addRecentSearch } from '@/utils/recentSearches';
import { motion, AnimatePresence } from 'framer-motion';
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import { UnifiedProduct } from '@/lib/api/types';
import dynamic from 'next/dynamic';

// StyleChat은 클라이언트 전용으로 동적 임포트 (chatbot + AI)
const StyleChat = dynamic(() => import('@/components/ai/StyleChat'), { ssr: false });

const TREND_KEYWORDS = [
  { emoji: '🧥', label: '봄 아우터' },
  { emoji: '👖', label: '와이드 팬츠' },
  { emoji: '👟', label: '로우탑 스니커즈' },
  { emoji: '🧶', label: '크루넥 니트' },
  { emoji: '👜', label: '미니백' },
  { emoji: '🕶️', label: '오버사이즈 선글라스' },
];

type CurrentView = 'search' | 'favorites' | 'recommend';

export default function Home() {
  const router = useRouter();
  const [currentView, setCurrentView] = useState<CurrentView>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSort, setSearchSort] = useState<SearchSort>('sim');
  const { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // URL에서 초기 검색어 복원
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) onSearch(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (query: string, sort: SearchSort = 'sim') => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setSearchQuery(trimmed);
    setSearchSort(sort);
    setCurrentView('search');
    router.replace(`/?q=${encodeURIComponent(trimmed)}`, { scroll: false });
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    setCurrentView('search');
    router.push('/');
  };

  const handleRecentProductClick = (product: UnifiedProduct) => {
    onSearch(product.title.slice(0, 20));
  };

  return (
    <div className="min-h-screen mesh-bg text-slate-900 pb-16 sm:pb-0">
      {/* 헤더 */}
      <Navbar
        currentView={currentView}
        setCurrentView={(v) => setCurrentView(v)}
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
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            {/* 🔍 검색 뷰 */}
            {currentView === 'search' && (
              <div className="space-y-8 md:space-y-12">
                <SearchBar query={searchQuery} onSearch={onSearch} />

                {/* 트렌드 키워드 칩 */}
                {!searchQuery && (
                  <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">이번 주 트렌드</h2>
                    <div className="flex flex-wrap gap-2">
                      {TREND_KEYWORDS.map(kw => (
                        <button
                          key={kw.label}
                          onClick={() => onSearch(kw.label)}
                          className="flex items-center gap-1.5 px-4 py-2 glass-panel rounded-2xl text-sm font-medium text-slate-700 hover:shadow-md hover:text-accent-dark transition-all"
                        >
                          <span>{kw.emoji}</span><span>{kw.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* 스타일 추천 CTA */}
                    <button
                      onClick={() => setCurrentView('recommend')}
                      className="mt-3 flex items-center gap-2 text-sm text-violet-600 hover:text-violet-800 font-medium transition-colors"
                    >
                      <span>🪞</span>
                      <span>체형에 맞는 스타일 추천받기 →</span>
                    </button>
                  </motion.section>
                )}

                {!searchQuery && <RecentSearches onSearch={onSearch} />}

                {!searchQuery && recentlyViewed.length > 0 && (
                  <RecentlyViewedSection
                    products={recentlyViewed}
                    onProductClick={handleRecentProductClick}
                    onClear={clearRecentlyViewed}
                  />
                )}

                {searchQuery ? (
                  <InfiniteProductGrid query={searchQuery} sort={searchSort} onSearch={onSearch} />
                ) : (
                  <TrendDiscovery onSearch={onSearch} />
                )}
              </div>
            )}

            {/* 💜 스타일 추천 뷰 */}
            {currentView === 'recommend' && (
              <StyleRecommender
                onSearch={onSearch}
                onSwitchToSearch={() => setCurrentView('search')}
              />
            )}

            {/* ❤️ 찜 뷰 */}
            {currentView === 'favorites' && <FavoritesPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* AI 스타일리스트 FloatingBot - 항상 표시, 검색 연동 */}
      <StyleChat onSearch={onSearch} />

      {/* 모바일 하단 네비게이션 */}
      <MobileBottomNav
        currentView={currentView}
        setCurrentView={(v) => setCurrentView(v)}
      />

      {/* 푸터 */}
      <footer className="bg-white/50 backdrop-blur-sm border-t border-slate-100 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-center text-slate-400 text-sm">
              LooPyck — Smart Fashion Price Comparison
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-slate-400">
              <Link href="/category/outer" className="hover:text-accent-dark transition-colors">아우터</Link>
              <Link href="/category/denim" className="hover:text-accent-dark transition-colors">데님</Link>
              <Link href="/category/sneakers" className="hover:text-accent-dark transition-colors">스니커즈</Link>
              <Link href="/brand/musinsa" className="hover:text-accent-dark transition-colors">무신사</Link>
              <Link href="/brand/29cm" className="hover:text-accent-dark transition-colors">29CM</Link>
              <Link href="/brand/wconcept" className="hover:text-accent-dark transition-colors">W컨셉</Link>
              <Link href="/brand/ably" className="hover:text-accent-dark transition-colors">에이블리</Link>
              <Link href="/brand/ssf" className="hover:text-accent-dark transition-colors">SSF샵</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
