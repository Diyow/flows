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

        {/* Threshold Alert Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          {/* Level Warning */}
          {(() => {
            const levelRatio = Math.min(currentLevel / settings.warningLevel, 1);
            const isActive = currentLevel >= settings.warningLevel;
            return (
              <div className={`relative group overflow-hidden rounded-2xl border transition-all duration-500 ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                  : 'bg-gray-800/40 border-gray-700/50 hover:border-amber-500/30'
              }`}>
                {/* Ambient glow */}
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-700 ${
                  isActive ? 'bg-amber-500/20 opacity-100' : 'bg-amber-500/5 opacity-0 group-hover:opacity-100'
                }`} />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl transition-colors ${
                        isActive ? 'bg-amber-500/20' : 'bg-amber-500/10'
                      }`}>
                        <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{t('levelWarning')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('waterLevel')}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-amber-400 tracking-tight">{settings.warningLevel}m</p>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>{t('waterLevel')}: {currentLevel.toFixed(2)}m</span>
                      <span>{Math.round(levelRatio * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isActive ? 'bg-amber-400' : 'bg-amber-400/50'
                        }`}
                        style={{ width: `${levelRatio * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Level Danger */}
          {(() => {
            const levelRatio = Math.min(currentLevel / settings.dangerLevel, 1);
            const isActive = currentLevel >= settings.dangerLevel;
            return (
              <div className={`relative group overflow-hidden rounded-2xl border transition-all duration-500 ${
                isActive
                  ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                  : 'bg-gray-800/40 border-gray-700/50 hover:border-red-500/30'
              }`}>
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-700 ${
                  isActive ? 'bg-red-500/20 opacity-100' : 'bg-red-500/5 opacity-0 group-hover:opacity-100'
                }`} />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl transition-colors ${
                        isActive ? 'bg-red-500/20' : 'bg-red-500/10'
                      }`}>
                        <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{t('levelDanger')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('waterLevel')}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-red-400 tracking-tight">{settings.dangerLevel}m</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>{t('waterLevel')}: {currentLevel.toFixed(2)}m</span>
                      <span>{Math.round(levelRatio * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isActive ? 'bg-red-400' : 'bg-red-400/50'
                        }`}
                        style={{ width: `${levelRatio * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Flow Warning */}
          {(() => {
            const flowRatio = Math.min(currentFlow / settings.warningFlow, 1);
            const isActive = currentFlow >= settings.warningFlow;
            return (
              <div className={`relative group overflow-hidden rounded-2xl border transition-all duration-500 ${
                isActive
                  ? 'bg-amber-500/10 border-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                  : 'bg-gray-800/40 border-gray-700/50 hover:border-amber-500/30'
              }`}>
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-700 ${
                  isActive ? 'bg-amber-500/20 opacity-100' : 'bg-amber-500/5 opacity-0 group-hover:opacity-100'
                }`} />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl transition-colors ${
                        isActive ? 'bg-amber-500/20' : 'bg-amber-500/10'
                      }`}>
                        <svg className="w-5 h-5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                          <line x1="12" y1="9" x2="12" y2="13" />
                          <line x1="12" y1="17" x2="12.01" y2="17" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{t('flowWarning')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('flowRate')}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        ACTIVE
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-amber-400 tracking-tight">{settings.warningFlow} <span className="text-lg font-medium text-amber-400/70">m³/s</span></p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>{t('flowRate')}: {currentFlow.toFixed(1)} m³/s</span>
                      <span>{Math.round(flowRatio * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isActive ? 'bg-amber-400' : 'bg-amber-400/50'
                        }`}
                        style={{ width: `${flowRatio * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Flow Danger */}
          {(() => {
            const flowRatio = Math.min(currentFlow / settings.dangerFlow, 1);
            const isActive = currentFlow >= settings.dangerFlow;
            return (
              <div className={`relative group overflow-hidden rounded-2xl border transition-all duration-500 ${
                isActive
                  ? 'bg-red-500/10 border-red-500/40 shadow-[0_0_25px_rgba(239,68,68,0.15)]'
                  : 'bg-gray-800/40 border-gray-700/50 hover:border-red-500/30'
              }`}>
                <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-3xl transition-opacity duration-700 ${
                  isActive ? 'bg-red-500/20 opacity-100' : 'bg-red-500/5 opacity-0 group-hover:opacity-100'
                }`} />
                <div className="relative p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl transition-colors ${
                        isActive ? 'bg-red-500/20' : 'bg-red-500/10'
                      }`}>
                        <svg className="w-5 h-5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2" />
                          <line x1="12" y1="8" x2="12" y2="12" />
                          <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">{t('flowDanger')}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{t('flowRate')}</p>
                      </div>
                    </div>
                    {isActive && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-3xl font-bold text-red-400 tracking-tight">{settings.dangerFlow} <span className="text-lg font-medium text-red-400/70">m³/s</span></p>
                  <div className="mt-3">
                    <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                      <span>{t('flowRate')}: {currentFlow.toFixed(1)} m³/s</span>
                      <span>{Math.round(flowRatio * 100)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-700/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          isActive ? 'bg-red-400' : 'bg-red-400/50'
                        }`}
                        style={{ width: `${flowRatio * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
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
