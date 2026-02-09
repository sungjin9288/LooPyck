'use client';

import React from 'react';
import { motion } from 'framer-motion';

/**
 * Value Dashboard Component
 * 엔터프라이즈 고객에게 LooPyck 솔루션의 ROI(투자 대비 효과)를 시각적으로 증명.
 */

const metrics = [
    { title: 'Revenue Lift', value: '+18.4%', subtitle: 'vs. Keyword Search', color: 'text-green-400' },
    { title: 'Engagement Time', value: '4m 12s', subtitle: '+45% Increase', color: 'text-blue-400' },
    { title: 'Cost Savings', value: '$12.5k', subtitle: 'Monthly Server Cost', color: 'text-purple-400' },
];

export const ValueDashboard = () => {
    return (
        <div className="p-8 bg-gray-900 rounded-2xl border border-gray-800">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-blue-500">⚡</span> Business Impact Real-time
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.title}
                        className="bg-gray-800 p-6 rounded-xl border border-gray-700"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <h3 className="text-gray-400 text-sm uppercase tracking-wider mb-2">
                            {metric.title}
                        </h3>
                        <div className={`text-4xl font-bold mb-1 ${metric.color}`}>
                            {metric.value}
                        </div>
                        <p className="text-gray-500 text-xs">
                            {metric.subtitle}
                        </p>
                    </motion.div>
                ))}
            </div>

            <div className="mt-8 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                    * Data aggregated from last 30 days. Comparative analysis based on industry benchmarks.
                </p>
            </div>
        </div>
    );
};
