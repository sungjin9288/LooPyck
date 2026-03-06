import type { UnifiedProduct } from '../api/types.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';

export interface VariantOptionSignal {
    color?: string;
    size?: string;
    gender?: '남성' | '여성' | '공용';
}

export interface VariantAlignmentSummary {
    hasMismatchRisk: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    summaryLabel: string;
    mismatchReasons: string[];
    distinctColors: string[];
    distinctSizes: string[];
    distinctGenders: string[];
    signalsByKey: Record<string, VariantOptionSignal>;
}

type GenderSignal = VariantOptionSignal['gender'];

const COLOR_PATTERNS: Array<{ label: string; patterns: RegExp[] }> = [
    { label: '블랙', patterns: [/\bblack\b/i, /블랙/i, /검정/i, /흑색/i] },
    { label: '화이트', patterns: [/\bwhite\b/i, /화이트/i, /아이보리/i, /백색/i, /오프화이트/i] },
    { label: '네이비', patterns: [/\bnavy\b/i, /네이비/i] },
    { label: '블루', patterns: [/\bblue\b/i, /블루/i, /파랑/i, /청색/i] },
    { label: '그레이', patterns: [/\bgray\b/i, /\bgrey\b/i, /그레이/i, /회색/i] },
    { label: '베이지', patterns: [/\bbeige\b/i, /베이지/i] },
    { label: '브라운', patterns: [/\bbrown\b/i, /브라운/i, /갈색/i] },
    { label: '카키', patterns: [/\bkhaki\b/i, /카키/i] },
    { label: '그린', patterns: [/\bgreen\b/i, /그린/i, /녹색/i] },
    { label: '레드', patterns: [/\bred\b/i, /레드/i, /빨강/i, /와인/i, /버건디/i] },
    { label: '핑크', patterns: [/\bpink\b/i, /핑크/i] },
    { label: '옐로우', patterns: [/\byellow\b/i, /옐로우/i, /노랑/i] },
    { label: '오렌지', patterns: [/\borange\b/i, /오렌지/i] },
    { label: '퍼플', patterns: [/\bpurple\b/i, /퍼플/i, /보라/i] },
    { label: '실버', patterns: [/\bsilver\b/i, /실버/i] },
    { label: '골드', patterns: [/\bgold\b/i, /골드/i] },
    { label: '크림', patterns: [/\bcream\b/i, /크림/i] },
    { label: '카멜', patterns: [/\bcamel\b/i, /카멜/i] },
];

