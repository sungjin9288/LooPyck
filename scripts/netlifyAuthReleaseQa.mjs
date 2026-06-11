import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';

const baseUrl = process.argv[2] || process.env.SMOKE_BASE_URL || 'https://loo-pyck.netlify.app';
const outputPath = resolve('output/playwright/netlify-auth-release-qa-summary.json');
const playwrightCliPath = resolve(process.env.HOME || '', '.codex/skills/playwright/scripts/playwright_cli.sh');

const steps = [
  {
    id: 'admin-api-smoke',
    label: 'Netlify authenticated admin API smoke',
    command: 'npm',
    args: ['run', 'ntl:admin-smoke'],
  },
  {
    id: 'admin-browser-smoke',
    label: 'Netlify authenticated admin browser smoke',
    command: 'npm',
    args: ['run', 'ntl:admin-browser-smoke'],
    resetPlaywrightSessions: true,
  },
  {
    id: 'favorites-compare-probe',
    label: 'Netlify authenticated favorites compare-flow probe',
    command: 'npm',
    args: ['run', 'ntl:favorites-probe'],
    resetPlaywrightSessions: true,
  },
];

function parseJsonIfPossible(text) {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const startIndexes = [];
  for (let index = 0; index < trimmed.length; index += 1) {
    if (trimmed[index] === '{') {
      startIndexes.push(index);
    }
  }

  for (let index = startIndexes.length - 1; index >= 0; index -= 1) {
    const candidate = trimmed.slice(startIndexes[index]).trim();

    try {
      return JSON.parse(candidate);
    } catch {
      continue;
    }
  }

  return null;
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

function resetPlaywrightSessions() {
  return new Promise((resolveReset) => {
    const child = spawn(playwrightCliPath, ['close-all'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stderr = '';

    child.stdout.on('data', (chunk) => {
      process.stdout.write(chunk.toString());
    });

    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      stderr += text;
      process.stderr.write(text);
    });

    child.on('close', () => {
      resolveReset(stderr.trim());
    });
  });
}

async function main() {
  const results = [];

  for (const step of steps) {
    if (step.resetPlaywrightSessions) {
      process.stderr.write('\n[ntl:auth-release-qa] Reset Playwright sessions\n');
      await resetPlaywrightSessions();
    }

    process.stderr.write(`\n[ntl:auth-release-qa] ${step.label}\n`);
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
    syntheticAuthCoverage: {
      adminApi: Boolean(results.find((result) => result.id === 'admin-api-smoke')?.ok),
      adminBrowser: Boolean(results.find((result) => result.id === 'admin-browser-smoke')?.ok),
      favoritesCompareClickThrough: Boolean(results.find((result) => result.id === 'favorites-compare-probe')?.parsed?.verified?.favoritesLinkClickThrough),
      comparePageReachable: Boolean(results.find((result) => result.id === 'favorites-compare-probe')?.parsed?.verified?.comparePageReachable),
    },
    manualScopeRemaining: [
      'real Google account compare-flow feel check',
      'Android Studio install and USB debugging device attach',
    ],
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
