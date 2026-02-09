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
    metadata?: Record<string, any>;
}

export interface PlatformAdapter {
    normalize(data: any): RetailProduct;
    normalizeBatch(dataList: any[]): RetailProduct[];
}

// Example: Generic Adapter for Standard JSON
export const GenericAdapter: PlatformAdapter = {
    normalize: (data: any): RetailProduct => {
        return {
            id: String(data.id || data.productId),
            title: data.title || data.name,
            price: Number(data.price || data.sale_price || 0),
            currency: data.currency || 'KRW',
            images: Array.isArray(data.images) ? data.images : [data.image || ''],
            url: data.url || data.link || '',
            category: data.category || '',
            tags: data.tags || [],
            metadata: data.metadata || {}
        };
    },
    normalizeBatch: (dataList: any[]): RetailProduct[] => {
        return dataList.map(GenericAdapter.normalize);
    }
};
