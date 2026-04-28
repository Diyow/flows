'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useWaterData } from '@/hooks/useWaterData';
import { useTranslation } from '@/context/LanguageContext';
import { WaterLevelGauge } from '@/components/WaterLevelGauge';
import { WaterLevelChart } from '@/components/WaterLevelChart';
import { EmergencyContacts } from '@/components/EmergencyContacts';
import { WeatherForecast } from '@/components/WeatherForecast';
import { SensorMap } from '@/components/SensorMap';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Droplets, Clock, Shield, ExternalLink } from 'lucide-react';
import Link from 'next/link';

// Dynamic import – Three.js/R3F needs the browser's WebGL context
const HeroScene = dynamic(
  () => import('@/components/HeroScene').then((mod) => mod.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[520px] md:h-[600px] rounded-2xl bg-gray-900/50 border border-gray-800/60 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-gray-500 text-sm">Loading 3D scene…</span>
        </div>
      </div>
    ),
  }
);

export default function Home() {
  const { currentLevel, currentFlow, history, settings, status, lastUpdate } = useWaterData();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20">
              <Droplets className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">{t('appName')}</h1>
              <p className="text-xs text-gray-400">{t('tagline')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 text-gray-400 text-sm">
              <Clock className="w-4 h-4" />
              <span>{t('updated')}: {mounted ? lastUpdate.toLocaleTimeString() : '--:--:--'}</span>
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
        {/* 3D Hero Section */}
        <section className="animate-fade-in">
          <HeroScene status={status} currentLevel={currentLevel} currentFlow={currentFlow} />
        </section>

        {/* Gauge and Chart Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Water Level Gauge */}
          <div className="lg:col-span-1 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <WaterLevelGauge
              level={currentLevel}
              warningLevel={settings.warningLevel}
              dangerLevel={settings.dangerLevel}
            />
          </div>

          {/* Water Level Chart */}
          <div className="lg:col-span-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <WaterLevelChart
              data={history}
              warningLevel={settings.warningLevel}
              dangerLevel={settings.dangerLevel}
            />
          </div>
        </section>

        {/* Quick Info Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('waterLevel')}</p>
            <p className="text-2xl font-bold text-cyan-400">{currentLevel.toFixed(2)}m</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('flowRate')}</p>
            <p className="text-2xl font-bold text-purple-400">{currentFlow.toFixed(1)} m³/s</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('levelWarning')}</p>
            <p className="text-2xl font-bold text-amber-400">{settings.warningLevel}m</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('levelDanger')}</p>
            <p className="text-2xl font-bold text-red-400">{settings.dangerLevel}m</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('flowWarning')}</p>
            <p className="text-2xl font-bold text-amber-400">{settings.warningFlow} m³/s</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wide">{t('status')}</p>
            <p className={`text-2xl font-bold ${status === 'safe' ? 'text-emerald-400' :
              status === 'warning' ? 'text-amber-400' : 'text-red-400'
              }`}>
              {t(status)}
            </p>
          </div>
        </section>

        {/* Weather and Map Grid */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in" style={{ animationDelay: '0.35s' }}>
          <WeatherForecast />
          <SensorMap
            currentLevel={currentLevel}
            currentFlow={currentFlow}
            status={status}
          />
        </section>

        {/* Emergency Contacts */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <EmergencyContacts />
        </section>

        {/* Safety Tips */}
        {/* <section className="p-6 rounded-xl bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 animate-fade-in" style={{ animationDelay: '0.5s' }}>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            {t('safetyGuidelines')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-300 text-sm">
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                {t('doMonitor')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                {t('doSupplies')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span>
                {t('doRoutes')}
              </li>
            </ul>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                {t('dontWalk')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                {t('dontContact')}
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-400">✗</span>
                {t('dontReturn')}
              </li>
            </ul>
          </div>
        </section> */}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Droplets className="w-4 h-4 text-cyan-400" />
              <span>{t('appName')} Monitoring System</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/admin" className="hover:text-gray-300 transition-colors flex items-center gap-1">
                {t('admin')} Portal <ExternalLink className="w-3 h-3" />
              </Link>
              <span>© 2026 {t('allRightsReserved')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
