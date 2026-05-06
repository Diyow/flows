'use client';

import { Droplets } from 'lucide-react';

interface WaterLevelGaugeProps {
    level: number;
    maxLevel?: number;
    warningLevel: number;
    dangerLevel: number;
}

export function WaterLevelGauge({
    level,
    maxLevel,
    warningLevel,
    dangerLevel
}: WaterLevelGaugeProps) {
    // Auto-scale: default maxLevel to dangerLevel * 1.5 (rounded up) so thresholds are visible
    const effectiveMaxLevel = maxLevel ?? Math.ceil(dangerLevel * 1.5);
    const percentage = Math.min((level / effectiveMaxLevel) * 100, 100);

    // Determine color based on thresholds
    const getColor = () => {
        if (level >= dangerLevel) return 'from-red-600 to-red-400';
        if (level >= warningLevel) return 'from-amber-600 to-amber-400';
        return 'from-emerald-600 to-emerald-400';
    };

    const getBorderColor = () => {
        if (level >= dangerLevel) return 'border-red-500/50';
        if (level >= warningLevel) return 'border-amber-500/50';
        return 'border-emerald-500/50';
    };

    // Generate tick marks
    const ticks = [];
    for (let i = 0; i <= effectiveMaxLevel; i++) {
        const tickPercentage = (i / effectiveMaxLevel) * 100;
        ticks.push(
            <div
                key={i}
                className="absolute left-0 right-0 flex items-center"
                style={{ bottom: `${tickPercentage}%` }}
            >
                <div className="w-3 h-0.5 bg-gray-500" />
                <span className="ml-2 text-xs text-gray-400">{i}m</span>
            </div>
        );
    }

    return (
        <div className={`relative p-6 rounded-2xl bg-gray-800/50 border-2 ${getBorderColor()}`}>
            <div className="flex items-center gap-2 mb-4">
                <Droplets className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Water Level Gauge</h3>
            </div>

            <div className="flex gap-6">
                {/* Gauge Container */}
                <div className="relative w-20 h-64 bg-gray-900 rounded-xl overflow-hidden border border-gray-700">
                    {/* Water Fill */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getColor()} transition-all duration-1000 ease-out`}
                        style={{ height: `${percentage}%` }}
                    >
                        {/* Wave Animation */}
                        <div className="absolute top-0 left-0 right-0 h-4 overflow-hidden">
                            <div className="wave-animation absolute w-[200%] h-8 bg-white/20 rounded-[100%] -top-4" />
                        </div>
                    </div>

                    {/* Warning Line */}
                    <div
                        className="absolute left-0 right-0 border-t-2 border-dashed border-amber-500/70"
                        style={{ bottom: `${(warningLevel / effectiveMaxLevel) * 100}%` }}
                    >
                        <span className="absolute -right-2 -top-3 text-xs text-amber-400 bg-gray-900 px-1 rounded">⚠</span>
                    </div>

                    {/* Danger Line */}
                    <div
                        className="absolute left-0 right-0 border-t-2 border-dashed border-red-500/70"
                        style={{ bottom: `${(dangerLevel / effectiveMaxLevel) * 100}%` }}
                    >
                        <span className="absolute -right-2 -top-3 text-xs text-red-400 bg-gray-900 px-1 rounded">☠</span>
                    </div>
                </div>

                {/* Scale */}
                <div className="relative h-64 w-12">
                    {ticks}
                </div>
            </div>

            {/* Current Reading */}
            <div className="mt-4 text-center">
                <span className="text-gray-400 text-sm">Current Reading</span>
                <div className="text-2xl font-bold text-white">{level.toFixed(2)} m</div>
            </div>
        </div>
    );
}
