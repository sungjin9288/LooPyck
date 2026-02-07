/**
 * ROI Estimator - 비용 절감 시뮬레이션 로직
 * 비즈니스 가치 산출용 유틸리티
 */

export interface RoiInputs {
    monthlyVolume: number;      // 월간 처리 건수
    manualCostPerItem: number;  // 수동 처리 건당 비용 (원)
    manualTimePerItem: number;  // 수동 처리 건당 시간 (분)
    errorRate: number;          // 수동 처리 오류율 (%)
}

export interface RoiOutputs {
    monthlySavings: number;
    annualSavings: number;
    timeSavedHours: number;
    fteFreed: number;           // Full-time Equivalent (명)
    roiPercent: number;
    paybackDays: number;
    details: {
        manualCost: number;
        automatedCost: number;
        systemCost: number;       // LooPyck 운영비 (가정)
    };
}

const AUTOMATED_COST_PER_ITEM = 50; // 원 (AI API + Serverless)
const SYSTEM_MAINTENANCE_COST = 100000; // 월 유지보수비 가정 (원)
const DEVELOPMENT_COST = 5000000; // 초기 도입비 가정 (원)

/**
 * ROI 계산
 */
export function calculateROI(inputs: RoiInputs): RoiOutputs {
    const { monthlyVolume, manualCostPerItem, manualTimePerItem } = inputs;

    // 1. 수동 비용 (월간)
    const manualMonthlyCost = monthlyVolume * manualCostPerItem;

    // 2. 자동화 비용 (월간)
    // 건당 비용 + 월 고정비
    const automatedMonthlyCost = (monthlyVolume * AUTOMATED_COST_PER_ITEM) + SYSTEM_MAINTENANCE_COST;

    // 3. 절감액
    const monthlySavings = manualMonthlyCost - automatedMonthlyCost;
    const annualSavings = monthlySavings * 12;

    // 4. 시간 절감
    const manualHours = (monthlyVolume * manualTimePerItem) / 60;
    const automatedHours = (monthlyVolume * 2) / 3600; // 건당 2초 가정
    const timeSavedHours = manualHours - automatedHours;

    // 5. FTE (월 160시간 기준)
    const fteFreed = timeSavedHours / 160;

    // 6. ROI % (1년 기준)
    // ROI = (Net Profit / Investment) * 100
    // Investment = Development Cost + (Maintenance * 12)
    const totalInvestment = DEVELOPMENT_COST + (SYSTEM_MAINTENANCE_COST * 12);
    const netProfit = annualSavings - DEVELOPMENT_COST; // 이미 automatedCost에 유지비 포함됨
    const roiPercent = (netProfit / totalInvestment) * 100;

    // 7. 회수 기간 (일)
    const dailySavings = monthlySavings / 30;
    const paybackDays = DEVELOPMENT_COST / dailySavings;

    return {
        monthlySavings: Math.round(monthlySavings),
        annualSavings: Math.round(annualSavings),
        timeSavedHours: Math.round(timeSavedHours),
        fteFreed: parseFloat(fteFreed.toFixed(2)),
        roiPercent: Math.round(roiPercent),
        paybackDays: Math.ceil(paybackDays),
        details: {
            manualCost: manualMonthlyCost,
            automatedCost: automatedMonthlyCost,
            systemCost: SYSTEM_MAINTENANCE_COST,
        },
    };
}

/**
 * 기본값 제공
 */
export const DEFAULT_ROI_INPUTS: RoiInputs = {
    monthlyVolume: 1000,
    manualCostPerItem: 25000,
    manualTimePerItem: 15,
    errorRate: 5,
};
