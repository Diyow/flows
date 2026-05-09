'use client';

import { Droplets } from 'lucide-react';
import { useTranslation } from '@/context/LanguageContext';

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
    const { t } = useTranslation();
    // Auto-scale: default maxLevel to dangerLevel * 1.5 (rounded up) so thresholds are visible
    const effectiveMaxLevel = maxLevel ?? Math.ceil(dangerLevel * 1.5);
    const percentage = Math.min((level / effectiveMaxLevel) * 100, 100);

    // Determine color based on thresholds
    const getGradient = () => {
        if (level >= dangerLevel) return 'from-red-600 to-red-400';
        if (level >= warningLevel) return 'from-amber-600 to-amber-400';
        return 'from-cyan-600 to-cyan-400';
    };

    const getGlow = () => {
        if (level >= dangerLevel) return 'shadow-[0_0_20px_rgba(239,68,68,0.3)]';
        if (level >= warningLevel) return 'shadow-[0_0_20px_rgba(245,158,11,0.3)]';
        return 'shadow-[0_0_20px_rgba(6,182,212,0.2)]';
    };

    const getTextColor = () => {
        if (level >= dangerLevel) return 'text-red-400';
        if (level >= warningLevel) return 'text-amber-400';
        return 'text-cyan-400';
    };

    const getBorderColor = () => 'border-emerald-500/50';

    // Generate tick marks - only key marks to keep it clean
    const ticks = [];
    const step = effectiveMaxLevel <= 6 ? 1 : effectiveMaxLevel <= 15 ? 2 : 5;
    for (let i = 0; i <= effectiveMaxLevel; i += step) {
        const tickPercentage = (i / effectiveMaxLevel) * 100;
        ticks.push(
            <div
                key={i}
                className="absolute right-0 flex items-center justify-end"
                style={{ bottom: `${tickPercentage}%`, transform: 'translateY(50%)' }}
            >
                <span className="text-[11px] text-gray-500 font-medium mr-3 tabular-nums">{i}m</span>
                <div className="w-2 h-px bg-gray-600" />
            </div>
        );
    }

    const warningPos = (warningLevel / effectiveMaxLevel) * 100;
    const dangerPos = (dangerLevel / effectiveMaxLevel) * 100;

    return (
        <div className={`relative min-h-[450px] lg:min-h-0 h-full flex flex-col p-5 md:p-6 rounded-2xl bg-gray-800/50 border ${getBorderColor()}`}>
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Droplets className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">{t('waterLevelGauge')}</h3>
            </div>

            {/* Gauge body - flex-1 to fill remaining space */}
            <div className="flex-1 flex gap-4 md:gap-0 min-h-0 justify-center md:justify-start">
                {/* Tick scale on the left */}
                <div className="relative w-10 md:w-12 shrink-0">
                    {ticks}
                </div>

                {/* Main gauge bar */}
                <div className={`relative flex-1 max-w-[80px] md:max-w-24 bg-gray-900/80 rounded-xl overflow-hidden border border-gray-700/60 ${getGlow()}`}>
                    {/* Water fill */}
                    <div
                        className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t ${getGradient()} transition-all duration-1000 ease-out`}
                        style={{ height: `${percentage}%` }}
                    >
                        {/* Wave shimmer */}
                        <div className="absolute top-0 left-0 right-0 h-3 overflow-hidden">
                            <div
                                className="absolute w-[200%] h-6 -top-3 rounded-[40%] bg-white/15"
                                style={{
                                    animation: 'gaugeWave 3s ease-in-out infinite',
                                }}
                            />
                        </div>
                        {/* Subtle vertical shimmer */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0" />
                    </div>

                    {/* Warning threshold line */}
                    <div
                        className="absolute left-0 right-0 z-10 flex items-center"
                        style={{ bottom: `${warningPos}%` }}
                    >
                        <div className="w-full border-t-[2px] border-dashed border-amber-500/80" />
                    </div>

                    {/* Danger threshold line */}
                    <div
                        className="absolute left-0 right-0 z-10 flex items-center"
                        style={{ bottom: `${dangerPos}%` }}
                    >
                        <div className="w-full border-t-[2px] border-dashed border-red-500/80" />
                    </div>
                </div>

                {/* Threshold labels on the right */}
                <div className="relative w-14 md:w-16 shrink-0">
                    {/* Warning label */}
                    <div
                        className="absolute left-2 flex items-center gap-1"
                        style={{ bottom: `${warningPos}%`, transform: 'translateY(50%)' }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        <span className="text-[10px] md:text-xs text-amber-400 font-medium whitespace-nowrap">{warningLevel}m</span>
                    </div>
                    {/* Danger label */}
                    <div
                        className="absolute left-2 flex items-center gap-1"
                        style={{ bottom: `${dangerPos}%`, transform: 'translateY(50%)' }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="text-[10px] md:text-xs text-red-400 font-medium whitespace-nowrap">{dangerLevel}m</span>
                    </div>
                </div>
            </div>

            {/* Current Reading */}
            <div className="mt-5 text-center">
                <span className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider font-medium">{t('currentReading')}</span>
                <div className="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">
                    {level.toFixed(2)} <span className="text-base md:text-lg font-medium text-gray-400">m</span>
                </div>
            </div>

            {/* CSS animation */}
            <style jsx>{`
                @keyframes gaugeWave {
                    0%, 100% { transform: translateX(-25%) rotate(2deg); }
                    50% { transform: translateX(0%) rotate(-2deg); }
                }
            `}</style>
        </div>
    );
}
