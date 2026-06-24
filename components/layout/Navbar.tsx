'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/components/auth/LoginModal';
import { signInWithGoogle } from '@/lib/auth/firebase';
import { getReadableAuthMessage } from '@/lib/auth/authErrorMessage';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import BrandTicker from '@/components/layout/BrandTicker'; // Phase 39 Ticker
import { useUser } from '@/contexts/UserContext';
import { pushAppNotification } from '@/lib/core/notifications';
import { isTossWebView } from '@/lib/native/tossWebView';

interface NavbarProps {
    currentView: 'search' | 'favorites' | 'recommend';
    setCurrentView: (view: 'search' | 'favorites' | 'recommend') => void;
    onLogoClick: () => void;
    onNotificationClick?: () => void;
}

export default function Navbar({ currentView, setCurrentView, onLogoClick, onNotificationClick }: NavbarProps) {
    const [scrolled, setScrolled] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [loginError, setLoginError] = useState<string | null>(null);
    const { t, locale, setLocale } = useLanguage();
    const { user, linkAccount } = useUser();

    // 토스 WebView 안에서는 네이티브 네비게이션 바 사용 → 숨김
    if (isTossWebView()) return null;

    const toggleLanguage = () => {
        setLocale(locale === 'ko' ? 'en' : 'ko');
    };

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogin = async () => {
        try {
            setIsLoggingIn(true);
            setLoginError(null);
            if (user?.isAnonymous) {
                await linkAccount();
            } else {
                await signInWithGoogle();
            }
        } catch (error) {
            const message = getReadableAuthMessage(error);
            setLoginError(message);
            pushAppNotification({
                title: '로그인 실패',
                message,
                type: 'alert',
            });
        } finally {
            setIsLoggingIn(false);
        }
    };

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
                        <h1 className="text-2xl sm:text-3xl font-bold text-black tracking-[-0.03em] group-hover:opacity-80 transition-all">
                            LooPyck
                        </h1>
                        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400 group-hover:text-slate-600 transition-colors">
                            Fashion · Price Intelligence
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
                            onClick={onNotificationClick}
                            className="relative p-2 rounded-full text-slate-600 hover:text-black hover:bg-slate-100 transition-colors"
                            aria-label="가격 알림"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6} aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                        </button>

                        {/* Auth Section */}
                        {user && !user.isAnonymous ? (
                            <UserProfile user={user} />
                        ) : (
                            <button
                                type="button"
                                onClick={handleLogin}
                                disabled={isLoggingIn}
                                className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                {isLoggingIn ? '로그인 중...' : t('nav.login')}
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
            {loginError && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        로그인 실패: {loginError}
                    </div>
                </div>
            )}
        </header>
    );
}
