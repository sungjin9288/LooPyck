import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function runJsonScript(scriptPath) {
  const output = execFileSync('node', [scriptPath], {
    cwd: process.cwd(),
    encoding: 'utf8',
  });

  return JSON.parse(output);
}

function readTextIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}

function parseLiveProbe(markdown) {
  if (!markdown) {
    return {
      status: 'missing',
      navigation: 'unknown',
      artifactPath: null,
    };
  }

  const navigationSucceeded = markdown.includes('`browser_navigate`: succeeded');
  const navigationFailed = markdown.includes('`browser_navigate`: failed');
  const errorMatch = markdown.match(/```text\n([\s\S]*?)\n```/);

  return {
    status: navigationSucceeded ? 'ok' : navigationFailed ? 'failed' : 'unknown',
    navigation: navigationSucceeded ? 'succeeded' : navigationFailed ? 'failed' : 'unknown',
    error: errorMatch?.[1]?.trim() ?? null,
  };
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-health.json');
const liveProbePath = path.join(outputDir, 'playwright-mcp-live-probe.md');

const doctor = runJsonScript(path.join('scripts', 'playwrightMcpDoctor.mjs'));
const localVerify = runJsonScript(path.join('scripts', 'verifyPlaywrightMcpLocal.mjs'));
const liveProbe = parseLiveProbe(readTextIfExists(liveProbePath));

const hasHealthyFallback = localVerify.status === 'ok';
const hasHealthyDoctor = doctor.status === 'ok';
const hasWorkspaceDoctor = doctor.status === 'workspace-ok-global-root-risk';
const hasLiveNavigation = liveProbe.status === 'ok';

let status = 'needs-attention';
let recommendation = 'Investigate doctor/local verify mismatch before relying on Playwright MCP quick pass.';

if (hasHealthyDoctor && hasHealthyFallback) {
  status = 'fully-ok';
  recommendation = 'Built-in MCP and repo-local Playwright MCP are both healthy.';
} else if (hasWorkspaceDoctor && hasLiveNavigation && hasHealthyFallback) {
  status = 'fallback-ready';
  recommendation = 'Built-in MCP works for this workspace, but a global root-cwd process is still present; keep repo-local fallback ready until process doctor is fully clean.';
} else if (hasLiveNavigation && hasHealthyFallback) {
  status = 'fallback-ready';
  recommendation = 'Built-in MCP live navigation succeeded, but process doctor still reports risk; keep repo-local fallback ready until the runtime layer is clean.';
} else if (doctor.status === 'root-cwd-risk' && hasHealthyFallback) {
  status = 'fallback-ready';
  recommendation = 'Built-in MCP still has root-cwd risk, but repo-local Playwright MCP fallback is healthy.';
}

const summary = {
  generatedAt: new Date().toISOString(),
  workspace,
  status,
  recommendation,
  doctor: {
    status: doctor.status,
    processCount: doctor.processCount,
    workspaceProcessCount: doctor.workspaceProcessCount,
    rootCwdProcessCount: doctor.rootCwdProcessCount,
    rootOutputDirExists: doctor.rootOutputDirExists,
    rootDirectoryWritable: doctor.rootDirectoryWritable,
    outputPath: doctor.outputPath,
  },
  rootCwdProcesses: doctor.processes
    ?.filter((process) => process.usesRootCwd)
    .map(({ pid, ppid, elapsed, stat, command, cwd }) => ({ pid, ppid, elapsed, stat, command, cwd })) ?? [],
  workspaceProcesses: doctor.processes
    ?.filter((process) => process.cwd === workspace)
    .map(({ pid, ppid, elapsed, stat, command, cwd }) => ({ pid, ppid, elapsed, stat, command, cwd })) ?? [],
  localVerify: {
    status: localVerify.status,
    processCount: localVerify.processCount,
    expectation: localVerify.expectation,
    outputPath: localVerify.outputPath,
  },
  liveProbe: {
    ...liveProbe,
    artifactPath: liveProbePath,
  },
};

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, JSON.stringify(summary, null, 2));
process.stdout.write(`${JSON.stringify({ ...summary, outputPath }, null, 2)}\n`);
