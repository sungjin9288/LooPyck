import assert from 'node:assert/strict';
import test from 'node:test';
import {
    ABLY_SCRAPER_CONFIG,
    COUPANG_SCRAPER_CONFIG,
    EQL_SCRAPER_CONFIG,
    FARFETCH_SCRAPER_CONFIG,
    HAGO_SCRAPER_CONFIG,
    HANDSOME_SCRAPER_CONFIG,
    LFMALL_SCRAPER_CONFIG,
    parseMarketplaceSearchResults,
    SSF_SCRAPER_CONFIG,
    SIVILLAGE_SCRAPER_CONFIG,
    SSENSE_SCRAPER_CONFIG,
    WCONCEPT_SCRAPER_CONFIG,
    ZIGZAG_SCRAPER_CONFIG,
} from '../lib/api/marketplaceScrapers.ts';

test('W컨셉 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <ul>
            <li class="product-card">
                <a href="/Product/301000001">
                    <img src="https://img.wconceptcdn.com/1.jpg" alt="울 블렌드 자켓" />
                    <span class="brand">FRONTROW</span>
                    <span class="prd_name">울 블렌드 자켓</span>
                    <strong class="sale">129000원</strong>
                    <span class="delivery-info">배송비 2,500원 / 50,000원 이상 무료</span>
                    <span class="member-price">회원가 119,000원</span>
                    <span class="stock-status">판매중</span>
                </a>
            </li>
        </ul>
    `;

    const products = parseMarketplaceSearchResults(html, WCONCEPT_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'W_CONCEPT');
    assert.equal(products[0]?.title, '울 블렌드 자켓');
    assert.equal(products[0]?.price, 129000);
    assert.equal(products[0]?.link, 'https://www.wconcept.co.kr/Product/301000001');
    assert.equal(products[0]?.shippingFee, 2500);
    assert.equal(products[0]?.shippingFreeThreshold, 50000);
    assert.equal(products[0]?.benefitPrice, 119000);
    assert.equal(products[0]?.stockStatus, 'in_stock');
});

test('지그재그 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <div>
            <a href="/catalog/products/130000001">
                <img src="https://image.zigzag.kr/1.jpg" alt="와이드 데님 팬츠" />
                <p class="brand">누보텐</p>
                <p class="name">와이드 데님 팬츠</p>
                <span class="price">39,900원</span>
            </a>
        </div>
    `;

    const products = parseMarketplaceSearchResults(html, ZIGZAG_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'ZIGZAG');
    assert.equal(products[0]?.brand, '누보텐');
    assert.equal(products[0]?.price, 39900);
    assert.equal(products[0]?.link, 'https://zigzag.kr/catalog/products/130000001');
});

test('에이블리 JSON-LD 블록을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "ItemList",
                "itemListElement": [
                    {
                        "@type": "Product",
                        "name": "리본 가디건",
                        "url": "https://a-bly.com/goods/100001",
                        "image": ["https://image.a-bly.com/1.jpg"],
                        "brand": { "@type": "Brand", "name": "에이블리셀렉트" },
                        "offers": {
                            "@type": "Offer",
                            "price": "27900",
                            "availability": "https://schema.org/LimitedAvailability",
                            "shippingDetails": {
                                "@type": "OfferShippingDetails",
                                "shippingRate": {
                                    "@type": "MonetaryAmount",
                                    "value": "0"
                                },
                                "description": "무료배송"
                            },
                            "priceSpecification": [
                                {
                                    "@type": "UnitPriceSpecification",
                                    "priceType": "member price",
                                    "price": "24900"
                                }
                            ]
                        }
                    }
                ]
            }
        </script>
    `;

    const products = parseMarketplaceSearchResults(html, ABLY_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'ABLY');
    assert.equal(products[0]?.title, '리본 가디건');
    assert.equal(products[0]?.price, 27900);
    assert.equal(products[0]?.link, 'https://a-bly.com/goods/100001');
    assert.equal(products[0]?.shippingFee, 0);
    assert.equal(products[0]?.benefitPrice, 24900);
    assert.equal(products[0]?.stockStatus, 'low_stock');
});

test('SSF 카드와 JSON-LD가 중복되어도 하나로 dedupe한다', () => {
    const html = `
        <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "캐시미어 니트",
                "url": "https://www.ssfshop.com/goods/00001",
                "image": "https://image.ssfshop.com/1.jpg",
                "brand": "BEAKER",
                "offers": { "@type": "Offer", "price": "198000" }
            }
        </script>
        <a href="/goods/00001">
            <img src="https://image.ssfshop.com/1.jpg" alt="캐시미어 니트" />
            <span class="brand">BEAKER</span>
            <span class="prd_name">캐시미어 니트</span>
            <span class="price">198,000원</span>
        </a>
    `;

    const products = parseMarketplaceSearchResults(html, SSF_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'SSF');
    assert.equal(products[0]?.brand, 'BEAKER');
    assert.equal(products[0]?.price, 198000);
});

test('쿠팡 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <a href="/vp/products/700001?itemId=1&vendorItemId=2">
            <img src="https://image.coupangcdn.com/1.jpg" alt="쿠팡 베이직 후디" />
            <div class="brand">Coupang Basics</div>
            <div class="name">쿠팡 베이직 후디</div>
            <strong class="price-value">29,900원</strong>
            <div class="shipping">무료배송</div>
            <div class="discount">와우회원가 27,900원</div>
            <div class="soldout-badge">품절</div>
        </a>
    `;

    const products = parseMarketplaceSearchResults(html, COUPANG_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'COUPANG');
    assert.equal(products[0]?.price, 29900);
    assert.equal(products[0]?.link, 'https://www.coupang.com/vp/products/700001?itemId=1&vendorItemId=2');
    assert.equal(products[0]?.shippingFee, 0);
    assert.equal(products[0]?.benefitPrice, 27900);
    assert.equal(products[0]?.stockStatus, 'sold_out');
});

