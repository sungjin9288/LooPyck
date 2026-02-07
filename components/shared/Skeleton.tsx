'use client';

/**
 * Content-Aware Skeleton
 * 실제 콘텐츠 형태를 모방한 로딩 애니메이션
 */

import React from 'react';
import { designTokens } from '@/styles/designTokens';

interface SkeletonProps {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    borderRadius?: string | number;
    style?: React.CSSProperties;
}

export default function Skeleton({
    variant = 'rectangular',
    width,
    height,
    borderRadius,
    style,
}: SkeletonProps) {

    // Default dimensions based on variant
    const getDefaults = () => {
        switch (variant) {
            case 'text': return { width: '100%', height: '1em', borderRadius: designTokens.borderRadius.sm };
            case 'circular': return { width: 40, height: 40, borderRadius: '50%' };
            case 'rectangular': return { width: '100%', height: 200, borderRadius: designTokens.borderRadius.md };
        }
    };

    const defaults = getDefaults();

    const finalStyle: React.CSSProperties = {
        width: width || defaults.width,
        height: height || defaults.height,
        borderRadius: borderRadius || defaults.borderRadius,
        backgroundColor: designTokens.colors.surfaceHover,
        position: 'relative',
        overflow: 'hidden',
        display: 'inline-block',
        ...style,
    };

    return (
        <div style={finalStyle}>
            <div style={styles.shimmer} />
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    shimmer: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.05), transparent)',
        animation: 'shimmer 1.5s infinite linear',
    },
};
