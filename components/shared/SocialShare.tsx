'use client';

import React, { useState } from 'react';
import { ShareEngine } from '../../lib/core/shareEngine';
import { UserDna } from '../../lib/core/userDna';
import { ViralTracker } from '../../lib/analytics/viralTracker';
import { pushAppNotification } from '@/lib/core/notifications';

export const SocialShare = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleShare = async (platform: 'kakao' | 'instagram') => {
        setIsGenerating(true);
        try {
            const profile = UserDna.getProfile();
            const imageUrl = await ShareEngine.generateStyleCard(profile);

            ViralTracker.trackShare(platform, 'StyleCard');

            if (navigator.share && platform === 'instagram') {
                // Native Share (Mobile)
                const blob = await (await fetch(imageUrl)).blob();
                const file = new File([blob], 'loopyck_style.png', { type: 'image/png' });
                await navigator.share({
                    files: [file],
                    title: 'My LooPyck Style DNA',
                    text: 'Check out my fashion persona on LooPyck!'
                });
            } else {
                // Fallback: Open Image in new tab or download
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = 'loopyck_style_dna.png';
                link.click();
                pushAppNotification({ title: '이미지 저장 완료', message: '이미지를 직접 SNS에 공유해보세요!', type: 'success' });
            }

        } catch (error) {
            console.error('Share failed:', error);
            pushAppNotification({ title: '공유 실패', message: '이미지 생성에 실패했습니다. 잠시 후 다시 시도해주세요.', type: 'alert' });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="flex gap-4 mt-6">
            <button
                onClick={() => handleShare('instagram')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                {isGenerating ? 'Generating...' : 'Share to Instagram 📸'}
            </button>

            <button
                onClick={() => handleShare('kakao')}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-3 bg-[#FEE500] text-black rounded-full font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
                KakaoTalk 💬
            </button>
        </div>
    );
};
