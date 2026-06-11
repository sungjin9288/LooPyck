import { accessSync, constants, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function runCommand(command, args) {
  try {
    return execFileSync(command, args, { encoding: 'utf8' });
  } catch (error) {
    return error.stdout?.toString?.() ?? '';
  }
}

function parsePlaywrightMcpPids(psOutput) {
  return psOutput
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => line.includes('playwright-mcp'))
    .filter((line) => !line.includes('playwrightMcpDoctor'))
    .map((line) => {
      const match = line.match(/^(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$/);
      if (!match) return null;
      const [, pidText, ppidText, elapsed, stat, command] = match;
      const pid = Number(pidText);
      const ppid = Number(ppidText);
      if (!Number.isFinite(pid)) return null;
      return {
        pid,
        ppid: Number.isFinite(ppid) ? ppid : null,
        elapsed,
        stat,
        command,
      };
    })
    .filter(Boolean);
}

function readProcessCwd(pid) {
  const output = runCommand('lsof', ['-a', '-d', 'cwd', '-p', String(pid)]);
  const line = output
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry.startsWith('node ') || entry.startsWith('playwright-mcp '));

  if (!line) return null;
  const parts = line.split(/\s+/);
  return parts.at(-1) ?? null;
}

function isWritable(targetPath) {
  try {
    accessSync(targetPath, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-doctor.json');
const rootOutputDir = '/.playwright-mcp';
const psOutput = runCommand('ps', ['-Ao', 'pid,ppid,etime,stat,args']);
const processes = parsePlaywrightMcpPids(psOutput).map((process) => {
  const { pid } = process;
  const cwd = readProcessCwd(pid);
  return {
    ...process,
    cwd,
    usesRootCwd: cwd === '/',
  };
});

const hasActiveProcess = processes.length > 0;
const hasRootCwdProcess = processes.some((process) => process.usesRootCwd);
const workspaceProcesses = processes.filter((process) => process.cwd === workspace);
const rootCwdProcesses = processes.filter((process) => process.usesRootCwd);
const rootOutputDirExists = existsSync(rootOutputDir);
const rootDirectoryWritable = isWritable('/');
const rootOutputDirWritable = rootOutputDirExists ? isWritable(rootOutputDir) : false;

let status = 'ok';
let recommendation = 'Playwright MCP processes look workspace-safe.';

if (!hasActiveProcess) {
  status = 'no-process';
  recommendation = 'No active playwright-mcp process found. Trigger the MCP once, then rerun this doctor.';
} else if (workspaceProcesses.length > 0 && hasRootCwdProcess) {
  status = 'workspace-ok-global-root-risk';
  recommendation = 'This workspace has active playwright-mcp processes, but at least one global playwright-mcp process still uses cwd=/. Keep fallback ready until stale/global root-cwd processes are gone.';
} else if (hasRootCwdProcess) {
  status = 'root-cwd-risk';
  recommendation = rootDirectoryWritable || rootOutputDirWritable
    ? 'playwright-mcp is using cwd=/, so create /.playwright-mcp or force a workspace output-dir before retrying.'
    : 'playwright-mcp is using cwd=/ and root is not writable here. Use CLI fallback or fix MCP launch cwd/output-dir.';
}

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  status,
  recommendation,
  rootOutputDir,
  rootOutputDirExists,
  rootDirectoryWritable,
  rootOutputDirWritable,
  processCount: processes.length,
  workspaceProcessCount: workspaceProcesses.length,
  rootCwdProcessCount: rootCwdProcesses.length,
  processes,
  fallbackArtifacts: [
    'output/playwright/netlify-quick-pass-prep.json',
    'output/playwright/netlify-quick-pass-notes.md',
    'output/playwright/netlify-uat-summary.json',
  ],
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`${JSON.stringify({ ...summary, outputPath }, null, 2)}\n`);
