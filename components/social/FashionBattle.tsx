'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { haptics } from '@/lib/ux/hapticEngine';
import { db } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, increment, setDoc } from 'firebase/firestore';

interface BattleItem {
    id: string;
    name: string;
    image: string;
}

interface BattleSeason {
    id: string;
    label: string;
    endDate: Date;
    items: [BattleItem, BattleItem];
}

const BATTLE_SEASONS: BattleSeason[] = [
    {
        id: 'season_2026_spring_1',
        label: 'Spring 2026 — Vol.1',
        endDate: new Date('2026-03-15'),
        items: [
            { id: 'A', name: 'Classic Trench', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=500&q=80' },
            { id: 'B', name: 'Modern Bomber', image: 'https://images.unsplash.com/photo-1551028919-383718bccf3b?w=500&q=80' },
        ],
    },
    {
        id: 'season_2026_spring_2',
        label: 'Spring 2026 — Vol.2',
        endDate: new Date('2026-04-01'),
        items: [
            { id: 'A', name: 'Linen Blazer', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80' },
            { id: 'B', name: 'Denim Jacket', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500&q=80' },
        ],
    },
    {
        id: 'season_2026_spring_3',
        label: 'Spring 2026 — Vol.3',
        endDate: new Date('2026-04-15'),
        items: [
            { id: 'A', name: 'Varsity Jacket', image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=500&q=80' },
            { id: 'B', name: 'Windbreaker', image: 'https://images.unsplash.com/photo-1556906781-9a412961a28b?w=500&q=80' },
        ],
    },
    {
        id: 'season_2026_summer_1',
        label: 'Summer 2026 — Vol.1',
        endDate: new Date('2026-06-01'),
        items: [
            { id: 'A', name: 'Linen Shirt', image: 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?w=500&q=80' },
            { id: 'B', name: 'Polo Tee', image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=500&q=80' },
        ],
    },
];

function getCurrentSeason(): BattleSeason {
    const now = new Date();
    const active = BATTLE_SEASONS.find(s => s.endDate > now);
    return active ?? BATTLE_SEASONS[BATTLE_SEASONS.length - 1];
}

function useCountdown(endDate: Date) {
    const [timeLeft, setTimeLeft] = useState(() => Math.max(0, endDate.getTime() - Date.now()));

    useEffect(() => {
        const timer = setInterval(() => {
            const remaining = Math.max(0, endDate.getTime() - Date.now());
            setTimeLeft(remaining);
            if (remaining === 0) clearInterval(timer);
        }, 1000);
        return () => clearInterval(timer);
    }, [endDate]);

    const days = Math.floor(timeLeft / 86_400_000);
    const hours = Math.floor((timeLeft % 86_400_000) / 3_600_000);
    const minutes = Math.floor((timeLeft % 3_600_000) / 60_000);
    const seconds = Math.floor((timeLeft % 60_000) / 1000);
    return { days, hours, minutes, seconds, ended: timeLeft === 0 };
}

export default function FashionBattle() {
    const season = useMemo(() => getCurrentSeason(), []);
    const [votes, setVotes] = useState({ A: 0, B: 0 });
    const [voted, setVoted] = useState<string | null>(null);
    const [totalVotes, setTotalVotes] = useState(0);
    const countdown = useCountdown(season.endDate);

    // Real-time Firestore sync
    useEffect(() => {
        if (!db) return;
        const battleRef = doc(db, 'battles', season.id);
        const unsubscribe = onSnapshot(battleRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setVotes(data.votes);
                setTotalVotes(data.votes.A + data.votes.B);
            } else {
                setDoc(battleRef, {
                    votes: { A: 0, B: 0 },
                    items: season.items,
                    label: season.label,
                }).catch(console.error);
            }
        });
        return () => unsubscribe();
    }, [season]);

    const handleVote = async (id: string) => {
        if (voted || countdown.ended) return;
        haptics.trigger('heavy');
        setVoted(id);
        setVotes(prev => ({ ...prev, [id]: prev[id as 'A' | 'B'] + 1 }));
        setTotalVotes(prev => prev + 1);
        if (db) {
            try {
                await updateDoc(doc(db, 'battles', season.id), { [`votes.${id}`]: increment(1) });
            } catch (e) {
                console.error('Vote failed:', e);
            }
        }
    };

    const pad = (n: number) => String(n).padStart(2, '0');

    return (
        <div className="w-full max-w-4xl mx-auto my-12">
            {/* Header */}
            <div className="text-center mb-6">
                <h2 className="text-2xl font-black mb-1">Fashion Battle</h2>
                <p className="text-gray-500 text-sm mb-2">{season.label} — Which style defines this season?</p>
                {/* Countdown */}
                <div className="inline-flex items-center gap-1 text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-1.5 text-slate-600 dark:text-slate-400">
                    {countdown.ended ? (
                        <span className="text-rose-500 font-bold">배틀 종료</span>
                    ) : (
                        <>
                            <span className="text-slate-400 mr-1">마감까지</span>
                            {countdown.days > 0 && <><span className="font-bold text-slate-700 dark:text-slate-200">{countdown.days}</span><span>일 </span></>}
                            <span className="font-bold text-slate-700 dark:text-slate-200">{pad(countdown.hours)}</span>
                            <span>:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{pad(countdown.minutes)}</span>
                            <span>:</span>
                            <span className="font-bold text-slate-700 dark:text-slate-200">{pad(countdown.seconds)}</span>
                        </>
                    )}
                </div>
            </div>

            {/* Battle Arena */}
            <div className="relative flex flex-col md:flex-row gap-4 h-[400px] md:h-[500px]">
                {season.items.map((item) => {
                    const isSelected = voted === item.id;
                    const isLoser = voted && voted !== item.id;
                    const voteCount = votes[item.id as 'A' | 'B'] ?? 0;
                    const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 50;

                    return (
                        <div
                            key={item.id}
                            className={`relative flex-1 rounded-3xl overflow-hidden cursor-pointer group transition-all duration-500 ${isLoser ? 'opacity-50 grayscale scale-95' : 'opacity-100'} ${countdown.ended ? 'cursor-default' : ''}`}
                            onClick={() => handleVote(item.id)}
                        >
                            <img
                                src={item.image}
                                alt={item.name}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className={`absolute inset-0 bg-black/30 transition-colors ${isSelected ? 'bg-black/60' : 'group-hover:bg-black/50'}`} />

                            <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-6">
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-2">{item.name}</h3>

                                {!voted && !countdown.ended && (
                                    <motion.button
                                        whileHover={{ scale: 1.1 }}
                                        whileTap={{ scale: 0.9 }}
                                        className="mt-4 px-6 py-2 bg-white text-black font-bold rounded-full opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0"
                                    >
                                        VOTE
                                    </motion.button>
                                )}

                                {(voted || countdown.ended) && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.5 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="text-center"
                                    >
                                        <div className="text-6xl font-black mb-1">{percent}%</div>
                                        <div className="text-sm font-medium opacity-80">{voteCount.toLocaleString()} Votes</div>
                                    </motion.div>
                                )}

                                {isSelected && (
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="mt-3 px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-bold border border-white/40"
                                    >
                                        ✓ 내 선택
                                    </motion.div>
                                )}
                            </div>
                        </div>
                    );
                })}

                {/* VS Badge */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-900 shadow-xl flex items-center justify-center border-2 border-slate-100 dark:border-slate-700">
                        <span className="text-sm font-black text-slate-800 dark:text-white">VS</span>
                    </div>
                </div>
            </div>

            {/* Vote Total */}
            {totalVotes > 0 && (
                <p className="text-center text-xs text-slate-400 mt-3">총 {totalVotes.toLocaleString()}명 참여</p>
            )}
        </div>
    );
}
