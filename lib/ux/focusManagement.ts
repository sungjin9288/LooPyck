import { useEffect, useRef } from 'react';

/**
 * useFocusTrap Hook
 * 모달이나 팝업이 열렸을 때 포커스를 해당 영역 안에 가두는 접근성 훅.
 * Tab 키로 네비게이션 시 모달 밖으로 포커스가 나가는 것을 방지.
 */
export const useFocusTrap = (isActive: boolean) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isActive) return;

        const container = containerRef.current;
        if (!container) return;

        const focusableElements = container.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        const handleTabKey = (e: KeyboardEvent) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstElement) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        const handleEscapeKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // 부모 컴포넌트에서 onClose 처리
            }
        };

        container.addEventListener('keydown', handleTabKey);
        // 초기 포커스 설정
        if (firstElement) firstElement.focus();

        return () => {
            container.removeEventListener('keydown', handleTabKey);
        };
    }, [isActive]);

    return containerRef;
};
