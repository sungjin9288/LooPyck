'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserDna } from '../../lib/core/userDna';
import { useTypewriter } from '../../lib/ux/narrativeMotion';

export const DynamicHero = () => {
    const [greeting, setGreeting] = useState('Welcome to LooPyck');
    const [contextSubset, setContextSubset] = useState('Global Fashion Curator');
    const [weatherMood, setWeatherMood] = useState('sunny'); // Mock state for now

    // Determine greeting based on time
    useEffect(() => {
        const hour = new Date().getHours();
        const profile = UserDna.getTopStyles(1)[0]; // e.g., 'minimal'

        let timeGreeting = '';
        if (hour < 12) timeGreeting = 'Good Morning';
        else if (hour < 18) timeGreeting = 'Good Afternoon';
        else timeGreeting = 'Good Evening';

        setGreeting(timeGreeting);

        // Dynamic Context Message
        if (profile) {
            setContextSubset(`Today's lineup for your ${profile.toUpperCase()} mood.`);
        } else {
            setContextSubset('Discover trending styles curated by AI.');
        }
    }, []);

    const { displayedText } = useTypewriter(contextSubset, 30, 800);

    return (
        <section className="relative w-full h-[40vh] min-h-[300px] flex items-center justify-center overflow-hidden bg-black text-white">
            {/* Background Video/Image Placeholder */}
            <div className="absolute inset-0 z-0 opacity-40">
                <div className="w-full h-full bg-gradient-to-r from-gray-900 via-gray-800 to-black animate-gradient-x" />
            </div>

            <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                <motion.h1
                    className="text-4xl md:text-6xl font-bold mb-4 tracking-tight"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                >
                    {greeting}
                </motion.h1>

                <div className="h-8 md:h-12 overflow-hidden"> {/* Fixed height to prevent layout shift */}
                    <p className="text-xl md:text-2xl text-gray-300 font-light font-mono">
                        {displayedText}
                        <motion.span
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-[2px] h-[24px] bg-blue-500 ml-1 translate-y-[4px]"
                        />
                    </p>
                </div>
            </div>
        </section>
    );
};
