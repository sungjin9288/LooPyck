'use client';

import { motion } from 'framer-motion';

interface EmptyStateProps {
    icon: React.ReactNode;
    title: string;
    message: string;
}

export function EmptyState({ icon, title, message }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
        >
            <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
            <p className="text-slate-500 text-sm">{message}</p>
        </motion.div>
    );
}
