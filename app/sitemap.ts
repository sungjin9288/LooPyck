import { MetadataRoute } from 'next';
import { buildCanonicalProductDetailHref } from '@/lib/api/productSnapshot';
import { BRANDS_TO_TRACK } from '@/lib/config/brands';
import { listTrackedProductsForSitemap } from '@/lib/server/priceHistoryStore';
import { SITE_URL } from '@/lib/site';

export const runtime = 'nodejs';
export const revalidate = 300;
const MAX_TRACKED_PRODUCTS = 200;

/**
 * 시즌 인기 검색어 — 크롤러가 검색 결과 페이지를 발견할 수 있도록 노출
 * brand-trends API 없이도 정적으로 주요 키워드를 sitemap에 포함
 */
const TRENDING_QUERIES = [
    '나이키 에어포스', '뉴발란스 574', '아디다스 삼바', '살로몬 XT-6',
    '스투시 후드', '슈프림 박스로고', '카하트 WIP', '아더에러',
    '무신사 스탠다드 슬랙스', '트렌치코트 봄', '린넨 자켓', '고프코어',
    '올드머니 룩', 'Y2K 패션', '오버핏 티셔츠', '와이드 팬츠',
];

const STATIC_ROUTES = [
    '/',
    '/category/outer',
    '/category/denim',
    '/category/sneakers',
    '/category/knitwear',
    '/category/bag',
    '/brand/musinsa',
    '/brand/ably',
    '/brand/wconcept',
    '/brand/29cm',
    '/brand/zigzag',
    '/brand/ssf',
    '/brand/handsome',
    '/brand/coupang',
    '/brand/farfetch',
    '/brand/ssense',
    '/brand/hago',
    '/brand/eql',
    '/brand/lfmall',
    '/brand/sivillage',
];

function dedupeEntries(entries: MetadataRoute.Sitemap): MetadataRoute.Sitemap {
    const seen = new Set<string>();

    return entries.filter((entry) => {
        if (seen.has(entry.url)) {
            return false;
        }
        seen.add(entry.url);
        return true;
    });
}

async function getTrackedProductEntries(): Promise<MetadataRoute.Sitemap> {
    const products = await listTrackedProductsForSitemap(MAX_TRACKED_PRODUCTS);

    return products.map((product) => ({
        url: new URL(buildCanonicalProductDetailHref(product), SITE_URL).toString(),
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'daily',
        priority: 0.7,
    }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const now = new Date();

    // 1. 정적 페이지
    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
        url: `${SITE_URL}${route === '/' ? '' : route}`,
        lastModified: now,
        changeFrequency: route === '/' ? 'daily' : 'weekly',
        priority: route === '/' ? 1.0 : 0.8,
    }));

    // 2. 브랜드 페이지 (brands.ts에서 자동 파생)
    const brandEntries: MetadataRoute.Sitemap = BRANDS_TO_TRACK.map((brand) => ({
        url: `${SITE_URL}/?q=${encodeURIComponent(brand)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
    }));

    // 3. 시즌 인기 검색 키워드 페이지
    const trendingEntries: MetadataRoute.Sitemap = TRENDING_QUERIES.map((q) => ({
        url: `${SITE_URL}/?q=${encodeURIComponent(q)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    const trackedEntries = await getTrackedProductEntries();

    return dedupeEntries([...staticEntries, ...brandEntries, ...trendingEntries, ...trackedEntries]);
}
