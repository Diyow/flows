'use client';

import { useState, useEffect, useCallback } from 'react';

export interface WeatherData {
    current: {
        temp: number;
        humidity: number;
        windSpeed: number;
        description: string;
        icon: string;
        rainChance: number;
    };
    forecast: Array<{
        date: string;
        dayName: string;
        temp: number;
        description: string;
        icon: string;
        rainChance: number;
        rainAmount: number;
    }>;
    location: string;
    lastFetched: number;
}

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds
const CACHE_KEY = 'floodwatch-weather-cache';

// Denpasar, Sidakarya coordinates
const LOCATION = {
    lat: -8.7115,
    lon: 115.2277,
    name: 'Denpasar, Sidakarya'
};

export function useWeather() {
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWeather = useCallback(async (forceRefresh = false) => {
        const apiKey = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

        if (!apiKey || apiKey === 'your_openweathermap_key') {
            setError('Weather API not configured');
            setLoading(false);
            return;
        }

        // Check cache first (unless forcing refresh)
        if (!forceRefresh) {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const parsedCache: WeatherData = JSON.parse(cached);
                    const now = Date.now();

                    // Use cache if it's less than 30 minutes old
                    if (now - parsedCache.lastFetched < CACHE_DURATION) {
                        setWeather(parsedCache);
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error('Cache read error:', e);
            }
        }

        try {
            setLoading(true);

            // Fetch current weather
            const currentRes = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?lat=${LOCATION.lat}&lon=${LOCATION.lon}&appid=${apiKey}&units=metric`
            );

            if (!currentRes.ok) {
                throw new Error('Failed to fetch current weather');
            }

            const currentData = await currentRes.json();

            // Fetch 5-day forecast
            const forecastRes = await fetch(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${LOCATION.lat}&lon=${LOCATION.lon}&appid=${apiKey}&units=metric`
            );

            if (!forecastRes.ok) {
                throw new Error('Failed to fetch forecast');
            }

            const forecastData = await forecastRes.json();

            // Process forecast data (get one entry per day)
            const dailyForecasts: WeatherData['forecast'] = [];
            const processedDays = new Set<string>();

            for (const item of forecastData.list) {
                const date = new Date(item.dt * 1000);
                const dateKey = date.toISOString().split('T')[0];

                if (!processedDays.has(dateKey) && dailyForecasts.length < 5) {
                    processedDays.add(dateKey);
                    dailyForecasts.push({
                        date: dateKey,
                        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                        temp: Math.round(item.main.temp),
                        description: item.weather[0].description,
                        icon: item.weather[0].icon,
                        rainChance: item.pop ? Math.round(item.pop * 100) : 0,
                        rainAmount: item.rain?.['3h'] || 0,
                    });
                }
            }

            const weatherData: WeatherData = {
                current: {
                    temp: Math.round(currentData.main.temp),
                    humidity: currentData.main.humidity,
                    windSpeed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
                    description: currentData.weather[0].description,
                    icon: currentData.weather[0].icon,
                    rainChance: currentData.rain?.['1h'] ? 80 : (currentData.clouds?.all > 70 ? 50 : 20),
                },
                forecast: dailyForecasts,
                location: LOCATION.name,
                lastFetched: Date.now(),
            };

            // Cache the result
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify(weatherData));
            } catch (e) {
                console.error('Cache write error:', e);
            }

            setWeather(weatherData);
            setError(null);
        } catch (err) {
            console.error('Weather fetch error:', err);
            setError('Failed to load weather data');

            // Try to use stale cache as fallback
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    setWeather(JSON.parse(cached));
                }
            } catch (e) {
                console.error('Fallback cache error:', e);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch weather on mount
    useEffect(() => {
        fetchWeather();
    }, [fetchWeather]);

    return {
        weather,
        loading,
        error,
        refresh: () => fetchWeather(true),
        isHighRainRisk: weather ? weather.forecast.some(day => day.rainChance > 70) : false,
    };
}
