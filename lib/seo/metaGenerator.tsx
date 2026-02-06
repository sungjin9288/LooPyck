/**
 * SEO Meta Generator - 동적 메타 태그 및 JSON-LD 생성
 * Next.js Metadata API 연동
 */

import type { Metadata } from 'next';

// 상품 정보 타입
interface ProductSEOData {
    name: string;
    description?: string;
    price: number;
    originalPrice?: number;
    brand?: string;
    imageUrl?: string;
    url: string;
    mall: string;
    category?: string;
    material?: string;
    available?: boolean;
}

// 사이트 기본 정보
const SITE_CONFIG = {
    name: 'LooPyck',
    description: '패션 쇼핑몰 가격 비교 및 AI 스타일 추천',
    url: 'https://loopyck.com',
    locale: 'ko_KR',
    twitterHandle: '@loopyck',
};

/**
 * 상품 페이지 메타데이터 생성
 */
export function generateProductMeta(product: ProductSEOData): Metadata {
    const title = product.brand
        ? `${product.name} | ${product.brand} - ${SITE_CONFIG.name}`
        : `${product.name} - ${SITE_CONFIG.name}`;

    const description = product.description
        || `${product.name}을(를) ${formatPrice(product.price)}에 구매하세요. ${product.mall}에서 최저가 확인!`;

    return {
        title,
        description,

        openGraph: {
            title: product.name,
            description,
            url: product.url,
            siteName: SITE_CONFIG.name,
            locale: SITE_CONFIG.locale,
            type: 'website',
            images: product.imageUrl ? [
                {
                    url: product.imageUrl,
                    width: 800,
                    height: 800,
                    alt: product.name,
                }
            ] : undefined,
        },

        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description,
            images: product.imageUrl ? [product.imageUrl] : undefined,
            creator: SITE_CONFIG.twitterHandle,
        },

        alternates: {
            canonical: product.url,
        },

        robots: {
            index: true,
            follow: true,
        },
    };
}

/**
 * JSON-LD Product 스키마 생성
 */
export function generateProductJsonLd(product: ProductSEOData): object {
    const jsonLd: Record<string, unknown> = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description || `${product.name} - ${product.mall}`,
        url: product.url,

        offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'KRW',
            availability: product.available !== false
                ? 'https://schema.org/InStock'
                : 'https://schema.org/OutOfStock',
            seller: {
                '@type': 'Organization',
                name: product.mall,
            },
        },
    };

    // 할인 정보
    if (product.originalPrice && product.originalPrice > product.price) {
        (jsonLd.offers as Record<string, unknown>).priceValidUntil = getNextMonth();
        jsonLd.priceSpecification = {
            '@type': 'PriceSpecification',
            price: product.originalPrice,
            priceCurrency: 'KRW',
            valueAddedTaxIncluded: true,
        };
    }

    // 이미지
    if (product.imageUrl) {
        jsonLd.image = product.imageUrl;
    }

    // 브랜드
    if (product.brand) {
        jsonLd.brand = {
            '@type': 'Brand',
            name: product.brand,
        };
    }

    // 카테고리
    if (product.category) {
        jsonLd.category = product.category;
    }

    // 소재
    if (product.material) {
        jsonLd.material = product.material;
    }

    return jsonLd;
}

/**
 * 검색 결과 페이지 메타데이터
 */
export function generateSearchMeta(query: string, resultsCount: number): Metadata {
    const title = `"${query}" 검색 결과 - ${SITE_CONFIG.name}`;
    const description = `${query} 관련 상품 ${resultsCount}개를 찾았습니다. 최저가 비교 및 AI 스타일 추천을 확인하세요.`;

    return {
        title,
        description,
        robots: {
            index: resultsCount > 0,
            follow: true,
        },
    };
}

/**
 * 홈페이지 메타데이터
 */
export function generateHomeMeta(): Metadata {
    return {
        title: `${SITE_CONFIG.name} - 패션 최저가 비교 & AI 스타일 추천`,
        description: SITE_CONFIG.description,

        openGraph: {
            title: SITE_CONFIG.name,
            description: SITE_CONFIG.description,
            url: SITE_CONFIG.url,
            siteName: SITE_CONFIG.name,
            locale: SITE_CONFIG.locale,
            type: 'website',
        },

        twitter: {
            card: 'summary',
            title: SITE_CONFIG.name,
            description: SITE_CONFIG.description,
        },
    };
}

/**
 * JSON-LD 스크립트 태그 생성 (React 컴포넌트용)
 */
export function JsonLdScript({ data }: { data: object }): JSX.Element {
    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
    );
}

/**
 * BreadcrumbList JSON-LD 생성
 */
export function generateBreadcrumbJsonLd(
    items: { name: string; url: string }[]
): object {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Organization JSON-LD (홈페이지용)
 */
export function generateOrganizationJsonLd(): object {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        description: SITE_CONFIG.description,
        sameAs: [
            `https://twitter.com/${SITE_CONFIG.twitterHandle.replace('@', '')}`,
        ],
    };
}

// 헬퍼 함수
function formatPrice(price: number): string {
    return new Intl.NumberFormat('ko-KR').format(price) + '원';
}

function getNextMonth(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().split('T')[0];
}
