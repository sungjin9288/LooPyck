'use client';

import React from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { haptics } from '@/lib/ux/hapticEngine';

interface SwipeableProductCardProps {
    children: React.ReactNode;
    onSwipeRight?: () => void; // Like
    onSwipeLeft?: () => void;  // Pass
}

export default function SwipeableProductCard({ children, onSwipeRight, onSwipeLeft }: SwipeableProductCardProps) {
    const x = useMotionValue(0);
    const rotate = useTransform(x, [-200, 200], [-30, 30]);
    const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0, 1, 1, 1, 0]);

    // Background Color Interpolation
    const background = useTransform(
        x,
        [-200, 0, 200],
        ['rgba(255, 0, 0, 0.2)', 'rgba(255, 255, 255, 0)', 'rgba(0, 255, 0, 0.2)']
    );

    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        if (info.offset.x > 100 && onSwipeRight) {
            haptics.trigger('success'); // Tactile Pop
            onSwipeRight();
        } else if (info.offset.x < -100 && onSwipeLeft) {
            haptics.trigger('medium'); // Tactile Tick
            onSwipeLeft();
        }
    };

    return (
        <motion.div
            style={{ x, rotate, background }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={handleDragEnd}
            whileDrag={{ cursor: 'grabbing', scale: 1.05 }}
            className="relative touch-none select-none rounded-xl overflow-hidden bg-white"
        >
            {/* Overlay Feedback icons */}
            <motion.div
                style={{ opacity: useTransform(x, [50, 150], [0, 1]) }}
                className="absolute top-4 left-4 z-10 border-4 border-green-500 rounded-lg p-2 transform -rotate-12"
            >
                <span className="text-green-500 font-black text-2xl uppercase">LIKE</span>
            </motion.div>

            <motion.div
                style={{ opacity: useTransform(x, [-150, -50], [1, 0]) }}
                className="absolute top-4 right-4 z-10 border-4 border-red-500 rounded-lg p-2 transform rotate-12"
            >
                <span className="text-red-500 font-black text-2xl uppercase">NOPE</span>
            </motion.div>

            {children}
        </motion.div>
    );
}
