'use client';

import { Cloud, CloudRain, Sun, Droplets, Wind, RefreshCw, AlertTriangle } from 'lucide-react';
import { useWeather } from '@/hooks/useWeather';
import { useTranslation } from '@/context/LanguageContext';

// Map OpenWeatherMap icon codes to Lucide icons
function getWeatherIcon(iconCode: string) {
    if (iconCode.includes('01')) return Sun; // Clear
    if (iconCode.includes('02') || iconCode.includes('03') || iconCode.includes('04')) return Cloud; // Clouds
    if (iconCode.includes('09') || iconCode.includes('10') || iconCode.includes('11')) return CloudRain; // Rain
    return Cloud;
}

interface WeatherForecastProps {
    location: {
        name: string;
        lat: number;
        lng: number;
    };
}

export function WeatherForecast({ location }: WeatherForecastProps) {
    const { weather, loading, error, refresh, isHighRainRisk } = useWeather({
        lat: location.lat,
        lng: location.lng,
        name: location.name,
    });
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="p-6 rounded-lg bg-gray-800 border border-gray-600">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-20 bg-gray-700 rounded mb-4"></div>
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex-1 h-24 bg-gray-700 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (error && !weather) {
        return (
            <div className="p-6 rounded-lg bg-gray-800 border border-gray-600">
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
        <div className="p-6 rounded-lg bg-gray-800 border border-gray-600">
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
                <div className="mb-4 p-3 rounded-lg bg-amber-900/30 border border-amber-500 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-400 text-sm">{t('highRainWarning')}</p>
                </div>
            )}

            {/* Current Weather */}
            <div className="flex items-center justify-between mb-6 p-4 rounded-lg bg-gray-900 border border-gray-700">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-sky-900/50">
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
                                className={`p-3 rounded-lg text-center ${isHighRain
                                    ? 'bg-amber-900/30 border border-amber-500'
                                    : 'bg-gray-900 border border-gray-700'
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
