'use client';

import { AlertTriangle, CheckCircle, AlertCircle, Droplets, Waves } from 'lucide-react';

interface StatusIndicatorProps {
    status: 'safe' | 'warning' | 'danger';
    currentLevel: number;
    currentFlow: number;
}

export function StatusIndicator({ status, currentLevel, currentFlow }: StatusIndicatorProps) {
    const statusConfig = {
        safe: {
            label: 'SAFE',
            sublabel: 'Water levels and flow are normal',
            bgClass: 'bg-emerald-500/10 border-emerald-500/30',
            textClass: 'text-emerald-400',
            iconBg: 'bg-emerald-500/20',
            Icon: CheckCircle,
            animation: '',
        },
        warning: {
            label: 'WARNING',
            sublabel: 'Elevated readings detected - Stay alert',
            bgClass: 'bg-amber-500/10 border-amber-500/30',
            textClass: 'text-amber-400',
            iconBg: 'bg-amber-500/20',
            Icon: AlertTriangle,
            animation: '',
        },
        danger: {
            label: 'DANGER',
            sublabel: 'Critical conditions - Evacuate immediately!',
            bgClass: 'bg-red-500/10 border-red-500/30',
            textClass: 'text-red-400',
            iconBg: 'bg-red-500/20',
            Icon: AlertCircle,
            animation: 'animate-pulse-danger',
        },
    };

    const config = statusConfig[status];
    const Icon = config.Icon;

    return (
        <div className={`relative rounded-2xl border-2 p-6 md:p-8 ${config.bgClass} ${config.animation}`}>
            {/* Danger flashing overlay */}
            {status === 'danger' && (
                <div className="absolute inset-0 rounded-2xl bg-red-500/20 animate-flash pointer-events-none" />
            )}

            <div className="relative flex flex-col items-center gap-4">
                {/* Status Icon */}
                <div className={`p-4 rounded-full ${config.iconBg}`}>
                    <Icon className={`w-12 h-12 md:w-16 md:h-16 ${config.textClass}`} />
                </div>

                {/* Status Label */}
                <div className="text-center">
                    <h1 className={`text-4xl md:text-6xl font-black tracking-wider ${config.textClass}`}>
                        {config.label}
                    </h1>
                    <p className="mt-2 text-lg md:text-xl text-gray-300">
                        {config.sublabel}
                    </p>
                </div>

                {/* Current Readings Display */}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {/* Water Level */}
                    <div className="px-6 py-3 rounded-xl bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                            <Droplets className="w-4 h-4 text-cyan-400" />
                            <span className="text-gray-400 text-sm uppercase tracking-wide">Water Level</span>
                        </div>
                        <div className={`text-3xl md:text-4xl font-bold ${config.textClass}`}>
                            {currentLevel.toFixed(2)}m
                        </div>
                    </div>

                    {/* Water Flow */}
                    <div className="px-6 py-3 rounded-xl bg-gray-800/50 border border-gray-700">
                        <div className="flex items-center gap-2 mb-1">
                            <Waves className="w-4 h-4 text-blue-400" />
                            <span className="text-gray-400 text-sm uppercase tracking-wide">Flow Rate</span>
                        </div>
                        <div className={`text-3xl md:text-4xl font-bold ${config.textClass}`}>
                            {currentFlow.toFixed(1)} m³/s
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
