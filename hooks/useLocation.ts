'use client';

import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { initializeFirebase } from '@/lib/firebase';

export interface LocationSettings {
    name: string;
    lat: number;
    lng: number;
}

const DEFAULT_LOCATION: LocationSettings = {
    name: 'Denpasar, Sidakarya',
    lat: -8.7115,
    lng: 115.2277,
};

const LOCAL_STORAGE_KEY = 'floodwatch-location';

export function useLocation() {
    const [location, setLocation] = useState<LocationSettings>(DEFAULT_LOCATION);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load location from Firestore or localStorage
    useEffect(() => {
        const { db } = initializeFirebase();

        // Try localStorage first for immediate display
        try {
            const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (cached) {
                setLocation(JSON.parse(cached));
            }
        } catch (e) {
            console.error('Failed to load cached location:', e);
        }

        // If Firebase is configured, listen for real-time updates
        if (db) {
            const docRef = doc(db, 'settings', 'location');

            const unsubscribe = onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data() as LocationSettings;
                    setLocation(data);
                    // Cache in localStorage
                    try {
                        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
                    } catch (e) {
                        console.error('Failed to cache location:', e);
                    }
                }
                setLoading(false);
            }, (error) => {
                console.error('Error listening to location:', error);
                setLoading(false);
            });

            return () => unsubscribe();
        } else {
            setLoading(false);
        }
    }, []);

    // Update location in Firestore
    const updateLocation = useCallback(async (newLocation: LocationSettings) => {
        setSaving(true);

        try {
            const { db } = initializeFirebase();

            if (db) {
                const docRef = doc(db, 'settings', 'location');
                await setDoc(docRef, newLocation);
            }

            // Always update localStorage and local state
            setLocation(newLocation);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newLocation));

            return true;
        } catch (error) {
            console.error('Failed to update location:', error);
            return false;
        } finally {
            setSaving(false);
        }
    }, []);

    return {
        location,
        loading,
        saving,
        updateLocation,
        defaultLocation: DEFAULT_LOCATION,
    };
}
