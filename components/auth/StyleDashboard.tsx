'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { InteractionNarrative } from '@/lib/ux/interactionNarrative';

// Mock Data for Style DNA (In real app, this comes from UserContext/Firestore)
const STYLE_DNA = [
    { label: 'Minimal', value: 75, color: 'bg-stone-800' },
    { label: 'Street', value: 45, color: 'bg-blue-600' },
    { label: 'Vintage', value: 30, color: 'bg-amber-700' },
    { label: 'Sporty', value: 20, color: 'bg-green-600' }
];

export default function StyleDashboard() {
    return (
        <div className="w-full bg-white border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-4 py-8">
                <div className="flex flex-col md:flex-row justify-between items-end mb-6">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                            My Style DNA
                        </h2>
                        <h1 className="text-2xl font-serif font-medium text-black">
                            Minimalist <span className="text-gray-400 italic">&</span> Contemporary
                        </h1>
                    </motion.div>

                    <motion.button
                        variants={InteractionNarrative.elasticBounce}
                        whileHover="hover"
                        whileTap="tap"
                        className="text-sm text-gray-500 hover:text-black underline underline-offset-4"
                    >
                        View Full Report
                    </motion.button>
                </div>

                {/* DNA Bars */}
                <div className="space-y-4">
                    {STYLE_DNA.map((item, index) => (
                        <div key={item.label} className="group flex items-center gap-4">
                            <span className="w-20 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">
                                {item.label}
                            </span>
                            <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden relative">
                                <motion.div
                                    className={`h-full ${item.color}`}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.value}%` }}
                                    transition={{ duration: 1.5, delay: index * 0.2, ease: "easeOut" }}
                                />
                            </div>
                            <span className="w-8 text-xs font-medium text-gray-900">
                                {item.value}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
