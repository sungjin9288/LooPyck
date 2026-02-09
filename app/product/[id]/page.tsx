import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { getProductById } from '@/lib/api/realtimeAggregator';

type Props = {
    params: { id: string };
    searchParams: { [key: string]: string | string[] | undefined };
};

export async function generateMetadata(
    { params, searchParams }: Props,
    parent: ResolvingMetadata
): Promise<Metadata> {
    const id = params.id;
    const product = await getProductById(id);

    if (!product) {
        return {
            title: 'Product Not Found | LooPyck',
        };
    }

    const previousImages = (await parent).openGraph?.images || [];

    return {
        title: `${product.title} | LooPyck Market`,
        description: `Track price history and analyze trends for ${product.title} on LooPyck. Current price: ${product.price.toLocaleString()} KRW.`,
        openGraph: {
            images: [product.image, ...previousImages],
        },
    };
}

export default async function ProductPage({ params }: Props) {
    const product = await getProductById(params.id);

    if (!product) {
        notFound();
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title,
        image: product.image,
        description: `Buy ${product.title} at ${product.mallName}. Found via LooPyck.`,
        sku: product.id,
        brand: {
            '@type': 'Brand',
            name: product.brand || 'Unknown',
        },
        offers: {
            '@type': 'Offer',
            url: product.link,
            priceCurrency: 'KRW',
            price: product.price,
            itemCondition: 'https://schema.org/NewCondition',
            availability: 'https://schema.org/InStock',
            seller: {
                '@type': 'Organization',
                name: product.mallName,
            },
        },
    };

    return (
        <div className="min-h-screen bg-white">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    {/* Product Image */}
                    <div className="relative aspect-[3/4] bg-gray-100 rounded-3xl overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={product.image}
                            alt={product.title}
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Product Details */}
                    <div className="flex flex-col justify-center">
                        <span className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                            {product.mallName} • {product.source}
                        </span>
                        <h1 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                            {product.title}
                        </h1>
                        <div className="flex items-baseline gap-4 mb-8">
                            <span className="text-5xl font-bold tracking-tighter">
                                {product.price.toLocaleString()}
                                <span className="text-2xl ml-1 text-gray-500 font-normal">KRW</span>
                            </span>
                        </div>

                        <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-6 bg-black text-white text-xl font-bold rounded-2xl hover:bg-gray-900 transition-colors text-center"
                        >
                            View on Store
                        </a>

                        <div className="mt-8 p-6 bg-gray-50 rounded-2xl border border-gray-100">
                            <h3 className="font-bold mb-2">LooPyck Intelligence</h3>
                            <p className="text-gray-600">
                                This product is tracked across multiple platforms.
                                Price history and trend analysis are available in the app.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
