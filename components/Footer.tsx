'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="border-t border-gray-800 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-gray-500 text-xs sm:text-sm text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="relative w-5 h-5 opacity-80">
                <Image
                  src="/FLOWS.png"
                  alt="FLOWS Logo"
                  fill
                  className="object-contain filter grayscale opacity-70"
                />
              </div>
              <span className="font-semibold text-gray-400">{t('appName')}</span>
            </div>
            <span className="hidden sm:inline text-gray-700">|</span>
            <span className="opacity-70">{t('tagline')}</span>
          </div>
          <div className="flex items-center gap-4 border-t sm:border-t-0 border-gray-800/50 pt-4 sm:pt-0 w-full sm:w-auto justify-center sm:justify-end">
            <span className="opacity-60 text-[10px] sm:text-xs">© 2026 {t('allRightsReserved')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
