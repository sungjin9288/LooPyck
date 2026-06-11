import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function rel(filePath) {
  return path.relative(process.cwd(), filePath) || '.';
}

function readTextIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}

function extractLiveProbeError(markdown) {
  if (!markdown) return 'unknown built-in MCP failure';
  if (markdown.includes('`browser_navigate`: succeeded')) return null;
  const fenced = markdown.match(/```text\n([\s\S]*?)\n```/);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  const fallback = markdown.match(/Error:\s+([^\n]+)/);
  return fallback?.[1]?.trim() ?? 'unknown built-in MCP failure';
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-runtime-handoff.md');

const doctorPath = path.join(outputDir, 'playwright-mcp-doctor.json');
const localVerifyPath = path.join(outputDir, 'playwright-mcp-local-verify.json');
const healthPath = path.join(outputDir, 'playwright-mcp-health.json');
const recoveryPath = path.join(outputDir, 'playwright-quick-pass-recovery.json');
const liveProbePath = path.join(outputDir, 'playwright-mcp-live-probe.md');

const doctor = readJsonIfExists(doctorPath);
const localVerify = readJsonIfExists(localVerifyPath);
const health = readJsonIfExists(healthPath);
const recovery = readJsonIfExists(recoveryPath);
const liveProbe = readTextIfExists(liveProbePath);
const liveProbeError = extractLiveProbeError(liveProbe);
const liveProbeSucceeded = liveProbeError === null;
const suggestsProfileLock = liveProbeError?.includes('Browser is already in use') ?? false;
const suggestedFixLine = suggestsProfileLock
  ? '- If the built-in server shares a persistent profile, launch it with an isolated browser/user-data-dir per workspace or per session.'
  : '- If launch `cwd` cannot be guaranteed, inject `--output-dir` to a writable workspace-scoped location.';
const problemLine = liveProbeSucceeded
  ? '- Built-in `mcp__playwright__` live navigation now succeeds, but process-level doctor still reports runtime risk.'
  : `- Built-in \`mcp__playwright__\` still fails in fresh sessions. Current live probe error: \`${liveProbeError}\`.`;
const reproObservation = liveProbeSucceeded
  ? '2. Observe successful navigation, then run `npm run ntl:quick-pass:health` and confirm the doctor still reports runtime risk.'
  : `2. Observe failure: \`${liveProbeError}\`.`;

const lines = [
  '# Playwright MCP Runtime Handoff',
  '',
  `Date: ${new Date().toISOString()}`,
  `Workspace: ${workspace}`,
  '',
  '## Current status',
  '',
  `- Built-in Playwright MCP: ${doctor?.status ?? 'unknown'}`,
  `- Repo-local Playwright MCP fallback: ${localVerify?.status ?? 'unknown'}`,
  `- Overall health: ${health?.status ?? 'unknown'}`,
  '',
  '## Problem',
  '',
  problemLine,
  '- Repo-local fallback via `.mcp.json` and `@playwright/mcp --output-dir ./output/playwright/mcp` is healthy.',
  '- New session attach has not switched the built-in tool surface to the repo-local override.',
  '',
  '## Expected',
  '',
  '- Either the built-in Playwright MCP should inherit the workspace `cwd`.',
  '- Or it should honor a workspace/output-dir override so output stays under the repo.',
  '',
  '## Observed evidence',
  '',
  `- doctor artifact: \`${rel(doctorPath)}\``,
  `- local verify artifact: \`${rel(localVerifyPath)}\``,
  `- health artifact: \`${rel(healthPath)}\``,
  `- recovery artifact: \`${rel(recoveryPath)}\``,
  `- live probe artifact: \`${rel(liveProbePath)}\``,
  '',
  '## Repro',
  '',
  '1. In a fresh Codex session, call a built-in Playwright MCP tool such as `mcp__playwright__.browser_resize` or `mcp__playwright__.browser_navigate`.',
  reproObservation,
  "3. Run `npm run ntl:quick-pass:health` to confirm repo-local fallback is still `fallback-ready`.",
  '',
  '## Verified repo-local workaround',
  '',
  '- `.mcp.json` defines `playwright-local` with workspace `cwd`.',
  '- `npm run ntl:quick-pass:mcp-local:verify` confirms spawned local MCP process uses repo root as `cwd`.',
  '- `npm run ntl:quick-pass:recovery` confirms quick-pass operational stance is `fallback-ready`.',
  '',
  '## Suggested runtime investigation',
  '',
  '- Check how the built-in Playwright MCP server is launched in Codex desktop.',
  '- Confirm whether workspace `.mcp.json` is loaded for built-in tool surfaces or only for app-level MCP discovery.',
  '- If built-in Playwright MCP is special-cased, force its `cwd` to the active workspace instead of `/`.',
  suggestedFixLine,
];

if (doctor) {
  lines.push('', '## Doctor summary', '', '```json', JSON.stringify({
    status: doctor.status,
    processCount: doctor.processCount,
    workspaceProcessCount: doctor.workspaceProcessCount,
    rootCwdProcessCount: doctor.rootCwdProcessCount,
    rootOutputDirExists: doctor.rootOutputDirExists,
    rootDirectoryWritable: doctor.rootDirectoryWritable,
    rootCwdProcesses: doctor.processes
      ?.filter((process) => process.usesRootCwd)
      .map(({ pid, ppid, elapsed, stat, command, cwd }) => ({ pid, ppid, elapsed, stat, command, cwd })) ?? [],
    workspaceProcesses: doctor.processes
      ?.filter((process) => process.cwd === workspace)
      .map(({ pid, ppid, elapsed, stat, command, cwd }) => ({ pid, ppid, elapsed, stat, command, cwd })) ?? [],
  }, null, 2), '```');
}

if (localVerify) {
  lines.push('', '## Local verify summary', '', '```json', JSON.stringify({
    status: localVerify.status,
    processCount: localVerify.processCount,
    expectation: localVerify.expectation,
    processes: localVerify.processes,
  }, null, 2), '```');
}

if (health) {
  lines.push('', '## Health summary', '', '```json', JSON.stringify({
    status: health.status,
    recommendation: health.recommendation,
  }, null, 2), '```');
}

if (recovery) {
  lines.push('', '## Recovery summary', '', '```json', JSON.stringify({
    status: recovery.status,
    closeAll: recovery.closeAll,
    doctor: recovery.doctor,
    localVerify: recovery.localVerify,
    health: recovery.health,
  }, null, 2), '```');
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${lines.join('\n')}\n`);
process.stdout.write(`${outputPath}\n`);
