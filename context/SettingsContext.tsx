'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SettingsContextType {
    enable3D: boolean;
    setEnable3D: (enable: boolean) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [enable3D, setEnable3DState] = useState<boolean>(true);
    const [mounted, setMounted] = useState(false);

    // Load saved settings on mount
    useEffect(() => {
        setMounted(true);
        const saved = localStorage.getItem('FLOWS-enable3D');
        if (saved !== null) {
            setEnable3DState(saved === 'true');
        }
    }, []);

    const setEnable3D = (enable: boolean) => {
        setEnable3DState(enable);
        localStorage.setItem('FLOWS-enable3D', String(enable));
    };

    // Prevent hydration mismatch by not rendering until mounted
    // However, for settings like this, we can return the default during hydration
    return (
        <SettingsContext.Provider value={{ enable3D: mounted ? enable3D : true, setEnable3D }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
