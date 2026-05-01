'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Shield } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

export function Header() {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 glass border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
            <Image
              src="/FLOWS.png"
              alt="FLOWS Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {t('appName')}
            </h1>
            <p className="text-xs text-gray-400">{t('tagline')}</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
            <Clock className="w-4 h-4" />
            <span>
              {t('updated')}: {mounted ? now.toLocaleTimeString() : '--:--:--'}
            </span>
          </div>
          <LanguageToggle />
          <Link
            href="/admin"
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">{t('admin')}</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
