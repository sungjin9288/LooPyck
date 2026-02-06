/**
 * ROI Calculator - 에이전트 도입 비용 절감 및 수익 분석
 * 컨설턴트 브리핑 수준의 비즈니스 데이터 제공
 */

import { businessModel, TIER_CONFIGS, AFFILIATE_CONFIGS } from './businessModel';

// 비용 상수
const COST_CONSTANTS = {
    // 인건비 (수동 분석)
    MANUAL_ANALYSIS_COST: 25000,      // ₩25,000/건 (주니어 MD 시급 기준)
    MANUAL_ANALYSIS_TIME_MIN: 15,     // 15분/건

    // 에이전트 자동화 비용
    AGENT_API_COST: 50,               // ₩50/건 (Gemini API)
    AGENT_INFRA_COST_MONTHLY: 0,      // ₩0 (Vercel Free Tier)

    // 개발 투자
    DEVELOPMENT_HOURS: 200,           // 개발 시간
    DEVELOPER_HOURLY_RATE: 50000,     // ₩50,000/시간
} as const;

// ROI 분석 결과
export interface ROIAnalysis {
    // 비용 절감
    savingsPerAnalysis: number;
    monthlySavings: number;
    annualSavings: number;
    savingsPercentage: number;

    // 투자 회수
    developmentCost: number;
    breakEvenAnalyses: number;
    breakEvenMonths: number;

    // 효율성
    timesSavedPerMonth: number;   // FTE 환산 시간
    fteEquivalent: number;        // 절감된 인력 수
}

// LTV 분석 결과
export interface LTVAnalysis {
    subscriptionRevenue: number;
    affiliateRevenue: number;
    totalLTV: number;
    revenuePerUser: number;
    monthlyRecurringRevenue: number;
}

// 종합 비즈니스 메트릭
export interface BusinessMetrics {
    roi: ROIAnalysis;
    ltv: LTVAnalysis;
    profitability: {
        grossMargin: number;
        netMargin: number;
        monthlyProfit: number;
        annualProfit: number;
    };
    growth: {
        userGrowthRate: number;
        revenueGrowthRate: number;
        churnRate: number;
    };
}

/**
 * OpEx 절감액 계산
 */
export function calculateOpExSavings(monthlyAnalyses: number): ROIAnalysis {
    const { MANUAL_ANALYSIS_COST, AGENT_API_COST, MANUAL_ANALYSIS_TIME_MIN } = COST_CONSTANTS;

    // 건당 절감액
    const savingsPerAnalysis = MANUAL_ANALYSIS_COST - AGENT_API_COST;
    const savingsPercentage = ((MANUAL_ANALYSIS_COST - AGENT_API_COST) / MANUAL_ANALYSIS_COST) * 100;

    // 월간/연간 절감
    const monthlySavings = savingsPerAnalysis * monthlyAnalyses;
    const annualSavings = monthlySavings * 12;

    // 개발 투자 비용
    const developmentCost = COST_CONSTANTS.DEVELOPMENT_HOURS * COST_CONSTANTS.DEVELOPER_HOURLY_RATE;

    // 손익분기점
    const breakEvenAnalyses = Math.ceil(developmentCost / savingsPerAnalysis);
    const breakEvenMonths = Math.ceil(breakEvenAnalyses / monthlyAnalyses);

    // 시간 절감 (FTE 환산)
    const minutesSavedPerMonth = monthlyAnalyses * MANUAL_ANALYSIS_TIME_MIN;
    const hoursSavedPerMonth = minutesSavedPerMonth / 60;
    const fteEquivalent = hoursSavedPerMonth / (22 * 8); // 월 22일, 일 8시간

    return {
        savingsPerAnalysis,
        monthlySavings,
        annualSavings,
        savingsPercentage: Math.round(savingsPercentage * 10) / 10,
        developmentCost,
        breakEvenAnalyses,
        breakEvenMonths,
        timesSavedPerMonth: Math.round(hoursSavedPerMonth),
        fteEquivalent: Math.round(fteEquivalent * 100) / 100,
    };
}

/**
 * LTV (고객 생애 가치) 계산
 */
