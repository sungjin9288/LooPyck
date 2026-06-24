'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import SearchBar from '@/components/search/SearchBar';
import RecentSearches from '@/components/search/RecentSearches';
import InfiniteProductGrid from '@/components/product/InfiniteProductGrid';
import Navbar from '@/components/layout/Navbar';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import CompareShortlistSection from '@/components/product/CompareShortlistSection';
import RecentlyViewedSection from '@/components/product/RecentlyViewedSection';
import TrendDiscovery from '@/components/home/TrendDiscovery';
import StyleRecommender from '@/components/recommend/StyleRecommender';
import { normalizeSearchSort, SearchSort } from '@/types/searchSort';
import { addRecentSearch } from '@/utils/recentSearches';
import { motion } from 'framer-motion';
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
  const [searchRunId, setSearchRunId] = useState(0);
  const { recentlyViewed, addToRecentlyViewed, clearRecentlyViewed } = useRecentlyViewed();

  // URL에서 초기 검색어 복원
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    const view = params.get('view');
    const sort = normalizeSearchSort(params.get('sort'));

    if (view === 'recommend') {
      setCurrentView('recommend');
    }

    if (q) {
      onSearch(q, sort);
      return;
    }

    setSearchSort(sort);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSearch = (query: string, sort: SearchSort = 'sim') => {
    const trimmed = query.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    setSearchQuery(trimmed);
    setSearchSort(sort);
    setSearchRunId((previous) => previous + 1);
    setCurrentView('search');
    const params = new URLSearchParams({ q: trimmed });
    if (sort !== 'sim') {
      params.set('sort', sort);
    }
    router.replace(`/?${params.toString()}`, { scroll: false });
  };

  const handleViewChange = (view: CurrentView) => {
    if (view === 'favorites') {
      router.push('/favorites');
      return;
    }

    setCurrentView(view);

    if (view === 'recommend') {
      router.replace('/?view=recommend', { scroll: false });
      return;
    }

    if (!searchQuery) {
      router.replace('/', { scroll: false });
    }
  };

  const handleLogoClick = () => {
    setSearchQuery('');
    setSearchSort('sim');
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
        setCurrentView={handleViewChange}
        onLogoClick={handleLogoClick}
        onNotificationClick={() => router.push('/favorites/alerts')}
      />

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 min-h-[calc(100vh-300px)]">
        {/* 뷰 전환: key별 motion.div로 enter 애니메이션만 사용.
            AnimatePresence(exit 대기)는 search 뷰의 무거운 자식 때문에 exit가 완료되지
            않아 recommend 뷰가 마운트되지 못하는 deadlock을 유발해 제거함. */}
        {currentView === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="space-y-8 md:space-y-12"
            >
                {/* 에디토리얼 히어로 (검색 전에만) */}
                {!searchQuery && (
                  <section className="relative overflow-hidden rounded-3xl border border-black/5 bg-[#e7e1d8]">
                    <div className="grid items-stretch md:grid-cols-[1.1fr_0.9fr]">
                      <div className="flex flex-col justify-center px-7 py-10 sm:px-10 md:py-16 md:pl-14">
                        <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-500">
                          2026 S/S · Smart Shopping
                        </p>
                        <h2 className="font-serif text-[2.1rem] leading-[1.06] tracking-[-0.02em] text-stone-900 sm:text-5xl lg:text-[3.4rem]">
                          좋은 옷을,<br />가장 좋은 가격에.
                        </h2>
                        <p className="mt-5 max-w-md text-sm leading-relaxed text-stone-600 sm:text-base">
                          무신사 · 29CM · W컨셉을 한 번에 비교하고, AI가 지금이 살 때인지 알려드려요.
                        </p>
                      </div>
                      <div className="relative min-h-[260px] md:min-h-[420px]">
                        <img
                          src="/hero/editorial-coat.webp"
                          alt="에디토리얼 미니멀 코트 룩"
                          className="absolute inset-0 h-full w-full object-cover object-top"
                          loading="eager"
                        />
                      </div>
                    </div>
                  </section>
                )}

                <SearchBar query={searchQuery} sort={searchSort} onSearch={onSearch} />

                {/* 트렌드 키워드 칩 */}
                {!searchQuery && (
                  <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div className="mb-4 flex items-end justify-between">
                      <h2 className="font-serif text-2xl tracking-tight text-slate-900 sm:text-3xl">이번 주 트렌드</h2>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">This week</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {TREND_KEYWORDS.map(kw => (
                        <button
                          key={kw.label}
                          onClick={() => onSearch(kw.label)}
                          className="flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-all hover:border-stone-900 hover:text-stone-900"
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

                {/* 카테고리 타일 (에디토리얼) */}
                {!searchQuery && (
                  <section>
                    <div className="mb-4 flex items-end justify-between">
                      <h2 className="font-serif text-2xl tracking-tight text-slate-900 sm:text-3xl">카테고리</h2>
                      <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">Shop by category</span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 sm:gap-5">
                      {[
                        { slug: 'outer', label: '아우터', en: 'Outerwear', img: '/hero/cat-coat.webp' },
                        { slug: 'denim', label: '데님', en: 'Denim', img: '/hero/cat-denim.webp' },
                        { slug: 'sneakers', label: '스니커즈', en: 'Sneakers', img: '/hero/cat-sneakers.webp' },
                      ].map((cat) => (
                        <Link key={cat.slug} href={`/category/${cat.slug}`} className="group block">
                          <div className="relative aspect-square overflow-hidden rounded-2xl bg-stone-100">
                            <img
                              src={cat.img}
                              alt={cat.label}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                              loading="lazy"
                            />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/45 to-transparent px-4 pb-3 pt-10">
                              <p className="font-serif text-base text-white sm:text-lg">{cat.label}</p>
                              <p className="text-[10px] uppercase tracking-[0.18em] text-white/70">{cat.en}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </section>
                )}

                {!searchQuery && <RecentSearches onSearch={onSearch} />}

                {!searchQuery && recentlyViewed.length > 0 && (
                  <RecentlyViewedSection
                    products={recentlyViewed}
                    onProductClick={handleRecentProductClick}
                    onClear={clearRecentlyViewed}
                  />
                )}

                <CompareShortlistSection />

                {searchQuery ? (
                  <InfiniteProductGrid
                    key={`${searchQuery}:${searchSort}:${searchRunId}`}
                    query={searchQuery}
                    sort={searchSort}
                    onSearch={onSearch}
                  />
                ) : (
                  <TrendDiscovery onSearch={onSearch} />
                )}
            </motion.div>
          )}

          {/* 💜 스타일 추천 뷰 */}
          {currentView === 'recommend' && (
            <motion.div
              key="recommend"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <StyleRecommender
                onSearch={onSearch}
                onSwitchToSearch={() => setCurrentView('search')}
              />
            </motion.div>
          )}
      </main>

      {/* AI 스타일리스트 FloatingBot - 항상 표시, 검색 연동 */}
      <StyleChat onSearch={onSearch} />

      {/* 모바일 하단 네비게이션 */}
      <MobileBottomNav
        currentView={currentView}
        setCurrentView={handleViewChange}
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
