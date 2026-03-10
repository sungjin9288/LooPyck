import type { ProductSource } from '../api/types.ts';

export type SourceRewriteRuleContext = {
    originalQuery: string;
    brandSignals: string[];
    categorySignals: string[];
    primaryTokens: string[];
    semanticClusterIds: string[];
};

type SourceRewriteRule = {
    sources: ProductSource[];
    matchClusters?: string[];
    matchCategories?: string[];
    matchTokens?: string[];
    queries: string[];
};

const KOREAN_FASHION_SOURCES: ProductSource[] = [
    'NAVER',
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'ABLY',
    'SSF',
    'COUPANG',
    'HANDSOME',
    'HAGO',
    'EQL',
    'LFMALL',
    'SIVILLAGE',
];

const GLOBAL_FASHION_SOURCES: ProductSource[] = ['FARFETCH', 'SSENSE'];

const SOURCE_REWRITE_RULES: SourceRewriteRule[] = [
    {
        sources: KOREAN_FASHION_SOURCES,
        matchClusters: ['hoodie_training'],
        queries: ['후드집업', '기모 후드집업', '트레이닝 후드집업', '집업 후드'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchClusters: ['training_pants'],
        queries: ['트랙 팬츠', '조거 팬츠', '트레이닝 팬츠', '러닝 조거 팬츠'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchClusters: ['windbreaker'],
        queries: ['바람막이', '윈드브레이커', '아노락', '러닝 자켓'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchClusters: ['fleece'],
        queries: ['플리스 자켓', '집업 플리스', '보아 플리스'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchClusters: ['wide_pants'],
        queries: ['와이드 팬츠', '와이드 슬랙스', '루즈핏 팬츠'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchClusters: ['running_shoes'],
        queries: ['러닝화', '러닝 슈즈', '쿠셔닝 러닝화', '트레이닝 스니커즈'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchTokens: ['남자', '남성', '맨즈'],
        queries: ['남성', '맨즈'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchTokens: ['여자', '여성', '우먼'],
        queries: ['여성', '우먼'],
    },
    {
        sources: KOREAN_FASHION_SOURCES,
        matchTokens: ['고프코어', '아웃도어', '등산'],
        queries: ['고프코어', '아웃도어', '등산', '카고 팬츠', '고프코어 팬츠'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchClusters: ['hoodie_training'],
        queries: ['zip hoodie', 'hoodie', 'training hoodie', 'oversized hoodie'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchClusters: ['training_pants'],
        queries: ['track pants', 'jogger pants', 'training pants', 'running joggers'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchClusters: ['windbreaker'],
        queries: ['windbreaker', 'running jacket', 'anorak', 'shell jacket'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchClusters: ['fleece'],
        queries: ['fleece jacket', 'zip fleece', 'boa fleece'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchClusters: ['wide_pants'],
        queries: ['wide pants', 'wide trousers', 'wide fit trousers'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchClusters: ['running_shoes'],
        queries: ['running shoes', 'training sneakers', 'cushioned running shoes'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchTokens: ['남자', '남성', '맨즈'],
        queries: ['mens', 'men'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchTokens: ['여자', '여성', '우먼'],
        queries: ['womens', 'women'],
    },
    {
        sources: GLOBAL_FASHION_SOURCES,
        matchTokens: ['고프코어', '아웃도어', '등산'],
        queries: ['gorpcore', 'outdoor', 'hiking', 'cargo pants', 'hiking pants'],
    },
];

function uniqueOrdered(values: string[]): string[] {
    const seen = new Set<string>();
    return values.filter((value) => {
        const normalized = value.trim();
        if (!normalized || seen.has(normalized)) {
            return false;
        }

        seen.add(normalized);
        return true;
    });
}

export function buildSourceRewriteQueries(
    source: ProductSource,
    context: SourceRewriteRuleContext
): string[] {
    const activeRules = SOURCE_REWRITE_RULES.filter((rule) => {
        if (!rule.sources.includes(source)) {
            return false;
        }

        if (rule.matchClusters && !rule.matchClusters.some((clusterId) => context.semanticClusterIds.includes(clusterId))) {
            return false;
        }

        if (rule.matchCategories && !rule.matchCategories.some((category) => context.categorySignals.includes(category))) {
            return false;
        }

        if (rule.matchTokens && !rule.matchTokens.some((token) => context.primaryTokens.includes(token) || context.originalQuery.includes(token))) {
            return false;
        }

        return true;
    });

    return uniqueOrdered(activeRules.flatMap((rule) => rule.queries)).slice(0, 8);
}
