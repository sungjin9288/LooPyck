/**
 * Business Model Layer
 * Freemium 쿼터 관리, 전환 시점 계산, Affiliate 가치 추적
 */

// 사용자 티어
export type UserTier = 'free' | 'basic' | 'pro';

// 티어별 설정
export interface TierConfig {
    name: string;
    nameKo: string;
    aiAnalysisLimit: number;
    conversionTrigger: number | null; // 전환 유도 시점
    pricePerMonth: number;
    features: string[];
}

export const TIER_CONFIGS: Record<UserTier, TierConfig> = {
    free: {
        name: 'Free',
        nameKo: '무료',
        aiAnalysisLimit: 10,
        conversionTrigger: 8, // 80% 사용 시 전환 유도
        pricePerMonth: 0,
        features: [
            'AI 상품 분석 10회/월',
            '가격 비교 무제한',
            '기본 추천',
        ],
    },
    basic: {
        name: 'Basic',
        nameKo: '베이직',
        aiAnalysisLimit: 100,
        conversionTrigger: 80,
        pricePerMonth: 4900,
        features: [
            'AI 상품 분석 100회/월',
            '트렌드 인사이트',
            '소재 상세 분석',
            '스타일 매칭 추천',
        ],
    },
    pro: {
        name: 'Pro',
        nameKo: '프로',
        aiAnalysisLimit: Infinity,
        conversionTrigger: null,
        pricePerMonth: 9900,
        features: [
            'AI 상품 분석 무제한',
            '우선 분석 큐',
            'API 접근',
            '맞춤 트렌드 알림',
            '프리미엄 지원',
        ],
    },
};

// 사용자 쿼터 상태
export interface QuotaStatus {
    tier: UserTier;
    used: number;
    limit: number;
    remaining: number;
    usagePercentage: number;
    shouldShowUpgrade: boolean;
    resetDate: Date;
}

// Affiliate 설정
export interface AffiliateConfig {
    mall: string;
    commissionRate: number; // 0-1 (예: 0.03 = 3%)
    averageOrderValue: number; // 평균 주문 금액
    conversionRate: number; // 클릭→구매 전환율
}

export const AFFILIATE_CONFIGS: Record<string, AffiliateConfig> = {
    musinsa: { mall: '무신사', commissionRate: 0.03, averageOrderValue: 65000, conversionRate: 0.025 },
    '29cm': { mall: '29cm', commissionRate: 0.04, averageOrderValue: 85000, conversionRate: 0.02 },
    wconcept: { mall: 'W컨셉', commissionRate: 0.05, averageOrderValue: 95000, conversionRate: 0.018 },
    zigzag: { mall: '지그재그', commissionRate: 0.025, averageOrderValue: 35000, conversionRate: 0.035 },
    ssf: { mall: 'SSF샵', commissionRate: 0.035, averageOrderValue: 75000, conversionRate: 0.022 },
    ably: { mall: '에이블리', commissionRate: 0.028, averageOrderValue: 28000, conversionRate: 0.04 },
    handsome: { mall: '한섬', commissionRate: 0.045, averageOrderValue: 150000, conversionRate: 0.015 },
};

/**
 * 쿼터 사용량 확인
 */
export function checkQuotaUsage(
    tier: UserTier,
    used: number,
    resetDate?: Date
): QuotaStatus {
    const config = TIER_CONFIGS[tier];
    const limit = config.aiAnalysisLimit;
    const remaining = Math.max(0, limit - used);
    const usagePercentage = limit === Infinity ? 0 : Math.round((used / limit) * 100);

    // 전환 유도 여부
    const shouldShowUpgrade =
        config.conversionTrigger !== null &&
        used >= config.conversionTrigger &&
        tier !== 'pro';

    return {
        tier,
        used,
        limit,
        remaining,
        usagePercentage,
        shouldShowUpgrade,
        resetDate: resetDate || getNextMonthReset(),
    };
}

/**
 * 다음 달 리셋 날짜
 */
function getNextMonthReset(): Date {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 1);
}

/**
 * 전환 시점 계산 및 메시지 생성
 */
