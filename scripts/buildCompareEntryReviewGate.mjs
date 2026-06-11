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
  statusJson: path.join(artifactDir, 'compare-entry-review-status.json'),
  closeoutJson: path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
  artifactAuditJson: path.join(artifactDir, 'compare-entry-review-artifact-audit.json'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-gate.md'),
  json: path.join(artifactDir, 'compare-entry-review-gate.json'),
};

function formatList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function buildTargetLabel(target) {
  if (!target) return null;
  return [target.surface, target.frame, target.section].filter(Boolean).join(' -> ') || null;
}

function buildActiveBlocker({
  readyToUnblock,
  artifactAuditState,
  artifactAuditReady,
  closeout,
  missing,
  nextActions,
}) {
  if (readyToUnblock) {
    return {
      kind: 'none',
      summary: 'No active blocker. SUN-10 can unblock SUN-11 / SUN-12.',
      target: null,
      latestStatus: null,
      latestOperation: null,
      latestTool: null,
      evidencePath: null,
      nextAction: 'Proceed with SUN-11 / SUN-12 handoff.',
    };
  }

  if (artifactAuditState !== 'PENDING' && !artifactAuditReady) {
    return {
      kind: 'artifact-audit',
      summary: 'Artifact bundle integrity is broken, so SUN-10 must stay blocked even if review content is ready.',
      target: null,
      latestStatus: artifactAuditState,
      latestOperation: 'artifact-audit',
      latestTool: 'scripts/buildCompareEntryReviewArtifactAudit.mjs',
      evidencePath: 'compare-entry-review-artifact-audit.md',
      nextAction: 'Restore the missing review artifacts, then rerun npm run ntl:compare-entry-review-ready-check.',
    };
  }

  const figmaRetryPacket = closeout?.figmaRetryPacket ?? null;
  const attemptHistory = figmaRetryPacket?.mcpAttemptHistory ?? null;
  const latestStatus = attemptHistory?.latestStatus ?? null;
  const latestOperation = attemptHistory?.latestOperation ?? null;
  const latestTool = attemptHistory?.latestTool ?? null;
  const targetLabel = buildTargetLabel(figmaRetryPacket?.target);

  if (figmaRetryPacket?.retryReady) {
    const rateLimited = latestStatus === 'rate-limited';
    return {
      kind: rateLimited ? 'figma-mcp-rate-limit' : 'figma-mcp-retry-ready',
      summary: rateLimited
        ? 'Figma MCP is rate-limited for the current retry-ready slice. Worksheet must remain unchecked until a real Figma node is created.'
        : 'Figma retry packet is ready, but SUN-10 remains blocked until the retry produces a real Figma frameId and sectionId.',
      target: targetLabel,
      latestStatus,
      latestOperation,
      latestTool,
      evidencePath: figmaRetryPacket.markdownPath ?? attemptHistory?.markdownPath ?? null,
      nextAction: 'Retry the Figma template when MCP quota is available, then check only the created slice and rerun the ready-check.',
    };
  }

  return {
    kind: 'review-readiness',
    summary: 'SUN-10 build/review inputs are incomplete, so the review gate remains blocked.',
    target:
      [closeout?.recommendedNextSurface, closeout?.recommendedNextFrame, closeout?.recommendedNextSection]
        .filter(Boolean)
        .join(' -> ') || null,
    latestStatus: null,
    latestOperation: null,
    latestTool: null,
    evidencePath: closeout?.recommendedNextSectionActionCardPath ?? null,
    nextAction: nextActions[0] ?? missing[0] ?? 'Complete the next pending review input and rerun the ready-check.',
  };
}

