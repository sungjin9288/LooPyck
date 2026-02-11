'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Marquee from '@/components/shared/Marquee';

const TREND_STYLES = [
    {
        id: 'gorpcore',
        title: 'Gorpcore',
        subtitle: 'The Great Outdoors',
        desc: 'Functional gear meets street fashion. Arc\'teryx, Salomon, and technical fabrics defining the modern urban explorer.',
        image: 'https://images.unsplash.com/photo-1520975661595-6453be3f7070?w=800&q=80',
        keywords: ['Arc\'teryx', 'Salomon', 'North Face'],
        colSpan: 'md:col-span-2'
    },
    {
        id: 'y2k',
        title: 'Y2K Vintage',
        subtitle: 'Retro 2000s',
        desc: 'Nostalgic early 2000s aesthetics. Baby tees, low-rise jeans, and bold accessories.',
        image: 'https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?w=800&q=80',
        keywords: ['Diesel', 'Low Rise', 'Baby Tee'],
        colSpan: 'md:col-span-1'
    },
    {
        id: 'oldmoney',
        title: 'Old Money',
        subtitle: 'Quiet Luxury',
        desc: 'Timeless elegance and high-quality materials. A focus on subtle sophistication.',
        image: 'https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=800&q=80',
        keywords: ['Ralph Lauren', 'Loro Piana'],
        colSpan: 'md:col-span-1'
    },
    {
        id: 'minimalism',
        title: 'Minimalism',
        subtitle: 'Less is More',
        desc: 'Clean lines and monochromatic palettes.',
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800&q=80',
        keywords: ['COS', 'Jil Sander'],
        colSpan: 'md:col-span-2'
    }
];

const RISING_KEYWORDS = [
    'Stussy Hoodie', 'Adidas Samba', 'Carhartt Jacket', 'New Balance 993',
    'Cos Bag', 'Acne Studios Scarf', 'Nike V2K', 'Supreme Box Logo',
    'Miu Miu Cardigan', 'Gentle Monster', 'Asics Gel-Kayano', 'Diesel Belt'
];

interface TrendDiscoveryProps {
    onSearch: (query: string) => void;
}

export default function TrendDiscovery({ onSearch }: TrendDiscoveryProps) {
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
                    Discover the latest styles shaping the fashion world right now.
                    <br className="hidden md:block" />
                    From street-ready Gorpcore to timeless Old Money aesthetics.
                </motion.p>
            </div>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-20 auto-rows-[400px]">
                {TREND_STYLES.map((style, index) => (
                    <motion.div
                        key={style.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className={`relative group rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-2xl transition-all duration-500 ${style.colSpan}`}
                        onClick={() => onSearch(style.title)}
                    >
                        <img
                            src={style.image}
                            alt={style.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale group-hover:grayscale-0"
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
                </div>

                <Marquee speed={40} className="py-4" pauseOnHover>
                    {RISING_KEYWORDS.map((keyword, i) => (
                        <button
                            key={`${keyword}-${i}`}
                            onClick={() => onSearch(keyword)}
                            className="mx-4 text-4xl md:text-6xl font-serif font-black text-transparent stroke-text hover:text-black transition-colors duration-300 cursor-pointer"
                            style={{ WebkitTextStroke: '1px #e5e7eb' }} // Tailwind utility needed usually, but inline style works for now
                        >
                            <span className="hover:text-black transition-colors duration-300" style={{ WebkitTextStroke: '1px transparent' }}>
                                {/* Trick to make normal text on hover, but outline by default is tricky with just CSS. 
                                     Let's just use simple huge text.
                                 */}
                            </span>
                            {/* Retrying design: Large outline text that fills on hover */}
                            <span className="relative block">
                                <span className="absolute top-0 left-0 text-gray-200 pointer-events-none select-none" style={{ WebkitTextStroke: '0px' }}>
                                    {keyword}
                                </span>
                                <span className="relative text-black/5 hover:text-black transition-colors duration-500">
                                    #{keyword}
                                </span>
                            </span>
                        </button>
                    ))}
                    {RISING_KEYWORDS.map((keyword, i) => (
                        // Duplicate for basic density in case Marquee doesn't loop perfectly with small arrays
                        <button
                            key={`dup-${keyword}-${i}`}
                            onClick={() => onSearch(keyword)}
                            className="mx-6 text-2xl md:text-3xl font-serif italic text-gray-300 hover:text-black transition-colors duration-300 cursor-pointer"
                        >
                            #{keyword}
                        </button>
                    ))}
                </Marquee>
            </div>
        </section>
    );
}
