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
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

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
      <Header lastUpdate={lastUpdate} />

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
      </main>

      <Footer />
    </div>
  );
}
