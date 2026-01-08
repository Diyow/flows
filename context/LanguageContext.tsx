'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, Language, TranslationKey } from '@/lib/translations';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [language, setLanguageState] = useState<Language>('en');
    const [mounted, setMounted] = useState(false);

    // Load saved language preference on mount
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('floodwatch-language') as Language;
        if (saved && (saved === 'en' || saved === 'id')) {
            setLanguageState(saved);
        } else {
            // Auto-detect based on browser language
            const browserLang = navigator.language.toLowerCase();
            if (browserLang.startsWith('id')) {
                setLanguageState('id');
            }
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('floodwatch-language', lang);
    };

    // Translation function with parameter support
    const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
        let text: string = translations[language][key] || translations.en[key] || key;

        // Replace parameters like {count} with actual values
        if (params) {
            Object.entries(params).forEach(([paramKey, value]) => {
                text = text.replace(`{${paramKey}}`, String(value));
            });
        }

        return text;
    };

    // Prevent hydration mismatch by not rendering until mounted
    if (!mounted) {
        return (
            <LanguageContext.Provider value={{ language: 'en', setLanguage, t }}>
                {children}
            </LanguageContext.Provider>
        );
    }

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Shorthand hook for just the translation function
export function useTranslation() {
    const { t, language } = useLanguage();
    return { t, language };
}
