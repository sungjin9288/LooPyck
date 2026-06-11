import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const workspace = process.cwd();
const outputDir = path.join(workspace, 'output', 'playwright');
const outputPath = path.join(outputDir, 'playwright-mcp-runtime-packet.md');

const artifactEntries = [
  {
    id: 'live-probe',
    path: path.join(outputDir, 'playwright-mcp-live-probe.md'),
    purpose: 'Fresh-session built-in MCP failure evidence',
  },
  {
    id: 'doctor',
    path: path.join(outputDir, 'playwright-mcp-doctor.json'),
    purpose: 'Built-in MCP process/cwd/root-writable diagnosis',
  },
  {
    id: 'local-verify',
    path: path.join(outputDir, 'playwright-mcp-local-verify.json'),
    purpose: 'Repo-local @playwright/mcp workspace-cwd verification',
  },
  {
    id: 'health',
    path: path.join(outputDir, 'playwright-mcp-health.json'),
    purpose: 'Built-in risk vs repo-local fallback readiness summary',
  },
  {
    id: 'recovery',
    path: path.join(outputDir, 'playwright-quick-pass-recovery.json'),
    purpose: 'One-shot quick-pass recovery flow summary',
  },
  {
    id: 'handoff',
    path: path.join(outputDir, 'playwright-mcp-runtime-handoff.md'),
    purpose: 'Long-form runtime handoff with repro and investigation notes',
  },
  {
    id: 'issue-draft',
    path: path.join(outputDir, 'playwright-mcp-runtime-issue-draft.md'),
    purpose: 'Short bug report draft for runtime escalation',
  },
];

const artifacts = artifactEntries.map((entry) => ({
  ...entry,
  exists: existsSync(entry.path),
  relativePath: path.relative(workspace, entry.path),
}));

const missing = artifacts.filter((artifact) => !artifact.exists);
const status = missing.length === 0 ? 'ready' : 'incomplete';

const lines = [
  '# Playwright MCP Runtime Packet',
  '',
  `Date: ${new Date().toISOString()}`,
  `Workspace: ${workspace}`,
  `Status: ${status}`,
  '',
  '## Purpose',
  '',
  '- This packet is the single entry point for escalating the built-in Playwright MCP runtime issue.',
  '- It links the fresh live failure, built-in diagnosis, repo-local fallback verification, and runtime-facing drafts.',
  '',
  '## Recommended reading order',
  '',
  '1. `playwright-mcp-runtime-issue-draft.md`',
  '2. `playwright-mcp-live-probe.md`',
  '3. `playwright-mcp-health.json`',
  '4. `playwright-mcp-runtime-handoff.md`',
  '',
  '## Artifacts',
  '',
  ...artifacts.flatMap((artifact) => [
    `- ${artifact.id}: \`${artifact.relativePath}\``,
    `  purpose: ${artifact.purpose}`,
    `  exists: ${artifact.exists ? 'yes' : 'no'}`,
  ]),
];

if (missing.length > 0) {
  lines.push('', '## Missing artifacts', '', ...missing.map((artifact) => `- \`${artifact.relativePath}\``));
} else {
  lines.push('', '## Ready state', '', '- All expected runtime escalation artifacts are present.');
}

mkdirSync(outputDir, { recursive: true });
writeFileSync(outputPath, `${lines.join('\n')}\n`);
process.stdout.write(`${outputPath}\n`);
