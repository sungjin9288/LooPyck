import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function readJson(filePath) {
  if (!existsSync(filePath)) {
    throw new Error(`Missing required artifact: ${filePath}`);
  }
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function runScript(scriptPath, envOverrides = {}) {
  execFileSync('node', [scriptPath], {
    cwd: process.cwd(),
    stdio: 'ignore',
    env: {
      ...process.env,
      ...envOverrides,
    },
  });
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'release-closeout-report.md');

const uatPath = path.join(outputDir, 'netlify-uat-summary.json');
const runtimeReadyPath = path.join(outputDir, 'playwright-mcp-runtime-ready.json');
const runtimeHealthPath = path.join(outputDir, 'playwright-mcp-health.json');
const runtimeCleanupPlanPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-plan.md');
const runtimeCleanupResultPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-result.json');
const runtimeCleanupExecutionPath = path.join(outputDir, 'playwright-mcp-runtime-cleanup-last-execution.json');

mkdirSync(outputDir, { recursive: true });

if (existsSync(runtimeCleanupResultPath)) {
  const previousCleanupResult = readJson(runtimeCleanupResultPath);
  const hasExecutionRecord = previousCleanupResult.mode === 'execute'
    && previousCleanupResult.killed?.length > 0;

  if (hasExecutionRecord) {
    writeFileSync(
      runtimeCleanupExecutionPath,
      `${JSON.stringify(previousCleanupResult, null, 2)}\n`,
    );
  }
}

runScript(path.join('scripts', 'buildPlaywrightMcpHealth.mjs'));
runScript(path.join('scripts', 'buildPlaywrightMcpRuntimeCleanupPlan.mjs'));
runScript(path.join('scripts', 'cleanupPlaywrightMcpRuntime.mjs'), {
  PLAYWRIGHT_MCP_CLEANUP_PIDS: '',
  PLAYWRIGHT_MCP_CLEANUP_CONFIRM: '',
});

const uat = readJson(uatPath);
const runtimeReady = readJson(runtimeReadyPath);
const runtimeHealth = readJson(runtimeHealthPath);
const cleanupResult = readJson(runtimeCleanupResultPath);
const cleanupPlanExists = existsSync(runtimeCleanupPlanPath);
const cleanupExecutionExists = existsSync(runtimeCleanupExecutionPath);
const cleanupExecution = cleanupExecutionExists ? readJson(runtimeCleanupExecutionPath) : null;
const cleanupRequestedPids = cleanupResult.requestedPids?.length > 0
  ? cleanupResult.requestedPids.join(', ')
  : 'none';
const cleanupKilledPids = cleanupResult.killed?.length > 0
  ? cleanupResult.killed.join(', ')
  : 'none';
const cleanupSkippedCount = cleanupResult.skipped?.length ?? 0;
const cleanupExecutionKilledPids = cleanupExecution?.killed?.length > 0
  ? cleanupExecution.killed.join(', ')
  : 'none';

const stepLines = (uat.steps ?? []).map((step) => {
  const icon = step.ok ? 'pass' : 'fail';
  return `- ${step.label}: ${icon} (exit ${step.exitCode}, ${step.durationMs}ms)`;
});

const lines = [
  '# Release Closeout Report',
  '',
  `Date: ${new Date().toISOString()}`,
  `Workspace: ${workspace}`,
  '',
  '## Overall',
  '',
  `- Netlify UAT: ${uat.ok ? 'pass' : 'fail'}`,
  `- Playwright MCP runtime closeout: ${runtimeReady.ok ? 'pass' : 'fail'}`,
  `- Runtime stance: ${runtimeReady.status}`,
  '',
  '## Netlify UAT',
  '',
  ...stepLines,
  '',
  `- Summary artifact: \`${path.relative(workspace, uatPath)}\``,
  '',
  '## Playwright MCP Runtime',
  '',
  `- Runtime closeout ok: ${runtimeReady.ok}`,
  `- Runtime status: ${runtimeReady.status}`,
  `- Recommendation: ${runtimeReady.recommendation}`,
  `- Doctor status: ${runtimeHealth.doctor?.status ?? 'unknown'}`,
  `- Workspace MCP processes: ${runtimeHealth.doctor?.workspaceProcessCount ?? 'unknown'}`,
  `- Root-cwd MCP processes: ${runtimeHealth.doctor?.rootCwdProcessCount ?? 'unknown'}`,
  `- Live probe: ${runtimeHealth.liveProbe?.status ?? 'unknown'} (${runtimeHealth.liveProbe?.navigation ?? 'unknown'})`,
  `- Runtime ready artifact: \`${path.relative(workspace, runtimeReadyPath)}\``,
  `- Runtime health artifact: \`${path.relative(workspace, runtimeHealthPath)}\``,
  `- Runtime packet: \`${path.relative(workspace, runtimeReady.artifacts.packet)}\``,
  cleanupPlanExists
    ? `- Runtime cleanup plan: \`${path.relative(workspace, runtimeCleanupPlanPath)}\``
    : '- Runtime cleanup plan: missing',
  `- Runtime cleanup result: \`${path.relative(workspace, runtimeCleanupResultPath)}\``,
  `- Runtime cleanup mode: ${cleanupResult.mode}`,
  `- Cleanup requested PIDs: ${cleanupRequestedPids}`,
  `- Cleanup killed PIDs: ${cleanupKilledPids}`,
  `- Cleanup skipped entries: ${cleanupSkippedCount}`,
  cleanupExecutionExists
    ? `- Last cleanup execution: \`${path.relative(workspace, runtimeCleanupExecutionPath)}\``
    : '- Last cleanup execution: none',
  `- Last cleanup killed PIDs: ${cleanupExecutionKilledPids}`,
  '',
  '## Operator meaning',
  '',
  '- If Netlify UAT is pass and runtime status is `fallback-ready`, release closeout is acceptable with repo-local Playwright MCP fallback.',
  '- If root-cwd MCP processes remain, inspect the cleanup plan before terminating anything.',
  '- Release report generation always refreshes cleanup result in dry-run mode; process termination still requires explicit cleanup env vars.',
  '- If cleanup was executed immediately before report generation, the last execution record is preserved separately for audit.',
  '- If runtime status becomes `fully-ok`, the built-in MCP layer is also healthy.',
  '- Any other runtime status should block closeout until investigated.',
];

writeFileSync(outputPath, `${lines.join('\n')}\n`);
process.stdout.write(`${outputPath}\n`);
