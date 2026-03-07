import * as cheerio from 'cheerio';
import type { ProductSource, ProductVariantCandidate, UnifiedProduct } from '../api/types.ts';
import { normalizeTitle } from '../core/dataNormalizer.ts';
import { buildCommerceDataFromTexts, inferAvailabilityStatus, mergeCommerceData, parseBenefitText, parseShippingText, parseStockSignal } from './sourceCommerceParsing.ts';

export type PdpDetailSignals = Pick<
    UnifiedProduct,
    | 'shippingFee'
    | 'shippingFreeThreshold'
    | 'shippingText'
    | 'benefitPrice'
    | 'benefitText'
    | 'stockStatus'
    | 'stockText'
    | 'variantId'
    | 'variantSku'
    | 'optionSummary'
    | 'optionValues'
    | 'sizeOptions'
    | 'colorOptions'
    | 'variantCandidates'
    | 'detailCollectedAt'
>;

export function hasPdpDetailData(product: Pick<UnifiedProduct, 'detailCollectedAt' | 'variantId' | 'variantSku' | 'optionSummary' | 'optionValues' | 'sizeOptions' | 'colorOptions' | 'variantCandidates'>): boolean {
    return Boolean(
        product.detailCollectedAt
        || product.variantId
        || product.variantSku
        || product.optionSummary
        || product.optionValues?.length
        || product.sizeOptions?.length
        || product.colorOptions?.length
        || product.variantCandidates?.length
    );
}

type ProductDetailParserConfig = {
    source: ProductSource;
    allowedHosts: readonly string[];
    shippingSelectors: readonly string[];
    benefitSelectors: readonly string[];
    stockSelectors: readonly string[];
    optionSelectors: readonly string[];
    sizeSelectors: readonly string[];
    colorSelectors: readonly string[];
};

function normalizeWhitespace(value: string): string {
    return value.replace(/\s+/g, ' ').trim();
}

function normalizeOptionText(value: string): string {
    return normalizeWhitespace(normalizeTitle(value))
        .replace(/^(옵션|option|size|사이즈|color|colour|색상)\s*[:\-]?\s*/i, '')
        .replace(/\s*\((?:품절|일시품절|재고없음|sold out)\)\s*$/i, '')
        .slice(0, 60);
}

function isUsefulOptionText(value: string): boolean {
    if (!value) return false;

    const normalized = value.toLowerCase();
    if (normalized.length < 2 && !['s', 'm', 'l'].includes(normalized)) return false;
    if (normalized.includes('선택')) return false;
    if (normalized.includes('choose')) return false;
    if (normalized.includes('옵션을')) return false;
    if (normalized === 'color' || normalized === 'size' || normalized === 'option') return false;

    return true;
}

function toUniqueList(values: string[], maxItems: number = 12): string[] {
    const deduped = Array.from(new Set(values.map(normalizeOptionText).filter(isUsefulOptionText)));
    return deduped.slice(0, maxItems);
}

function pickText($: cheerio.CheerioAPI, selectors: readonly string[]): string | undefined {
    const values = selectors
        .flatMap((selector) => $(selector).toArray().map((element) => normalizeWhitespace($(element).text())))
        .filter(Boolean);

    return values[0];
}

function collectTexts($: cheerio.CheerioAPI, selectors: readonly string[]): string[] {
    return selectors.flatMap((selector) =>
        $(selector).toArray().map((element) => normalizeWhitespace($(element).text()))
    ).filter(Boolean);
}

function collectAttrValues($: cheerio.CheerioAPI, selectors: readonly string[], attribute: string): string[] {
    return selectors.flatMap((selector) =>
        $(selector)
            .toArray()
            .map((element) => normalizeOptionalText($(element).attr(attribute)))
            .filter(Boolean) as string[]
    );
}

function buildSummaryLabel(prefix: string, values: string[]): string | undefined {
    if (values.length === 0) return undefined;
    const preview = values.slice(0, 3).join(', ');
    return values.length > 3 ? `${prefix} ${preview} 외 ${values.length - 3}` : `${prefix} ${preview}`;
}

function buildOptionSummary(optionValues: string[], sizeOptions: string[], colorOptions: string[]): string | undefined {
    const parts = [
        buildSummaryLabel('색상', colorOptions),
        buildSummaryLabel('사이즈', sizeOptions),
    ].filter(Boolean) as string[];

    if (parts.length > 0) {
        return parts.join(' · ');
    }

    if (optionValues.length === 0) {
        return undefined;
    }

    const preview = optionValues.slice(0, 4).join(', ');
    return optionValues.length > 4 ? `옵션 ${preview} 외 ${optionValues.length - 4}` : `옵션 ${preview}`;
}

