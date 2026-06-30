'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Marquee from '@/components/shared/Marquee';
import { analyzeMonthlyFashionTrends, getMsUntilNextMonthStartKST } from '@/lib/trends/monthlyTrendAnalyzer';

interface TrendDiscoveryProps {
    onSearch: (query: string) => void;
}

export default function TrendDiscovery({ onSearch }: TrendDiscoveryProps) {
    const [trendSnapshot, setTrendSnapshot] = React.useState(() => analyzeMonthlyFashionTrends(new Date()));

    React.useEffect(() => {
        let refreshTimeoutId: number | null = null;

        const refreshSnapshot = () => {
            setTrendSnapshot((prev) => {
                const next = analyzeMonthlyFashionTrends(new Date());
                return prev.monthKey === next.monthKey ? prev : next;
            });
        };

        const scheduleMonthlyRefresh = () => {
            if (refreshTimeoutId !== null) {
                window.clearTimeout(refreshTimeoutId);
            }

            const delay = getMsUntilNextMonthStartKST(new Date());
            refreshTimeoutId = window.setTimeout(() => {
                refreshSnapshot();
                scheduleMonthlyRefresh();
            }, delay);
        };

        scheduleMonthlyRefresh();

        const visibilityListener = () => {
            if (document.visibilityState === 'visible') {
                refreshSnapshot();
                scheduleMonthlyRefresh();
            }
        };

        document.addEventListener('visibilitychange', visibilityListener);

        return () => {
            if (refreshTimeoutId !== null) {
                window.clearTimeout(refreshTimeoutId);
            }
            document.removeEventListener('visibilitychange', visibilityListener);
        };
    }, []);

    return (
        <section className="w-full max-w-7xl mx-auto py-20 px-4 overflow-hidden">
            {/* Hero Header */}
            <div className="text-center mb-16 space-y-6">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-5xl md:text-7xl font-serif font-bold text-black tracking-tight"
                >
                    Curated Trends
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                    className="text-gray-500 text-lg md:text-xl font-light font-sans max-w-2xl mx-auto"
                >
                    Discover this month&apos;s fashion signals based on seasonal trend analysis.
                    <br className="hidden md:block" />
                    {trendSnapshot.editionLabel} · {trendSnapshot.analysisNote}
                </motion.p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20 auto-rows-[400px]">
                {trendSnapshot.styles.map((style, index) => (
                    <motion.div
                        key={style.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`relative group rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 ${style.colSpan}`}
                        onClick={() => onSearch(style.keywords[0] || style.title)}
                    >
                        <img
                            src={style.image}
                            alt={style.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-8 flex flex-col justify-end text-white">
                            <span className="text-sm font-sans tracking-widest uppercase mb-2 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-4 group-hover:translate-y-0">
                                {style.subtitle}
                            </span>
                            <h3 className="text-3xl md:text-4xl font-serif font-bold mb-2 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                                {style.title}
                            </h3>
                            <p className="text-gray-300 text-sm font-sans opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-4 group-hover:translate-y-0 max-w-md">
                                {style.desc}
                            </p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Rising Keywords Marquee */}
            <div className="border-t border-b border-gray-100 py-12">
                <div className="text-center mb-8">
                    <h3 className="text-sm font-sans font-bold tracking-widest uppercase text-gray-400 mb-2">
                        Trending Now
                    </h3>
                    <p className="text-xs text-gray-400">
                        Monthly refresh: {trendSnapshot.editionLabel}
                    </p>
                </div>

                <Marquee speed={40} className="py-4" pauseOnHover>
                    {trendSnapshot.risingKeywords.map((keyword) => (
                        <button
                            key={keyword.toLowerCase()}
                            onClick={() => onSearch(keyword)}
                            className="mx-5 text-3xl md:text-5xl font-serif font-black text-transparent hover:text-black transition-colors duration-300 cursor-pointer whitespace-nowrap"
                            style={{ WebkitTextStroke: '1px #d1d5db' }}
                        >
                            #{keyword}
                        </button>
                    ))}
                </Marquee>
            </div>
        </section>
    );
}
