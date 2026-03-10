import type { ProductSource, UnifiedProduct } from '../api/types.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';
import { resolveSemanticFashionExpansion } from './fashionOntology.ts';
import type { SearchSort } from '../../types/searchSort.ts';

type QueryIntent = 'fashion' | 'mixed' | 'unknown' | 'non_fashion';
type ResultQuality = 'strong' | 'mixed' | 'weak';
export type SearchQueryCandidatePlan = Partial<Record<ProductSource, string[]>>;

type FashionSignalGroup = {
    canonical: string;
    aliases: string[];
    related: string[];
};

type BlockedSignalGroup = {
    keywords: string[];
    suggestions: string[];
    reason: string;
};

type QueryModifierVariant = {
    local: string[];
    global: string[];
};

export interface FashionQueryAnalysis {
    allowed: boolean;
    intent: QueryIntent;
    reason?: string;
    originalQuery: string;
    normalizedQuery: string;
    primaryTokens: string[];
    brandSignals: string[];
    categorySignals: string[];
    blockedSignals: string[];
    suggestedQueries: string[];
}

export interface SearchExperienceMeta {
    requestedQuery: string;
    effectiveQuery: string;
    queryIntent: QueryIntent;
    reranked: boolean;
    exactMatchCount: number;
    strongMatchCount: number;
    resultQuality: ResultQuality;
    suggestedQueries: string[];
}

type ScoredProduct = {
    product: UnifiedProduct;
    score: number;
    exactMatch: boolean;
    matchedTokens: number;
    coverage: number;
};

const SEARCH_NOISE_TERMS = new Set([
    '추천',
    '검색',
    '비교',
    '가격',
    '최저가',
    '구매',
    '쇼핑몰',
    '브랜드',
    '할인',
    '세일',
    '정품',
    '신상',
    '상품',
]);

const WEAK_QUERY_STOPWORDS = new Set([
    'for',
    'the',
    'with',
    'and',
    'item',
    'shop',
    'sale',
]);

const BRAND_SIGNALS = [
    '나이키',
    '아디다스',
    '뉴발란스',
    '컨버스',
    '반스',
    '스투시',
    '슈프림',
    '오프화이트',
    '무신사',
    '마뗑킴',
    '아식스',
    'salomon',
    'nike',
    'adidas',
    'new balance',
    'converse',
    'vans',
    'stussy',
    'supreme',
    'asics',
];

const BRAND_QUERY_ALIASES: Record<string, string[]> = {
    '나이키': ['nike'],
    '아디다스': ['adidas'],
    '뉴발란스': ['new balance'],
    '컨버스': ['converse'],
    '반스': ['vans'],
    '스투시': ['stussy'],
    '슈프림': ['supreme'],
    '아식스': ['asics'],
    'nike': ['나이키'],
    'adidas': ['아디다스'],
    'new balance': ['뉴발란스'],
    'converse': ['컨버스'],
    'vans': ['반스'],
    'stussy': ['스투시'],
    'supreme': ['슈프림'],
    'asics': ['아식스'],
};

