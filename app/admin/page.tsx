'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useWaterData } from '@/hooks/useWaterData';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { StatsCard } from '@/components/StatsCard';
import {
    Droplets,
    Gauge,
    Wifi,
    Clock,
    AlertTriangle,
    ShieldCheck
} from 'lucide-react';

export default function AdminPage() {
    const { user, loading, signOut } = useAuth();
    const router = useRouter();
    const {
        currentLevel,
        currentFlow,
        lastUpdate,
        isOnline,
        status
    } = useWaterData();

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

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
            {/* Header */}
            <Header variant="admin" userEmail={user.email || undefined} onSignOut={handleSignOut} />

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6 md:space-y-8">
                {/* Admin Dashboard Title Section */}
                <section className="text-center py-8">
                    <div className="inline-flex p-4 rounded-2xl bg-cyan-500/20 mb-4">
                        <ShieldCheck className="w-12 h-12 text-cyan-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h2>
                    <p className="text-gray-400">Welcome back, {user.email}</p>
                </section>

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
                        color="cyan"
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

                {/* Iteration 1 Notice */}
                {/* <section className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/30">
                    <h3 className="text-lg font-semibold text-blue-400 mb-2">Iteration 1 - Admin Features</h3>
                    <p className="text-gray-400 text-sm">
                        This is the admin dashboard for FLOWS. In this iteration, the following features are available:
                    </p>
                    <ul className="mt-4 space-y-2 text-gray-300 text-sm">
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> View Water Level & Flow Rate
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> View System Status
                        </li>
                        <li className="flex items-center gap-2">
                            <span className="text-emerald-400">✓</span> Admin Login / Logout
                        </li>
                    </ul>
                    <p className="text-gray-500 text-xs mt-4">
                        Additional features like threshold management, location settings, and user management will be available in future iterations.
                    </p>
                </section> */}
            </main>

            {/* Footer */}
            <Footer variant="admin" userEmail={user.email || undefined} />
        </div>
    );
}
