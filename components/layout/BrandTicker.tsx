'use client';

import React, { useState, useEffect } from 'react';
import { BrandTrendItem } from '@/app/api/brand-trends/route';

// Hardcoded fallback for initial render before API response
const INITIAL_DATA: BrandTrendItem[] = [
    { name: 'NIKE', productCount: 0, change: 2.4, isUp: true },
    { name: 'ADIDAS', productCount: 0, change: 0.8, isUp: true },
    { name: 'NEW BALANCE', productCount: 0, change: 3.2, isUp: true },
    { name: 'STUSSY', productCount: 0, change: 0.5, isUp: false },
    { name: 'SUPREME', productCount: 0, change: 12.1, isUp: true },
    { name: 'ARC TERYX', productCount: 0, change: 5.7, isUp: true },
    { name: 'SALOMON', productCount: 0, change: 4.1, isUp: true },
    { name: 'KITH', productCount: 0, change: 0.3, isUp: false },
];

export default function BrandTicker() {
    const [brands, setBrands] = useState<BrandTrendItem[]>(INITIAL_DATA);
    const [isLive, setIsLive] = useState(false);
    const [updatedAt, setUpdatedAt] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const res = await fetch('/api/brand-trends', {
                    next: { revalidate: 3600 }
                } as RequestInit);
                if (!res.ok) return;
                const data = await res.json();
                if (data.brands && data.brands.length > 0) {
                    setBrands(data.brands);
                    setIsLive(!data.fallback);
                    if (data.updatedAt) setUpdatedAt(data.updatedAt);
                }
            } catch {
                // Silent fail - keep fallback data
            }
        };

        fetchTrends();
        // Refresh every 60 minutes
        const interval = setInterval(fetchTrends, 60 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-950 text-white overflow-hidden py-2 border-b border-slate-800 relative z-[60]">
            {/* Live indicator */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 bg-slate-950/90 pl-2">
                <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                <span className="text-[9px] text-slate-500 font-mono">
                    {isLive ? 'LIVE' : 'CACHED'}
                </span>
            </div>

            <div className="flex animate-marquee whitespace-nowrap">
                {[...brands, ...brands, ...brands].map((brand, i) => (
                    <div key={i} className="flex items-center mx-6 gap-2">
                        <span className="font-bold text-xs tracking-widest">{brand.name}</span>
                        <span className={`text-[10px] font-mono ${brand.isUp ? 'text-green-400' : 'text-red-400'}`}>
                            {brand.isUp ? '▲' : '▼'} {Math.abs(brand.change)}%
                        </span>
                    </div>
                ))}
            </div>

            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-33.33%); }
                }
                .animate-marquee {
                    animation: marquee 40s linear infinite;
                }
            `}</style>
        </div>
    );
}
