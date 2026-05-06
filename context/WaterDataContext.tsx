'use client';

import React, { createContext, useContext } from 'react';
import { useWaterData } from '@/hooks/useWaterData';
import type { WaterReading, ThresholdSettings, LogEntry, SensorLocation } from '@/hooks/useWaterData';
import type { Firestore } from 'firebase/firestore';

interface WaterDataContextType {
    currentLevel: number;
    currentFlow: number;
    history: WaterReading[];
    settings: ThresholdSettings;
    logs: LogEntry[];
    lastUpdate: Date;
    isOnline: boolean;
    status: 'safe' | 'warning' | 'danger';
    updateThresholds: (settings: ThresholdSettings) => Promise<void>;
    addLogEntry: (message: string, type: 'info' | 'alert') => Promise<void>;
    firebaseDb: Firestore | null;
    sensorLocation: SensorLocation;
}

const WaterDataContext = createContext<WaterDataContextType | undefined>(undefined);

/**
 * WaterDataProvider — wraps the app so that only ONE Firestore subscription
 * exists for readings, settings, and logs, regardless of how many pages or
 * components consume the data.
 *
 * Before this, both `app/page.tsx` (public) and `app/admin/page.tsx` each
 * called `useWaterData()` independently, creating duplicate listeners that
 * doubled Firestore reads.
 */
export function WaterDataProvider({ children }: { children: React.ReactNode }) {
    const waterData = useWaterData();

    return (
        <WaterDataContext.Provider value={waterData}>
            {children}
        </WaterDataContext.Provider>
    );
}

export function useWaterDataContext(): WaterDataContextType {
    const context = useContext(WaterDataContext);
    if (context === undefined) {
        throw new Error('useWaterDataContext must be used within a WaterDataProvider');
    }
    return context;
}
