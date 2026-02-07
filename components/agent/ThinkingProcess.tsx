'use client';

/**
 * Thinking Process - 에이전트 사고 과정 시각화
 * Visual Intelligence UI Component
 */

import React, { useState, useEffect } from 'react';
import { injectGlobalAnimations } from '@/styles/animations';

type StepStatus = 'waiting' | 'processing' | 'completed' | 'failed';

interface Step {
    id: string;
    label: string;
    icon: string;
}

const STEPS: Step[] = [
    { id: 'analyze', label: 'Analyzing DOM Structure...', icon: '🔍' },
    { id: 'extract', label: 'Extracting Visual Vectors...', icon: '🧠' },
    { id: 'verify', label: 'Verifying Data Integrity...', icon: '🛡️' },
    { id: 'optimize', label: 'Optimizing Results...', icon: '✨' },
];

interface ThinkingProcessProps {
    isAnalyzing: boolean;
    onComplete?: () => void;
}

export default function ThinkingProcess({ isAnalyzing, onComplete }: ThinkingProcessProps) {
    const [currentStepIndex, setCurrentStepIndex] = useState(-1);
    const [statuses, setStatuses] = useState<StepStatus[]>(
        STEPS.map(() => 'waiting')
    );

    useEffect(() => {
        injectGlobalAnimations();
    }, []);

    useEffect(() => {
        if (!isAnalyzing) {
            setStatuses(STEPS.map(() => 'waiting'));
            setCurrentStepIndex(-1);
            return;
        }

        let step = 0;
        setCurrentStepIndex(0);

        // Simulate thinking process
        const interval = setInterval(() => {
            setStatuses(prev => {
                const next = [...prev];
                if (step > 0) next[step - 1] = 'completed';
                if (step < STEPS.length) next[step] = 'processing';
                return next;
            });

            step++;

            if (step > STEPS.length) {
                clearInterval(interval);
                if (onComplete) onComplete();
            } else {
                setCurrentStepIndex(step);
            }
        }, 800); // 0.8s per step

        return () => clearInterval(interval);
    }, [isAnalyzing, onComplete]);

    if (!isAnalyzing && currentStepIndex === -1) return null;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <div style={styles.spinner} />
                <span style={styles.title}>LooPyck AI Agent is thinking...</span>
            </div>

            <div style={styles.stepsContainer}>
                {STEPS.map((step, index) => (
                    <div key={step.id} style={styles.stepItem}>
                        <StatusIcon status={statuses[index]} icon={step.icon} />
                        <span
                            style={{
                                ...styles.stepLabel,
                                opacity: statuses[index] === 'waiting' ? 0.4 : 1,
                                fontWeight: statuses[index] === 'processing' ? 600 : 400,
                                color: statuses[index] === 'processing' ? '#3b82f6' :
                                    statuses[index] === 'completed' ? '#10b981' : '#e2e8f0'
                            }}
                        >
                            {step.label}
                        </span>
                        {statuses[index] === 'processing' && (
                            <div style={styles.shimmerWrapper}>
                                <div style={styles.shimmer} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatusIcon({ status, icon }: { status: StepStatus; icon: string }) {
    if (status === 'completed') return <span style={styles.checkIcon}>✅</span>;
    if (status === 'processing') return <span style={styles.pulseIcon}>{icon}</span>;
    return <span style={styles.waitIcon}>{icon}</span>;
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: 16,
        padding: 24,
        border: '1px solid #334155',
        maxWidth: 400,
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.5)',
        animation: 'fadeIn 0.3s ease-out',
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
        paddingBottom: 16,
        borderBottom: '1px solid #334155',
    },
    spinner: {
        width: 20,
        height: 20,
        border: '2px solid #3b82f6',
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite', // Add spin keyframe globally or inline style if needed
    },
    title: {
        fontSize: 16,
        fontWeight: 600,
        color: '#f8fafc',
    },
    stepsContainer: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    stepItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    stepLabel: {
        fontSize: 14,
        transition: 'all 0.3s ease',
    },
    checkIcon: { fontSize: 16 },
    pulseIcon: {
        fontSize: 16,
        animation: 'pulse 1.5s infinite ease-in-out',
    },
    waitIcon: {
        fontSize: 16,
        opacity: 0.4,
        filter: 'grayscale(100%)',
    },
    shimmerWrapper: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
    },
    shimmer: {
        width: '50%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
        animation: 'shimmer 1.5s infinite linear',
    },
};
