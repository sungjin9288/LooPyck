import type { ProductSource, UnifiedProduct } from '../api/types.ts';
import type { GroupingQualityEntry, GroupingQualityThresholds } from './groupingQuality.ts';

type ProductFixture = Pick<
    UnifiedProduct,
    'id' | 'title' | 'price' | 'mallName' | 'source' | 'brand' | 'category1' | 'category2'
> & Partial<Pick<UnifiedProduct, 'normalizedTitle' | 'optionSummary' | 'colorOptions' | 'sizeOptions'>>;

function fixtureProduct(fixture: ProductFixture): UnifiedProduct {
    return {
        ...fixture,
        image: `https://example.com/grouping-quality/${fixture.id}.jpg`,
        link: `https://example.com/grouping-quality/${fixture.id}`,
    };
}

function entry(expectedGroupId: string, fixture: Omit<ProductFixture, 'source'> & { source: ProductSource }): GroupingQualityEntry {
    return {
        expectedGroupId,
        product: fixtureProduct(fixture),
    };
}

export const GROUPING_QUALITY_THRESHOLDS: GroupingQualityThresholds = {
    minimumSamples: 12,
    minimumPositivePairs: 3,
    minimumPrecision: 0.9,
    minimumRecall: 0.9,
    minimumF1: 0.9,
};

export const GROUPING_QUALITY_DATASET: GroupingQualityEntry[] = [
    entry('new-balance-327', {
        id: 'nb-327-musinsa',
        title: '뉴발란스 327 스니커즈 화이트 240',
        price: 89000,
        mallName: '무신사',
        source: 'MUSINSA',
        brand: '뉴발란스',
        category1: '신발',
        category2: '스니커즈',
    }),
    entry('new-balance-327', {
        id: 'nb-327-wconcept',
        title: '[뉴발란스] 327 운동화 화이트 245',
        price: 99000,
        mallName: 'W컨셉',
        source: 'W_CONCEPT',
        brand: '뉴발란스',
        category1: '패션잡화',
        category2: '운동화',
    }),
    entry('nike-p6000', {
        id: 'nike-p6000-29cm',
        title: '나이키 P-6000 메탈릭 실버',
        price: 129000,
        mallName: '29CM',
        source: '29CM',
        brand: '나이키',
        category1: '신발',
        category2: '스니커즈',
    }),
    entry('nike-p6000', {
        id: 'nike-p6000-ssf',
        title: '[NIKE] P6000 스니커즈 실버 250',
        price: 139000,
        mallName: 'SSF샵',
        source: 'SSF',
        brand: '나이키',
        category1: '패션잡화',
        category2: '운동화',
    }),
    entry('musinsa-relaxed-blazer', {
        id: 'musinsa-blazer-musinsa',
        title: '[무신사 스탠다드] 우먼즈 릴렉스드 싱글 자켓 베이지',
        normalizedTitle: '무신사 스탠다드 릴렉스드 싱글 블레이저',
        price: 79900,
        mallName: '무신사',
        source: 'MUSINSA',
        brand: '무신사 스탠다드',
        category1: '아우터',
        category2: '자켓',
    }),
    entry('musinsa-relaxed-blazer', {
        id: 'musinsa-blazer-eql',
        title: '무신사 스탠다드 릴렉스드 싱글 블레이저',
        price: 85900,
        mallName: 'EQL',
        source: 'EQL',
        brand: '무신사 스탠다드',
        category1: '여성의류',
        category2: '블레이저',
    }),
    entry('nike-air-force-1', {
        id: 'nike-air-force-1',
        title: '나이키 에어포스 1 로우 07',
        price: 129000,
        mallName: '무신사',
        source: 'MUSINSA',
        brand: '나이키',
        category1: '신발',
        category2: '스니커즈',
    }),
    entry('nike-cortez', {
        id: 'nike-cortez',
        title: '나이키 코르테즈 레더',
        price: 119000,
        mallName: 'LF몰',
        source: 'LFMALL',
        brand: '나이키',
        category1: '신발',
        category2: '스니커즈',
    }),
    entry('new-balance-530-men', {
        id: 'nb-530-men',
        title: '뉴발란스 530 men white',
        price: 129000,
        mallName: '한섬',
        source: 'HANDSOME',
        brand: '뉴발란스',
        category1: '신발',
        category2: '스니커즈',
    }),
    entry('new-balance-530-women', {
        id: 'nb-530-women',
        title: '뉴발란스 530 women white',
        price: 127000,
        mallName: '29CM',
        source: '29CM',
        brand: '뉴발란스',
        category1: '신발',
        category2: '스니커즈',
    }),
    entry('musinsa-shirt-black', {
        id: 'musinsa-shirt-black',
        title: '무신사 스탠다드 릴렉스드 셔츠',
        price: 49900,
        mallName: '무신사',
        source: 'MUSINSA',
        brand: '무신사 스탠다드',
        category1: '상의',
        category2: '셔츠',
        optionSummary: '색상 블랙 · 사이즈 M',
        colorOptions: ['블랙'],
        sizeOptions: ['M'],
    }),
    entry('musinsa-shirt-white', {
        id: 'musinsa-shirt-white',
        title: '무신사 스탠다드 릴렉스드 셔츠',
        price: 51900,
        mallName: '에이블리',
        source: 'ABLY',
        brand: '무신사 스탠다드',
        category1: '상의',
        category2: '셔츠',
        optionSummary: '색상 화이트 · 사이즈 XL',
        colorOptions: ['화이트'],
        sizeOptions: ['XL'],
    }),
];