function buildVariantCandidateLabel(input: {
    label?: string;
    color?: string;
    size?: string;
    variantSku?: string;
    variantId?: string;
}): string | undefined {
    const explicitLabel = normalizeOptionalText(input.label);
    if (explicitLabel && isUsefulOptionText(explicitLabel)) {
        return normalizeOptionText(explicitLabel).slice(0, 120);
    }

    const parts = [
        normalizeOptionalText(input.color),
        normalizeOptionalText(input.size),
    ].filter(Boolean) as string[];

    if (parts.length > 0) {
        return parts.join('/').slice(0, 120);
    }

    const variantSku = normalizeIdentifier(input.variantSku);
    if (variantSku) {
        return `SKU ${variantSku}`.slice(0, 120);
    }

    const variantId = normalizeIdentifier(input.variantId);
    if (variantId) {
        return `Variant ${variantId}`.slice(0, 120);
    }

    return undefined;
}

function toVariantStockStatus(value: unknown): UnifiedProduct['stockStatus'] | undefined {
    const normalized = normalizeOptionalText(value);
    if (!normalized) return undefined;
    return inferAvailabilityStatus(normalized);
}

function normalizeVariantCandidate(input: Partial<ProductVariantCandidate>): ProductVariantCandidate | null {
    const variantId = normalizeIdentifier(input.variantId);
    const variantSku = normalizeIdentifier(input.variantSku);
    const color = normalizeOptionalText(input.color)?.slice(0, 60);
    const size = normalizeOptionalText(input.size)?.slice(0, 40);
    const label = buildVariantCandidateLabel({
        label: input.label,
        color,
        size,
        variantSku,
        variantId,
    });

    if (!label) {
        return null;
    }

    const candidate: ProductVariantCandidate = {
        label,
        variantId,
        variantSku,
        color,
        size,
        price: normalizeMoneyValue(input.price),
        stockStatus: input.stockStatus === 'in_stock' || input.stockStatus === 'low_stock' || input.stockStatus === 'sold_out' || input.stockStatus === 'unknown'
            ? input.stockStatus
            : undefined,
    };

    return candidate;
}

function buildVariantCandidateKey(candidate: ProductVariantCandidate): string {
    return [
        candidate.variantId || '',
        candidate.variantSku || '',
        candidate.color || '',
        candidate.size || '',
        candidate.label || '',
    ].join('|').toLowerCase();
}

function mergeVariantCandidateLists(...candidateLists: Array<Array<Partial<ProductVariantCandidate>> | undefined>): ProductVariantCandidate[] | undefined {
    const merged = new Map<string, ProductVariantCandidate>();

    candidateLists.forEach((list) => {
        list?.forEach((candidate) => {
            const normalized = normalizeVariantCandidate(candidate);
            if (!normalized) {
                return;
            }

            const key = buildVariantCandidateKey(normalized);
            const existing = merged.get(key);
            if (!existing) {
                merged.set(key, normalized);
                return;
            }

            merged.set(key, {
                label: existing.label.length >= normalized.label.length ? existing.label : normalized.label,
                variantId: existing.variantId || normalized.variantId,
                variantSku: existing.variantSku || normalized.variantSku,
                color: existing.color || normalized.color,
                size: existing.size || normalized.size,
                price: typeof existing.price === 'number' ? existing.price : normalized.price,
                stockStatus: existing.stockStatus && existing.stockStatus !== 'unknown'
                    ? existing.stockStatus
                    : normalized.stockStatus,
            });
        });
    });

    const values = Array.from(merged.values()).slice(0, 24);
    return values.length > 0 ? values : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function toArray<T>(value: T | T[] | null | undefined): T[] {
    if (Array.isArray(value)) return value;
    return value === null || value === undefined ? [] : [value];
}

function normalizeOptionalText(value: unknown): string | undefined {
    if (typeof value === 'string') {
        const normalized = normalizeWhitespace(value);
        return normalized.length > 0 ? normalized : undefined;
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
    }

    return undefined;
}

function normalizeIdentifier(value: unknown, maxLength: number = 120): string | undefined {
    const text = normalizeOptionalText(value);
    if (!text) return undefined;
    return text.replace(/[^\w\-:/]/g, '').slice(0, maxLength) || undefined;
}

function normalizeMoneyValue(value: unknown): number | undefined {
    if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
        return Math.floor(value);
    }

    if (typeof value === 'string' && /\d/.test(value)) {
        const digits = value.replace(/[^0-9]/g, '');
        return digits ? Number.parseInt(digits, 10) : undefined;
    }

    if (isRecord(value)) {
        return normalizeMoneyValue(
            value.value
            ?? value.amount
            ?? value.price
            ?? value.minPrice
            ?? value.maxPrice
            ?? value.minValue
            ?? value.maxValue
        );
    }

    return undefined;
}

function composeShippingText(shippingFee?: number, shippingFreeThreshold?: number): string | undefined {
    if (typeof shippingFee !== 'number' && typeof shippingFreeThreshold !== 'number') {
        return undefined;
    }

    const parts: string[] = [];
    if (typeof shippingFee === 'number') {
        parts.push(shippingFee === 0 ? '무료배송' : `배송비 ${shippingFee.toLocaleString()}원`);
    }
    if (typeof shippingFreeThreshold === 'number') {
        parts.push(`${shippingFreeThreshold.toLocaleString()}원 이상 무료`);
    }

    return parts.join(' / ') || undefined;
}

