'use client';

import { useState, useCallback, useMemo } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    getDocs,
    Timestamp,
    Firestore,
} from 'firebase/firestore';
import { ThresholdSettings, WaterReading } from '@/hooks/useWaterData';
import {
    Database,
    Calendar,
    Download,
    FileSpreadsheet,
    FileJson,
    Loader2,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    Droplets,
    AlertTriangle,
    BarChart3,
    Clock,
    Search,
} from 'lucide-react';

interface HistoricalDataProps {
    firebaseDb: Firestore | null;
    settings: ThresholdSettings;
    onLogEvent?: (message: string, type: 'info' | 'warning' | 'danger') => Promise<void>;
    adminEmail?: string;
}

interface DownsampledReading extends WaterReading {
    status: 'safe' | 'warning' | 'danger';
}

const ROWS_PER_PAGE = 25;
const MAX_QUERY_DOCS = 10000;
const MAX_RANGE_DAYS = 30;

/**
 * Determine the adaptive bucket size (in ms) based on the date range span.
 *   ≤ 1 day   → raw (no downsampling)
 *   1–7 days  → 5 minutes
 *   7–14 days → 15 minutes
 *   14–30 days → 30 minutes
 */
function getExportBucketMs(startDate: Date, endDate: Date): number | null {
    const spanMs = endDate.getTime() - startDate.getTime();
    const spanDays = spanMs / (1000 * 60 * 60 * 24);

    if (spanDays <= 1) return null; // raw — no downsampling
    if (spanDays <= 7) return 5 * 60 * 1000; // 5 min
    if (spanDays <= 14) return 15 * 60 * 1000; // 15 min
    return 30 * 60 * 1000; // 30 min
}

/**
 * Return a human-readable label for the bucket size.
 */
function getBucketLabel(startDate: Date, endDate: Date): string {
    const bucketMs = getExportBucketMs(startDate, endDate);
    if (bucketMs === null) return 'Raw (no averaging)';
    const minutes = bucketMs / 60_000;
    return `${minutes} min averages`;
}

/**
 * Downsample readings into time-based buckets by averaging.
 */
function downsampleForExport(
    readings: WaterReading[],
    bucketMs: number | null
): WaterReading[] {
    if (bucketMs === null || readings.length === 0) return readings;

    const buckets = new Map<number, WaterReading[]>();

    for (const reading of readings) {
        const key = Math.floor(reading.timestamp.getTime() / bucketMs) * bucketMs;
        if (!buckets.has(key)) buckets.set(key, []);
        buckets.get(key)!.push(reading);
    }

    const downsampled: WaterReading[] = [];
    const sortedKeys = Array.from(buckets.keys()).sort((a, b) => a - b);

    for (const key of sortedKeys) {
        const bucket = buckets.get(key)!;
        const avgLevel = bucket.reduce((s, r) => s + r.level, 0) / bucket.length;
        const avgFlow = bucket.reduce((s, r) => s + r.flow, 0) / bucket.length;
        const midTimestamp = bucket[Math.floor(bucket.length / 2)].timestamp;

        downsampled.push({
            level: Math.round(avgLevel * 100) / 100,
            flow: Math.round(avgFlow * 100) / 100,
            timestamp: midTimestamp,
        });
    }

    return downsampled;
}

/**
 * Format a date for the datetime-local input.
 */
