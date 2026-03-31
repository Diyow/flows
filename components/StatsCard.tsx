'use client';

import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: LucideIcon;
    color: 'blue' | 'green' | 'amber' | 'red' | 'purple' | 'cyan';
}

const colorClasses = {
    blue: 'border-blue-500 text-blue-400',
    green: 'border-emerald-500 text-emerald-400',
    amber: 'border-amber-500 text-amber-400',
    red: 'border-red-500 text-red-400',
    purple: 'border-purple-500 text-purple-400',
    cyan: 'border-cyan-500 text-cyan-400',
};

const iconBgClasses = {
    blue: 'bg-blue-900/50',
    green: 'bg-emerald-900/50',
    amber: 'bg-amber-900/50',
    red: 'bg-red-900/50',
    purple: 'bg-purple-900/50',
    cyan: 'bg-cyan-900/50',
};

export function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
    return (
        <div className={`p-5 rounded-lg bg-gray-800 border ${colorClasses[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-400 text-sm">{title}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {subtitle && <p className="text-gray-500 text-sm mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-lg ${iconBgClasses[color]}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
        </div>
    );
}