function parseStructuredTypeNames(rawType: unknown): string[] {
    return toArray(rawType)
        .flatMap((entry) => normalizeOptionalText(entry) ? [normalizeOptionalText(entry)!] : [])
        .map((entry) => entry.replace(/^https?:\/\/schema.org\//i, ''));
}

function hasStructuredType(node: Record<string, unknown>, expected: string): boolean {
    return parseStructuredTypeNames(node['@type']).some((type) => type.toLowerCase() === expected.toLowerCase());
}

function flattenStructuredNodes(input: unknown, nodes: Record<string, unknown>[] = []): Record<string, unknown>[] {
    if (Array.isArray(input)) {
        input.forEach((entry) => flattenStructuredNodes(entry, nodes));
        return nodes;
    }

    if (!isRecord(input)) {
        return nodes;
    }

    nodes.push(input);
    ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement', 'hasVariant', 'variants', 'offers'].forEach((key) => {
        if (key in input) {
            flattenStructuredNodes(input[key], nodes);
        }
    });
    return nodes;
}

function parseJsonLdScripts($: cheerio.CheerioAPI): Record<string, unknown>[] {
    const nodes: Record<string, unknown>[] = [];

    $('script[type="application/ld+json"]').each((_, element) => {
        const raw = $(element).contents().text().trim();
        if (!raw) {
            return;
        }

        try {
            const parsed = JSON.parse(raw);
            flattenStructuredNodes(parsed, nodes);
        } catch {
            // Ignore invalid JSON-LD blocks; selector parsing remains primary.
        }
    });

    return nodes;
}

function extractStringValues(raw: unknown): string[] {
    if (typeof raw === 'string' || typeof raw === 'number') {
        const normalized = normalizeWhitespace(String(raw));
        return normalized ? [normalized] : [];
    }

    if (Array.isArray(raw)) {
        return raw.flatMap((entry) => extractStringValues(entry));
    }

    if (isRecord(raw)) {
        return extractStringValues(raw.name ?? raw.value ?? raw.label ?? raw.description ?? raw.title);
    }

    return [];
}

function extractAdditionalPropertyValues(raw: unknown, keywords: string[]): string[] {
    return toArray(raw)
        .flatMap((entry) => {
            if (!isRecord(entry)) return [];
            const name = normalizeOptionalText(entry.name ?? entry.propertyID ?? entry.label)?.toLowerCase();
            if (!name || !keywords.some((keyword) => name.includes(keyword))) {
                return [];
            }
            return extractStringValues(entry.value ?? entry.text ?? entry.description);
        });
}

function parseStructuredShippingDetails(raw: unknown): PdpDetailSignals {
    const shippingDetails = toArray(raw).filter(isRecord);
    if (shippingDetails.length === 0) {
        return {};
    }

    const shippingFee = shippingDetails
        .map((detail) => normalizeMoneyValue(detail.shippingRate ?? detail.shippingCharge ?? detail.deliveryCharge ?? detail.price))
        .find((value) => typeof value === 'number');
    const shippingFreeThreshold = shippingDetails
        .map((detail) => normalizeMoneyValue(detail.eligibleTransactionVolume ?? detail.freeShippingThreshold ?? detail.priceSpecification))
        .find((value) => typeof value === 'number');
    const shippingText = composeShippingText(shippingFee, shippingFreeThreshold);

    if (!shippingText && typeof shippingFee !== 'number' && typeof shippingFreeThreshold !== 'number') {
        return {};
    }

    return {
        shippingFee,
        shippingFreeThreshold,
        shippingText,
    };
}

function pickIdentifierFromRecords(
    records: Record<string, unknown>[],
    keys: string[],
    maxLength: number = 120
): string | undefined {
    for (const record of records) {
        for (const key of keys) {
            const value = normalizeIdentifier(record[key], maxLength);
            if (value) {
                return value;
            }
        }
    }

    return undefined;
}

function parseStructuredOffer(offer: Record<string, unknown>, basePrice: number): PdpDetailSignals {
    const priceCandidate = normalizeMoneyValue(
        offer.price
        ?? offer.lowPrice
        ?? offer.highPrice
        ?? offer.priceSpecification
        ?? offer.priceCurrency
    );
    const benefitPrice = typeof priceCandidate === 'number' && priceCandidate > 0 && priceCandidate < basePrice
        ? priceCandidate
        : undefined;
    const availabilityText = normalizeOptionalText(offer.availability);
    const stockStatus = availabilityText ? inferAvailabilityStatus(availabilityText) : undefined;

    return {
        ...parseStructuredShippingDetails(offer.shippingDetails ?? offer.shippingOfferDetails),
        variantId: normalizeIdentifier(offer.identifier ?? offer.serialNumber ?? offer.offerId ?? offer.itemOffered),
        variantSku: normalizeIdentifier(offer.sku ?? offer.mpn ?? offer.productID ?? offer.productId),
        ...(typeof benefitPrice === 'number'
            ? {
                benefitPrice,
                benefitText: `상세 구조화 데이터 ${benefitPrice.toLocaleString()}원`,
            }
            : {}),
        ...(availabilityText
            ? {
                stockStatus: stockStatus ?? 'unknown',
                stockText: availabilityText,
            }
            : {}),
    };
}

