import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';
const outputPath = resolve('output/playwright/netlify-uat-summary.json');

const steps = [
    {
        id: 'public-api-smoke',
        label: 'Netlify public API smoke',
        command: 'npm',
        args: ['run', 'ntl:smoke'],
    },
    {
        id: 'admin-api-smoke',
        label: 'Netlify authenticated admin API smoke',
        command: 'npm',
        args: ['run', 'ntl:admin-smoke'],
    },
    {
        id: 'public-browser-smoke',
        label: 'Netlify public browser smoke',
        command: 'npm',
        args: ['run', 'ntl:browser-smoke'],
    },
    {
        id: 'admin-browser-smoke',
        label: 'Netlify authenticated admin browser smoke',
        command: 'npm',
        args: ['run', 'ntl:admin-browser-smoke'],
    },
];

function parseJsonIfPossible(text) {
    const trimmed = text.trim();
    if (!trimmed) return null;

    try {
        return JSON.parse(trimmed);
    } catch {
        return null;
    }
}

function runStep(step) {
    return new Promise((resolveStep) => {
        const startedAt = Date.now();
        const child = spawn(step.command, step.args, {
            cwd: process.cwd(),
            env: {
                ...process.env,
                SMOKE_BASE_URL: baseUrl,
            },
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (chunk) => {
            const text = chunk.toString();
            stdout += text;
            process.stdout.write(text);
        });

        child.stderr.on('data', (chunk) => {
            const text = chunk.toString();
            stderr += text;
            process.stderr.write(text);
        });

        child.on('close', (code) => {
            resolveStep({
                id: step.id,
                label: step.label,
                ok: code === 0,
                exitCode: code,
                durationMs: Date.now() - startedAt,
                parsed: parseJsonIfPossible(stdout),
                stdout: stdout.trim(),
                stderr: stderr.trim(),
            });
        });
    });
}

async function main() {
    const results = [];

    for (const step of steps) {
        process.stderr.write(`\n[ntl:uat] ${step.label}\n`);
        const result = await runStep(step);
        results.push(result);

        if (!result.ok) {
            break;
        }
    }

    const summary = {
        generatedAt: new Date().toISOString(),
        baseUrl,
        ok: results.length === steps.length && results.every((result) => result.ok),
        steps: results.map(({ stdout, stderr, ...rest }) => ({
            ...rest,
            stdoutPreview: stdout.slice(0, 800),
            stderrPreview: stderr.slice(0, 800),
        })),
        playwrightMcpQuickPass: {
            doc: 'docs/PLAYWRIGHT_MCP_UAT.md',
            prepCommands: [
                '$HOME/.codex/skills/playwright/scripts/playwright_cli.sh close-all',
                'npm run ntl:quick-pass:prep',
            ],
            checks: [
                'brand compare entry hero and search entry render on /brand/musinsa',
                'category compare entry hero and search entry render on /category/sneakers',
                'search query and sort persist when navigating back to /',
                'guest shortlist section re-entry stays visible when shortlisted items exist',
            ],
        },
    };

    mkdirSync(resolve('output/playwright'), { recursive: true });
    writeFileSync(outputPath, JSON.stringify(summary, null, 2));

    console.log(JSON.stringify({
        ...summary,
        outputPath,
    }, null, 2));

    if (!summary.ok) {
        process.exit(1);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
