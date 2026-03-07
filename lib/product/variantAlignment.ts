import type { UnifiedProduct } from '../api/types.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';

export type GenderSignal = '남성' | '여성' | '공용';
export type VariantOverlapLevel = 'unknown' | 'none' | 'partial' | 'high';

export interface VariantOptionSignal {
    color?: string;
    size?: string;
    gender?: GenderSignal;
    colors: string[];
    sizes: string[];
    genders: GenderSignal[];
    optionValues: string[];
    hasVerifiedOptions: boolean;
    detectionSource: 'title' | 'pdp' | 'mixed';
}

export interface VariantAlignmentSummary {
    hasMismatchRisk: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    summaryLabel: string;
    mismatchReasons: string[];
    distinctColors: string[];
    distinctSizes: string[];
    distinctGenders: string[];
    sharedColors: string[];
    sharedSizes: string[];
    verifiedOptionCount: number;
    overlapLevel: VariantOverlapLevel;
    overlapLabel: string;
    signalsByKey: Record<string, VariantOptionSignal>;
}

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

function normalizeWhitespace(value: string): string {
    return normalizeTitle(value)
        .replace(/\s+/g, ' ')
        .trim();
}

function toSearchableText(values: Array<string | undefined>): string {
    return normalizeWhitespace(values.filter(Boolean).join(' '))
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

    const tokenMatch = text.match(/\b(xxxl|xxl|xl|xs|s|m|l)\b/i);
    if (tokenMatch?.[1]) {
        return tokenMatch[1].toUpperCase();
    }

    return undefined;
}

function detectSize(text: string): string | undefined {
    return detectNumericSize(text) || detectAlphaSize(text);
}

function toDistinctList(values: Array<string | undefined>): string[] {
    return Array.from(new Set(values.filter((value): value is string => Boolean(value && value.trim()))));
}

function toDistinctGenders(values: Array<GenderSignal | undefined>): GenderSignal[] {
    return Array.from(new Set(values.filter((value): value is GenderSignal => Boolean(value))));
}

function extractDetectedColors(values: string[]): string[] {
    return toDistinctList(values.map((value) => detectColor(toSearchableText([value]))));
}

function extractDetectedSizes(values: string[]): string[] {
    return toDistinctList(values.map((value) => detectSize(toSearchableText([value]))));
}

function extractDetectedGenders(values: string[]): GenderSignal[] {
    return toDistinctGenders(values.map((value) => detectGender(toSearchableText([value]))));
}

function getTitleTexts(product: UnifiedProduct): string[] {
    return [
        product.title,
        product.category1,
        product.category2,
        product.brand,
        product.stockText,
    ].filter(Boolean) as string[];
}

function getVerifiedOptionTexts(product: UnifiedProduct): string[] {
    return [
        product.optionSummary,
        ...(product.optionValues || []),
        ...(product.sizeOptions || []),
        ...(product.colorOptions || []),
        ...(product.variantCandidates?.map((candidate) => candidate.label) || []),
        ...(product.variantCandidates?.flatMap((candidate) => candidate.color ? [candidate.color] : []) || []),
        ...(product.variantCandidates?.flatMap((candidate) => candidate.size ? [candidate.size] : []) || []),
    ].filter(Boolean) as string[];
}

function intersectLists(lists: string[][]): string[] {
    const comparableLists = lists.filter((list) => list.length > 0);
    if (comparableLists.length < 2) {
        return [];
    }

    return comparableLists.slice(1).reduce((shared, current) => (
        shared.filter((value) => current.includes(value))
    ), [...comparableLists[0]!]);
}

function buildMismatchReasons(
    colors: string[],
    sizes: string[],
    genders: GenderSignal[],
    verifiedOptionCount: number,
    overlapLevel: VariantOverlapLevel
): string[] {
    const reasons: string[] = [];

    if (verifiedOptionCount >= 2 && overlapLevel === 'none') {
        reasons.push('공통 옵션 미확인');
    }
    if (sizes.length > 1) {
        reasons.push('사이즈 혼재');
    }
    if (genders.length > 1) {
        reasons.push('성별 혼재');
    }
    if (colors.length > 1) {
        reasons.push('색상 혼재');
    }

    return Array.from(new Set(reasons));
}

function buildOverlapLevel(
    verifiedOptionCount: number,
    sharedColors: string[],
    sharedSizes: string[]
): VariantOverlapLevel {
    if (verifiedOptionCount < 2) {
        return 'unknown';
    }

    if (sharedColors.length > 0 && sharedSizes.length > 0) {
        return 'high';
    }

    if (sharedColors.length > 0 || sharedSizes.length > 0) {
        return 'partial';
    }

    return 'none';
}

