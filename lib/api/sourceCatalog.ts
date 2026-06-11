import { isProductSource, type ProductSource, type UnifiedProduct } from './types.ts';

type SourceMetadata = {
    label: string;
    badgeLabel: string;
    badgeBg: string;
    badgeColor: string;
    scanningLabel: string;
    idPrefix: string;
    aliases: readonly string[];
    domains: readonly string[];
};

export type RetailerTrust = 'official_mall' | 'marketplace_seller' | 'reseller';

const SOURCE_CATALOG: Record<ProductSource, SourceMetadata> = {
    NAVER: {
        label: '네이버쇼핑',
        badgeLabel: 'N',
        badgeBg: '#03C75A',
        badgeColor: '#FFFFFF',
        scanningLabel: 'Naver Shopping',
        idPrefix: 'naver',
        aliases: ['naver', '네이버', 'smartstore'],
        domains: ['shopping.naver.com', 'smartstore.naver.com'],
    },
    MUSINSA: {
        label: '무신사',
        badgeLabel: 'MUSINSA',
        badgeBg: '#111111',
        badgeColor: '#FFFFFF',
        scanningLabel: 'Musinsa',
        idPrefix: 'musinsa',
        aliases: ['musinsa', '무신사'],
        domains: ['musinsa.com'],
    },
    '29CM': {
        label: '29CM',
        badgeLabel: '29CM',
        badgeBg: '#333333',
        badgeColor: '#FFFFFF',
        scanningLabel: '29CM',
        idPrefix: '29cm',
        aliases: ['29cm'],
        domains: ['29cm.co.kr'],
    },
    W_CONCEPT: {
        label: 'W컨셉',
        badgeLabel: 'W',
        badgeBg: '#FA5500',
        badgeColor: '#FFFFFF',
        scanningLabel: 'W Concept',
        idPrefix: 'wconcept',
        aliases: ['w concept', 'wconcept', 'w컨셉'],
        domains: ['wconcept.co.kr'],
    },
    ZIGZAG: {
        label: '지그재그',
        badgeLabel: 'Z',
        badgeBg: '#FF416C',
        badgeColor: '#FFFFFF',
        scanningLabel: 'Zigzag',
        idPrefix: 'zigzag',
        aliases: ['zigzag', '지그재그'],
        domains: ['zigzag.kr'],
    },
    ABLY: {
        label: '에이블리',
        badgeLabel: 'ABLY',
        badgeBg: '#FF5B79',
        badgeColor: '#FFFFFF',
        scanningLabel: 'Ably',
        idPrefix: 'ably',
        aliases: ['ably', '에이블리'],
        domains: ['a-bly.com'],
    },
    SSF: {
        label: 'SSF샵',
        badgeLabel: 'SSF',
        badgeBg: '#0F172A',
        badgeColor: '#FFFFFF',
        scanningLabel: 'SSF Shop',
        idPrefix: 'ssf',
        aliases: ['ssf', 'ssf shop', 'ssf샵', 'ssfshop'],
        domains: ['ssfshop.com'],
    },
    HANDSOME: {
        label: '한섬',
        badgeLabel: 'HANDSOME',
        badgeBg: '#5B4636',
        badgeColor: '#FFFFFF',
        scanningLabel: 'Handsome',
        idPrefix: 'handsome',
        aliases: ['handsome', 'the handsome', 'thehandsome', '한섬'],
        domains: ['thehandsome.com'],
    },
    FARFETCH: {
        label: 'Farfetch',
        badgeLabel: 'FF',
        badgeBg: '#000000',
        badgeColor: '#FFFFFF',
        scanningLabel: 'Farfetch',
        idPrefix: 'farfetch',
        aliases: ['farfetch', '파페치'],
        domains: ['farfetch.com'],
    },
    COUPANG: {
        label: '쿠팡',
        badgeLabel: 'CP',
        badgeBg: '#346AFF',
        badgeColor: '#FFFFFF',
        scanningLabel: 'Coupang',
        idPrefix: 'coupang',
        aliases: ['coupang', '쿠팡'],
        domains: ['coupang.com'],
    },
    SSENSE: {
        label: 'SSENSE',
        badgeLabel: 'SSENSE',
        badgeBg: '#1E293B',
        badgeColor: '#FFFFFF',
        scanningLabel: 'SSENSE',
        idPrefix: 'ssense',
        aliases: ['ssense', '센스'],
        domains: ['ssense.com'],
    },
    HAGO: {
        label: 'HAGO',
        badgeLabel: 'HAGO',
        badgeBg: '#2F4858',
        badgeColor: '#FFFFFF',
        scanningLabel: 'HAGO',
        idPrefix: 'hago',
        aliases: ['hago'],
        domains: ['hago.kr'],
    },
    EQL: {
        label: 'EQL',
        badgeLabel: 'EQL',
        badgeBg: '#7C3AED',
        badgeColor: '#FFFFFF',
        scanningLabel: 'EQL',
        idPrefix: 'eql',
        aliases: ['eql'],
        domains: ['eqlstore.com'],
    },
    LFMALL: {
        label: 'LF몰',
        badgeLabel: 'LF',
        badgeBg: '#1D4ED8',
        badgeColor: '#FFFFFF',
        scanningLabel: 'LF Mall',
        idPrefix: 'lfmall',
        aliases: ['lf mall', 'lfmall', 'lf몰', 'lf몰'],
        domains: ['lfmall.co.kr'],
    },
    SIVILLAGE: {
        label: 'S.I.VILLAGE',
        badgeLabel: 'SIV',
        badgeBg: '#8B5E3C',
        badgeColor: '#FFFFFF',
        scanningLabel: 'S.I.VILLAGE',
        idPrefix: 'sivillage',
        aliases: ['s.i.village', 'sivillage', 'si village'],
        domains: ['sivillage.com'],
    },
};