test('한섬 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <a href="/ko/PM/productDetail/STBS1234567">
            <img src="https://img.thehandsome.com/1.jpg" alt="타임 울 코트" />
            <span class="brand">TIME</span>
            <span class="product_name">타임 울 코트</span>
            <span class="price">598,000원</span>
        </a>
    `;

    const products = parseMarketplaceSearchResults(html, HANDSOME_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'HANDSOME');
    assert.equal(products[0]?.link, 'https://www.thehandsome.com/ko/PM/productDetail/STBS1234567');
});

test('Farfetch 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <article>
            <a href="/kr/shopping/women/item-24681012.aspx">
                <img src="https://cdn.farfetch.com/1.jpg" alt="Maison Margiela Tabi Loafers" />
                <span data-testid="productCardDesignerName">Maison Margiela</span>
                <span data-testid="productCardDescription">Tabi Loafers</span>
                <span data-testid="productCardPrice">₩1,290,000</span>
            </a>
        </article>
    `;

    const products = parseMarketplaceSearchResults(html, FARFETCH_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'FARFETCH');
    assert.equal(products[0]?.price, 1290000);
});

test('SSENSE JSON-LD 블록을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <script type="application/ld+json">
            {
                "@context": "https://schema.org",
                "@type": "Product",
                "name": "Logo Hoodie",
                "url": "https://www.ssense.com/ko-kr/men/product/acne-studios/black-logo-hoodie/12345671",
                "image": "https://img.ssensemedia.com/1.jpg",
                "brand": "Acne Studios",
                "offers": { "@type": "Offer", "price": "450000" }
            }
        </script>
    `;

    const products = parseMarketplaceSearchResults(html, SSENSE_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'SSENSE');
    assert.equal(products[0]?.price, 450000);
});

test('HAGO 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <a href="/product/200001">
            <img src="https://img.hago.kr/1.jpg" alt="플리츠 원피스" />
            <span class="brand">LOW CLASSIC</span>
            <span class="product-name">플리츠 원피스</span>
            <span class="price">219,000원</span>
        </a>
    `;

    const products = parseMarketplaceSearchResults(html, HAGO_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'HAGO');
});

test('EQL 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <a href="/product/300001">
            <img src="https://img.eqlstore.com/1.jpg" alt="스트라이프 셔츠" />
            <span class="brand">LE17SEPTEMBRE</span>
            <span class="title">스트라이프 셔츠</span>
            <span class="price">179,000원</span>
        </a>
    `;

    const products = parseMarketplaceSearchResults(html, EQL_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'EQL');
});

test('LF몰 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <a href="/product.do?cmd=getProductDetail&PROD_CD=400001">
            <img src="https://img.lfmall.co.kr/1.jpg" alt="헤지스 니트" />
            <span class="brand">HAZZYS</span>
            <span class="product-name">헤지스 니트</span>
            <span class="price">159,000원</span>
        </a>
    `;

    const products = parseMarketplaceSearchResults(html, LFMALL_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'LFMALL');
});

test('S.I.VILLAGE 카드 마크업을 직접 상품 목록으로 파싱한다', () => {
    const html = `
        <a href="/goods/500001">
            <img src="https://img.sivillage.com/1.jpg" alt="울 블렌드 재킷" />
            <span class="brand">MAN ON THE BOON</span>
            <span class="title">울 블렌드 재킷</span>
            <span class="price">329,000원</span>
        </a>
    `;

    const products = parseMarketplaceSearchResults(html, SIVILLAGE_SCRAPER_CONFIG);

    assert.equal(products.length, 1);
    assert.equal(products[0]?.source, 'SIVILLAGE');
});
