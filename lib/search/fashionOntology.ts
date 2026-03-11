import { normalizeTitle } from '../core/dataNormalizer.ts';

export type SemanticFashionCluster = {
    id: string;
    triggers: string[];
    categories: string[];
    queries: string[];
    related: string[];
};

export const SEMANTIC_FASHION_CLUSTERS: SemanticFashionCluster[] = [
    {
        id: 'hoodie_training',
        triggers: ['후드', '후드티', '후디', '후드집업', '집업 후드', 'hoodie'],
        categories: ['후드집업'],
        queries: ['후드집업', '기모 후드집업', '오버핏 후드집업', '트레이닝 후드집업', '스포츠 후드집업'],
        related: ['집업 후드', '트레이닝 후드집업', '스포츠 후드집업'],
    },
    {
        id: 'training_pants',
        triggers: ['트레이닝 팬츠', '트랙 팬츠', '조거', '조거 팬츠', 'track pants', 'jogger'],
        categories: ['트랙 팬츠', '조거 팬츠'],
        queries: ['트레이닝 팬츠', '트랙 팬츠', '조거 팬츠', '러닝 조거 팬츠', '나일론 트랙 팬츠'],
        related: ['사이드 라인 트랙 팬츠', '스웨트 조거 팬츠', '러닝 조거 팬츠'],
    },
    {
        id: 'windbreaker',
        triggers: ['바람막이', '윈드브레이커', '러닝 자켓', '아노락', 'windbreaker'],
        categories: ['바람막이', '자켓'],
        queries: ['바람막이', '윈드브레이커', '러닝 자켓', '아노락', '트랙 자켓'],
        related: ['러닝 자켓', '윈드브레이커', '아노락'],
    },
    {
        id: 'wide_pants',
        triggers: ['와이드 팬츠', '와이드핏 팬츠', '와이드 슬랙스', 'wide pants', 'wide fit'],
        categories: ['슬랙스'],
        queries: ['와이드 팬츠', '와이드 슬랙스', '루즈핏 팬츠', '플리츠 팬츠'],
        related: ['와이드 슬랙스', '루즈핏 팬츠', '플리츠 팬츠'],
    },
    {
        id: 'fleece',
        triggers: ['플리스', '후리스', '보아', 'fleece'],
        categories: ['플리스'],
        queries: ['플리스 자켓', '집업 플리스', '보아 플리스'],
        related: ['집업 플리스', '보아 플리스', '플리스 자켓'],
    },
    {
        id: 'running_shoes',
        triggers: ['러닝화', '런닝화', '러닝 슈즈', 'running shoes'],
        categories: ['스니커즈'],
        queries: ['러닝화', '러닝 슈즈', '쿠셔닝 러닝화', '트레이닝 스니커즈'],
        related: ['쿠셔닝 러닝화', '트레이닝 스니커즈', '로우탑 스니커즈'],
    },
];

export function getSemanticFashionClusterLabel(clusterId: string): string {
    switch (clusterId) {
        case 'hoodie_training':
            return '후드/후드집업';
        case 'training_pants':
            return '트레이닝/조거 팬츠';
        case 'windbreaker':
            return '바람막이/러닝 자켓';
        case 'wide_pants':
            return '와이드 팬츠';
        case 'fleece':
            return '플리스';
        case 'running_shoes':
            return '러닝화/스니커즈';
        default:
            return clusterId;
    }
}

function normalizeOntologyText(text: string): string {
    return normalizeTitle(text)
        .toLowerCase()
        .replace(/[()[\]{}|/\\,.;:_+*?!~`"'“”‘’<>-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

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

export function resolveSemanticFashionExpansion(query: string): {
    categories: string[];
    queries: string[];
    related: string[];
    matchedClusterIds: string[];
} {
    const normalizedQuery = normalizeOntologyText(query);
    const matchedClusters = SEMANTIC_FASHION_CLUSTERS.filter((cluster) =>
        cluster.triggers.some((trigger) => normalizedQuery.includes(normalizeOntologyText(trigger)))
    );

    return {
        categories: uniqueOrdered(matchedClusters.flatMap((cluster) => cluster.categories)),
        queries: uniqueOrdered(matchedClusters.flatMap((cluster) => cluster.queries)),
        related: uniqueOrdered(matchedClusters.flatMap((cluster) => cluster.related)),
        matchedClusterIds: matchedClusters.map((cluster) => cluster.id),
    };
}
