import { Logger } from '@/lib/core/observability';
import type { SearchInteractionClientPayload } from '@/lib/search/searchInteractionContract';

export async function logSearchInteraction(payload: SearchInteractionClientPayload): Promise<void> {
    try {
        const response = await fetch('/api/realtime-search/interactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true,
        });
        if (!response.ok) {
            Logger.warn('[searchInteractionClient] log rejected', {
                status: response.status,
                type: payload.type,
            });
        }
    } catch (error) {
        Logger.error('[searchInteractionClient] log failed', error);
    }
}
