'use client';

import React, { useEffect, useRef } from 'react';
import { Product } from '../../types/product';
import { AestheticEngine } from '../../lib/ux/aestheticEngine';

interface ViralCardV2Props {
    product: Product;
    trustScore?: number; // 0-100
}

export const ViralCardV2: React.FC<ViralCardV2Props> = ({ product, trustScore = 92 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 1. Dynamic Background based on Trust Score Color or Image dominance (simplified)
        const baseColor = AestheticEngine.getTrustColor(trustScore);
        const gradient = ctx.createLinearGradient(0, 0, 0, 600);
        gradient.addColorStop(0, '#111');
        gradient.addColorStop(1, '#000');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 600);

        // 2. Product Image Placeholder (In real app, load image)
        ctx.fillStyle = '#222';
        ctx.fillRect(50, 50, 300, 400); // Image area

        // 3. Typography
        ctx.font = 'bold 40px Inter';
        ctx.fillStyle = '#FFF';
        ctx.fillText(product.title.substring(0, 20) + '...', 400, 100);

        ctx.font = '30px Inter';
        ctx.fillStyle = '#AAA';
        ctx.fillText(`${parseInt(product.lprice).toLocaleString()} KRW`, 400, 160);

        // 4. AI Trust Badge
        ctx.fillStyle = baseColor;
        ctx.beginPath();
        ctx.arc(700, 500, 60, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 30px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(`${trustScore}`, 700, 510);

        ctx.font = '14px Inter';
        ctx.fillText('TRUST', 700, 480);
        ctx.fillText('SCORE', 700, 535);

        // 5. Signature
        ctx.fillStyle = '#666';
        ctx.font = 'italic 20px Inter';
        ctx.textAlign = 'right';
        ctx.fillText('Verified by LooPyck AI', 760, 580);

    }, [product, trustScore]);

    return (
        <div className="flex flex-col items-center">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                className="w-full max-w-md shadow-2xl rounded-xl border border-gray-800"
            />
            <p className="mt-4 text-sm text-gray-500">
                AI-Generated Preview
            </p>
        </div>
    );
};
