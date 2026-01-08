'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Clock, Shield, LogOut, Home } from 'lucide-react';

interface HeaderProps {
    variant?: 'public' | 'admin';
    lastUpdate?: Date;
    userEmail?: string;
    onSignOut?: () => void;
}

export function Header({ variant = 'public', lastUpdate, userEmail, onSignOut }: HeaderProps) {
    const { t } = useTranslation();

    return (
        <header className="sticky top-0 z-50 glass border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <Image
                        src="/FLOWS.png"
                        alt="FLOWS Logo"
                        width={40}
                        height={40}
                        className="rounded-xl"
                    />
                    <div>
                        <h1 className="text-lg font-bold text-white">
                            {variant === 'admin' ? 'Admin Dashboard' : t('appName')}
                        </h1>
                        <p className="text-xs text-gray-400">
                            {variant === 'admin' && userEmail ? userEmail : t('tagline')}
                        </p>
                    </div>
                </Link>

                <div className="flex items-center gap-2 md:gap-4">
                    {variant === 'public' && lastUpdate && (
                        <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{t('updated')}: {lastUpdate.toLocaleTimeString()}</span>
                        </div>
                    )}

                    {variant === 'public' && <LanguageToggle />}

                    {variant === 'public' ? (
                        <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                        >
                            <Shield className="w-4 h-4" />
                            <span className="hidden sm:inline">{t('admin')}</span>
                        </Link>
                    ) : (
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition-colors"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline">Public View</span>
                            </Link>
                            {onSignOut && (
                                <button
                                    onClick={onSignOut}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-sm transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    <span className="hidden sm:inline">Sign Out</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
