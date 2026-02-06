'use client';

/**
 * FashionBot - Slide-in 채팅 UI
 * 스타일 질문 → 추천 상품 카드 연동
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { DesignTokens } from '@/styles/designTokens';
import {
    parseStyleQuestion,
    generateResponse,
    generateMessageId,
    type ChatMessage,
    type RecommendedItem,
} from '@/lib/ai/chatAdvisor';
import { analytics_api } from '@/lib/analytics';

// 스타일
const styles = {
    // 플로팅 버튼
    floatingButton: {
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: DesignTokens.colors.accent,
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
        boxShadow: '0 4px 16px rgba(59, 130, 246, 0.4)',
        transition: `transform ${DesignTokens.animation.duration} ${DesignTokens.animation.curve}`,
        zIndex: 1000,
    } as React.CSSProperties,

    // 채팅 패널
    panel: {
        position: 'fixed',
        bottom: '96px',
        right: '24px',
        width: '360px',
        maxHeight: '520px',
        backgroundColor: 'white',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 1000,
        transform: 'translateY(20px)',
        opacity: 0,
        transition: `transform ${DesignTokens.animation.duration} ${DesignTokens.animation.curve}, opacity ${DesignTokens.animation.duration} ${DesignTokens.animation.curve}`,
    } as React.CSSProperties,

    panelOpen: {
        transform: 'translateY(0)',
        opacity: 1,
    } as React.CSSProperties,

    // 헤더
    header: {
        padding: '16px',
        backgroundColor: DesignTokens.colors.accent,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    } as React.CSSProperties,

    headerTitle: {
        fontSize: '16px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    } as React.CSSProperties,

    closeButton: {
        background: 'none',
        border: 'none',
        color: 'white',
        fontSize: '20px',
        cursor: 'pointer',
        padding: '4px',
    } as React.CSSProperties,

    // 메시지 영역
    messages: {
        flex: 1,
        overflowY: 'auto',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    } as React.CSSProperties,

    // 메시지 버블
    messageBubble: {
        maxWidth: '85%',
        padding: '10px 14px',
        borderRadius: '16px',
        fontSize: '14px',
        lineHeight: 1.5,
    } as React.CSSProperties,

    userMessage: {
        alignSelf: 'flex-end',
        backgroundColor: DesignTokens.colors.accent,
        color: 'white',
        borderBottomRightRadius: '4px',
    } as React.CSSProperties,

    botMessage: {
        alignSelf: 'flex-start',
        backgroundColor: '#f1f3f5',
        color: DesignTokens.colors.primary,
        borderBottomLeftRadius: '4px',
    } as React.CSSProperties,

    // 추천 카드
    recommendationCard: {
        display: 'flex',
        gap: '10px',
        padding: '10px',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: `1px solid ${DesignTokens.colors.border}`,
        cursor: 'pointer',
        marginTop: '8px',
        transition: `transform ${DesignTokens.animation.duration} ${DesignTokens.animation.curve}`,
    } as React.CSSProperties,

    cardImage: {
        width: '60px',
        height: '60px',
        borderRadius: '8px',
        backgroundColor: '#f5f5f5',
        objectFit: 'cover',
    } as React.CSSProperties,

    cardInfo: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: '4px',
    } as React.CSSProperties,

    cardName: {
        fontSize: '13px',
        fontWeight: 500,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    } as React.CSSProperties,

    cardPrice: {
        fontSize: '14px',
        fontWeight: 700,
        color: DesignTokens.colors.accent,
    } as React.CSSProperties,

    cardScore: {
        fontSize: '11px',
        color: '#22c55e',
        fontWeight: 600,
    } as React.CSSProperties,

    // 입력 영역
    inputArea: {
        padding: '12px 16px',
        borderTop: `1px solid ${DesignTokens.colors.border}`,
        display: 'flex',
        gap: '8px',
    } as React.CSSProperties,

    input: {
        flex: 1,
        padding: '10px 14px',
        borderRadius: '20px',
        border: `1px solid ${DesignTokens.colors.border}`,
        fontSize: '14px',
        outline: 'none',
        transition: `border-color ${DesignTokens.animation.duration}`,
    } as React.CSSProperties,

    sendButton: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: DesignTokens.colors.accent,
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        transition: `transform ${DesignTokens.animation.duration}`,
    } as React.CSSProperties,

    // 퀵 액션
    quickActions: {
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap',
        padding: '8px 16px',
        borderTop: `1px solid ${DesignTokens.colors.border}`,
    } as React.CSSProperties,

    quickButton: {
        padding: '6px 12px',
        borderRadius: '16px',
        border: `1px solid ${DesignTokens.colors.border}`,
        backgroundColor: 'white',
        fontSize: '12px',
        cursor: 'pointer',
        transition: `all ${DesignTokens.animation.duration}`,
    } as React.CSSProperties,
};

// 가격 포맷
function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

// 샘플 상품 (데모용)
const SAMPLE_PRODUCTS: RecommendedItem[] = [
    { id: '1', name: '울 슬림핏 슬랙스', price: 89000, matchScore: 95, mall: '무신사' },
    { id: '2', name: '캐시미어 테이퍼드 팬츠', price: 120000, matchScore: 88, mall: '29cm' },
    { id: '3', name: '울 블렌드 스트레이트 팬츠', price: 75000, matchScore: 82, mall: 'SSF' },
];

// 퀵 액션
const QUICK_ACTIONS = [
    '오버사이즈 니트 추천',
    '데님 자켓 3만원대',
    '코튼 셔츠 캐주얼',
];

export default function FashionBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            role: 'assistant',
            content: '안녕하세요! 👋 스타일에 맞는 상품을 찾아드릴게요.\n\n예: "울 소재의 슬림핏 팬츠 추천해줘"',
            timestamp: new Date(),
        },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // 자동 스크롤
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // 채팅 열기 트래킹
    const handleOpen = () => {
        setIsOpen(true);
        analytics_api.chatOpen();
    };

    // 메시지 전송
    const handleSend = useCallback(async (text?: string) => {
        const query = text || input.trim();
        if (!query) return;

        const startTime = Date.now();

        // 사용자 메시지 추가
        const userMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'user',
            content: query,
            timestamp: new Date(),
        };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsTyping(true);

        // 스타일 벡터 추출
        const styleVector = parseStyleQuestion(query);

        // 시뮬레이션된 추천 (실제로는 API 호출)
        await new Promise(resolve => setTimeout(resolve, 800));

        // 필터링된 추천
        const recommendations = SAMPLE_PRODUCTS.filter(p => {
            // 간단한 시뮬레이션
            return p.matchScore > 70;
        });

        // 응답 생성
        const responseText = generateResponse(styleVector, recommendations);

        const botMessage: ChatMessage = {
            id: generateMessageId(),
            role: 'assistant',
            content: responseText,
            timestamp: new Date(),
            styleVector,
            recommendations,
        };

        setMessages(prev => [...prev, botMessage]);
        setIsTyping(false);

        // 분석 트래킹
        const queryType = styleVector.material ? 'material' :
            styleVector.silhouette ? 'silhouette' : 'general';
        analytics_api.chatMessage(queryType, Date.now() - startTime);
    }, [input]);

    // 엔터 키 처리
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 추천 클릭
    const handleRecommendationClick = (item: RecommendedItem, index: number) => {
        analytics_api.recommendationClick(item.matchScore, index, item.mall);
        // 실제로는 상품 페이지로 이동
        window.open(item.url || '#', '_blank');
    };

    return (
        <>
            {/* 플로팅 버튼 */}
            <button
                style={{
                    ...styles.floatingButton,
                    transform: isOpen ? 'scale(0)' : 'scale(1)',
                }}
                onClick={handleOpen}
                aria-label="채팅 열기"
            >
                💬
            </button>

            {/* 채팅 패널 */}
            <div
                style={{
                    ...styles.panel,
                    ...(isOpen ? styles.panelOpen : {}),
                    visibility: isOpen ? 'visible' : 'hidden',
                }}
            >
                {/* 헤더 */}
                <div style={styles.header}>
                    <span style={styles.headerTitle}>
                        <span>✨</span>
                        <span>스타일 어드바이저</span>
                    </span>
                    <button
                        style={styles.closeButton}
                        onClick={() => setIsOpen(false)}
                        aria-label="닫기"
                    >
                        ✕
                    </button>
                </div>

                {/* 메시지 영역 */}
                <div style={styles.messages as React.CSSProperties}>
                    {messages.map((msg) => (
                        <div key={msg.id}>
                            <div
                                style={{
                                    ...styles.messageBubble,
                                    ...(msg.role === 'user' ? styles.userMessage : styles.botMessage),
                                }}
                            >
                                {msg.content}
                            </div>

                            {/* 추천 상품 카드 */}
                            {msg.recommendations?.slice(0, 3).map((item, idx) => (
                                <div
                                    key={item.id}
                                    style={styles.recommendationCard}
                                    onClick={() => handleRecommendationClick(item, idx)}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
                                    }}
                                >
                                    <div style={styles.cardImage as React.CSSProperties}>
                                        {item.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={item.imageUrl} alt={item.name} style={styles.cardImage as React.CSSProperties} />
                                        ) : (
                                            <div style={{
                                                width: '100%',
                                                height: '100%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '20px',
                                            }}>
                                                👕
                                            </div>
                                        )}
                                    </div>
                                    <div style={styles.cardInfo as React.CSSProperties}>
                                        <span style={styles.cardName as React.CSSProperties}>{item.name}</span>
                                        <span style={styles.cardPrice}>{formatPrice(item.price)}</span>
                                        <span style={styles.cardScore}>매칭 {item.matchScore}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* 타이핑 인디케이터 */}
                    {isTyping && (
                        <div style={{ ...styles.messageBubble, ...styles.botMessage }}>
                            <span style={{ animation: 'pulse 1s infinite' }}>생각 중...</span>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* 퀵 액션 */}
                <div style={styles.quickActions as React.CSSProperties}>
                    {QUICK_ACTIONS.map((action) => (
                        <button
                            key={action}
                            style={styles.quickButton}
                            onClick={() => handleSend(action)}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = DesignTokens.colors.accent;
                                (e.currentTarget as HTMLButtonElement).style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'white';
                                (e.currentTarget as HTMLButtonElement).style.color = 'inherit';
                            }}
                        >
                            {action}
                        </button>
                    ))}
                </div>

                {/* 입력 영역 */}
                <div style={styles.inputArea}>
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="스타일 질문을 입력하세요..."
                        style={styles.input}
                    />
                    <button
                        style={styles.sendButton}
                        onClick={() => handleSend()}
                        onMouseEnter={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                        }}
                        onMouseLeave={(e) => {
                            (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                        }}
                    >
                        ↑
                    </button>
                </div>
            </div>

            <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
        </>
    );
}
