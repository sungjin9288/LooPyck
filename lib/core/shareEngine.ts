/**
 * Share Engine: AI Style Report Card Generator
 * HTML Canvas API를 사용하여 사용자의 'Style DNA'를 시각적인 카드로 변환.
 */

import { StyleProfile } from './userDna';
import { SITE_HOST } from '@/lib/site';

export const ShareEngine = {
    /**
     * Generate Style Card Image
     * @param profile User's style profile
     * @returns Promise<string> Data URL of the generated image
     */
    generateStyleCard: async (profile: StyleProfile): Promise<string> => {
        if (typeof window === 'undefined') return '';

        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const width = 1080; // Instagram Story width
            const height = 1920; // Instagram Story height

            canvas.width = width;
            canvas.height = height;

            if (!ctx) {
                reject(new Error('Canvas context not available'));
                return;
            }

            // 1. Background
            const gradient = ctx.createLinearGradient(0, 0, 0, height);
            gradient.addColorStop(0, '#1a1a1a');
            gradient.addColorStop(1, '#000000');
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, width, height);

            // 2. Title Text
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 80px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('LooPyck AI Report', width / 2, 200);

            // 3. User Persona (Top Style)
            const topStyle = Object.entries(profile)
                .filter(([k]) => k !== 'lastUpdated')
                .sort(([, a], [, b]) => b - a)[0][0] || 'Explorer';

            const personaTitle = `The ${topStyle.charAt(0).toUpperCase() + topStyle.slice(1)} Curator`;

            ctx.font = 'bold 120px Inter, sans-serif';
            ctx.fillStyle = '#3b82f6'; // Brand blue
            ctx.fillText(personaTitle, width / 2, 400);

            // 4. Style Stats Visualization (Radar Chart Placeholder)
            // Drawing simple bars for now
            const styles = ['minimal', 'street', 'luxury', 'vintage'];
            let startY = 800;

            ctx.font = '50px Inter, sans-serif';
            ctx.textAlign = 'left';

            styles.forEach((style) => {
                const score = (profile as any)[style] || 0;
                const barWidth = Math.min(score * 20, 600); // 800px max

                // Label
                ctx.fillStyle = '#aaaaaa';
                ctx.fillText(style.toUpperCase(), 150, startY);

                // Bar
                ctx.fillStyle = '#3b82f6';
                ctx.fillRect(450, startY - 40, barWidth, 40);

                startY += 100;
            });

            // 5. Footer
            ctx.fillStyle = '#666666';
            ctx.font = '40px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(SITE_HOST, width / 2, height - 100);

            resolve(canvas.toDataURL('image/png'));
        });
    }
};
