'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const BATTLE_ITEMS = [
    {
        id: 'A',
        name: 'Classic Trench',
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80',
        votes: 1240
    },
    {
        id: 'B',
        name: 'Modern Bomber',
        image: 'https://images.unsplash.com/photo-1551028919-383718bccf3b?w=500&q=80',
        votes: 980
    }
];

export default function FashionBattle() {
    const [voted, setVoted] = useState<string | null>(null);
    const totalVotes = BATTLE_ITEMS[0].votes + BATTLE_ITEMS[1].votes + (voted ? 1 : 0);

    const handleVote = (id: string) => {
        if (voted) return;
        setVoted(id);
    };

    return (
        <div className="w-full max-w-4xl mx-auto my-12">
            <h2 className="text-2xl font-black text-center mb-1">Fashion Battle</h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Which style defines this season?</p>

            <div className="flex flex-col md:flex-row gap-4 h-[400px] md:h-[500px]">
                {BATTLE_ITEMS.map((item) => {
                    const isSelected = voted === item.id;
                    const isLoser = voted && voted !== item.id;
                    const percent = Math.round(((item.votes + (isSelected ? 1 : 0)) / totalVotes) * 100);

                    return (
                        <div
                            key={item.id}
                            className={`relative flex-1 rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 ${isLoser ? 'opacity-50 grayscale scale-95' : 'opacity-100'}`}
                            onClick={() => handleVote(item.id)}
                        >
                            {/* Image Background */}
                            <img
                                src={item.image}
                                alt={item.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />

                            {/* Overlay */}
                            <div className={`absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors ${isSelected ? 'bg-black/60' : ''}`} />

                            {/* Content */}
                            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6">
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">{item.name}</h3>

                                {!voted && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0"
                                    >
                                        VOTE
                                    </motion.button>
                                )}

                                {voted && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center"
                                    >
                                        <div className="text-6xl font-black mb-1">{percent}%</div>
                                        <div className="text-sm font-medium opacity-80">{item.votes + (isSelected ? 1 : 0)} Votes</div>
                                    </motion.div>
                                )}
                            </div>

                            {/* VS Badge (Absolute Center) */}
                            {/* Only show on desktop for layout reasons via CSS if needed, but centering via flex gap logic is simpler */}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
