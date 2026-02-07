import React from 'react';
import { designTokens } from '@/styles/designTokens';

type SourceType = 'NAVER' | 'MUSINSA' | '29CM' | 'W_CONCEPT' | 'ZIGZAG' | string;

interface SourceBadgeProps {
    source: SourceType;
}

const SOURCE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
    'NAVER': { bg: '#03C75A', color: '#FFFFFF', label: 'N' },
    'MUSINSA': { bg: '#000000', color: '#FFFFFF', label: 'MUSINSA' },
    '29CM': { bg: '#333333', color: '#FFFFFF', label: '29CM' },
    'W_CONCEPT': { bg: '#FA5500', color: '#FFFFFF', label: 'W' },
    'ZIGZAG': { bg: '#FF416C', color: '#FFFFFF', label: 'Z' },
    'DEFAULT': { bg: '#94a3b8', color: '#FFFFFF', label: 'Unknown' },
};

export function SourceBadge({ source }: SourceBadgeProps) {
    const style = SOURCE_STYLES[source] || SOURCE_STYLES['DEFAULT'];

    return (
        <span style={{
            backgroundColor: style.bg,
            color: style.color,
            fontSize: '9px',
            fontWeight: 800,
            padding: '2px 5px',
            borderRadius: '4px',
            display: 'inline-block',
            letterSpacing: '0.5px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
            {style.label}
        </span>
    );
}
