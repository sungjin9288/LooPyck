import type { GroupedProduct, UnifiedProduct } from '../api/types.ts';
import { normalizeBrand, normalizeTitle } from '../core/dataNormalizer.ts';
import { detectVariantOptionSignal, type GenderSignal } from './variantAlignment.ts';

type ProductMatchStrategy = GroupedProduct['matchStrategy'];

type ProductSignature = {
    product: UnifiedProduct;
    brandKey: string;
    brandTokens: string[];
    category: string;
    modelTokens: string[];
    coreTokens: string[];
    gender?: GenderSignal;
    hasVerifiedOptions: boolean;
    optionColors: string[];
    optionSizes: string[];
    fingerprintKey: string;
};

type MatchAssessment = {
    matched: boolean;
    confidence: number;
    strategy: ProductMatchStrategy;
};

type WorkingGroup = {
    key: string;
    members: Array<{
        product: UnifiedProduct;
        signature: ProductSignature;
    }>;
    confidences: number[];
    strategies: ProductMatchStrategy[];
};

const SOURCE_NOISE_TOKENS = new Set([
    'musinsa',
    '무신사',
    '29cm',
    'wconcept',
    'w컨셉',
    'zigzag',
    '지그재그',
    'ably',
    '에이블리',
    'ssf',
    'ssfshop',
    'handsome',
    '한섬',
    'farfetch',
    'coupang',
    '쿠팡',
    'ssense',
    'hago',
    'eql',
    'lfmall',
    'sivillage',
    'naver',
    '네이버',
]);

const GENERIC_NOISE_TOKENS = new Set([
    'official',
    'store',
    'sale',
    'new',
    'best',
    '추천',
    '정품',
    '공식',
    '단독',
    '신상',
    '세일',
    '할인',
    '무료배송',
    '국내배송',
    '해외배송',
    '빠른배송',
    '오늘출발',
    '배송',
    '패션',
    '브랜드',
    '상품',
    '기획전',
    'limited',
    'edition',
    'unisex',
    '남성',
    '여성',
    '공용',
    '맨즈',
    '우먼',
    '우먼즈',
    'women',
    'woman',
    'mens',
    'men',
    'man',
    'kids',
    'kid',
    '키즈',
]);

const COLOR_TOKENS = new Set([
    'black',
    'white',
    'ivory',
    'cream',
    'grey',
    'gray',
    'charcoal',
    'navy',
    'blue',
    'sky',
    'red',
    'pink',
    'green',
    'khaki',
    'olive',
    'yellow',
    'orange',
    'purple',
    'brown',
    'beige',
    'camel',
    'wine',
    'silver',
    'gold',
    '멀티',
    '블랙',
    '화이트',
    '아이보리',
    '크림',
    '그레이',
    '회색',
    '차콜',
    '네이비',
    '블루',
    '스카이',
    '레드',
    '핑크',
    '그린',
    '카키',
    '올리브',
    '옐로우',
    '오렌지',
    '퍼플',
    '브라운',
    '베이지',
    '카멜',
    '와인',
    '실버',
    '골드',
]);

const SIZE_TOKENS = new Set([
    'xxs',
    'xs',
    's',
    'm',
    'l',
    'xl',
    'xxl',
    'xxxl',
    'free',
    'onesize',
    'onesz',
    'freesize',
    'small',
    'medium',
    'large',
    'os',
]);

