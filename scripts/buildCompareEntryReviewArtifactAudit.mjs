import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeActiveBlocker } from './compareEntryActiveBlocker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const sessionsDir = path.join(artifactDir, 'compare-entry-review-sessions');
const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-artifact-audit.md'),
  json: path.join(artifactDir, 'compare-entry-review-artifact-audit.json'),
};

const requiredRootFiles = [
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
  'compare-entry-review-next-frame-packet.html',
  'compare-entry-review-next-frame-packet.md',
  'compare-entry-review-next-frame-packet.json',
  'compare-entry-review-next-section-packet.html',
  'compare-entry-review-next-section-packet.md',
  'compare-entry-review-next-section-packet.json',
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
  'compare-entry-figma-mcp-attempt.md',
  'compare-entry-figma-mcp-attempt.json',
  'compare-entry-figma-mcp-attempt-history.md',
  'compare-entry-figma-mcp-attempt-history.json',
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
  'compare-entry-linear-update-draft.md',
  'compare-entry-linear-update-draft.txt',
  'compare-entry-linear-update-draft.json',
  'compare-entry-approval-board.html',
  'compare-entry-approval-board.json',
  path.join('compare-entry-review-sessions', 'index.html'),
  path.join('compare-entry-review-sessions', 'index.json'),
  path.join('compare-entry-review-sessions', 'latest-handoff.md'),
  path.join('compare-entry-review-sessions', 'latest-handoff.html'),
  path.join('compare-entry-review-sessions', 'latest-handoff.json'),
];

const requiredSessionFiles = [
  'manifest.json',
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
  'compare-entry-review-next-frame-packet.html',
  'compare-entry-review-next-frame-packet.md',
  'compare-entry-review-next-frame-packet.json',
  'compare-entry-review-next-section-packet.html',
  'compare-entry-review-next-section-packet.md',
  'compare-entry-review-next-section-packet.json',
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
  'compare-entry-figma-mcp-attempt.md',
  'compare-entry-figma-mcp-attempt.json',
  'compare-entry-figma-mcp-attempt-history.md',
  'compare-entry-figma-mcp-attempt-history.json',
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
  'compare-entry-linear-update-draft.md',
  'compare-entry-linear-update-draft.txt',
  'compare-entry-linear-update-draft.json',
  'compare-entry-approval-board.html',
  'compare-entry-approval-board.json',
];

const activeBlockerJsonFiles = [
  'compare-entry-review-gate.json',
  'compare-entry-review-focus-plan.json',
  'compare-entry-review-surface-status-board.json',
  'compare-entry-review-next-surface-packet.json',
  'compare-entry-review-next-frame-packet.json',
  'compare-entry-review-next-surface-section-packet.json',
  'compare-entry-review-next-surface-checklist.json',
  'compare-entry-review-next-section-action-card.json',
  'compare-entry-review-closeout-draft.json',
  'compare-entry-linear-update-draft.json',
  'compare-entry-approval-board.json',
];

const rootActiveBlockerJsonFiles = [
  ...activeBlockerJsonFiles,
  path.join('compare-entry-review-sessions', 'index.json'),
  path.join('compare-entry-review-sessions', 'latest-handoff.json'),
];

const activeBlockerComparableFields = [
  'kind',
  'target',
  'latestStatus',
  'latestOperation',
  'latestTool',
];

