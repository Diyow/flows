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
    Timestamp,
    getDoc,
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
    warningFlow: number;
    dangerFlow: number;
}

export interface LogEntry {
    id?: string;
    message: string;
    type: 'info' | 'alert';
    timestamp: Date;
}

export function useWaterData() {
    const [currentLevel, setCurrentLevel] = useState<number>(0);
    const [currentFlow, setCurrentFlow] = useState<number>(0);
    const [history, setHistory] = useState<WaterReading[]>([]);
    const [settings, setSettings] = useState<ThresholdSettings>({
        warningLevel: 2.0,
        dangerLevel: 3.5,
        warningFlow: 200,
        dangerFlow: 350,
    });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isOnline, setIsOnline] = useState<boolean>(true);
    const [useFirebase, setUseFirebase] = useState<boolean>(false);
    const [firebaseDb, setFirebaseDb] = useState<Firestore | null>(null);

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

        const readingsQuery = query(
            collection(firebaseDb, 'readings'),
            orderBy('timestamp', 'desc'),
            limit(25)
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
            setHistory(chronological);

            // Set current values from the most recent reading
            if (chronological.length > 0) {
                const latest = chronological[chronological.length - 1];
                setCurrentLevel(latest.level);
                setCurrentFlow(latest.flow);
                setLastUpdate(latest.timestamp);
                setIsOnline(true);
            }
        }, (error) => {
            console.error('Error subscribing to readings:', error);
            setIsOnline(false);
        });

        return () => unsubscribe();
    }, [useFirebase, firebaseDb]);

    // Subscribe to Firebase settings if configured
    useEffect(() => {
        if (!useFirebase || !firebaseDb) return;

        const settingsRef = doc(firebaseDb, 'settings', 'thresholds');

        // Initialize settings if they don't exist
        getDoc(settingsRef).then((docSnap) => {
            if (!docSnap.exists()) {
                setDoc(settingsRef, {
                    warningLevel: 2.0,
                    dangerLevel: 3.5,
                    warningFlow: 200,
                    dangerFlow: 350,
                });
            }
        });

        const unsubscribe = onSnapshot(settingsRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setSettings({
                    warningLevel: data.warningLevel || 2.0,
                    dangerLevel: data.dangerLevel || 3.5,
                    warningFlow: data.warningFlow || 200,
                    dangerFlow: data.dangerFlow || 350,
                });
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
            limit(50)
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
                warningFlow: newSettings.warningFlow,
                dangerFlow: newSettings.dangerFlow,
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
        if (currentLevel >= settings.dangerLevel || currentFlow >= settings.dangerFlow) {
            return 'danger';
        }
        // Check for warning conditions
        if (currentLevel >= settings.warningLevel || currentFlow >= settings.warningFlow) {
            return 'warning';
        }
        return 'safe';
    }, [currentLevel, currentFlow, settings]);

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
    };
}
