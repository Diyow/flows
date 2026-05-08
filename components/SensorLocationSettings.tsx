'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Save, RotateCcw, Crosshair } from 'lucide-react';
import { doc, setDoc, Firestore } from 'firebase/firestore';
import { useWaterDataContext } from '@/context/WaterDataContext';

interface SensorLocationSettingsProps {
    firebaseDb: Firestore | null;
    onLogEvent?: (message: string, type: 'info' | 'warning' | 'danger') => Promise<void>;
    adminEmail?: string;
}

const mapContainerStyle = {
    width: '100%',
    height: '280px',
    borderRadius: '0.75rem',
};

const mapOptions: google.maps.MapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    clickableIcons: false,
    styles: [
        { elementType: 'geometry', stylers: [{ color: '#212121' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
        { featureType: 'administrative', elementType: 'geometry', stylers: [{ color: '#757575' }] },
        { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#181818' }] },
        { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
        { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#373737' }] },
        { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3c3c3c' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e4d69' }] },
        { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d3d3d' }] },
    ],
};

export function SensorLocationSettings({ firebaseDb, onLogEvent, adminEmail }: SensorLocationSettingsProps) {
    // Use centralized sensor location from context (no duplicate Firestore listener)
    const { sensorLocation } = useWaterDataContext();
    const [location, setLocation] = useState(sensorLocation);
    const [editLocation, setEditLocation] = useState(sensorLocation);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({
        lat: sensorLocation.lat,
        lng: sensorLocation.lng,
    });

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey || '',
        id: 'google-map-script',
    });

    // Sync with context when sensorLocation changes (e.g. after save)
    useEffect(() => {
        setLocation(sensorLocation);
        setEditLocation(sensorLocation);
        setMapCenter({ lat: sensorLocation.lat, lng: sensorLocation.lng });
    }, [sensorLocation]);

    // Handle map click to set location
    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = parseFloat(e.latLng.lat().toFixed(6));
            const lng = parseFloat(e.latLng.lng().toFixed(6));
            setEditLocation(prev => ({ ...prev, lat, lng }));
            setMapCenter({ lat, lng });
        }
    }, []);

    // Handle marker drag end
    const handleMarkerDragEnd = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const lat = parseFloat(e.latLng.lat().toFixed(6));
            const lng = parseFloat(e.latLng.lng().toFixed(6));
            setEditLocation(prev => ({ ...prev, lat, lng }));
            setMapCenter({ lat, lng });
        }
    }, []);

    // Save to Firestore
    const handleSave = async () => {
        if (!firebaseDb) return;
        setSaving(true);
        try {
            const locationRef = doc(firebaseDb, 'settings', 'location');
            await setDoc(locationRef, {
                lat: editLocation.lat,
                lng: editLocation.lng,
                name: editLocation.name,
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            await onLogEvent?.(
                `${adminEmail ?? 'Admin'} updated sensor location — "${editLocation.name}" (${editLocation.lat}, ${editLocation.lng})`,
                'info'
            );
        } catch (error) {
            console.error('Failed to update location:', error);
        }
        setSaving(false);
    };

    // Reset to saved values
    const handleReset = () => {
        setEditLocation(location);
        setMapCenter({ lat: location.lat, lng: location.lng });
    };

    // Check if there are unsaved changes
    const hasChanges =
        editLocation.lat !== location.lat ||
        editLocation.lng !== location.lng ||
        editLocation.name !== location.name;

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Sensor Location</h3>
                {hasChanges && (
                    <span className="ml-auto text-xs text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full">
                        Unsaved changes
                    </span>
                )}
            </div>

            {/* Map Picker */}
            {isLoaded && apiKey && apiKey !== 'your_google_maps_key' ? (
                <div className="rounded-xl overflow-hidden border border-gray-700 mb-5">
                    <GoogleMap
                        mapContainerStyle={mapContainerStyle}
                        center={mapCenter}
                        zoom={15}
                        options={mapOptions}
                        onClick={handleMapClick}
                    >
                        <Marker
                            position={{ lat: editLocation.lat, lng: editLocation.lng }}
                            draggable={true}
                            onDragEnd={handleMarkerDragEnd}
                            icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                scale: 12,
                                fillColor: '#10b981',
                                fillOpacity: 1,
                                strokeColor: '#ffffff',
                                strokeWeight: 3,
                            }}
                        />
                    </GoogleMap>
                    <div className="bg-gray-900/80 px-3 py-2 text-xs text-gray-400 flex items-center gap-1.5">
                        <Crosshair className="w-3 h-3 text-emerald-400" />
                        Click on the map or drag the marker to set sensor location
                    </div>
                </div>
            ) : (
                <div className="rounded-xl bg-gray-900/50 border border-gray-700 p-8 mb-5 text-center">
                    <MapPin className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 text-sm">
                        {!apiKey || apiKey === 'your_google_maps_key'
                            ? 'Google Maps API key not configured. Enter coordinates manually below.'
                            : 'Loading map...'}
                    </p>
                </div>
            )}

            {/* Location Name */}
            <div className="mb-5">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                    Location Name
                </label>
                <input
                    type="text"
                    value={editLocation.name}
                    onChange={(e) => setEditLocation(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Denpasar, Sidakarya"
                    className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                />
            </div>

            {/* Lat/Lng Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-5">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Latitude
                    </label>
                    <input
                        type="number"
                        step="0.000001"
                        value={editLocation.lat}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= -90 && val <= 90) {
                                setEditLocation(prev => ({ ...prev, lat: val }));
                                setMapCenter(prev => ({ ...prev, lat: val }));
                            }
                        }}
                        className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Longitude
                    </label>
                    <input
                        type="number"
                        step="0.000001"
                        value={editLocation.lng}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= -180 && val <= 180) {
                                setEditLocation(prev => ({ ...prev, lng: val }));
                                setMapCenter(prev => ({ ...prev, lng: val }));
                            }
                        }}
                        className="w-full px-4 py-3 bg-gray-900/70 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
                    />
                </div>
            </div>

            {/* Current saved location display */}
            {location.name && (
                <div className="mb-5 p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Current saved location</p>
                    <p className="text-sm text-gray-300">
                        {location.name}{' '}
                        <span className="text-gray-500 font-mono text-xs">
                            ({location.lat}, {location.lng})
                        </span>
                    </p>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleReset}
                    disabled={!hasChanges || saving}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium text-gray-400 bg-gray-700/30 border border-gray-700 hover:bg-gray-700/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving || !hasChanges || !editLocation.name.trim()}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${saved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Location'}
                </button>
            </div>
        </div>
    );
}