const DETECTION_ORDER: ProductSource[] = [
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'ABLY',
    'SSF',
    'HANDSOME',
    'COUPANG',
    'FARFETCH',
    'SSENSE',
    'HAGO',
    'EQL',
    'LFMALL',
    'SIVILLAGE',
];

const OFFICIAL_RETAIL_SOURCES = new Set<ProductSource>([
    'MUSINSA',
    '29CM',
    'W_CONCEPT',
    'ZIGZAG',
    'ABLY',
    'SSF',
    'HANDSOME',
    'SSENSE',
    'HAGO',
    'EQL',
    'LFMALL',
    'SIVILLAGE',
]);

const OFFICIAL_HINTS = [
    'official',
    '공식',
    '브랜드관',
    '본사',
    '직영',
    '본점',
];

const RESELLER_HINTS = [
    'resale',
    'reseller',
    '리셀',
    '중고',
    '빈티지',
    '편집샵',
    '셀렉트샵',
    'boutique',
];

function normalizeText(value: string): string {
    return value.trim().toLowerCase();
}

function normalizeRetailerText(value: string): string {
    return value.normalize('NFKC').trim().toLowerCase();
}

function getHostname(link: string): string {
    try {
        return new URL(link).hostname.toLowerCase();
    } catch {
        return '';
    }
}

function matchesSource(source: ProductSource, mallName: string, link: string): boolean {
    const metadata = SOURCE_CATALOG[source];
    const normalizedMallName = normalizeText(mallName);
    const hostname = getHostname(link);

    const aliasMatched = metadata.aliases.some((alias) => normalizedMallName.includes(alias));
    const domainMatched = metadata.domains.some((domain) => hostname === domain || hostname.endsWith(`.${domain}`));

    return aliasMatched || domainMatched;
}

export function detectMarketplaceSource(mallName: string, link: string): ProductSource {
    for (const source of DETECTION_ORDER) {
        if (matchesSource(source, mallName, link)) {
            return source;
        }
    }

    return 'NAVER';
}

export function getSourceMetadata(source: ProductSource): SourceMetadata {
    return SOURCE_CATALOG[source];
}

export function getSourceDisplayName(source: ProductSource, fallbackMallName?: string): string {
    const trimmedFallback = fallbackMallName?.trim();
    if (source === 'NAVER' && trimmedFallback) {
        return trimmedFallback;
    }
    return SOURCE_CATALOG[source].label || trimmedFallback || SOURCE_CATALOG.NAVER.label;
}

export function getSourceIdPrefix(source: ProductSource): string {
    return SOURCE_CATALOG[source].idPrefix;
}

export function classifyRetailerTrust(
    product: Pick<UnifiedProduct, 'source' | 'mallName' | 'brand' | 'link'>
): RetailerTrust {
    const combined = normalizeRetailerText(`${product.mallName || ''} ${product.brand || ''} ${product.link || ''}`);

    if (RESELLER_HINTS.some((keyword) => combined.includes(keyword))) {
        return 'reseller';
    }

    if (OFFICIAL_HINTS.some((keyword) => combined.includes(keyword))) {
        return 'official_mall';
    }

    if (product.source === 'FARFETCH') {
        return 'reseller';
    }

    if (OFFICIAL_RETAIL_SOURCES.has(product.source)) {
        return 'official_mall';
    }

    return 'marketplace_seller';
}

export function getRetailerTrustLabel(trust: RetailerTrust): string {
    if (trust === 'official_mall') return '공식몰';
    if (trust === 'reseller') return '리셀/편집숍';
    return '마켓 셀러';
}

export function stripSourceIdPrefix(value: string): string {
    const trimmed = value.trim();
    for (const metadata of Object.values(SOURCE_CATALOG)) {
        const prefix = `${metadata.idPrefix}_`;
        if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
            return trimmed.slice(prefix.length);
        }
    }
    return trimmed;
}

export const DEFAULT_SCANNING_SOURCE_LABELS = [
    SOURCE_CATALOG.NAVER.scanningLabel,
    ...DETECTION_ORDER.map((source) => SOURCE_CATALOG[source].scanningLabel),
];

export function coerceProductSource(value: string): ProductSource | null {
    return isProductSource(value) ? value : null;
}
