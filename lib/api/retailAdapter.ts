/**
 * Retail Data Adapter
 * 다양한 커머스 플랫폼(Shopify, Cafe24, Custom DB)의 상품 데이터를
 * LooPyck 엔진이 이해할 수 있는 표준 포맷으로 변환.
 */

export interface RetailProduct {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    description?: string;
    url: string;
    category?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

export interface PlatformAdapter {
    normalize(data: Record<string, unknown>): RetailProduct;
    normalizeBatch(dataList: Record<string, unknown>[]): RetailProduct[];
}

// Example: Generic Adapter for Standard JSON
export const GenericAdapter: PlatformAdapter = {
    normalize: (data: Record<string, unknown>): RetailProduct => {
        return {
            id: String(data.id ?? data.productId ?? ''),
            title: String(data.title ?? data.name ?? ''),
            price: Number(data.price ?? data.sale_price ?? 0),
            currency: String(data.currency ?? 'KRW'),
            images: Array.isArray(data.images) ? (data.images as string[]) : [String(data.image ?? '')],
            url: String(data.url ?? data.link ?? ''),
            category: String(data.category ?? ''),
            tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
            metadata: (data.metadata as Record<string, unknown>) ?? {},
        };
    },
    normalizeBatch: (dataList: Record<string, unknown>[]): RetailProduct[] => {
        return dataList.map(GenericAdapter.normalize);
    },
};
