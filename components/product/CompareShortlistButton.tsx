'use client';

import React from 'react';
import type { Product } from '@/types/product';
import { useCompareShortlist } from '@/hooks/useCompareShortlist';
import { pushAppNotification } from '@/lib/core/notifications';
import { triggerHaptic } from '@/lib/native/bridge';
import { CompareShortlistActionButton } from '@/components/product/compareWorkflowSections';

interface CompareShortlistButtonProps {
    product: Product;
    className?: string;
    compact?: boolean;
}

export default function CompareShortlistButton({
    product,
    className = '',
    compact = false,
}: CompareShortlistButtonProps) {
    const { isInShortlist, toggleShortlist } = useCompareShortlist();
    const shortlisted = isInShortlist(product);

    function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
        event.stopPropagation();
        toggleShortlist(product);

        if (shortlisted) {
            triggerHaptic('medium');
            pushAppNotification({
                title: '비교 후보 제거',
                message: '이 기기의 compare shortlist에서 제외했습니다.',
                type: 'info',
            });
            return;
        }

        triggerHaptic('success');
        pushAppNotification({
            title: '비교 후보 저장',
            message: '로그인 없이도 이 기기에서 다시 비교를 이어볼 수 있습니다.',
            type: 'success',
        });
    }

    return (
        <CompareShortlistActionButton
            shortlisted={shortlisted}
            compact={compact}
            className={className}
            onClick={handleClick}
        />
    );
}
