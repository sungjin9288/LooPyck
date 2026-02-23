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

const COPY: Record<ChatLocale, { title: string; welcome: string; placeholder: string; networkError: string; defaultError: string }> = {
    ko: {
        title: 'AI 스타일리스트',
        welcome: '안녕하세요! AI 패션 스타일리스트입니다 ✨\n원하는 스타일이나 아이템을 편하게 물어보세요.',
        placeholder: '예: 올드머니룩 추천해줘, 키 큰 남자 코디',
        networkError: '네트워크 오류가 발생했습니다.',
        defaultError: '오류가 발생했습니다.',
    },
    en: {
        title: 'AI Stylist',
        welcome: "Hi! I'm your AI Fashion Stylist ✨\nTell me what look you're going for!",
        placeholder: 'e.g. old money look, tall guy outfit ideas',
        networkError: 'A network error occurred.',
        defaultError: 'Something went wrong.',
    },
};

const QUICK_PROMPTS: Record<ChatLocale, string[]> = {
    ko: ['올드머니룩 추천', '봄 코디 알려줘', '데이트룩 뭐 입어?', '캐주얼 출근룩'],
    en: ['Old money outfit', 'Spring outfit ideas', 'Date look suggestions', 'Business casual fit'],
};

const DUPLICATE_SEND_WINDOW_MS = 1_200;

function dedupeKeywords(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return Array.from(
        new Set(
            value
                .map((keyword) => (typeof keyword === 'string' ? keyword.trim() : ''))
                .filter((keyword) => keyword.length > 0)
        )
    ).slice(0, 3);
}

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('file_read_failed'));
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('invalid_file_result'));
        };
        reader.readAsDataURL(file);
    });
}

