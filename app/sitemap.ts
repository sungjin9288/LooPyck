import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://loo-pyck.vercel.app';

    const staticRoutes = ['/', '/category/outer', '/category/denim', '/category/sneakers', '/category/knitwear', '/category/bag',
        '/brand/musinsa', '/brand/ably', '/brand/wconcept', '/brand/29cm', '/brand/zigzag'];

    return staticRoutes.map((route) => ({
        url: `${baseUrl}${route === '/' ? '' : route}`,
        lastModified: new Date(),
        changeFrequency: route === '/' ? 'daily' as const : 'weekly' as const,
        priority: route === '/' ? 1 : 0.8,
    }));
}
