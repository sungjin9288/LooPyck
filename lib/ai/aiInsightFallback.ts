import type { PriceVerdict, PriceVerdictLevel } from '@/lib/product/priceVerdict';
import type { InvestmentRating } from '@/lib/product/investmentRating';

export type AiInsightSource = 'ai' | 'fallback';

export interface AiInsightReasoningItem {
    factor: string;
    score: number;
    note: string;
}

export interface AiInsightResult {
    analysisSource: AiInsightSource;
    insight: {
        score: number;
        ratingEN: InvestmentRating;
        advice: string;
        reason: string;
        reasoning: AiInsightReasoningItem[];
    };
    trend: {
        score: number;
        label: string;
        keywords: string[];
    };
}

type FallbackCopy = Pick<AiInsightResult['insight'], 'score' | 'ratingEN' | 'advice'>;

const FALLBACK_COPY: Record<PriceVerdictLevel, FallbackCopy> = {
    great_deal: {
        score: 85,
        ratingEN: 'STRONG BUY',
        advice: '가격 이력상 지금 비교해볼 만합니다.',
    },
    good: {
        score: 72,
        ratingEN: 'BUY',
        advice: '최근 가격 이력 기준으로 비교 가치가 있습니다.',
    },
    fair: {
        score: 55,
        ratingEN: 'HOLD',
        advice: '현재 가격은 최근 범위와 비슷합니다.',
    },
    high: {
        score: 35,
        ratingEN: 'WAIT',
        advice: '가격이 높은 편이라 기다려볼 만합니다.',
    },
    insufficient: {
        score: 50,
        ratingEN: 'HOLD',
        advice: '가격 데이터를 더 모은 뒤 판단해보세요.',
    },
};

export function buildAiInsightFallback(verdict: PriceVerdict): AiInsightResult {
    const copy = FALLBACK_COPY[verdict.level];
    const hasEnoughHistory = verdict.level !== 'insufficient';

    return {
        analysisSource: 'fallback',
        insight: {
            ...copy,
            reason: verdict.reason,
            reasoning: [
                {
                    factor: '가격 이력',
                    score: copy.score,
                    note: hasEnoughHistory ? verdict.label : '통계 판단에 필요한 가격 표본 부족',
                },
                {
                    factor: '데이터 신뢰도',
                    score: hasEnoughHistory ? 80 : 35,
                    note: hasEnoughHistory ? `실제 수집 ${verdict.sampleSize}회 기준` : `현재 수집 ${verdict.sampleSize}회`,
                },
            ],
        },
        trend: {
            score: 50,
            label: '트렌드 분석 대기',
            keywords: [],
        },
    };
}