function parseStructuredDataSignals($: cheerio.CheerioAPI, product: UnifiedProduct): PdpDetailSignals {
    const nodes = parseJsonLdScripts($);
    if (nodes.length === 0) {
        return {};
    }

    const productNodes = nodes.filter((node) => hasStructuredType(node, 'Product'));
    const offerNodes = nodes.filter((node) => hasStructuredType(node, 'Offer') || hasStructuredType(node, 'AggregateOffer'));
    const colorOptions = toUniqueList([
        ...productNodes.flatMap((node) => extractStringValues(node.color)),
        ...productNodes.flatMap((node) => extractAdditionalPropertyValues(node.additionalProperty ?? node.additionalProperties, ['color', 'colour', '색상'])),
        ...productNodes.flatMap((node) => toArray(node.hasVariant).flatMap((variant) => isRecord(variant) ? extractStringValues(variant.color) : [])),
    ]);
    const sizeOptions = toUniqueList([
        ...productNodes.flatMap((node) => extractStringValues(node.size)),
        ...productNodes.flatMap((node) => extractAdditionalPropertyValues(node.additionalProperty ?? node.additionalProperties, ['size', '사이즈'])),
        ...productNodes.flatMap((node) => toArray(node.hasVariant).flatMap((variant) => isRecord(variant) ? extractStringValues(variant.size) : [])),
    ]);
    const optionValues = toUniqueList([
        ...productNodes.flatMap((node) => toArray(node.hasVariant).flatMap((variant) => isRecord(variant) ? extractStringValues(variant.name ?? variant.sku) : [])),
        ...productNodes.flatMap((node) => extractAdditionalPropertyValues(node.additionalProperty ?? node.additionalProperties, ['option', '옵션'])),
    ]);
    const offerSignals = [...productNodes.flatMap((node) => toArray(node.offers)), ...offerNodes]
        .flatMap((offer) => isRecord(offer) ? [parseStructuredOffer(offer, product.price)] : []);
    const variantNodes = productNodes.flatMap((node) =>
        toArray(node.hasVariant ?? node.variant ?? node.variants).flatMap((variant) => isRecord(variant) ? [variant] : [])
    );
    const variantCandidates = mergeVariantCandidateLists(
        variantNodes.flatMap((variant) => {
            const color = extractStringValues(variant.color)[0]
                || extractAdditionalPropertyValues(variant.additionalProperty ?? variant.additionalProperties, ['color', 'colour', '색상'])[0];
            const size = extractStringValues(variant.size)[0]
                || extractAdditionalPropertyValues(variant.additionalProperty ?? variant.additionalProperties, ['size', '사이즈'])[0];
            const offer = toArray(variant.offers).find(isRecord);
            const availabilityText = normalizeOptionalText(variant.availability ?? (isRecord(offer) ? offer.availability : undefined));
            const normalized = normalizeVariantCandidate({
                label: normalizeOptionalText(variant.name) || normalizeOptionalText(variant.description),
                variantId: normalizeOptionalText(variant.variantId ?? variant.optionId ?? variant.productOptionId ?? variant.identifier ?? variant.productID ?? variant.productId),
                variantSku: normalizeOptionalText(variant.sku ?? variant.mpn ?? variant.gtin13 ?? variant.gtin ?? variant.gtin12),
                color,
                size,
                price: normalizeMoneyValue(variant.price ?? (isRecord(offer) ? offer.price ?? offer.lowPrice ?? offer.highPrice : undefined)),
                stockStatus: availabilityText ? inferAvailabilityStatus(availabilityText) : undefined,
            });

            return normalized ? [normalized] : [];
        })
    );
    const shippingSignals = productNodes
        .flatMap((node) => [parseStructuredShippingDetails(node.shippingDetails)]);
    const stockSignals = productNodes
        .flatMap((node) => {
            const availabilityText = normalizeOptionalText(node.availability);
            if (!availabilityText) return [];
            return [parseStockSignal(availabilityText)];
        });

    const commerceSignals = mergeCommerceData(...offerSignals, ...shippingSignals, ...stockSignals);
    const variantId = pickIdentifierFromRecords(
        [...variantNodes, ...productNodes, ...offerNodes],
        ['variantId', 'optionId', 'productOptionId', 'identifier', 'productID', 'productId', 'serialNumber']
    );
    const variantSku = pickIdentifierFromRecords(
        [...variantNodes, ...productNodes, ...offerNodes],
        ['sku', 'mpn', 'gtin13', 'gtin', 'gtin12']
    );

    return {
        ...commerceSignals,
        variantId,
        variantSku,
        optionValues: optionValues.length > 0 ? optionValues : undefined,
        sizeOptions: sizeOptions.length > 0 ? sizeOptions : undefined,
        colorOptions: colorOptions.length > 0 ? colorOptions : undefined,
        variantCandidates,
        optionSummary: buildOptionSummary(optionValues, sizeOptions, colorOptions),
    };
}