export default function StyleChat({ onSearch }: StyleChatProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [locale, setLocale] = useState<ChatLocale>('ko');
    const [messages, setMessages] = useState<ChatMessage[]>([
        { text: COPY.ko.welcome, isBot: true },
    ]);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [history, setHistory] = useState<Array<{ role: 'user' | 'model'; text: string }>>([]);
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const sendLockRef = useRef(false);
    const composingRef = useRef(false);
    const lastSentRef = useRef<{ text: string; at: number } | null>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const handleSend = useCallback(async (rawText?: string) => {
        const query = (rawText ?? input).trim();
        if (!query || sendLockRef.current || isTyping || isUploading) return;

        const now = Date.now();
        const lastSent = lastSentRef.current;
        if (lastSent && lastSent.text === query && now - lastSent.at < DUPLICATE_SEND_WINDOW_MS) {
            return;
        }
        lastSentRef.current = { text: query, at: now };

        sendLockRef.current = true;
        setIsTyping(true);
        setInput('');
        setMessages((prev) => [...prev, { text: query, isBot: false }]);

        try {
            const res = await fetch('/api/ai-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: query, history, locale }),
            });

            const data = await res.json().catch(() => ({} as Record<string, unknown>));

            if (!res.ok) {
                const errorText = typeof data.error === 'string' ? data.error : COPY[locale].defaultError;
                setMessages((prev) => [...prev, { text: errorText, isBot: true }]);
                return;
            }

            const replyText = typeof data.text === 'string' ? data.text.trim() : '';
            const replyKeywords = dedupeKeywords(data.searchKeywords);
            if (!replyText) {
                setMessages((prev) => [...prev, { text: COPY[locale].defaultError, isBot: true }]);
                return;
            }

            setMessages((prev) => [
                ...prev,
                {
                    text: replyText,
                    isBot: true,
                    searchKeywords: replyKeywords,
                },
            ]);

            setHistory((prev) => [
                ...prev,
                { role: 'user', text: query },
                { role: 'model', text: JSON.stringify({ text: replyText, searchKeywords: replyKeywords }) },
            ]);
        } catch {
            setMessages((prev) => [...prev, { text: COPY[locale].networkError, isBot: true }]);
        } finally {
            setIsTyping(false);
            sendLockRef.current = false;
        }
    }, [history, input, isTyping, isUploading, locale]);

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 4 * 1024 * 1024) {
            alert('이미지는 4MB 이하여야 합니다.');
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsUploading(true);
        setMessages((prev) => [...prev, { text: '📷 이미지 전송 완료. 분석 중...', isBot: false }]);

        try {
            const dataUrl = await readFileAsDataUrl(file);
            const imageBase64 = dataUrl.split(',')[1] || '';
            if (!imageBase64) {
                throw new Error('invalid_image_data');
            }

            const res = await fetch('/api/ai-vision', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageBase64, mimeType: file.type }),
            });

            const data = await res.json().catch(() => ({} as Record<string, unknown>));

            if (!res.ok) {
                const errorText = typeof data.error === 'string' ? data.error : '이미지 분석에 실패했습니다.';
                setMessages((prev) => [...prev.slice(0, -1), { text: errorText, isBot: true }]);
                return;
            }

            const description = typeof data.description === 'string'
                ? data.description
                : '이미지를 분석했습니다. 아래 키워드로 검색해보세요!';
            const keywords = dedupeKeywords(data.searchKeywords);

            setMessages((prev) => [
                ...prev.slice(0, -1),
                {
                    text: description,
                    isBot: true,
                    searchKeywords: keywords,
                },
            ]);

            setHistory((prev) => [
                ...prev,
                { role: 'user', text: '[이미지 분석 요청]' },
                { role: 'model', text: JSON.stringify({ description, searchKeywords: keywords }) },
            ]);
        } catch {
            setMessages((prev) => [...prev.slice(0, -1), { text: '오류가 발생했습니다.', isBot: true }]);
        } finally {
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

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        if (composingRef.current) return;
        void handleSend();
    };

    const toggleLocale = () => {
        setLocale((prev) => (prev === 'ko' ? 'en' : 'ko'));
    };

    return (
        <>
            <motion.button
                onClick={() => setIsOpen(true)}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                className={`fixed bottom-6 right-6 z-[8000] w-14 h-14 bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all ${isOpen ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
            >
                <span className="text-2xl">✨</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 60, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 60, scale: 0.9 }}
                        transition={{ type: 'spring', damping: 26, stiffness: 300 }}
                        className="fixed bottom-6 right-6 z-[8001] w-[360px] h-[560px] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col overflow-hidden"
                    >
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

                        <div className="flex gap-2 px-3 py-2 overflow-x-auto flex-shrink-0 border-b border-slate-100 bg-slate-50 scrollbar-none">
                            {QUICK_PROMPTS[locale].map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => void handleSend(prompt)}
                                    disabled={isTyping || isUploading}
                                    className="flex-shrink-0 text-[11px] px-2.5 py-1 bg-white border border-slate-200 rounded-full text-slate-600 hover:border-violet-400 hover:text-violet-700 transition-all disabled:opacity-50"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>

                        <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                    <div className="max-w-[85%] space-y-2">
                                        <div
                                            className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.isBot
                                                ? 'bg-slate-100 text-slate-800 rounded-tl-none'
                                                : 'bg-gradient-to-br from-violet-600 to-indigo-700 text-white rounded-tr-none'
                                                }`}
                                        >
                                            {msg.text}
                                        </div>

                                        {msg.isBot && msg.searchKeywords && msg.searchKeywords.length > 0 && onSearch && (
                                            <div className="flex flex-wrap gap-1.5 pl-1">
                                                {msg.searchKeywords.map((keyword) => (
                                                    <button
                                                        key={keyword}
                                                        onClick={() => handleSearchKeyword(keyword)}
                                                        className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-violet-50 border border-violet-200 text-violet-700 rounded-full hover:bg-violet-100 transition-all font-medium"
                                                    >
                                                        <span>🔍</span>
                                                        {keyword}
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
                                            {[0, 1, 2].map((index) => (
                                                <motion.div
                                                    key={index}
                                                    className="w-2 h-2 bg-slate-400 rounded-full"
                                                    animate={{ y: [0, -6, 0] }}
                                                    transition={{ repeat: Infinity, duration: 0.8, delay: index * 0.15 }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

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
                                onChange={(event) => setInput(event.target.value)}
                                onCompositionStart={() => {
                                    composingRef.current = true;
                                }}
                                onCompositionEnd={() => {
                                    composingRef.current = false;
                                }}
                                onKeyDown={(event) => {
                                    if (event.key !== 'Enter') return;
                                    event.preventDefault();
                                    if (composingRef.current) return;
                                    void handleSend();
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
