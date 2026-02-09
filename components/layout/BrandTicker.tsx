'use client';

import React from 'react';

const BRANDS = [
    { name: 'NIKE', change: 2.4, isUp: true },
    { name: 'STUSSY', change: -0.5, isUp: false },
    { name: 'SUPREME', change: 12.1, isUp: true },
    { name: 'ADIDAS', change: 0.8, isUp: true },
    { name: 'NEW BALANCE', change: 3.2, isUp: true },
    { name: 'ARC\'TERYX', change: 5.7, isUp: true },
    { name: 'PALACE', change: -1.2, isUp: false },
    { name: 'HUMAN MADE', change: 1.5, isUp: true },
    { name: 'KITH', change: -0.3, isUp: false },
    { name: 'SALOMON', change: 4.1, isUp: true },
];

export default function BrandTicker() {
    return (
        <div className="bg-black text-white overflow-hidden py-2 border-b border-gray-800 relative z-[60]">
            <div className="flex animate-marquee whitespace-nowrap">
                {[...BRANDS, ...BRANDS, ...BRANDS].map((brand, i) => ( // Repeat 3x for smooth loop
                    <div key={i} className="flex items-center mx-6 gap-2">
                        <span className="font-bold text-xs tracking-widest">{brand.name}</span>
                        <span className={`text-[10px] font-mono ${brand.isUp ? 'text-green-400' : 'text-red-400'}`}>
                            {brand.isUp ? '▲' : '▼'} {Math.abs(brand.change)}%
                        </span>
                    </div>
                ))}
            </div>

            {/* Tailwind Custom Keyframes assumed in globals.css or tailwind.config - inline style fallback just in case */}
            <style jsx>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 30s linear infinite;
                }
            `}</style>
        </div>
    );
}
