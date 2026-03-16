const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';

const checks = [
    {
        name: 'home',
        url: `${baseUrl}/`,
        expectStatus: 200,
        expectContentType: 'text/html',
    },
    {
        name: 'admin page',
        url: `${baseUrl}/admin`,
        expectStatus: 200,
        expectContentType: 'text/html',
    },
    {
        name: 'admin guard',
        url: `${baseUrl}/api/admin/access`,
        expectStatus: 401,
        expectJsonField: ['ok', false],
    },
    {
        name: 'search 남자 후드',
        url: `${baseUrl}/api/realtime-search?q=${encodeURIComponent('남자 후드')}&page=1&pageSize=6&sort=sim`,
        expectStatus: 200,
        expectProductsMin: 1,
    },
    {
        name: 'search 와이드 팬츠',
        url: `${baseUrl}/api/realtime-search?q=${encodeURIComponent('와이드 팬츠')}&page=1&pageSize=6&sort=sim`,
        expectStatus: 200,
        expectProductsMin: 1,
    },
];

async function runCheck(check) {
    const response = await fetch(check.url, { redirect: 'follow' });
    const contentType = response.headers.get('content-type') || '';

    if (response.status !== check.expectStatus) {
        throw new Error(`${check.name}: expected ${check.expectStatus}, got ${response.status}`);
    }

    if (check.expectContentType && !contentType.includes(check.expectContentType)) {
        throw new Error(`${check.name}: expected content-type to include ${check.expectContentType}, got ${contentType}`);
    }

    if (check.expectJsonField || check.expectProductsMin !== undefined) {
        const json = await response.json();

        if (check.expectJsonField) {
            const [field, expected] = check.expectJsonField;
            if (json[field] !== expected) {
                throw new Error(`${check.name}: expected json.${field}=${expected}, got ${json[field]}`);
            }
        }

        if (check.expectProductsMin !== undefined) {
            const products = Array.isArray(json.products) ? json.products : [];
            if (products.length < check.expectProductsMin) {
                throw new Error(`${check.name}: expected at least ${check.expectProductsMin} products, got ${products.length}`);
            }
            return {
                status: response.status,
                products: products.length,
                firstTitle: products[0]?.title || null,
            };
        }
    }

    return { status: response.status, contentType };
}

async function main() {
    const results = [];

    for (const check of checks) {
        const result = await runCheck(check);
        results.push({ name: check.name, ...result });
    }

    console.log(JSON.stringify({ baseUrl, results }, null, 2));
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
