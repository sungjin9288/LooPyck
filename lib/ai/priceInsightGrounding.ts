/**
 * Price insight grounding — turns a deterministic price verdict (computed from
 * REAL collected history via computePriceVerdict) into a Korean grounding block
 * for the ai-insight prompt. This forces the model to base its
 * price-reasonableness judgment on actual numbers instead of hallucinating,
 * and to stay conservative when there is no history to stand on.
 */

import type { PriceVerdict } from '@/lib/product/priceVerdict';

export function buildPriceGroundingBlock(verdict: PriceVerdict): string {
    if (verdict.level === 'insufficient') {
        return [
            '[실제 가격 이력]',
            '- 수집된 가격 데이터가 부족해 통계적으로 판단할 수 없습니다.',
            '- 가격이 싸다/비싸다고 단정하지 마세요. "가격 합리성" 점수는 50점 내외로 보수적으로 평가하고, note에 데이터 부족을 명시하세요.',
        ].join('\n');
    }

    const vsAvgText =
        verdict.vsAveragePct <= 0
            ? `평균보다 ${Math.abs(verdict.vsAveragePct)}% 낮음`
            : `평균보다 ${verdict.vsAveragePct}% 높음`;

    return [
        '[실제 가격 이력 — 아래 수치에만 근거해 가격을 평가하세요]',
        `- 최근 ${verdict.sampleSize}회 수집 기준`,
        `- 역대 최저가: ${verdict.lowest.toLocaleString()}원 / 역대 최고가: ${verdict.highest.toLocaleString()}원`,
        `- 평균가: ${verdict.average.toLocaleString()}원 / 중앙값: ${verdict.median.toLocaleString()}원`,
        `- 현재가: ${verdict.currentPrice.toLocaleString()}원 (${vsAvgText}, 과거 수집가 중 현재가보다 쌌던 비율 ${verdict.percentile}%)`,
        `- 결정론적 판정: ${verdict.label} (${verdict.reason})`,
        '"가격 합리성" factor는 위 실제 데이터에 근거해 평가하고 절대 추측하지 마세요.',
    ].join('\n');
}
