/**
 * Cross-Industry Stats - 산업별 ROI 시뮬레이션
 * 타 산업 적용 시 예상 비용 절감액 계산
 */

// 산업별 기본 비용 상수
export const INDUSTRY_COSTS = {
    fashion: {
        manualCostPerItem: 25000,
        automatedCostPerItem: 50,
        avgProcessingTimeMin: 15,
        errorRate: 0.05,
        label: '패션 커머스',
    },
    realestate: {
        manualCostPerItem: 15000,
        automatedCostPerItem: 30,
        avgProcessingTimeMin: 20,
        errorRate: 0.08,
        label: '부동산 매물',
    },
    news: {
        manualCostPerItem: 5000,
        automatedCostPerItem: 20,
        avgProcessingTimeMin: 10,
        errorRate: 0.03,
        label: '뉴스 모니터링',
    },
    government: {
        manualCostPerItem: 20000,
        automatedCostPerItem: 40,
        avgProcessingTimeMin: 25,
        errorRate: 0.04,
        label: '공공 공고',
    },
    ecommerce: {
        manualCostPerItem: 18000,
        automatedCostPerItem: 35,
        avgProcessingTimeMin: 12,
        errorRate: 0.06,
        label: '이커머스 일반',
    },
} as const;

export type IndustryType = keyof typeof INDUSTRY_COSTS;

// ROI 시뮬레이션 결과
export interface IndustryROI {
    industry: IndustryType;
    label: string;
    monthlyVolume: number;

    // 비용
    manualMonthlyCost: number;
    automatedMonthlyCost: number;
    monthlySavings: number;
    annualSavings: number;

    // 비율
    costReductionRate: number;

    // 시간
    manualHoursPerMonth: number;
    automatedHoursPerMonth: number;
    timeSavedHours: number;
    fteEquivalent: number;

    // 투자 회수
    developmentCost: number;
    paybackDays: number;
    firstYearROI: number;
}

// 개발 비용 상수
const DEVELOPMENT_COST = 4000000; // ₩400만 (2주 개발)
const MONTHLY_MAINTENANCE = 500000; // ₩50만/월

/**
 * 산업별 ROI 시뮬레이션
 */
export function simulateIndustryROI(
    industry: IndustryType,
    monthlyVolume: number
): IndustryROI {
    const costs = INDUSTRY_COSTS[industry];

    // 비용 계산
    const manualMonthlyCost = costs.manualCostPerItem * monthlyVolume;
    const automatedMonthlyCost = costs.automatedCostPerItem * monthlyVolume;
    const monthlySavings = manualMonthlyCost - automatedMonthlyCost;
    const annualSavings = monthlySavings * 12;

    // 비용 절감률
    const costReductionRate = ((costs.manualCostPerItem - costs.automatedCostPerItem) / costs.manualCostPerItem) * 100;

    // 시간 계산
    const manualHoursPerMonth = (costs.avgProcessingTimeMin * monthlyVolume) / 60;
    const automatedHoursPerMonth = (2 * monthlyVolume) / 60; // 2초/건
    const timeSavedHours = manualHoursPerMonth - automatedHoursPerMonth;
    const fteEquivalent = timeSavedHours / (22 * 8); // 월 22일, 일 8시간

    // 투자 회수
    const developmentCost = DEVELOPMENT_COST;
    const yearlyMaintenance = MONTHLY_MAINTENANCE * 12;
    const totalFirstYearCost = developmentCost + yearlyMaintenance;
    const paybackDays = Math.ceil((developmentCost / monthlySavings) * 30);
    const firstYearROI = ((annualSavings - totalFirstYearCost) / totalFirstYearCost) * 100;

    return {
        industry,
        label: costs.label,
        monthlyVolume,
        manualMonthlyCost,
        automatedMonthlyCost,
        monthlySavings,
        annualSavings,
        costReductionRate: Math.round(costReductionRate * 10) / 10,
        manualHoursPerMonth: Math.round(manualHoursPerMonth),
        automatedHoursPerMonth: Math.round(automatedHoursPerMonth * 10) / 10,
        timeSavedHours: Math.round(timeSavedHours),
        fteEquivalent: Math.round(fteEquivalent * 100) / 100,
        developmentCost,
        paybackDays,
        firstYearROI: Math.round(firstYearROI),
    };
}

