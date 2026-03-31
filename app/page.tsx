'use client';

import { useState, useEffect } from 'react';
import { useWaterData } from '@/hooks/useWaterData';
import { useLocation } from '@/hooks/useLocation';
import { useTranslation } from '@/context/LanguageContext';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatusIndicator } from '@/components/StatusIndicator';
import { EmergencyContacts } from '@/components/EmergencyContacts';
import { WeatherForecast } from '@/components/WeatherForecast';

export default function Home() {
  const { currentLevel, currentFlow, settings, status, lastUpdate } = useWaterData();
  const { location } = useLocation();
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <Header variant="public" lastUpdate={mounted ? lastUpdate : undefined} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6">
        {/* Status Hero Section */}
        <section>
          <StatusIndicator status={status} currentLevel={currentLevel} currentFlow={currentFlow} />
        </section>

        {/* Quick Info Cards */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-600 text-center">
            <p className="text-gray-400 text-xs">{t('waterLevel')}</p>
            <p className="text-2xl font-bold text-cyan-400">{currentLevel.toFixed(2)}m</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-600 text-center">
            <p className="text-gray-400 text-xs">{t('flowRate')}</p>
            <p className="text-2xl font-bold text-cyan-400">{currentFlow.toFixed(1)} m³/s</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-600 text-center">
            <p className="text-gray-400 text-xs">{t('levelWarning')}</p>
            <p className="text-2xl font-bold text-amber-400">{settings.warningLevel}m</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-600 text-center">
            <p className="text-gray-400 text-xs">{t('levelDanger')}</p>
            <p className="text-2xl font-bold text-red-400">{settings.dangerLevel}m</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-600 text-center">
            <p className="text-gray-400 text-xs">{t('flowWarning')}</p>
            <p className="text-2xl font-bold text-amber-400">{settings.warningFlow} m³/s</p>
          </div>
          <div className="p-4 rounded-lg bg-gray-800 border border-gray-600 text-center">
            <p className="text-gray-400 text-xs">{t('status')}</p>
            <p className={`text-2xl font-bold ${status === 'safe' ? 'text-emerald-400' :
              status === 'warning' ? 'text-amber-400' : 'text-red-400'
              }`}>
              {t(status)}
            </p>
          </div>
        </section>

        {/* Weather Forecast */}
        <section>
          <WeatherForecast location={location} />
        </section>

        {/* Emergency Contacts */}
        <section>
          <EmergencyContacts />
        </section>
      </main>

      {/* Footer */}
      <Footer variant="public" />
    </div>
  );
}
