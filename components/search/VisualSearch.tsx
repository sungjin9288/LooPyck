'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function VisualSearch({ onSearch }: { onSearch: (term: string) => void }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);

        try {
            // Simulation of AI Vision Analysis
            // In a real scenario, you'd upload 'file' to an API endpoint that calls Gemini Vision
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock Result based on file name or random (since we can't actually see the image client-side in this env)
            // For demo purposes, we'll assume it detects a "Beige Trench Coat"
            const detectedKeywords = ["Beige Trench Coat", "Vintage Denim", "Leather Boots"];
            const bestMatch = detectedKeywords[Math.floor(Math.random() * detectedKeywords.length)];

            onSearch(bestMatch);
        } catch (error) {
            console.error("Visual Search Failed", error);
            alert("이미지 분석에 실패했습니다.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="relative">
            <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isAnalyzing ? 'animate-pulse' : ''}`}
                title="Search by Image"
            >
                {isAnalyzing ? (
                    <span className="text-xl">✨</span>
                ) : (
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                )}
            </button>
        </div>
    );
}
