'use client';

import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { ThresholdSettings } from '@/hooks/useWaterData';

interface ThresholdControlsProps {
    settings: ThresholdSettings;
    onUpdate: (settings: ThresholdSettings) => Promise<void>;
    onLogEvent?: (message: string, type: 'info' | 'alert') => Promise<void>;
    adminEmail?: string;
}

export function ThresholdControls({ settings, onUpdate, onLogEvent, adminEmail }: ThresholdControlsProps) {
    const [warningLevel, setWarningLevel] = useState(settings.warningLevel);
    const [dangerLevel, setDangerLevel] = useState(settings.dangerLevel);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Update local state when settings prop changes
    useEffect(() => {
        setWarningLevel(settings.warningLevel);
        setDangerLevel(settings.dangerLevel);
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate({ warningLevel, dangerLevel });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            await onLogEvent?.(
                `${adminEmail ?? 'Admin'} updated thresholds — Warning: ${warningLevel.toFixed(1)}m, Danger: ${dangerLevel.toFixed(1)}m`,
                'info'
            );
        } catch (error) {
            console.error('Failed to update thresholds:', error);
        }
        setSaving(false);
    };

    const hasValidation = warningLevel >= dangerLevel;

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Threshold Settings</h3>
            </div>

            <div className="space-y-6">
                {/* Water Level Section */}
                <div className="pb-4 border-b border-gray-700">
                    <h4 className="text-sm font-medium text-cyan-400 mb-4">Water Level Thresholds</h4>

                    {/* Warning Level */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Warning Level (meters)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="0.5"
                                max="12"
                                step="0.1"
                                value={warningLevel}
                                onChange={(e) => setWarningLevel(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="w-20 px-3 py-2 bg-gray-900 border border-amber-500/30 rounded-lg text-center">
                                <span className="text-amber-400 font-bold">{warningLevel.toFixed(1)}m</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Level */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Danger Level (meters)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="1"
                                max="15"
                                step="0.1"
                                value={dangerLevel}
                                onChange={(e) => setDangerLevel(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <div className="w-20 px-3 py-2 bg-gray-900 border border-red-500/30 rounded-lg text-center">
                                <span className="text-red-400 font-bold">{dangerLevel.toFixed(1)}m</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Validation Warning */}
                {hasValidation && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 text-sm">
                            ⚠️ Warning thresholds must be lower than danger thresholds
                        </p>
                    </div>
                )}

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving || hasValidation}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${saved
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
