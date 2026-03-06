'use client';

import React, { useState, useEffect } from 'react';
import { LoginModal, UserProfile } from '@/components/auth/LoginModal';
import { auth } from '@/lib/auth/firebase';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import BrandTicker from '@/components/layout/BrandTicker'; // Phase 39 Ticker

interface NavbarProps {
    currentView: 'search' | 'favorites' | 'recommend';
    setCurrentView: (view: 'search' | 'favorites' | 'recommend') => void;
    onLogoClick: () => void;
}

export default function Navbar({ currentView, setCurrentView, onLogoClick }: NavbarProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const { t, locale, setLocale } = useLanguage();

    const toggleLanguage = () => {
        setLocale(locale === 'ko' ? 'en' : 'ko');
    };

    useEffect(() => {
        if (!auth) return;
        const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled
                ? 'bg-white/95 backdrop-blur-lg shadow-md border-b border-slate-100'
                : 'bg-white/70 backdrop-blur-md border-b border-transparent'
            }`}>
            <BrandTicker />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div
                        className="cursor-pointer group"
                        onClick={onLogoClick}
                    >
                        <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-tight group-hover:opacity-80 transition-all">
                            LooPyck
                        </h1>
                        <p className="text-gray-600 mt-1 text-sm sm:text-base group-hover:text-gray-900 transition-colors">
                            Fashion Price Comparison Platform
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <nav className="hidden sm:flex gap-2 sm:gap-4 p-1 bg-slate-100/50 rounded-xl">
                            <button
                                onClick={() => setCurrentView('search')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${currentView === 'search'
                                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                            >
                                {t('nav.search')}
                            </button>
                            <button
                                onClick={() => setCurrentView('recommend')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${currentView === 'recommend'
                                    ? 'bg-white text-violet-700 shadow-sm border border-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                            >
                                {t('nav.recommend') || '추천'}
                            </button>
                            <button
                                onClick={() => setCurrentView('favorites')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${currentView === 'favorites'
                                    ? 'bg-white text-rose-500 shadow-sm border border-slate-200/50'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'
                                    }`}
                            >
                                {t('nav.favorites')}
                            </button>
                        </nav>

                        {/* Notification Bell */}
                        <button
                            type="button"
                            className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
                            aria-label="가격 알림"
                        >
                            <span className="text-xl">🔔</span>
                        </button>

                        {/* Auth Section */}
                        {user && !user.isAnonymous ? (
                            <UserProfile user={user} />
                        ) : (
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                {t('nav.login')}
                            </button>
                        )}

                        {/* Language Toggle */}
                        <button
                            onClick={toggleLanguage}
                            className="px-3 py-1 rounded-full border border-gray-200 text-xs font-bold text-gray-500 hover:text-black hover:border-black transition-all"
                        >
                            {locale === 'ko' ? 'EN' : 'KO'}
                        </button>
                    </div>
                </div>
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </header>
    );
}
