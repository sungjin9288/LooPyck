'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginModal, UserProfile } from '@/components/auth/LoginModal';
import { auth } from '@/lib/auth/firebase';
import { User } from 'firebase/auth';

interface NavbarProps {
    currentView: 'search' | 'favorites';
    setCurrentView: (view: 'search' | 'favorites') => void;
    onLogoClick: () => void;
}

export default function Navbar({ currentView, setCurrentView, onLogoClick }: NavbarProps) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoginOpen, setIsLoginOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((u) => setUser(u));
        return () => unsubscribe();
    }, []);

    return (
        <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 transition-all duration-300 border-b border-gray-100">
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
                            Fashion Intelligent Search
                        </p>
                    </div>

                    <div className="flex items-center gap-4">
                        <nav className="flex gap-2 sm:gap-4 p-1 bg-gray-100/50 rounded-xl">
                            <button
                                onClick={() => setCurrentView('search')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${currentView === 'search'
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-200/50'
                                    }`}
                            >
                                Search
                            </button>
                            <button
                                onClick={() => setCurrentView('favorites')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm sm:text-base ${currentView === 'favorites'
                                    ? 'bg-white text-red-500 shadow-sm'
                                    : 'text-gray-500 hover:text-black hover:bg-gray-200/50'
                                    }`}
                            >
                                Favorites
                            </button>
                        </nav>

                        {/* Auth Section */}
                        {user ? (
                            <UserProfile user={user} />
                        ) : (
                            <button
                                onClick={() => setIsLoginOpen(true)}
                                className="px-4 py-2 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 transition-colors"
                            >
                                Login
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        </header>
    );
}
