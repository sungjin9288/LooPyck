import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function runCommand(command, args) {
  return execFileSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  });
}

function runJsonScript(scriptPath) {
  return JSON.parse(runCommand('node', [scriptPath]));
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-runtime-refresh.json');

mkdirSync(outputDir, { recursive: true });

const health = runJsonScript(path.join('scripts', 'buildPlaywrightMcpHealth.mjs'));
const handoffPath = runCommand('node', [path.join('scripts', 'buildPlaywrightMcpRuntimeHandoff.mjs')]).trim();
const issueDraftPath = runCommand('node', [path.join('scripts', 'buildPlaywrightMcpRuntimeIssueDraft.mjs')]).trim();
const packetPath = runCommand('node', [path.join('scripts', 'buildPlaywrightMcpRuntimePacket.mjs')]).trim();

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  status: health.status,
  recommendation: health.recommendation,
  artifacts: {
    health: health.outputPath,
    handoff: handoffPath,
    issueDraft: issueDraftPath,
    packet: packetPath,
  },
};

writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`${JSON.stringify({ ...summary, outputPath }, null, 2)}\n`);
