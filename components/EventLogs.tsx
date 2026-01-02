'use client';

import { ScrollText, AlertCircle, Info } from 'lucide-react';
import { LogEntry } from '@/hooks/useWaterData';

interface EventLogsProps {
    logs: LogEntry[];
}

export function EventLogs({ logs }: EventLogsProps) {
    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            <div className="flex items-center gap-2 mb-4">
                <ScrollText className="w-5 h-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-white">Event Logs</h3>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Timestamp</th>
                            <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Type</th>
                            <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Event</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="text-center py-8 text-gray-500">
                                    No events recorded yet
                                </td>
                            </tr>
                        ) : (
                            logs.map((log, index) => (
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
                                        {log.type === 'alert' ? (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-500/20 text-red-400 text-xs font-medium">
                                                <AlertCircle className="w-3 h-3" />
                                                Alert
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                                                <Info className="w-3 h-3" />
                                                Info
                                            </span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4 text-gray-300 text-sm">{log.message}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {logs.length > 0 && (
                <p className="mt-4 text-gray-500 text-sm text-center">
                    Showing {logs.length} most recent events
                </p>
            )}
        </div>
    );
}