function pickMetaContent($: cheerio.CheerioAPI, selectors: readonly string[], attr: 'content' | 'href' | 'text' = 'content'): string | undefined {
    for (const selector of selectors) {
        const element = $(selector).first();
        if (!element.length) continue;

        const raw = attr === 'text' ? element.text() : element.attr(attr) || element.attr('content') || element.attr('href') || element.text();
        const value = normalizeOptionalText(raw);
        if (value) {
            return value;
        }
    }

    return undefined;
}

function parseMetaSignals($: cheerio.CheerioAPI, product: UnifiedProduct): PdpDetailSignals {
    const priceText = pickMetaContent($, [
        'meta[itemprop="price"]',
        'meta[property="product:price:amount"]',
        'meta[property="og:price:amount"]',
    ]);
    const availabilityText = pickMetaContent($, [
        'meta[itemprop="availability"]',
        'meta[property="product:availability"]',
        'link[itemprop="availability"]',
    ]);
    const shippingText = pickMetaContent($, [
        'meta[name="delivery"]',
        'meta[property="product:delivery"]',
    ]);
    const colorText = pickMetaContent($, [
        'meta[itemprop="color"]',
        'meta[property="product:color"]',
    ]);
    const sizeText = pickMetaContent($, [
        'meta[itemprop="size"]',
        'meta[property="product:size"]',
    ]);
    const variantSku = pickMetaContent($, [
        'meta[itemprop="sku"]',
        'meta[property="product:sku"]',
    ]);
    const variantId = pickMetaContent($, [
        'meta[itemprop="productID"]',
        'meta[property="product:retailer_item_id"]',
        'meta[property="product:item_id"]',
    ]);

    return {
        ...mergeCommerceData(
            shippingText ? parseShippingText(shippingText) : undefined,
            priceText ? parseBenefitText(`혜택가 ${priceText}`, product.price) : undefined,
            availabilityText ? parseStockSignal(availabilityText) : undefined,
        ),
        variantId: normalizeIdentifier(variantId),
        variantSku: normalizeIdentifier(variantSku),
        colorOptions: colorText ? toUniqueList([colorText]) : undefined,
        sizeOptions: sizeText ? toUniqueList([sizeText]) : undefined,
        optionSummary: buildOptionSummary([], sizeText ? [sizeText] : [], colorText ? [colorText] : []),
    };
}

function pickFirstAttr($: cheerio.CheerioAPI, selectors: readonly string[], attributes: readonly string[]): string | undefined {
    for (const selector of selectors) {
        const element = $(selector).first();
        if (!element.length) continue;

        for (const attribute of attributes) {
            const value = normalizeIdentifier(element.attr(attribute));
            if (value) {
                return value;
            }
        }
    }

    return undefined;
}

function parseDomVariantIdentity($: cheerio.CheerioAPI): PdpDetailSignals {
    const variantIdSelectors = [
        '[data-variant-id]',
        '[data-option-id]',
        '[data-product-option-id]',
        '[data-item-id]',
        '[data-product-id]',
        'input[name="variantId"]',
        'input[name="optionId"]',
    ] as const;
    const variantSkuSelectors = [
        '[data-sku]',
        '[data-sku-id]',
        'input[name="sku"]',
    ] as const;

    const variantId = pickFirstAttr($, variantIdSelectors, [
        'data-variant-id',
        'data-option-id',
        'data-product-option-id',
        'data-item-id',
        'data-product-id',
        'value',
    ]);
    const variantSku = pickFirstAttr($, variantSkuSelectors, [
        'data-sku',
        'data-sku-id',
        'value',
    ]);

    return {
        variantId,
        variantSku,
    };
}

function parseCandidateAvailabilityFromElement($: cheerio.CheerioAPI, element: unknown): UnifiedProduct['stockStatus'] | undefined {
    const wrapped = $(element as never);
    const text = normalizeWhitespace(wrapped.text());
    if (text) {
        const parsed = parseStockSignal(text);
        if (parsed.stockStatus && parsed.stockStatus !== 'unknown') {
            return parsed.stockStatus;
        }
    }

    const className = normalizeOptionalText(wrapped.attr('class'));
    if (className) {
        const parsed = parseStockSignal(className);
        if (parsed.stockStatus && parsed.stockStatus !== 'unknown') {
            return parsed.stockStatus;
        }
    }

    const ariaDisabled = normalizeOptionalText(wrapped.attr('aria-disabled'));
    if (ariaDisabled === 'true') {
        return 'sold_out';
    }

    const disabledAttr = wrapped.attr('disabled');
    if (typeof disabledAttr === 'string') {
        return 'sold_out';
    }

    return undefined;
}

