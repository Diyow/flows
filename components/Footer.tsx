'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import { ExternalLink } from 'lucide-react';

interface FooterProps {
    variant?: 'public' | 'admin';
    userEmail?: string;
}

export function Footer({ variant = 'public', userEmail }: FooterProps) {
    const { t } = useTranslation();

    return (
        <footer className="border-t border-gray-800 mt-12">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
                    <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                        <Image
                            src="/FLOWS.png"
                            alt="FLOWS Logo"
                            width={20}
                            height={20}
                            className="rounded"
                        />
                        <span>
                            {variant === 'admin' ? t('adminPanel') : `${t('appName')} Monitoring System`}
                        </span>
                    </Link>
                    <div className="flex items-center gap-4">
                        {variant === 'public' ? (
                            <>
                                <Link href="/admin" className="hover:text-gray-300 transition-colors flex items-center gap-1">
                                    {t('admin')} Portal <ExternalLink className="w-3 h-3" />
                                </Link>
                                <span>© 2026 {t('allRightsReserved')}</span>
                            </>
                        ) : (
                            userEmail && (
                                <span>
                                    Logged in as: <span className="text-gray-300">{userEmail}</span>
                                </span>
                            )
                        )}
                    </div>
                </div>
            </div>
        </footer>
    );
}
