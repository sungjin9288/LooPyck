import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://loopyck.vercel.app';

    // Static routes
    const routes = [
        '',
        '/about',
        '/login',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // TODO: Add dynamic product routes fetching from Firestore/API
    // const products = await getTopProducts();
    // const productUrls = products.map(...)

    return [...routes];
}
