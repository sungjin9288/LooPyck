'use client';

import React, { useState, useRef, useEffect } from 'react';
import { pushAppNotification } from '@/lib/core/notifications';
import { analyzeFashionQuery } from '@/lib/search/fashionQueryAssistant';

interface MobileNetModel {
    classify: (img: HTMLImageElement) => Promise<Array<{ className: string }>>;
}

const FASHION_LABEL_MAPPINGS: Array<{ keywords: string[]; query: string }> = [
    { keywords: ['sneaker', 'running shoe', 'shoe', 'loafer', 'sandal', 'boot'], query: '스니커즈' },
    { keywords: ['jersey', 'sweatshirt', 'pullover', 'hoodie'], query: '맨투맨' },
    { keywords: ['coat', 'trench coat', 'overcoat'], query: '트렌치코트' },
    { keywords: ['jacket', 'bomber', 'blazer', 'windbreaker'], query: '자켓' },
    { keywords: ['jean', 'denim'], query: '데님 팬츠' },
    { keywords: ['miniskirt', 'skirt'], query: '스커트' },
    { keywords: ['backpack', 'handbag', 'purse', 'wallet'], query: '가방' },
    { keywords: ['kimono', 'cardigan'], query: '가디건' },
    { keywords: ['shirt', 't-shirt', 'tee'], query: '셔츠' },
    { keywords: ['dress', 'gown'], query: '원피스' },
    { keywords: ['hat', 'cap', 'bonnet'], query: '모자' },
];

function resolveFashionQuery(predictions: Array<{ className: string }>): string | null {
    for (const prediction of predictions) {
        const normalized = prediction.className.toLowerCase();

        for (const mapping of FASHION_LABEL_MAPPINGS) {
            if (mapping.keywords.some((keyword) => normalized.includes(keyword))) {
                return mapping.query;
            }
        }

        const candidate = normalized.split(',')[0]?.trim();
        if (candidate) {
            const analysis = analyzeFashionQuery(candidate);
            if (analysis.allowed) {
                return analysis.normalizedQuery;
            }
        }
    }

    return null;
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
            pushAppNotification({ title: 'AI 모델 준비 중', message: 'AI 모델이 아직 준비되지 않았습니다. 다시 시도해주세요.', type: 'alert' });
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

            const resolvedQuery = resolveFashionQuery(predictions);

            if (resolvedQuery) {
                onSearch(resolvedQuery);
                pushAppNotification({
                    title: 'AI 이미지 분석 완료',
                    message: `분석 결과를 바탕으로 "${resolvedQuery}" 가격 비교를 시작합니다.`,
                    type: 'success'
                });
            } else {
                pushAppNotification({
                    title: '패션 아이템 인식 실패',
                    message: '의류, 신발, 가방 중심의 이미지를 다시 시도해주세요.',
                    type: 'alert'
                });
            }
        } catch (error) {
            console.error("Visual Search Failed", error);
            pushAppNotification({ title: '분석 실패', message: '이미지 분석에 실패했습니다.', type: 'alert' });
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
                        pushAppNotification({ title: '모델 로딩 실패', message: 'AI 모델 로딩에 실패했습니다. 잠시 후 다시 시도해주세요.', type: 'alert' });
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
