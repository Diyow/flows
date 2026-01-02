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

// Generate mock water level between min and max
function generateMockLevel(min = 1.0, max = 2.5): number {
    return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

// Generate mock water flow between min and max (m³/s)
function generateMockFlow(min = 50, max = 150): number {
    return Math.round((Math.random() * (max - min) + min) * 10) / 10;
}

// Generate 24 hours of mock historical data
function generateMockHistory(): WaterReading[] {
    const history: WaterReading[] = [];
    const now = new Date();

    for (let i = 24; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000);
        history.push({
            level: generateMockLevel(1.0, 2.5),
            flow: generateMockFlow(50, 150),
            timestamp,
        });
    }

    return history;
}

export function useWaterData() {
    const [currentLevel, setCurrentLevel] = useState<number>(1.5);
    const [currentFlow, setCurrentFlow] = useState<number>(100);
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

    // Initialize mock history
    useEffect(() => {
        setHistory(generateMockHistory());
    }, []);

    // Mock data generation every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            const newLevel = generateMockLevel(1.0, 2.5);
            const newFlow = generateMockFlow(50, 150);
            const now = new Date();

            setCurrentLevel(newLevel);
            setCurrentFlow(newFlow);
            setLastUpdate(now);

            // Add to history (keep last 24 readings)
            setHistory(prev => {
                const newHistory = [...prev, { level: newLevel, flow: newFlow, timestamp: now }];
                return newHistory.slice(-25);
            });

            // If using Firebase, also write to Firestore
            if (useFirebase && firebaseDb) {
                addDoc(collection(firebaseDb, 'readings'), {
                    level: newLevel,
                    flow: newFlow,
                    timestamp: Timestamp.fromDate(now),
                }).catch(console.error);
            }
        }, 5000);

        return () => clearInterval(interval);
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
