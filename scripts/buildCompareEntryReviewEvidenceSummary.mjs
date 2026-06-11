import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const inputPaths = {
  gateJson: path.join(artifactDir, 'compare-entry-review-gate.json'),
  artifactAuditJson: path.join(artifactDir, 'compare-entry-review-artifact-audit.json'),
  approvalBoardJson: path.join(artifactDir, 'compare-entry-approval-board.json'),
  latestHandoffJson: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.json'),
  archiveIndexJson: path.join(artifactDir, 'compare-entry-review-sessions', 'index.json'),
  readyCheckScript: path.join(rootDir, 'scripts', 'netlifyCompareEntryReviewReadyCheck.sh'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-evidence-summary.md'),
  json: path.join(artifactDir, 'compare-entry-review-evidence-summary.json'),
};

async function readOptionalJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function formatList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function buildPathStatus(filePath, present) {
  return {
    path: filePath,
    present: Boolean(present),
  };
}

function buildGateEvidence(gate, artifactAudit, approval, latestHandoff, archiveIndex) {
  const artifactAuditSummary = gate?.artifactAuditSummary ?? {
    state: artifactAudit?.auditState ?? 'PENDING',
    ready: artifactAudit?.auditState === 'READY',
    missingCount: Array.isArray(artifactAudit?.missing) ? artifactAudit.missing.length : null,
    activeBlockerMismatchCount: artifactAudit?.activeBlockerMismatchCount ?? null,
    activeBlockerFilesChecked: artifactAudit?.activeBlockerFilesChecked ?? null,
    activeBlockerFieldsChecked: artifactAudit?.activeBlockerFieldsChecked ?? [],
  };

  const activeBlocker = gate?.activeBlocker ?? approval?.activeBlocker ?? latestHandoff?.activeBlocker ?? null;
  const links = {
    gate: path.join(artifactDir, 'compare-entry-review-gate.md'),
    gateJson: inputPaths.gateJson,
    artifactAudit: path.join(artifactDir, 'compare-entry-review-artifact-audit.md'),
    artifactAuditJson: inputPaths.artifactAuditJson,
    approvalBoard: path.join(artifactDir, 'compare-entry-approval-board.html'),
    approvalBoardJson: inputPaths.approvalBoardJson,
    latestHandoff: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
    latestHandoffJson: inputPaths.latestHandoffJson,
    archiveIndex: path.join(artifactDir, 'compare-entry-review-sessions', 'index.html'),
    archiveIndexJson: inputPaths.archiveIndexJson,
    manualUiSlicePacket: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.md'),
    figmaCaptureReference: path.join(artifactDir, 'compare-entry-figma-capture-reference.md'),
    manualNodeEvidence: path.join(artifactDir, 'compare-entry-manual-node-evidence.md'),
    manualNodeApplyCommand: path.join(artifactDir, 'compare-entry-manual-node-apply-command.md'),
    manualNodeApplyCommandReadiness: path.join(
      artifactDir,
      'compare-entry-manual-node-apply-command-readiness.md',
    ),
    manualUnblockCockpit: path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.html'),
    figmaUnblockPlan: path.join(artifactDir, 'compare-entry-figma-unblock-plan.md'),
  };

  return {
    gateState: gate?.gateState ?? approval?.gateState ?? 'unknown',
    readyToUnblock: Boolean(gate?.readyToUnblock ?? approval?.readyToUnblock),
    recommendedState: gate?.recommendedState ?? approval?.recommendedState ?? 'unknown',
    build: gate?.build ?? approval?.build ?? null,
    review: gate?.review ?? approval?.review ?? null,
    decision: gate?.decision ?? approval?.decision ?? null,
    missing: Array.isArray(gate?.missing) ? gate.missing : [],
    nextActions: Array.isArray(gate?.nextActions) ? gate.nextActions : [],
    activeBlocker,
    artifactAuditSummary,
    links,
    handoff: {
      hasSession: Boolean(latestHandoff?.hasSession),
      session: latestHandoff?.session ?? null,
      currentRecommendedEntry: latestHandoff?.currentRecommendedEntry ?? null,
    },
    archive: {
      totalSessions: Array.isArray(archiveIndex?.sessions) ? archiveIndex.sessions.length : null,
      latestSessionId: archiveIndex?.sessions?.[0]?.sessionId ?? null,
      latestHandoffLinks: Array.isArray(archiveIndex?.latestHandoffLinks)
        ? archiveIndex.latestHandoffLinks
        : [],
    },
  };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [gate, artifactAudit, approval, latestHandoff, archiveIndex] = await Promise.all([
    readOptionalJson(inputPaths.gateJson),
    readOptionalJson(inputPaths.artifactAuditJson),
    readOptionalJson(inputPaths.approvalBoardJson),
    readOptionalJson(inputPaths.latestHandoffJson),
    readOptionalJson(inputPaths.archiveIndexJson),
  ]);

  const inputStatus = {
    gateJson: buildPathStatus(inputPaths.gateJson, gate),
    artifactAuditJson: buildPathStatus(inputPaths.artifactAuditJson, artifactAudit),
    approvalBoardJson: buildPathStatus(inputPaths.approvalBoardJson, approval),
    latestHandoffJson: buildPathStatus(inputPaths.latestHandoffJson, latestHandoff),
    archiveIndexJson: buildPathStatus(inputPaths.archiveIndexJson, archiveIndex),
  };
  const missingInputs = Object.entries(inputStatus)
    .filter(([, status]) => !status.present)
    .map(([name, status]) => `${name}: ${status.path}`);
  const evidence = buildGateEvidence(gate, artifactAudit, approval, latestHandoff, archiveIndex);
  const validationCommands = [
    {
      command: 'npm run ntl:compare-entry-review-finalize',
      expected: 'Refreshes the Compare Entry review artifact bundle and latest handoff/archive index.',
    },
    {
      command: 'npm run ntl:compare-entry-review-ready-check',
      expected: evidence.readyToUnblock
        ? 'Exits 0 when gateState is READY and artifact audit is clean.'
        : 'Exits 1 while gateState is BLOCKED; output should still show artifactAuditState READY when bundle integrity is clean.',
    },
    {
      command: 'npm run ntl:compare-entry-manual-node-apply-command-ready',
      expected:
        'Verifies the manual node apply command, cockpit, evidence, gate, and target metadata are synchronized before copied Figma node URLs are applied.',
    },
    {
      command:
        'node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --experimental-strip-types --experimental-specifier-resolution=node --test tests/compareEntryReviewPipeline.test.ts',
      expected: 'Verifies Compare Entry review pipeline contracts and generated evidence links.',
    },
  ];

  const summary = {
    generatedAt: new Date().toISOString(),
    ok: missingInputs.length === 0,
    evidenceState: missingInputs.length === 0 ? 'READY' : 'INCOMPLETE',
    inputStatus,
    missingInputs,
    ...evidence,
    validationCommands,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Evidence Summary

## Evidence State

- generatedAt: \`${summary.generatedAt}\`
- evidenceState: \`${summary.evidenceState}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- recommendedState: \`${summary.recommendedState}\`
- artifactAuditState: \`${summary.artifactAuditSummary.state}\`
- artifactAuditReady: \`${summary.artifactAuditSummary.ready ? 'true' : 'false'}\`
- activeBlockerMismatchCount: \`${summary.artifactAuditSummary.activeBlockerMismatchCount ?? 'unknown'}\`
- activeBlockerFilesChecked: \`${summary.artifactAuditSummary.activeBlockerFilesChecked ?? 'unknown'}\`

## Active Blocker

- kind: \`${summary.activeBlocker?.kind ?? 'unknown'}\`
- target: \`${summary.activeBlocker?.target ?? 'none'}\`
- latestStatus: \`${summary.activeBlocker?.latestStatus ?? 'none'}\`
- latestOperation: \`${summary.activeBlocker?.latestOperation ?? 'none'}\`
- latestTool: \`${summary.activeBlocker?.latestTool ?? 'none'}\`
- evidencePath: \`${summary.activeBlocker?.evidencePath ?? 'none'}\`
- nextAction: \`${summary.activeBlocker?.nextAction ?? 'Regenerate the review gate.'}\`

## Operator Links

- gate: \`${summary.links.gate}\`
- artifact audit: \`${summary.links.artifactAudit}\`
- approval board: \`${summary.links.approvalBoard}\`
- approval board json: \`${summary.links.approvalBoardJson}\`
- latest handoff: \`${summary.links.latestHandoff}\`
- latest handoff json: \`${summary.links.latestHandoffJson}\`
- archive index: \`${summary.links.archiveIndex}\`
- archive index json: \`${summary.links.archiveIndexJson}\`
- manual UI slice packet: \`${summary.links.manualUiSlicePacket}\`
- Figma capture reference: \`${summary.links.figmaCaptureReference}\`
- manual node evidence: \`${summary.links.manualNodeEvidence}\`
- manual node apply command: \`${summary.links.manualNodeApplyCommand}\`
- manual node apply command readiness: \`${summary.links.manualNodeApplyCommandReadiness}\`
- manual unblock cockpit: \`${summary.links.manualUnblockCockpit}\`
- Figma unblock plan: \`${summary.links.figmaUnblockPlan}\`

## Handoff Snapshot

- hasSession: \`${summary.handoff.hasSession ? 'true' : 'false'}\`
- sessionId: \`${summary.handoff.session?.sessionId ?? 'none'}\`
- recommendedNextSurface: \`${summary.handoff.currentRecommendedEntry?.recommendedNextSurface ?? 'none'}\`
- recommendedNextFrame: \`${summary.handoff.currentRecommendedEntry?.recommendedNextFrame ?? 'none'}\`
- recommendedNextSection: \`${summary.handoff.currentRecommendedEntry?.recommendedNextSection ?? 'none'}\`
- archiveTotalSessions: \`${summary.archive.totalSessions ?? 'unknown'}\`
- archiveLatestSessionId: \`${summary.archive.latestSessionId ?? 'none'}\`

## Missing Inputs

${formatList(summary.missingInputs, 'none')}

## Validation Commands

${summary.validationCommands.map((entry) => `- \`${entry.command}\` - ${entry.expected}`).join('\n')}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: summary.ok,
        evidenceState: summary.evidenceState,
        gateState: summary.gateState,
        readyToUnblock: summary.readyToUnblock,
        artifactAuditState: summary.artifactAuditSummary.state,
        activeBlocker: summary.activeBlocker?.kind ?? 'unknown',
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        missingInputs: summary.missingInputs.length,
      },
      null,
      2,
    ) + '\n',
  );

  if (!summary.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
