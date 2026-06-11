import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';

function runCommand(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8' });
  } catch (error) {
    return error.stdout?.toString?.() ?? '';
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseProcessEntry(psOutput, pid) {
  const line = psOutput
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith(`${pid} `));

  if (!line) return null;
  const firstSpace = line.indexOf(' ');
  return {
    pid,
    command: line.slice(firstSpace + 1).trim(),
  };
}

function readProcessCwd(pid) {
  const output = runCommand('lsof', ['-a', '-d', 'cwd', '-p', String(pid)]);
  const line = output
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('node ') || entry.startsWith('npm '));

  if (!line) return null;
  const parts = line.split(/\s+/);
  return parts.at(-1) ?? null;
}

function terminateProcessGroup(pid) {
  try {
    process.kill(-pid, 'SIGTERM');
  } catch {
    try {
      process.kill(pid, 'SIGTERM');
    } catch {
      return;
    }
  }
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-local-verify.json');
const launchArgs = [
  '-y',
  '@playwright/mcp@0.0.70',
  '--output-dir',
  './output/playwright/mcp',
  '--user-data-dir',
  './output/playwright/mcp-chrome',
  '--save-session',
];

mkdirSync(outputDir, { recursive: true });

const child = spawn('npx', launchArgs, {
  cwd: workspace,
  stdio: 'pipe',
});

await sleep(1500);

const psOutput = runCommand('ps', ['-Ao', 'pid,args']);
const childPids = runCommand('pgrep', ['-P', String(child.pid)])
  .split('\n')
  .map((entry) => Number(entry.trim()))
  .filter((pid) => Number.isFinite(pid));
const candidatePids = [child.pid, ...childPids];
const processes = candidatePids
  .map((pid) => parseProcessEntry(psOutput, pid))
  .filter(Boolean)
  .map(({ pid, command }) => ({
  pid,
  command,
  cwd: readProcessCwd(pid),
}));

const allWorkspaceScoped = processes.length > 0 && processes.every((process) => process.cwd === workspace);
const status = allWorkspaceScoped ? 'ok' : processes.length === 0 ? 'no-process' : 'cwd-mismatch';

terminateProcessGroup(child.pid);
await sleep(500);

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  launchPid: child.pid,
  launchCommand: ['npx', ...launchArgs].join(' '),
  status,
  processCount: processes.length,
  processes,
  expectation: workspace,
  outputPath,
};

writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
