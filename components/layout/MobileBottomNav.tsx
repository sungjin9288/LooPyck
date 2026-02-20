'use client';

import React from 'react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface MobileBottomNavProps {
    currentView: 'search' | 'favorites';
    setCurrentView: (view: 'search' | 'favorites') => void;
}

export default function MobileBottomNav({ currentView, setCurrentView }: MobileBottomNavProps) {
    const { t } = useLanguage();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 sm:hidden">
            {/* Safe area padding for mobile devices & Backdrop blur */}
            <div className="glass-panel border-t border-white/20 pb-safe">
                <nav className="flex items-center justify-around h-16 px-4">
                    <button
                        onClick={() => setCurrentView('search')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'search' ? 'text-accent-dark' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <SearchIcon active={currentView === 'search'} />
                        <span className="text-[10px] font-medium">{t('nav.search') || '검색'}</span>
                    </button>

                    <button
                        onClick={() => setCurrentView('favorites')}
                        className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${currentView === 'favorites' ? 'text-rose-500' : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <HeartIcon active={currentView === 'favorites'} />
                        <span className="text-[10px] font-medium">{t('nav.favorites') || '찜'}</span>
                    </button>

                    <button
                        className="flex flex-col items-center justify-center w-full h-full space-y-1 text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <UserIcon />
                        <span className="text-[10px] font-medium">프로필</span>
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

function UserIcon() {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-6 h-6"
        >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
        </svg>
    );
}
