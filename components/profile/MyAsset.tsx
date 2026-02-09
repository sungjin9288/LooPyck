'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';

// Mock Data for "My Assets"
const ASSET_DATA = [
    { name: 'Outer', value: 450000, color: '#000000' },
    { name: 'Top', value: 230000, color: '#333333' },
    { name: 'Bottom', value: 180000, color: '#666666' },
    { name: 'Shoes', value: 320000, color: '#999999' },
    { name: 'Acc', value: 120000, color: '#cccccc' },
];

const TOTAL_VALUE = ASSET_DATA.reduce((acc, cur) => acc + cur.value, 0);
const INITIAL_INVESTMENT = 1100000; // Mock initial buy price
const ROI = ((TOTAL_VALUE - INITIAL_INVESTMENT) / INITIAL_INVESTMENT) * 100;

export default function MyAsset() {
    return (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
                        My Wardrobe Value
                    </h2>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-black">
                            ₩{TOTAL_VALUE.toLocaleString()}
                        </span>
                        <span className={`text-sm font-bold ${ROI >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {ROI >= 0 ? '+' : ''}{ROI.toFixed(1)}%
                        </span>
                    </div>
                </div>
                <div className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold">
                    PORTFOLIO
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* Chart */}
                <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={ASSET_DATA}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {ASSET_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => `₩${value.toLocaleString()}`}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs font-bold text-gray-400">ALLOCATION</span>
                    </div>
                </div>

                {/* Breakdown List */}
                <div className="space-y-3">
                    {ASSET_DATA.map((item, index) => (
                        <motion.div
                            key={item.name}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="flex justify-between items-center"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-sm font-medium text-gray-600">{item.name}</span>
                            </div>
                            <span className="text-sm font-bold text-black">
                                {((item.value / TOTAL_VALUE) * 100).toFixed(0)}%
                            </span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-400 mb-2">
                    Your collection outperforms the market by <span className="text-black font-bold">12.5%</span> this season.
                </p>
                <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors">
                    View Comprehensive Report
                </button>
            </div>
        </div>
    );
}
