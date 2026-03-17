import { createNetlifyAdminAuthPayload } from './netlifyAdminAuth.mjs';

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';

async function fetchJson(url, init) {
    const response = await fetch(url, init);
    const text = await response.text();
    let json = null;

    try {
        json = text ? JSON.parse(text) : null;
    } catch {
        throw new Error(`Expected JSON from ${url}, got: ${text.slice(0, 200)}`);
    }

    return { response, json };
}

async function main() {
    const { adminUid, customToken, firebaseConfig } = await createNetlifyAdminAuthPayload();
    const apiKey = firebaseConfig.apiKey;
    const signInUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${encodeURIComponent(apiKey)}`;
    const signInResult = await fetchJson(signInUrl, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
        },
        body: JSON.stringify({
            token: customToken,
            returnSecureToken: true,
        }),
    });

    if (!signInResult.response.ok) {
        throw new Error(`Custom token sign-in failed (${signInResult.response.status}): ${JSON.stringify(signInResult.json)}`);
    }

    const idToken = signInResult.json?.idToken;
    if (!idToken) {
        throw new Error('Missing idToken from Firebase custom token sign-in response.');
    }

    const adminAccess = await fetchJson(`${baseUrl}/api/admin/access`, {
        headers: {
            authorization: `Bearer ${idToken}`,
        },
    });

    if (adminAccess.response.status !== 200 || adminAccess.json?.ok !== true || adminAccess.json?.uid !== adminUid) {
        throw new Error(`Admin access smoke failed: ${JSON.stringify({
            status: adminAccess.response.status,
            body: adminAccess.json,
        })}`);
    }

    const diagnostics = await fetchJson(`${baseUrl}/api/realtime-search/diagnostics?limit=5&include=recent`, {
        headers: {
            authorization: `Bearer ${idToken}`,
        },
    });

    if (diagnostics.response.status !== 200) {
        throw new Error(`Diagnostics smoke failed (${diagnostics.response.status}): ${JSON.stringify(diagnostics.json)}`);
    }

    const requiredKeys = [
        'summary',
        'searchLearning',
        'searchLearningActivity',
        'searchQualityCoverage',
        'pdp',
        'alerts',
        'alertTuning',
    ];

    for (const key of requiredKeys) {
        if (!(key in diagnostics.json)) {
            throw new Error(`Diagnostics response missing required key: ${key}`);
        }
    }

    const terminalHints = {
        summaryKeys: Object.keys(diagnostics.json.summary || {}),
        searchLearningCount: Array.isArray(diagnostics.json.searchLearning) ? diagnostics.json.searchLearning.length : 0,
        activityCount: Array.isArray(diagnostics.json.searchLearningActivity) ? diagnostics.json.searchLearningActivity.length : 0,
        coverageKeys: Object.keys(diagnostics.json.searchQualityCoverage || {}),
        alertStorage: diagnostics.json.alerts?.storage ?? null,
        pdpStorage: diagnostics.json.pdp?.storage ?? null,
    };

    console.log(JSON.stringify({
        baseUrl,
        adminUid,
        adminAccess: {
            status: adminAccess.response.status,
            uid: adminAccess.json.uid,
        },
        diagnostics: {
            status: diagnostics.response.status,
            terminalHints,
        },
    }, null, 2));
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
