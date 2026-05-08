'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWaterDataContext } from '@/context/WaterDataContext';
import { StatsCard } from '@/components/StatsCard';
import { ThresholdControls } from '@/components/ThresholdControls';
import { EventLogs } from '@/components/EventLogs';
import { AdminManagement } from '@/components/AdminManagement';
import { SensorLocationSettings } from '@/components/SensorLocationSettings';
import { HistoricalData } from '@/components/HistoricalData';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useTranslation } from '@/context/LanguageContext';
import {
    Droplets,
    Gauge,
    Wifi,
    Clock,
    AlertTriangle
} from 'lucide-react';
import { ManualAlertControl } from '@/components/ManualAlertControl';

export default function AdminPage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const { t } = useTranslation();
    const {
        currentLevel,
        currentFlow,
        settings,
        logs,
        lastUpdate,
        isOnline,
        status,
        updateThresholds,
        addLogEntry,
        firebaseDb,
        buzzerActive,
        setBuzzerState
    } = useWaterDataContext();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Handle alarm toggle
    const handleToggleAlarm = async (active: boolean) => {
        await setBuzzerState(active, user?.email ?? undefined);
        const action = active ? 'triggered' : 'stopped';
        const logType = active ? 'warning' : 'info';
        await addLogEntry(`Manual test alarm ${action} by ${user?.email ?? 'admin'}`, logType);
    };

    // Handle sign out
    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };


    // Don't render if not authenticated
    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0f]">
            <Header variant="admin" userEmail={user.email ?? undefined} onSignOut={handleSignOut} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
                {/* Stats Cards */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatsCard
                        title={t('waterLevel')}
                        value={`${currentLevel.toFixed(2)}m`}
                        subtitle={`${t('status')}: ${t(status as any)}`}
                        icon={Gauge}
                        color={status === 'safe' ? 'green' : status === 'warning' ? 'amber' : 'red'}
                    />
                    <StatsCard
                        title={t('flowRate')}
                        value={`${currentFlow.toFixed(1)} m³/s`}
                        subtitle={t('currentFlow')}
                        icon={Droplets}
                        color="blue"
                    />
                    <StatsCard
                        title={t('deviceStatus')}
                        value={isOnline ? t('online') : t('offline')}
                        subtitle={t('sensorConnection')}
                        icon={Wifi}
                        color={isOnline ? 'green' : 'red'}
                    />
                    <StatsCard
                        title={t('lastUpdate')}
                        value={lastUpdate.toLocaleTimeString()}
                        subtitle={lastUpdate.toLocaleDateString()}
                        icon={Clock}
                        color="blue"
                    />
                </section>

                {/* Current Status Alert */}
                {status !== 'safe' && (
                    <section className={`p-4 rounded-xl border flex items-center gap-4 ${status === 'danger'
                        ? 'bg-red-500/10 border-red-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                        }`}>
                        <AlertTriangle className={`w-6 h-6 ${status === 'danger' ? 'text-red-400' : 'text-amber-400'
                            }`} />
                        <div>
                            <p className={`font-medium ${status === 'danger' ? 'text-red-400' : 'text-amber-400'
                                }`}>
                                {status === 'danger' ? t('dangerAlert') : t('warningAlert')}
                            </p>
                            <p className="text-gray-400 text-sm">
                                {t('thresholdExceeded', { level: currentLevel.toFixed(2), status: t(status as any) })}
                            </p>
                        </div>
                    </section>
                )}

                {/* Controls Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Threshold Controls */}
                    <ThresholdControls
                        settings={settings}
                        onUpdate={updateThresholds}
                        onLogEvent={addLogEntry}
                        adminEmail={user.email ?? undefined}
                    />

                    {/* Manual Controls */}
                    <ManualAlertControl
                        settings={settings}
                        onToggleAlarm={handleToggleAlarm}
                        buzzerActive={buzzerActive}
                    />
                </section>

                {/* Sensor Location & Admin Management */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <SensorLocationSettings
                        firebaseDb={firebaseDb}
                        onLogEvent={addLogEntry}
                        adminEmail={user.email ?? undefined}
                    />
                    <AdminManagement onLogEvent={addLogEntry} />
                </section>

                {/* Event Logs */}
                <section>
                    <EventLogs logs={logs} />
                </section>

                {/* Historical Data & Export */}
                <section>
                    <HistoricalData
                        firebaseDb={firebaseDb}
                        settings={settings}
                        onLogEvent={addLogEntry}
                        adminEmail={user.email ?? undefined}
                    />
                </section>
            </main>

            <Footer />
        </div>
    );
}
