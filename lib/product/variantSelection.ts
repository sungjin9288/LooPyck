import type { ProductVariantCandidate, UnifiedProduct } from '../api/types.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';

export type VariantSelectionOption = ProductVariantCandidate & {
    key: string;
    matchedMallCount: number;
};

function normalizeWhitespace(value: string): string {
    return normalizeTitle(value).replace(/\s+/g, ' ').trim();
}

function normalizeLabel(value: string | undefined): string {
    return normalizeWhitespace(value || '').toLowerCase();
}

function normalizeVariantId(value: string | undefined): string {
    return normalizeWhitespace(value || '').toLowerCase();
}

function normalizeVariantSku(value: string | undefined): string {
    return normalizeWhitespace(value || '').toUpperCase();
}

function buildVariantSummary(candidate: Pick<ProductVariantCandidate, 'label' | 'color' | 'size'>): string | undefined {
    if (candidate.color || candidate.size) {
        const parts: string[] = [];
        if (candidate.color) parts.push(`색상 ${candidate.color}`);
        if (candidate.size) parts.push(`사이즈 ${candidate.size}`);
        return parts.join(' · ');
    }

    return candidate.label || undefined;
}

function buildVariantSelectionKey(candidate: Partial<ProductVariantCandidate>): string {
    return [
        normalizeVariantId(candidate.variantId),
        normalizeVariantSku(candidate.variantSku),
        normalizeLabel(candidate.color),
        normalizeLabel(candidate.size),
        normalizeLabel(candidate.label),
    ].join('|');
}

function getCurrentProductCandidate(product: UnifiedProduct): ProductVariantCandidate | null {
    const label = buildVariantSummary({
        label: product.optionSummary || product.optionValues?.[0] || undefined,
        color: product.colorOptions?.[0],
        size: product.sizeOptions?.[0],
    }) || product.optionSummary || product.variantSku || product.variantId;

    if (!label && !product.variantId && !product.variantSku) {
        return null;
    }

    return {
        label: label || '현재 옵션',
        variantId: product.variantId,
        variantSku: product.variantSku,
        color: product.colorOptions?.[0],
        size: product.sizeOptions?.[0],
        price: product.price,
        stockStatus: product.stockStatus,
    };
}

function getProductCandidates(product: UnifiedProduct): ProductVariantCandidate[] {
    const explicitCandidates = product.variantCandidates || [];
    const currentCandidate = getCurrentProductCandidate(product);

    if (!currentCandidate) {
        return explicitCandidates;
    }

    const dedup = new Map<string, ProductVariantCandidate>();
    [...explicitCandidates, currentCandidate].forEach((candidate) => {
        dedup.set(buildVariantSelectionKey(candidate), candidate);
    });

    return Array.from(dedup.values());
}

export function variantCandidateMatchesSelection(
    candidate: Partial<ProductVariantCandidate>,
    selected: Partial<ProductVariantCandidate>
): boolean {
    const selectedVariantId = normalizeVariantId(selected.variantId);
    const selectedVariantSku = normalizeVariantSku(selected.variantSku);
    const candidateVariantId = normalizeVariantId(candidate.variantId);
    const candidateVariantSku = normalizeVariantSku(candidate.variantSku);

    if (selectedVariantId && candidateVariantId && selectedVariantId === candidateVariantId) {
        return true;
    }

    if (selectedVariantSku && candidateVariantSku && selectedVariantSku === candidateVariantSku) {
        return true;
    }

    const selectedColor = normalizeLabel(selected.color);
    const selectedSize = normalizeLabel(selected.size);
    const candidateColor = normalizeLabel(candidate.color);
    const candidateSize = normalizeLabel(candidate.size);

    if (selectedColor && selectedSize && selectedColor === candidateColor && selectedSize === candidateSize) {
        return true;
    }

    const selectedLabel = normalizeLabel(selected.label);
    const candidateLabel = normalizeLabel(candidate.label);
    if (selectedLabel && candidateLabel && selectedLabel === candidateLabel) {
        return true;
    }

    if (selectedColor && candidateColor && selectedColor === candidateColor && !selectedSize && !candidateSize) {
        return true;
    }

    if (selectedSize && candidateSize && selectedSize === candidateSize && !selectedColor && !candidateColor) {
        return true;
    }

    return false;
}

function mergeSelectionOption(
    current: VariantSelectionOption | undefined,
    candidate: ProductVariantCandidate
): VariantSelectionOption {
    if (!current) {
        return {
            ...candidate,
            key: buildVariantSelectionKey(candidate),
            matchedMallCount: 0,
        };
    }

    return {
        ...current,
        label: current.label.length >= candidate.label.length ? current.label : candidate.label,
        variantId: current.variantId || candidate.variantId,
        variantSku: current.variantSku || candidate.variantSku,
        color: current.color || candidate.color,
        size: current.size || candidate.size,
        price: typeof current.price === 'number' ? current.price : candidate.price,
        stockStatus: current.stockStatus && current.stockStatus !== 'unknown'
            ? current.stockStatus
            : candidate.stockStatus,
    };
}

