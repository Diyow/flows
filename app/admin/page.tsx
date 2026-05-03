'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWaterData } from '@/hooks/useWaterData';
import { StatsCard } from '@/components/StatsCard';
import { ThresholdControls } from '@/components/ThresholdControls';
import { EventLogs } from '@/components/EventLogs';
import { AdminManagement } from '@/components/AdminManagement';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useTranslation } from '@/context/LanguageContext';
import {
    Droplets,
    Gauge,
    Wifi,
    Clock,
    Bell,
    AlertTriangle
} from 'lucide-react';

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
        addLogEntry
    } = useWaterData();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    // Handle test alarm
    const handleTestAlarm = async () => {
        await addLogEntry('Manual test alarm triggered by admin', 'alert');
    };

    // Handle sign out
    const handleSignOut = async () => {
        await signOut();
        router.push('/');
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400">Loading dashboard...</p>
                </div>
            </div>
        );
    }

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
                        title="Water Level"
                        value={`${currentLevel.toFixed(2)}m`}
                        subtitle={`Status: ${status.toUpperCase()}`}
                        icon={Gauge}
                        color={status === 'safe' ? 'green' : status === 'warning' ? 'amber' : 'red'}
                    />
                    <StatsCard
                        title="Flow Rate"
                        value={`${currentFlow.toFixed(1)} m³/s`}
                        subtitle="Current flow"
                        icon={Droplets}
                        color="purple"
                    />
                    <StatsCard
                        title="Device Status"
                        value={isOnline ? 'Online' : 'Offline'}
                        subtitle="Sensor connection"
                        icon={Wifi}
                        color={isOnline ? 'green' : 'red'}
                    />
                    <StatsCard
                        title="Last Update"
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
                                {status === 'danger' ? 'DANGER ALERT' : 'WARNING ALERT'}
                            </p>
                            <p className="text-gray-400 text-sm">
                                Water level ({currentLevel.toFixed(2)}m) has exceeded the {status} threshold
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
                    />

                    {/* Manual Controls */}
                    <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center gap-2 mb-6">
                            <Bell className="w-5 h-5 text-amber-400" />
                            <h3 className="text-lg font-semibold text-white">Manual Controls</h3>
                        </div>

                        <div className="space-y-4">
                            <p className="text-gray-400 text-sm">
                                Use these controls to manually trigger system actions for testing purposes.
                            </p>

                            <button
                                onClick={handleTestAlarm}
                                className="w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-400 font-medium hover:bg-amber-500/30 transition-colors"
                            >
                                <Bell className="w-5 h-5" />
                                Test Alarm
                            </button>

                            <p className="text-gray-500 text-xs text-center">
                                This will create a test event in the logs without affecting real alerts
                            </p>
                        </div>

                        {/* Quick Stats */}
                        <div className="mt-6 pt-6 border-t border-gray-700">
                            <h4 className="text-sm font-medium text-gray-400 mb-4">Current Thresholds</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                                    <p className="text-xs text-gray-400">Level Warn</p>
                                    <p className="text-lg font-bold text-amber-400">{settings.warningLevel}m</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                                    <p className="text-xs text-gray-400">Level Danger</p>
                                    <p className="text-lg font-bold text-red-400">{settings.dangerLevel}m</p>
                                </div>
                                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-center">
                                    <p className="text-xs text-gray-400">Flow Warn</p>
                                    <p className="text-lg font-bold text-amber-400">{settings.warningFlow}</p>
                                </div>
                                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                                    <p className="text-xs text-gray-400">Flow Danger</p>
                                    <p className="text-lg font-bold text-red-400">{settings.dangerFlow}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Admin Management */}
                <section>
                    <AdminManagement onLogEvent={addLogEntry} />
                </section>

                {/* Event Logs */}
                <section>
                    <EventLogs logs={logs} />
                </section>
            </main>

            <Footer />
        </div>
    );
}
