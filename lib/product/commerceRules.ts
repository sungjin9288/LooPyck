import type { ProductSource } from '../api/types.ts';

export type CouponBenefitType = 'percent' | 'fixed' | 'points';
export type CouponAudience = 'all' | 'member' | 'app' | 'new';

export interface CouponInfo {
    code: string;
    description: string;
    discount: string;
    mallName: string;
    expiry: string;
    type: CouponBenefitType;
    value: number;
    audience: CouponAudience;
    capAmount?: number;
    minOrderAmount?: number;
}

export interface ShippingRule {
    fee: number;
    freeThreshold?: number;
    label: string;
    estimated: boolean;
}

export const SOURCE_COUPONS: Partial<Record<ProductSource, CouponInfo[]>> = {
    MUSINSA: [
        { code: 'MSNEW10', description: '무신사 신규 가입 할인', discount: '10%', mallName: '무신사', expiry: '2026-03-31', type: 'percent', value: 10, audience: 'new', capAmount: 15000, minOrderAmount: 30000 },
        { code: 'MSAPP15', description: '무신사 앱 전용 할인', discount: '15%', mallName: '무신사', expiry: '2026-03-31', type: 'percent', value: 15, audience: 'app', capAmount: 20000, minOrderAmount: 50000 },
    ],
    '29CM': [
        { code: '29WELCOME', description: '29CM 첫 구매 혜택', discount: '12%', mallName: '29CM', expiry: '2026-03-31', type: 'percent', value: 12, audience: 'new', capAmount: 18000, minOrderAmount: 30000 },
    ],
    NAVER: [
        { code: '', description: '네이버 페이 포인트 적립', discount: '최대 3%', mallName: '네이버쇼핑', expiry: '상시', type: 'points', value: 3, audience: 'all', capAmount: 10000 },
    ],
    W_CONCEPT: [
        { code: 'WCNEW20', description: 'W컨셉 신규 회원 할인', discount: '20%', mallName: 'W컨셉', expiry: '2026-03-31', type: 'percent', value: 20, audience: 'new', capAmount: 25000, minOrderAmount: 50000 },
    ],
    ZIGZAG: [
        { code: '', description: '지그재그 스토어 쿠폰 혜택', discount: '최대 8%', mallName: '지그재그', expiry: '상시', type: 'percent', value: 8, audience: 'member', capAmount: 12000, minOrderAmount: 30000 },
    ],
    ABLY: [
        { code: '', description: '에이블리 스토어 쿠폰 혜택', discount: '최대 7%', mallName: '에이블리', expiry: '상시', type: 'percent', value: 7, audience: 'member', capAmount: 10000, minOrderAmount: 25000 },
    ],
    SSF: [
        { code: '', description: 'SSF샵 멤버십 쿠폰', discount: '최대 10%', mallName: 'SSF샵', expiry: '상시', type: 'percent', value: 10, audience: 'member', capAmount: 20000, minOrderAmount: 50000 },
    ],
    HANDSOME: [
        { code: '', description: '한섬 멤버십 혜택', discount: '최대 10%', mallName: '한섬', expiry: '상시', type: 'percent', value: 10, audience: 'member', capAmount: 25000, minOrderAmount: 100000 },
    ],
    FARFETCH: [
        { code: '', description: 'Farfetch 신규/회원 프로모션', discount: '최대 10%', mallName: 'Farfetch', expiry: '상시', type: 'percent', value: 10, audience: 'member', capAmount: 30000, minOrderAmount: 150000 },
    ],
    COUPANG: [
        { code: '', description: '쿠팡 와우회원 할인/무료배송', discount: '와우회원', mallName: '쿠팡', expiry: '상시', type: 'fixed', value: 0, audience: 'member' },
    ],
};

export const SOURCE_SHIPPING_RULES: Partial<Record<ProductSource, ShippingRule>> = {
    NAVER: { fee: 3000, freeThreshold: 50000, label: '일반 배송비 추정', estimated: true },
    MUSINSA: { fee: 3000, freeThreshold: 30000, label: '무신사 일반 배송 기준', estimated: true },
    '29CM': { fee: 3000, freeThreshold: 80000, label: '29CM 일반 배송 기준', estimated: true },
    W_CONCEPT: { fee: 3000, freeThreshold: 50000, label: 'W컨셉 일반 배송 기준', estimated: true },
    ZIGZAG: { fee: 3000, freeThreshold: 40000, label: '스토어별 배송비 추정', estimated: true },
    ABLY: { fee: 3000, freeThreshold: 40000, label: '스토어별 배송비 추정', estimated: true },
    SSF: { fee: 3000, freeThreshold: 50000, label: 'SSF샵 일반 배송 기준', estimated: true },
    COUPANG: { fee: 3000, freeThreshold: 19800, label: '와우/판매자 배송 추정', estimated: true },
    HANDSOME: { fee: 3000, freeThreshold: 100000, label: '한섬 일반 배송 기준', estimated: true },
    FARFETCH: { fee: 0, freeThreshold: 0, label: '국내 표기 가격 기준', estimated: true },
    SSENSE: { fee: 0, freeThreshold: 0, label: '국내 표기 가격 기준', estimated: true },
    HAGO: { fee: 3000, freeThreshold: 50000, label: 'HAGO 일반 배송 기준', estimated: true },
    EQL: { fee: 3000, freeThreshold: 50000, label: 'EQL 일반 배송 기준', estimated: true },
    LFMALL: { fee: 3000, freeThreshold: 30000, label: 'LF몰 일반 배송 기준', estimated: true },
    SIVILLAGE: { fee: 3000, freeThreshold: 50000, label: 'S.I.VILLAGE 일반 배송 기준', estimated: true },
};

export function getCouponsForSource(source: ProductSource): CouponInfo[] {
    return SOURCE_COUPONS[source] || [];
}

export function getShippingRule(source: ProductSource): ShippingRule | null {
    return SOURCE_SHIPPING_RULES[source] || null;
}
