'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { triggerHaptic } from '@/lib/native/bridge';
import { isTossWebView } from '@/lib/native/tossWebView';
import { Tab } from '@toss/tds-mobile';

interface MobileBottomNavProps {
    currentView: 'search' | 'favorites' | 'recommend';
    setCurrentView: (view: 'search' | 'favorites' | 'recommend') => void;
}

const VIEWS = ['search', 'favorites', 'recommend'] as const;

export default function MobileBottomNav({ currentView, setCurrentView }: MobileBottomNavProps) {
    const { t } = useLanguage();
    const inToss = isTossWebView();

    const labels = {
        search: t('nav.search') || '검색',
        recommend: t('nav.recommend') || '추천',
        favorites: t('nav.favorites') || '찜',
    };

    const handleSelect = (view: typeof VIEWS[number]) => {
        triggerHaptic('light');
        setCurrentView(view);
    };

    // 토스 WebView: TDS 플로팅 탭바
    if (inToss) {
        const tabIndex = VIEWS.indexOf(currentView);
        return (
            <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden pb-[var(--sab,0px)]">
                <Tab fluid onChange={(index) => handleSelect(VIEWS[index])}>
                    <Tab.Item selected={tabIndex === 0}>{labels.search}</Tab.Item>
                    <Tab.Item selected={tabIndex === 1}>{labels.recommend}</Tab.Item>
                    <Tab.Item selected={tabIndex === 2}>{labels.favorites}</Tab.Item>
                </Tab>
            </div>
        );
    }

    // 일반 브라우저 / PWA: 기존 커스텀 탭바
    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            <div className="glass-panel border-t border-white/20 pb-[var(--sab)]">
                <nav className="flex items-center justify-around h-16 px-4">
                    <button
                        onClick={() => handleSelect('search')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'search' ? 'text-accent-dark' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <SearchIcon active={currentView === 'search'} />
                        <span className="text-[10px] font-medium">{labels.search}</span>
                    </button>

                    <button
                        onClick={() => handleSelect('recommend')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'recommend' ? 'text-violet-600' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <SparklesIcon active={currentView === 'recommend'} />
                        <span className="text-[10px] font-medium">{labels.recommend}</span>
                    </button>

                    <button
                        onClick={() => handleSelect('favorites')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'favorites' ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <HeartIcon active={currentView === 'favorites'} />
                        <span className="text-[10px] font-medium">{labels.favorites}</span>
                    </button>
                </nav>
            </div>
        </div>
    );
}

function SearchIcon({ active }: { active: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={active ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
        >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>
    );
}

function SparklesIcon({ active }: { active: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={active ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-6 h-6 ${active ? 'text-violet-600' : ''}`}
        >
            <path d="m12 3-1.9 4.7L5 9.6l4.1 3.4L7.8 18 12 15.3 16.2 18l-1.3-5 4.1-3.4-5.1-1.9L12 3Z"></path>
        </svg>
    );
}

function HeartIcon({ active }: { active: boolean }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={active ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={active ? "2.5" : "2"}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-6 h-6 ${active ? 'text-rose-500' : ''}`}
        >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
    );
}
