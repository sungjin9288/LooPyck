'use client';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-14 h-14 border-4',
};

export function Spinner({ size = 'md', className = '' }: SpinnerProps) {
    return (
        <div
            role="status"
            aria-label="로딩 중"
            className={`${sizeClasses[size]} border-accent border-t-transparent rounded-full animate-spin ${className}`}
        />
    );
}