const CATEGORY_KEYWORDS = [
    { category: 'sneakers', keywords: ['스니커즈', '운동화', 'sneaker', 'sneakers', 'runner', '러너'] },
    { category: 'hoodie', keywords: ['후드', '후디', 'hoodie'] },
    { category: 'sweatshirt', keywords: ['맨투맨', '스웻셔츠', 'sweatshirt'] },
    { category: 'tshirt', keywords: ['티셔츠', '반팔', '긴팔', 'tshirt', 'tee', 'tees'] },
    { category: 'shirt', keywords: ['셔츠', 'shirts', 'shirt'] },
    { category: 'knit', keywords: ['니트', '스웨터', 'knit', 'sweater'] },
    { category: 'cardigan', keywords: ['가디건', 'cardigan'] },
    { category: 'blazer', keywords: ['블레이저', 'blazer'] },
    { category: 'jacket', keywords: ['자켓', '재킷', 'jacket'] },
    { category: 'coat', keywords: ['코트', 'coat'] },
    { category: 'padding', keywords: ['패딩', '다운', 'padding', 'down'] },
    { category: 'pants', keywords: ['팬츠', '바지', '슬랙스', 'trouser', 'trousers', 'pants'] },
    { category: 'denim', keywords: ['데님', '청바지', 'jean', 'jeans', 'denim'] },
    { category: 'shorts', keywords: ['쇼츠', '반바지', 'shorts'] },
    { category: 'skirt', keywords: ['스커트', 'skirt'] },
    { category: 'dress', keywords: ['원피스', '드레스', 'dress'] },
    { category: 'bag', keywords: ['가방', '백', 'bag', 'tote', 'shoulder'] },
    { category: 'cap', keywords: ['캡', '모자', 'cap', 'hat'] },
    { category: 'sandals', keywords: ['샌들', 'sandal', 'sandals'] },
    { category: 'loafers', keywords: ['로퍼', 'loafer', 'loafers'] },
    { category: 'boots', keywords: ['부츠', 'boot', 'boots'] },
];

function uniqueTokens(tokens: string[]): string[] {
    return Array.from(new Set(tokens));
}

function normalizeToken(token: string): string {
    return token
        .normalize('NFKC')
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '');
}

function isNumericSizeToken(token: string): boolean {
    if (!/^\d+$/.test(token)) return false;

    const value = Number(token);
    if (value >= 220 && value <= 330 && value % 5 === 0) return true;
    if ([44, 55, 66, 77, 88, 90, 95, 100, 105, 110].includes(value)) return true;
    return false;
}

function isSizeToken(token: string): boolean {
    if (!token) return false;
    if (SIZE_TOKENS.has(token)) return true;
    return isNumericSizeToken(token);
}

function extractTitleTokens(title: string): string[] {
    const cleaned = normalizeTitle(title)
        .replace(/([A-Za-z]+)-(?=\d)/g, '$1')
        .replace(/[()[\]{}]/g, ' ')
        .replace(/[\\/_,:+*&]/g, ' ')
        .replace(/[.-]/g, ' ');

    const rawTokens = cleaned.match(/[A-Za-z0-9가-힣]+/g) || [];
    return rawTokens
        .map(normalizeToken)
        .filter(Boolean);
}

function getSearchTokens(product: UnifiedProduct): string[] {
    return uniqueTokens([
        ...extractTitleTokens(product.title),
        ...extractTitleTokens(product.normalizedTitle || ''),
    ]);
}

function extractBracketBrand(title: string): string {
    const match = normalizeTitle(title).match(/^\s*[\[(]([^)\]]+)[)\]]/);
    return match?.[1]?.trim() || '';
}

function normalizeBrandKey(rawBrand: string): string {
    const normalized = normalizeBrand(rawBrand).trim();
    if (!normalized || normalized === 'Unknown Brand') return '';
    return normalizeToken(normalized);
}

function getBrandTokens(product: UnifiedProduct, brandKey: string): string[] {
    const rawCandidates = [product.brand || '', extractBracketBrand(product.title)].filter(Boolean);
    const tokens = rawCandidates.flatMap((candidate) => extractTitleTokens(candidate));

    if (brandKey) {
        tokens.push(brandKey);
    }

    return uniqueTokens(tokens.filter(Boolean));
}

function detectCategory(product: UnifiedProduct, tokens: string[]): string {
    const sourceFields = [product.category1, product.category2]
        .filter(Boolean)
        .flatMap((value) => extractTitleTokens(value || ''));

    const searchTokens = new Set([...tokens, ...sourceFields]);

    for (const entry of CATEGORY_KEYWORDS) {
        if (entry.keywords.some((keyword) => searchTokens.has(normalizeToken(keyword)))) {
            return entry.category;
        }
    }

    return '';
}

function isModelToken(token: string): boolean {
    if (!token || isNumericSizeToken(token)) return false;
    if (/^[a-z]+\d+[a-z0-9]*$/.test(token)) return true;
    if (/^\d+[a-z]+[a-z0-9]*$/.test(token)) return true;
    if (/^\d{3,6}$/.test(token)) return true;
    return false;
}

