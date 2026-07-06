import type { UnifiedProduct } from '../api/types.ts';

/** 중앙값 대비 저가 임계 비율 — 이보다 싸면 부자재/더미가격 후보 */
const LOW_PRICE_RATIO = 0.1;
/** 절대 상한 — 고가 카테고리에서 정상 보급형까지 지워지는 것 방지 */
const LOW_PRICE_ABSOLUTE_CAP = 3_000;
/** 중앙값을 신뢰할 최소 결과 수 */
const MIN_PRODUCTS_FOR_FILTER = 8;
/** 이 비율을 초과해 지우게 되면 카테고리 자체가 저가라고 보고 필터링 포기 */
const MAX_DROP_RATIO = 0.3;

/**
 * 검색 결과에서 극단 저가 노이즈(지퍼 고리·부자재·스티커·단체복 견적용
 * 더미가격 리스팅)를 걸러낸다. 실측 사례: "후드집업" 검색에 20원~480원짜리
 * 수선 부자재 12개가 가격 오름차순 최상단을 점유.
 *
 * 임계값 = min(3,000원, 중앙값 × 10%) — 두 방향 모두 보수적:
 * - 고가 카테고리(중앙값 30만원)에서 비율 기준(3만원)이 아닌 상한(3천원) 적용
 * - 저가 카테고리(중앙값 3천원)에서 비율 기준(300원)으로 자연 축소
 *
 * 안전 가드: 결과 8개 미만이면 스킵, 30% 초과를 지우게 되면 스킵.
 * 보존 아이템의 순서는 유지되고 입력은 변형되지 않는다.
 */
export function filterLowPriceOutliers(products: UnifiedProduct[]): UnifiedProduct[] {
    if (products.length < MIN_PRODUCTS_FOR_FILTER) {
        return products;
    }

    const sortedPrices = products
        .map((product) => product.price)
        .filter((price) => Number.isFinite(price) && price > 0)
        .sort((left, right) => left - right);

    if (sortedPrices.length < MIN_PRODUCTS_FOR_FILTER) {
        return products;
    }

    const median = sortedPrices[Math.floor(sortedPrices.length / 2)];
    const threshold = Math.min(LOW_PRICE_ABSOLUTE_CAP, median * LOW_PRICE_RATIO);

    const kept = products.filter((product) => product.price >= threshold);
    const droppedCount = products.length - kept.length;

    if (droppedCount === 0 || droppedCount > products.length * MAX_DROP_RATIO) {
        return products;
    }

    return kept;
}
