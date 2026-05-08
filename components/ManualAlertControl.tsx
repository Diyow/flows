'use client';

import { Bell } from 'lucide-react';
import { ThresholdSettings } from '@/hooks/useWaterData';
import { useTranslation } from '@/context/LanguageContext';

interface ManualAlertControlProps {
    settings: ThresholdSettings;
    onToggleAlarm: (active: boolean) => Promise<void>;
    buzzerActive?: boolean;
}

export function ManualAlertControl({ settings, onToggleAlarm, buzzerActive = false }: ManualAlertControlProps) {
    const { t } = useTranslation();

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Bell className={`w-5 h-5 ${buzzerActive ? 'text-red-400 animate-pulse' : 'text-amber-400'}`} />
                    <h3 className="text-lg font-semibold text-white">{t('manualControls')}</h3>
                </div>
            </div>

            {/* Current Thresholds - High Priority Data */}
            <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-400 mb-3">{t('currentMonitoringThresholds')}</h4>
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20 text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">{t('levelWarning')}</p>
                        <p className="text-xl font-bold text-amber-400">{settings.warningLevel}m</p>
                    </div>
                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-center">
                        <p className="text-xs text-gray-500 font-medium mb-1">{t('levelDanger')}</p>
                        <p className="text-xl font-bold text-red-400">{settings.dangerLevel}m</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 border-t border-gray-700/50 pt-6 space-y-4">
                <div className="bg-gray-900/30 rounded-lg p-4 border border-gray-700/30">
                    <p className="text-gray-400 text-sm leading-relaxed">
                        {t('manualTriggerDescription')}
                    </p>
                </div>

                <div className="mt-auto pt-4">
                    <button
                        onClick={() => onToggleAlarm(!buzzerActive)}
                        className={`w-full flex items-center justify-center gap-2 px-4 py-4 rounded-lg font-medium transition-all ${buzzerActive
                            ? 'bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 shadow-lg shadow-red-500/10'
                            : 'bg-transparent border border-amber-500/50 text-amber-400 hover:bg-amber-500/10'
                            }`}
                    >
                        <Bell className={`w-5 h-5 ${buzzerActive ? 'animate-bounce' : ''}`} />
                        {buzzerActive ? t('stopAlarm') : t('testAlarm')}
                    </button>

                    {buzzerActive && (
                        <p className="text-gray-500 text-[10px] mt-3 text-center uppercase tracking-wider font-medium">
                            {t('hardwareSounding')}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
