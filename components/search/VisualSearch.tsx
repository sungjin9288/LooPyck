'use client';

import React, { useState, useRef, useEffect } from 'react';
import { pushAppNotification } from '@/lib/core/notifications';
import { analyzeFashionQuery } from '@/lib/search/fashionQueryAssistant';

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
                return;
            }
            reject(new Error('invalid_file_data'));
        };
        reader.onerror = () => reject(reader.error || new Error('file_read_failed'));
        reader.readAsDataURL(file);
    });
}

function resolveFashionQuery(payload: { description?: unknown; searchKeywords?: unknown }): string | null {
    const keywordCandidates = Array.isArray(payload.searchKeywords)
        ? payload.searchKeywords.filter((value): value is string => typeof value === 'string')
        : [];

    for (const candidate of keywordCandidates) {
        const analysis = analyzeFashionQuery(candidate);
        if (analysis.allowed) {
            return analysis.normalizedQuery;
        }
    }

    if (typeof payload.description === 'string') {
        const description = payload.description.split(/[.!?]/)[0]?.trim() || '';
        if (description) {
            const analysis = analyzeFashionQuery(description);
            if (analysis.allowed) {
                return analysis.normalizedQuery;
            }
        }
    }

    return keywordCandidates[0] || null;
}

export default function VisualSearch({ onSearch }: { onSearch: (term: string) => void }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_IMAGE_BYTES) {
            pushAppNotification({ title: '파일 크기 초과', message: '이미지는 4MB 이하여야 합니다.', type: 'alert' });
            e.target.value = '';
            return;
        }

        setIsAnalyzing(true);

        try {
            const dataUrl = await readFileAsDataUrl(file);
            const imageBase64 = dataUrl.split(',')[1] || '';
            if (!imageBase64) {
                throw new Error('invalid_image_data');
            }

            const response = await fetch('/api/ai-vision', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    imageBase64,
                    mimeType: file.type || 'image/jpeg',
                }),
            });
            const payload = await response.json().catch(() => ({} as Record<string, unknown>));

            if (!response.ok) {
                throw new Error(typeof payload.error === 'string' ? payload.error : '이미지 분석에 실패했습니다.');
            }

            const resolvedQuery = resolveFashionQuery(payload);

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
            console.error('Visual Search Failed', error);
            pushAppNotification({
                title: '분석 실패',
                message: error instanceof Error ? error.message : '이미지 분석에 실패했습니다.',
                type: 'alert'
            });
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
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
                onClick={() => fileInputRef.current?.click()}
                className={`p-2 rounded-full hover:bg-gray-100 transition-colors ${isAnalyzing ? 'animate-pulse bg-blue-50' : ''}`}
                title="AI 이미지 검색"
            >
                {isAnalyzing ? (
                    <span className="text-xl animate-spin">⏳</span>
                ) : (
                    <div className="relative">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white"></span>
                    </div>
                )}
            </button>
        </div>
    );
}
