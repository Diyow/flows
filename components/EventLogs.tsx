'use client';

import { useState } from 'react';
import { ScrollText, AlertCircle, Info, AlertTriangle, Filter } from 'lucide-react';
import { LogEntry } from '@/hooks/useWaterData';

interface EventLogsProps {
    logs: LogEntry[];
}

type FilterType = 'all' | 'info' | 'warning' | 'danger' | 'alerts';

export function EventLogs({ logs }: EventLogsProps) {
    const [filter, setFilter] = useState<FilterType>('all');

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        if (filter === 'alerts') return log.type === 'warning' || log.type === 'danger';
        return log.type === filter;
    });

    const getLogBadge = (type: string) => {
        switch (type) {
            case 'danger':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Critical
                    </span>
                );
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        Warning
                    </span>
                );
            case 'info':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                        <Info className="w-3 h-3" />
                        Info
                    </span>
                );
        }
    };

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                    <ScrollText className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Event Logs</h3>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-400 transition-colors" />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as FilterType)}
                            className="pl-9 pr-8 py-2 bg-gray-900 border border-gray-700 rounded-lg text-xs text-gray-300 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 appearance-none cursor-pointer hover:bg-gray-900 transition-all"
                        >
                            <option value="all">All Events</option>
                            <option value="info">Info Only</option>
                            <option value="warning">Warnings Only</option>
                            <option value="danger">Critical Only</option>
                            <option value="alerts">Warnings & Criticals</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <svg className="w-3 h-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <div className="overflow-y-auto max-h-[400px]">
                <table className="w-full">
                    <thead>
                        <tr className="z-20">
                            <th className="sticky top-0 bg-gray-800/50 backdrop-blur-md text-left py-3 px-4 text-gray-400 text-sm font-medium border-b border-gray-700 z-10">Timestamp</th>
                            <th className="sticky top-0 bg-gray-800/50 backdrop-blur-md text-left py-3 px-4 text-gray-400 text-sm font-medium border-b border-gray-700 z-10">Type</th>
                            <th className="sticky top-0 bg-gray-800/50 backdrop-blur-md text-left py-3 px-4 text-gray-400 text-sm font-medium border-b border-gray-700 z-10">Event</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-500">
                                    No {filter !== 'all' ? filter : ''} events recorded yet
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log, index) => (
                                <tr
                                    key={log.id || index}
                                    className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"
                                >
                                    <td className="py-3 px-4 text-gray-300 text-sm whitespace-nowrap">
                                        {log.timestamp.toLocaleString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit',
                                        })}
                                    </td>
                                    <td className="py-3 px-4">
                                        {getLogBadge(log.type)}
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 text-sm">{log.message}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {filteredLogs.length > 0 && (
                <div className="mt-4 flex items-center justify-between">
                    <p className="text-gray-500 text-sm">
                        Showing {filteredLogs.length} events
                    </p>
                    {filter !== 'all' && (
                        <button
                            onClick={() => setFilter('all')}
                            className="text-blue-400 text-sm hover:underline transition-all"
                        >
                            Clear Filter
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
