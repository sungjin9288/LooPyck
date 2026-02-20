'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ChatLocale = 'ko' | 'en';
type ChatMessage = { text: string; isBot: boolean };

const CHAT_COPY: Record<ChatLocale, {
    title: string;
    welcome: string;
    placeholder: string;
    typing: string;
    mockResponse: string;
}> = {
    ko: {
        title: 'AI 스타일리스트',
        welcome: '안녕하세요! AI 스타일리스트입니다. 원하는 스타일이나 아이템을 편하게 말씀해 주세요.',
        placeholder: '스타일 질문을 입력하세요...',
        typing: '생각 중...',
        mockResponse: '좋아요! 트렌디하게 연출하려면 와이드 데님과 미니멀 스니커즈 조합을 추천드려요. 원하면 비슷한 아이템도 보여드릴게요.',
    },
    en: {
        title: 'AI Stylist',
        welcome: "Hello! I'm your personal AI Stylist. Tell me what look you want and I'll help you style it.",
        placeholder: 'Ask about styling...',
        typing: 'Thinking...',
        mockResponse: 'That sounds great! For a trendy look, I suggest pairing that with wide-leg denim and minimal sneakers. Want me to show options?',
    },
};

export default function StyleChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [chatLocale, setChatLocale] = useState<ChatLocale>('ko');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { text: CHAT_COPY.ko.welcome, isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const replyTimerRef = useRef<number | null>(null);
    const sendLockRef = useRef(false);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    useEffect(() => {
        return () => {
            if (replyTimerRef.current !== null) {
                window.clearTimeout(replyTimerRef.current);
            }
        };
    }, []);

    const handleSend = useCallback((rawText?: string) => {
        const query = (rawText ?? input).trim();
        if (!query || sendLockRef.current) return;

        sendLockRef.current = true;
        setIsTyping(true);

        setMessages(prev => [...prev, { text: query, isBot: false }]);
        setInput('');

        if (replyTimerRef.current !== null) {
            window.clearTimeout(replyTimerRef.current);
        }

        replyTimerRef.current = window.setTimeout(() => {
            setMessages(prev => [...prev, {
                text: CHAT_COPY[chatLocale].mockResponse,
                isBot: true
            }]);
            setIsTyping(false);
            sendLockRef.current = false;
            replyTimerRef.current = null;
        }, 700);
    }, [chatLocale, input]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (isComposing) return;
        handleSend();
    };

    const toggleLocale = () => {
        setChatLocale((prevLocale) => {
            const nextLocale: ChatLocale = prevLocale === 'ko' ? 'en' : 'ko';
            setMessages((prevMessages) => {
                if (prevMessages.length === 1 && prevMessages[0].isBot) {
                    return [{ text: CHAT_COPY[nextLocale].welcome, isBot: true }];
                }
                return prevMessages;
            });
            return nextLocale;
        });
    };

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`fixed bottom-6 right-6 z-[8000] w-14 h-14 bg-black text-white rounded-full shadow-2xl flex items-center justify-center transition-opacity ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <span className="text-2xl">✨</span>
            </motion.button>

            {/* Chat Interface */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 50, scale: 0.9 }}
                        className="fixed bottom-6 right-6 z-[8001] w-[350px] h-[500px] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="p-4 bg-black text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="font-bold">{CHAT_COPY[chatLocale].title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleLocale}
                                    className="text-xs px-2 py-1 rounded border border-white/30 hover:bg-white/10"
                                    aria-label="언어 전환"
                                >
                                    {chatLocale === 'ko' ? 'EN' : 'KO'}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100">✕</button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.isBot ? 'bg-white text-black border border-gray-200 rounded-tl-none' : 'bg-black text-white rounded-tr-none'}`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="max-w-[80%] p-3 rounded-2xl text-sm bg-white text-black border border-gray-200 rounded-tl-none">
                                        {CHAT_COPY[chatLocale].typing}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form className="p-3 bg-white border-t border-gray-100 flex gap-2" onSubmit={handleSubmit}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={() => setIsComposing(false)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && ((e.nativeEvent as KeyboardEvent).isComposing || isComposing)) {
                                        e.preventDefault();
                                    }
                                }}
                                placeholder={CHAT_COPY[chatLocale].placeholder}
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping}
                                className="p-2 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800"
                            >
                                ↑
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
