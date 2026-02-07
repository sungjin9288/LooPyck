import React, { useEffect, useRef } from 'react';
import { useMultiSourceSearch } from '@/hooks/useMultiSourceSearch';
import { ScanningEffect } from '@/components/agent/ScanningEffect';
import { UnifiedProduct } from '@/lib/api/realtimeAggregator';
import { analyzeMood, applyTheme } from '@/lib/ux/themeAdapter';
import { designTokens } from '@/styles/designTokens';
import { SourceBadge } from '@/components/search/SourceBadges';
import FutureValueInsight from '@/components/product/FutureValueInsight'; // Phase 20 AI Component

interface InfiniteProductGridProps {
    query: string;
}

export default function InfiniteProductGrid({ query }: InfiniteProductGridProps) {
    const {
        products,
        isLoading,
        hasMore,
        loadMore,
        isScanning,
        sources
    } = useMultiSourceSearch(query);

    const observerTarget = useRef<HTMLDivElement>(null);

    // 1. Intersection Observer for Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore && !isLoading) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        if (observerTarget.current) {
            observer.observe(observerTarget.current);
        }

        return () => observer.disconnect();
    }, [hasMore, isLoading, loadMore]);

    // 2. Adaptive Theme Application
    useEffect(() => {
        if (query) {
            const mood = analyzeMood(query);
            applyTheme(mood);
        }
    }, [query]);

    if (!query) return null;

    return (
        <div style={styles.container}>
            <ScanningEffect isActive={isScanning} sources={sources.length > 0 ? sources : undefined} />

            {/* Total Count Badge */}
            <div style={styles.statsBar}>
                <span style={styles.statsText}>
                    검색 결과: <span style={{ color: designTokens.colors.primary }}>{products.length.toLocaleString()}</span>개 상품 (실시간)
                </span>
                <div style={styles.sourceTags}>
                    {sources.map(s => <SourceBadge key={s} source={s} />)}
                </div>
            </div>

            {/* Phase 20: AI Analytics Dashboard for Top Item */}
            {products.length > 0 && (
                <div className="mb-8">
                    <FutureValueInsight product={products[0]} />
                </div>
            )}

            <div style={styles.grid}>
                {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>

            {/* Loading Indicator */}
            <div ref={observerTarget} style={styles.loadingSentinel}>
                {isLoading && !isScanning && (
                    <div style={styles.loadingText}>실시간 데이터 수집 중...</div>
                )}
            </div>

            {!hasMore && products.length > 0 && (
                <div style={styles.endMessage}>모든 실시간 데이터를 불러왔습니다.</div>
            )}

            {!isLoading && products.length === 0 && (
                <div style={styles.endMessage}>검색 결과가 없습니다. (외부 소스 응답 지연 가능성)</div>
            )}
        </div>
    );
}

function ProductCard({ product }: { product: UnifiedProduct }) {
    return (
        <div style={styles.card}>
            <div style={styles.imageContainer}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.image} alt={product.title} style={styles.image} loading="lazy" />
                <div style={styles.badgeContainer}>
                    <SourceBadge source={product.source} />
                </div>
            </div>
            <div style={styles.info}>
                <div style={styles.mallName}>{product.mallName}</div>
                <div style={styles.title} title={product.title}>{product.title}</div>
                <div style={styles.price}>{product.price.toLocaleString()}원</div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        width: '100%',
        padding: '20px',
        minHeight: '400px',
        position: 'relative' as const,
    },
    statsBar: {
        marginBottom: '16px',
        fontSize: '14px',
        color: designTokens.colors.textSecondary,
        display: 'flex' as const,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statsText: {
        fontWeight: 600,
    },
    sourceTags: {
        display: 'flex',
        gap: '4px',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: '16px',
    },
    loadingSentinel: {
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: '20px',
    },
    loadingText: {
        color: designTokens.colors.textSecondary,
        fontSize: '14px',
    },
    endMessage: {
        textAlign: 'center' as const,
        padding: '40px',
        color: designTokens.colors.textSecondary,
        fontSize: '14px',
    },
    // Card Styles
    card: {
        backgroundColor: designTokens.colors.surface,
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${designTokens.colors.border}`,
        transition: 'transform 0.2s',
        cursor: 'pointer',
    },
    imageContainer: {
        position: 'relative' as const,
        aspectRatio: '1',
        backgroundColor: '#f1f5f9',
    },
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover' as const,
    },
    badgeContainer: {
        position: 'absolute' as const,
        top: '8px',
        right: '8px',
    },
    info: {
        padding: '12px',
    },
    mallName: {
        fontSize: '11px',
        color: designTokens.colors.textTertiary,
        marginBottom: '2px',
    },
    title: {
        fontSize: '13px',
        fontWeight: 500,
        color: designTokens.colors.textPrimary,
        marginBottom: '4px',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as const,
        overflow: 'hidden',
        height: '32px', // Approx 2 lines
    },
    price: {
        fontSize: '15px',
        fontWeight: 700,
        color: designTokens.colors.primary,
    },
};
