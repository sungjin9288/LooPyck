import React, { useEffect, useState } from 'react';
import { designTokens } from '@/styles/designTokens';

interface ScanningEffectProps {
    isActive: boolean;
    sources?: string[];
}

export function ScanningEffect({ isActive, sources = ['Naver Shopping', 'Musinsa', '29CM', 'W Concept'] }: ScanningEffectProps) {
    const [currentSourceIndex, setCurrentSourceIndex] = useState(0);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(() => {
            setCurrentSourceIndex(prev => (prev + 1) % sources.length);
        }, 300); // 0.3s interval for rapid scanning feel

        return () => clearInterval(interval);
    }, [isActive, sources.length]);

    if (!isActive) return null;

    const currentSource = sources[currentSourceIndex];

    return (
        <div style={styles.container}>
            <div style={styles.radarEffect}></div>
            <div style={styles.textContainer}>
                <span style={styles.icon}>🔍</span>
                <span style={styles.text}>
                    Scanning <span style={styles.sourceName}>{currentSource}</span>...
                </span>
            </div>
            <div style={styles.progressBar}>
                <div style={styles.progressFill}></div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: 'fixed' as const,
        top: '80px', // Header height approx
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: designTokens.zIndex.toast,
        backgroundColor: 'rgba(15, 23, 42, 0.8)', // slate-900 / 0.8
        backdropFilter: 'blur(8px)',
        padding: '12px 24px',
        borderRadius: '999px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        gap: '8px',
        boxShadow: designTokens.shadows.lg,
        border: `1px solid ${designTokens.colors.border}`,
        width: '300px',
    },
    textContainer: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        color: '#fff',
        fontSize: '14px',
        fontWeight: 500,
    },
    icon: {
        animation: 'pulse 1s infinite',
    },
    text: {
        whiteSpace: 'nowrap' as const,
    },
    sourceName: {
        color: designTokens.colors.primary,
        fontWeight: 700,
    },
    radarEffect: {
        // Simple radar implementation could be added here
    },
    progressBar: {
        width: '100%',
        height: '2px',
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: '2px',
        overflow: 'hidden',
    },
    progressFill: {
        width: '100%',
        height: '100%',
        backgroundColor: designTokens.colors.primary,
        animation: 'indeterminate 1.5s infinite linear',
        transformOrigin: 'left',
    }
};

// Global style for keyframes (Needs to be injected or used in global css)
// For now, we rely on existing css or simple style tag
// animation: indeterminate -> @keyframes indeterminate { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
