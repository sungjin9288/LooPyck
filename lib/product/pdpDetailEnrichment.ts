import * as cheerio from 'cheerio';
import type { ProductSource, UnifiedProduct } from '../api/types.ts';
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
    | 'optionSummary'
    | 'optionValues'
    | 'sizeOptions'
    | 'colorOptions'
    | 'detailCollectedAt'
>;

export function hasPdpDetailData(product: Pick<UnifiedProduct, 'detailCollectedAt' | 'optionSummary' | 'optionValues' | 'sizeOptions' | 'colorOptions'>): boolean {
    return Boolean(
        product.detailCollectedAt
        || product.optionSummary
        || product.optionValues?.length
        || product.sizeOptions?.length
        || product.colorOptions?.length
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
    const shippingSignals = productNodes
        .flatMap((node) => [parseStructuredShippingDetails(node.shippingDetails)]);
    const stockSignals = productNodes
        .flatMap((node) => {
            const availabilityText = normalizeOptionalText(node.availability);
            if (!availabilityText) return [];
            return [parseStockSignal(availabilityText)];
        });

    const commerceSignals = mergeCommerceData(...offerSignals, ...shippingSignals, ...stockSignals);

    return {
        ...commerceSignals,
        optionValues: optionValues.length > 0 ? optionValues : undefined,
        sizeOptions: sizeOptions.length > 0 ? sizeOptions : undefined,
        colorOptions: colorOptions.length > 0 ? colorOptions : undefined,
        optionSummary: buildOptionSummary(optionValues, sizeOptions, colorOptions),
    };
}

function pickMetaContent($: cheerio.CheerioAPI, selectors: readonly string[]): string | undefined {
    for (const selector of selectors) {
        const element = $(selector).first();
        if (!element.length) continue;

        const value = normalizeOptionalText(element.attr('content') || element.attr('href') || element.text());
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

    return {
        ...mergeCommerceData(
            shippingText ? parseShippingText(shippingText) : undefined,
            priceText ? parseBenefitText(`혜택가 ${priceText}`, product.price) : undefined,
            availabilityText ? parseStockSignal(availabilityText) : undefined,
        ),
        colorOptions: colorText ? toUniqueList([colorText]) : undefined,
        sizeOptions: sizeText ? toUniqueList([sizeText]) : undefined,
        optionSummary: buildOptionSummary([], sizeText ? [sizeText] : [], colorText ? [colorText] : []),
    };
}

function parseGenericOptionSignals($: cheerio.CheerioAPI): PdpDetailSignals {
    const sizeOptions = toUniqueList(collectTexts($, [
        'select[name*="size"] option',
        'select[name*="SIZE"] option',
        '[aria-label*="size"]',
        '[aria-label*="SIZE"]',
        '[data-option-type="size"] [data-option-value]',
        '[data-size]',
    ]));
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
        '[data-color]',
    ]));
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
    const genericSignals = parseGenericOptionSignals($);
    const mergedOptionValues = toUniqueList([
        ...(selectorSignals.optionValues || []),
        ...(structuredSignals.optionValues || []),
        ...(metaSignals.optionValues || []),
        ...(genericSignals.optionValues || []),
    ]);
    const mergedSizeOptions = toUniqueList([
        ...(selectorSignals.sizeOptions || []),
        ...(structuredSignals.sizeOptions || []),
        ...(metaSignals.sizeOptions || []),
        ...(genericSignals.sizeOptions || []),
    ]);
    const mergedColorOptions = toUniqueList([
        ...(selectorSignals.colorOptions || []),
        ...(structuredSignals.colorOptions || []),
        ...(metaSignals.colorOptions || []),
        ...(genericSignals.colorOptions || []),
    ]);

    return {
        ...mergeCommerceData(selectorSignals, structuredSignals, metaSignals, genericSignals),
        optionValues: mergedOptionValues.length > 0 ? mergedOptionValues : undefined,
        sizeOptions: mergedSizeOptions.length > 0 ? mergedSizeOptions : undefined,
        colorOptions: mergedColorOptions.length > 0 ? mergedColorOptions : undefined,
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