function buildSignature(product: UnifiedProduct): ProductSignature {
    const rawTokens = getSearchTokens(product);
    const brandKey = normalizeBrandKey(product.brand || extractBracketBrand(product.title));
    const brandTokens = getBrandTokens(product, brandKey);
    const category = detectCategory(product, rawTokens);
    const optionSignal = detectVariantOptionSignal(product);
    const modelTokens = uniqueTokens(
        rawTokens.filter((token) => isModelToken(token)).slice(0, 3)
    );

    const coreTokens = uniqueTokens(
        rawTokens.filter((token) => {
            if (token.length < 2) return false;
            if (SOURCE_NOISE_TOKENS.has(token) || GENERIC_NOISE_TOKENS.has(token)) return false;
            if (COLOR_TOKENS.has(token) || isSizeToken(token)) return false;
            if (category && CATEGORY_KEYWORDS.some((entry) => entry.category === category && entry.keywords.includes(token))) {
                return false;
            }
            if (modelTokens.includes(token)) return false;
            if (brandTokens.some((brandToken) => brandToken === token || brandToken.includes(token) || token.includes(brandToken))) {
                return false;
            }
            return true;
        })
    ).slice(0, 6);

    const fingerprintBody = modelTokens.length > 0
        ? modelTokens.join('-')
        : [category, ...coreTokens.slice(0, 3)].filter(Boolean).join('-') || normalizeToken(product.id);

    return {
        product,
        brandKey,
        brandTokens,
        category,
        modelTokens,
        coreTokens,
        gender: optionSignal.gender,
        hasVerifiedOptions: optionSignal.hasVerifiedOptions,
        optionColors: optionSignal.colors,
        optionSizes: optionSignal.sizes,
        fingerprintKey: `${brandKey || 'unknown'}|${fingerprintBody}`,
    };
}

function intersect(left: string[], right: string[]): string[] {
    const rightSet = new Set(right);
    return left.filter((value) => rightSet.has(value));
}

function diceCoefficient(left: string[], right: string[]): number {
    if (left.length === 0 || right.length === 0) return 0;
    const shared = intersect(left, right).length;
    return (2 * shared) / (left.length + right.length);
}

function getPriceCloseness(leftPrice: number, rightPrice: number): number {
    const high = Math.max(leftPrice, rightPrice);
    const low = Math.min(leftPrice, rightPrice);
    if (high <= 0 || low <= 0) return 0;
    return low / high;
}

function noMatch(): MatchAssessment {
    return {
        matched: false,
        confidence: 0,
        strategy: 'token',
    };
}

function hasStrictGenderConflict(left?: GenderSignal, right?: GenderSignal): boolean {
    if (!left || !right) return false;
    const directConflict =
        (left === '남성' && right === '여성')
        || (left === '여성' && right === '남성');

    return directConflict;
}

function hasVerifiedOptionConflict(left: ProductSignature, right: ProductSignature): boolean {
    if (!left.hasVerifiedOptions || !right.hasVerifiedOptions) {
        return false;
    }

    const sharedColors = intersect(left.optionColors, right.optionColors);
    const sharedSizes = intersect(left.optionSizes, right.optionSizes);
    const bothHaveColors = left.optionColors.length > 0 && right.optionColors.length > 0;
    const bothHaveSizes = left.optionSizes.length > 0 && right.optionSizes.length > 0;

    return bothHaveColors && bothHaveSizes && sharedColors.length === 0 && sharedSizes.length === 0;
}

