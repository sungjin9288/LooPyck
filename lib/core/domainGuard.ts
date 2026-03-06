import { analyzeFashionQuery } from '@/lib/search/fashionQueryAssistant';

/**
 * Backwards-compatible guard wrapper.
 * Prefer `analyzeFashionQuery` when you need recommendation or normalization metadata.
 */
export function isFashionRelated(query: string): { allowed: boolean; reason?: string } {
    const analysis = analyzeFashionQuery(query);

    return {
        allowed: analysis.allowed,
        reason: analysis.reason,
    };
}

export { analyzeFashionQuery } from '@/lib/search/fashionQueryAssistant';
