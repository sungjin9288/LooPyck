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

function parseRequestedPids(value) {
  return (value ?? '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0);
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-result.json');
const requestedPids = parseRequestedPids(process.env.PLAYWRIGHT_MCP_CLEANUP_PIDS);
const confirmToken = process.env.PLAYWRIGHT_MCP_CLEANUP_CONFIRM;
const expectedConfirmToken = 'YES_TERMINATE_ROOT_CWD_MCP';
const hasRequestedPids = requestedPids.length > 0;
const missingConfirm = hasRequestedPids && confirmToken !== expectedConfirmToken;
const shouldExecute = requestedPids.length > 0 && confirmToken === expectedConfirmToken;
const doctor = runJsonScript(path.join('scripts', 'playwrightMcpDoctor.mjs'));
const rootCwdProcesses = doctor.processes?.filter((process) => process.usesRootCwd) ?? [];
const rootCwdPidSet = new Set(rootCwdProcesses.map((process) => process.pid));
const invalidPids = requestedPids.filter((pid) => !rootCwdPidSet.has(pid));
const killed = [];
const skipped = [];

if (missingConfirm) {
  skipped.push({
    reason: 'missing-confirm-token',
    expectedConfirmToken,
    requestedPids,
  });
}

if (invalidPids.length > 0) {
  skipped.push({
    reason: 'non-root-cwd-pid-requested',
    invalidPids,
  });
}

if (shouldExecute && invalidPids.length === 0) {
  for (const pid of requestedPids) {
    try {
      process.kill(pid, 'SIGTERM');
      killed.push(pid);
    } catch (error) {
      skipped.push({
        reason: 'kill-failed',
        pid,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }
}

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  mode: shouldExecute && invalidPids.length === 0 ? 'execute' : 'dry-run',
  doctorStatus: doctor.status,
  rootCwdCandidates: rootCwdProcesses.map(({ pid, ppid, elapsed, stat, command, cwd }) => ({
    pid,
    ppid,
    elapsed,
    stat,
    command,
    cwd,
  })),
  requestedPids,
  expectedConfirmToken,
  killed,
  skipped,
  nextSteps: killed.length > 0
    ? [
        'Run `npm run ntl:quick-pass:health`.',
        'Run `npm run ntl:quick-pass:runtime-ready`.',
      ]
    : [
        'Review rootCwdCandidates and ownership before terminating anything.',
        `To execute, set PLAYWRIGHT_MCP_CLEANUP_PIDS=<comma-separated-pids> and PLAYWRIGHT_MCP_CLEANUP_CONFIRM=${expectedConfirmToken}.`,
      ],
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`${JSON.stringify({ ...summary, outputPath }, null, 2)}\n`);

if (missingConfirm || invalidPids.length > 0) {
  process.exitCode = 1;
}
