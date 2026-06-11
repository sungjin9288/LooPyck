import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function runJsonScript(scriptPath) {
  const output = execFileSync('node', [scriptPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
  return JSON.parse(output);
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-runtime-ready.json');

mkdirSync(outputDir, { recursive: true });

const refresh = runJsonScript(path.join('scripts', 'buildPlaywrightMcpRuntimeRefresh.mjs'));
const assertResult = runJsonScript(path.join('scripts', 'assertPlaywrightMcpRuntimeReady.mjs'));

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  ok: assertResult.ok,
  status: assertResult.status,
  recommendation: assertResult.recommendation,
  allowedStatuses: assertResult.allowedStatuses,
  artifacts: {
    refresh: refresh.outputPath,
    health: refresh.artifacts.health,
    handoff: refresh.artifacts.handoff,
    issueDraft: refresh.artifacts.issueDraft,
    packet: refresh.artifacts.packet,
  },
  assertion: {
    ok: assertResult.ok,
    status: assertResult.status,
    healthPath: assertResult.healthPath,
  },
};

writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`${JSON.stringify({ ...summary, outputPath }, null, 2)}\n`);

if (!assertResult.ok) {
  process.exitCode = 1;
}
