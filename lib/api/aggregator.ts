import { Product as NaverProduct } from '@/types/product';

// 1. Unified Product Schema (정규화된 데이터 포맷)
export interface UnifiedProduct {
    id: string; // 고유 ID (prefix + original ID)
    title: string;
    price: number;
    image: string;
    link: string;
    mallName: string; // 쇼핑몰 이름 (Naver, Musinsa, 29CM, etc.)
    brand?: string;
    category1?: string;
    category2?: string;
    source: 'NAVER' | 'MUSINSA' | '29CM' | 'W_CONCEPT' | 'ZIGZAG' | 'FARFETCH' | 'COUPANG' | 'SSENSE';
}

// 2. Data Simulation Helpers
const MOCK_DELAY_MIN = 500;
const MOCK_DELAY_MAX = 1500;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const getRandomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

// Mock Images for Fashion Consistency
const MOCK_IMAGES = [
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1550614000-4b9519e02d8e?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1525507119028-ed4c629a60a2?w=500&auto=format&fit=crop&q=60',
    'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=500&auto=format&fit=crop&q=60',
];

// 3. Source Fetchers

/**
 * Fetch from Naver API (Real Data)
 */
export async function fetchNaverProducts(query: string, start: number = 1): Promise<UnifiedProduct[]> {
    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&start=${start}&display=20`); // 20 items per defined chunk
        if (!response.ok) throw new Error('Naver API Failed');

        const data = await response.json();
        const items: NaverProduct[] = data.items || [];

        return items.map((item) => ({
            id: `naver_${item.productId}`,
            title: item.title.replace(/<[^>]*>?/gm, '').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
            price: parseInt(item.lprice, 10),
            image: item.image,
            // Fix: Naver API returns unescaped HTML sometimes, but link is usually clean. 
            // If it's a gateway link, we might need to handle it, but for now just pass it.
            link: item.link,
            mallName: item.mallName,
            brand: item.brand,
            category1: item.category1,
            category2: item.category2,
            source: 'NAVER',
        }));
    } catch (error) {
        console.error('Naver Fetch Error:', error);
        return [];
    }
}

/**
 * Fetch from Musinsa (Mock Simulation)
 */
export async function fetchMusinsaProducts(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    await delay(getRandomInt(MOCK_DELAY_MIN, MOCK_DELAY_MAX)); // Network latency simulation

    // Simulate empty result for deep pagination or weird queries
    if (page > 5) return [];

    return Array.from({ length: 10 }).map((_, i) => {
        const price = getRandomInt(30000, 200000);
        const id = `musinsa_${page}_${i}`;
        return {
            id,
            title: `[MUSINSA Standard] ${query} Premium Ver.${page}-${i}`,
            price,
            image: MOCK_IMAGES[i % MOCK_IMAGES.length],
            link: '#',
            mallName: 'Musinsa',
            brand: 'Musinsa Standard',
            category1: 'Fashion',
            source: 'MUSINSA',
        };
    });
}

/**
 * Fetch from 29CM (Mock Simulation)
 */
export async function fetch29CMProducts(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    await delay(getRandomInt(MOCK_DELAY_MIN, MOCK_DELAY_MAX)); // Network latency simulation

    if (page > 4) return [];

    return Array.from({ length: 8 }).map((_, i) => {
        const price = getRandomInt(50000, 450000);
        const id = `29cm_${page}_${i}`;
        return {
            id,
            title: `[29CM Exclusive] ${query} Designer Collection #${page}-${i}`,
            price,
            image: MOCK_IMAGES[(i + 2) % MOCK_IMAGES.length],
            link: '#',
            mallName: '29CM',
            brand: 'Designer Brand',
            category1: 'Luxury',
            source: '29CM',
        };
    });
}

/**
 * Fetch from W Concept (Mock Simulation)
 */
export async function fetchWConceptProducts(query: string, page: number = 1): Promise<UnifiedProduct[]> {
    await delay(getRandomInt(MOCK_DELAY_MIN, MOCK_DELAY_MAX));

    if (page > 3) return [];

    return Array.from({ length: 6 }).map((_, i) => {
        const price = getRandomInt(80000, 300000);
        const id = `wconcept_${page}_${i}`;
        return {
            id,
            title: `[W Concept] ${query} Trendy Selection ${page}-${i}`,
            price,
            image: MOCK_IMAGES[(i + 4) % MOCK_IMAGES.length],
            link: '#',
            mallName: 'W Concept',
            brand: 'Urban Chic',
            category1: 'Trend',
            source: 'W_CONCEPT',
        };
    });
}

// 4. Aggregator Main Function

interface AggregationResult {
    products: UnifiedProduct[];
    stats: {
        total: number;
        sources: string[];
    };
}

export async function aggregateSearch(query: string, page: number = 1): Promise<AggregationResult> {
    // Naver uses 'start' index (1, 21, 41...), others use 'page' number (1, 2, 3...)
    const naverStart = (page - 1) * 20 + 1;

    // Parallel Fetching using Promise.allSettled
    const results = await Promise.allSettled([
        fetchNaverProducts(query, naverStart),
        fetchMusinsaProducts(query, page),
        fetch29CMProducts(query, page),
        fetchWConceptProducts(query, page),
    ]);

    let aggregatedProducts: UnifiedProduct[] = [];
    const sourceStats = new Set<string>();

    results.forEach((result) => {
        if (result.status === 'fulfilled') {
            const products = result.value;
            if (products.length > 0) {
                aggregatedProducts = [...aggregatedProducts, ...products];
                sourceStats.add(products[0].source);
            }
        }
    });

    // Random Shuffle for "Integrated" feel (Optional, but user requested 'Contextual Experience')
    // For now, let's keep them somewhat ordered or just simple shuffle
    // aggregatedProducts.sort(() => Math.random() - 0.5);

    // Price Sort (Default)
    aggregatedProducts.sort((a, b) => a.price - b.price);

    return {
        products: aggregatedProducts,
        stats: {
            total: aggregatedProducts.length,
            sources: Array.from(sourceStats),
        },
    };
}
