'use client';

import { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';
import { useWaterDataContext } from '@/context/WaterDataContext';

const mapContainerStyle = {
    width: '100%',
    height: '300px',
    borderRadius: '0.75rem',
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
        // Dark mode map styling
        { elementType: 'geometry', stylers: [{ color: '#212121' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
        { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
        { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
        { featureType: 'road.highway.controlled_access', elementType: 'geometry', stylers: [{ color: '#4e4e4e' }] },
        { featureType: 'transit', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e4d69' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
    ],
};

interface SensorMapProps {
    currentLevel?: number;
    currentFlow?: number;
    status?: 'safe' | 'warning' | 'danger';
}

export function SensorMap({ currentLevel = 0, currentFlow = 0, status = 'safe' }: SensorMapProps) {
    const { t } = useTranslation();
    // Use centralized sensor location from context (no duplicate Firestore listener)
    const { sensorLocation } = useWaterDataContext();
    const [showInfoWindow, setShowInfoWindow] = useState(false);
    const [map, setMap] = useState<google.maps.Map | null>(null);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey || '',
        id: 'google-map-script',
    });

    const onLoad = useCallback((map: google.maps.Map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const getMarkerColor = () => {
        switch (status) {
            case 'danger': return '#ef4444';
            case 'warning': return '#f59e0b';
            default: return '#10b981';
        }
    };

    const googleMapsUrl = `https://www.google.com/maps?q=${sensorLocation.lat},${sensorLocation.lng}`;

    // Handle case where API key is not configured
    if (!apiKey || apiKey === 'your_google_maps_key') {
        return (
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">{t('sensorLocation')}</h3>
                </div>

                <div className="rounded-xl bg-gray-900/50 p-8 text-center">
                    <MapPin className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">{t('mapApiKeyRequired')}</p>
                    <a
                        href={googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/30 transition-colors"
                    >
                        <Navigation className="w-4 h-4" />
                        {t('viewOnMaps')}
                        <ExternalLink className="w-4 h-4" />
                    </a>
                </div>

                <div className="mt-4 text-center text-gray-500 text-sm">
                    📍 {sensorLocation.name} ({sensorLocation.lat}, {sensorLocation.lng})
                </div>
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">{t('sensorLocation')}</h3>
                </div>
                <div className="text-center py-8 text-gray-400">
                    {t('failedToLoadMap')}
                </div>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-700 rounded w-1/3 mb-4"></div>
                <div className="h-[300px] bg-gray-700 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">{t('sensorLocation')}</h3>
                </div>
                <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ExternalLink className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('viewOnMaps')}</span>
                </a>
            </div>

            <div className="rounded-xl overflow-hidden border border-gray-700">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={{ lat: sensorLocation.lat, lng: sensorLocation.lng }}
                    zoom={15}
                    onLoad={onLoad}
                    onUnmount={onUnmount}
                    options={mapOptions}
                >
                    <Marker
                        position={{ lat: sensorLocation.lat, lng: sensorLocation.lng }}
                        onClick={() => setShowInfoWindow(true)}
                        icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 12,
                            fillColor: getMarkerColor(),
                            fillOpacity: 1,
                            strokeColor: '#ffffff',
                            strokeWeight: 3,
                        }}
                    />

                    {showInfoWindow && (
                        <InfoWindow
                            position={{ lat: sensorLocation.lat, lng: sensorLocation.lng }}
                            onCloseClick={() => setShowInfoWindow(false)}
                        >
                            <div className="p-2 min-w-[150px]">
                                <h4 className="font-bold text-gray-900 mb-2">{t('mapSensorInfo')}</h4>
                                <div className="space-y-1 text-sm text-gray-700">
                                    <p><strong>{t('waterLevel')}:</strong> {currentLevel.toFixed(2)}m</p>
                                    <p><strong>{t('flowRate')}:</strong> {currentFlow.toFixed(1)} m³/s</p>
                                    <p><strong>{t('status')}:</strong> <span style={{ color: getMarkerColor() }}>{t(status as any).toUpperCase()}</span></p>
                                </div>
                            </div>
                        </InfoWindow>
                    )}
                </GoogleMap>
            </div>

            <div className="mt-4 flex flex-col items-center gap-2 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getMarkerColor() }} />
                    <span>{sensorLocation.name}</span>
                </div>
                <p className="text-center text-xs text-amber-400/80 px-4">
                    {t('mapSensorDisclaimer')}
                </p>
            </div>
        </div>
    );
}
