'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Shield, Home, LogOut } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';

interface HeaderProps {
  variant?: 'default' | 'admin';
  userEmail?: string;
  onSignOut?: () => void;
  lastUpdate?: Date;
}

export function Header({ variant = 'default', userEmail, onSignOut, lastUpdate }: HeaderProps) {
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0d0d14]/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side — always the same branding */}
        <Link href={variant === 'admin' ? '/admin' : '/'} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 transition-transform group-hover:scale-110">
            <Image
              src="/FLOWS.png"
              alt="FLOWS Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {variant === 'admin' ? t('adminPanel') : t('appName')}
            </h1>
            <p className="text-xs text-gray-400">
              {variant === 'admin' && userEmail ? userEmail : t('tagline')}
            </p>
          </div>
        </Link>

        {/* Right side — variant-specific actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {variant === 'default' ? (
            <>
              <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
                <Clock className="w-4 h-4" />
                <span>
                  {t('updated')}: {mounted && lastUpdate ? lastUpdate.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
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
            </>
          ) : (
            <>
              <LanguageToggle />
              <Link
                href="/"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{t('publicView') || 'Public View'}</span>
              </Link>
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{t('signOut') || 'Sign Out'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
