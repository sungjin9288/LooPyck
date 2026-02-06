/**
 * Chat Advisor - Gemini 기반 스타일 질문 분석
 * 자연어 → StyleVector 변환 → 추천 엔진 연동
 */

import type { AIExtractedProduct } from '@/types/aiExtraction';
import { getStyleMatchScore, getMatchMessage } from './recommendationEngine';

// 스타일 벡터 타입
export interface StyleVector {
    silhouette?: AIExtractedProduct['silhouette'];
    material?: AIExtractedProduct['material'];
    priceRange?: { min: number; max: number };
    category?: 'top' | 'bottom' | 'outer' | 'dress' | 'accessory';
    fit?: AIExtractedProduct['fit'];
    style?: AIExtractedProduct['styleCategory'];
}

// 채팅 메시지 타입
export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    styleVector?: StyleVector;
    recommendations?: RecommendedItem[];
}

// 추천 상품 타입
export interface RecommendedItem {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    matchScore: number;
    mall: string;
    url?: string;
}

// 키워드 매핑
const SILHOUETTE_KEYWORDS: Record<string, AIExtractedProduct['silhouette']> = {
    '슬림': 'slim',
    '슬림핏': 'slim',
    '스키니': 'slim',
    '피티드': 'fitted',
    '오버사이즈': 'oversized',
    '오버핏': 'oversized',
    '박시': 'boxy',
    '릴렉스': 'relaxed',
    '루즈': 'relaxed',
    '와이드': 'wide',
    '스트레이트': 'straight',
    '레귤러': 'regular',
};

const MATERIAL_KEYWORDS: Record<string, AIExtractedProduct['material']> = {
    '울': 'wool',
    '양모': 'wool',
    '캐시미어': 'wool',
    '면': 'cotton',
    '코튼': 'cotton',
    '린넨': 'linen',
    '마': 'linen',
    '실크': 'silk',
    '비단': 'silk',
    '가죽': 'leather',
    '레더': 'leather',
    '데님': 'denim',
    '청': 'denim',
    '니트': 'knit',
    '플리스': 'fleece',
    '폴리': 'polyester',
    '나일론': 'nylon',
};

const CATEGORY_KEYWORDS: Record<string, StyleVector['category']> = {
    '상의': 'top',
    '티셔츠': 'top',
    '셔츠': 'top',
    '블라우스': 'top',
    '니트': 'top',
    '하의': 'bottom',
    '바지': 'bottom',
    '팬츠': 'bottom',
    '스커트': 'bottom',
    '아우터': 'outer',
    '자켓': 'outer',
    '코트': 'outer',
    '패딩': 'outer',
    '점퍼': 'outer',
    '원피스': 'dress',
    '드레스': 'dress',
};

const STYLE_KEYWORDS: Record<string, AIExtractedProduct['styleCategory']> = {
    '캐주얼': 'casual',
    '데일리': 'casual',
    '포멀': 'formal',
    '정장': 'formal',
    '오피스': 'formal',
    '스트릿': 'streetwear',
    '스트리트': 'streetwear',
    '애슬레저': 'athleisure',
    '스포티': 'athleisure',
    '클래식': 'classic',
    '미니멀': 'minimal',
    '심플': 'minimal',
};

/**
 * 자연어 질문에서 스타일 벡터 추출 (Pure Function)
 */
export function parseStyleQuestion(question: string): StyleVector {
    const normalized = question.toLowerCase();
    const vector: StyleVector = {};

    // 실루엣 추출
    for (const [keyword, value] of Object.entries(SILHOUETTE_KEYWORDS)) {
        if (normalized.includes(keyword)) {
            vector.silhouette = value;
            break;
        }
    }

    // 소재 추출
    for (const [keyword, value] of Object.entries(MATERIAL_KEYWORDS)) {
        if (normalized.includes(keyword)) {
            vector.material = value;
            break;
        }
    }

    // 카테고리 추출
    for (const [keyword, value] of Object.entries(CATEGORY_KEYWORDS)) {
        if (normalized.includes(keyword)) {
            vector.category = value;
            break;
        }
    }

    // 스타일 추출
    for (const [keyword, value] of Object.entries(STYLE_KEYWORDS)) {
        if (normalized.includes(keyword)) {
            vector.style = value;
            break;
        }
    }

    // 가격대 추출
    const priceMatch = normalized.match(/(\d+)\s*만\s*원?\s*(이하|미만|이상|대)?/);
    if (priceMatch) {
        const amount = parseInt(priceMatch[1]) * 10000;
        const modifier = priceMatch[2];

        if (modifier === '이하' || modifier === '미만') {
            vector.priceRange = { min: 0, max: amount };
        } else if (modifier === '이상') {
            vector.priceRange = { min: amount, max: 500000 };
        } else {
            // "X만원대" → ±20%
            vector.priceRange = { min: amount * 0.8, max: amount * 1.2 };
        }
    }

    return vector;
}

