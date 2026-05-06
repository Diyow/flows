'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    addDoc,
    updateDoc,
    query,
    orderBy,
    limit,
    where,
    Timestamp,
    setDoc,
    Firestore
} from 'firebase/firestore';
import { db, isFirebaseConfigured, initializeFirebase } from '@/lib/firebase';

export interface WaterReading {
    id?: string;
    level: number;
    flow: number; // Water flow rate in m³/s
    timestamp: Date;
}

export interface ThresholdSettings {
    warningLevel: number;
    dangerLevel: number;
}

export interface SensorLocation {
    lat: number;
    lng: number;
    name: string;
}

export interface LogEntry {
    id?: string;
    message: string;
    type: 'info' | 'alert';
    timestamp: Date;
}

/**
 * Pick an adaptive bucket size based on the time span of the data.
 * Keeps the chart at roughly 30-60 data points regardless of how much history exists.
 *
 *   < 30 min  →  1-minute buckets   (~30 points)
 *   < 2 hours →  5-minute buckets   (~24 points)
 *   < 6 hours →  15-minute buckets  (~24 points)
 *   < 12 hours → 30-minute buckets  (~24 points)
 *   ≥ 12 hours → 60-minute buckets  (~24 points)
 */
function getAdaptiveBucketMs(readings: WaterReading[]): number {
    if (readings.length < 2) return 60_000;

    const oldest = readings[0].timestamp.getTime();
    const newest = readings[readings.length - 1].timestamp.getTime();
    const spanMs = newest - oldest;
    const spanMinutes = spanMs / 60_000;

    if (spanMinutes < 30) return 60_000;        // 1 min
    if (spanMinutes < 120) return 5 * 60_000;    // 5 min
    if (spanMinutes < 360) return 15 * 60_000;   // 15 min
    if (spanMinutes < 720) return 30 * 60_000;   // 30 min
    return 60 * 60_000;                           // 1 hour
}

/**
 * Downsample readings by grouping them into time buckets and averaging values.
 * Bucket size is chosen adaptively based on the data's time span.
 */
function downsampleReadings(readings: WaterReading[]): WaterReading[] {
    if (readings.length === 0) return [];

    const bucketMs = getAdaptiveBucketMs(readings);
    const buckets = new Map<number, WaterReading[]>();

    for (const reading of readings) {
        const bucketKey = Math.floor(reading.timestamp.getTime() / bucketMs) * bucketMs;
        if (!buckets.has(bucketKey)) {
            buckets.set(bucketKey, []);
        }
        buckets.get(bucketKey)!.push(reading);
    }

    const downsampled: WaterReading[] = [];
    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);

    for (const key of sortedKeys) {
        const bucket = buckets.get(key)!;
        const avgLevel = bucket.reduce((sum, r) => sum + r.level, 0) / bucket.length;
        const avgFlow = bucket.reduce((sum, r) => sum + r.flow, 0) / bucket.length;
        // Use the middle timestamp of the bucket for display
        const midTimestamp = bucket[Math.floor(bucket.length / 2)].timestamp;

        downsampled.push({
            level: Math.round(avgLevel * 100) / 100,
            flow: Math.round(avgFlow * 100) / 100,
            timestamp: midTimestamp,
        });
    }

    return downsampled;
}