const QUERY_MODIFIER_VARIANTS: Record<string, QueryModifierVariant> = {
    '운동용': { local: ['운동용', '스포츠', '트레이닝', '러닝'], global: ['sport', 'training', 'running', 'athletic'] },
    '운동': { local: ['운동', '운동용', '트레이닝', '스포츠'], global: ['sport', 'training', 'athletic', 'gym'] },
    '스포츠': { local: ['스포츠', '운동용', '트레이닝', '러닝'], global: ['sport', 'training', 'running', 'athletic'] },
    '트레이닝': { local: ['트레이닝', '운동용', '스포츠'], global: ['training', 'sport', 'athletic'] },
    '러닝': { local: ['러닝', '운동용', '트레이닝'], global: ['running', 'training', 'athletic'] },
    '헬스': { local: ['헬스', '짐', '트레이닝', '운동용'], global: ['gym', 'training', 'sport', 'athletic'] },
    '짐': { local: ['짐', '헬스', '트레이닝', '운동용'], global: ['gym', 'training', 'sport', 'athletic'] },
    '등산': { local: ['등산', '아웃도어', '고프코어'], global: ['hiking', 'outdoor', 'gorpcore'] },
    '아웃도어': { local: ['아웃도어', '등산', '고프코어'], global: ['outdoor', 'hiking', 'gorpcore'] },
    '고프코어': { local: ['고프코어', '아웃도어', '등산'], global: ['gorpcore', 'outdoor', 'hiking'] },
    '남자': { local: ['남자', '남성', '맨즈'], global: ['men', 'mens', 'male'] },
    '남성': { local: ['남성', '남자', '맨즈'], global: ['men', 'mens', 'male'] },
    '맨즈': { local: ['맨즈', '남자', '남성'], global: ['mens', 'men', 'male'] },
    '여자': { local: ['여자', '여성', '우먼'], global: ['women', 'womens', 'female'] },
    '여성': { local: ['여성', '여자', '우먼'], global: ['women', 'womens', 'female'] },
    '우먼': { local: ['우먼', '여성', '여자'], global: ['women', 'womens', 'female'] },
    '오버핏': { local: ['오버핏', '루즈핏', '박시핏'], global: ['oversized', 'relaxed fit', 'boxy fit'] },
    '오버사이즈': { local: ['오버사이즈', '오버핏', '루즈핏'], global: ['oversized', 'relaxed fit', 'boxy fit'] },
    '기본': { local: ['기본', '베이직', '에센셜'], global: ['basic', 'essential'] },
    '베이직': { local: ['베이직', '기본', '에센셜'], global: ['basic', 'essential'] },
    '와이드': { local: ['와이드', '와이드핏', '루즈핏'], global: ['wide', 'wide fit', 'relaxed fit'] },
    '루즈핏': { local: ['루즈핏', '와이드핏', '오버핏'], global: ['relaxed fit', 'oversized', 'loose fit'] },
};

const DIRECT_QUERY_EXPANSION_SOURCES: ProductSource[] = [
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'ABLY',
    'SSF',
    'COUPANG',
    'HANDSOME',
    'FARFETCH',
    'SSENSE',
    'HAGO',
    'EQL',
    'LFMALL',
    'SIVILLAGE',
];

const GLOBAL_QUERY_SOURCES = new Set<ProductSource>(['FARFETCH', 'SSENSE']);

const CATEGORY_QUERY_VARIANTS: Record<string, { local: string[]; global: string[] }> = {
    '자켓': { local: ['자켓', '블레이저', '바람막이'], global: ['jacket', 'blazer', 'windbreaker'] },
    '바람막이': { local: ['바람막이', '윈드브레이커', '러닝 자켓'], global: ['windbreaker', 'running jacket', 'shell jacket'] },
    '코트': { local: ['코트', '트렌치코트', '롱코트'], global: ['coat', 'trench coat', 'long coat'] },
    '패딩': { local: ['패딩', '숏패딩', '다운 자켓'], global: ['puffer jacket', 'down jacket', 'puffer coat'] },
    '플리스': { local: ['플리스', '후리스', '집업 플리스'], global: ['fleece', 'fleece jacket', 'zip fleece'] },
    '가디건': { local: ['가디건', '니트 가디건'], global: ['cardigan', 'knit cardigan'] },
    '맨투맨': { local: ['맨투맨', '스웨트셔츠'], global: ['sweatshirt', 'crewneck sweatshirt'] },
    '후드집업': { local: ['후드집업', '후드 집업', '후드티', '후드', '후디', '트레이닝 후드집업'], global: ['zip hoodie', 'hooded zip-up', 'hoodie', 'training hoodie'] },
    '셔츠': { local: ['셔츠', '옥스포드 셔츠'], global: ['shirt', 'oxford shirt'] },
    '니트': { local: ['니트', '크루넥 니트'], global: ['knit', 'sweater', 'crewneck knit'] },
    '티셔츠': { local: ['티셔츠', '반팔 티셔츠'], global: ['t-shirt', 'tee', 'graphic tee'] },
    '데님 팬츠': { local: ['청바지', '데님 팬츠', '와이드 데님'], global: ['jeans', 'denim pants', 'wide-leg jeans'] },
    '슬랙스': { local: ['슬랙스', '와이드 슬랙스'], global: ['trousers', 'tailored trousers', 'slacks'] },
    '조거 팬츠': { local: ['조거 팬츠', '조거', '트레이닝 팬츠'], global: ['jogger pants', 'joggers', 'training pants'] },
    '트랙 팬츠': { local: ['트랙 팬츠', '트레이닝 팬츠', '조거 팬츠'], global: ['track pants', 'training pants', 'jogger pants'] },
    '카고 팬츠': { local: ['카고 팬츠', '카고 바지'], global: ['cargo pants', 'utility pants'] },
    '레깅스': { local: ['레깅스', '요가 팬츠', '트레이닝 레깅스'], global: ['leggings', 'yoga pants', 'training leggings'] },
    '쇼츠': { local: ['반바지', '쇼츠', '트레이닝 쇼츠'], global: ['shorts', 'training shorts', 'running shorts'] },
    '스커트': { local: ['스커트', '플리츠 스커트'], global: ['skirt', 'pleated skirt'] },
    '원피스': { local: ['원피스', '니트 원피스'], global: ['dress', 'knit dress'] },
    '스니커즈': { local: ['스니커즈', '운동화', '러닝화'], global: ['sneakers', 'trainers', 'running shoes'] },
    '로퍼': { local: ['로퍼', '페니 로퍼'], global: ['loafers', 'penny loafers'] },
    '부츠': { local: ['부츠', '앵클부츠'], global: ['boots', 'ankle boots'] },
    '샌들': { local: ['샌들', '슬리퍼'], global: ['sandals', 'slides'] },
    '가방': { local: ['가방', '크로스백', '숄더백'], global: ['bag', 'crossbody bag', 'shoulder bag'] },
    '모자': { local: ['모자', '볼캡', '비니'], global: ['cap', 'beanie', 'bucket hat'] },
    '지갑': { local: ['지갑', '카드지갑'], global: ['wallet', 'card holder'] },
    '선글라스': { local: ['선글라스'], global: ['sunglasses', 'eyewear'] },
    '벨트': { local: ['벨트'], global: ['belt', 'leather belt'] },
};

