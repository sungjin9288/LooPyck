import { access, copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');
const sessionsDir = path.join(artifactDir, 'compare-entry-review-sessions');
const surfaceSummaryPath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');

const filesToArchive = [
  'netlify-compare-entry-surface-reference.json',
  'compare-entry-design-review-packet.md',
  'compare-entry-design-review-worksheet.md',
  'compare-entry-design-review-decision-log.md',
  'compare-entry-design-review-board.html',
  'compare-entry-manual-figma-packet.html',
  'compare-entry-manual-frame-specs.md',
  'compare-entry-manual-build-worksheet.md',
  'compare-entry-review-status-board.html',
  'compare-entry-review-status.json',
  'compare-entry-review-missing-detail.md',
  'compare-entry-review-missing-detail.json',
  'compare-entry-review-focus-plan.md',
  'compare-entry-review-focus-plan.json',
  'compare-entry-review-frame-progress-board.html',
  'compare-entry-review-frame-progress-board.json',
  'compare-entry-review-section-progress-board.html',
  'compare-entry-review-section-progress-board.md',
  'compare-entry-review-section-progress-board.json',
  'compare-entry-review-surface-queue.html',
  'compare-entry-review-surface-queue.md',
  'compare-entry-review-surface-queue.json',
  'compare-entry-review-surface-status-board.html',
  'compare-entry-review-surface-status-board.md',
  'compare-entry-review-surface-status-board.json',
  'compare-entry-review-next-surface-packet.html',
  'compare-entry-review-next-surface-packet.md',
  'compare-entry-review-next-surface-packet.json',
  'compare-entry-review-next-surface-section-packet.html',
  'compare-entry-review-next-surface-section-packet.md',
  'compare-entry-review-next-surface-section-packet.json',
  'compare-entry-review-next-surface-checklist.html',
  'compare-entry-review-next-surface-checklist.md',
  'compare-entry-review-next-surface-checklist.json',
  'compare-entry-review-next-section-action-card.html',
  'compare-entry-review-next-section-action-card.md',
  'compare-entry-review-next-section-action-card.json',
  'compare-entry-review-next-frame-packet.html',
  'compare-entry-review-next-frame-packet.md',
  'compare-entry-review-next-frame-packet.json',
  'compare-entry-review-next-section-packet.html',
  'compare-entry-review-next-section-packet.md',
  'compare-entry-review-next-section-packet.json',
  'compare-entry-figma-mcp-attempt.md',
  'compare-entry-figma-mcp-attempt.json',
  'compare-entry-figma-mcp-attempt-history.md',
  'compare-entry-figma-mcp-attempt-history.json',
  'compare-entry-mobile-brand-topnav-preview.html',
  'compare-entry-mobile-brand-topnav-preview.json',
  'compare-entry-manual-ui-slice-packet.md',
  'compare-entry-manual-ui-slice-packet.json',
  'compare-entry-figma-capture-reference.md',
  'compare-entry-figma-capture-reference.json',
  'compare-entry-manual-node-evidence.md',
  'compare-entry-manual-node-evidence.json',
  'compare-entry-manual-node-apply-command.md',
  'compare-entry-manual-node-apply-command.json',
  'compare-entry-manual-unblock-cockpit.html',
  'compare-entry-manual-unblock-cockpit.md',
  'compare-entry-manual-unblock-cockpit.json',
  'compare-entry-manual-node-apply-command-readiness.md',
  'compare-entry-manual-node-apply-command-readiness.json',
  'compare-entry-figma-retry-packet.md',
  'compare-entry-figma-retry-packet.json',
  'compare-entry-figma-unblock-plan.md',
  'compare-entry-figma-unblock-plan.json',
  'compare-entry-review-closeout-draft.md',
  'compare-entry-review-closeout-draft.json',
  'compare-entry-review-gate.md',
  'compare-entry-review-gate.json',
  'compare-entry-review-delta.md',
  'compare-entry-review-delta.json',
  'compare-entry-review-artifact-audit.md',
  'compare-entry-review-artifact-audit.json',
  'compare-entry-linear-update-draft.md',
  'compare-entry-linear-update-draft.txt',
  'compare-entry-linear-update-draft.json',
  'compare-entry-approval-board.html',
  'compare-entry-approval-board.json',
];

function buildSessionId(isoLikeValue) {
  const base = typeof isoLikeValue === 'string' && isoLikeValue ? isoLikeValue : new Date().toISOString();
  return base.replaceAll(':', '').replaceAll('.', '-').replace('T', '-').replace('Z', '');
}

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const raw = await readFile(surfaceSummaryPath, 'utf8');
  const summary = JSON.parse(raw);
  const sessionId = buildSessionId(summary.generatedAt);
  const sessionDir = path.join(sessionsDir, sessionId);

  await mkdir(sessionDir, { recursive: true });

  const archivedFiles = [];
  for (const fileName of filesToArchive) {
    const sourcePath = path.join(artifactDir, fileName);
    if (!(await pathExists(sourcePath))) {
      continue;
    }
    const destinationPath = path.join(sessionDir, fileName);
    await copyFile(sourcePath, destinationPath);
    archivedFiles.push(destinationPath);
  }

  const manifestPath = path.join(sessionDir, 'manifest.json');
  const manifest = {
    sessionId,
    generatedAt: summary.generatedAt ?? null,
    baseUrl: summary.baseUrl ?? null,
    routes: summary.routes ?? {},
    query: summary.search?.query ?? null,
    displayedCount: summary.search?.displayedCount ?? null,
    files: archivedFiles,
  };

  await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        sessionId,
        sessionDir,
        manifestPath,
        filesArchived: archivedFiles.length,
      },
      null,
      2,
    ) + '\n',
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
