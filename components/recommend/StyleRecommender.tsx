'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { StyleRecommendLook } from '@/lib/ai/styleRecommend';

interface StyleRecommenderProps {
    onSearch: (keyword: string) => void;
    onSwitchToSearch: () => void;
}

type Step = 'form' | 'loading' | 'result';

const STYLE_OPTIONS = ['캐주얼', '미니멀', '스포티', '포멀', '빈티지', '스트리트', '로맨틱'];
const BUDGET_OPTIONS = [
    { value: 'low', label: '3만원 이하' },
    { value: 'mid', label: '3~10만원' },
    { value: 'high', label: '10만원 이상' },
] as const;

export default function StyleRecommender({ onSearch, onSwitchToSearch }: StyleRecommenderProps) {
    const [step, setStep] = useState<Step>('form');
    const [gender, setGender] = useState<'M' | 'F' | 'N'>('M');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [budget, setBudget] = useState<'low' | 'mid' | 'high'>('mid');
    const [looks, setLooks] = useState<StyleRecommendLook[]>([]);
    const [bodyNote, setBodyNote] = useState('');
    const [error, setError] = useState('');

    const toggleStyle = (style: string) => {
        setSelectedStyles(prev =>
            prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style].slice(0, 3)
        );
    };

    const handleSubmit = async () => {
        if (!height || !weight || selectedStyles.length === 0) {
            setError('키, 몸무게, 선호 스타일을 모두 입력해주세요.');
            return;
        }
        setError('');
        setStep('loading');

        try {
            const res = await fetch('/api/style-recommend', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    gender,
                    height: Number(height),
                    weight: Number(weight),
                    preferredStyles: selectedStyles,
                    budget,
                }),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || '추천을 받아오는 데 실패했습니다.');
                setStep('form');
            } else {
                setLooks(data.looks);
                setBodyNote(data.bodyNote);
                setStep('result');
            }
        } catch {
            setError('네트워크 오류가 발생했습니다.');
            setStep('form');
        }
    };

    const handleSearchItem = (keyword: string) => {
        onSearch(keyword);
        onSwitchToSearch();
    };

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="text-center mb-8">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">AI Stylist</p>
                <h1 className="font-serif text-4xl tracking-tight text-slate-900">
                    나만의 스타일 추천
                </h1>
                <p className="mt-3 text-sm text-slate-500">체형과 취향을 입력하면 AI가 딱 맞는 룩을 추천해드려요</p>
            </div>

            <AnimatePresence mode="wait">
                {/* Step 1: Form */}
                {step === 'form' && (
                    <motion.div
                        key="form"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -16 }}
                        className="rounded-3xl border border-stone-200/70 bg-white p-6 sm:p-8 space-y-6"
                    >
                        {/* 성별 */}
                        <div>
                            <label className="text-sm font-bold text-slate-600 mb-2 block">성별</label>
                            <div className="flex gap-3">
                                {([['M', '남성 👕'], ['F', '여성 👗'], ['N', '무관 ✨']] as const).map(([val, label]) => (
                                    <button
                                        key={val}
                                        onClick={() => setGender(val)}
                                        className={`flex-1 py-2.5 rounded-xl border font-medium text-sm transition-all ${gender === val
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                            }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 키/몸무게 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-bold text-slate-600 mb-2 block">키 (cm)</label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={e => setHeight(e.target.value)}
                                    placeholder="예: 175"
                                    min="100" max="230"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                                />
                            </div>
                            <div>
                                <label className="text-sm font-bold text-slate-600 mb-2 block">몸무게 (kg)</label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    placeholder="예: 68"
                                    min="30" max="200"
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/50"
                                />
                            </div>
                        </div>

                        {/* 선호 스타일 */}
                        <div>
                            <label className="text-sm font-bold text-slate-600 mb-2 block">
                                선호 스타일 <span className="font-normal text-slate-400">(최대 3개)</span>
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {STYLE_OPTIONS.map(style => (
                                    <button
                                        key={style}
                                        onClick={() => toggleStyle(style)}
                                        className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${selectedStyles.includes(style)
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-900 hover:text-slate-900'
                                            }`}
                                    >
                                        {style}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 예산 */}
                        <div>
                            <label className="text-sm font-bold text-slate-600 mb-2 block">아이템 예산</label>
                            <div className="flex gap-3">
                                {BUDGET_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setBudget(opt.value)}
                                        className={`flex-1 py-2.5 rounded-xl border text-sm font-medium transition-all ${budget === opt.value
                                                ? 'bg-slate-900 text-white border-slate-900'
                                                : 'border-slate-200 text-slate-600 hover:border-slate-400'
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm">{error}</p>}

                        <button
                            onClick={handleSubmit}
                            disabled={!height || !weight || selectedStyles.length === 0}
                            className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-base"
                        >
                            AI 스타일 추천 받기 ✨
                        </button>
                    </motion.div>
                )}

                {/* Step 2: Loading */}
                {step === 'loading' && (
                    <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col items-center justify-center py-24 gap-5"
                    >
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-violet-200 rounded-full" />
                            <div className="absolute inset-0 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                        <div className="text-center">
                            <p className="font-bold text-slate-900 mb-1">AI가 체형을 분석하고 있어요</p>
                            <p className="text-slate-500 text-sm">맞춤 룩 3가지를 준비 중입니다...</p>
                        </div>
                    </motion.div>
                )}

                {/* Step 3: Result */}
                {step === 'result' && (
                    <motion.div
                        key="result"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-4"
                    >
                        {/* Body Note */}
                        <div className="glass-panel rounded-2xl p-4 flex items-start gap-3">
                            <span className="text-2xl">💡</span>
                            <p className="text-sm text-slate-700">{bodyNote}</p>
                        </div>

                        {/* Look Cards */}
                        {looks.map((look, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.12 }}
                                className="glass-panel rounded-2xl p-5"
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                        {i + 1}
                                    </span>
                                    <h3 className="font-bold text-slate-900">{look.lookName}</h3>
                                </div>
                                <p className="text-sm text-slate-600 mb-2">{look.description}</p>
                                <p className="text-xs text-slate-400 mb-3 italic">{look.reason}</p>

                                {/* Searchable items */}
                                <div className="flex flex-wrap gap-2">
                                    {look.keyItems.map(item => (
                                        <button
                                            key={item}
                                            onClick={() => handleSearchItem(item)}
                                            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-violet-50 border border-violet-200 text-violet-700 rounded-full hover:bg-violet-100 transition-all font-medium"
                                        >
                                            <span>🛍️</span> {item}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        ))}

                        <button
                            onClick={() => { setStep('form'); setLooks([]); }}
                            className="w-full py-3 border border-slate-200 text-slate-600 rounded-2xl text-sm hover:bg-slate-50 transition-all font-medium"
                        >
                            다시 추천받기
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