const FASHION_SIGNAL_GROUPS: FashionSignalGroup[] = [
    { canonical: '자켓', aliases: ['자켓', '재킷', 'jacket', 'blazer', '블레이저', '바람막이', '점퍼', '트랙자켓'], related: ['블레이저', '바람막이', '트랙 자켓'] },
    { canonical: '바람막이', aliases: ['바람막이', '윈드브레이커', 'windbreaker', 'shell jacket', '러닝 자켓'], related: ['러닝 자켓', '윈드브레이커', '아노락'] },
    { canonical: '코트', aliases: ['코트', 'coat', '트렌치', '트렌치코트', 'overcoat'], related: ['트렌치코트', '롱코트', '하프코트'] },
    { canonical: '패딩', aliases: ['패딩', '다운', 'down jacket', 'puffer', '숏패딩'], related: ['숏패딩', '롱패딩', '다운 베스트'] },
    { canonical: '플리스', aliases: ['플리스', '후리스', 'fleece'], related: ['집업 플리스', '보아 플리스', '플리스 자켓'] },
    { canonical: '가디건', aliases: ['가디건', 'cardigan', '볼레로'], related: ['브이넥 가디건', '크롭 가디건', '니트 가디건'] },
    { canonical: '맨투맨', aliases: ['맨투맨', 'sweatshirt', '스웨트셔츠', 'pullover'], related: ['오버핏 맨투맨', '그래픽 맨투맨', '기모 맨투맨'] },
    { canonical: '후드집업', aliases: ['후드집업', '후드 집업', '후드티', '후디', 'hoodie', 'zip hoodie', '후드'], related: ['집업 후드', '오버핏 후드집업', '기모 후드집업', '트레이닝 후드집업'] },
    { canonical: '셔츠', aliases: ['셔츠', 'shirt', '옥스포드', 'oxford shirt', '드레스셔츠'], related: ['옥스포드 셔츠', '스트라이프 셔츠', '오버핏 셔츠'] },
    { canonical: '니트', aliases: ['니트', 'knit', 'sweater', '스웨터', '크루넥'], related: ['크루넥 니트', '브이넥 니트', '케이블 니트'] },
    { canonical: '티셔츠', aliases: ['티셔츠', '티셔츠', 'tee', 't-shirt', '반팔', '긴팔티'], related: ['그래픽 티셔츠', '기본 반팔', '롱슬리브 티셔츠'] },
    { canonical: '데님 팬츠', aliases: ['청바지', '데님', 'jean', 'jeans', 'denim'], related: ['와이드 데님 팬츠', '스트레이트 데님', '로우라이즈 데님'] },
    { canonical: '슬랙스', aliases: ['슬랙스', 'trousers', '팬츠', 'dress pants'], related: ['와이드 슬랙스', '테이퍼드 슬랙스', '플리츠 팬츠'] },
    { canonical: '조거 팬츠', aliases: ['조거', '조거 팬츠', 'jogger', 'joggers'], related: ['트레이닝 조거 팬츠', '스웨트 조거 팬츠', '러닝 조거 팬츠'] },
    { canonical: '트랙 팬츠', aliases: ['트랙 팬츠', '트레이닝 팬츠', 'track pants'], related: ['사이드라인 트랙 팬츠', '나일론 트랙 팬츠', '트레이닝 팬츠'] },
    { canonical: '카고 팬츠', aliases: ['카고', 'cargo pants', '카고팬츠'], related: ['와이드 카고 팬츠', '나일론 카고 팬츠', '고프코어 팬츠'] },
    { canonical: '레깅스', aliases: ['레깅스', 'leggings', '요가 팬츠'], related: ['트레이닝 레깅스', '플레어 레깅스', '러닝 레깅스'] },
    { canonical: '쇼츠', aliases: ['반바지', '쇼츠', 'shorts', '트레이닝 쇼츠'], related: ['나일론 쇼츠', '트레이닝 쇼츠', '러닝 쇼츠'] },
    { canonical: '스커트', aliases: ['스커트', 'skirt', '미니스커트', '플리츠 스커트'], related: ['플리츠 스커트', '미니스커트', '롱스커트'] },
    { canonical: '원피스', aliases: ['원피스', 'dress', 'gown'], related: ['미니 원피스', '셔츠 원피스', '니트 원피스'] },
    { canonical: '스니커즈', aliases: ['스니커즈', '운동화', 'sneaker', 'sneakers', 'shoe', 'shoes', '러닝화', '런닝화'], related: ['로우탑 스니커즈', '러닝화', '레트로 스니커즈'] },
    { canonical: '로퍼', aliases: ['로퍼', 'loafer', 'loafers'], related: ['페니 로퍼', '레더 로퍼', '스웨이드 로퍼'] },
    { canonical: '부츠', aliases: ['부츠', 'boot', 'boots'], related: ['앵클부츠', '워커', '첼시부츠'] },
    { canonical: '샌들', aliases: ['샌들', 'sandal', 'sandals', '슬리퍼'], related: ['스트랩 샌들', '플립플랍', '슬라이드 샌들'] },
    { canonical: '가방', aliases: ['가방', 'bag', 'bags', '백', '백팩', '숄더백', '토트백', '크로스백', '메신저백'], related: ['미니백', '크로스백', '숄더백'] },
    { canonical: '모자', aliases: ['모자', 'hat', 'cap', '볼캡', '비니'], related: ['볼캡', '비니', '버킷햇'] },
    { canonical: '지갑', aliases: ['지갑', 'wallet', 'card holder', '카드지갑'], related: ['카드지갑', '반지갑', '장지갑'] },
    { canonical: '선글라스', aliases: ['선글라스', 'sunglasses', '안경'], related: ['오버사이즈 선글라스', '메탈 선글라스', '스퀘어 프레임'] },
    { canonical: '벨트', aliases: ['벨트', 'belt'], related: ['레더 벨트', '체인 벨트', '웨스턴 벨트'] },
];

