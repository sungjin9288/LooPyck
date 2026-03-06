type SearchInteractionPayload = {
    type: 'suggestion_click' | 'product_open' | 'store_click';
    query: string;
    selectedQuery?: string;
    source?: string;
    productId?: string;
    productTitle?: string;
    brand?: string;
    context?: string;
};

export async function logSearchInteraction(payload: SearchInteractionPayload): Promise<void> {
    try {
        await fetch('/api/realtime-search/interactions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
            keepalive: true,
        });
    } catch (error) {
        console.error('[searchInteractionClient] log failed:', error);
    }
}
