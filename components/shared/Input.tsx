import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, fullWidth = false, className = '', ...props }, ref) => {
        return (
            <div className={`${fullWidth ? 'w-full' : ''} space-y-1`}>
                {label && (
                    <label className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
            block w-full px-4 py-3 rounded-lg border border-gray-300
            text-gray-900 bg-surface-light
            transition-all duration-300
            focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent
            disabled:bg-gray-100 disabled:text-gray-500
            placeholder:text-gray-400
            shadow-sm hover:border-gray-400
            ${error ? 'border-red-500 focus:ring-red-500' : ''}
            ${className}
          `}
                    {...props}
                />
                {error && (
                    <p className="text-sm text-red-500 animate-in fade-in slide-in-from-top-1">
                        {error}
                    </p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
