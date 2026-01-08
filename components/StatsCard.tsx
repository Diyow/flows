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
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-400',
    green: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
    red: 'bg-red-500/10 border-red-500/30 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/30 text-purple-400',
    cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400',
};

const iconBgClasses = {
    blue: 'bg-blue-500/20',
    green: 'bg-emerald-500/20',
    amber: 'bg-amber-500/20',
    red: 'bg-red-500/20',
    purple: 'bg-purple-500/20',
    cyan: 'bg-cyan-500/20',
};

export function StatsCard({ title, value, subtitle, icon: Icon, color }: StatsCardProps) {
    return (
        <div className={`p-5 rounded-xl border ${colorClasses[color]}`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-gray-400 text-sm uppercase tracking-wide">{title}</p>
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
