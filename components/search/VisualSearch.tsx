'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as mobilenet from '@tensorflow-models/mobilenet';
import '@tensorflow/tfjs-backend-webgl'; // Backend for tfjs

export default function VisualSearch({ onSearch }: { onSearch: (term: string) => void }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [model, setModel] = useState<mobilenet.MobileNet | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Load AI Model on Mount
    useEffect(() => {
        const loadModel = async () => {
            try {
                console.log("Loading MobileNet model...");
                const loadedModel = await mobilenet.load();
                setModel(loadedModel);
                console.log("MobileNet model loaded.");
            } catch (error) {
                console.error("Failed to load AI model:", error);
            }
        };
        loadModel();
    }, []);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !model) {
            if (!model) alert("AI 모델을 로딩 중입니다. 잠시만 기다려 주세요.");
            return;
        }

        setIsAnalyzing(true);

        try {
            // 1. Create HTMLImageElement from file
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            await new Promise((resolve) => (img.onload = resolve));

            // 2. Classify Image
            const predictions = await model.classify(img);
            console.log("AI Predictions:", predictions);

            if (predictions.length > 0) {
                // 3. Use the top prediction as search query
                // MobileNet returns English classes (e.g., "running shoe", "jersey")
                // We use the top result directly for search. Use user's "similar clothes" intent.
                const topResult = predictions[0].className.split(',')[0]; // Take first keyword
                onSearch(topResult);
                alert(`AI가 이미지를 분석했습니다!\n감지된 스타일: ${topResult}\n관련 상품을 검색합니다.`);
            } else {
                alert("이미지에서 알 수 있는 패션 아이템을 찾을 수 없습니다.");
            }
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
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isAnalyzing ? 'animate-pulse bg-blue-50' : ''}`}
                title={model ? "Search by Image (AI Ready)" : "Loading AI..."}
            >
                {isAnalyzing ? (
                    <span className="text-xl animate-spin">⏳</span>
                ) : (
                    <div className="relative">
                        <svg className={`w-5 h-5 ${model ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {model && <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>}
                    </div>
                )}
            </button>
        </div>
    );
}
