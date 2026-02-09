'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { designTokens } from '../../styles/designTokens';

type StateType = 'loading' | 'error' | 'empty';

interface StateVisualizerProps {
    state: StateType;
    message?: string;
    onRetry?: () => void;
    children?: React.ReactNode; // For custom content like RecommendationFallback
}

export const StateVisualizer: React.FC<StateVisualizerProps> = ({ state, message, onRetry, children }) => {

    // Animation Variants
    const containerVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    if (state === 'loading') {
        return (
            <motion.div
                className="flex flex-col items-center justify-center py-20"
                initial="hidden" animate="visible" variants={containerVariants}
            >
                <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
                <p className="text-gray-400 font-light tracking-wide text-lg">
                    {message || 'Curating your experience...'}
                </p>
            </motion.div>
        );
    }

    if (state === 'error') {
        return (
            <motion.div
                className="flex flex-col items-center justify-center py-20 text-center px-4"
                initial="hidden" animate="visible" variants={containerVariants}
            >
                <div className="text-6xl mb-4">🌪️</div>
                <h3 className="text-2xl font-bold text-white mb-2">Let's try that again</h3>
                <p className="text-gray-400 mb-6 max-w-md">
                    {message || "We encountered a momentary glitch in the matrix."}
                </p>
                {onRetry && (
                    <button
                        onClick={onRetry}
                        className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:scale-105 transition-transform"
                    >
                        Retry Connection
                    </button>
                )}
            </motion.div>
        );
    }

    if (state === 'empty') {
        return (
            <motion.div
                className="flex flex-col items-center justify-center py-20 text-center"
                initial="hidden" animate="visible" variants={containerVariants}
            >
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">No matches found</h3>
                <p className="text-gray-400 mb-8 max-w-md">
                    {message || "We couldn't find exactly what you're looking for, but..."}
                </p>

                {children}
            </motion.div>
        );
    }

    return null;
};
