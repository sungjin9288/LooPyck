'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { dictionary, Locale } from './dictionary';

interface LanguageContextType {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>('ko');

    useEffect(() => {
        const saved = localStorage.getItem('loopyck_locale') as Locale;
        if (saved && (saved === 'ko' || saved === 'en')) {
            setLocale(saved);
        }
    }, []);

    const updateLocale = (newLocale: Locale) => {
        setLocale(newLocale);
        localStorage.setItem('loopyck_locale', newLocale);
    };

    const t = (path: string) => {
        const keys = path.split('.');
        let current: any = dictionary[locale];

        for (const key of keys) {
            if (current[key] === undefined) return path;
            current = current[key];
        }
        return current;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale: updateLocale, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) throw new Error('useLanguage must be used within LanguageProvider');
    return context;
};