function parseVariantCandidatesFromSelectors(
    $: cheerio.CheerioAPI,
    selectors: readonly string[],
    kind: 'option' | 'size' | 'color'
): ProductVariantCandidate[] | undefined {
    const matchedElements = selectors.flatMap((selector) => $(selector).toArray());
    if (matchedElements.length === 0) {
        return undefined;
    }

    return mergeVariantCandidateLists(matchedElements.map((element) => {
        const text = normalizeOptionText(
            normalizeOptionalText($(element).attr('data-option-value'))
            || normalizeOptionalText($(element).attr('data-value'))
            || normalizeOptionalText($(element).attr('data-label'))
            || normalizeWhitespace($(element).text())
            || ''
        );
        const dataColor = normalizeOptionalText($(element).attr('data-color'));
        const dataSize = normalizeOptionalText($(element).attr('data-size'));
        const variantId = $(element).attr('data-variant-id')
            || $(element).attr('data-option-id')
            || $(element).attr('data-product-option-id')
            || $(element).attr('data-item-id');
        const variantSku = $(element).attr('data-sku')
            || $(element).attr('data-sku-id');
        const price = normalizeMoneyValue(
            $(element).attr('data-price')
            || $(element).attr('data-sale-price')
            || $(element).attr('data-benefit-price')
        );
        const stockStatus = parseCandidateAvailabilityFromElement($, element);

        if (kind !== 'option' && !variantId && !variantSku && typeof price !== 'number' && !stockStatus) {
            return null;
        }

        return {
            label: text,
            variantId,
            variantSku,
            color: kind === 'color' ? text : dataColor,
            size: kind === 'size' ? text : dataSize,
            price,
            stockStatus,
        } satisfies Partial<ProductVariantCandidate>;
    }).filter(Boolean) as Partial<ProductVariantCandidate>[]);
}

function parseGenericOptionSignals($: cheerio.CheerioAPI): PdpDetailSignals {
    const sizeOptions = toUniqueList(collectTexts($, [
        'select[name*="size"] option',
        'select[name*="SIZE"] option',
        '[aria-label*="size"]',
        '[aria-label*="SIZE"]',
        '[data-option-type="size"] [data-option-value]',
    ]).concat(collectAttrValues($, ['[data-size]'], 'data-size')));
    const colorOptions = toUniqueList(collectTexts($, [
        'select[name*="color"] option',
        'select[name*="COLOR"] option',
        'select[name*="colour"] option',
        'select[name*="COLOUR"] option',
        '[aria-label*="color"]',
        '[aria-label*="COLOR"]',
        '[aria-label*="colour"]',
        '[aria-label*="COLOUR"]',
        '[data-option-type="color"] [data-option-value]',
    ]).concat(collectAttrValues($, ['[data-color]'], 'data-color')));
    const optionValues = toUniqueList(collectTexts($, [
        'select[name*="option"] option',
        'select[name*="OPTION"] option',
        '[data-option-value]',
        '[class*="option"] option',
    ]));

    return {
        optionValues: optionValues.length > 0 ? optionValues : undefined,
        sizeOptions: sizeOptions.length > 0 ? sizeOptions : undefined,
        colorOptions: colorOptions.length > 0 ? colorOptions : undefined,
        optionSummary: buildOptionSummary(optionValues, sizeOptions, colorOptions),
    };
}