export function calculateLTV(
    usersByTier: { free: number; basic: number; pro: number },
    monthlyAffiliateClicks: Record<string, number>,
    avgMonthsRetained: number = 12
): LTVAnalysis {
    // 구독 수익
    const basicRevenue = usersByTier.basic * TIER_CONFIGS.basic.pricePerMonth * avgMonthsRetained;
    const proRevenue = usersByTier.pro * TIER_CONFIGS.pro.pricePerMonth * avgMonthsRetained;
    const subscriptionRevenue = basicRevenue + proRevenue;

    // 제휴 수익
    let affiliateRevenue = 0;
    for (const [mall, clicks] of Object.entries(monthlyAffiliateClicks)) {
        const result = businessModel.affiliateValue(mall, clicks * avgMonthsRetained);
        affiliateRevenue += result.expectedRevenue;
    }

    const totalLTV = subscriptionRevenue + affiliateRevenue;
    const totalUsers = usersByTier.free + usersByTier.basic + usersByTier.pro;
    const revenuePerUser = totalUsers > 0 ? totalLTV / totalUsers : 0;

    // MRR
    const monthlyRecurringRevenue =
        usersByTier.basic * TIER_CONFIGS.basic.pricePerMonth +
        usersByTier.pro * TIER_CONFIGS.pro.pricePerMonth;

    return {
        subscriptionRevenue: Math.round(subscriptionRevenue),
        affiliateRevenue: Math.round(affiliateRevenue),
        totalLTV: Math.round(totalLTV),
        revenuePerUser: Math.round(revenuePerUser),
        monthlyRecurringRevenue: Math.round(monthlyRecurringRevenue),
    };
}

/**
 * 에이전트 ROI 종합 분석
 */
export function calculateAgentROI(
    monthlyAnalyses: number,
    monthsOperating: number = 12
): {
    investmentCost: number;
    totalSavings: number;
    totalRevenue: number;
    netROI: number;
    roiPercentage: number;
} {
    const savings = calculateOpExSavings(monthlyAnalyses);
    const totalSavings = savings.monthlySavings * monthsOperating;

    // 예상 수익 (가정: 월 1000명 사용자)
    const estimatedRevenue = calculateLTV(
        { free: 800, basic: 150, pro: 50 },
        { musinsa: 500, '29cm': 300, wconcept: 200 },
        monthsOperating
    ).totalLTV;

    const investmentCost = savings.developmentCost;
    const netROI = totalSavings + estimatedRevenue - investmentCost;
    const roiPercentage = (netROI / investmentCost) * 100;

    return {
        investmentCost,
        totalSavings: Math.round(totalSavings),
        totalRevenue: Math.round(estimatedRevenue),
        netROI: Math.round(netROI),
        roiPercentage: Math.round(roiPercentage),
    };
}

/**
 * 연간 비용 절감 예측
 */
export function projectAnnualSavings(
    currentMonthlyAnalyses: number,
    growthRatePercent: number = 10
): {
    year1: number;
    year2: number;
    year3: number;
    total3Years: number;
} {
    const calculateYearSavings = (monthlyStart: number, growthRate: number): number => {
        let total = 0;
        let monthly = monthlyStart;
        for (let month = 1; month <= 12; month++) {
            total += calculateOpExSavings(monthly).monthlySavings;
            monthly *= (1 + growthRate / 100 / 12);
        }
        return total;
    };

    const year1 = calculateYearSavings(currentMonthlyAnalyses, growthRatePercent);
    const year2 = calculateYearSavings(currentMonthlyAnalyses * (1 + growthRatePercent / 100), growthRatePercent);
    const year3 = calculateYearSavings(currentMonthlyAnalyses * Math.pow(1 + growthRatePercent / 100, 2), growthRatePercent);

    return {
        year1: Math.round(year1),
        year2: Math.round(year2),
        year3: Math.round(year3),
        total3Years: Math.round(year1 + year2 + year3),
    };
}

/**
 * 컨설턴트 브리핑용 요약 리포트
 */
export function generateExecutiveSummary(monthlyAnalyses: number = 1000): string {
    const roi = calculateOpExSavings(monthlyAnalyses);
    const agentROI = calculateAgentROI(monthlyAnalyses);
    const projection = projectAnnualSavings(monthlyAnalyses);

    return `
## 📊 LooPyck ROI Executive Summary

### 💰 비용 절감
- **건당 절감액**: ₩${roi.savingsPerAnalysis.toLocaleString()} (${roi.savingsPercentage}% 절감)
- **월간 절감액**: ₩${roi.monthlySavings.toLocaleString()}
- **연간 절감액**: ₩${roi.annualSavings.toLocaleString()}

### ⏱️ 인력 효율
- **월간 절감 시간**: ${roi.timesSavedPerMonth}시간
- **FTE 환산**: ${roi.fteEquivalent}명

### 📈 투자 회수
- **개발 투자**: ₩${roi.developmentCost.toLocaleString()}
- **손익분기점**: ${roi.breakEvenAnalyses.toLocaleString()}건 (${roi.breakEvenMonths}개월)
- **ROI**: ${agentROI.roiPercentage}%

### 🔮 3개년 예측
- **1년차**: ₩${projection.year1.toLocaleString()}
- **2년차**: ₩${projection.year2.toLocaleString()}
- **3년차**: ₩${projection.year3.toLocaleString()}
- **3년 총계**: ₩${projection.total3Years.toLocaleString()}
`.trim();
}

// Export for external use
export const roiCalculator = {
    calculateOpExSavings,
    calculateLTV,
    calculateAgentROI,
    projectAnnualSavings,
    generateExecutiveSummary,
    COST_CONSTANTS,
};