const BLOCKED_SIGNAL_GROUPS: BlockedSignalGroup[] = [
    {
        keywords: ['아이폰', '갤럭시', '핸드폰', '스마트폰', 'phone', 'iphone', 'galaxy'],
        suggestions: ['폰백', '미니백', '크로스백', '테크웨어 백'],
        reason: '전자기기 자체보다 휴대와 수납에 맞는 패션 아이템으로 검색해보세요.',
    },
    {
        keywords: ['노트북', '컴퓨터', '마우스', '키보드', '모니터', '맥북', 'laptop', 'computer', 'keyboard', 'monitor', 'macbook'],
        suggestions: ['노트북 백팩', '메신저백', '서류가방', '고프코어 백팩'],
        reason: '디바이스 자체 대신 착용 가능한 수납 아이템으로 검색하면 비교 결과가 정확해집니다.',
    },
    {
        keywords: ['냉장고', '세탁기', '청소기', '에어컨', '선풍기', 'refrigerator', 'washing machine', 'vacuum'],
        suggestions: ['홈웨어 세트', '슬리퍼', '가디건', '라운지 팬츠'],
        reason: '가전 대신 착용 가능한 홈웨어나 실내 스타일 아이템으로 검색해보세요.',
    },
    {
        keywords: ['자전거', '오토바이', '자동차', 'bike', 'car', 'motorcycle'],
        suggestions: ['바람막이', '러닝 자켓', '카고 팬츠', '고프코어 자켓'],
        reason: '이동 수단 자체보다 주행 상황에 맞는 아우터와 팬츠로 검색해보세요.',
    },
    {
        keywords: ['커피', '음식', '식품', '과자', '라면', '치킨', 'pizza', 'food', 'coffee', 'ramen'],
        suggestions: ['에코백', '볼캡', '후드집업', '스니커즈'],
        reason: '식품 대신 일상 스타일링에 바로 연결되는 패션 아이템을 추천합니다.',
    },
    {
        keywords: ['주식', '코인', '부동산', '아파트', 'stock', 'coin', 'estate'],
        suggestions: ['미니멀 자켓', '로퍼', '셔츠', '슬랙스'],
        reason: '투자 키워드 대신 출근룩이나 미니멀 스타일 아이템으로 좁혀보세요.',
    },
];

