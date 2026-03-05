'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { BrandTrendItem } from '@/app/api/brand-trends/route';

const FALLBACK_ITEMS: BrandTrendItem[] = [
    { name: 'STUSSY', change: 2.4, isUp: true, productCount: 0 },
    { name: "ARC'TERYX", change: 5.7, isUp: true, productCount: 0 },
    { name: 'NIKE', change: 0.8, isUp: false, productCount: 0 },
    { name: 'NEW BALANCE', change: 1.2, isUp: true, productCount: 0 },
    { name: 'SUPREME', change: 3.1, isUp: true, productCount: 0 },
    { name: 'SALOMON', change: 4.5, isUp: true, productCount: 0 },
    { name: 'ADIDAS', change: 0.0, isUp: true, productCount: 0 },
    { name: 'HUMAN MADE', change: 3.3, isUp: true, productCount: 0 },
    { name: 'ADER ERROR', change: 1.5, isUp: false, productCount: 0 },
    { name: 'KITH', change: 2.1, isUp: true, productCount: 0 },
];

export default function MarketTicker() {
    const [items, setItems] = useState<BrandTrendItem[]>(FALLBACK_ITEMS);

    useEffect(() => {
        let active = true;
        fetch('/api/brand-trends')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (active && Array.isArray(data?.brands) && data.brands.length > 0) {
                    setItems(data.brands);
                }
            })
            .catch(() => { /* 폴백 유지 */ });
        return () => { active = false; };
    }, []);

    const displayItems = [...items, ...items, ...items];

    return (
        <div className="w-full bg-black text-white overflow-hidden py-2 border-b border-gray-800 z-40 relative">
            <div className="flex whitespace-nowrap">
                <motion.div
                    className="flex gap-8 items-center"
                    animate={{ x: [0, -1000] }}
                    transition={{
                        repeat: Infinity,
                        ease: 'linear',
                        duration: 30,
                    }}
                >
                    {displayItems.map((item, idx) => (
                        <div key={`${item.name}-${idx}`} className="flex items-center gap-2 text-xs font-mono tracking-wider">
                            <span className="font-bold text-gray-300">{item.name}</span>
                            <span className={`flex items-center ${item.isUp ? 'text-green-500' : item.change === 0 ? 'text-gray-500' : 'text-red-500'}`}>
                                {item.isUp ? '▲' : item.change === 0 ? '-' : '▼'}
                                <span className="ml-1">{item.change.toFixed(1)}%</span>
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