export function calculateConversionTiming(status: QuotaStatus): {
    shouldConvert: boolean;
    urgency: 'low' | 'medium' | 'high';
    message: string;
    suggestedTier: UserTier | null;
} {
    if (!status.shouldShowUpgrade) {
        return {
            shouldConvert: false,
            urgency: 'low',
            message: '',
            suggestedTier: null,
        };
    }

    const { tier, remaining, usagePercentage } = status;

    // 긴급도 계산
    let urgency: 'low' | 'medium' | 'high';
    if (remaining <= 0) {
        urgency = 'high';
    } else if (usagePercentage >= 90) {
        urgency = 'high';
    } else if (usagePercentage >= 80) {
        urgency = 'medium';
    } else {
        urgency = 'low';
    }

    // 추천 티어
    const suggestedTier: UserTier = tier === 'free' ? 'basic' : 'pro';
    const suggestedConfig = TIER_CONFIGS[suggestedTier];

    // 메시지 생성
    let message: string;
    if (remaining <= 0) {
        message = `이번 달 AI 분석 횟수를 모두 사용했어요. ${suggestedConfig.nameKo} 플랜으로 업그레이드하고 ${suggestedConfig.aiAnalysisLimit === Infinity ? '무제한' : suggestedConfig.aiAnalysisLimit + '회'} 분석을 이용하세요!`;
    } else if (urgency === 'high') {
        message = `AI 분석이 ${remaining}회 남았어요. 충분히 활용하고 계시네요! 더 많은 분석이 필요하다면 ${suggestedConfig.nameKo} 플랜을 확인해보세요.`;
    } else {
        message = `${suggestedConfig.nameKo} 플랜에서 더 많은 기능을 이용할 수 있어요.`;
    }

    return {
        shouldConvert: true,
        urgency,
        message,
        suggestedTier,
    };
}

/**
 * Affiliate 클릭 가치 계산
 */
export function calculateAffiliateValue(
    mall: string,
    clicks: number
): {
    expectedRevenue: number;
    expectedConversions: number;
    revenuePerClick: number;
} {
    const config = AFFILIATE_CONFIGS[mall.toLowerCase()];

    if (!config) {
        return {
            expectedRevenue: 0,
            expectedConversions: 0,
            revenuePerClick: 0,
        };
    }

    const expectedConversions = clicks * config.conversionRate;
    const expectedRevenue = expectedConversions * config.averageOrderValue * config.commissionRate;
    const revenuePerClick = clicks > 0 ? expectedRevenue / clicks : 0;

    return {
        expectedRevenue: Math.round(expectedRevenue),
        expectedConversions: Math.round(expectedConversions * 100) / 100,
        revenuePerClick: Math.round(revenuePerClick),
    };
}

/**
 * 전체 Affiliate 수익 예측
 */
export function calculateTotalAffiliateRevenue(
    clicksByMall: Record<string, number>
): {
    totalRevenue: number;
    byMall: Record<string, number>;
    topPerformer: string;
} {
    let totalRevenue = 0;
    const byMall: Record<string, number> = {};
    let topPerformer = '';
    let topRevenue = 0;

    for (const [mall, clicks] of Object.entries(clicksByMall)) {
        const result = calculateAffiliateValue(mall, clicks);
        byMall[mall] = result.expectedRevenue;
        totalRevenue += result.expectedRevenue;

        if (result.expectedRevenue > topRevenue) {
            topRevenue = result.expectedRevenue;
            topPerformer = mall;
        }
    }

    return {
        totalRevenue: Math.round(totalRevenue),
        byMall,
        topPerformer,
    };
}

/**
 * 사용자 가치 점수 (LTV 예측)
 */
export function calculateUserValue(
    tier: UserTier,
    monthsActive: number,
    totalAnalyses: number,
    affiliateClicks: number
): {
    ltv: number;
    engagementScore: number;
    tierValue: number;
    affiliateValue: number;
} {
    const tierConfig = TIER_CONFIGS[tier];

    // 티어별 직접 수익
    const tierValue = tierConfig.pricePerMonth * monthsActive;

    // Affiliate 간접 수익 (평균 전환율 가정)
    const avgCommission = 500;
    const avgConversionRate = 0.025;
    const affiliateValue = affiliateClicks * avgConversionRate * avgCommission;

    // LTV
    const ltv = tierValue + affiliateValue;

    // 참여도 점수
    const analysesPerMonth = monthsActive > 0 ? totalAnalyses / monthsActive : 0;
    const clicksPerMonth = monthsActive > 0 ? affiliateClicks / monthsActive : 0;
    const engagementScore = Math.min(100, Math.round(
        (analysesPerMonth / 10) * 30 + // 분석 활동
        (clicksPerMonth / 5) * 30 + // 클릭 활동
        (tier === 'pro' ? 40 : tier === 'basic' ? 20 : 0) // 유료 전환
    ));

    return {
        ltv: Math.round(ltv),
        engagementScore,
        tierValue: Math.round(tierValue),
        affiliateValue: Math.round(affiliateValue),
    };
}

// costTracker 연동용 export
export const businessModel = {
    tiers: TIER_CONFIGS,
    affiliates: AFFILIATE_CONFIGS,
    checkQuota: checkQuotaUsage,
    conversionTiming: calculateConversionTiming,
    affiliateValue: calculateAffiliateValue,
    totalAffiliateRevenue: calculateTotalAffiliateRevenue,
    userValue: calculateUserValue,
};