async function pathExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readJsonIfExists(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function buildActiveBlockerComparable(value) {
  const activeBlocker = normalizeActiveBlocker(value, { kind: 'missing' });
  return Object.fromEntries(
    activeBlockerComparableFields.map((field) => [field, activeBlocker[field] ?? null]),
  );
}

function extractActiveBlockerFromArtifact(json, fileName) {
  if (fileName.endsWith(path.join('compare-entry-review-sessions', 'index.json'))) {
    return Array.isArray(json?.sessions) ? json.sessions[0]?.activeBlocker : null;
  }
  return json?.activeBlocker;
}

function findActiveBlockerMismatches(scopeLabel, baseDir, fileNames = activeBlockerJsonFiles) {
  return Promise.all(
    fileNames.map(async (fileName) => {
      const filePath = path.join(baseDir, fileName);
      const json = await readJsonIfExists(filePath);
      if (!json) return null;
      return {
        fileName,
        filePath,
        activeBlocker: extractActiveBlockerFromArtifact(json, fileName),
      };
    }),
  ).then((entries) => {
    const availableEntries = entries.filter(Boolean);
    const gateEntry = availableEntries.find((entry) => entry.fileName === 'compare-entry-review-gate.json');
    if (!gateEntry?.activeBlocker) {
      return availableEntries.map((entry) => ({
        scope: scopeLabel,
        file: entry.filePath,
        field: 'activeBlocker',
        expected: 'compare-entry-review-gate.json activeBlocker',
        actual: entry.activeBlocker ? 'present without gate source' : 'missing',
      }));
    }

    const expected = buildActiveBlockerComparable(gateEntry.activeBlocker);
    const mismatches = [];

    for (const entry of availableEntries) {
      if (!entry.activeBlocker) {
        mismatches.push({
          scope: scopeLabel,
          file: entry.filePath,
          field: 'activeBlocker',
          expected: 'present',
          actual: 'missing',
        });
        continue;
      }

      const actual = buildActiveBlockerComparable(entry.activeBlocker);
      for (const field of activeBlockerComparableFields) {
        if (actual[field] === expected[field]) continue;
        mismatches.push({
          scope: scopeLabel,
          file: entry.filePath,
          field,
          expected: expected[field],
          actual: actual[field],
        });
      }
    }

    return mismatches;
  });
}

function formatList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

async function findLatestSessionManifest() {
  const entries = await readdir(sessionsDir, { withFileTypes: true });
  const sessionNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  for (const sessionName of sessionNames) {
    const sessionDir = path.join(sessionsDir, sessionName);
    const manifestPath = path.join(sessionDir, 'manifest.json');
    if (!(await pathExists(manifestPath))) continue;
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    return {
      sessionId: manifest.sessionId ?? sessionName,
      sessionDir,
      manifestPath,
      manifest,
    };
  }

  return null;
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  await mkdir(sessionsDir, { recursive: true });

  const missingRootFiles = [];
  for (const relativePath of requiredRootFiles) {
    const absolutePath = path.join(artifactDir, relativePath);
    if (!(await pathExists(absolutePath))) {
      missingRootFiles.push(absolutePath);
    }
  }

  const latestSession = await findLatestSessionManifest();
  const missingSessionFiles = [];
  const missingManifestEntries = [];
  let activeBlockerMismatches = await findActiveBlockerMismatches(
    'root',
    artifactDir,
    rootActiveBlockerJsonFiles,
  );

  if (latestSession) {
    for (const fileName of requiredSessionFiles) {
      const absolutePath = path.join(latestSession.sessionDir, fileName);
      if (!(await pathExists(absolutePath))) {
        missingSessionFiles.push(absolutePath);
      }
    }

    const manifestFileSet = new Set(Array.isArray(latestSession.manifest.files) ? latestSession.manifest.files : []);
    for (const fileName of requiredSessionFiles.filter((fileName) => fileName !== 'manifest.json')) {
      const absolutePath = path.join(latestSession.sessionDir, fileName);
      if (!manifestFileSet.has(absolutePath)) {
        missingManifestEntries.push(absolutePath);
      }
    }

    activeBlockerMismatches = [
      ...activeBlockerMismatches,
      ...(await findActiveBlockerMismatches('latest-session', latestSession.sessionDir)),
    ];
  }

  const missing = [
    ...missingRootFiles,
    ...missingSessionFiles,
    ...missingManifestEntries,
    ...activeBlockerMismatches.map(
      (mismatch) =>
        `${mismatch.scope}: ${mismatch.file} activeBlocker.${mismatch.field} expected ${mismatch.expected ?? 'none'} but found ${mismatch.actual ?? 'none'}`,
    ),
  ];
  const auditState = missing.length === 0 && latestSession ? 'READY' : 'BROKEN';
  const nextActions = [];

  if (!latestSession) {
    nextActions.push('Run `npm run ntl:compare-entry-review-finalize` once so a latest archived review session exists.');
  }
  if (missingRootFiles.length > 0) {
    nextActions.push('Re-run `npm run ntl:compare-entry-review-prep` or `npm run ntl:compare-entry-review-finalize` to rebuild missing root-level review artifacts.');
  }
  if (missingSessionFiles.length > 0 || missingManifestEntries.length > 0) {
    nextActions.push('Re-run `npm run ntl:compare-entry-review-finalize` so the latest session snapshot and manifest are regenerated consistently.');
  }
  if (activeBlockerMismatches.length > 0) {
    nextActions.push('Re-run `npm run ntl:compare-entry-review-finalize` so all activeBlocker-bearing review artifacts inherit the same gate blocker.');
  }
  if (!nextActions.length) {
    nextActions.push('Artifact bundle is complete. Manual reviewer can open latest-handoff and continue with Figma frame review.');
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    auditState,
    latestSessionId: latestSession?.sessionId ?? null,
    rootFilesChecked: requiredRootFiles.length,
    sessionFilesChecked: latestSession ? requiredSessionFiles.length : 0,
    activeBlockerFilesChecked:
      rootActiveBlockerJsonFiles.length + (latestSession ? activeBlockerJsonFiles.length : 0),
    activeBlockerFieldsChecked: activeBlockerComparableFields,
    activeBlockerMismatchCount: activeBlockerMismatches.length,
    missingRootFiles,
    missingSessionFiles,
    missingManifestEntries,
    activeBlockerMismatches,
    missing,
    nextActions,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Artifact Audit

## Summary

- generatedAt: \`${summary.generatedAt}\`
- auditState: \`${summary.auditState}\`
- latestSessionId: \`${summary.latestSessionId ?? 'missing'}\`
- rootFilesChecked: \`${summary.rootFilesChecked}\`
- sessionFilesChecked: \`${summary.sessionFilesChecked}\`
- activeBlockerFilesChecked: \`${summary.activeBlockerFilesChecked}\`
- activeBlockerFieldsChecked: \`${summary.activeBlockerFieldsChecked.join(', ')}\`
- activeBlockerMismatchCount: \`${summary.activeBlockerMismatchCount}\`
- missingCount: \`${summary.missing.length}\`

## Missing Root Files

${formatList(summary.missingRootFiles, 'none')}

## Missing Latest Session Files

${formatList(summary.missingSessionFiles, 'none')}

## Missing Manifest Entries

${formatList(summary.missingManifestEntries, 'none')}

## Active Blocker Mismatches

${formatList(
  summary.activeBlockerMismatches.map(
    (mismatch) =>
      `${mismatch.scope}: ${mismatch.file} activeBlocker.${mismatch.field} expected \`${mismatch.expected ?? 'none'}\` but found \`${mismatch.actual ?? 'none'}\``,
  ),
  'none',
)}

## Next Actions

${formatList(summary.nextActions, 'none')}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        auditState,
        latestSessionId: summary.latestSessionId,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        missing: summary.missing.length,
        activeBlockerMismatchCount: summary.activeBlockerMismatchCount,
      },
      null,
      2,
    ) + '\n',
  );

  if (auditState !== 'READY') {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