function parseWithConfig(html: string, product: UnifiedProduct, config: ProductDetailParserConfig): PdpDetailSignals {
    const $ = cheerio.load(html);

    const shippingText = pickText($, config.shippingSelectors);
    const benefitText = pickText($, config.benefitSelectors);
    const stockText = pickText($, config.stockSelectors);
    const optionValues = toUniqueList(collectTexts($, config.optionSelectors));
    const sizeOptions = toUniqueList(collectTexts($, config.sizeSelectors));
    const colorOptions = toUniqueList(collectTexts($, config.colorSelectors));
    const commerceData = buildCommerceDataFromTexts({
        basePrice: product.price,
        shippingText,
        benefitText,
        stockText,
    });
    const selectorSignals: PdpDetailSignals = {
        ...commerceData,
        optionValues: optionValues.length > 0 ? optionValues : undefined,
        sizeOptions: sizeOptions.length > 0 ? sizeOptions : undefined,
        colorOptions: colorOptions.length > 0 ? colorOptions : undefined,
        optionSummary: buildOptionSummary(optionValues, sizeOptions, colorOptions),
    };
    const structuredSignals = parseStructuredDataSignals($, product);
    const metaSignals = parseMetaSignals($, product);
    const domVariantSignals = parseDomVariantIdentity($);
    const genericSignals = parseGenericOptionSignals($);
    const domVariantCandidates = mergeVariantCandidateLists(
        parseVariantCandidatesFromSelectors($, config.optionSelectors, 'option'),
        parseVariantCandidatesFromSelectors($, config.sizeSelectors, 'size'),
        parseVariantCandidatesFromSelectors($, config.colorSelectors, 'color'),
        parseVariantCandidatesFromSelectors($, [
            'select[name*="option"] option',
            'select[name*="size"] option',
            'select[name*="color"] option',
            '[data-option-value]',
            '[data-variant-id]',
            '[data-sku]',
        ], 'option')
    );
    const mergedVariantCandidates = mergeVariantCandidateLists(
        structuredSignals.variantCandidates,
        domVariantCandidates
    );
    const mergedOptionValues = toUniqueList([
        ...(selectorSignals.optionValues || []),
        ...(structuredSignals.optionValues || []),
        ...(metaSignals.optionValues || []),
        ...(genericSignals.optionValues || []),
        ...((mergedVariantCandidates || []).map((candidate) => candidate.label)),
    ]);
    const mergedSizeOptions = toUniqueList([
        ...(selectorSignals.sizeOptions || []),
        ...(structuredSignals.sizeOptions || []),
        ...(metaSignals.sizeOptions || []),
        ...(genericSignals.sizeOptions || []),
        ...((mergedVariantCandidates || []).flatMap((candidate) => candidate.size ? [candidate.size] : [])),
    ]);
    const mergedColorOptions = toUniqueList([
        ...(selectorSignals.colorOptions || []),
        ...(structuredSignals.colorOptions || []),
        ...(metaSignals.colorOptions || []),
        ...(genericSignals.colorOptions || []),
        ...((mergedVariantCandidates || []).flatMap((candidate) => candidate.color ? [candidate.color] : [])),
    ]);
    const singleCandidate = mergedVariantCandidates?.length === 1 ? mergedVariantCandidates[0] : undefined;

    return {
        ...mergeCommerceData(selectorSignals, structuredSignals, metaSignals, genericSignals),
        variantId: domVariantSignals.variantId || structuredSignals.variantId || metaSignals.variantId || singleCandidate?.variantId,
        variantSku: domVariantSignals.variantSku || structuredSignals.variantSku || metaSignals.variantSku || singleCandidate?.variantSku,
        optionValues: mergedOptionValues.length > 0 ? mergedOptionValues : undefined,
        sizeOptions: mergedSizeOptions.length > 0 ? mergedSizeOptions : undefined,
        colorOptions: mergedColorOptions.length > 0 ? mergedColorOptions : undefined,
        variantCandidates: mergedVariantCandidates,
        optionSummary: buildOptionSummary(mergedOptionValues, mergedSizeOptions, mergedColorOptions)
            || selectorSignals.optionSummary
            || structuredSignals.optionSummary
            || metaSignals.optionSummary
            || genericSignals.optionSummary,
    };
}

