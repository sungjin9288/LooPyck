import test from 'node:test';
import assert from 'node:assert/strict';
import {
    parseAblyProductDetailHtml,
    parseCoupangProductDetailHtml,
    parseEqlProductDetailHtml,
    parseFarfetchProductDetailHtml,
    parseHagoProductDetailHtml,
    parseHandsomeProductDetailHtml,
    isPdpDetailEnrichmentSupported,
    parseLfMallProductDetailHtml,
    parseMusinsaProductDetailHtml,
    parseProductDetailHtml,
    parseSiVillageProductDetailHtml,
    parseSsenseProductDetailHtml,
    parseSsfProductDetailHtml,
    parseTwentyNineCmProductDetailHtml,
    parseWConceptProductDetailHtml,
    parseZigzagProductDetailHtml,
} from '../lib/product/pdpDetailEnrichment.ts';
import type { UnifiedProduct } from '../lib/api/types.ts';

function product(overrides: Partial<UnifiedProduct>): UnifiedProduct {
    return {
        id: overrides.id || 'test-item',
        title: overrides.title || '기본 상품',
        price: overrides.price || 129000,
        image: overrides.image || 'https://example.com/item.jpg',
        link: overrides.link || `https://example.com/${overrides.id || 'test-item'}`,
        mallName: overrides.mallName || '테스트몰',
        brand: overrides.brand,
        category1: overrides.category1,
        category2: overrides.category2,
        source: overrides.source || 'MUSINSA',
        normalizedTitle: overrides.normalizedTitle,
        shippingFee: overrides.shippingFee,
        shippingFreeThreshold: overrides.shippingFreeThreshold,
        shippingText: overrides.shippingText,
        benefitPrice: overrides.benefitPrice,
        benefitText: overrides.benefitText,
        stockStatus: overrides.stockStatus,
        stockText: overrides.stockText,
        variantId: overrides.variantId,
        variantSku: overrides.variantSku,
        optionSummary: overrides.optionSummary,
        optionValues: overrides.optionValues,
        sizeOptions: overrides.sizeOptions,
        colorOptions: overrides.colorOptions,
        detailCollectedAt: overrides.detailCollectedAt,
    };
}

test('musinsa PDP parser extracts option, shipping and benefit detail signals', () => {
    const html = `
        <div class="delivery-info">배송비 3,000원 / 50,000원 이상 무료</div>
        <div class="member-price">회원가 119,000원</div>
        <div class="product-status">재고소량</div>
        <div class="color-list">
            <button>오프화이트</button>
            <button>블랙</button>
        </div>
        <div class="size-list">
            <button>240</button>
            <button>245</button>
        </div>
    `;

    const parsed = parseMusinsaProductDetailHtml(html, product({
        source: 'MUSINSA',
        link: 'https://www.musinsa.com/products/123',
    }));

    assert.equal(parsed.shippingFee, 3000);
    assert.equal(parsed.shippingFreeThreshold, 50000);
    assert.equal(parsed.benefitPrice, 119000);
    assert.equal(parsed.stockStatus, 'low_stock');
    assert.deepEqual(parsed.colorOptions, ['오프화이트', '블랙']);
    assert.deepEqual(parsed.sizeOptions, ['240', '245']);
    assert.equal(parsed.optionSummary, '색상 오프화이트, 블랙 · 사이즈 240, 245');
});

