'use client';

import type { VariantSelectionOption } from '@/lib/product/variantSelection';

interface VariantPickerProps {
    options: VariantSelectionOption[];
    selectedKey?: string;
    onChange: (variantKey?: string) => void;
    className?: string;
}

export default function VariantPicker({ options, selectedKey, onChange, className = '' }: VariantPickerProps) {
    if (options.length === 0) {
        return null;
    }

    return (
        <div className={className}>
            <div className="flex flex-wrap gap-2">
                {options.map((option) => {
                    const isSelected = option.key === selectedKey;

                    return (
                        <button
                            key={option.key}
                            type="button"
                            onClick={() => onChange(option.key)}
                            className={`rounded-full border px-3 py-2 text-left transition-colors ${
                                isSelected
                                    ? 'border-slate-900 bg-slate-900 text-white'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                            <span className="block text-xs font-bold">
                                {option.label}
                            </span>
                            <span className={`mt-1 block text-[10px] ${
                                isSelected ? 'text-white/70' : 'text-slate-400'
                            }`}>
                                {option.matchedMallCount}개 쇼핑몰 확인
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