function toDatetimeLocal(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function HistoricalData({ firebaseDb, settings, onLogEvent, adminEmail }: HistoricalDataProps) {
    // Default range: last 7 days
    const [startDate, setStartDate] = useState<string>(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return toDatetimeLocal(d);
    });
    const [endDate, setEndDate] = useState<string>(() => toDatetimeLocal(new Date()));

    const [rawData, setRawData] = useState<WaterReading[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [rawCount, setRawCount] = useState(0);

    // Compute status for a single reading
    const computeStatus = useCallback(
        (reading: WaterReading): 'safe' | 'warning' | 'danger' => {
            if (reading.level >= settings.dangerLevel)
                return 'danger';
            if (reading.level >= settings.warningLevel)
                return 'warning';
            return 'safe';
        },
        [settings]
    );

    // Downsampled data with status
    const processedData: DownsampledReading[] = useMemo(() => {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const bucketMs = getExportBucketMs(start, end);
        const downsampled = downsampleForExport(rawData, bucketMs);

        return downsampled.map((r) => ({
            ...r,
            status: computeStatus(r),
        }));
    }, [rawData, startDate, endDate, computeStatus]);

    // Summary stats
    const stats = useMemo(() => {
        if (processedData.length === 0) return null;

        const levels = processedData.map((r) => r.level);
        const flows = processedData.map((r) => r.flow);
        const warningCount = processedData.filter((r) => r.status === 'warning').length;
        const dangerCount = processedData.filter((r) => r.status === 'danger').length;

        return {
            totalRecords: processedData.length,
            rawRecords: rawCount,
            maxLevel: Math.max(...levels),
            minLevel: Math.min(...levels),
            avgLevel: levels.reduce((a, b) => a + b, 0) / levels.length,
            maxFlow: Math.max(...flows),
            avgFlow: flows.reduce((a, b) => a + b, 0) / flows.length,
            warningPercent: ((warningCount / processedData.length) * 100).toFixed(1),
            dangerPercent: ((dangerCount / processedData.length) * 100).toFixed(1),
            bucketLabel: getBucketLabel(new Date(startDate), new Date(endDate)),
        };
    }, [processedData, rawCount, startDate, endDate]);

    // Pagination
    const totalPages = Math.ceil(processedData.length / ROWS_PER_PAGE);
    const paginatedData = processedData.slice(
        (currentPage - 1) * ROWS_PER_PAGE,
        currentPage * ROWS_PER_PAGE
    );

    // Validate date range
    const validateRange = useCallback((): string | null => {
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 'Please select valid dates.';
        if (start >= end) return 'Start date must be before end date.';

        const diffDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
        if (diffDays > MAX_RANGE_DAYS)
            return `Date range cannot exceed ${MAX_RANGE_DAYS} days.`;

        return null;
    }, [startDate, endDate]);

    // Load data from Firestore
    const handleLoadData = useCallback(async () => {
        if (!firebaseDb) {
            setError('Firebase is not configured.');
            return;
        }

        const validationError = validateRange();
        if (validationError) {
            setError(validationError);
            return;
        }

        setIsLoading(true);
        setError(null);
        setCurrentPage(1);

        try {
            const start = new Date(startDate);
            const end = new Date(endDate);

            const readingsQuery = query(
                collection(firebaseDb, 'readings'),
                where('timestamp', '>=', Timestamp.fromDate(start)),
                where('timestamp', '<=', Timestamp.fromDate(end)),
                orderBy('timestamp', 'desc'),
            );

            const snapshot = await getDocs(readingsQuery);
            const readings: WaterReading[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data();
                readings.push({
                    id: doc.id,
                    level: data.level ?? 0,
                    flow: data.flow ?? 0,
                    timestamp: data.timestamp?.toDate?.() || new Date(),
                });
            });

            // Reverse to chronological for downsampling, then reverse back for display
            const chronological = readings.reverse();
            setRawCount(chronological.length);
            setRawData(chronological);
            setHasLoaded(true);
        } catch (err) {
            console.error('Error fetching historical data:', err);
            setError('Failed to fetch data. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [firebaseDb, startDate, endDate, validateRange]);

    // Export as CSV
    const handleExportCSV = useCallback(() => {
        if (processedData.length === 0) return;

        const headers = 'Timestamp,Water Level (m),Flow Rate (m³/s),Status';
        const rows = processedData.map((r) => {
            const ts = r.timestamp.toISOString();
            return `${ts},${r.level},${r.flow},${r.status.charAt(0).toUpperCase() + r.status.slice(1)}`;
        });

        const csv = [headers, ...rows].join('\n');
        downloadFile(csv, `flows_readings_${formatFilenameDate(new Date(startDate))}_to_${formatFilenameDate(new Date(endDate))}.csv`, 'text/csv');
        onLogEvent?.(`${adminEmail ?? 'Admin'} exported historical data as CSV (${processedData.length} records)`, 'info');
    }, [processedData, startDate, endDate, onLogEvent, adminEmail]);

    // Export as JSON
    const handleExportJSON = useCallback(() => {
        if (processedData.length === 0) return;

        const exportData = {
            exportedAt: new Date().toISOString(),
            dateRange: {
                from: new Date(startDate).toISOString(),
                to: new Date(endDate).toISOString(),
            },
            bucketSize: getBucketLabel(new Date(startDate), new Date(endDate)),
            thresholds: {
                warningLevel: settings.warningLevel,
                dangerLevel: settings.dangerLevel,
            },
            totalRecords: processedData.length,
            rawRecords: rawCount,
            data: processedData.map((r) => ({
                timestamp: r.timestamp.toISOString(),
                level: r.level,
                flow: r.flow,
                status: r.status,
            })),
        };

        const json = JSON.stringify(exportData, null, 2);
        downloadFile(json, `flows_readings_${formatFilenameDate(new Date(startDate))}_to_${formatFilenameDate(new Date(endDate))}.json`, 'application/json');
        onLogEvent?.(`${adminEmail ?? 'Admin'} exported historical data as JSON (${processedData.length} records)`, 'info');
    }, [processedData, startDate, endDate, settings, rawCount, onLogEvent, adminEmail]);

    // Status badge component
    const StatusBadge = ({ status }: { status: 'safe' | 'warning' | 'danger' }) => {
        const config = {
            safe: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Safe' },
            warning: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Warning' },
            danger: { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30', label: 'Danger' },
        }[status];

        return (
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text} border ${config.border}`}>
                {config.label}
            </span>
        );
    };

    // Skeleton components
    const Skeleton = ({ className }: { className?: string }) => (
        <div className={`animate-pulse bg-gray-700/50 rounded ${className}`} />
    );

    const DataSkeleton = () => (
        <>
            {/* Stats Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/50">
                        <div className="flex items-center gap-1.5 mb-2">
                            <Skeleton className="w-3.5 h-3.5" />
                            <Skeleton className="w-12 h-3" />
                        </div>
                        <Skeleton className="w-16 h-6 mb-1" />
                        <Skeleton className="w-10 h-2.5" />
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="overflow-hidden rounded-lg border border-gray-700/50">
                <div className="bg-gray-900/40 h-10 border-b border-gray-700/50 flex items-center px-4 gap-4">
                    <Skeleton className="w-24 h-4" />
                    <div className="flex-1" />
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-20 h-4" />
                    <Skeleton className="w-16 h-4" />
                </div>
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-12 border-b border-gray-700/30 flex items-center px-4 gap-4 last:border-0">
                        <Skeleton className="w-32 h-3.5" />
                        <div className="flex-1" />
                        <Skeleton className="w-12 h-3.5" />
                        <Skeleton className="w-12 h-3.5" />
                        <Skeleton className="w-16 h-5 rounded-full" />
                    </div>
                ))}
            </div>
        </>
    );

    return (
        <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <Database className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Historical Data & Export</h3>
            </div>

            {/* Date Range Picker */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3 mb-6">
                <div className="flex-1 min-w-0">
                    <label className="block text-sm text-gray-400 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />
                        Start Date
                    </label>
                    <input
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-600 text-gray-200 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                    />
                </div>

                <span className="text-gray-500 hidden sm:block pb-2">→</span>

                <div className="flex-1 min-w-0">
                    <label className="block text-sm text-gray-400 mb-1.5">
                        <Calendar className="w-3.5 h-3.5 inline mr-1" />
                        End Date
                    </label>
                    <input
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-gray-900/60 border border-gray-600 text-gray-200 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
                    />
                </div>

                <button
                    onClick={handleLoadData}
                    disabled={isLoading || !firebaseDb}
                    className="flex items-center gap-2 px-5 py-2 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 disabled:opacity-40 disabled:cursor-not-allowed font-medium text-sm transition-colors whitespace-nowrap"
                >
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Search className="w-4 h-4" />
                    )}
                    {isLoading ? 'Loading...' : 'Load Data'}
                </button>
            </div>

            {/* Range info */}
            <p className="text-xs text-gray-500 mb-4 -mt-3">
                Max range: {MAX_RANGE_DAYS} days • Data will be shown as{' '}
                <span className="text-gray-400">{getBucketLabel(new Date(startDate), new Date(endDate))}</span>
            </p>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    {error}
                </div>
            )}

            {/* Empty state — before loading */}
            {!hasLoaded && !isLoading && !error && (
                <div className="text-center py-12 text-gray-500">
                    <Database className="w-10 h-10 mx-auto mb-3 opacity-40 text-blue-400" />
                    <p className="text-sm">Select a date range and click <span className="text-blue-400 font-medium">Load Data</span> to view historical readings.</p>
                    <p className="text-xs mt-1 text-gray-600">Data is fetched on-demand to minimize Firestore usage.</p>
                </div>
            )}

            {/* Loading state */}
            {isLoading && <DataSkeleton />}

            {/* Data loaded */}
            {hasLoaded && !isLoading && (
                <>
                    {processedData.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">No readings found for the selected date range.</p>
                        </div>
                    ) : (
                        <>
                            {/* Summary Statistics */}
                            {stats && (
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
                                    <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/50">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-xs text-gray-500">Records</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">{stats.totalRecords.toLocaleString()}</p>
                                        {stats.rawRecords !== stats.totalRecords && (
                                            <p className="text-xs text-gray-600">{stats.rawRecords.toLocaleString()} raw</p>
                                        )}
                                    </div>

                                    <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/50">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Clock className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-xs text-gray-500">Resolution</span>
                                        </div>
                                        <p className="text-sm font-bold text-white">{stats.bucketLabel}</p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/50">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                                            <span className="text-xs text-gray-500">Max Level</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">{stats.maxLevel.toFixed(2)}m</p>
                                        <p className="text-xs text-gray-600">min: {stats.minLevel.toFixed(2)}m</p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-gray-900/40 border border-gray-700/50">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <Droplets className="w-3.5 h-3.5 text-blue-400" />
                                            <span className="text-xs text-gray-500">Avg Flow</span>
                                        </div>
                                        <p className="text-lg font-bold text-white">{stats.avgFlow.toFixed(1)}</p>
                                        <p className="text-xs text-gray-600">m³/s</p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                                            <span className="text-xs text-gray-500">Warning</span>
                                        </div>
                                        <p className="text-lg font-bold text-amber-400">{stats.warningPercent}%</p>
                                        <p className="text-xs text-gray-600">of readings</p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                                            <span className="text-xs text-gray-500">Danger</span>
                                        </div>
                                        <p className="text-lg font-bold text-red-400">{stats.dangerPercent}%</p>
                                        <p className="text-xs text-gray-600">of readings</p>
                                    </div>
                                </div>
                            )}

                            {/* Data Table */}
                            <div className="overflow-x-auto rounded-lg border border-gray-700/50">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-gray-900/40">
                                            <th className="text-left py-3 px-4 text-gray-400 text-sm font-medium">Timestamp</th>
                                            <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Water Level (m)</th>
                                            <th className="text-right py-3 px-4 text-gray-400 text-sm font-medium">Flow Rate (m³/s)</th>
                                            <th className="text-center py-3 px-4 text-gray-400 text-sm font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedData.map((reading, index) => (
                                            <tr
                                                key={`${reading.timestamp.getTime()}-${index}`}
                                                className="border-t border-gray-700/30 hover:bg-gray-700/20 transition-colors"
                                            >
                                                <td className="py-2.5 px-4 text-gray-300 text-sm whitespace-nowrap">
                                                    {reading.timestamp.toLocaleString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                        second: '2-digit',
                                                        hour12: false,
                                                    })}
                                                </td>
                                                <td className="py-2.5 px-4 text-right text-gray-200 text-sm font-mono">
                                                    {reading.level.toFixed(2)}
                                                </td>
                                                <td className="py-2.5 px-4 text-right text-gray-200 text-sm font-mono">
                                                    {reading.flow.toFixed(1)}
                                                </td>
                                                <td className="py-2.5 px-4 text-center">
                                                    <StatusBadge status={reading.status} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-sm text-gray-500">
                                        Showing {((currentPage - 1) * ROWS_PER_PAGE) + 1}–{Math.min(currentPage * ROWS_PER_PAGE, processedData.length)} of {processedData.length.toLocaleString()}
                                    </p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                        </button>
                                        <span className="text-sm text-gray-400">
                                            Page {currentPage} of {totalPages}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-1.5 rounded-lg bg-gray-700/50 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Export Buttons */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-6 pt-6 border-t border-gray-700">
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                    <Download className="w-4 h-4" />
                                    <span>Export {processedData.length.toLocaleString()} records:</span>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleExportCSV}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
                                    >
                                        <FileSpreadsheet className="w-4 h-4" />
                                        CSV
                                    </button>
                                    <button
                                        onClick={handleExportJSON}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors"
                                    >
                                        <FileJson className="w-4 h-4" />
                                        JSON
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );
}

// --- Utility functions ---

function downloadFile(content: string, filename: string, mimeType: string) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function formatFilenameDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}
