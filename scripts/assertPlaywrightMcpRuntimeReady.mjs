import { readFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function ensureHealthArtifact() {
  execFileSync('node', [path.join('scripts', 'buildPlaywrightMcpHealth.mjs')], {
    cwd: process.cwd(),
    stdio: 'ignore',
  });
}

const workspace = process.cwd();
const healthPath = path.join(workspace, 'output', 'playwright', 'playwright-mcp-health.json');
const allowedStatuses = new Set(['fallback-ready', 'fully-ok']);

ensureHealthArtifact();

const health = JSON.parse(readFileSync(healthPath, 'utf8'));
const ok = allowedStatuses.has(health.status);

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  ok,
  status: health.status,
  recommendation: health.recommendation,
  allowedStatuses: [...allowedStatuses],
  healthPath,
};

process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);

if (!ok) {
  process.exitCode = 1;
}
