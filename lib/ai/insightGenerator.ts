/**
 * Insight Generator - 가성비 점수 및 소재 주의사항 생성
 * Pure Functions for testability
 */

import type { AIExtractedProduct } from '@/types/aiExtraction';

// 소재 타입
type MaterialType = AIExtractedProduct['material'];

// 소재별 관리 난이도
const MATERIAL_CARE_DIFFICULTY: Record<MaterialType, number> = {
    cotton: 2,      // 쉬움
    polyester: 1,   // 매우 쉬움
    nylon: 1,       // 매우 쉬움
    wool: 4,        // 어려움
    linen: 3,       // 보통
    silk: 5,        // 매우 어려움
    leather: 5,     // 매우 어려움
    denim: 2,       // 쉬움
    knit: 3,        // 보통
    fleece: 1,      // 매우 쉬움
    mixed: 3,       // 보통
    unknown: 3,     // 보통
};

// 소재별 내구성
const MATERIAL_DURABILITY: Record<MaterialType, number> = {
    cotton: 7,
    polyester: 9,
    nylon: 9,
    wool: 6,
    linen: 6,
    silk: 4,
    leather: 8,
    denim: 9,
    knit: 5,
    fleece: 6,
    mixed: 7,
    unknown: 5,
};

// 소재별 평균 가격대 (기준)
const MATERIAL_PRICE_BASELINE: Record<MaterialType, number> = {
    cotton: 30000,
    polyester: 25000,
    nylon: 35000,
    wool: 80000,
    linen: 60000,
    silk: 100000,
    leather: 150000,
    denim: 50000,
    knit: 45000,
    fleece: 35000,
    mixed: 40000,
    unknown: 50000,
};

// 소재별 주의사항
const MATERIAL_WARNINGS: Record<MaterialType, string[]> = {
    wool: ['드라이클리닝 권장', '습기 주의', '보풀 발생 가능'],
    silk: ['세탁기 사용 금지', '직사광선 피해 보관', '얼룩 주의'],
    leather: ['물 접촉 금지', '전용 크림으로 관리', '습기 피해 보관'],
    linen: ['구김 발생 쉬움', '첫 세탁 시 수축 가능'],
    knit: ['늘어남 주의', '건조기 사용 금지'],
    cotton: ['첫 세탁 시 약간의 수축 가능'],
    polyester: [],
    nylon: [],
    denim: ['첫 세탁 시 색 빠짐 가능', '단독 세탁 권장'],
    fleece: ['정전기 발생 가능'],
    mixed: ['세탁 라벨 확인 필수'],
    unknown: ['세탁 라벨 확인 필수'],
};

// 스타일 팁
const SILHOUETTE_TIPS: Record<AIExtractedProduct['silhouette'], string> = {
    fitted: '몸에 딱 맞는 핏으로 슬림한 실루엣을 연출해요',
    regular: '편안하면서도 깔끔한 기본 핏이에요',
    relaxed: '여유로운 핏으로 캐주얼하게 연출할 수 있어요',
    oversized: '트렌디한 오버핏으로 레이어링에 좋아요',
    boxy: '각진 실루엣으로 모던한 느낌을 줘요',
    slim: '슬림한 핏으로 세련된 느낌을 연출해요',
    straight: '직선적인 라인으로 클래식한 느낌이에요',
    wide: '와이드 핏으로 편안하고 트렌디해요',
    unknown: '상세 핏 정보를 확인해보세요',
};

/**
 * 가성비 점수 계산 (Pure Function)
 * @returns 0-100 (높을수록 가성비 좋음)
 */
export function generateValueScore(product: Pick<AIExtractedProduct, 'material' | 'price' | 'materialConfidence'>): {
    score: number;
    label: string;
    description: string;
} {
    const { material, price, materialConfidence } = product;

    const baseline = MATERIAL_PRICE_BASELINE[material] || 50000;
    const durability = MATERIAL_DURABILITY[material] || 5;

    // 가격 대비 점수 (저렴할수록 높음)
    const priceRatio = baseline / Math.max(price, 1000);
    const priceScore = Math.min(priceRatio * 50, 50); // 최대 50점

    // 내구성 점수 (최대 30점)
    const durabilityScore = (durability / 10) * 30;

    // 신뢰도 보너스 (최대 20점)
    const confidenceBonus = (materialConfidence || 0.5) * 20;

    const totalScore = Math.round(Math.min(priceScore + durabilityScore + confidenceBonus, 100));

    // 라벨 결정
    let label: string;
    let description: string;

    if (totalScore >= 80) {
        label = '최고 가성비 💎';
        description = '가격 대비 품질이 매우 우수해요';
    } else if (totalScore >= 60) {
        label = '가성비 좋음 👍';
        description = '합리적인 가격의 좋은 선택이에요';
    } else if (totalScore >= 40) {
        label = '보통 😐';
        description = '평균적인 가성비예요';
    } else {
        label = '가격대 높음 💸';
        description = '프리미엄 소재나 브랜드 가치를 고려해보세요';
    }

    return { score: totalScore, label, description };
}

