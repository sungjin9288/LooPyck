export const INVESTMENT_RATINGS = ['STRONG BUY', 'BUY', 'HOLD', 'WAIT'] as const;

export type InvestmentRating = typeof INVESTMENT_RATINGS[number];

export type InvestmentRatingPresentation = {
    label: string;
    textColorClass: string;
    barColorClass: string;
};

const INVESTMENT_RATING_PRESENTATION: Record<InvestmentRating, InvestmentRatingPresentation> = {
    'STRONG BUY': {
        label: '적극 추천',
        textColorClass: 'text-green-600',
        barColorClass: 'bg-green-500',
    },
    BUY: {
        label: '추천',
        textColorClass: 'text-green-600',
        barColorClass: 'bg-green-500',
    },
    HOLD: {
        label: '보류',
        textColorClass: 'text-yellow-600',
        barColorClass: 'bg-yellow-500',
    },
    WAIT: {
        label: '기다림',
        textColorClass: 'text-red-600',
        barColorClass: 'bg-red-500',
    },
};

export function getInvestmentRatingPresentation(rating: InvestmentRating): InvestmentRatingPresentation {
    return INVESTMENT_RATING_PRESENTATION[rating];
}
