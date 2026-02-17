'use client';

import React from 'react';
import { cn } from '@/lib/utils';

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
        <div className={cn('overflow-hidden', className)}>
            <div className={cn('marquee-root', pauseOnHover && 'pause-on-hover')}>
                <div
                    className="marquee-track flex w-max"
                    style={{
                        animationDuration: `${speed}s`,
                        animationDirection: direction === 'left' ? 'normal' : 'reverse',
                    }}
                >
                    <div className="flex shrink-0 items-center gap-4 px-4">
                        {children}
                    </div>
                    <div className="flex shrink-0 items-center gap-4 px-4" aria-hidden>
                        {children}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .marquee-track {
                    animation-name: marquee-scroll;
                    animation-timing-function: linear;
                    animation-iteration-count: infinite;
                    will-change: transform;
                }

                .pause-on-hover:hover .marquee-track {
                    animation-play-state: paused;
                }

                @keyframes marquee-scroll {
                    from {
                        transform: translateX(0);
                    }
                    to {
                        transform: translateX(-50%);
                    }
                }
            `}</style>
        </div>
    );
}
