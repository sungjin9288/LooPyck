import { useState, useEffect } from 'react';

/**
 * useTypewriter Hook
 * 텍스트가 한 글자씩 타이핑되는 효과를 제공.
 * @param text 출력할 전체 텍스트
 * @param speed 타이핑 속도 (ms)
 * @param startDelay 시작 지연 시간 (ms)
 */
export const useTypewriter = (text: string, speed: number = 30, startDelay: number = 500) => {
    const [displayedText, setDisplayedText] = useState('');
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        let currentIndex = 0;

        // Reset state when text changes
        setDisplayedText('');
        setIsComplete(false);

        const startTyping = () => {
            const intervalId = setInterval(() => {
                if (currentIndex < text.length) {
                    setDisplayedText((prev) => prev + text.charAt(currentIndex));
                    currentIndex++;
                } else {
                    clearInterval(intervalId);
                    setIsComplete(true);
                }
            }, speed);

            return () => clearInterval(intervalId);
        };

        timeoutId = setTimeout(startTyping, startDelay);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [text, speed, startDelay]);

    return { displayedText, isComplete };
};