/**
 * 소재 주의사항 생성 (Pure Function)
 */
export function generateMaterialWarning(material: MaterialType): {
    careDifficulty: number;
    warnings: string[];
    tip: string;
} {
    const careDifficulty = MATERIAL_CARE_DIFFICULTY[material] || 3;
    const warnings = MATERIAL_WARNINGS[material] || [];

    let tip: string;
    if (careDifficulty <= 2) {
        tip = '관리가 쉬운 소재예요! 편하게 입으세요 👕';
    } else if (careDifficulty <= 3) {
        tip = '기본적인 관리만 해주시면 돼요 ✨';
    } else {
        tip = '꼼꼼한 관리가 필요한 소재예요. 세탁법을 확인하세요! 🧽';
    }

    return { careDifficulty, warnings, tip };
}

/**
 * 스타일 팁 생성 (Pure Function)
 */
export function generateStyleTip(product: Pick<AIExtractedProduct, 'silhouette' | 'fit' | 'styleCategory'>): {
    silhouetteTip: string;
    fitAdvice: string;
    styleAdvice: string;
} {
    const silhouetteTip = SILHOUETTE_TIPS[product.silhouette] || SILHOUETTE_TIPS.unknown;

    // 핏 조언
    let fitAdvice: string;
    switch (product.fit) {
        case 'slim':
            fitAdvice = '평소 사이즈로 착용하시면 딱 맞아요';
            break;
        case 'regular':
            fitAdvice = '편안한 착용감을 원하시면 평소 사이즈 추천';
            break;
        case 'oversized':
            fitAdvice = '여유있는 핏이니 사이즈 다운도 고려해보세요';
            break;
        default:
            fitAdvice = '리뷰에서 사이즈 정보를 확인해보세요';
    }

    // 스타일 조언
    let styleAdvice: string;
    switch (product.styleCategory) {
        case 'casual':
            styleAdvice = '데일리룩으로 편하게 입기 좋아요';
            break;
        case 'formal':
            styleAdvice = '깔끔한 자리에 어울리는 아이템이에요';
            break;
        case 'streetwear':
            styleAdvice = '스트릿 감성의 트렌디한 아이템!';
            break;
        case 'athleisure':
            styleAdvice = '활동적인 날에 딱 맞는 스타일이에요';
            break;
        case 'classic':
            styleAdvice = '시간이 지나도 변치 않는 클래식 아이템';
            break;
        case 'minimal':
            styleAdvice = '미니멀한 스타일링에 잘 어울려요';
            break;
        default:
            styleAdvice = '다양한 스타일링이 가능해요';
    }

    return { silhouetteTip, fitAdvice, styleAdvice };
}

/**
 * 종합 인사이트 생성
 */
export function generateProductInsight(product: AIExtractedProduct): {
    valueScore: ReturnType<typeof generateValueScore>;
    materialWarning: ReturnType<typeof generateMaterialWarning>;
    styleTip: ReturnType<typeof generateStyleTip>;
    summary: string;
} {
    const valueScore = generateValueScore(product);
    const materialWarning = generateMaterialWarning(product.material);
    const styleTip = generateStyleTip(product);

    // 요약 메시지 생성
    const summaryParts: string[] = [];

    if (valueScore.score >= 70) {
        summaryParts.push('가성비 좋은 아이템');
    }
    if (materialWarning.careDifficulty >= 4) {
        summaryParts.push('관리에 주의 필요');
    }
    if (product.confidence >= 0.9) {
        summaryParts.push('정확한 정보');
    }

    const summary = summaryParts.length > 0
        ? summaryParts.join(' • ')
        : '자세한 정보는 상품 페이지에서 확인하세요';

    return { valueScore, materialWarning, styleTip, summary };
}
