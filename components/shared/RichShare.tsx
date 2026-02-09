'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/lib/ux/hapticEngine';

interface RichShareProps {
    productTitle: string;
    productImage: string;
    currentPrice: number;
}

export default function RichShare({ productTitle, productImage, currentPrice }: RichShareProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

    const handleOpen = () => {
        haptics.trigger('medium');
        setIsOpen(true);
    };

    const handleCopyLink = () => {
        haptics.trigger('success');
        setIsCopied(true);
        navigator.clipboard.writeText(window.location.href); // In real app, this would be the product link
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="flex-1 py-4 bg-gray-100 text-black font-bold rounded-xl hover:bg-gray-200 transition-colors"
            >
                Share Asset 📤
            </button>

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ scale: 0.9, y: 50 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 50 }}
                            className="relative bg-white w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl"
                        >
                            {/* The "Stock Card" Visual */}
                            <div className="bg-black text-white p-6 relative overflow-hidden">
                                {/* Decorative Graph Lines */}
                                <svg className="absolute bottom-0 left-0 w-full h-32 opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
                                    <path d="M0,80 C20,70 40,90 60,60 S80,40 100,50 L100,100 L0,100 Z" fill="white" />
                                </svg>

                                <div className="relative z-10 flex justify-between items-start mb-4">
                                    <span className="font-bold tracking-widest text-xs border border-white/30 px-2 py-1 rounded">LOOPYCK ASSET</span>
                                    <span className="text-green-400 font-mono text-xs">▲ STRONG BUY</span>
                                </div>

                                <div className="flex gap-4 items-center">
                                    <img src={productImage} alt="Asset" className="w-20 h-20 rounded-lg object-cover border-2 border-white/20 bg-gray-800" />
                                    <div>
                                        <h3 className="font-bold text-lg leading-tight line-clamp-2">{productTitle}</h3>
                                        <div className="text-2xl font-black mt-1">₩{currentPrice.toLocaleString()}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="p-6 bg-white">
                                <p className="text-center text-gray-500 text-sm mb-6">
                                    Share this asset card with your network.
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleCopyLink}
                                        className={`flex-1 py-3 rounded-xl font-bold transition-all ${isCopied ? 'bg-green-500 text-white' : 'bg-black text-white'}`}
                                    >
                                        {isCopied ? 'Copied! ✅' : 'Copy Link 🔗'}
                                    </button>
                                    <button
                                        onClick={() => setIsOpen(false)}
                                        className="py-3 px-6 bg-gray-100 rounded-xl font-bold hover:bg-gray-200"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}
