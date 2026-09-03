import fs from 'node:fs/promises';
import path from 'node:path';
import { buildGitWorkspaceProvenance } from './gitWorkspaceProvenance.mjs';

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';
const query = process.env.DIRECT_SOURCE_SMOKE_QUERY || '와이드 팬츠';
const requiredSources = (process.env.DIRECT_SOURCE_SMOKE_REQUIRED || 'SSF,HANDSOME,EQL,LFMALL')
    .split(',')
    .map((source) => source.trim())
    .filter(Boolean);

function targetName(url) {
    const hostname = new URL(url).hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' ? 'local' : 'netlify';
}

function targetKind(url) {
    return targetName(url) === 'local' ? 'local-working-tree' : 'deployed-environment';
}

async function main() {
    const url = new URL('/api/realtime-search', baseUrl);
    url.searchParams.set('q', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('sort', 'sim');
    url.searchParams.set('debug', '1');

    const startedAt = Date.now();
    const response = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    const elapsedMs = Date.now() - startedAt;
    const payload = await response.json();
    const diagnostics = payload?.diagnostics;
    const sources = Array.isArray(diagnostics?.sources) ? diagnostics.sources : [];

    const requiredResults = requiredSources.map((source) => {
        const row = sources.find((entry) => entry?.source === source);
        return {
            source,
            present: Boolean(row),
            attempted: row?.attempted === true,
            strategy: row?.strategy || null,
            directCount: Number(row?.directCount || 0),
            finalCount: Number(row?.finalCount || 0),
            durationMs: Number(row?.durationMs || 0),
            passed: Boolean(row && row.attempted === true && row.strategy === 'direct' && Number(row.directCount) > 0),
        };
    });

    const evidence = {
        ok: response.ok && requiredResults.every((result) => result.passed),
        generatedAt: new Date().toISOString(),
        baseUrl,
        targetKind: targetKind(baseUrl),
        runnerWorkspace: buildGitWorkspaceProvenance(process.cwd()),
        query,
        requestUrl: url.toString(),
        status: response.status,
        elapsedMs,
        productCount: Array.isArray(payload?.products) ? payload.products.length : 0,
        directSourceCount: Number(diagnostics?.directSourceCount || 0),
        fallbackSourceCount: Number(diagnostics?.fallbackSourceCount || 0),
        fallbackMode: response.headers.get('x-search-fallback-mode'),
        requiredSources: requiredResults,
    };

    const outputPath = path.resolve(
        process.cwd(),
        'output/playwright',
        `${targetName(baseUrl)}-direct-source-integration-smoke.json`
    );
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

    console.log(JSON.stringify({ ...evidence, outputPath }, null, 2));
    if (!evidence.ok) process.exitCode = 1;
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
