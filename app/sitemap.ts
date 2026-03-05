import { MetadataRoute } from 'next';
import { BRANDS_TO_TRACK } from '@/lib/config/brands';

const BASE_URL = 'https://loo-pyck.vercel.app';

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
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();

    // 1. 정적 페이지
    const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((route) => ({
        url: `${BASE_URL}${route === '/' ? '' : route}`,
        lastModified: now,
        changeFrequency: route === '/' ? 'daily' : 'weekly',
        priority: route === '/' ? 1.0 : 0.8,
    }));

    // 2. 브랜드 페이지 (brands.ts에서 자동 파생)
    const brandEntries: MetadataRoute.Sitemap = BRANDS_TO_TRACK.map((brand) => ({
        url: `${BASE_URL}/?q=${encodeURIComponent(brand)}`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.7,
    }));

    // 3. 시즌 인기 검색 키워드 페이지
    const trendingEntries: MetadataRoute.Sitemap = TRENDING_QUERIES.map((q) => ({
        url: `${BASE_URL}/?q=${encodeURIComponent(q)}`,
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.6,
    }));

    return [...staticEntries, ...brandEntries, ...trendingEntries];
}
