'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
    const { language, setLanguage } = useLanguage();

    return (
        <button
            onClick={() => setLanguage(language === 'en' ? 'id' : 'en')}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
            title={language === 'en' ? 'Switch to Indonesian' : 'Ganti ke Bahasa Inggris'}
        >
            <Globe className="w-4 h-4" />
            <span className="font-medium">{language === 'en' ? 'EN' : 'ID'}</span>
        </button>
    );
}