/**
 * 모든 산업 비교 레포트
 */
export function generateCrossIndustryReport(monthlyVolume: number = 1000): {
    industries: IndustryROI[];
    summary: {
        avgCostReduction: number;
        totalAnnualSavings: number;
        avgPaybackDays: number;
    };
} {
    const industries = Object.keys(INDUSTRY_COSTS).map(industry =>
        simulateIndustryROI(industry as IndustryType, monthlyVolume)
    );

    const avgCostReduction = industries.reduce((s, i) => s + i.costReductionRate, 0) / industries.length;
    const totalAnnualSavings = industries.reduce((s, i) => s + i.annualSavings, 0);
    const avgPaybackDays = industries.reduce((s, i) => s + i.paybackDays, 0) / industries.length;

    return {
        industries,
        summary: {
            avgCostReduction: Math.round(avgCostReduction * 10) / 10,
            totalAnnualSavings,
            avgPaybackDays: Math.round(avgPaybackDays),
        },
    };
}

/**
 * 커스텀 산업 시뮬레이션
 */
export function simulateCustomIndustry(
    label: string,
    manualCostPerItem: number,
    automatedCostPerItem: number,
    avgProcessingTimeMin: number,
    monthlyVolume: number
): IndustryROI {
    const customIndustry = {
        manualCostPerItem,
        automatedCostPerItem,
        avgProcessingTimeMin,
        errorRate: 0.05,
        label,
    };

    // 일시적으로 커스텀 산업 추가
    const result = simulateIndustryROI('fashion', monthlyVolume);

    // 커스텀 값으로 재계산
    result.label = label;
    result.manualMonthlyCost = manualCostPerItem * monthlyVolume;
    result.automatedMonthlyCost = automatedCostPerItem * monthlyVolume;
    result.monthlySavings = result.manualMonthlyCost - result.automatedMonthlyCost;
    result.annualSavings = result.monthlySavings * 12;
    result.costReductionRate = Math.round(((manualCostPerItem - automatedCostPerItem) / manualCostPerItem) * 1000) / 10;
    result.manualHoursPerMonth = Math.round((avgProcessingTimeMin * monthlyVolume) / 60);
    result.timeSavedHours = result.manualHoursPerMonth - Math.round((2 * monthlyVolume) / 60);
    result.fteEquivalent = Math.round((result.timeSavedHours / (22 * 8)) * 100) / 100;
    result.paybackDays = Math.ceil((DEVELOPMENT_COST / result.monthlySavings) * 30);

    return result;
}

/**
 * 포맷된 레포트 문자열 생성
 */
export function formatROIReport(roi: IndustryROI): string {
    return `
## ${roi.label} ROI 시뮬레이션

### 비용 분석 (월 ${roi.monthlyVolume.toLocaleString()}건 기준)

| 항목 | 수동 | 자동화 | 차이 |
|------|------|--------|------|
| 월간 비용 | ₩${roi.manualMonthlyCost.toLocaleString()} | ₩${roi.automatedMonthlyCost.toLocaleString()} | -${roi.costReductionRate}% |
| 연간 비용 | ₩${(roi.manualMonthlyCost * 12).toLocaleString()} | ₩${(roi.automatedMonthlyCost * 12).toLocaleString()} | -${roi.costReductionRate}% |

### 시간 절감

| 항목 | 값 |
|------|-----|
| 월간 시간 절감 | ${roi.timeSavedHours}시간 |
| FTE 환산 | ${roi.fteEquivalent}명 |

### 투자 회수

| 항목 | 값 |
|------|-----|
| 개발 비용 | ₩${roi.developmentCost.toLocaleString()} |
| 회수 기간 | ${roi.paybackDays}일 |
| 1년차 ROI | ${roi.firstYearROI}% |
| 연간 절감 | ₩${roi.annualSavings.toLocaleString()} |
`.trim();
}

// Export
export const crossIndustryStats = {
    INDUSTRY_COSTS,
    simulate: simulateIndustryROI,
    report: generateCrossIndustryReport,
    custom: simulateCustomIndustry,
    format: formatROIReport,
};
