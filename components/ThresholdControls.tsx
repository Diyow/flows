'use client';

import { useState, useEffect } from 'react';
import { Settings, Save } from 'lucide-react';
import { ThresholdSettings } from '@/hooks/useWaterData';

interface ThresholdControlsProps {
    settings: ThresholdSettings;
    onUpdate: (settings: ThresholdSettings) => Promise<void>;
}

export function ThresholdControls({ settings, onUpdate }: ThresholdControlsProps) {
    const [warningLevel, setWarningLevel] = useState(settings.warningLevel);
    const [dangerLevel, setDangerLevel] = useState(settings.dangerLevel);
    const [warningFlow, setWarningFlow] = useState(settings.warningFlow);
    const [dangerFlow, setDangerFlow] = useState(settings.dangerFlow);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Update local state when settings prop changes
    useEffect(() => {
        setWarningLevel(settings.warningLevel);
        setDangerLevel(settings.dangerLevel);
        setWarningFlow(settings.warningFlow);
        setDangerFlow(settings.dangerFlow);
    }, [settings]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate({ warningLevel, dangerLevel, warningFlow, dangerFlow });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (error) {
            console.error('Failed to update thresholds:', error);
        }
        setSaving(false);
    };

    const hasValidation = warningLevel >= dangerLevel || warningFlow >= dangerFlow;

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 mb-6">
                <Settings className="w-5 h-5 text-cyan-400" />
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
                                max="4"
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
                                max="5"
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

                {/* Flow Rate Section */}
                <div className="pb-4 border-b border-gray-700">
                    <h4 className="text-sm font-medium text-teal-400 mb-4">Flow Rate Thresholds</h4>

                    {/* Warning Flow */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Warning Flow (m³/s)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="50"
                                max="300"
                                step="10"
                                value={warningFlow}
                                onChange={(e) => setWarningFlow(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                            />
                            <div className="w-24 px-3 py-2 bg-gray-900 border border-amber-500/30 rounded-lg text-center">
                                <span className="text-amber-400 font-bold">{warningFlow}</span>
                            </div>
                        </div>
                    </div>

                    {/* Danger Flow */}
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-2">
                            Danger Flow (m³/s)
                        </label>
                        <div className="flex items-center gap-4">
                            <input
                                type="range"
                                min="100"
                                max="500"
                                step="10"
                                value={dangerFlow}
                                onChange={(e) => setDangerFlow(parseFloat(e.target.value))}
                                className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                            />
                            <div className="w-24 px-3 py-2 bg-gray-900 border border-red-500/30 rounded-lg text-center">
                                <span className="text-red-400 font-bold">{dangerFlow}</span>
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
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/30'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
