import React, { useState, useEffect } from 'react';
import { performanceMonitor } from '../../lib/core/performanceMonitor';

/**
 * DebugConsole Component
 * 관리자용 실시간 시스템 상태 대시보드.
 * 
 * Features:
 * - Health Status Indicator (Green/Yellow/Red)
 * - Real-time Performance Metrics (Avg Latency)
 * - Recent Slow Operation Logs
 */

const DebugConsole: React.FC = () => {
    const [metrics, setMetrics] = useState<any[]>([]);
    const [avgLatency, setAvgLatency] = useState<number>(0);
    const [healthStatus, setHealthStatus] = useState<'healthy' | 'degraded' | 'critical'>('healthy');

    useEffect(() => {
        const interval = setInterval(() => {
            const recent = performanceMonitor.getRecentMetrics(10);
            setMetrics(recent);

            const lat = performanceMonitor.getAverageLatency();
            setAvgLatency(lat);

            // Health Logic
            if (lat > 1000) setHealthStatus('critical');
            else if (lat > 300) setHealthStatus('degraded');
            else setHealthStatus('healthy');

        }, 2000); // 2초마다 갱신

        return () => clearInterval(interval);
    }, []);

    const statusColor = {
        healthy: 'bg-green-500',
        degraded: 'bg-yellow-500',
        critical: 'bg-red-500'
    };

    return (
        <div className="p-4 bg-gray-900 text-white rounded-lg shadow-lg font-mono text-sm">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h2 className="text-xl font-bold">🛠️ System Debug Console</h2>
                <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full animate-pulse ${statusColor[healthStatus]}`}></span>
                    <span className="uppercase font-semibold text-xs tracking-wider">{healthStatus}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-gray-800 p-3 rounded">
                    <h3 className="text-gray-400 text-xs mb-1">AVG LATENCY (Global)</h3>
                    <p className="text-2xl font-bold">{avgLatency}ms</p>
                </div>
                <div className="bg-gray-800 p-3 rounded">
                    <h3 className="text-gray-400 text-xs mb-1">MEMORY USAGE (Est.)</h3>
                    <p className="text-2xl font-bold">
                        {metrics.length > 0 && metrics[metrics.length - 1].memoryUsage
                            ? (metrics[metrics.length - 1].memoryUsage.heapUsed / 1024 / 1024).toFixed(1) + ' MB'
                            : 'N/A'}
                    </p>
                </div>
            </div>

            <div>
                <h3 className="text-gray-400 text-xs mb-2">RECENT OPERATIONS</h3>
                <div className="h-40 overflow-y-auto space-y-1 pr-2 scrollbar-thin scrollbar-thumb-gray-600">
                    {metrics.map((m, idx) => (
                        <div key={idx} className="flex justify-between items-center text-xs bg-gray-800 p-2 rounded hover:bg-gray-700 transition-colors">
                            <span className="text-blue-400">[{m.timestamp.split('T')[1].split('.')[0]}]</span>
                            <span className="flex-1 mx-2 truncate">{m.operationName}</span>
                            <span className={`font-bold ${m.durationMs > 500 ? 'text-red-400' : 'text-green-400'}`}>
                                {m.durationMs}ms
                            </span>
                        </div>
                    ))}
                    {metrics.length === 0 && (
                        <div className="text-center text-gray-500 py-10">No metrics recorded yet...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DebugConsole;