export function listVariantSelectionOptions(
    products: UnifiedProduct[],
    preferredProduct?: UnifiedProduct
): VariantSelectionOption[] {
    const orderedProducts = preferredProduct
        ? [preferredProduct, ...products.filter((product) => !(product.id === preferredProduct.id && product.source === preferredProduct.source))]
        : products;

    const merged = new Map<string, VariantSelectionOption>();

    orderedProducts.forEach((product) => {
        const seenInProduct = new Set<string>();
        getProductCandidates(product).forEach((candidate) => {
            const key = buildVariantSelectionKey(candidate);
            if (!key) {
                return;
            }

            const next = mergeSelectionOption(merged.get(key), candidate);
            if (!seenInProduct.has(key)) {
                next.matchedMallCount += 1;
                seenInProduct.add(key);
            }
            merged.set(key, next);
        });
    });

    return Array.from(merged.values()).sort((left, right) => {
        if (right.matchedMallCount !== left.matchedMallCount) {
            return right.matchedMallCount - left.matchedMallCount;
        }
        return left.label.localeCompare(right.label);
    });
}

export function getDefaultVariantSelectionKey(
    products: UnifiedProduct[],
    preferredProduct?: UnifiedProduct
): string | undefined {
    const options = listVariantSelectionOptions(products, preferredProduct);
    if (options.length === 0) {
        return undefined;
    }

    const preferredCandidate = preferredProduct ? getCurrentProductCandidate(preferredProduct) : null;
    if (preferredCandidate) {
        const matched = options.find((option) => variantCandidateMatchesSelection(option, preferredCandidate));
        if (matched) {
            return matched.key;
        }
    }

    return options[0]?.key;
}

export function findSelectedVariantOption(
    options: VariantSelectionOption[],
    selectedKey?: string | null
): VariantSelectionOption | undefined {
    if (!selectedKey) return undefined;
    return options.find((option) => option.key === selectedKey);
}

export function applyVariantSelectionToProduct(
    product: UnifiedProduct,
    selected?: VariantSelectionOption
): UnifiedProduct {
    if (!selected) {
        return product;
    }

    const matchedCandidate = getProductCandidates(product).find((candidate) =>
        variantCandidateMatchesSelection(candidate, selected)
    );

    const summary = buildVariantSummary(selected);
    const selectedOptionValues = selected.label ? [selected.label] : product.optionValues;
    const selectedColorOptions = selected.color ? [selected.color] : product.colorOptions;
    const selectedSizeOptions = selected.size ? [selected.size] : product.sizeOptions;

    if (!matchedCandidate) {
        if (!product.variantCandidates?.length) {
            return {
                ...product,
                optionSummary: summary || product.optionSummary,
                optionValues: selectedOptionValues,
                colorOptions: selectedColorOptions,
                sizeOptions: selectedSizeOptions,
            };
        }

        return {
            ...product,
            stockStatus: 'sold_out',
            stockText: `선택 variant 미지원: ${selected.label}`,
            optionSummary: summary || product.optionSummary,
            optionValues: selectedOptionValues,
            colorOptions: selectedColorOptions,
            sizeOptions: selectedSizeOptions,
        };
    }

    const selectedSummary = buildVariantSummary(matchedCandidate) || summary;

    return {
        ...product,
        price: typeof matchedCandidate.price === 'number' ? matchedCandidate.price : product.price,
        stockStatus: matchedCandidate.stockStatus || product.stockStatus,
        stockText: matchedCandidate.stockStatus === 'sold_out'
            ? `선택 variant 품절: ${matchedCandidate.label}`
            : product.stockText,
        variantId: matchedCandidate.variantId || product.variantId,
        variantSku: matchedCandidate.variantSku || product.variantSku,
        optionSummary: selectedSummary || product.optionSummary,
        optionValues: matchedCandidate.label ? [matchedCandidate.label] : selectedOptionValues,
        colorOptions: matchedCandidate.color ? [matchedCandidate.color] : selectedColorOptions,
        sizeOptions: matchedCandidate.size ? [matchedCandidate.size] : selectedSizeOptions,
    };
}

export function applyVariantSelectionToProducts(
    products: UnifiedProduct[],
    selected?: VariantSelectionOption
): UnifiedProduct[] {
    return products.map((product) => applyVariantSelectionToProduct(product, selected));
}
