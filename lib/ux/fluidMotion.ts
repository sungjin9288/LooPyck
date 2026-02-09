'use client';

import React, { useRef, useState } from 'react';
import { useScroll, useTransform, MotionValue, motion } from 'framer-motion';

/**
 * useParallax Hook
 * 스크롤에 따라 요소의 위치를 변형하여 깊이감을 주는 패럴랙스 효과.
 * @param value 스크롤 진행도 (scrollYProgress)
 * @param distance 이동 거리 (픽셀)
 */
export function useParallax(value: MotionValue<number>, distance: number) {
    return useTransform(value, [0, 1], [-distance, distance]);
}

/**
 * Magnetic Component
 * 마우스가 가까워질 때 요소를 자석처럼 끌어당기는 효과.
 */
interface MagneticProps {
    children: React.ReactElement;
    strength?: number; // 자석 강도 (기본: 30)
}

export const Magnetic = ({ children, strength = 30 }: MagneticProps) => {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleMouseMove = (e: React.MouseEvent) => {
        const { clientX, clientY } = e;
        const rect = ref.current?.getBoundingClientRect();

        if (rect) {
            const { left, top, width, height } = rect;
            const centerX = left + width / 2;
            const centerY = top + height / 2;

            const x = (clientX - centerX) / (width / 2);
            const y = (clientY - centerY) / (height / 2);

            // 거리가 가까울수록 더 강하게 끌어당김 (Lerp or simply proportional)
            setPosition({ x: x * strength, y: y * strength });
        }
    };

    const handleMouseLeave = () => {
        setPosition({ x: 0, y: 0 });
    };

    const { x, y } = position;

    // Workaround for Framer Motion v12 type issue using React.createElement
    return React.createElement(motion.div as any, {
        ref,
        onMouseMove: handleMouseMove,
        onMouseLeave: handleMouseLeave,
        animate: { x, y },
        transition: { type: "spring", stiffness: 150, damping: 15, mass: 0.1 }
    }, children);
};
