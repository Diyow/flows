'use client';

import { useState, useEffect } from 'react';
import { Cloud, CloudRain, Sun, Thermometer, Droplets, Wind, RefreshCw, AlertTriangle } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useTranslation } from '@/context/LanguageContext';

// Map OpenWeatherMap icon codes to Lucide icons
function getWeatherIcon(iconCode: string) {
    if (iconCode.includes('01')) return Sun; // Clear
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) return Cloud; // Clouds
    if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) return CloudRain; // Rain
    return Cloud;
}

// Delay before showing skeleton (ms) — prevents flicker on fast cache loads
const SKELETON_DELAY = 300;

export function WeatherForecast() {
    const { t, language } = useTranslation();
    const { weather, loading, error, refresh, isHighRainRisk } = useWeather(language);
    const [showSkeleton, setShowSkeleton] = useState(false);

    // Only show skeleton if loading takes longer than SKELETON_DELAY
    useEffect(() => {
        if (!loading) {
            setShowSkeleton(false);
            return;
        }

        const timer = setTimeout(() => setShowSkeleton(true), SKELETON_DELAY);
        return () => clearTimeout(timer);
    }, [loading]);

    if (loading && showSkeleton) {
        return (
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 animate-pulse">
                {/* Header skeleton */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="w-5 h-5 bg-gray-700 rounded" />
                        <div className="h-5 bg-gray-700 rounded w-36" />
                    </div>
                    <div className="w-8 h-8 bg-gray-700 rounded-lg" />
                </div>
                {/* Current weather skeleton */}
                <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gray-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-700 rounded-xl" />
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-700 rounded w-28" />
                            <div className="h-8 bg-gray-700 rounded w-20" />
                            <div className="h-3 bg-gray-700 rounded w-24" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 bg-gray-700 rounded w-16" />
                        <div className="h-3 bg-gray-700 rounded w-20" />
                        <div className="h-3 bg-gray-700 rounded w-28" />
                    </div>
                </div>
                {/* Forecast skeleton */}
                <div className="h-3 bg-gray-700 rounded w-20 mb-3" />
                <div className="grid grid-cols-5 gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="p-3 rounded-xl bg-gray-900/50 flex flex-col items-center gap-1.5">
                            <div className="h-3 bg-gray-700 rounded w-10" />
                            <div className="w-6 h-6 bg-gray-700 rounded" />
                            <div className="h-4 bg-gray-700 rounded w-8" />
                            <div className="h-3 bg-gray-700 rounded w-6" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // While loading but before skeleton delay, render nothing (prevents flicker)
    if (loading) return null;

    if (error && !weather) {
        return (
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <Cloud className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-white">{t('weather')}</h3>
                </div>
                <div className="text-center py-8">
                    <Cloud className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                    <p className="text-gray-400">{t('noWeatherData')}</p>
                    <p className="text-gray-500 text-sm mt-1">{error}</p>
                </div>
            </div>
        );
    }

    if (!weather) return null;

    const CurrentIcon = getWeatherIcon(weather.current.icon);

    return (
        <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Cloud className="w-5 h-5 text-sky-400" />
                    <h3 className="text-lg font-semibold text-white">{t('weather')}</h3>
                </div>
                <button
                    onClick={refresh}
                    className="p-2 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                    title="Refresh weather"
                >
                    <RefreshCw className="w-4 h-4" />
                </button>
            </div>

            {/* High Rain Warning */}
            {isHighRainRisk && (
                <div className="mb-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-400 text-sm">{t('highRainWarning')}</p>
                </div>
            )}

            {/* Current Weather */}
            <div className="flex items-center justify-between mb-6 p-4 rounded-xl bg-gray-900/50">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-sky-500/20">
                        <CurrentIcon className="w-10 h-10 text-sky-400" />
                    </div>
                    <div>
                        <p className="text-gray-400 text-sm">{weather.location}</p>
                        <p className="text-3xl font-bold text-white">{weather.current.temp}°C</p>
                        <p className="text-gray-300 capitalize">{weather.current.description}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span>{weather.current.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                        <Wind className="w-4 h-4 text-cyan-400" />
                        <span>{weather.current.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 col-span-2">
                        <CloudRain className="w-4 h-4 text-indigo-400" />
                        <span>{t('rainChance')}: {weather.current.rainChance}%</span>
                    </div>
                </div>
            </div>

            {/* 5-Day Forecast */}
            <div>
                <p className="text-sm text-gray-400 mb-3">{t('forecast')}</p>
                <div className="grid grid-cols-5 gap-2">
                    {weather.forecast.map((day, index) => {
                        const DayIcon = getWeatherIcon(day.icon);
                        const isHighRain = day.rainChance > 70;

                        return (
                            <div
                                key={day.date}
                                className={`p-3 rounded-xl text-center transition-colors ${isHighRain
                                    ? 'bg-amber-500/10 border border-amber-500/30'
                                    : 'bg-gray-900/50 hover:bg-gray-900/70'
                                    }`}
                            >
                                <p className="text-xs text-gray-400 mb-1">
                                    {index === 0 ? t('today') : day.dayName}
                                </p>
                                <DayIcon className={`w-6 h-6 mx-auto mb-1 ${isHighRain ? 'text-amber-400' : 'text-sky-400'
                                    }`} />
                                <p className="text-white font-medium">{day.temp}°</p>
                                <p className={`text-xs ${isHighRain ? 'text-amber-400' : 'text-gray-500'}`}>
                                    {day.rainChance}%
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
