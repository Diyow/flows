'use client';

import { useState, useEffect, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { MapPin, Save, RotateCcw } from 'lucide-react';
import { LocationSettings } from '@/hooks/useLocation';

interface LocationSettingsProps {
    location: LocationSettings;
    onSave: (location: LocationSettings) => Promise<boolean>;
    saving: boolean;
    defaultLocation: LocationSettings;
}

const mapContainerStyle = {
    width: '100%',
    height: '350px',
    borderRadius: '0.75rem',
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    mapTypeControl: false,
    streetViewControl: false,
    fullscreenControl: false,
    styles: [
        { elementType: 'geometry', stylers: [{ color: '#212121' }] },
        { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#212121' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e4d69' }] },
        { featureType: 'road', elementType: 'geometry.fill', stylers: [{ color: '#2c2c2c' }] },
    ],
};

export function LocationSettingsComponent({
    location,
    onSave,
    saving,
    defaultLocation,
}: LocationSettingsProps) {
    const [name, setName] = useState(location.name);
    const [lat, setLat] = useState(location.lat.toString());
    const [lng, setLng] = useState(location.lng.toString());
    const [markerPosition, setMarkerPosition] = useState({ lat: location.lat, lng: location.lng });
    const [saved, setSaved] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: apiKey || '',
        id: 'google-map-script',
    });

    // Sync local state with prop changes
    useEffect(() => {
        setName(location.name);
        setLat(location.lat.toString());
        setLng(location.lng.toString());
        setMarkerPosition({ lat: location.lat, lng: location.lng });
    }, [location]);

    // Check for changes
    useEffect(() => {
        const latNum = parseFloat(lat) || 0;
        const lngNum = parseFloat(lng) || 0;
        const changed =
            name !== location.name ||
            latNum !== location.lat ||
            lngNum !== location.lng;
        setHasChanges(changed);
    }, [name, lat, lng, location]);

    // Handle coordinate input changes - update marker
    const handleLatChange = (value: string) => {
        setLat(value);
        const latNum = parseFloat(value);
        if (!isNaN(latNum) && latNum >= -90 && latNum <= 90) {
            setMarkerPosition(prev => ({ ...prev, lat: latNum }));
        }
    };

    const handleLngChange = (value: string) => {
        setLng(value);
        const lngNum = parseFloat(value);
        if (!isNaN(lngNum) && lngNum >= -180 && lngNum <= 180) {
            setMarkerPosition(prev => ({ ...prev, lng: lngNum }));
        }
    };

    // Handle map click - update inputs
    const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
            const newLat = e.latLng.lat();
            const newLng = e.latLng.lng();
            setLat(newLat.toFixed(6));
            setLng(newLng.toFixed(6));
            setMarkerPosition({ lat: newLat, lng: newLng });
        }
    }, []);

    // Handle save
    const handleSave = async () => {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);

        if (isNaN(latNum) || isNaN(lngNum)) {
            return;
        }

        const success = await onSave({
            name: name.trim() || 'Unnamed Location',
            lat: latNum,
            lng: lngNum,
        });

        if (success) {
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    // Reset to default
    const handleReset = () => {
        setName(defaultLocation.name);
        setLat(defaultLocation.lat.toString());
        setLng(defaultLocation.lng.toString());
        setMarkerPosition({ lat: defaultLocation.lat, lng: defaultLocation.lng });
    };

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 mb-6">
                <MapPin className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Location Settings</h3>
            </div>

            <div className="space-y-4">
                {/* Location Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Location Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g., Denpasar, Sidakarya"
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                    />
                </div>

                {/* Coordinates Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Latitude
                        </label>
                        <input
                            type="number"
                            value={lat}
                            onChange={(e) => handleLatChange(e.target.value)}
                            step="0.0001"
                            min="-90"
                            max="90"
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Longitude
                        </label>
                        <input
                            type="number"
                            value={lng}
                            onChange={(e) => handleLngChange(e.target.value)}
                            step="0.0001"
                            min="-180"
                            max="180"
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Interactive Map */}
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">
                        Click on map to set location
                    </label>
                    {isLoaded ? (
                        <div className="rounded-xl overflow-hidden border border-gray-700">
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={markerPosition}
                                zoom={13}
                                onClick={handleMapClick}
                                options={mapOptions}
                            >
                                <Marker
                                    position={markerPosition}
                                    icon={{
                                        path: google.maps.SymbolPath.CIRCLE,
                                        scale: 10,
                                        fillColor: '#06b6d4',
                                        fillOpacity: 1,
                                        strokeColor: '#ffffff',
                                        strokeWeight: 3,
                                    }}
                                />
                            </GoogleMap>
                        </div>
                    ) : (
                        <div className="h-[350px] bg-gray-900 rounded-xl flex items-center justify-center">
                            <p className="text-gray-500">Loading map...</p>
                        </div>
                    )}
                </div>

                {/* Helper Text */}
                <p className="text-xs text-gray-500">
                    This location will be used for weather forecasts and the sensor map marker on the public page.
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    <button
                        onClick={handleReset}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-600 text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Reset to Default
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !hasChanges}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${saved
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                        <Save className="w-4 h-4" />
                        {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Location'}
                    </button>
                </div>
            </div>
        </div>
    );
}
