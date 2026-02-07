'use client';

/**
 * Mobile Navigation
 * 엄지손가락 친화적 하단 내비게이션 바 (Thumb-friendly)
 */

import React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { designTokens } from '@/styles/designTokens';
import { haptics } from '@/lib/ux/hapticFeedback';

interface NavItem {
    id: string;
    label: string;
    icon: string;
    path: string;
}

const NAV_ITEMS: NavItem[] = [
    { id: 'home', label: 'Home', icon: '🏠', path: '/' },
    { id: 'search', label: 'Search', icon: '🔍', path: '/search' },
    { id: 'assistant', label: 'AI Agent', icon: '✨', path: '/agent' },
    { id: 'my', label: 'My', icon: '👤', path: '/profile' },
];

export default function MobileNavigation() {
    const router = useRouter();
    const pathname = usePathname();

    const handleNavClick = (path: string) => {
        // Haptic feedback
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
            try {
                navigator.vibrate(5);
            } catch (e) { }
        }
        router.push(path);
    };

    return (
        <nav style={styles.container}>
            <div style={styles.bar}>
                {NAV_ITEMS.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleNavClick(item.path)}
                            style={styles.item}
                        >
                            <div
                                style={{
                                    ...styles.iconWrapper,
                                    color: isActive ? designTokens.colors.primary : designTokens.colors.textSecondary,
                                    transform: isActive ? 'scale(1.1)' : 'scale(1)',
                                }}
                            >
                                <span style={styles.icon}>{item.icon}</span>
                                {isActive && <div style={styles.activeDot} />}
                            </div>
                            <span
                                style={{
                                    ...styles.label,
                                    color: isActive ? designTokens.colors.textPrimary : designTokens.colors.textSecondary,
                                    fontWeight: isActive ? 600 : 400,
                                }}
                            >
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: designTokens.zIndex.appBar,
        paddingBottom: 'env(safe-area-inset-bottom)', // safe area for iPhone X+
        backgroundColor: 'rgba(15, 23, 42, 0.95)', // Slate 900 + Blur
        backdropFilter: 'blur(12px)',
        borderTop: `1px solid ${designTokens.colors.border}`,
    },
    bar: {
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: '60px',
    },
    item: {
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: 0,
        transition: 'all 0.2s ease',
    },
    iconWrapper: {
        position: 'relative',
        fontSize: '24px',
        marginBottom: '2px',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
    },
    icon: {
        display: 'block',
        lineHeight: 1,
    },
    activeDot: {
        position: 'absolute',
        bottom: -4,
        width: 4,
        height: 4,
        borderRadius: '50%',
        backgroundColor: designTokens.colors.primary,
    },
    label: {
        fontSize: '10px',
        lineHeight: '1.2',
        transition: 'color 0.2s ease, font-weight 0.2s ease',
    },
};