const PDP_DETAIL_CONFIGS: Partial<Record<ProductSource, ProductDetailParserConfig>> = {
    MUSINSA: {
        source: 'MUSINSA',
        allowedHosts: ['www.musinsa.com', 'musinsa.com', 'store.musinsa.com'],
        shippingSelectors: ['.delivery-info', '.product-delivery-info', '.txt_delivery', '[class*="delivery"]'],
        benefitSelectors: ['.member-price', '.txt_member_price', '[class*="member-price"]', '[class*="coupon"]'],
        stockSelectors: ['.option_soldout', '.product-status', '.txt_state', '[class*="stock"]', '[class*="soldout"]'],
        optionSelectors: ['.option-list button', '.option-list li', '.option_box button', '.option_box li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    '29CM': {
        source: '29CM',
        allowedHosts: ['product.29cm.co.kr', 'www.29cm.co.kr', '29cm.co.kr'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]'],
        benefitSelectors: ['.member-benefit', '.benefit-price', '[class*="coupon"]', '[class*="benefit"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-select button', '.option-select li', '[class*="option-list"] button', '[class*="option-list"] li'],
        sizeSelectors: ['[data-option-type="size"] button', '[data-option-type="size"] li', '.size-options button', '.size-options li'],
        colorSelectors: ['[data-option-type="color"] button', '[data-option-type="color"] li', '.color-options button', '.color-options li'],
    },
    W_CONCEPT: {
        source: 'W_CONCEPT',
        allowedHosts: ['www.wconcept.co.kr', 'wconcept.co.kr'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]'],
        benefitSelectors: ['.member-price', '.benefit-price', '[class*="member-price"]', '[class*="benefit"]'],
        stockSelectors: ['.sold-out', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '.prd-option button', '.prd-option li'],
        sizeSelectors: ['[data-option-type="size"] button', '[data-option-type="size"] li', '.size-list button', '.size-list li'],
        colorSelectors: ['[data-option-type="color"] button', '[data-option-type="color"] li', '.color-list button', '.color-list li'],
    },
    ZIGZAG: {
        source: 'ZIGZAG',
        allowedHosts: ['zigzag.kr', 'www.zigzag.kr'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.member-price', '.benefit-price', '[class*="coupon"]', '[class*="discount"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="stock"]', '[class*="soldout"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    ABLY: {
        source: 'ABLY',
        allowedHosts: ['a-bly.com', 'www.a-bly.com', 'm.a-bly.com'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.member-price', '.benefit-price', '[class*="coupon"]', '[class*="benefit"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    SSF: {
        source: 'SSF',
        allowedHosts: ['www.ssfshop.com', 'ssfshop.com'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]'],
        benefitSelectors: ['.member-price', '.benefit-price', '[class*="member"]', '[class*="benefit"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-wrap button', '.option-wrap li', '[class*="option-list"] button', '[class*="option-list"] li'],
        sizeSelectors: ['[data-option-type="size"] button', '[data-option-type="size"] li', '.size-list button', '.size-list li'],
        colorSelectors: ['[data-option-type="color"] button', '[data-option-type="color"] li', '.color-list button', '.color-list li'],
    },
    COUPANG: {
        source: 'COUPANG',
        allowedHosts: ['www.coupang.com', 'coupang.com'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.member-price', '.benefit-price', '[class*="wow"]', '[class*="discount"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    HANDSOME: {
        source: 'HANDSOME',
        allowedHosts: ['www.thehandsome.com', 'thehandsome.com'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.member-price', '.benefit-price', '[class*="coupon"]', '[class*="benefit"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    FARFETCH: {
        source: 'FARFETCH',
        allowedHosts: ['www.farfetch.com', 'farfetch.com'],
        shippingSelectors: ['[data-testid*="delivery"]', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['[data-testid*="price"]', '[class*="member"]', '[class*="discount"]', '[class*="benefit"]'],
        stockSelectors: ['[data-testid*="soldout"]', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['button[data-testid*="option"]', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['button[data-testid*="size"]', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['button[data-testid*="color"]', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    SSENSE: {
        source: 'SSENSE',
        allowedHosts: ['www.ssense.com', 'ssense.com'],
        shippingSelectors: ['[data-testid*="shipping"]', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['[data-testid*="price"]', '[class*="member"]', '[class*="benefit"]', '[class*="discount"]'],
        stockSelectors: ['[data-testid*="soldout"]', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['button[data-testid*="option"]', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['button[data-testid*="size"]', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['button[data-testid*="color"]', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    HAGO: {
        source: 'HAGO',
        allowedHosts: ['www.hago.kr', 'hago.kr'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.benefit-price', '.member-price', '[class*="benefit"]', '[class*="coupon"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    EQL: {
        source: 'EQL',
        allowedHosts: ['www.eqlstore.com', 'eqlstore.com'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.benefit-price', '.member-price', '[class*="benefit"]', '[class*="discount"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    LFMALL: {
        source: 'LFMALL',
        allowedHosts: ['www.lfmall.co.kr', 'lfmall.co.kr'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.benefit-price', '.member-price', '[class*="benefit"]', '[class*="discount"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
    SIVILLAGE: {
        source: 'SIVILLAGE',
        allowedHosts: ['www.sivillage.com', 'sivillage.com'],
        shippingSelectors: ['.delivery-info', '.shipping-info', '[class*="delivery"]', '[class*="shipping"]'],
        benefitSelectors: ['.benefit-price', '.member-price', '[class*="benefit"]', '[class*="discount"]'],
        stockSelectors: ['.soldout', '.stock-status', '[class*="soldout"]', '[class*="stock"]'],
        optionSelectors: ['.option-list button', '.option-list li', '[class*="option"] button', '[class*="option"] li'],
        sizeSelectors: ['.size-list button', '.size-list li', '[data-option-type="size"] button', '[data-option-type="size"] li'],
        colorSelectors: ['.color-list button', '.color-list li', '[data-option-type="color"] button', '[data-option-type="color"] li'],
    },
};

function isAllowedHost(hostname: string, allowedHosts: readonly string[]): boolean {
    const normalizedHost = hostname.toLowerCase();
    return allowedHosts.some((allowedHost) => {
        const normalizedAllowed = allowedHost.toLowerCase();
        return normalizedHost === normalizedAllowed || normalizedHost.endsWith(`.${normalizedAllowed}`);
    });
}

function getPdpConfig(source: ProductSource): ProductDetailParserConfig | null {
    return PDP_DETAIL_CONFIGS[source] || null;
}

export function isPdpDetailEnrichmentSupported(product: Pick<UnifiedProduct, 'source' | 'link'>): boolean {
    const config = getPdpConfig(product.source);
    if (!config) return false;

    try {
        const parsed = new URL(product.link);
        return isAllowedHost(parsed.hostname, config.allowedHosts);
    } catch {
        return false;
    }
}

export function parseMusinsaProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.MUSINSA!);
}

export function parseTwentyNineCmProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS['29CM']!);
}

export function parseWConceptProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.W_CONCEPT!);
}

export function parseZigzagProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.ZIGZAG!);
}

export function parseAblyProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.ABLY!);
}

export function parseSsfProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.SSF!);
}

export function parseCoupangProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.COUPANG!);
}

export function parseHandsomeProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.HANDSOME!);
}

export function parseFarfetchProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.FARFETCH!);
}

export function parseSsenseProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.SSENSE!);
}

export function parseHagoProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.HAGO!);
}

export function parseEqlProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.EQL!);
}

export function parseLfMallProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.LFMALL!);
}

export function parseSiVillageProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    return parseWithConfig(html, product, PDP_DETAIL_CONFIGS.SIVILLAGE!);
}

export function parseProductDetailHtml(html: string, product: UnifiedProduct): PdpDetailSignals {
    const config = getPdpConfig(product.source);
    if (!config) {
        return {};
    }

    return parseWithConfig(html, product, config);
}
