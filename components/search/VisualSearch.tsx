'use client';

import React, { useState, useRef, useEffect } from 'react';
import { pushAppNotification } from '@/lib/core/notifications';
import { resolveItemQueries, groupResolvedItems, type ResolvedVisionItemGroup } from '@/lib/search/visionItemResolver';
import type { VisionItem } from '@/lib/ai/visionItemNormalizer';
import { Logger } from '@/lib/core/observability';

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

interface ItemPicker {
    summary: string;
    groups: ResolvedVisionItemGroup[];
}

export default function VisualSearch({ onSearch }: { onSearch: (term: string) => void }) {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [picker, setPicker] = useState<ItemPicker | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!picker) return;

        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setPicker(null);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [picker]);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_IMAGE_BYTES) {
            pushAppNotification({ title: '파일 크기 초과', message: '이미지는 4MB 이하여야 합니다.', type: 'alert' });
            e.target.value = '';
            return;
        }

        setIsAnalyzing(true);
        setPicker(null);

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

            const items = Array.isArray(payload.items) ? (payload.items as VisionItem[]) : [];
            const summary = typeof payload.summary === 'string' ? payload.summary : '';
            const resolvedItems = resolveItemQueries(items);

            if (resolvedItems.length === 0) {
                pushAppNotification({
                    title: '패션 아이템 인식 실패',
                    message: '의류, 신발, 가방 중심의 이미지를 다시 시도해주세요.',
                    type: 'alert'
                });
            } else if (resolvedItems.length === 1) {
                onSearch(resolvedItems[0].query);
                pushAppNotification({
                    title: 'AI 이미지 분석 완료',
                    message: `분석 결과를 바탕으로 "${resolvedItems[0].query}" 가격 비교를 시작합니다.`,
                    type: 'success'
                });
            } else {
                setPicker({ summary, groups: groupResolvedItems(resolvedItems) });
            }
        } catch (error) {
            Logger.error('[VisualSearch] analysis failed', error);
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

    const handlePickItem = (query: string, label: string) => {
        onSearch(query);
        pushAppNotification({
            title: 'AI 이미지 분석 완료',
            message: `"${label}" 기준으로 가격 비교를 시작합니다.`,
            type: 'success',
        });
        setPicker(null);
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

            {picker && (
                <div
                    ref={popoverRef}
                    className="absolute right-0 top-full z-50 mt-2 w-72 rounded-2xl border border-stone-200 bg-white p-3 shadow-xl"
                >
                    {picker.summary && (
                        <p className="mb-2 px-1 text-xs leading-5 text-slate-500">{picker.summary}</p>
                    )}
                    <div className="max-h-72 space-y-3 overflow-y-auto">
                        {picker.groups.map((group) => (
                            <div key={group.category}>
                                <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                                    {group.category}
                                </p>
                                <div className="space-y-1">
                                    {group.items.map((resolvedItem) => (
                                        <button
                                            key={resolvedItem.query}
                                            type="button"
                                            onClick={() => handlePickItem(resolvedItem.query, resolvedItem.label)}
                                            className="block w-full rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
                                        >
                                            {resolvedItem.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