const MALE_PATTERNS = [/\bmen'?s\b/i, /\bmen\b/i, /\bman\b/i, /\bmale\b/i, /남성/i, /맨즈/i, /mens/i];
const FEMALE_PATTERNS = [/\bwomen'?s\b/i, /\bwomen\b/i, /\bwoman\b/i, /\bfemale\b/i, /여성/i, /우먼즈/i, /우먼/i, /womens/i];
const UNISEX_PATTERNS = [/\bunisex\b/i, /공용/i, /유니섹스/i];

const APPAREL_SIZE_PATTERNS = ['44', '55', '66', '77', '88', '90', '95', '100', '105', '110'];
const FREE_SIZE_PATTERNS = [/\bfree\b/i, /\bonesize\b/i, /\bone size\b/i, /\bos\b/i, /프리사이즈/i, /프리 사이즈/i];

function toSearchableText(product: UnifiedProduct): string {
    return normalizeTitle([
        product.title,
        product.category1,
        product.category2,
        product.brand,
        product.stockText,
    ].filter(Boolean).join(' '))
        .toLowerCase()
        .replace(/[()_[\],/]/g, ' ');
}

function detectColor(text: string): string | undefined {
    for (const entry of COLOR_PATTERNS) {
        if (entry.patterns.some((pattern) => pattern.test(text))) {
            return entry.label;
        }
    }
    return undefined;
}

function detectGender(text: string): GenderSignal | undefined {
    if (UNISEX_PATTERNS.some((pattern) => pattern.test(text))) {
        return '공용';
    }
    if (MALE_PATTERNS.some((pattern) => pattern.test(text))) {
        return '남성';
    }
    if (FEMALE_PATTERNS.some((pattern) => pattern.test(text))) {
        return '여성';
    }
    return undefined;
}

function detectNumericSize(text: string): string | undefined {
    const numericMatches = Array.from(text.matchAll(/(?:^|\D)(\d{2,3})(?=\D|$)/g))
        .map((match) => match[1])
        .filter(Boolean);

    for (const value of numericMatches) {
        const parsed = Number.parseInt(value, 10);
        if (parsed >= 220 && parsed <= 330 && parsed % 5 === 0) {
            return value;
        }
    }

    for (const size of APPAREL_SIZE_PATTERNS) {
        const pattern = new RegExp(`(?:^|\\D)${size}(?=\\D|$)`);
        if (pattern.test(text)) {
            return size;
        }
    }

    return undefined;
}

function detectAlphaSize(text: string): string | undefined {
    if (FREE_SIZE_PATTERNS.some((pattern) => pattern.test(text))) {
        return 'FREE';
    }

    const contextualMatch = text.match(/(?:size|사이즈|옵션)\s*[:/-]?\s*(xxxl|xxl|xl|xs|s|m|l)\b/i);
    if (contextualMatch?.[1]) {
        return contextualMatch[1].toUpperCase();
    }

    const bracketMatch = text.match(/[\[(](xxxl|xxl|xl|xs|s|m|l)[\])]/i);
    if (bracketMatch?.[1]) {
        return bracketMatch[1].toUpperCase();
    }

    return undefined;
}

function detectSize(text: string): string | undefined {
    return detectNumericSize(text) || detectAlphaSize(text);
}

function toDistinctList(values: Array<string | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
}

function buildMismatchReasons(colors: string[], sizes: string[], genders: string[]): string[] {
    const reasons: string[] = [];

    if (sizes.length > 1) {
        reasons.push('사이즈 혼재');
    }
    if (genders.length > 1) {
        reasons.push('성별 혼재');
    }
    if (colors.length > 1) {
        reasons.push('색상 혼재');
    }

    return reasons;
}

function buildSummaryLabel(reasons: string[]): string {
    if (reasons.length === 0) {
        return '옵션 차이 신호 없음';
    }

    if (reasons.length === 1) {
        return `${reasons[0]} 가능`;
    }

    return '옵션 혼재 가능';
}

function getRiskLevel(reasons: string[]): VariantAlignmentSummary['riskLevel'] {
    if (reasons.some((reason) => reason.includes('사이즈') || reason.includes('성별')) || reasons.length > 1) {
        return 'high';
    }

    if (reasons.length === 1) {
        return 'medium';
    }

    return 'low';
}

export function getProductOptionKey(product: UnifiedProduct): string {
    return `${product.source}:${product.id}`;
}

export function detectVariantOptionSignal(product: UnifiedProduct): VariantOptionSignal {
    const text = toSearchableText(product);

    return {
        color: detectColor(text),
        size: detectSize(text),
        gender: detectGender(text),
    };
}

export function analyzeVariantAlignment(products: UnifiedProduct[]): VariantAlignmentSummary {
    const signalsByKey = products.reduce<Record<string, VariantOptionSignal>>((acc, product) => {
        acc[getProductOptionKey(product)] = detectVariantOptionSignal(product);
        return acc;
    }, {});

    const signals = Object.values(signalsByKey);
    const distinctColors = toDistinctList(signals.map((signal) => signal.color));
    const distinctSizes = toDistinctList(signals.map((signal) => signal.size));
    const distinctGenders = toDistinctList(signals.map((signal) => signal.gender));
    const mismatchReasons = buildMismatchReasons(distinctColors, distinctSizes, distinctGenders);

    return {
        hasMismatchRisk: mismatchReasons.length > 0,
        riskLevel: getRiskLevel(mismatchReasons),
        summaryLabel: buildSummaryLabel(mismatchReasons),
        mismatchReasons,
        distinctColors,
        distinctSizes,
        distinctGenders,
        signalsByKey,
    };
}
