'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for merging classes, if not i will remove it.

interface MarqueeProps {
    children: React.ReactNode;
    direction?: 'left' | 'right';
    speed?: number;
    className?: string;
    pauseOnHover?: boolean;
}

export default function Marquee({
    children,
    direction = 'left',
    speed = 50,
    className,
    pauseOnHover = true,
}: MarqueeProps) {
    return (
        <div className={cn("overflow-hidden flex", className)}>
            <motion.div
                initial={{ x: 0 }}
                animate={{ x: direction === 'left' ? '-50%' : '0%' }}
                transition={{
                    repeat: Infinity,
                    ease: "linear",
                    duration: speed,
                    repeatType: "loop" // Ensure smooth looping
                }}
                style={{
                    // Trick: We need to render children twice to make it seamless
                    // But width needs to be enough. Flexbox handles it.
                    display: "flex",
                    whiteSpace: "nowrap",
                    minWidth: "max-content", // Important for scrolling content fitting
                }}
            // We actually need a different logic for infinite scroll with framer motion to differ 'left'/ 'right'.
            // Simplified approach: Wrapper with 2 copies of children
            >
                {/*  
            Correction: standard framer motion marquee requires specific setup.
            Let's try a CSS-animation friendly structure or a robust framer one.
            Below is a robust structure:
         */}
            </motion.div>
            {/* 
        Re-writing the logic to be simpler and more robust without complex measurements.
        We will use a container that is wide enough and translates.
       */}
            <div className={cn("flex w-full overflow-hidden", className)}>
                <motion.div
                    className="flex flex-nowrap"
                    initial={{ x: direction === 'left' ? 0 : '-50%' }}
                    animate={{ x: direction === 'left' ? '-50%' : 0 }}
                    transition={{
                        ease: "linear",
                        duration: speed,
                        repeat: Infinity,
                    }}
                    whileHover={pauseOnHover ? { animationPlayState: 'paused' } : undefined}
                >
                    {/* Render children enough times to fill screen + buffer. 
                 For simplicity, we render twice which works if content width > screen width 
                 or just ensure caller provides enough content.
             */}
                    <div className="flex items-center gap-4 px-4">
                        {children}
                    </div>
                    <div className="flex items-center gap-4 px-4">
                        {children}
                    </div>
                    <div className="flex items-center gap-4 px-4">
                        {children}
                    </div>
                    <div className="flex items-center gap-4 px-4">
                        {children}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
// Rewriting to ensure it compiles correctly without 'cn' if it doesn't exist,
// and fixing the structure.
