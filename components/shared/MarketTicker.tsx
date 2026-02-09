'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Mock data for the ticker - in real app, these could come from a Trend API
const TICKER_ITEMS = [
    { label: 'Stussy', change: 2.4, state: 'up' },
    { label: 'Arc\'teryx', change: 5.7, state: 'up' },
    { label: 'Nike', change: -0.8, state: 'down' },
    { label: 'New Balance', change: 1.2, state: 'up' },
    { label: 'Supreme', change: -3.1, state: 'down' },
    { label: 'Diesel', change: 4.5, state: 'up' },
    { label: 'Carhartt WIP', change: 0.0, state: 'neutral' },
    { label: 'Salomon', change: 8.2, state: 'up' },
    { label: 'Adidas', change: -1.5, state: 'down' },
    { label: 'Human Made', change: 3.3, state: 'up' },
];

export default function MarketTicker() {
    return (
        <div className="w-full bg-black text-white overflow-hidden py-2 border-b border-gray-800 z-40 relative">
            <div className="flex whitespace-nowrap">
                <motion.div
                    className="flex gap-8 items-center"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        ease: "linear",
                        duration: 30, // Adjust speed here
                    }}
                >
                    {/* Duplicate list to ensure seamless looping */}
                    {[...TICKER_ITEMS, ...TICKER_ITEMS, ...TICKER_ITEMS].map((item, idx) => (
                        <div key={`${item.label}-${idx}`} className="flex items-center gap-2 text-xs font-mono tracking-wider">
                            <span className="font-bold text-gray-300">{item.label.toUpperCase()}</span>
                            <span className={`flex items-center ${item.state === 'up' ? 'text-green-500' : item.state === 'down' ? 'text-red-500' : 'text-gray-500'}`}>
                                {item.state === 'up' && '▲'}
                                {item.state === 'down' && '▼'}
                                {item.state === 'neutral' && '-'}
                                <span className="ml-1">{Math.abs(item.change)}%</span>
                            </span>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Visual Fade Edges */}
            <div className="absolute top-0 left-0 w-8 h-full bg-gradient-to-r from-black to-transparent pointer-events-none" />
            <div className="absolute top-0 right-0 w-8 h-full bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </div>
    );
}