function uniqueOrdered(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        if (!value || seen.has(value)) {
            return false;
        }

        seen.add(value);
        return true;
    });
}

function normalizeSearchText(text: string): string {
    return normalizeTitle(text)
        .toLowerCase()
        .replace(/[()[\]{}|/\\,.;:_+*?!~`"'“”‘’<>-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function normalizeWhitespace(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
}

function tokenize(text: string): string[] {
    return uniqueOrdered(
        normalizeSearchText(text)
            .split(' ')
            .map((token) => token.trim())
            .filter((token) => {
                if (!token) {
                    return false;
                }

                if (SEARCH_NOISE_TERMS.has(token) || WEAK_QUERY_STOPWORDS.has(token)) {
                    return false;
                }

                return token.length > 1 || /[가-힣]/.test(token);
            })
    );
}

function getBestSignalAliasLength(group: FashionSignalGroup, query: string): number {
    return group.aliases.reduce((maxLength, alias) => {
        if (!query.includes(alias)) {
            return maxLength;
        }

        return Math.max(maxLength, normalizeSearchText(alias).length);
    }, 0);
}

function findMatchingSignalGroups(query: string): FashionSignalGroup[] {
    return FASHION_SIGNAL_GROUPS
        .filter((group) => group.aliases.some((alias) => query.includes(alias)))
        .sort((left, right) => {
            const aliasDiff = getBestSignalAliasLength(right, query) - getBestSignalAliasLength(left, query);
            if (aliasDiff !== 0) {
                return aliasDiff;
            }

            return right.canonical.length - left.canonical.length;
        });
}

function findMatchingBlockedGroups(query: string): BlockedSignalGroup[] {
    return BLOCKED_SIGNAL_GROUPS.filter((group) =>
        group.keywords.some((keyword) => query.includes(keyword))
    );
}

function findBrandSignals(query: string): string[] {
    return uniqueOrdered(BRAND_SIGNALS.filter((brand) => query.includes(brand)));
}

function buildNonFashionSuggestions(
    blockedGroups: BlockedSignalGroup[],
    brandSignals: string[]
): string[] {
    const prefix = brandSignals[0];
    const candidates = blockedGroups.flatMap((group) => group.suggestions);
    return uniqueOrdered(
        candidates.map((candidate) => (prefix ? `${prefix} ${candidate}` : candidate))
    ).slice(0, 4);
}

function buildRelatedSuggestions(
    analysis: Pick<FashionQueryAnalysis, 'normalizedQuery' | 'brandSignals' | 'categorySignals' | 'suggestedQueries'>
): string[] {
    const suggestions: string[] = [];
    const primaryBrand = analysis.brandSignals[0];
    const primaryCategory = analysis.categorySignals[0];

    if (analysis.normalizedQuery) {
        suggestions.push(analysis.normalizedQuery);
    }

    if (primaryCategory) {
        const categoryGroup = FASHION_SIGNAL_GROUPS.find((group) => group.canonical === primaryCategory);
        if (categoryGroup) {
            categoryGroup.related.forEach((related) => {
                suggestions.push(primaryBrand ? `${primaryBrand} ${related}` : related);
            });
        }
    }

    analysis.suggestedQueries.forEach((suggestion) => {
        suggestions.push(suggestion);
    });

    return uniqueOrdered(suggestions).slice(0, 4);
}

function getCategoryQueryVariants(category: string | undefined, source: ProductSource): string[] {
    if (!category) {
        return [];
    }

    const variants = CATEGORY_QUERY_VARIANTS[category];
    if (!variants) {
        return [category];
    }

    return GLOBAL_QUERY_SOURCES.has(source) ? variants.global : variants.local;
}

function getQueryModifierVariants(
    analysis: Pick<FashionQueryAnalysis, 'primaryTokens' | 'categorySignals' | 'brandSignals'>,
    source: ProductSource
): string[] {
    const categoryTokens = new Set(
        analysis.categorySignals.flatMap((category) => tokenize(category))
    );
    const brandTokens = new Set(
        analysis.brandSignals.flatMap((brand) => tokenize(brand))
    );

    const modifierTokens = analysis.primaryTokens.filter((token) => !categoryTokens.has(token) && !brandTokens.has(token));
    const candidates = modifierTokens.flatMap((token) => {
        const variants = QUERY_MODIFIER_VARIANTS[token];
        if (!variants) {
            return [token];
        }

        return GLOBAL_QUERY_SOURCES.has(source) ? variants.global : variants.local;
    });

    return uniqueOrdered(candidates).slice(0, 4);
}

export function analyzeFashionQuery(query: string): FashionQueryAnalysis {
    const originalQuery = normalizeTitle(query).trim();
    const normalizedSource = normalizeSearchText(originalQuery);
    const brandSignals = findBrandSignals(normalizedSource);
    const matchingSignalGroups = findMatchingSignalGroups(normalizedSource);
    const semanticExpansion = resolveSemanticFashionExpansion(originalQuery);
    const blockedGroups = findMatchingBlockedGroups(normalizedSource);

    const categorySignals = uniqueOrdered([
        ...matchingSignalGroups.map((group) => group.canonical),
        ...semanticExpansion.categories,
    ]);
    const blockedSignals = uniqueOrdered(blockedGroups.flatMap((group) => group.keywords.filter((keyword) => normalizedSource.includes(keyword))));
    const rawTokens = tokenize(originalQuery);
    const normalizedTokens = rawTokens.filter((token) => !blockedSignals.includes(token));

    const normalizedQuery = uniqueOrdered(
        normalizedTokens.length > 0
            ? normalizedTokens
            : tokenize(
                [brandSignals[0], categorySignals[0]]
                    .filter(Boolean)
                    .join(' ')
            )
    ).join(' ').trim();

    const hasFashionSignals = brandSignals.length > 0 || categorySignals.length > 0 || semanticExpansion.queries.length > 0;
    const hasBlockedSignals = blockedSignals.length > 0;

    let intent: QueryIntent = 'unknown';
    let allowed = true;
    let reason: string | undefined;

    if (hasBlockedSignals && !hasFashionSignals) {
        intent = 'non_fashion';
        allowed = false;
        reason = `LooPyck는 패션 비교 플랫폼입니다. ${blockedGroups[0]?.reason ?? '패션 아이템 중심으로 다시 검색해보세요.'}`;
    } else if (hasBlockedSignals && hasFashionSignals) {
        intent = 'mixed';
    } else if (hasFashionSignals) {
        intent = 'fashion';
    }

    const suggestedQueries = !allowed
        ? buildNonFashionSuggestions(blockedGroups, brandSignals)
        : uniqueOrdered([
            ...buildRelatedSuggestions({
            normalizedQuery: normalizedQuery || originalQuery,
            brandSignals,
            categorySignals,
            suggestedQueries: hasBlockedSignals ? buildNonFashionSuggestions(blockedGroups, brandSignals) : [],
            }),
            ...semanticExpansion.queries,
            ...semanticExpansion.related,
        ]).slice(0, 8);

    return {
        allowed,
        intent,
        reason,
        originalQuery,
        normalizedQuery: normalizedQuery || originalQuery,
        primaryTokens: uniqueOrdered([
            ...normalizedTokens,
            ...brandSignals,
            ...categorySignals,
        ]),
        brandSignals,
        categorySignals,
        blockedSignals,
        suggestedQueries,
    };
}

export function buildSourceAwareQueryCandidates(
    analysis: Pick<FashionQueryAnalysis, 'originalQuery' | 'normalizedQuery' | 'brandSignals' | 'categorySignals' | 'suggestedQueries' | 'primaryTokens'>,
    source: ProductSource
): string[] {
    const semanticExpansion = resolveSemanticFashionExpansion(analysis.originalQuery);
    const baseQuery = analysis.normalizedQuery || analysis.originalQuery;
    const primaryBrand = analysis.brandSignals[0];
    const brandVariants = primaryBrand
        ? uniqueOrdered([primaryBrand, ...(BRAND_QUERY_ALIASES[primaryBrand] || [])])
        : [];
    const primaryCategory = analysis.categorySignals[0];
    const categoryVariants = getCategoryQueryVariants(primaryCategory, source);
    const modifierVariants = getQueryModifierVariants(analysis, source);
    const modifierCategoryVariants = modifierVariants.flatMap((modifier) =>
        categoryVariants.length > 0 ? categoryVariants.map((variant) => `${modifier} ${variant}`) : [modifier]
    );

    const candidates = uniqueOrdered([
        baseQuery,
        analysis.originalQuery,
        ...brandVariants,
        ...categoryVariants,
        ...modifierCategoryVariants,
        ...categoryVariants.flatMap((variant) => brandVariants.map((brand) => `${brand} ${variant}`)),
        ...semanticExpansion.queries,
        ...semanticExpansion.related,
        ...analysis.suggestedQueries.slice(0, 2),
    ].map((value) => normalizeWhitespace(value || '')));

    return candidates.filter(Boolean).slice(0, 8);
}

export function buildSourceAwareSearchPlan(analysis: FashionQueryAnalysis): SearchQueryCandidatePlan {
    const plan: SearchQueryCandidatePlan = {
        NAVER: buildSourceAwareQueryCandidates(analysis, 'NAVER'),
    };

    DIRECT_QUERY_EXPANSION_SOURCES.forEach((source) => {
        plan[source] = buildSourceAwareQueryCandidates(analysis, source);
    });

    return plan;
}

function buildSearchText(product: UnifiedProduct): {
    title: string;
    brand: string;
    categories: string;
    mall: string;
} {
    return {
        title: normalizeSearchText(product.title),
        brand: normalizeSearchText(product.brand || ''),
        categories: normalizeSearchText(`${product.category1 || ''} ${product.category2 || ''}`),
        mall: normalizeSearchText(`${product.mallName || ''} ${product.source}`),
    };
}

function scoreProduct(product: UnifiedProduct, analysis: FashionQueryAnalysis): ScoredProduct {
    const text = buildSearchText(product);
    const effectiveQuery = normalizeSearchText(analysis.normalizedQuery);
    const requestedQuery = normalizeSearchText(analysis.originalQuery);
    const queryTokens = uniqueOrdered([
        ...analysis.primaryTokens,
        ...analysis.categorySignals,
        ...analysis.brandSignals,
    ]);

    let score = 0;
    let matchedTokens = 0;

    const exactMatch = Boolean(
        effectiveQuery && (
            text.title.includes(effectiveQuery)
            || text.brand.includes(effectiveQuery)
            || text.categories.includes(effectiveQuery)
        )
    );

    if (exactMatch) {
        score += 90;
    } else if (requestedQuery && text.title.includes(requestedQuery)) {
        score += 70;
    }

    for (const token of queryTokens) {
        const inTitle = text.title.includes(token);
        const inBrand = text.brand.includes(token);
        const inCategory = text.categories.includes(token);
        const inMall = text.mall.includes(token);

        if (inTitle) {
            score += 24;
            matchedTokens += 1;
            continue;
        }

        if (inBrand) {
            score += 28;
            matchedTokens += 1;
            continue;
        }

        if (inCategory) {
            score += 18;
            matchedTokens += 1;
            continue;
        }

        if (inMall) {
            score += 6;
            matchedTokens += 1;
            continue;
        }

        if (token.length > 2) {
            score -= 5;
        }
    }

    if (analysis.brandSignals.length > 0) {
        const brandMatched = analysis.brandSignals.some((brand) => text.brand.includes(brand) || text.title.includes(brand));
        score += brandMatched ? 36 : -14;
    }

    if (analysis.categorySignals.length > 0) {
        const categoryMatched = analysis.categorySignals.some((category) => text.title.includes(normalizeSearchText(category)) || text.categories.includes(normalizeSearchText(category)));
        score += categoryMatched ? 22 : -10;
    }

    const coverage = queryTokens.length > 0 ? matchedTokens / queryTokens.length : 0;
    score += coverage * 45;

    if (matchedTokens === queryTokens.length && queryTokens.length > 1) {
        score += 28;
    }

    return {
        product,
        score,
        exactMatch,
        matchedTokens,
        coverage,
    };
}

export function rerankProductsByFashionRelevance(
    products: UnifiedProduct[],
    analysis: FashionQueryAnalysis,
    sort: SearchSort
): { products: UnifiedProduct[]; meta: SearchExperienceMeta } {
    const scored = products.map((product) => scoreProduct(product, analysis));
    const maxScore = scored.reduce((max, item) => Math.max(max, item.score), 0);
    const exactMatchCount = scored.filter((item) => item.exactMatch).length;
    const strongMatchCount = scored.filter((item) => item.score >= 70 || item.coverage >= 0.75).length;

    const filterFloor = sort === 'sim'
        ? Math.max(18, maxScore * 0.22)
        : Math.max(8, maxScore * 0.14);

    const filtered = scored.filter((item) => item.score >= filterFloor);
    const scoped = filtered.length >= Math.min(scored.length, 8) ? filtered : scored;

    const sorted = [...scoped];
    if (sort === 'sim') {
        sorted.sort((left, right) =>
            right.score - left.score
            || right.coverage - left.coverage
            || left.product.price - right.product.price
        );
    } else if (sort === 'asc') {
        sorted.sort((left, right) =>
            left.product.price - right.product.price
            || right.score - left.score
        );
    } else {
        sorted.sort((left, right) =>
            right.product.price - left.product.price
            || right.score - left.score
        );
    }

    const resultQuality: ResultQuality = strongMatchCount >= 8 || exactMatchCount >= 4
        ? 'strong'
        : strongMatchCount >= 3 || exactMatchCount >= 1
            ? 'mixed'
            : 'weak';

    const suggestedQueries = resultQuality === 'strong'
        ? analysis.suggestedQueries.slice(0, 2)
        : buildRelatedSuggestions(analysis);

    return {
        products: sorted.map((item) => item.product),
        meta: {
            requestedQuery: analysis.originalQuery,
            effectiveQuery: analysis.normalizedQuery || analysis.originalQuery,
            queryIntent: analysis.intent,
            reranked: true,
            exactMatchCount,
            strongMatchCount,
            resultQuality,
            suggestedQueries,
        },
    };
}

export function searchProductsByFashionQuery(
    products: UnifiedProduct[],
    analysis: FashionQueryAnalysis,
    limitCount: number = 24
): UnifiedProduct[] {
    const normalizedLimit = Math.max(1, Math.min(limitCount, 120));
    const scored = products
        .map((product) => scoreProduct(product, analysis))
        .sort((left, right) =>
            right.score - left.score
            || right.coverage - left.coverage
            || left.product.price - right.product.price
        );

    if (scored.length === 0) {
        return [];
    }

    const maxScore = scored[0]?.score || 0;
    const scoreFloor = Math.max(16, maxScore * 0.18);
    const filtered = scored.filter((item) =>
        item.exactMatch
        || item.matchedTokens >= 1
        || item.coverage >= 0.34
        || item.score >= scoreFloor
    );

    return (filtered.length > 0 ? filtered : scored)
        .slice(0, normalizedLimit)
        .map((item) => item.product);
}
