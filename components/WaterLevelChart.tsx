'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { WaterReading } from '@/hooks/useWaterData';

interface WaterLevelChartProps {
    data: WaterReading[];
    warningLevel: number;
    dangerLevel: number;
    warningFlow?: number;
    dangerFlow?: number;
    showFlow?: boolean;
}

export function WaterLevelChart({
    data,
    warningLevel,
    dangerLevel,
    warningFlow = 200,
    dangerFlow = 350,
    showFlow = true
}: WaterLevelChartProps) {
    const chartData = data.map((reading) => ({
        time: reading.timestamp.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }),
        level: reading.level,
        flow: reading.flow || 0,
    }));

    // Auto-scale flow Y-axis based on actual data values only
    const flowValues = chartData.map(d => d.flow).filter(v => v > 0);
    const maxFlow = flowValues.length > 0 ? Math.max(...flowValues) : 10;
    const minFlow = flowValues.length > 0 ? Math.min(...flowValues) : 0;
    const flowPadding = Math.max((maxFlow - minFlow) * 0.3, maxFlow * 0.2, 1);
    const flowDomain: [number, number] = [0, Math.ceil(maxFlow + flowPadding)];

    const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 shadow-xl">
                    <p className="text-gray-400 text-sm mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="font-bold" style={{ color: entry.color }}>
                            {entry.dataKey === 'level' ? 'Level: ' : 'Flow: '}
                            {entry.value.toFixed(entry.dataKey === 'level' ? 2 : 1)}
                            {entry.dataKey === 'level' ? 'm' : ' m³/s'}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="p-6 rounded-2xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">24-Hour History</h3>
            </div>

            <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                        <XAxis
                            dataKey="time"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            yAxisId="level"
                            stroke="#6b7280"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 5]}
                            tickFormatter={(value) => `${value}m`}
                        />
                        {showFlow && (
                            <YAxis
                                yAxisId="flow"
                                orientation="right"
                                stroke="#6b7280"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={flowDomain}
                                tickFormatter={(value) => `${value}`}
                            />
                        )}
                        <Tooltip content={<CustomTooltip />} />
                        <Legend />

                        {/* Reference Lines for Level Thresholds */}
                        <ReferenceLine
                            yAxisId="level"
                            y={warningLevel}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                        />
                        <ReferenceLine
                            yAxisId="level"
                            y={dangerLevel}
                            stroke="#ef4444"
                            strokeDasharray="5 5"
                        />

                        {/* Water Level Line */}
                        <Line
                            yAxisId="level"
                            type="monotone"
                            dataKey="level"
                            name="Water Level (m)"
                            stroke="#06b6d4"
                            strokeWidth={2}
                            dot={false}
                            activeDot={{ r: 4 }}
                            isAnimationActive={false}
                        />

                        {/* Water Flow Line */}
                        {showFlow && (
                            <Line
                                yAxisId="flow"
                                type="monotone"
                                dataKey="flow"
                                name="Flow Rate (m³/s)"
                                stroke="#8b5cf6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 4 }}
                                isAnimationActive={false}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-cyan-500" />
                    <span className="text-gray-400">Water Level</span>
                </div>
                {showFlow && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className="text-gray-400">Flow Rate</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-amber-500" style={{ borderStyle: 'dashed' }} />
                    <span className="text-gray-400">Warning ({warningLevel}m)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-0.5 bg-red-500" style={{ borderStyle: 'dashed' }} />
                    <span className="text-gray-400">Danger ({dangerLevel}m)</span>
                </div>
            </div>
        </div>
    );
}
