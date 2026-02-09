import { RetailProduct, PlatformAdapter, GenericAdapter } from '../api/retailAdapter';
import { Stylist } from '../ai/stylist';
import { Logger } from './observability';

/**
 * LooPyck Enterprise SDK
 * 패션 AI 솔루션을 외부 서비스에 내장하기 위한 단일 진입점.
 */

interface SDKConfig {
    apiKey: string;
    platform?: 'shopify' | 'cafe24' | 'generic';
    debug?: boolean;
}

export class LooPyckSDK {
    private static instance: LooPyckSDK;
    private config: SDKConfig;
    private adapter: PlatformAdapter;

    private constructor(config: SDKConfig) {
        this.config = config;
        this.adapter = GenericAdapter; // Default to generic
        if (config.debug) {
            Logger.info('LooPyck SDK Initialized', { platform: config.platform });
        }
    }

    public static init(config: SDKConfig): LooPyckSDK {
        if (!LooPyckSDK.instance) {
            LooPyckSDK.instance = new LooPyckSDK(config);
        }
        return LooPyckSDK.instance;
    }

    public static getInstance(): LooPyckSDK {
        if (!LooPyckSDK.instance) {
            throw new Error('LooPyck SDK not initialized. Call init() first.');
        }
        return LooPyckSDK.instance;
    }

    /**
     * AI Search Engine
     * 자연어 쿼리를 분석하여 상품을 검색. (Mock implementation for now)
     */
    public async search(query: string, products: any[]): Promise<RetailProduct[]> {
        const normalized = this.adapter.normalizeBatch(products);

        // Simulating AI Search Logic
        const keywords = query.toLowerCase().split(' ');
        return normalized.filter(p => {
            return keywords.some(k => p.title.toLowerCase().includes(k) || p.category?.toLowerCase().includes(k));
        });
    }

    /**
     * AI Stylist Recommendation
     * 사용자 프로필 기반 추천 (User DNA Integration possible here)
     */
    public recommend(products: any[], userContext: any): RetailProduct[] {
        const normalized = this.adapter.normalizeBatch(products);
        // Using internal Stylist engine (simplified mapping)
        // In real enterprise version, this would call userDna.ts logic
        return normalized.slice(0, 5); // Mock: Return top 5
    }

    /**
     * Vision Analysis (Stub)
     * 이미지 URL을 받아 스타일 태그를 반환.
     */
    public async analyzeImage(imageUrl: string): Promise<string[]> {
        // This would call the Vision API
        return ['minimal', 'casual', 'neutral']; // Mock response
    }
}
