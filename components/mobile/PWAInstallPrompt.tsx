'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isIosManualMode, setIsIosManualMode] = useState(false);
    const { t } = useLanguage();

    useEffect(() => {
        const hasDismissed = localStorage.getItem('pwa_dismissed');
        const inStandalone =
            window.matchMedia('(display-mode: standalone)').matches ||
            ((window.navigator as Navigator & { standalone?: boolean }).standalone === true);

        const ua = window.navigator.userAgent.toLowerCase();
        const isIos = /iphone|ipad|ipod/.test(ua);
        const isSafari = ua.includes('safari') && !/crios|fxios|edgios/.test(ua);

        // iOS Safari fallback: no beforeinstallprompt event
        if (!hasDismissed && isIos && isSafari && !inStandalone) {
            setIsIosManualMode(true);
            setIsVisible(true);
        }

        const handler = (event: Event) => {
            const installEvent = event as BeforeInstallPromptEvent;
            installEvent.preventDefault();
            setDeferredPrompt(installEvent);
            if (!hasDismissed && !inStandalone) {
                setIsIosManualMode(false);
                setIsVisible(true);
            }
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setIsVisible(false);
        }
    };

    const handleDismiss = () => {
        setIsVisible(false);
        localStorage.setItem('pwa_dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="fixed bottom-4 left-4 right-4 z-[9999] bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 max-w-sm mx-auto"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-white font-bold text-xl">
                            LP
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">{t('pwa.installTitle')}</h3>
                            <p className="text-xs text-gray-500">
                                {isIosManualMode ? t('pwa.iosGuide') : t('pwa.installDesc')}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDismiss}
                            className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
                        >
                            {t('pwa.later')}
                        </button>
                        {!isIosManualMode && (
                            <button
                                onClick={handleInstall}
                                className="flex-1 py-2.5 bg-black text-white text-sm font-bold rounded-lg hover:bg-gray-800 shadow-md"
                            >
                                {t('pwa.installBtn')}
                            </button>
                        )}
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