function assessProductMatch(left: ProductSignature, right: ProductSignature): MatchAssessment {
    const brandConflict = left.brandKey && right.brandKey && left.brandKey !== right.brandKey;
    if (brandConflict) {
        return noMatch();
    }

    if (hasStrictGenderConflict(left.gender, right.gender)) {
        return noMatch();
    }

    const sharedModels = intersect(left.modelTokens, right.modelTokens);
    const bothHaveModels = left.modelTokens.length > 0 && right.modelTokens.length > 0;
    if (bothHaveModels && sharedModels.length === 0) {
        return noMatch();
    }

    const categoryConflict =
        left.category &&
        right.category &&
        left.category !== right.category &&
        sharedModels.length === 0;
    if (categoryConflict) {
        return noMatch();
    }

    const sharedCore = intersect(left.coreTokens, right.coreTokens);
    const coreDice = diceCoefficient(left.coreTokens, right.coreTokens);
    const sameBrand = Boolean(left.brandKey && right.brandKey && left.brandKey === right.brandKey);
    const sameCategory = Boolean(left.category && right.category && left.category === right.category);
    const priceCloseness = getPriceCloseness(left.product.price, right.product.price);
    const optionConflict = hasVerifiedOptionConflict(left, right);
    const sharedOptionSignals = intersect(left.optionColors, right.optionColors).length + intersect(left.optionSizes, right.optionSizes).length;

    if (sharedModels.length > 0) {
        const confidence = Math.min(
            0.98,
            0.8 +
                (sameBrand ? 0.08 : 0) +
                (sameCategory ? 0.04 : 0) +
                Math.min(sharedModels.length * 0.03, 0.06) +
                Math.min(sharedOptionSignals * 0.01, 0.02) +
                priceCloseness * 0.04
        );

        return {
            matched: true,
            confidence,
            strategy: sameBrand ? 'brand_model' : 'model',
        };
    }

    if (optionConflict) {
        return noMatch();
    }

    if (sharedCore.length === 0 || coreDice < 0.5 || priceCloseness < 0.45) {
        return noMatch();
    }

    const confidence = Math.min(
        0.94,
        0.2 +
            (sameBrand ? 0.24 : left.brandKey || right.brandKey ? 0.12 : 0.05) +
            (sameCategory ? 0.14 : !left.category || !right.category ? 0.06 : 0) +
            coreDice * 0.28 +
            Math.min(sharedCore.length * 0.04, 0.12) +
            Math.min(sharedOptionSignals * 0.02, 0.04) +
            priceCloseness * 0.1
    );

    if (confidence < 0.7) {
        return noMatch();
    }

    if (!sameBrand && sharedCore.length < 2) {
        return noMatch();
    }

    return {
        matched: true,
        confidence,
        strategy: sameBrand ? 'brand_token' : 'token',
    };
}

function summarizeGroup(group: WorkingGroup): GroupedProduct {
    const variants = [...group.members.map((entry) => entry.product)].sort((left, right) => left.price - right.price);
    const strategyPriority: ProductMatchStrategy[] = ['brand_model', 'model', 'brand_token', 'token', 'single'];
    const matchStrategy =
        strategyPriority.find((candidate) => group.strategies.includes(candidate)) ||
        (variants.length > 1 ? 'token' : 'single');

    return {
        groupKey: group.key,
        representative: variants[0],
        variants,
        lowestPrice: variants[0].price,
        highestPrice: variants[variants.length - 1].price,
        mallCount: new Set(variants.map((variant) => variant.mallName)).size,
        matchConfidence: variants.length > 1
            ? Math.round(Math.min(...group.confidences) * 100) / 100
            : 1,
        matchStrategy,
    };
}

export function groupProducts(products: UnifiedProduct[]): GroupedProduct[] {
    const workingGroups: WorkingGroup[] = [];
    const sortedProducts = [...products].sort((left, right) => {
        const brandDiff = (left.brand || '').localeCompare(right.brand || '');
        if (brandDiff !== 0) return brandDiff;
        const titleDiff = left.title.localeCompare(right.title);
        if (titleDiff !== 0) return titleDiff;
        return left.price - right.price;
    });

    sortedProducts.forEach((product, index) => {
        const signature = buildSignature(product);

        let bestGroupIndex = -1;
        let bestAssessment: MatchAssessment | null = null;

        workingGroups.forEach((group, groupIndex) => {
            const groupBest = group.members.reduce<MatchAssessment | null>((best, member) => {
                const assessment = assessProductMatch(signature, member.signature);
                if (!assessment.matched) return best;
                if (!best || assessment.confidence > best.confidence) {
                    return assessment;
                }
                return best;
            }, null);

            if (groupBest && (!bestAssessment || groupBest.confidence > bestAssessment.confidence)) {
                bestGroupIndex = groupIndex;
                bestAssessment = groupBest;
            }
        });

        if (bestGroupIndex >= 0 && bestAssessment) {
            const group = workingGroups[bestGroupIndex];
            group.members.push({ product, signature });
            group.confidences.push(bestAssessment.confidence);
            group.strategies.push(bestAssessment.strategy);
            return;
        }

        workingGroups.push({
            key: `${signature.fingerprintKey}_${index}`,
            members: [{ product, signature }],
            confidences: [],
            strategies: [],
        });
    });

    return workingGroups.map(summarizeGroup);
}
