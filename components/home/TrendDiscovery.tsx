'use client';

import React from 'react';
import { motion } from 'framer-motion';

const TREND_STYLES = [
    {
        id: 'gorpcore',
        title: 'Gorpcore',
        desc: 'Functional & Stylish',
        image: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=500&q=80',
        keywords: ['Arc\'teryx', 'Salomon', 'North Face']
    },
    {
        id: 'y2k',
        title: 'Y2K Vintage',
        desc: 'Retro 2000s Vibes',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=500&q=80',
        keywords: ['Diesel', 'Low Rise', 'Baby Tee']
    },
    {
        id: 'oldmoney',
        title: 'Old Money',
        desc: 'Quiet Luxury',
        image: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=500&q=80',
        keywords: ['Ralph Lauren', 'Loro Piana', 'Cashmere']
    }
];

const RISING_KEYWORDS = [
    'Stussy Hoodie', 'Adidas Samba', 'Carhartt Jacket', 'New Balance 993',
    'Cos Bag', 'Acne Studios Scarf', 'Nike V2K', 'Supreme Box Logo'
];

interface TrendDiscoveryProps {
    onSearch: (query: string) => void;
}

export default function TrendDiscovery({ onSearch }: TrendDiscoveryProps) {
    return (
        <div className="w-full max-w-6xl mx-auto py-12 px-4 animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="text-center mb-12">
                <h2 className="text-4xl md:text-5xl font-black text-black mb-4 tracking-tighter">
                    Discover Your Style
                </h2>
                <p className="text-gray-500 text-lg">
                    지금 가장 뜨거운 패션 트렌드를 확인하세요.
                </p>
            </div>

            {/* Style Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                {TREND_STYLES.map((style, index) => (
                    <motion.div
                        key={style.id}
                        whileHover={{ y: -10 }}
                        className="relative h-[400px] rounded-3xl overflow-hidden cursor-pointer group shadow-lg"
                        onClick={() => onSearch(style.title)}
                    >
                        <img
                            src={style.image}
                            alt={style.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end text-white">
                            <h3 className="text-2xl font-bold mb-1">{style.title}</h3>
                            <p className="text-gray-300 text-sm mb-4">{style.desc}</p>
                            <div className="flex flex-wrap gap-2">
                                {style.keywords.map(k => (
                                    <span key={k} className="text-xs bg-white/20 backdrop-blur-md px-2 py-1 rounded-full">
                                        #{k}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Rising Keywords */}
            <div className="text-center">
                <h3 className="text-xl font-bold mb-6 flex items-center justify-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    Real-time Rising Keywords
                </h3>
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                    {RISING_KEYWORDS.map((keyword, i) => (
                        <button
                            key={keyword}
                            onClick={() => onSearch(keyword)}
                            className="px-5 py-2 rounded-full border border-gray-200 text-gray-600 hover:border-black hover:text-black hover:bg-gray-50 transition-all text-sm font-medium"
                        >
                            {i + 1}. {keyword}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
