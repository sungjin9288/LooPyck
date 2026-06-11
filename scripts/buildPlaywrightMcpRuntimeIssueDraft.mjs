import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function readJsonIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return JSON.parse(readFileSync(filePath, 'utf8'));
}

function readTextIfExists(filePath) {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, 'utf8');
}

function extractLiveProbeError(markdown) {
  if (!markdown) return "unknown built-in MCP failure";
  if (markdown.includes('`browser_navigate`: succeeded')) return null;
  const fenced = markdown.match(/```text\n([\s\S]*?)\n```/);
  if (fenced?.[1]?.trim()) return fenced[1].trim();
  const fallback = markdown.match(/Error:\s+([^\n]+)/);
  return fallback?.[1]?.trim() ?? "unknown built-in MCP failure";
}

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-runtime-issue-draft.md');

const health = readJsonIfExists(path.join(outputDir, 'playwright-mcp-health.json'));
const doctor = readJsonIfExists(path.join(outputDir, 'playwright-mcp-doctor.json'));
const localVerify = readJsonIfExists(path.join(outputDir, 'playwright-mcp-local-verify.json'));
const liveProbe = readTextIfExists(path.join(outputDir, 'playwright-mcp-live-probe.md'));

const liveProbeError = extractLiveProbeError(liveProbe);
const liveProbeSucceeded = liveProbeError === null;
const suggestsProfileLock = liveProbeError?.includes('Browser is already in use') ?? false;
const summaryLine = liveProbeSucceeded
  ? '- Built-in `mcp__playwright__` live navigation now succeeds in the latest session, but process-level doctor still reports runtime risk.'
  : `- Built-in \`mcp__playwright__\` still fails in fresh Codex sessions. Current live probe error: \`${liveProbeError}\`.`;

const lines = [
  '# Bug: Built-in Playwright MCP runtime state is not fully clean',
  '',
  '## Summary',
  '',
  summaryLine,
  '- Repo-local fallback via workspace `.mcp.json` and `@playwright/mcp --output-dir ./output/playwright/mcp` is healthy.',
  '- The unresolved issue is in the Codex desktop/runtime launch path for the built-in Playwright MCP, not in this repository.',
  '',
  '## Environment',
  '',
  `- Workspace: \`${workspace}\``,
  `- Overall status: \`${health?.status ?? 'unknown'}\``,
  '',
  '## Reproduction',
  '',
  '1. Open a fresh Codex desktop session in this workspace.',
  '2. Call a built-in Playwright MCP tool such as `mcp__playwright__.browser_resize` or `mcp__playwright__.browser_navigate`.',
  liveProbeSucceeded
    ? '3. Observe that live navigation succeeds, then run `npm run ntl:quick-pass:health` and inspect the process-level doctor result.'
    : '3. Observe the built-in MCP failure below.',
  '',
  '## Actual',
  '',
  liveProbeSucceeded
    ? '- Latest live probe: built-in navigation succeeded.'
    : '```text',
  ...(liveProbeSucceeded ? [] : [liveProbeError, '```']),
  '',
  '## Expected',
  '',
  '- Built-in Playwright MCP should launch with the active workspace as `cwd`.',
  '- It should use workspace-scoped writable runtime paths for output and browser state.',
  '',
  '## Repo-side evidence',
  '',
  `- doctor: \`output/playwright/playwright-mcp-doctor.json\` (${doctor?.status ?? 'unknown'})`,
  `- local verify: \`output/playwright/playwright-mcp-local-verify.json\` (${localVerify?.status ?? 'unknown'})`,
  `- health: \`output/playwright/playwright-mcp-health.json\` (${health?.status ?? 'unknown'})`,
  `- live probe: \`output/playwright/playwright-mcp-live-probe.md\``,
  `- full handoff: \`output/playwright/playwright-mcp-runtime-handoff.md\``,
  '',
  '## Key observations',
  '',
  `- Built-in doctor status: \`${doctor?.status ?? 'unknown'}\``,
  `- Built-in process count seen during doctor run: \`${doctor?.processCount ?? 'unknown'}\``,
  `- Root directory writable: \`${doctor?.rootDirectoryWritable ?? 'unknown'}\``,
  `- Repo-local fallback status: \`${localVerify?.status ?? 'unknown'}\``,
  `- Repo-local fallback expected cwd: \`${localVerify?.expectation ?? workspace}\``,
  '',
  '## Why this matters',
  '',
  '- Quick pass and recovery are operational because the repo-local fallback works.',
  liveProbeSucceeded
    ? '- But process-level health still reports risk, so the built-in path should not be treated as fully fixed until doctor status is clean.'
    : '- But the built-in MCP tool surface remains broken, so users still hit a false tooling failure unless they use the repo-local workaround.',
  '',
  '## Suggested fix areas',
  '',
  '- Force built-in Playwright MCP launch `cwd` to the active workspace instead of `/`.',
  '- Inject a writable workspace-scoped `--output-dir` for the built-in server.',
  suggestsProfileLock
    ? '- Avoid shared profile collisions by giving the built-in server an isolated browser/user-data-dir per session or workspace.'
    : '- Avoid fallback to root-scoped runtime paths when workspace overrides are not attached.',
  '- Confirm whether workspace `.mcp.json` should apply to the built-in tool surface; right now it does not appear to.',
];

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${lines.join('\n')}\n`);
process.stdout.write(`${outputPath}\n`);
