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
            borderColor: 'border-emerald-500',
            bgColor: 'bg-emerald-900/30',
            textClass: 'text-emerald-400',
            Icon: CheckCircle,
        },
        warning: {
            label: 'WARNING',
            sublabel: 'Elevated readings detected - Stay alert',
            borderColor: 'border-amber-500',
            bgColor: 'bg-amber-900/30',
            textClass: 'text-amber-400',
            Icon: AlertTriangle,
        },
        danger: {
            label: 'DANGER',
            sublabel: 'Critical conditions - Evacuate immediately!',
            borderColor: 'border-red-500',
            bgColor: 'bg-red-900/30',
            textClass: 'text-red-400',
            Icon: AlertCircle,
        },
    };

    const config = statusConfig[status];
    const Icon = config.Icon;

    return (
        <div className={`rounded-lg border-2 p-6 ${config.borderColor} ${config.bgColor}`}>
            <div className="flex flex-col items-center gap-4">
                {/* Status Icon */}
                <Icon className={`w-16 h-16 ${config.textClass}`} />

                {/* Status Label */}
                <div className="text-center">
                    <h1 className={`text-4xl md:text-5xl font-bold ${config.textClass}`}>
                        {config.label}
                    </h1>
                    <p className="mt-2 text-gray-300">
                        {config.sublabel}
                    </p>
                </div>

                {/* Current Readings Display */}
                <div className="mt-4 flex flex-wrap justify-center gap-4">
                    {/* Water Level */}
                    <div className="px-6 py-3 rounded-lg bg-gray-800 border border-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                            <Droplets className="w-4 h-4 text-cyan-400" />
                            <span className="text-gray-400 text-sm">Water Level</span>
                        </div>
                        <div className={`text-2xl font-bold ${config.textClass}`}>
                            {currentLevel.toFixed(2)}m
                        </div>
                    </div>

                    {/* Water Flow */}
                    <div className="px-6 py-3 rounded-lg bg-gray-800 border border-gray-600">
                        <div className="flex items-center gap-2 mb-1">
                            <Waves className="w-4 h-4 text-cyan-400" />
                            <span className="text-gray-400 text-sm">Flow Rate</span>
                        </div>
                        <div className={`text-2xl font-bold ${config.textClass}`}>
                            {currentFlow.toFixed(1)} m³/s
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