export function useWaterData() {
    const [currentLevel, setCurrentLevel] = useState<number>(0);
    const [currentFlow, setCurrentFlow] = useState<number>(0);
    const [history, setHistory] = useState<WaterReading[]>([]);
    const [settings, setSettings] = useState<ThresholdSettings>({
        warningLevel: 2.0,
        dangerLevel: 3.5,
    });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date(0));
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [useFirebase, setUseFirebase] = useState<boolean>(false);
    const [firebaseDb, setFirebaseDb] = useState<Firestore | null>(null);
    const [sensorLocation, setSensorLocation] = useState<SensorLocation>({
        lat: -8.701921,
        lng: 115.233999,
        name: 'Denpasar, Sidakarya',
    });

    // Load cached settings from localStorage after mount (avoids hydration mismatch)
    useEffect(() => {
        try {
            const cached = localStorage.getItem('flows-settings-cache');
            if (cached) setSettings(JSON.parse(cached));
        } catch { /* ignore */ }
    }, []);

    // Check if Firebase is configured
    useEffect(() => {
        if (typeof window !== 'undefined' && isFirebaseConfigured()) {
            const { db: fireDb } = initializeFirebase();
            if (fireDb) {
                setFirebaseDb(fireDb);
                setUseFirebase(true);
            }
        }
    }, []);

    // Subscribe to Firestore readings in real-time
    useEffect(() => {
        if (!useFirebase || !firebaseDb) return;

        // Fetch readings from the last 24 hours
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        const readingsQuery = query(
            collection(firebaseDb, 'readings'),
            where('timestamp', '>=', Timestamp.fromDate(twentyFourHoursAgo)),
            orderBy('timestamp', 'desc'),
            limit(30)
        );

        const unsubscribe = onSnapshot(readingsQuery, (snapshot) => {
            const readings: WaterReading[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                readings.push({
                    id: doc.id,
                    level: data.level ?? 0,
                    flow: data.flow ?? 0,
                    timestamp: data.timestamp?.toDate?.() || new Date(),
                });
            });

            // Readings come in desc order from query, reverse for chronological history
            const chronological = readings.reverse();

            // Set current values + lastUpdate from the latest reading
            if (chronological.length > 0) {
                const latest = chronological[chronological.length - 1];
                setCurrentLevel(latest.level);
                setCurrentFlow(latest.flow);
                setLastUpdate(latest.timestamp);
                setIsOnline(true);
            }

            // Downsample with adaptive bucket size based on data time span
            const downsampled = downsampleReadings(chronological);
            setHistory(downsampled);
        }, (error) => {
            console.error('Error subscribing to readings:', error);
            setIsOnline(false);
        });

        return () => unsubscribe();
    }, [useFirebase, firebaseDb]);

    // lastUpdate is now extracted from the main readings listener above
    // — no separate listener needed, saving ~1,800 reads/hour

    // Subscribe to Firebase settings if configured
    // No getDoc call — we rely on onSnapshot + localStorage cache to avoid extra reads
    useEffect(() => {
        if (!useFirebase || !firebaseDb) return;

        const settingsRef = doc(firebaseDb, 'settings', 'thresholds');

        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const newSettings: ThresholdSettings = {
                    warningLevel: data.warningLevel || 2.0,
                    dangerLevel: data.dangerLevel || 3.5,
                };
                setSettings(newSettings);
                // Cache to localStorage for future instant loads
                try {
                    localStorage.setItem('flows-settings-cache', JSON.stringify(newSettings));
                } catch { /* ignore */ }
            }
        });

        return () => unsubscribe();
    }, [useFirebase, firebaseDb]);

    // Subscribe to Firebase logs if configured
    useEffect(() => {
        if (!useFirebase || !firebaseDb) return;

        const logsQuery = query(
            collection(firebaseDb, 'logs'),
            orderBy('timestamp', 'desc'),
            limit(20)
        );

        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const logEntries: LogEntry[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                logEntries.push({
                    id: doc.id,
                    message: data.message,
                    type: data.type,
                    timestamp: data.timestamp?.toDate() || new Date(),
                });
            });
            setLogs(logEntries);
        });

        return () => unsubscribe();
    }, [useFirebase, firebaseDb]);

    // Update thresholds
    const updateThresholds = useCallback(async (newSettings: ThresholdSettings) => {
        setSettings(newSettings);

        if (useFirebase && firebaseDb) {
            const settingsRef = doc(firebaseDb, 'settings', 'thresholds');
            await updateDoc(settingsRef, {
                warningLevel: newSettings.warningLevel,
                dangerLevel: newSettings.dangerLevel,
            });
        }
    }, [useFirebase, firebaseDb]);

    // Add log entry
    const addLogEntry = useCallback(async (message: string, type: 'info' | 'alert') => {
        const newLog: LogEntry = {
            message,
            type,
            timestamp: new Date(),
        };

        // Add to local state
        setLogs(prev => [newLog, ...prev].slice(0, 50));

        if (useFirebase && firebaseDb) {
            await addDoc(collection(firebaseDb, 'logs'), {
                message,
                type,
                timestamp: Timestamp.fromDate(new Date()),
            });
        }
    }, [useFirebase, firebaseDb]);

    // Determine current status based on both level and flow
    const getStatus = useCallback((): 'safe' | 'warning' | 'danger' => {
        // Check for danger conditions first
        if (currentLevel >= settings.dangerLevel) {
            return 'danger';
        }
        // Check for warning conditions
        if (currentLevel >= settings.warningLevel) {
            return 'warning';
        }
        return 'safe';
    }, [currentLevel, currentFlow, settings]);

    // Subscribe to sensor location settings (centralized — used by SensorMap + SensorLocationSettings)
    useEffect(() => {
        if (!useFirebase || !firebaseDb) return;

        // Load cached location first
        try {
            const cached = localStorage.getItem('flows-location-cache');
            if (cached) setSensorLocation(JSON.parse(cached));
        } catch { /* ignore */ }

        const locationRef = doc(firebaseDb, 'settings', 'location');
        const unsubscribe = onSnapshot(locationRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                const loc: SensorLocation = {
                    lat: data.lat ?? -8.701921,
                    lng: data.lng ?? 115.233999,
                    name: data.name ?? 'Denpasar, Sidakarya',
                };
                setSensorLocation(loc);
                try {
                    localStorage.setItem('flows-location-cache', JSON.stringify(loc));
                } catch { /* ignore */ }
            }
        });

        return () => unsubscribe();
    }, [useFirebase, firebaseDb]);

    return {
        currentLevel,
        currentFlow,
        history,
        settings,
        logs,
        lastUpdate,
        isOnline,
        status: getStatus(),
        updateThresholds,
        addLogEntry,
        firebaseDb,
        sensorLocation,
    };
}
