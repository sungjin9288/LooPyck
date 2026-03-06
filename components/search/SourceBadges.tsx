import React from 'react';
import { getSourceMetadata } from '@/lib/api/sourceCatalog';
import { isProductSource } from '@/lib/api/types';

interface SourceBadgeProps {
    source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
    const resolvedSource = isProductSource(source) ? source : 'NAVER';
    const metadata = getSourceMetadata(resolvedSource);
    const label = isProductSource(source)
        ? metadata.badgeLabel
        : source.trim().slice(0, 8).toUpperCase() || 'SHOP';

    return (
        <span style={{
            backgroundColor: metadata.badgeBg,
            color: metadata.badgeColor,
            fontSize: '9px',
            fontWeight: 800,
            padding: '2px 5px',
            borderRadius: '4px',
            display: 'inline-block',
            letterSpacing: '0.5px',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}>
            {label}
        </span>
    );
}