/**
 * 스타일 벡터 기반 상품 필터링 (Pure Function)
 */
export function filterByStyleVector<T extends Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price' | 'styleCategory'>>(
    products: T[],
    vector: StyleVector
): T[] {
    return products.filter(product => {
        // 실루엣 필터
        if (vector.silhouette && product.silhouette !== vector.silhouette) {
            return false;
        }

        // 소재 필터
        if (vector.material && product.material !== vector.material) {
            return false;
        }

        // 가격 필터
        if (vector.priceRange) {
            if (product.price < vector.priceRange.min || product.price > vector.priceRange.max) {
                return false;
            }
        }

        // 스타일 필터
        if (vector.style && product.styleCategory !== vector.style) {
            return false;
        }

        return true;
    });
}

/**
 * 추천 상품 가져오기 (with 매칭 점수)
 */
export function getRecommendations<T extends Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price' | 'styleCategory'> & { id?: string; productName?: string }>(
    products: T[],
    vector: StyleVector,
    userFavorites: Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price'>[] = [],
    limit: number = 10
): Array<T & { matchScore: number }> {
    // 1. 스타일 벡터로 필터링
    const filtered = filterByStyleVector(products, vector);

    // 2. 매칭 점수 계산
    const withScores = filtered.map(product => {
        const matchScore = userFavorites.length > 0
            ? getStyleMatchScore(userFavorites, product)
            : calculateVectorMatchScore(product, vector);

        return { ...product, matchScore };
    });

    // 3. 점수순 정렬 및 제한
    return withScores
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, limit);
}

/**
 * 벡터 매칭 점수 계산 (찜 목록 없을 때)
 */
function calculateVectorMatchScore(
    product: Pick<AIExtractedProduct, 'silhouette' | 'material' | 'price' | 'styleCategory'>,
    vector: StyleVector
): number {
    let score = 50; // 기본 점수

    if (vector.silhouette && product.silhouette === vector.silhouette) {
        score += 20;
    }
    if (vector.material && product.material === vector.material) {
        score += 15;
    }
    if (vector.style && product.styleCategory === vector.style) {
        score += 10;
    }
    if (vector.priceRange) {
        const midPrice = (vector.priceRange.min + vector.priceRange.max) / 2;
        const diff = Math.abs(product.price - midPrice) / midPrice;
        score += Math.max(0, 5 - diff * 10);
    }

    return Math.min(100, Math.round(score));
}

/**
 * 응답 메시지 생성
 */
export function generateResponse(
    vector: StyleVector,
    recommendations: RecommendedItem[]
): string {
    const parts: string[] = [];

    // 벡터 요약
    const vectorParts: string[] = [];
    if (vector.material) vectorParts.push(getMaterialKorean(vector.material));
    if (vector.silhouette) vectorParts.push(getSilhouetteKorean(vector.silhouette));
    if (vector.category) vectorParts.push(getCategoryKorean(vector.category));

    if (vectorParts.length > 0) {
        parts.push(`${vectorParts.join(' ')} 상품을 찾아봤어요!`);
    }

    // 추천 결과
    if (recommendations.length > 0) {
        const avgScore = Math.round(
            recommendations.reduce((sum, r) => sum + r.matchScore, 0) / recommendations.length
        );
        parts.push(`총 ${recommendations.length}개 상품을 찾았어요.`);
        parts.push(getMatchMessage(avgScore));
    } else {
        parts.push('조건에 맞는 상품을 찾지 못했어요. 다른 조건으로 검색해보세요!');
    }

    return parts.join(' ');
}

// 한국어 변환 헬퍼
function getMaterialKorean(material: AIExtractedProduct['material']): string {
    const map: Record<string, string> = {
        wool: '울', cotton: '면', linen: '린넨', silk: '실크',
        leather: '가죽', denim: '데님', knit: '니트', fleece: '플리스',
        polyester: '폴리', nylon: '나일론', mixed: '혼방', unknown: '',
    };
    return map[material] || '';
}

function getSilhouetteKorean(silhouette: AIExtractedProduct['silhouette']): string {
    const map: Record<string, string> = {
        slim: '슬림핏', fitted: '피티드', oversized: '오버사이즈', boxy: '박시',
        relaxed: '릴렉스', wide: '와이드', straight: '스트레이트', regular: '레귤러', unknown: '',
    };
    return map[silhouette] || '';
}

function getCategoryKorean(category: StyleVector['category']): string {
    const map: Record<string, string> = {
        top: '상의', bottom: '하의', outer: '아우터', dress: '원피스', accessory: '액세서리',
    };
    return category ? map[category] || '' : '';
}

/**
 * 메시지 ID 생성
 */
export function generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}