function buildOverlapLabel(
    overlapLevel: VariantOverlapLevel,
    sharedColors: string[],
    sharedSizes: string[],
    verifiedOptionCount: number
): string {
    if (verifiedOptionCount < 2) {
        return '검증 옵션 부족';
    }

    if (overlapLevel === 'high') {
        const parts = [
            sharedColors.length > 0 ? `색상 ${sharedColors.join(', ')}` : null,
            sharedSizes.length > 0 ? `사이즈 ${sharedSizes.join(', ')}` : null,
        ].filter(Boolean) as string[];
        return `공통 옵션 ${parts.join(' · ')}`;
    }

    if (overlapLevel === 'partial') {
        if (sharedSizes.length > 0) {
            return `부분 공통 옵션 · 사이즈 ${sharedSizes.join(', ')}`;
        }
        if (sharedColors.length > 0) {
            return `부분 공통 옵션 · 색상 ${sharedColors.join(', ')}`;
        }
    }

    if (overlapLevel === 'none') {
        return '공통 옵션 미확인';
    }

    return '옵션 차이 신호 없음';
}

function buildSummaryLabel(
    reasons: string[],
    overlapLevel: VariantOverlapLevel,
    overlapLabel: string
): string {
    if (overlapLevel === 'none') {
        return '공통 옵션 미확인';
    }

    if (reasons.length === 0) {
        return overlapLevel === 'unknown' ? '옵션 차이 신호 없음' : overlapLabel;
    }

    if (reasons.length === 1) {
        return `${reasons[0]} 가능`;
    }

    return '옵션 혼재 가능';
}

function getRiskLevel(
    reasons: string[],
    overlapLevel: VariantOverlapLevel
): VariantAlignmentSummary['riskLevel'] {
    if (overlapLevel === 'none') {
        return 'high';
    }

    if (reasons.some((reason) => reason.includes('사이즈') || reason.includes('성별')) || reasons.length > 1) {
        return 'high';
    }

    if (reasons.length === 1) {
        return 'medium';
    }

    return overlapLevel === 'partial' ? 'medium' : 'low';
}

export function getProductOptionKey(product: UnifiedProduct): string {
    return `${product.source}:${product.id}`;
}

export function detectVariantOptionSignal(product: UnifiedProduct): VariantOptionSignal {
    const verifiedTexts = getVerifiedOptionTexts(product);
    const titleTexts = getTitleTexts(product);
    const titleSearchText = toSearchableText(titleTexts);
    const hasVerifiedOptions = verifiedTexts.length > 0;

    const verifiedColors = toDistinctList([
        ...extractDetectedColors(product.colorOptions || []),
        ...extractDetectedColors(verifiedTexts),
    ]);
    const verifiedSizes = toDistinctList([
        ...toDistinctList((product.sizeOptions || []).map((value) => detectSize(toSearchableText([value])))),
        ...extractDetectedSizes(verifiedTexts),
    ]);
    const verifiedGenders = extractDetectedGenders(verifiedTexts);

    const titleColor = detectColor(titleSearchText);
    const titleSize = detectSize(titleSearchText);
    const titleGender = detectGender(titleSearchText);

    const colors = toDistinctList([
        ...verifiedColors,
        titleColor,
    ]);
    const sizes = toDistinctList([
        ...verifiedSizes,
        titleSize,
    ]);
    const genders = toDistinctGenders([
        ...verifiedGenders,
        titleGender,
    ]);

    return {
        color: colors[0],
        size: sizes[0],
        gender: genders[0],
        colors,
        sizes,
        genders,
        optionValues: toDistinctList(verifiedTexts),
        hasVerifiedOptions,
        detectionSource: hasVerifiedOptions ? (titleTexts.length > 0 ? 'mixed' : 'pdp') : 'title',
    };
}

export function analyzeVariantAlignment(products: UnifiedProduct[]): VariantAlignmentSummary {
    const signalsByKey = products.reduce<Record<string, VariantOptionSignal>>((acc, product) => {
        acc[getProductOptionKey(product)] = detectVariantOptionSignal(product);
        return acc;
    }, {});

    const signals = Object.values(signalsByKey);
    const distinctColors = toDistinctList(signals.flatMap((signal) => signal.colors));
    const distinctSizes = toDistinctList(signals.flatMap((signal) => signal.sizes));
    const distinctGenders = toDistinctGenders(signals.flatMap((signal) => signal.genders));
    const verifiedOptionCount = signals.filter((signal) => signal.hasVerifiedOptions).length;
    const sharedColors = intersectLists(
        signals
            .filter((signal) => signal.hasVerifiedOptions)
            .map((signal) => signal.colors)
    );
    const sharedSizes = intersectLists(
        signals
            .filter((signal) => signal.hasVerifiedOptions)
            .map((signal) => signal.sizes)
    );
    const overlapLevel = buildOverlapLevel(verifiedOptionCount, sharedColors, sharedSizes);
    const overlapLabel = buildOverlapLabel(overlapLevel, sharedColors, sharedSizes, verifiedOptionCount);
    const mismatchReasons = buildMismatchReasons(
        distinctColors,
        distinctSizes,
        distinctGenders,
        verifiedOptionCount,
        overlapLevel
    );

    return {
        hasMismatchRisk: mismatchReasons.length > 0 || overlapLevel === 'none',
        riskLevel: getRiskLevel(mismatchReasons, overlapLevel),
        summaryLabel: buildSummaryLabel(mismatchReasons, overlapLevel, overlapLabel),
        mismatchReasons,
        distinctColors,
        distinctSizes,
        distinctGenders,
        sharedColors,
        sharedSizes,
        verifiedOptionCount,
        overlapLevel,
        overlapLabel,
        signalsByKey,
    };
}
