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
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5">
              <Image
                src="/FLOWS.png"
                alt="FLOWS Logo"
                fill
                className="object-contain"
              />
            </div>
            <span>{t('appName')} — {t('tagline')}</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="hover:text-gray-300 transition-colors flex items-center gap-1"
            >
              {t('admin')} Portal <ExternalLink className="w-3 h-3" />
            </Link>
            <span>© 2026 {t('allRightsReserved')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
