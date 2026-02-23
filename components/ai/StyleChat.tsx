'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ChatLocale = 'ko' | 'en';

interface ChatMessage {
    text: string;
    isBot: boolean;
    searchKeywords?: string[];
}

interface StyleChatProps {
    onSearch?: (keyword: string) => void;
}

const COPY: Record<ChatLocale, { title: string; welcome: string; placeholder: string }> = {
    ko: {
        title: 'AI 스타일리스트',
        welcome: '안녕하세요! AI 패션 스타일리스트입니다 ✨\n원하는 스타일이나 아이템을 편하게 물어보세요.',
        placeholder: '예: 올드머니룩 추천해줘, 키 큰 남자 코디',
    },
    en: {
        title: 'AI Stylist',
        welcome: "Hi! I'm your AI Fashion Stylist ✨\nTell me what look you're going for!",
        placeholder: 'e.g. old money look, tall guy outfit ideas',
    },
};

const QUICK_PROMPTS = ['올드머니룩 추천', '봄 코디 알려줘', '데이트룩 뭐 입어?', '캐주얼 출근룩'];

export default function StyleChat({ onSearch }: StyleChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [locale, setLocale] = useState<ChatLocale>('ko');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { text: COPY.ko.welcome, isBot: true }
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isComposing, setIsComposing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [history, setHistory] = useState<{ role: string; text: string }[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sendLockRef = useRef(false);

    // Auto-scroll
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = useCallback(async (rawText?: string) => {
        const query = (rawText ?? input).trim();
        if (!query || sendLockRef.current || isTyping) return;

        sendLockRef.current = true;
        setIsTyping(true);
        setInput('');

        // Add user message to UI
        setMessages(prev => [...prev, { text: query, isBot: false }]);

        try {
            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query, history }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages(prev => [...prev, { text: data.error || '오류가 발생했습니다.', isBot: true }]);
            } else {
                // Add AI response with keywords
                setMessages(prev => [...prev, {
                    text: data.text,
                    isBot: true,
                    searchKeywords: data.searchKeywords || [],
                }]);

                // Update conversation history for context
                setHistory(prev => [
                    ...prev,
                    { role: 'user', text: query },
                    { role: 'model', text: JSON.stringify({ text: data.text, searchKeywords: data.searchKeywords }) },
                ]);
            }
        } catch {
            setMessages(prev => [...prev, { text: '네트워크 오류가 발생했습니다.', isBot: true }]);
        } finally {
            setIsTyping(false);
            sendLockRef.current = false;
        }
    }, [input, history, isTyping]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            alert('이미지는 4MB 이하여야 합니다.');
            return;
        }

        setIsUploading(true);
        // 사용자 메시지 임시 표시 (이미지 아이콘 등으로 대체 가능)
        setMessages(prev => [...prev, { text: '📷 이미지 전송 완료. 분석 중...', isBot: false }]);

        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const parts = base64.split(',');
                const imageBase64 = parts[1];
                const mimeType = file.type;

                const res = await fetch('/api/ai-vision', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ imageBase64, mimeType })
                });

                const data = await res.json();

                if (!res.ok) {
                    setMessages(prev => [...prev.slice(0, -1), { text: data.error || '이미지 분석에 실패했습니다.', isBot: true }]);
                } else {
                    setMessages(prev => [...prev.slice(0, -1), {
                        text: data.description || '이미지를 분석했습니다. 아래 키워드로 검색해보세요!',
                        isBot: true,
                        searchKeywords: data.searchKeywords || []
                    }]);

                    setHistory(prev => [
                        ...prev,
                        { role: 'user', text: '[이미지 분석 요청]' },
                        { role: 'model', text: JSON.stringify({ description: data.description, searchKeywords: data.searchKeywords }) }
                    ]);
                }
                setIsUploading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setMessages(prev => [...prev.slice(0, -1), { text: '오류가 발생했습니다.', isBot: true }]);
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSearchKeyword = (keyword: string) => {
        if (onSearch) {
            onSearch(keyword);
            setIsOpen(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isComposing) handleSend();
    };

    const toggleLocale = () => {
        const next = locale === 'ko' ? 'en' : 'ko';
        setLocale(next);
    };

    return (
        <>
            {/* FAB */}
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={`fixed bottom-6 right-6 z-[8000] w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <span className="text-2xl">✨</span>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-[8001] w-[360px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 bg-gradient-to-r from-violet-600 to-indigo-700 text-white flex justify-between items-center flex-shrink-0">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="font-bold text-sm">{COPY[locale].title}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleLocale}
                                    className="text-[10px] px-2 py-1 rounded-lg border border-white/30 hover:bg-white/10 transition-colors"
                                >
                                    {locale === 'ko' ? 'EN' : 'KO'}
                                </button>
                                <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100 transition-opacity">✕</button>
                            </div>
                        </div>

                        {/* Quick prompts */}
                        <div className="flex gap-2 px-3 py-2 overflow-x-auto flex-shrink-0 border-b border-slate-100 bg-slate-50 scrollbar-none">
                            {QUICK_PROMPTS.map(q => (
                                <button
                                    key={q}
                                    onClick={() => handleSend(q)}
                                    disabled={isTyping}
                                    className="flex-shrink-0 text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-violet-400 hover:text-violet-700 transition-all disabled:opacity-50"
                                >
                                    {q}
                                </button>
                            ))}
                        </div>

                        {/* Messages */}
                        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                    <div className="max-w-[85%] space-y-2">
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.isBot
                                            ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                                            : 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-none'
                                            }`}>
                                            {msg.text}
                                        </div>

                                        {/* Search keyword buttons */}
                                        {msg.isBot && msg.searchKeywords && msg.searchKeywords.length > 0 && onSearch && (
                                            <div className="flex flex-wrap gap-1.5 pl-1">
                                                {msg.searchKeywords.map(kw => (
                                                    <button
                                                        key={kw}
                                                        onClick={() => handleSearchKeyword(kw)}
                                                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-700 rounded-full hover:bg-violet-100 transition-all font-medium"
                                                    >
                                                        <span>🔍</span>
                                                        {kw}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="px-4 py-3 bg-slate-100 rounded-2xl rounded-tl-none">
                                        <div className="flex gap-1.5">
                                            {[0, 1, 2].map(i => (
                                                <motion.div
                                                    key={i}
                                                    className="w-2 h-2 bg-slate-400 rounded-full"
                                                    animate={{ y: [0, -6, 0] }}
                                                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-100 flex gap-2 flex-shrink-0 items-center">
                            <input
                                type="file"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isTyping || isUploading}
                                className="w-10 h-10 flex-shrink-0 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors disabled:opacity-50"
                                title="이미지로 검색하기"
                            >
                                📷
                            </button>
                            <input
                                type="text"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                onCompositionStart={() => setIsComposing(true)}
                                onCompositionEnd={() => setIsComposing(false)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && isComposing) e.preventDefault();
                                }}
                                placeholder={isUploading ? '이미지 분석 중...' : COPY[locale].placeholder}
                                disabled={isTyping || isUploading}
                                className="flex-1 px-4 py-2 bg-slate-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50 disabled:opacity-60"
                            />
                            <button
                                type="submit"
                                disabled={!input.trim() || isTyping || isUploading}
                                className="w-10 h-10 flex-shrink-0 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-full flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all"
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
