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
  applyCommand: path.join(artifactDir, 'compare-entry-manual-node-apply-command.json'),
  cockpit: path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.json'),
  evidence: path.join(artifactDir, 'compare-entry-manual-node-evidence.json'),
  gate: path.join(artifactDir, 'compare-entry-review-gate.json'),
  slicePacket: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.json'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-manual-node-apply-command-readiness.md'),
  json: path.join(artifactDir, 'compare-entry-manual-node-apply-command-readiness.json'),
};

const expected = {
  fileKey: 'Oj35jzmgbwnxzpTTqTcxLi',
  surface: 'Brand-Musinsa',
  route: '/brand/musinsa',
  frame: 'CompareEntry/Mobile/Brand-Musinsa',
  section: 'TopNav/Context',
};

async function readJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function includesText(values, pattern) {
  return Array.isArray(values) && values.some((value) => pattern.test(String(value)));
}

function pushFailure(failures, condition, message) {
  if (!condition) failures.push(message);
}

function formatList(items, emptyState = 'none') {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [applyCommand, cockpit, evidence, gate, slicePacket] = await Promise.all([
    readJson(inputPaths.applyCommand),
    readJson(inputPaths.cockpit),
    readJson(inputPaths.evidence),
    readJson(inputPaths.gate),
    readJson(inputPaths.slicePacket),
  ]);

  const missingInputs = Object.entries({
    applyCommand,
    cockpit,
    evidence,
    gate,
    slicePacket,
  })
    .filter(([, value]) => !value)
    .map(([name]) => name);

  const command = applyCommand?.command ?? '';
  const requiredChecks = applyCommand?.requiredBeforeRunning ?? [];
  const currentEvidence = applyCommand?.currentEvidence ?? {};
  const target = applyCommand?.target ?? {};
  const observed = evidence?.observed ?? {};
  const evidenceReady = Boolean(evidence?.readyForWorksheetCheck);
  const commandStatusAllowed = new Set([
    'waiting-for-manual-figma-node-urls',
    'ready-evidence-present',
    'review-current-gate',
  ]);
  const expectedTargetLabel = `${expected.surface} -> ${expected.frame} -> ${expected.section}`;

  const failures = [];
  pushFailure(failures, missingInputs.length === 0, `Missing input artifacts: ${missingInputs.join(', ')}`);
  pushFailure(failures, commandStatusAllowed.has(applyCommand?.status), 'Apply command status is not actionable.');
  pushFailure(failures, applyCommand?.targetLabel === expectedTargetLabel, 'Apply command target label is stale.');
  pushFailure(failures, cockpit?.targetLabel === expectedTargetLabel, 'Cockpit target label is stale.');
  pushFailure(failures, target.surface === expected.surface, 'Target surface mismatch.');
  pushFailure(failures, target.route === expected.route, 'Target route mismatch.');
  pushFailure(failures, target.frame === expected.frame, 'Target frame mismatch.');
  pushFailure(failures, target.section === expected.section, 'Target section mismatch.');
  pushFailure(failures, slicePacket?.figmaFileKey === expected.fileKey, 'Slice packet Figma file key mismatch.');
  pushFailure(failures, applyCommand?.fileKey === expected.fileKey, 'Apply command Figma file key mismatch.');
  pushFailure(failures, command.includes('npm run ntl:compare-entry-manual-node-apply --'), 'Apply command runner missing.');
  pushFailure(failures, command.includes(expected.fileKey), 'Apply command does not point to the expected Figma file.');
  pushFailure(failures, command.includes('FRAME-NODE-ID'), 'Frame node placeholder missing.');
  pushFailure(failures, command.includes('SECTION-NODE-ID'), 'Section node placeholder missing.');
  pushFailure(failures, command.includes('CONTRACT_VERIFIED'), 'CONTRACT_VERIFIED guard missing.');
  pushFailure(failures, cockpit?.command === command, 'Cockpit command differs from apply command packet.');
  pushFailure(
    failures,
    includesText(requiredChecks, /Frame name exactly matches CompareEntry\/Mobile\/Brand-Musinsa/),
    'Required frame-name check missing.',
  );
  pushFailure(
    failures,
    includesText(requiredChecks, /Section name exactly matches TopNav\/Context/),
    'Required section-name check missing.',
  );
  pushFailure(
    failures,
    includesText(requiredChecks, /Visual slice matches/),
    'Required visual-match check missing.',
  );
  pushFailure(
    failures,
    includesText(requiredChecks, /not from an unverified raw capture/),
    'Raw-capture exclusion check missing.',
  );

  if (evidenceReady) {
    pushFailure(failures, Boolean(observed.frameId), 'Ready evidence is missing frameId.');
    pushFailure(failures, Boolean(observed.sectionId), 'Ready evidence is missing sectionId.');
  } else if (applyCommand?.status === 'waiting-for-manual-figma-node-urls') {
    pushFailure(
      failures,
      gate?.activeBlocker?.kind === 'figma-mcp-rate-limit',
      'Pending evidence must remain tied to the figma-mcp-rate-limit blocker.',
    );
    pushFailure(failures, !currentEvidence.frameId, 'Pending apply command already has a frameId.');
    pushFailure(failures, !currentEvidence.sectionId, 'Pending apply command already has a sectionId.');
  }

  pushFailure(
    failures,
    !Array.isArray(observed.urlValidationFailures) || observed.urlValidationFailures.length === 0,
    'Manual node evidence has URL validation failures.',
  );

  const readinessState = failures.length === 0
    ? evidenceReady
      ? 'READY_FOR_WORKSHEET_APPLY'
      : applyCommand?.status === 'waiting-for-manual-figma-node-urls'
        ? 'READY_FOR_MANUAL_NODE_URLS'
        : 'REVIEW_GATE_NOT_WAITING_FOR_MANUAL_NODE_URLS'
    : 'BLOCKED';
  const summary = {
    generatedAt: new Date().toISOString(),
    ok: failures.length === 0,
    readinessState,
    expected,
    targetLabel: applyCommand?.targetLabel ?? null,
    commandStatus: applyCommand?.status ?? null,
    gateState: gate?.gateState ?? null,
    activeBlocker: gate?.activeBlocker ?? null,
    evidence: {
      status: evidence?.status ?? null,
      readyForWorksheetCheck: evidenceReady,
      frameId: observed.frameId ?? null,
      sectionId: observed.sectionId ?? null,
      urlValidationFailures: observed.urlValidationFailures ?? [],
    },
    failures,
    inputs: inputPaths,
    outputs: outputPaths,
  };

  await writeFile(outputPaths.json, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  const markdown = `# Compare Entry Manual Node Apply Command Readiness

## Summary

- generatedAt: \`${summary.generatedAt}\`
- ok: \`${summary.ok}\`
- readinessState: \`${summary.readinessState}\`
- target: \`${summary.targetLabel ?? 'unknown'}\`
- commandStatus: \`${summary.commandStatus ?? 'unknown'}\`
- gateState: \`${summary.gateState ?? 'unknown'}\`
- activeBlocker: \`${summary.activeBlocker?.kind ?? 'none'}\`
- evidenceReadyForWorksheetCheck: \`${summary.evidence.readyForWorksheetCheck}\`
- frameId: \`${summary.evidence.frameId ?? 'none'}\`
- sectionId: \`${summary.evidence.sectionId ?? 'none'}\`

## Failures

${formatList(summary.failures)}

## Expected Target

- fileKey: \`${summary.expected.fileKey}\`
- surface: \`${summary.expected.surface}\`
- route: \`${summary.expected.route}\`
- frame: \`${summary.expected.frame}\`
- section: \`${summary.expected.section}\`
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: summary.ok,
        readinessState: summary.readinessState,
        failures: summary.failures,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
      },
      null,
      2,
    )}\n`,
  );

  if (!summary.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