function buildArtifactAuditSummary(artifactAudit, artifactAuditState, artifactAuditReady) {
  return {
    state: artifactAuditState,
    ready: artifactAuditReady,
    missingCount: Array.isArray(artifactAudit?.missing) ? artifactAudit.missing.length : null,
    activeBlockerMismatchCount: Number.isFinite(Number(artifactAudit?.activeBlockerMismatchCount))
      ? Number(artifactAudit.activeBlockerMismatchCount)
      : null,
    activeBlockerFilesChecked: Number.isFinite(Number(artifactAudit?.activeBlockerFilesChecked))
      ? Number(artifactAudit.activeBlockerFilesChecked)
      : null,
    activeBlockerFieldsChecked: Array.isArray(artifactAudit?.activeBlockerFieldsChecked)
      ? artifactAudit.activeBlockerFieldsChecked
      : [],
  };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [statusRaw, closeoutRaw] = await Promise.all([
    readFile(inputPaths.statusJson, 'utf8'),
    readFile(inputPaths.closeoutJson, 'utf8'),
  ]);

  const status = JSON.parse(statusRaw);
  const closeout = JSON.parse(closeoutRaw);
  let artifactAudit = null;
  try {
    artifactAudit = JSON.parse(await readFile(inputPaths.artifactAuditJson, 'utf8'));
  } catch {
    artifactAudit = null;
  }
  const strict = process.argv.includes('--strict');
  const artifactAuditState = artifactAudit?.auditState ?? 'PENDING';
  const artifactAuditReady = artifactAuditState === 'READY';
  const artifactAuditSummary = buildArtifactAuditSummary(artifactAudit, artifactAuditState, artifactAuditReady);
  const readyToUnblock = Boolean(status.readyToUnblock) && (artifactAudit ? artifactAuditReady : true);
  const gateState = readyToUnblock ? 'READY' : 'BLOCKED';
  const nextState = readyToUnblock ? 'unblock SUN-11 / SUN-12' : 'keep SUN-10 blocked';
  const missing = [
    ...(Array.isArray(closeout.missing) ? closeout.missing : []),
    ...(artifactAudit && !artifactAuditReady ? ['artifact audit is broken'] : []),
  ];
  const nextActions = [
    ...(Array.isArray(closeout.nextActions) ? closeout.nextActions : []),
    ...(artifactAudit && !artifactAuditReady && Array.isArray(artifactAudit.nextActions) ? artifactAudit.nextActions : []),
  ];
  const activeBlocker = buildActiveBlocker({
    readyToUnblock,
    artifactAuditState,
    artifactAuditReady,
    closeout,
    missing,
    nextActions,
  });

  const gate = {
    generatedAt: new Date().toISOString(),
    strict,
    gateState,
    readyToUnblock,
    nextState,
    recommendedState: closeout.recommendedState ?? null,
    build: status.build ?? null,
    review: status.review ?? null,
    decision: status.decision ?? null,
    artifactAuditState,
    artifactAuditReady,
    artifactAuditSummary,
    activeBlocker,
    missing,
    nextActions,
  };

  await writeFile(outputPaths.json, JSON.stringify(gate, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Gate

## Gate Result

- generatedAt: \`${gate.generatedAt}\`
- strict: \`${strict ? 'true' : 'false'}\`
- gateState: \`${gateState}\`
- readyToUnblock: \`${readyToUnblock ? 'true' : 'false'}\`
- nextState: \`${nextState}\`
- recommendedState: \`${gate.recommendedState ?? 'unknown'}\`
- build completion: \`${gate.build?.checked ?? 0}/${gate.build?.total ?? 0}\`
- review completion: \`${gate.review?.checked ?? 0}/${gate.review?.total ?? 0}\`
- decision outcome: \`${gate.decision?.outcome ?? 'unselected'}\`
- decision unblocks: \`${gate.decision?.unblocks ?? 'unselected'}\`
- reviewer confidence: \`${gate.decision?.confidence ?? 'unselected'}\`
- artifact audit: \`${gate.artifactAuditState}\`

## Artifact Audit Summary

- state: \`${gate.artifactAuditSummary.state}\`
- ready: \`${gate.artifactAuditSummary.ready ? 'true' : 'false'}\`
- missingCount: \`${gate.artifactAuditSummary.missingCount ?? 'unknown'}\`
- activeBlockerMismatchCount: \`${gate.artifactAuditSummary.activeBlockerMismatchCount ?? 'unknown'}\`
- activeBlockerFilesChecked: \`${gate.artifactAuditSummary.activeBlockerFilesChecked ?? 'unknown'}\`
- activeBlockerFieldsChecked: \`${gate.artifactAuditSummary.activeBlockerFieldsChecked.join(', ') || 'none'}\`

## Active Blocker

- kind: \`${gate.activeBlocker.kind}\`
- summary: \`${gate.activeBlocker.summary}\`
- target: \`${gate.activeBlocker.target ?? 'none'}\`
- latestStatus: \`${gate.activeBlocker.latestStatus ?? 'none'}\`
- latestOperation: \`${gate.activeBlocker.latestOperation ?? 'none'}\`
- latestTool: \`${gate.activeBlocker.latestTool ?? 'none'}\`
- evidencePath: \`${gate.activeBlocker.evidencePath ?? 'none'}\`
- nextAction: \`${gate.activeBlocker.nextAction}\`

## Missing Gate Inputs

${formatList(gate.missing, 'none')}

## Next Actions

${formatList(gate.nextActions, 'none')}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        strict,
        gateState,
        readyToUnblock,
        activeBlocker: gate.activeBlocker.kind,
        artifactAuditState: gate.artifactAuditSummary.state,
        activeBlockerMismatchCount: gate.artifactAuditSummary.activeBlockerMismatchCount,
        activeBlockerFilesChecked: gate.artifactAuditSummary.activeBlockerFilesChecked,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        missing: gate.missing.length,
      },
      null,
      2,
    ) + '\n',
  );

  if (strict && !readyToUnblock) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
