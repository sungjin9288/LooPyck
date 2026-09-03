import { createNetlifyAdminAuthPayload } from './netlifyAdminAuth.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';
const diagnosticsLimit = process.env.SEARCH_DIAGNOSTICS_LIMIT?.trim() || '5';

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

    const diagnostics = await fetchJson(`${baseUrl}/api/realtime-search/diagnostics?limit=${encodeURIComponent(diagnosticsLimit)}&include=recent`, {
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

    const diagnosticsOutput = process.env.SEARCH_DIAGNOSTICS_OUTPUT?.trim();
    if (diagnosticsOutput) {
        const outputPath = path.resolve(diagnosticsOutput);
        const interactionSummary = diagnostics.json.interactionSummary || {};
        const snapshot = {
            generatedAt: new Date().toISOString(),
            baseUrl,
            scope: 'search-quality-observation',
            privacyBoundary: 'Recent queries, product identities, opened brands, alert data, and admin identity are excluded.',
            summary: {
                trackedSearches: Number(diagnostics.json.summary?.trackedSearches || 0),
                lastUpdatedAt: diagnostics.json.summary?.lastUpdatedAt || null,
            },
            quality: diagnostics.json.quality,
            interactionSummary: {
                total: Number(interactionSummary.total || 0),
                suggestionClicks: Number(interactionSummary.suggestionClicks || 0),
                productImpressions: Number(interactionSummary.productImpressions || 0),
                productOpens: Number(interactionSummary.productOpens || 0),
                storeClicks: Number(interactionSummary.storeClicks || 0),
                badgeCohorts: Array.isArray(interactionSummary.badgeCohorts) ? interactionSummary.badgeCohorts : [],
            },
            sourceHealth: Array.isArray(diagnostics.json.sourceHealth) ? diagnostics.json.sourceHealth : [],
            storage: diagnostics.json.storage || 'memory',
        };

        mkdirSync(path.dirname(outputPath), { recursive: true });
        writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
    }

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
            observationSnapshot: diagnosticsOutput ? path.resolve(diagnosticsOutput) : null,
            requestedLimit: Number(diagnosticsLimit),
        },
    }, null, 2));
}

main().catch((error) => {
    console.error(error.message);
    process.exit(1);
});
