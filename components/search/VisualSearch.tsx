'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MobileNetModel {
    classify: (img: HTMLImageElement) => Promise<Array<{ className: string }>>;
}

export default function VisualSearch({ onSearch }: { onSearch: (term: string) => void }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [model, setModel] = useState<MobileNetModel | null>(null);
    const [isModelLoading, setIsModelLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const modelRef = useRef<MobileNetModel | null>(null);
    const modelLoadPromiseRef = useRef<Promise<MobileNetModel | null> | null>(null);

    const loadModelIfNeeded = async (): Promise<MobileNetModel | null> => {
        if (modelRef.current) return modelRef.current;
        if (modelLoadPromiseRef.current) return modelLoadPromiseRef.current;

        const loadPromise = (async () => {
            setIsModelLoading(true);
            try {
                await import('@tensorflow/tfjs-backend-webgl');
                const mobilenet = await import('@tensorflow-models/mobilenet');
                const loadedModel = await mobilenet.load();
                modelRef.current = loadedModel;
                setModel(loadedModel);
                return loadedModel;
            } catch (error) {
                console.error('Failed to load AI model:', error);
                return null;
            } finally {
                setIsModelLoading(false);
                modelLoadPromiseRef.current = null;
            }
        })();

        modelLoadPromiseRef.current = loadPromise;
        return loadPromise;
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const activeModel = modelRef.current || model;
        if (!activeModel) {
            alert('AI 모델이 아직 준비되지 않았습니다. 다시 시도해주세요.');
            return;
        }

        setIsAnalyzing(true);
        let imageUrl: string | null = null;

        try {
            // 1. Create HTMLImageElement from file
            const img = document.createElement('img');
            imageUrl = URL.createObjectURL(file);
            img.src = imageUrl;
            await new Promise((resolve) => (img.onload = resolve));

            // 2. Classify Image
            const predictions = await activeModel.classify(img);
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
            if (imageUrl) {
                URL.revokeObjectURL(imageUrl);
            }
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        return () => {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        };
    }, []);

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
                onClick={async () => {
                    const loaded = await loadModelIfNeeded();
                    if (!loaded) {
                        alert('AI 모델 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.');
                        return;
                    }
                    fileInputRef.current?.click();
                }}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isAnalyzing ? 'animate-pulse bg-blue-50' : ''}`}
                title={model ? 'Search by Image (AI Ready)' : 'Load AI Model'}
            >
                {isAnalyzing || isModelLoading ? (
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
