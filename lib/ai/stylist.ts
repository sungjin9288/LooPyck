import { Product } from '../../types/product';
import { UserDna, StyleProfile } from '../core/userDna';

/**
 * AI Stylist Logic
 * User DNA를 기반으로 상품 목록을 재정렬(Re-ranking)하고 큐레이션 함.
 */

export const Stylist = {
    // 상품 추천 (Re-ranking)
    recommend: (products: Product[]): Product[] => {
        if (typeof window === 'undefined') return products;

        const profile = UserDna.getProfile();
        const topStyles = UserDna.getTopStyles(3);

        if (topStyles.length === 0 || profile.minimal === 0) {
            // 데이터가 없으면 최신순/기본 정렬 반환
            return products;
        }

        return [...products].sort((a, b) => {
            const scoreA = Stylist.calculateMatchScore(a, topStyles);
            const scoreB = Stylist.calculateMatchScore(b, topStyles);
            return scoreB - scoreA; // 높은 점수 우선
        });
    },

    // 매칭 점수 계산 (단순 키워드 매칭 시뮬레이션)
    calculateMatchScore: (product: Product, topStyles: string[]): number => {
        let score = 0;
        const text = `${product.title} ${product.brand} ${product.category1}`.toLowerCase();

        topStyles.forEach((style, index) => {
            if (text.includes(style)) {
                // 상위 스타일일수록 가중치 높음 (3, 2, 1)
                score += (topStyles.length - index) * 10;
            }
        });

        // 가격대 기반 추론 (예: 럭셔리 선호 시 고가 제품 가점)
        if (topStyles.includes('luxury') && parseInt(product.lprice) > 200000) {
            score += 5;
        }

        return score;
    }
};
