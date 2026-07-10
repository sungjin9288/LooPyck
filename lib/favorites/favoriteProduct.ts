import type { Product } from '../../types/product';
import type { UnifiedProduct } from '../api/types.ts';

type FavoriteIdentityInput = Pick<Product, 'productId' | 'favoriteId' | 'source' | 'variantKey'>;
type FavoriteBaseIdentityInput = Pick<Product, 'productId' | 'source'>;

export function buildFavoriteDocId(input: FavoriteIdentityInput): string {
    if (input.favoriteId) {
        return input.favoriteId;
    }

    if (input.variantKey) {
        return `${input.source || 'unknown'}:${input.productId}:${input.variantKey}`;
    }

    return input.productId;
}

export function buildFavoriteBaseKey(input: FavoriteBaseIdentityInput): string {
    return input.source ? `${input.source}:${input.productId}` : input.productId;
}

export function dedupeFavoritesForInsights(products: Product[]): Product[] {
    const deduped = new Map<string, Product>();

    products.forEach((product) => {
        const key = buildFavoriteBaseKey(product);
        if (!deduped.has(key)) {
            deduped.set(key, product);
        }
    });

    return Array.from(deduped.values());
}

export function buildFavoriteProductFromUnified(
    product: UnifiedProduct,
    options?: {
        variantKey?: string;
        variantLabel?: string;
        optionKey?: string;
    }
): Product {
    const favoriteId = buildFavoriteDocId({
        productId: product.id,
        source: product.source,
        variantKey: options?.variantKey,
    });

    const params = new URLSearchParams({ source: product.source });
    if (options?.variantKey) {
        params.set('variantKey', options.variantKey);
    }

    return {
        favoriteId,
        title: product.title,
        link: product.link,
        image: product.image,
        lprice: String(product.price),
        hprice: String(product.price),
        mallName: product.mallName,
        productId: product.id,
        productType: '1',
        brand: product.brand || '',
        maker: '',
        category1: product.category1 || '',
        category2: product.category2 || '',
        category3: '',
        category4: '',
        source: product.source,
        variantKey: options?.variantKey,
        variantLabel: options?.variantLabel,
        variantId: product.variantId,
        variantSku: product.variantSku,
        optionKey: options?.optionKey,
        deepLink: `/product/${encodeURIComponent(product.id)}?${params.toString()}`,
        shippingText: product.shippingText,
        shippingFee: product.shippingFee,
        benefitPrice: product.benefitPrice,
        benefitText: product.benefitText,
    };
}
