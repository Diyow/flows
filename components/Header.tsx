'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Clock, Shield, Home, LogOut, Box } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useSettings } from '@/context/SettingsContext';
import { LanguageToggle } from '@/components/LanguageToggle';

interface HeaderProps {
  variant?: 'default' | 'admin';
  userEmail?: string;
  onSignOut?: () => void;
  lastUpdate?: Date;
}

export function Header({ variant = 'default', userEmail, onSignOut, lastUpdate }: HeaderProps) {
  const { t } = useTranslation();
  const { enable3D, setEnable3D } = useSettings();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-[#0d0d14]/95 backdrop-blur-md border-b border-gray-700/50 shadow-lg shadow-black/20">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side — always the same branding */}
        <Link href={variant === 'admin' ? '/admin' : '/'} className="flex items-center gap-2 sm:gap-3 group min-w-0">
          <div className="relative w-8 h-8 sm:w-10 sm:h-10 transition-transform group-hover:scale-110 flex-shrink-0">
            <Image
              src="/FLOWS.png"
              alt="FLOWS Logo"
              width={40}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide truncate">
              {variant === 'admin' ? t('adminPanel') : t('appName')}
            </h1>
            <p className="text-[10px] sm:text-xs text-gray-400 truncate max-w-[120px] xs:max-w-[160px] sm:max-w-none">
              {variant === 'admin' && userEmail ? userEmail : t('tagline')}
            </p>
          </div>
        </Link>

        {/* Right side — variant-specific actions */}
        <div className="flex items-center gap-2 md:gap-4">
          {variant === 'default' ? (
            <>
              <div className="flex items-center gap-1 sm:gap-2 text-gray-400 text-[10px] sm:text-sm mr-2">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <div className="flex flex-col sm:flex-row sm:gap-1">
                  <span className="hidden sm:inline">{t('updated')}:</span>
                  <span>
                    {mounted && lastUpdate 
                      ? lastUpdate.toLocaleTimeString(t('locale' as any), { hour: '2-digit', minute: '2-digit' }) 
                      : '--:--'}
                  </span>
                  <span className="hidden md:inline">
                    {mounted && lastUpdate 
                      ? ` ${lastUpdate.toLocaleDateString(t('locale' as any), { day: 'numeric', month: 'short' })}` 
                      : ''}
                  </span>
                </div>
              </div>

              {/* 3D Toggle */}
              <button
                onClick={() => setEnable3D(!enable3D)}
                className={`p-2 rounded-lg transition-all ${
                  enable3D 
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                    : 'bg-gray-800 text-gray-500 border border-gray-700'
                }`}
                title={enable3D ? t('disable3D' as any) : t('enable3D' as any)}
              >
                <Box className={`w-4 h-4 sm:w-5 sm:h-5 ${enable3D ? 'animate-pulse' : ''}`} />
              </button>

              <LanguageToggle />
              <Link
                href="/admin"
                className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors flex-shrink-0"
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
                className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors flex-shrink-0"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline">{t('publicView') || 'Public View'}</span>
              </Link>
              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors flex-shrink-0"
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
