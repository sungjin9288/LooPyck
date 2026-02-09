'use client';

import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

/**
 * SmoothScroll Component
 * 전역 스크롤을 'Lenis'로 대체하여 부드러운 관성 스크롤을 적용.
 * Performance: requestAnimationFrame 기반으로 작동하며 60fps 유지 목표.
 */
export default function SmoothScroll({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        });

        // Loop for Lenis
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }

        requestAnimationFrame(raf);

        return () => {
            lenis.destroy();
        };
    }, []);

    return <>{children}</>;
}