test('29CM PDP parser extracts sold-out status and option summary', () => {
    const html = `
        <div class="delivery-info">무료배송</div>
        <div class="member-benefit">회원가 171,000원</div>
        <div class="soldout">품절</div>
        <div class="color-options">
            <button>네이비</button>
        </div>
        <div class="size-options">
            <button>95</button>
            <button>100</button>
        </div>
    `;

    const parsed = parseTwentyNineCmProductDetailHtml(html, product({
        source: '29CM',
        price: 189000,
        link: 'https://product.29cm.co.kr/catalog/12345',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 171000);
    assert.equal(parsed.stockStatus, 'sold_out');
    assert.equal(parsed.optionSummary, '색상 네이비 · 사이즈 95, 100');
});

test('W컨셉 PDP parser keeps generic option list when size/color selectors are absent', () => {
    const html = `
        <div class="shipping-info">배송비 2,500원 / 50,000원 이상 무료</div>
        <div class="benefit-price">회원가 109,000원</div>
        <div class="stock-status">판매중</div>
        <ul class="option-list">
            <li>베이지/FREE</li>
            <li>블랙/FREE</li>
        </ul>
    `;

    const parsed = parseWConceptProductDetailHtml(html, product({
        source: 'W_CONCEPT',
        price: 129000,
        link: 'https://www.wconcept.co.kr/Product/301000001',
    }));

    assert.equal(parsed.shippingFee, 2500);
    assert.equal(parsed.benefitPrice, 109000);
    assert.equal(parsed.stockStatus, 'in_stock');
    assert.deepEqual(parsed.optionValues, ['베이지/FREE', '블랙/FREE']);
    assert.equal(parsed.optionSummary, '옵션 베이지/FREE, 블랙/FREE');
});

test('W컨셉 PDP parser rejects image dimensions collected through generic data-size attributes', () => {
    const html = `
        <img src="look-1.jpg" data-size="960px/5749px" />
        <img src="look-2.jpg" data-size="960px/4174px" />
        <div class="size-list"><button>M</button><button>L</button></div>
    `;

    const parsed = parseWConceptProductDetailHtml(html, product({
        source: 'W_CONCEPT',
        price: 129000,
        link: 'https://www.wconcept.co.kr/Product/301000002',
    }));

    assert.deepEqual(parsed.sizeOptions, ['M', 'L']);
    assert.doesNotMatch(parsed.optionSummary || '', /px/i);
});

test('zigzag PDP parser extracts shipping, benefit and option detail signals', () => {
    const html = `
        <div class="delivery-info">배송비 3,000원 / 30,000원 이상 무료</div>
        <div class="benefit-price">혜택가 25,900원</div>
        <div class="stock-status">판매중</div>
        <div class="color-list">
            <button>핑크</button>
            <button>블랙</button>
        </div>
        <div class="size-list">
            <button>FREE</button>
        </div>
    `;

    const parsed = parseZigzagProductDetailHtml(html, product({
        source: 'ZIGZAG',
        price: 29900,
        link: 'https://zigzag.kr/catalog/products/130000001',
    }));

    assert.equal(parsed.shippingFee, 3000);
    assert.equal(parsed.shippingFreeThreshold, 30000);
    assert.equal(parsed.benefitPrice, 25900);
    assert.equal(parsed.optionSummary, '색상 핑크, 블랙 · 사이즈 FREE');
});

test('ably PDP parser extracts free shipping and generic option list', () => {
    const html = `
        <div class="shipping-info">무료배송</div>
        <div class="member-price">회원가 24,900원</div>
        <div class="stock-status">판매중</div>
        <ul class="option-list">
            <li>아이보리/FREE</li>
            <li>블랙/FREE</li>
        </ul>
    `;

    const parsed = parseAblyProductDetailHtml(html, product({
        source: 'ABLY',
        price: 27900,
        link: 'https://a-bly.com/goods/100001',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 24900);
    assert.deepEqual(parsed.optionValues, ['아이보리/FREE', '블랙/FREE']);
});

test('SSF PDP parser extracts option lists and free shipping', () => {
    const html = `
        <div class="delivery-info">무료배송</div>
        <div class="member-price">회원가 159,000원</div>
        <div class="stock-status">판매중</div>
        <div class="color-list">
            <button>그레이</button>
        </div>
        <div class="size-list">
            <button>M</button>
            <button>L</button>
        </div>
    `;

    const parsed = parseSsfProductDetailHtml(html, product({
        source: 'SSF',
        price: 179000,
        link: 'https://www.ssfshop.com/goods/00001',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 159000);
    assert.equal(parsed.stockStatus, 'in_stock');
    assert.equal(parsed.optionSummary, '색상 그레이 · 사이즈 M, L');
});

test('coupang PDP parser extracts wow benefit and sold-out status', () => {
    const html = `
        <div class="shipping-info">무료배송</div>
        <div class="wow-price">와우회원가 27,900원</div>
        <div class="soldout">품절</div>
        <div class="color-list">
            <button>네이비</button>
        </div>
        <div class="size-list">
            <button>L</button>
        </div>
    `;

    const parsed = parseCoupangProductDetailHtml(html, product({
        source: 'COUPANG',
        price: 29900,
        link: 'https://www.coupang.com/vp/products/700001?itemId=1&vendorItemId=2',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 27900);
    assert.equal(parsed.stockStatus, 'sold_out');
    assert.equal(parsed.optionSummary, '색상 네이비 · 사이즈 L');
});

test('handsome PDP parser extracts delivery and option detail signals', () => {
    const html = `
        <div class="delivery-info">배송비 2,500원 / 100,000원 이상 무료</div>
        <div class="benefit-price">혜택가 548,000원</div>
        <div class="stock-status">판매중</div>
        <div class="color-list">
            <button>카멜</button>
        </div>
        <div class="size-list">
            <button>90</button>
            <button>95</button>
        </div>
    `;

    const parsed = parseHandsomeProductDetailHtml(html, product({
        source: 'HANDSOME',
        price: 598000,
        link: 'https://www.thehandsome.com/ko/PM/productDetail/STBS1234567',
    }));

    assert.equal(parsed.shippingFee, 2500);
    assert.equal(parsed.shippingFreeThreshold, 100000);
    assert.equal(parsed.benefitPrice, 548000);
    assert.equal(parsed.optionSummary, '색상 카멜 · 사이즈 90, 95');
});

test('farfetch PDP parser extracts delivery and size/color detail signals', () => {
    const html = `
        <div data-testid="delivery-message">무료배송</div>
        <div data-testid="discount-price">혜택가 1,190,000원</div>
        <button data-testid="color-option">블랙</button>
        <button data-testid="size-option">41</button>
        <button data-testid="size-option">42</button>
    `;

    const parsed = parseFarfetchProductDetailHtml(html, product({
        source: 'FARFETCH',
        price: 1290000,
        link: 'https://www.farfetch.com/kr/shopping/men/item-12345678.aspx',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 1190000);
    assert.equal(parsed.optionSummary, '색상 블랙 · 사이즈 41, 42');
});

test('SSENSE PDP parser extracts stock and option detail signals', () => {
    const html = `
        <div data-testid="shipping-message">배송비 30,000원</div>
        <div data-testid="product-price">할인가 390,000원</div>
        <div class="soldout">품절</div>
        <button data-testid="color-option">Grey</button>
        <button data-testid="size-option">M</button>
    `;

    const parsed = parseSsenseProductDetailHtml(html, product({
        source: 'SSENSE',
        price: 450000,
        link: 'https://www.ssense.com/ko-kr/men/product/acne-studios/hoodie/12345671',
    }));

    assert.equal(parsed.shippingFee, 30000);
    assert.equal(parsed.benefitPrice, 390000);
    assert.equal(parsed.stockStatus, 'sold_out');
    assert.equal(parsed.optionSummary, '색상 Grey · 사이즈 M');
});

test('HAGO PDP parser extracts benefit and options', () => {
    const html = `
        <div class="delivery-info">배송비 3,000원 / 50,000원 이상 무료</div>
        <div class="benefit-price">혜택가 189,000원</div>
        <div class="color-list"><button>크림</button></div>
        <div class="size-list"><button>S</button><button>M</button></div>
    `;

    const parsed = parseHagoProductDetailHtml(html, product({
        source: 'HAGO',
        price: 219000,
        link: 'https://www.hago.kr/product/200001',
    }));

    assert.equal(parsed.shippingFee, 3000);
    assert.equal(parsed.shippingFreeThreshold, 50000);
    assert.equal(parsed.benefitPrice, 189000);
    assert.equal(parsed.optionSummary, '색상 크림 · 사이즈 S, M');
});

test('HAGO PDP parser rejects purchase controls nested inside broad option containers', () => {
    const html = `
        <div class="m_prodetail-head-option m_prodetail-option">
            <div class="mm_btnbox">
                <button class="mm_like"><b>찜한 아이템에 추가하기</b></button>
                <button class="btn_cart"><b>장바구니</b></button>
                <button class="btn_buy"><b>구매하기</b></button>
            </div>
        </div>
    `;

    const parsed = parseHagoProductDetailHtml(html, product({
        source: 'HAGO',
        price: 97300,
        link: 'https://www.hago.kr/goods/detail/674868',
    }));

    assert.equal(parsed.optionValues, undefined);
    assert.equal(parsed.variantCandidates, undefined);
    assert.equal(parsed.optionSummary, undefined);
});

test('EQL PDP parser extracts options and stock state', () => {
    const html = `
        <div class="shipping-info">무료배송</div>
        <div class="benefit-price">혜택가 159,000원</div>
        <div class="stock-status">판매중</div>
        <div class="color-list"><button>스트라이프</button></div>
        <div class="size-list"><button>FREE</button></div>
    `;

    const parsed = parseEqlProductDetailHtml(html, product({
        source: 'EQL',
        price: 179000,
        link: 'https://www.eqlstore.com/product/300001',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 159000);
    assert.equal(parsed.stockStatus, 'in_stock');
    assert.equal(parsed.optionSummary, '색상 스트라이프 · 사이즈 FREE');
});

test('LFMALL PDP parser extracts delivery threshold and options', () => {
    const html = `
        <div class="delivery-info">배송비 2,500원 / 30,000원 이상 무료</div>
        <div class="benefit-price">혜택가 89,000원</div>
        <div class="color-list"><button>네이비</button></div>
        <div class="size-list"><button>95</button><button>100</button></div>
    `;

    const parsed = parseLfMallProductDetailHtml(html, product({
        source: 'LFMALL',
        price: 99000,
        link: 'https://www.lfmall.co.kr/product/400001',
    }));

    assert.equal(parsed.shippingFee, 2500);
    assert.equal(parsed.shippingFreeThreshold, 30000);
    assert.equal(parsed.benefitPrice, 89000);
    assert.equal(parsed.optionSummary, '색상 네이비 · 사이즈 95, 100');
});

test('SIVILLAGE PDP parser extracts delivery and option summary', () => {
    const html = `
        <div class="delivery-info">무료배송</div>
        <div class="benefit-price">혜택가 309,000원</div>
        <div class="color-list"><button>블랙</button></div>
        <div class="size-list"><button>90</button></div>
    `;

    const parsed = parseSiVillageProductDetailHtml(html, product({
        source: 'SIVILLAGE',
        price: 329000,
        link: 'https://www.sivillage.com/goods/initDetailGoods.siv?goods_no=500001',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 309000);
    assert.equal(parsed.optionSummary, '색상 블랙 · 사이즈 90');
});

test('generic PDP parser falls back to JSON-LD and meta signals when selectors miss', () => {
    const html = `
        <html>
            <head>
                <meta itemprop="availability" content="https://schema.org/InStock" />
                <script type="application/ld+json">
                    {
                        "@context": "https://schema.org",
                        "@type": "Product",
                        "name": "Structured Coat",
                        "sku": "SKU-COAT-01",
                        "color": "Camel",
                        "size": ["M", "L"],
                        "offers": {
                            "@type": "Offer",
                            "price": "179000",
                            "availability": "https://schema.org/InStock",
                            "shippingDetails": {
                                "@type": "OfferShippingDetails",
                                "shippingRate": {
                                    "@type": "MonetaryAmount",
                                    "value": "0",
                                    "currency": "KRW"
                                }
                            }
                        }
                    }
                </script>
            </head>
            <body></body>
        </html>
    `;

    const parsed = parseProductDetailHtml(html, product({
        source: 'HANDSOME',
        price: 219000,
        link: 'https://www.thehandsome.com/ko/PM/productDetail/STBS1234567',
    }));

    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.benefitPrice, 179000);
    assert.equal(parsed.stockStatus, 'in_stock');
    assert.equal(parsed.variantSku, 'SKU-COAT-01');
    assert.deepEqual(parsed.colorOptions, ['Camel']);
    assert.deepEqual(parsed.sizeOptions, ['M', 'L']);
    assert.equal(parsed.optionSummary, '색상 Camel · 사이즈 M, L');
});

test('structured product variants are captured as selectable variant candidates', () => {
    const html = `
        <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Structured Knit",
                "hasVariant": [
                    {
                        "@type": "Product",
                        "name": "블랙/M",
                        "variantId": "VAR-BLACK-M",
                        "sku": "SKU-BLACK-M",
                        "color": "블랙",
                        "size": "M",
                        "offers": {
                            "@type": "Offer",
                            "price": "149000",
                            "availability": "https://schema.org/InStock"
                        }
                    },
                    {
                        "@type": "Product",
                        "name": "블랙/L",
                        "variantId": "VAR-BLACK-L",
                        "sku": "SKU-BLACK-L",
                        "color": "블랙",
                        "size": "L",
                        "offers": {
                            "@type": "Offer",
                            "price": "149000",
                            "availability": "https://schema.org/OutOfStock"
                        }
                    }
                ]
            }
        </script>
    `;

    const parsed = parseProductDetailHtml(html, product({
        source: 'SSF',
        price: 159000,
        link: 'https://www.ssfshop.com/goods/structured-knit',
    }));

    assert.equal(parsed.variantCandidates?.length, 2);
    assert.deepEqual(parsed.variantCandidates?.map((candidate) => candidate.label), ['블랙/M', '블랙/L']);
    assert.equal(parsed.variantCandidates?.[0]?.variantSku, 'SKU-BLACK-M');
    assert.equal(parsed.variantCandidates?.[0]?.price, 149000);
    assert.equal(parsed.variantCandidates?.[1]?.stockStatus, 'sold_out');
});

test('generic PDP parser extracts variant identifiers from DOM data attributes', () => {
    const html = `
        <button
            data-variant-id="VARIANT_12345"
            data-sku="SKU-12345"
            data-color="블랙"
            data-size="L"
            data-price="99000"
        >
            블랙/L
        </button>
        <div class="delivery-info">무료배송</div>
        <div class="size-list"><button>L</button></div>
    `;

    const parsed = parseProductDetailHtml(html, product({
        source: 'MUSINSA',
        price: 99000,
        link: 'https://www.musinsa.com/products/12345',
    }));

    assert.equal(parsed.variantId, 'VARIANT_12345');
    assert.equal(parsed.variantSku, 'SKU-12345');
    assert.equal(parsed.shippingFee, 0);
    assert.equal(parsed.variantCandidates?.length, 1);
    assert.equal(parsed.variantCandidates?.[0]?.label, '블랙/L');
    assert.equal(parsed.variantCandidates?.[0]?.color, '블랙');
    assert.equal(parsed.variantCandidates?.[0]?.size, 'L');
    assert.equal(parsed.variantCandidates?.[0]?.price, 99000);
    assert.equal(parsed.optionSummary, '색상 블랙 · 사이즈 L');
});

test('host validation blocks unsupported detail URLs', () => {
    assert.equal(isPdpDetailEnrichmentSupported(product({
        source: 'MUSINSA',
        link: 'https://www.musinsa.com/products/123',
    })), true);

    assert.equal(isPdpDetailEnrichmentSupported(product({
        source: 'MUSINSA',
        link: 'https://evil.example.com/products/123',
    })), false);
});
