'use client';

import React, { useState, useEffect } from 'react';
import { signInWithGoogle, signOut, auth } from '@/lib/auth/firebase';
import { User } from 'firebase/auth';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl transform transition-all scale-100 opacity-100">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black"
                >
                    ✕
                </button>

                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold mb-2">Welcome to LooPyck</h2>
                    <p className="text-gray-500 text-sm">Sign in to save your favorite items and get personalized recommendations.</p>
                </div>

                <button
                    onClick={async () => {
                        try {
                            await signInWithGoogle();
                            onClose();
                        } catch (e) {
                            alert('Login Failed');
                        }
                    }}
                    className="w-full flex items-center justify-center gap-3 bg-white border border-gray-200 hover:bg-gray-50 text-black font-medium py-3 px-4 rounded-xl transition-all"
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        className="w-5 h-5"
                    />
                    Continue with Google
                </button>
            </div>
        </div>
    );
}

export function UserProfile({ user }: { user: User }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 focus:outline-none"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-full border border-gray-200"
                />
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-50">
                        <p className="text-sm font-medium text-black truncate">{user.displayName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50"
                    >
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    );
}
