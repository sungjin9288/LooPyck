'use client';

/**
 * StyleMatchGrid - 스타일 매칭 추천 상품 가로 스크롤 UI
 * designTokens 애니메이션 적용
 */

import { useState, useRef, useEffect } from 'react';
import { designTokens } from '@/styles/designTokens';
import { getMatchLevel, getMatchMessage } from '@/lib/ai/recommendationEngine';

// 추천 상품 타입
interface RecommendedProduct {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    matchScore: number; // 0-100
    mall: string;
    url?: string;
}

interface StyleMatchGridProps {
    products: RecommendedProduct[];
    loading?: boolean;
    title?: string;
    onProductClick?: (product: RecommendedProduct) => void;
}

// 스타일
const styles = {
    container: {
        width: '100%',
        overflow: 'hidden',
        padding: `${designTokens.spacing.md} 0`,
    } as React.CSSProperties,
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: designTokens.spacing.md,
        padding: `0 ${designTokens.spacing.md}`,
    } as React.CSSProperties,
    title: {
        fontSize: '18px',
        fontWeight: 700,
        color: designTokens.colors.primary,
    } as React.CSSProperties,
    scrollContainer: {
        display: 'flex',
        gap: designTokens.spacing.md,
        overflowX: 'auto',
        scrollBehavior: 'smooth',
        paddingLeft: designTokens.spacing.md,
        paddingRight: designTokens.spacing.md,
        paddingBottom: designTokens.spacing.sm,
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
    } as React.CSSProperties,
    card: {
        flexShrink: 0,
        width: '160px',
        backgroundColor: '#fff', // surface.light -> #fff
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${designTokens.colors.border}`,
        cursor: 'pointer',
        transition: `transform 0.3s ease, box-shadow 0.3s ease`, // animation tokens -> hardcoded
    } as React.CSSProperties,
    cardHover: {
        transform: 'scale(1.02)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
    } as React.CSSProperties,
    imageContainer: {
        width: '100%',
        height: '160px',
        backgroundColor: '#f5f5f5',
        position: 'relative',
    } as React.CSSProperties,
    image: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    } as React.CSSProperties,
    matchBadge: {
        position: 'absolute',
        top: '8px',
        right: '8px',
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: 600,
    } as React.CSSProperties,
    content: {
        padding: designTokens.spacing.sm,
    } as React.CSSProperties,
    productName: {
        fontSize: '13px',
        fontWeight: 500,
        color: designTokens.colors.primary,
        marginBottom: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    } as React.CSSProperties,
    price: {
        fontSize: '14px',
        fontWeight: 700,
        color: designTokens.colors.primary, // accent -> primary
    } as React.CSSProperties,
    mall: {
        fontSize: '11px',
        color: '#888',
        marginTop: '4px',
    } as React.CSSProperties,
    skeleton: {
        backgroundColor: '#e0e0e0',
        borderRadius: '8px',
        animation: 'pulse 1.5s ease-in-out infinite',
    } as React.CSSProperties,
    emptyState: {
        textAlign: 'center',
        padding: designTokens.spacing.xl,
        color: '#888',
    } as React.CSSProperties,
    scrollButton: {
        position: 'absolute',
        top: '50%',
        transform: 'translateY(-50%)',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        backgroundColor: 'white',
        border: `1px solid ${designTokens.colors.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 10,
    } as React.CSSProperties,
};

// 매치 레벨별 색상
function getMatchBadgeStyle(score: number): React.CSSProperties {
    const level = getMatchLevel(score);

    switch (level) {
        case 'perfect':
            return { backgroundColor: '#22c55e', color: 'white' };
        case 'good':
            return { backgroundColor: '#3b82f6', color: 'white' };
        case 'ok':
            return { backgroundColor: '#f59e0b', color: 'white' };
        case 'poor':
            return { backgroundColor: '#e5e5e5', color: '#666' };
    }
}

// 가격 포맷
function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

// 스켈레톤 카드
function SkeletonCard() {
    return (
        <div style={styles.card}>
            <div style={{ ...styles.imageContainer, ...styles.skeleton }} />
            <div style={styles.content}>
                <div style={{ ...styles.skeleton, height: '14px', width: '80%', marginBottom: '8px' }} />
                <div style={{ ...styles.skeleton, height: '16px', width: '60%' }} />
            </div>
        </div>
    );
}

export default function StyleMatchGrid({
    products,
    loading = false,
    title = '스타일 매칭 추천',
    onProductClick
}: StyleMatchGridProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [showScrollButtons, setShowScrollButtons] = useState(false);

    // 스크롤 버튼 표시 여부
    useEffect(() => {
        const container = scrollRef.current;
        if (container) {
            setShowScrollButtons(container.scrollWidth > container.clientWidth);
        }
    }, [products]);

    // 스크롤 함수
    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const scrollAmount = 180; // 카드 너비 + 간격
            scrollRef.current.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth',
            });
        }
    };

    if (loading) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                </div>
                <div style={styles.scrollContainer}>
                    {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div style={styles.container}>
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                </div>
                <div style={styles.emptyState as React.CSSProperties}>
                    <p>아직 추천할 상품이 없어요</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>상품을 찜하면 맞춤 추천을 받을 수 있어요!</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ ...styles.container, position: 'relative' }}>
            <div style={styles.header}>
                <h3 style={styles.title}>{title}</h3>
                <span style={{ fontSize: '12px', color: '#888' }}>
                    {getMatchMessage(products[0]?.matchScore || 50)}
                </span>
            </div>

            {/* 좌우 스크롤 버튼 */}
            {showScrollButtons && (
                <>
                    <button
                        style={{ ...styles.scrollButton, left: '8px' }}
                        onClick={() => scroll('left')}
                        aria-label="Previous"
                    >
                        ←
                    </button>
                    <button
                        style={{ ...styles.scrollButton, right: '8px' }}
                        onClick={() => scroll('right')}
                        aria-label="Next"
                    >
                        →
                    </button>
                </>
            )}

            <div ref={scrollRef} style={styles.scrollContainer}>
                {products.map((product) => (
                    <div
                        key={product.id}
                        style={{
                            ...styles.card,
                            ...(hoveredId === product.id ? styles.cardHover : {}),
                        }}
                        onMouseEnter={() => setHoveredId(product.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => onProductClick?.(product)}
                    >
                        <div style={styles.imageContainer as React.CSSProperties}>
                            {product.imageUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={product.imageUrl}
                                    alt={product.name}
                                    style={styles.image as React.CSSProperties}
                                />
                            ) : (
                                <div style={{
                                    width: '100%',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#999',
                                    fontSize: '12px',
                                }}>
                                    No Image
                                </div>
                            )}
                            <span style={{
                                ...styles.matchBadge as React.CSSProperties,
                                ...getMatchBadgeStyle(product.matchScore),
                            }}>
                                {product.matchScore}%
                            </span>
                        </div>
                        <div style={styles.content}>
                            <p style={styles.productName as React.CSSProperties}>{product.name}</p>
                            <p style={styles.price}>{formatPrice(product.price)}</p>
                            <p style={styles.mall}>{product.mall}</p>
                        </div>
                    </div>
                ))}
            </div>

            <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </div>
    );
}
