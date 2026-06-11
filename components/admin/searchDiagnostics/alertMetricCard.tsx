import type { ReactNode } from 'react';

type AlertMetricCardProps = {
    label: string;
    value: ReactNode;
    description?: string;
    toneClassName?: string;
};

export function AlertMetricCard({
    label,
    value,
    description,
    toneClassName = 'text-white',
}: AlertMetricCardProps) {
    return (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</p>
            <p className={`mt-2 text-2xl font-black ${toneClassName}`}>{value}</p>
            {description && (
                <p className="mt-2 text-xs text-slate-400">{description}</p>
            )}
        </div>
    );
}
