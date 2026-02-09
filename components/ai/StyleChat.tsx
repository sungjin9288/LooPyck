'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function StyleChat() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<{ text: string; isBot: boolean }[]>([
        { text: "Hello! I'm your personal AI Stylist. How can I help you complete your look today?", isBot: true }
    ]);
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg = input;
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setInput('');

        // Mock AI Response
        setTimeout(() => {
            setMessages(prev => [...prev, {
                text: "That sounds great! For a trendy look, I suggest pairing that with wide-leg denim and minimal sneakers. Would you like to see some options?",
                isBot: true
            }]);
        }, 1000);
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
                                <span className="font-bold">AI Stylist</span>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="opacity-70 hover:opacity-100">✕</button>
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
                        </div>

                        {/* Input */}
                        <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                                placeholder="Ask about styling..."
                                className="flex-1 px-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-1 focus:ring-black"
                            />
                            <button
                                onClick={handleSend}
                                className="p-2 bg-black text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-800"
                            >
                                ↑
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
