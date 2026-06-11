import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import test from 'node:test';

const rootDir = path.resolve(import.meta.dirname, '..');
const scriptDir = path.join(rootDir, 'scripts');

const scriptPaths = {
  status: path.join(scriptDir, 'buildCompareEntryReviewStatusBoard.mjs'),
  missingDetail: path.join(scriptDir, 'buildCompareEntryReviewMissingDetail.mjs'),
  focusPlan: path.join(scriptDir, 'buildCompareEntryReviewFocusPlan.mjs'),
  frameProgress: path.join(scriptDir, 'buildCompareEntryReviewFrameProgressBoard.mjs'),
  sectionProgress: path.join(scriptDir, 'buildCompareEntryReviewSectionProgressBoard.mjs'),
  surfaceQueue: path.join(scriptDir, 'buildCompareEntryReviewSurfaceQueue.mjs'),
  surfaceStatus: path.join(scriptDir, 'buildCompareEntryReviewSurfaceStatusBoard.mjs'),
  nextSurface: path.join(scriptDir, 'buildCompareEntryReviewNextSurfacePacket.mjs'),
  nextSurfaceSections: path.join(scriptDir, 'buildCompareEntryReviewNextSurfaceSectionPacket.mjs'),
  nextSurfaceChecklist: path.join(scriptDir, 'buildCompareEntryReviewNextSurfaceChecklist.mjs'),
  nextSectionAction: path.join(scriptDir, 'buildCompareEntryReviewNextSectionActionCard.mjs'),
  mobileBrandTopnavPreview: path.join(scriptDir, 'buildCompareEntryMobileBrandTopNavPreview.mjs'),
  manualUiSlicePacket: path.join(scriptDir, 'buildCompareEntryManualUiSlicePacket.mjs'),
  figmaCaptureReference: path.join(scriptDir, 'buildCompareEntryFigmaCaptureReference.mjs'),
  manualNodeEvidence: path.join(scriptDir, 'buildCompareEntryManualNodeEvidence.mjs'),
  manualNodeApplyCommand: path.join(scriptDir, 'buildCompareEntryManualNodeApplyCommand.mjs'),
  manualNodeApplyCommandReady: path.join(scriptDir, 'assertCompareEntryManualNodeApplyCommandReady.mjs'),
  manualUnblockCockpit: path.join(scriptDir, 'buildCompareEntryManualUnblockCockpit.mjs'),
  manualNodeApply: path.join(scriptDir, 'netlifyCompareEntryManualNodeApply.sh'),
  figmaMcpAttempt: path.join(scriptDir, 'buildCompareEntryFigmaMcpAttemptReport.mjs'),
  figmaRetryPacket: path.join(scriptDir, 'buildCompareEntryFigmaRetryPacket.mjs'),
  figmaUnblockPlan: path.join(scriptDir, 'buildCompareEntryFigmaUnblockPlan.mjs'),
  nextFrame: path.join(scriptDir, 'buildCompareEntryReviewNextFramePacket.mjs'),
  nextSection: path.join(scriptDir, 'buildCompareEntryReviewNextSectionPacket.mjs'),
  closeout: path.join(scriptDir, 'buildCompareEntryReviewCloseoutDraft.mjs'),
  gate: path.join(scriptDir, 'buildCompareEntryReviewGate.mjs'),
  delta: path.join(scriptDir, 'buildCompareEntryReviewDelta.mjs'),
  audit: path.join(scriptDir, 'buildCompareEntryReviewArtifactAudit.mjs'),
  evidence: path.join(scriptDir, 'buildCompareEntryReviewEvidenceSummary.mjs'),
  linear: path.join(scriptDir, 'buildCompareEntryLinearUpdateDraft.mjs'),
  approval: path.join(scriptDir, 'buildCompareEntryApprovalBoard.mjs'),
  finalize: path.join(scriptDir, 'netlifyCompareEntryReviewFinalize.sh'),
  readyCheck: path.join(scriptDir, 'netlifyCompareEntryReviewReadyCheck.sh'),
};

function runScript(
  scriptPath: string,
  artifactDir: string,
  args: string[] = [],
  expectedExitCode = 0,
) {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    cwd: rootDir,
    env: {
      ...process.env,
      COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
    },
    encoding: 'utf8',
  });

  assert.equal(
    result.status,
    expectedExitCode,
    `Unexpected exit code for ${path.basename(scriptPath)}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );

  return result;
}

function runShellScript(scriptPath: string, artifactDir: string, expectedExitCode = 0) {
  const result = spawnSync('bash', [scriptPath], {
    cwd: rootDir,
    env: {
      ...process.env,
      COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
    },
    encoding: 'utf8',
  });

  assert.equal(
    result.status,
    expectedExitCode,
    `Unexpected exit code for ${path.basename(scriptPath)}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
  );

  return result;
}

async function writeFixtureFiles(
  artifactDir: string,
  mode: 'blocked' | 'ready',
  options: {
    generatedAt?: string;
    displayedCount?: number;
    query?: string;
  } = {},
) {
  await mkdir(path.join(artifactDir, 'compare-entry-review-sessions'), { recursive: true });
  const generatedAt = options.generatedAt ?? '2026-03-27T00:00:00.000Z';
  const displayedCount = options.displayedCount ?? 16;
  const query = options.query ?? '남자 후드';

  const buildWorksheet =
    mode === 'ready'
      ? `# Compare Entry Manual Build Worksheet

## Session Info

- Builder: Alex

## Cross-Cut Build Checks

- [x] desktop/mobile 6 frames complete
- [x] route-specific copy preserved

## Handoff To Review

- [x] board checked
- [x] review worksheet started
- [x] decision log drafted
`
      : `# Compare Entry Manual Build Worksheet

## Session Info

- Builder:

## Cross-Cut Build Checks

- [ ] desktop/mobile 6 frames complete
- [ ] route-specific copy preserved

## Handoff To Review

- [ ] board checked
- [ ] review worksheet started
- [ ] decision log drafted
`;

  const reviewWorksheet =
    mode === 'ready'
      ? `# Compare Entry Design Review Worksheet

## Session Info

- Reviewer: Casey
- Review Date: 2026-03-27
- Outcome: Approved With Follow-up

## Cross-Cut Review Questions

- [x] hero priority is clear
- [x] workflow continuity is clear

## Desktop Frames

### CompareEntry/Desktop/Brand-Musinsa

- [x] frame completeness
- [x] hierarchy clarity

## Mobile Frames

### CompareEntry/Mobile/Brand-Musinsa

- [x] frame completeness
- [x] hierarchy clarity
`
      : `# Compare Entry Design Review Worksheet

## Session Info

- Reviewer:
- Review Date:
- Outcome: \`Approved\` | \`Approved With Follow-up\` | \`Needs Revision\`

## Cross-Cut Review Questions

- [ ] hero priority is clear
- [ ] workflow continuity is clear

## Desktop Frames

### CompareEntry/Desktop/Brand-Musinsa

- [ ] frame completeness
- [ ] hierarchy clarity

## Mobile Frames

### CompareEntry/Mobile/Brand-Musinsa

- [ ] frame completeness
- [ ] hierarchy clarity
`;

  const decisionLog =
    mode === 'ready'
      ? `# Compare Entry Design Review Decision Log

## Decision

- Outcome: Approved With Follow-up
- Does \`SUN-10\` unblock \`SUN-11\` / \`SUN-12\`?: Yes
- Reviewer confidence: High

## Required Revisions

1. tighten mobile spacing
2. reduce hero copy overflow

## Approved With Follow-up Notes

- implementation follow-up: align section padding token
- copy polish follow-up: trim category helper line
- token / component cleanup follow-up: normalize summary metric emphasis

## Handoff Notes

- \`SUN-11\` landing scope: use approved hero hierarchy
- \`SUN-12\` search-result scope: keep compare-ready zone first
- should any node be renamed before implementation?: no
- should any primitive be split further before implementation?: no
`
      : `# Compare Entry Design Review Decision Log

## Decision

- Outcome: \`Approved\` | \`Approved With Follow-up\` | \`Needs Revision\`
- Does \`SUN-10\` unblock \`SUN-11\` / \`SUN-12\`?: \`Yes\` | \`No\`
- Reviewer confidence: \`High\` | \`Medium\` | \`Low\`

## Required Revisions

1.
2.

## Approved With Follow-up Notes

- implementation follow-up:
- copy polish follow-up:
- token / component cleanup follow-up:

## Handoff Notes

- \`SUN-11\` landing scope:
- \`SUN-12\` search-result scope:
- should any node be renamed before implementation?:
- should any primitive be split further before implementation?:
`;

  await Promise.all([
    writeFile(path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'), buildWorksheet, 'utf8'),
    writeFile(
      path.join(artifactDir, 'compare-entry-design-review-packet.md'),
      '# Compare Entry Design Review Packet\n',
      'utf8',
    ),
    writeFile(path.join(artifactDir, 'compare-entry-design-review-worksheet.md'), reviewWorksheet, 'utf8'),
    writeFile(path.join(artifactDir, 'compare-entry-design-review-decision-log.md'), decisionLog, 'utf8'),
    writeFile(
      path.join(artifactDir, 'compare-entry-design-review-board.html'),
      '<!doctype html><html lang="ko"><body>board</body></html>\n',
      'utf8',
    ),
    writeFile(
      path.join(artifactDir, 'compare-entry-manual-figma-packet.html'),
      '<!doctype html><html lang="ko"><body>manual packet</body></html>\n',
      'utf8',
    ),
    writeFile(
      path.join(artifactDir, 'compare-entry-manual-frame-specs.md'),
      '# Compare Entry Manual Frame Specs\n',
      'utf8',
    ),
    writeFile(
      path.join(artifactDir, 'netlify-compare-entry-surface-reference.json'),
      JSON.stringify(
        {
          generatedAt,
          baseUrl: 'https://loo-pyck.netlify.app',
          routes: {
            brand: 'https://loo-pyck.netlify.app/brand/musinsa',
            search: 'https://loo-pyck.netlify.app/?q=%EB%82%A8%EC%9E%90%20%ED%9B%84%EB%93%9C&sort=sim',
          },
          search: {
            query,
            displayedCount,
          },
        },
        null,
        2,
      ) + '\n',
      'utf8',
    ),
  ]);
}

async function readJson<T>(filePath: string): Promise<T> {
  return JSON.parse(await readFile(filePath, 'utf8')) as T;
}

test('manual node evidence accepts copied Figma node URLs with short-form contract verification', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-node-url-evidence-'));

  try {
    const result = spawnSync(process.execPath, [scriptPaths.manualNodeEvidence], {
      cwd: rootDir,
      env: {
        ...process.env,
        COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
        COMPARE_ENTRY_MANUAL_NODE_FRAME_URL:
          'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-17',
        COMPARE_ENTRY_MANUAL_NODE_SECTION_URL:
          'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-18',
        COMPARE_ENTRY_MANUAL_NODE_CONTRACT_VERIFIED: 'true',
        COMPARE_ENTRY_MANUAL_NODE_SOURCE: 'manual-figma-copy-link',
      },
      encoding: 'utf8',
    });

    assert.equal(
      result.status,
      0,
      `Unexpected exit code for ${path.basename(scriptPaths.manualNodeEvidence)}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );

    const evidence = await readJson<{
      readyForWorksheetCheck: boolean;
      status: string;
      observed: {
        frameId: string;
        sectionId: string;
        frameUrl: string;
        sectionUrl: string;
        frameUrlFileKey: string;
        sectionUrlFileKey: string;
        urlValidationFailures: string[];
        frameNameMatches: boolean;
        sectionNameMatches: boolean;
        visuallyMatchesPreview: boolean;
      };
    }>(path.join(artifactDir, 'compare-entry-manual-node-evidence.json'));
    const markdown = await readFile(path.join(artifactDir, 'compare-entry-manual-node-evidence.md'), 'utf8');

    assert.equal(evidence.readyForWorksheetCheck, true);
    assert.equal(evidence.status, 'ready-for-single-worksheet-check');
    assert.equal(evidence.observed.frameId, '10:17');
    assert.equal(evidence.observed.sectionId, '10:18');
    assert.equal(evidence.observed.frameNameMatches, true);
    assert.equal(evidence.observed.sectionNameMatches, true);
    assert.equal(evidence.observed.visuallyMatchesPreview, true);
    assert.equal(evidence.observed.frameUrlFileKey, 'Oj35jzmgbwnxzpTTqTcxLi');
    assert.equal(evidence.observed.sectionUrlFileKey, 'Oj35jzmgbwnxzpTTqTcxLi');
    assert.deepEqual(evidence.observed.urlValidationFailures, []);
    assert.match(evidence.observed.frameUrl, /node-id=10-17/);
    assert.match(evidence.observed.sectionUrl, /node-id=10-18/);
    assert.match(markdown, /frameUrl: `https:\/\/www\.figma\.com\/design\/Oj35jzmgbwnxzpTTqTcxLi/);
    assert.match(markdown, /sectionUrl: `https:\/\/www\.figma\.com\/design\/Oj35jzmgbwnxzpTTqTcxLi/);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('manual node evidence blocks copied Figma URLs from the wrong file', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-node-wrong-file-'));

  try {
    const result = spawnSync(process.execPath, [scriptPaths.manualNodeEvidence], {
      cwd: rootDir,
      env: {
        ...process.env,
        COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
        COMPARE_ENTRY_MANUAL_NODE_FRAME_URL:
          'https://www.figma.com/design/WRONG_FILE_KEY/LooPyck?node-id=10-17',
        COMPARE_ENTRY_MANUAL_NODE_SECTION_URL:
          'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-18',
        COMPARE_ENTRY_MANUAL_NODE_CONTRACT_VERIFIED: 'true',
      },
      encoding: 'utf8',
    });

    assert.equal(
      result.status,
      0,
      `Unexpected exit code for ${path.basename(scriptPaths.manualNodeEvidence)}.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );

    const evidence = await readJson<{
      readyForWorksheetCheck: boolean;
      status: string;
      observed: {
        frameId: string;
        sectionId: string;
        frameNameMatches: boolean;
        sectionNameMatches: boolean;
        visuallyMatchesPreview: boolean;
        urlValidationFailures: string[];
      };
    }>(path.join(artifactDir, 'compare-entry-manual-node-evidence.json'));

    assert.equal(evidence.readyForWorksheetCheck, false);
    assert.equal(evidence.status, 'manual-node-evidence-pending');
    assert.equal(evidence.observed.frameId, '10:17');
    assert.equal(evidence.observed.sectionId, '10:18');
    assert.equal(evidence.observed.frameNameMatches, true);
    assert.equal(evidence.observed.sectionNameMatches, true);
    assert.equal(evidence.observed.visuallyMatchesPreview, true);
    assert.equal(evidence.observed.urlValidationFailures.length, 1);
    assert.match(evidence.observed.urlValidationFailures[0] ?? '', /WRONG_FILE_KEY/);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('manual node apply runner accepts copied Figma node URLs as positional arguments', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-node-url-apply-'));

  try {
    await writeFixtureFiles(artifactDir, 'blocked');
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
      `# Compare Entry Manual Build Worksheet

## Mobile Frames

### CompareEntry/Mobile/Brand-Musinsa

- [ ] \`TopNav/Context\`

#### Build Notes

- first fold:
- copy adjustments:
- mobile/desktop adaptation:
- unresolved question:

### CompareEntry/Mobile/Category-Sneakers

- [ ] \`TopNav/Context\`
`,
      'utf8',
    );

    const result = spawnSync(
      'bash',
      [
        scriptPaths.manualNodeApply,
        'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-17',
        'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=10-18',
        'CONTRACT_VERIFIED',
      ],
      {
        cwd: rootDir,
        env: {
          ...process.env,
          COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
        },
        encoding: 'utf8',
      },
    );

    assert.equal(
      result.status,
      1,
      `Runner should stop at strict ready-check while the full SUN-10 gate remains blocked.\nstdout:\n${result.stdout}\nstderr:\n${result.stderr}`,
    );

    const worksheet = await readFile(path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'), 'utf8');
    const evidence = await readJson<{
      readyForWorksheetCheck: boolean;
      observed: { frameId: string; sectionId: string; source: string };
    }>(path.join(artifactDir, 'compare-entry-manual-node-evidence.json'));
    const gate = await readJson<{ gateState: string; artifactAuditState: string }>(
      path.join(artifactDir, 'compare-entry-review-gate.json'),
    );

    assert.equal(evidence.readyForWorksheetCheck, true);
    assert.equal(evidence.observed.frameId, '10:17');
    assert.equal(evidence.observed.sectionId, '10:18');
    assert.equal(evidence.observed.source, 'manual-figma-copy-link');
    assert.match(worksheet, /- \[x\] `TopNav\/Context`/);
    assert.match(worksheet, /frameId 10:17/);
    assert.match(worksheet, /sectionId 10:18/);
    assert.equal(gate.gateState, 'BLOCKED');
    assert.equal(gate.artifactAuditState, 'READY');
    assert.match(result.stdout, /Compare entry review ready check blocked/);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('manual node apply runner rejects placeholder URL arguments before touching evidence', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-node-placeholder-'));

  try {
    const result = spawnSync(
      'bash',
      [scriptPaths.manualNodeApply, 'FRAME_FIGMA_URL', 'SECTION_FIGMA_URL', 'CONTRACT_VERIFIED'],
      {
        cwd: rootDir,
        env: {
          ...process.env,
          COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
        },
        encoding: 'utf8',
      },
    );

    assert.equal(result.status, 1);
    assert.match(result.stderr, /placeholder values/);
    assert.match(result.stderr, /FRAME_URL_FROM_FIGMA/);

    const evidencePath = path.join(artifactDir, 'compare-entry-manual-node-evidence.json');
    const evidenceRead = await readFile(evidencePath, 'utf8').catch((error: NodeJS.ErrnoException) => {
      assert.equal(error.code, 'ENOENT');
      return null;
    });
    assert.equal(evidenceRead, null);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('manual node apply command packet exposes copy-ready command for current target', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-node-command-'));

  try {
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'),
      JSON.stringify(
        {
          recommendedSurface: { surface: 'Brand-Musinsa', route: '/brand/musinsa' },
          recommendedFrame: 'CompareEntry/Mobile/Brand-Musinsa',
          recommendedSection: 'TopNav/Context',
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.json'),
      JSON.stringify(
        {
          figmaFileKey: 'Oj35jzmgbwnxzpTTqTcxLi',
          pageName: 'SUN-10 Compare Entry',
          route: '/brand/musinsa',
          target: {
            surface: 'Brand-Musinsa',
            frame: 'CompareEntry/Mobile/Brand-Musinsa',
            section: 'TopNav/Context',
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-node-evidence.json'),
      JSON.stringify({ status: 'manual-node-evidence-pending', readyForWorksheetCheck: false, observed: {} }, null, 2),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-gate.json'),
      JSON.stringify({ activeBlocker: { kind: 'figma-mcp-rate-limit' } }, null, 2),
      'utf8',
    );

    runScript(scriptPaths.manualNodeApplyCommand, artifactDir);

    const packet = await readJson<{
      status: string;
      targetLabel: string;
      command: string;
      requiredBeforeRunning: string[];
    }>(path.join(artifactDir, 'compare-entry-manual-node-apply-command.json'));
    const markdown = await readFile(path.join(artifactDir, 'compare-entry-manual-node-apply-command.md'), 'utf8');

    assert.equal(packet.status, 'waiting-for-manual-figma-node-urls');
    assert.equal(packet.targetLabel, 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context');
    assert.match(packet.command, /npm run ntl:compare-entry-manual-node-apply --/);
    assert.match(packet.command, /FRAME-NODE-ID/);
    assert.match(packet.command, /SECTION-NODE-ID/);
    assert.match(packet.command, /CONTRACT_VERIFIED/);
    assert.equal(
      packet.requiredBeforeRunning.some((item) =>
        item.includes('Frame name exactly matches CompareEntry/Mobile/Brand-Musinsa'),
      ),
      true,
    );
    assert.match(markdown, /One Command/);
    assert.match(markdown, /CONTRACT_VERIFIED/);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('manual unblock cockpit combines preview, command, evidence, and gate links', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-unblock-cockpit-'));

  try {
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-gate.json'),
      JSON.stringify(
        {
          gateState: 'BLOCKED',
          readyToUnblock: false,
          activeBlocker: {
            kind: 'figma-mcp-rate-limit',
            target: 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'),
      JSON.stringify(
        {
          recommendedSurface: { surface: 'Brand-Musinsa', route: '/brand/musinsa' },
          recommendedFrame: 'CompareEntry/Mobile/Brand-Musinsa',
          recommendedSection: 'TopNav/Context',
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-node-apply-command.json'),
      JSON.stringify(
        {
          status: 'waiting-for-manual-figma-node-urls',
          targetLabel: 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
          target: { route: '/brand/musinsa' },
          command: 'npm run ntl:compare-entry-manual-node-apply -- FRAME_URL SECTION_URL CONTRACT_VERIFIED',
          requiredBeforeRunning: [
            'Frame name exactly matches CompareEntry/Mobile/Brand-Musinsa.',
            'Section name exactly matches TopNav/Context.',
          ],
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-node-evidence.json'),
      JSON.stringify({ status: 'manual-node-evidence-pending', readyForWorksheetCheck: false, observed: {} }, null, 2),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-figma-unblock-plan.json'),
      JSON.stringify({ attemptHistoryTotal: 12 }, null, 2),
      'utf8',
    );

    runScript(scriptPaths.manualUnblockCockpit, artifactDir);

    const cockpit = await readJson<{
      status: string;
      gateState: string;
      targetLabel: string;
      command: string;
      links: { preview: string; applyCommand: string; gate: string };
    }>(path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.json'));
    const html = await readFile(path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.html'), 'utf8');

    assert.equal(cockpit.status, 'manual-figma-node-urls-required');
    assert.equal(cockpit.gateState, 'BLOCKED');
    assert.equal(cockpit.targetLabel, 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context');
    assert.match(cockpit.command, /CONTRACT_VERIFIED/);
    assert.match(cockpit.links.preview, /compare-entry-mobile-brand-topnav-preview\.html$/);
    assert.match(cockpit.links.applyCommand, /compare-entry-manual-node-apply-command\.md$/);
    assert.match(cockpit.links.gate, /compare-entry-review-gate\.md$/);
    assert.match(html, /Manual Unblock Cockpit/);
    assert.match(html, /Fallback Preview/);
    assert.match(html, /Copy-Ready Command/);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('manual node apply command readiness validates synchronized unblock artifacts', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-node-command-ready-'));

  try {
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-gate.json'),
      JSON.stringify(
        {
          gateState: 'BLOCKED',
          readyToUnblock: false,
          activeBlocker: {
            kind: 'figma-mcp-rate-limit',
            target: 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.json'),
      JSON.stringify(
        {
          figmaFileKey: 'Oj35jzmgbwnxzpTTqTcxLi',
          route: '/brand/musinsa',
          target: {
            surface: 'Brand-Musinsa',
            frame: 'CompareEntry/Mobile/Brand-Musinsa',
            section: 'TopNav/Context',
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-node-evidence.json'),
      JSON.stringify(
        {
          status: 'manual-node-evidence-pending',
          readyForWorksheetCheck: false,
          observed: { urlValidationFailures: [] },
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-node-apply-command.json'),
      JSON.stringify(
        {
          status: 'waiting-for-manual-figma-node-urls',
          targetLabel: 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
          fileKey: 'Oj35jzmgbwnxzpTTqTcxLi',
          target: {
            surface: 'Brand-Musinsa',
            route: '/brand/musinsa',
            frame: 'CompareEntry/Mobile/Brand-Musinsa',
            section: 'TopNav/Context',
          },
          currentEvidence: {
            readyForWorksheetCheck: false,
            frameId: null,
            sectionId: null,
          },
          command: [
            'npm run ntl:compare-entry-manual-node-apply -- \\',
            "  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=FRAME-NODE-ID' \\",
            "  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=SECTION-NODE-ID' \\",
            '  CONTRACT_VERIFIED',
          ].join('\n'),
          requiredBeforeRunning: [
            'Frame name exactly matches CompareEntry/Mobile/Brand-Musinsa.',
            'Section name exactly matches TopNav/Context.',
            'Visual slice matches compare-entry-manual-ui-slice-packet.md or the approved preview.',
            'You copied the frame URL and section URL from the real manually created Figma nodes, not from an unverified raw capture.',
          ],
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-manual-unblock-cockpit.json'),
      JSON.stringify(
        {
          targetLabel: 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
          command: [
            'npm run ntl:compare-entry-manual-node-apply -- \\',
            "  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=FRAME-NODE-ID' \\",
            "  'https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi/LooPyck?node-id=SECTION-NODE-ID' \\",
            '  CONTRACT_VERIFIED',
          ].join('\n'),
        },
        null,
        2,
      ),
      'utf8',
    );

    runScript(scriptPaths.manualNodeApplyCommandReady, artifactDir);

    const readiness = await readJson<{
      ok: boolean;
      readinessState: string;
      failures: string[];
      expected: { fileKey: string; frame: string; section: string };
    }>(path.join(artifactDir, 'compare-entry-manual-node-apply-command-readiness.json'));
    const markdown = await readFile(
      path.join(artifactDir, 'compare-entry-manual-node-apply-command-readiness.md'),
      'utf8',
    );

    assert.equal(readiness.ok, true);
    assert.equal(readiness.readinessState, 'READY_FOR_MANUAL_NODE_URLS');
    assert.deepEqual(readiness.failures, []);
    assert.equal(readiness.expected.fileKey, 'Oj35jzmgbwnxzpTTqTcxLi');
    assert.equal(readiness.expected.frame, 'CompareEntry/Mobile/Brand-Musinsa');
    assert.equal(readiness.expected.section, 'TopNav/Context');
    assert.match(markdown, /READY_FOR_MANUAL_NODE_URLS/);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('next section action card exposes fallback preview for mobile Brand top nav slice', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-action-fallback-'));

  try {
    const recommendedSurface = {
      surface: 'Brand-Musinsa',
      label: 'Brand: Musinsa',
      route: '/brand/musinsa',
      totalPending: 117,
    };

    await writeFile(
      path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.json'),
      JSON.stringify(
        {
          gateState: 'BLOCKED',
          readyToUnblock: false,
          recommendedSurface,
          recommendedNextFrame: 'CompareEntry/Mobile/Brand-Musinsa',
          recommendedNextSection: 'TopNav/Context',
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'),
      JSON.stringify(
        {
          recommendedSurface,
          recommendedNextFrame: 'CompareEntry/Mobile/Brand-Musinsa',
          recommendedNextSection: 'TopNav/Context',
          frames: [
            {
              frame: 'CompareEntry/Mobile/Brand-Musinsa',
              checklistSections: [
                {
                  section: 'TopNav/Context',
                  checklistLabel: 'TopNav/Context - Build Pending',
                  isRecommended: true,
                },
              ],
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-next-section-packet.json'),
      JSON.stringify(
        {
          gateState: 'BLOCKED',
          readyToUnblock: false,
          recommendedSection: { section: 'TopNav/Context', phase: 'Build Pending' },
          focusActions: ['Create the mobile top navigation context slice.'],
          siblingSections: [],
        },
        null,
        2,
      ),
      'utf8',
    );

    runScript(scriptPaths.nextSectionAction, artifactDir);
    runScript(scriptPaths.mobileBrandTopnavPreview, artifactDir);
    runScript(scriptPaths.figmaRetryPacket, artifactDir);
    const attemptResult = spawnSync(process.execPath, [scriptPaths.figmaMcpAttempt], {
      cwd: rootDir,
      env: {
        ...process.env,
        COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
        COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_STATUS: 'rate-limited',
        COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_OPERATION: 'inspect-target',
        COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_MESSAGE:
          'Figma MCP use_figma returned Starter plan tool-call limit before read-only inspection could run.',
      },
      encoding: 'utf8',
    });
    assert.equal(
      attemptResult.status,
      0,
      `Unexpected exit code for ${path.basename(scriptPaths.figmaMcpAttempt)}.\nstdout:\n${attemptResult.stdout}\nstderr:\n${attemptResult.stderr}`,
    );
    const appAttemptResult = spawnSync(process.execPath, [scriptPaths.figmaMcpAttempt], {
      cwd: rootDir,
      env: {
        ...process.env,
        COMPARE_ENTRY_ARTIFACT_DIR: artifactDir,
        COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_STATUS: 'rate-limited',
        COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_OPERATION: 'inspect-target-app-mcp',
        COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_TOOL: 'mcp__codex_apps__figma._use_figma',
        COMPARE_ENTRY_FIGMA_MCP_ATTEMPT_MESSAGE:
          'Alternate Figma app MCP _use_figma returned the Starter plan tool-call limit before read-only inspection could run.',
      },
      encoding: 'utf8',
    });
    assert.equal(
      appAttemptResult.status,
      0,
      `Unexpected exit code for ${path.basename(scriptPaths.figmaMcpAttempt)}.\nstdout:\n${appAttemptResult.stdout}\nstderr:\n${appAttemptResult.stderr}`,
    );
    runScript(scriptPaths.figmaRetryPacket, artifactDir);

    const nextSectionAction = await readJson<{
      recommendedFrame: string | null;
      recommendedSection: string | null;
      actionItems: string[];
      fallbackPreview: {
        previewHtml: string;
        previewJson: string;
        figmaTemplate: string;
        generatorCommand: string;
        worksheetPolicy: string;
      } | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'));
    const markdown = await readFile(
      path.join(artifactDir, 'compare-entry-review-next-section-action-card.md'),
      'utf8',
    );
    const retryPacket = await readJson<{
      status: string;
      retryReady: boolean;
      target: { frame: string | null; section: string | null };
      figma: { fileKey: string | null; templatePath: string; skillNames: string };
      latestMcpAttempt: { status: string; operation: string; message: string } | null;
      mcpAttemptHistory: {
        totalAttempts: number;
        latestOperation: string | null;
        latestTool: string | null;
        recentAttempts: Array<{ operation: string | null; tool: string | null; message: string | null }>;
      } | null;
      validation: { isTargetSlice: boolean; templateReady: boolean; previewReady: boolean };
    }>(path.join(artifactDir, 'compare-entry-figma-retry-packet.json'));
    const attempt = await readJson<{ status: string; operation: string; tool: string; message: string }>(
      path.join(artifactDir, 'compare-entry-figma-mcp-attempt.json'),
    );
    const attemptHistory = await readJson<{
      totalAttempts: number;
      latestAttempt: { operation: string; tool: string; message: string } | null;
      attempts: Array<{ operation: string; tool: string; message: string }>;
    }>(path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.json'));

    assert.equal(nextSectionAction.recommendedFrame, 'CompareEntry/Mobile/Brand-Musinsa');
    assert.equal(nextSectionAction.recommendedSection, 'TopNav/Context');
    assert.match(
      nextSectionAction.fallbackPreview?.previewHtml ?? '',
      /compare-entry-mobile-brand-topnav-preview\.html$/,
    );
    assert.match(
      nextSectionAction.fallbackPreview?.previewJson ?? '',
      /compare-entry-mobile-brand-topnav-preview\.json$/,
    );
    assert.match(
      nextSectionAction.fallbackPreview?.figmaTemplate ?? '',
      /figmaCompareEntryMobileBrandTopNavTemplate\.mjs$/,
    );
    assert.equal(
      nextSectionAction.fallbackPreview?.generatorCommand,
      'npm run ntl:compare-entry-mobile-brand-topnav-preview',
    );
    assert.match(
      nextSectionAction.fallbackPreview?.worksheetPolicy ?? '',
      /Do not check the build worksheet/,
    );
    assert.equal(
      nextSectionAction.actionItems.some((item) => item.includes('Figma MCP is rate-limited')),
      true,
    );
    assert.match(markdown, /Figma Limit Fallback/);
    assert.equal(retryPacket.status, 'ready-for-figma-mcp-retry');
    assert.equal(retryPacket.retryReady, true);
    assert.equal(retryPacket.target.frame, 'CompareEntry/Mobile/Brand-Musinsa');
    assert.equal(retryPacket.target.section, 'TopNav/Context');
    assert.equal(retryPacket.figma.fileKey, 'Oj35jzmgbwnxzpTTqTcxLi');
    assert.match(retryPacket.figma.templatePath, /figmaCompareEntryMobileBrandTopNavTemplate\.mjs$/);
    assert.equal(retryPacket.figma.skillNames, 'figma-use,figma-generate-design');
    assert.equal(attempt.status, 'rate-limited');
    assert.equal(attempt.operation, 'inspect-target-app-mcp');
    assert.equal(attempt.tool, 'mcp__codex_apps__figma._use_figma');
    assert.match(attempt.message, /Starter plan tool-call limit/);
    assert.equal(retryPacket.latestMcpAttempt?.status, 'rate-limited');
    assert.equal(retryPacket.latestMcpAttempt?.operation, 'inspect-target-app-mcp');
    assert.match(retryPacket.latestMcpAttempt?.message ?? '', /Starter plan tool-call limit/);
    assert.equal(attemptHistory.totalAttempts, 2);
    assert.equal(attemptHistory.latestAttempt?.operation, 'inspect-target-app-mcp');
    assert.equal(attemptHistory.latestAttempt?.tool, 'mcp__codex_apps__figma._use_figma');
    assert.equal(
      attemptHistory.attempts.some((entry) => entry.operation === 'inspect-target'),
      true,
    );
    assert.equal(retryPacket.mcpAttemptHistory?.totalAttempts, 2);
    assert.equal(retryPacket.mcpAttemptHistory?.latestOperation, 'inspect-target-app-mcp');
    assert.equal(retryPacket.mcpAttemptHistory?.latestTool, 'mcp__codex_apps__figma._use_figma');
    assert.equal(
      retryPacket.mcpAttemptHistory?.recentAttempts.some((entry) => entry.operation === 'inspect-target'),
      true,
    );
    assert.equal(retryPacket.validation.isTargetSlice, true);
    assert.equal(retryPacket.validation.templateReady, true);
    assert.equal(retryPacket.validation.previewReady, true);

    await writeFile(
      path.join(artifactDir, 'compare-entry-review-status.json'),
      JSON.stringify(
        {
          readyToUnblock: false,
          build: { checked: 2, total: 119 },
          review: { checked: 0, total: 119 },
          decision: { outcome: 'unselected', unblocks: 'unselected', confidence: 'unselected' },
        },
        null,
        2,
      ),
      'utf8',
    );
    await writeFile(
      path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
      JSON.stringify(
        {
          recommendedState: 'Keep SUN-10 blocked',
          missing: ['manual build worksheet is not complete'],
          nextActions: ['Retry the Figma template when MCP quota is available.'],
          figmaRetryPacket: {
            retryReady: retryPacket.retryReady,
            status: retryPacket.status,
            target: retryPacket.target,
            markdownPath: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
            mcpAttemptHistory: retryPacket.mcpAttemptHistory,
          },
        },
        null,
        2,
      ),
      'utf8',
    );
    runScript(scriptPaths.gate, artifactDir);
    runScript(scriptPaths.nextSectionAction, artifactDir);
    const gate = await readJson<{
      activeBlocker: {
        kind: string;
        target: string | null;
        latestStatus: string | null;
        latestOperation: string | null;
        latestTool: string | null;
        evidencePath: string | null;
      };
    }>(path.join(artifactDir, 'compare-entry-review-gate.json'));
    const rateLimitedActionCard = await readJson<{
      activeBlocker: {
        kind: string;
        target: string | null;
        latestStatus: string | null;
        latestOperation: string | null;
        evidencePath: string | null;
      };
      actionItems: string[];
    }>(path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'));

    assert.equal(gate.activeBlocker.kind, 'figma-mcp-rate-limit');
    assert.equal(
      gate.activeBlocker.target,
      'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
    );
    assert.equal(gate.activeBlocker.latestStatus, 'rate-limited');
    assert.equal(gate.activeBlocker.latestOperation, 'inspect-target-app-mcp');
    assert.equal(gate.activeBlocker.latestTool, 'mcp__codex_apps__figma._use_figma');
    assert.match(gate.activeBlocker.evidencePath ?? '', /compare-entry-figma-retry-packet\.md$/);
    assert.equal(rateLimitedActionCard.activeBlocker.kind, 'figma-mcp-rate-limit');
    assert.equal(
      rateLimitedActionCard.activeBlocker.target,
      'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
    );
    assert.equal(rateLimitedActionCard.activeBlocker.latestStatus, 'rate-limited');
    assert.equal(rateLimitedActionCard.activeBlocker.latestOperation, 'inspect-target-app-mcp');
    assert.match(rateLimitedActionCard.activeBlocker.evidencePath ?? '', /compare-entry-figma-retry-packet\.md$/);
    assert.equal(
      rateLimitedActionCard.actionItems.some((item) => item.includes('retry packet')),
      true,
    );
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('compare entry review pipeline reports BLOCKED for empty review artifacts', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-review-blocked-'));

  try {
    await writeFixtureFiles(artifactDir, 'blocked');

    runScript(scriptPaths.status, artifactDir);
    runScript(scriptPaths.missingDetail, artifactDir);
    runScript(scriptPaths.frameProgress, artifactDir);
    runScript(scriptPaths.surfaceQueue, artifactDir);
    runScript(scriptPaths.surfaceStatus, artifactDir);
    runScript(scriptPaths.nextSurface, artifactDir);
    runScript(scriptPaths.nextFrame, artifactDir);
    runScript(scriptPaths.nextSection, artifactDir);
    runScript(scriptPaths.sectionProgress, artifactDir);
    runScript(scriptPaths.nextSurfaceSections, artifactDir);
    runScript(scriptPaths.nextSurfaceChecklist, artifactDir);
    runScript(scriptPaths.nextSectionAction, artifactDir);
    runScript(scriptPaths.mobileBrandTopnavPreview, artifactDir);
    runScript(scriptPaths.figmaRetryPacket, artifactDir);
    runScript(scriptPaths.closeout, artifactDir);
    runScript(scriptPaths.gate, artifactDir);
    runScript(scriptPaths.focusPlan, artifactDir);
    runScript(scriptPaths.frameProgress, artifactDir);
    runScript(scriptPaths.surfaceQueue, artifactDir);
    runScript(scriptPaths.surfaceStatus, artifactDir);
    runScript(scriptPaths.nextSurface, artifactDir);
    runScript(scriptPaths.nextFrame, artifactDir);
    runScript(scriptPaths.nextSection, artifactDir);
    runScript(scriptPaths.sectionProgress, artifactDir);
    runScript(scriptPaths.nextSurfaceSections, artifactDir);
    runScript(scriptPaths.nextSurfaceChecklist, artifactDir);
    runScript(scriptPaths.nextSectionAction, artifactDir);
    runScript(scriptPaths.mobileBrandTopnavPreview, artifactDir);
    runScript(scriptPaths.figmaRetryPacket, artifactDir);
    runScript(scriptPaths.status, artifactDir);
    runScript(scriptPaths.linear, artifactDir);
    runScript(scriptPaths.approval, artifactDir);
    runScript(scriptPaths.gate, artifactDir, ['--strict'], 1);

    const status = await readJson<{ readyToUnblock: boolean; missing: string[]; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceChecklistPath: string; recommendedNextSectionActionCardPath: string; recommendedNextSectionActionFirstItem: string | null }>(
      path.join(artifactDir, 'compare-entry-review-status.json'),
    );
    const gate = await readJson<{
      gateState: string;
      readyToUnblock: boolean;
      artifactAuditState: string;
      artifactAuditSummary: {
        state: string;
        activeBlockerMismatchCount: number | null;
        activeBlockerFilesChecked: number | null;
      };
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
    }>(
      path.join(artifactDir, 'compare-entry-review-gate.json'),
    );
    const missingDetail = await readJson<{ totalPending: number; build: { frames: Array<{ frame: string; pending: string[] }> } }>(
      path.join(artifactDir, 'compare-entry-review-missing-detail.json'),
    );
    const focusPlan = await readJson<{
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
      totalActions: number;
      topActions: Array<{ label: string; kind: string; priority: number }>;
    }>(
      path.join(artifactDir, 'compare-entry-review-focus-plan.json'),
    );
    const frameProgress = await readJson<{ totalFrames: number; totalPending: number }>(
      path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
    );
    const sectionProgress = await readJson<{
      totalFrames: number;
      totalSections: number;
      recommendedNextSection: string | null;
      frames: Array<{ frame: string; sections: Array<{ section: string; isRecommended: boolean }> }>;
    }>(path.join(artifactDir, 'compare-entry-review-section-progress-board.json'));
    const surfaceQueue = await readJson<{ totalSurfaces: number; recommendedSurfaceOrder: string[] }>(
      path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
    );
    const surfaceStatus = await readJson<{
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
      blockedSurfaceCount: number;
      recommendedNextSurface: string | null;
      recommendedNextFrame: string | null;
      recommendedNextSection: string | null;
      recommendedNextSurfaceChecklistPath: string;
    }>(
      path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
    );
    const nextSurface = await readJson<{
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
      hasRecommendedSurface: boolean;
      recommendedSurface: { surface: string; route: string; frames: Array<{ frame: string }> } | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-surface-packet.json'));
    const nextFrame = await readJson<{
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
      hasRecommendedFrame: boolean;
      recommendedSurface: { surface: string; route: string } | null;
      recommendedFrame: { frame: string; viewport: string } | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-frame-packet.json'));
    const nextSection = await readJson<{
      hasRecommendedSection: boolean;
      recommendedSurface: { surface: string; route: string } | null;
      recommendedFrame: { frame: string; viewport: string } | null;
      recommendedSection: { section: string; phase: string } | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-section-packet.json'));
    const nextSurfaceSections = await readJson<{
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
      hasRecommendedSurface: boolean;
      recommendedSurface: { surface: string; route: string } | null;
      recommendedNextFrame: string | null;
      recommendedNextSection: string | null;
      totalFrames: number;
      totalSections: number;
      frames: Array<{ frame: string; sections: Array<{ section: string; isRecommended: boolean }> }>;
    }>(path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.json'));
    const nextSurfaceChecklist = await readJson<{
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
      hasRecommendedSurface: boolean;
      recommendedSurface: { surface: string; route: string } | null;
      recommendedNextFrame: string | null;
      recommendedNextSection: string | null;
      totalFrames: number;
      totalSections: number;
      frames: Array<{ frame: string; checklistSections: Array<{ section: string; isRecommended: boolean }> }>;
    }>(path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'));
    const nextSectionAction = await readJson<{
      hasRecommendedSection: boolean;
      activeBlocker: { kind: string; target: string | null; evidencePath: string | null };
      recommendedSurface: { surface: string; route: string } | null;
      recommendedFrame: string | null;
      recommendedSection: string | null;
      checklistFrame: string | null;
      checklistFirstSection: string | null;
      checklistSectionCount: number;
      checklistPreview: string[];
      actionItems: string[];
      fallbackPreview: unknown | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'));
    const closeout = await readJson<{ activeBlocker: { kind: string; target: string | null; evidencePath: string | null }; topBlockedSurfaces: string[]; topBlockedSections: string[]; topBlockedFrames: string[]; blockedSurfaceCount: number; readySurfaceCount: number; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceFrameCount: number; recommendedNextSurfaceSectionCount: number; recommendedNextSurfaceChecklistPath: string | null; recommendedNextSurfaceChecklistFirstFrame: string | null; recommendedNextSurfaceChecklistFirstSection: string | null; recommendedNextSectionActionCardPath: string | null; recommendedNextSectionActionFirstItem: string | null; recommendedNextSurfaceSectionPreview: string[]; figmaRetryPacket: { retryReady: boolean; status: string; markdownPath: string } | null }>(
      path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
    );
    const linear = await readJson<{ activeBlocker: { kind: string; target: string | null; evidencePath: string | null }; sun11Note: string; topBlockedSurfaces: string[]; topBlockedSections: string[]; topBlockedFrames: string[]; blockedSurfaceCount: number; readySurfaceCount: number; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceFrameCount: number; recommendedNextSurfaceSectionCount: number; recommendedNextSurfaceChecklistPath: string | null; recommendedNextSurfaceChecklistFirstFrame: string | null; recommendedNextSurfaceChecklistFirstSection: string | null; recommendedNextSectionActionCardPath: string | null; recommendedNextSectionActionFirstItem: string | null; recommendedNextSurfaceSectionPreview: string[]; figmaRetryPacket: { retryReady: boolean; status: string; markdownPath: string } | null }>(
      path.join(artifactDir, 'compare-entry-linear-update-draft.json'),
    );
    const approval = await readJson<{ readyToUnblock: boolean; activeBlocker: { kind: string; target: string | null; evidencePath: string | null }; topBlockedSurfaces: string[]; topBlockedSections: string[]; topBlockedFrames: string[]; blockedSurfaceCount: number; readySurfaceCount: number; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceFrameCount: number; recommendedNextSurfaceSectionCount: number; recommendedNextSurfaceChecklistPath: string | null; recommendedNextSurfaceChecklistFirstFrame: string | null; recommendedNextSurfaceChecklistFirstSection: string | null; recommendedNextSectionActionCardPath: string | null; recommendedNextSectionActionFirstItem: string | null; recommendedNextSurfaceSectionPreview: string[]; figmaRetryPacket: { retryReady: boolean; status: string; markdownPath: string } | null }>(
      path.join(artifactDir, 'compare-entry-approval-board.json'),
    );

    assert.equal(status.readyToUnblock, false);
    assert.equal(status.missing.length > 0, true);
    assert.equal(status.recommendedNextSurface, 'Brand-Musinsa');
    assert.equal(status.recommendedNextFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(status.recommendedNextSection, 'TopNav/Context');
    assert.match(status.recommendedNextSurfaceChecklistPath, /compare-entry-review-next-surface-checklist\.html$/);
    assert.match(status.recommendedNextSectionActionCardPath, /compare-entry-review-next-section-action-card\.html$/);
    assert.match(status.recommendedNextSectionActionFirstItem ?? '', /Open route/);
    assert.equal(gate.gateState, 'BLOCKED');
    assert.equal(gate.readyToUnblock, false);
    assert.equal(gate.artifactAuditState, 'PENDING');
    assert.equal(gate.artifactAuditSummary.state, 'PENDING');
    assert.equal(gate.artifactAuditSummary.activeBlockerMismatchCount, null);
    assert.equal(gate.artifactAuditSummary.activeBlockerFilesChecked, null);
    assert.equal(gate.activeBlocker.kind, 'review-readiness');
    assert.match(gate.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(gate.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(missingDetail.totalPending > 0, true);
    assert.equal(focusPlan.activeBlocker.kind, 'review-readiness');
    assert.match(focusPlan.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(focusPlan.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(focusPlan.totalActions > 0, true);
    assert.equal(focusPlan.topActions.length > 0, true);
    assert.equal(focusPlan.topActions[0]?.kind, 'active-blocker');
    assert.equal(focusPlan.topActions[0]?.priority, 0);
    assert.equal(frameProgress.totalFrames > 0, true);
    assert.equal(frameProgress.totalPending, missingDetail.totalPending);
    assert.equal(sectionProgress.totalFrames, frameProgress.totalFrames);
    assert.equal(sectionProgress.totalSections > 0, true);
    assert.equal(sectionProgress.recommendedNextSection, 'TopNav/Context');
    assert.equal(sectionProgress.frames[0]?.frame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(sectionProgress.frames[0]?.sections[0]?.section, 'TopNav/Context');
    assert.equal(sectionProgress.frames[0]?.sections[0]?.isRecommended, true);
    assert.equal(surfaceQueue.totalSurfaces > 0, true);
    assert.equal(surfaceQueue.recommendedSurfaceOrder.length > 0, true);
    assert.equal(surfaceStatus.activeBlocker.kind, 'review-readiness');
    assert.match(surfaceStatus.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(surfaceStatus.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(surfaceStatus.blockedSurfaceCount > 0, true);
    assert.equal(typeof surfaceStatus.recommendedNextSurface, 'string');
    assert.equal(surfaceStatus.recommendedNextFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(surfaceStatus.recommendedNextSection, 'TopNav/Context');
    assert.match(surfaceStatus.recommendedNextSurfaceChecklistPath, /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(nextSurface.activeBlocker.kind, 'review-readiness');
    assert.match(nextSurface.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(nextSurface.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(nextSurface.hasRecommendedSurface, true);
    assert.equal(nextSurface.recommendedSurface?.surface, 'Brand-Musinsa');
    assert.equal(nextSurface.recommendedSurface?.route, '/brand/musinsa');
    assert.equal((nextSurface.recommendedSurface?.frames.length ?? 0) > 0, true);
    assert.equal(nextFrame.activeBlocker.kind, 'review-readiness');
    assert.match(nextFrame.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(nextFrame.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(nextFrame.hasRecommendedFrame, true);
    assert.equal(nextFrame.recommendedSurface?.surface, 'Brand-Musinsa');
    assert.equal(nextFrame.recommendedFrame?.frame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextFrame.recommendedFrame?.viewport, 'Desktop');
    assert.equal(nextSection.hasRecommendedSection, true);
    assert.equal(nextSection.recommendedSurface?.surface, 'Brand-Musinsa');
    assert.equal(nextSection.recommendedFrame?.frame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextSection.recommendedSection?.section, 'TopNav/Context');
    assert.equal(nextSection.recommendedSection?.phase, 'Review Pending');
    assert.equal(nextSurfaceSections.activeBlocker.kind, 'review-readiness');
    assert.match(nextSurfaceSections.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(nextSurfaceSections.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(nextSurfaceSections.hasRecommendedSurface, true);
    assert.equal(nextSurfaceSections.recommendedSurface?.surface, 'Brand-Musinsa');
    assert.equal(nextSurfaceSections.recommendedSurface?.route, '/brand/musinsa');
    assert.equal(nextSurfaceSections.recommendedNextFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextSurfaceSections.recommendedNextSection, 'TopNav/Context');
    assert.equal(nextSurfaceSections.totalFrames > 0, true);
    assert.equal(nextSurfaceSections.totalSections > 0, true);
    assert.equal(nextSurfaceSections.frames[0]?.frame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextSurfaceSections.frames[0]?.sections[0]?.section, 'TopNav/Context');
    assert.equal(nextSurfaceSections.frames[0]?.sections[0]?.isRecommended, true);
    assert.equal(nextSurfaceChecklist.activeBlocker.kind, 'review-readiness');
    assert.match(nextSurfaceChecklist.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(nextSurfaceChecklist.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(nextSurfaceChecklist.hasRecommendedSurface, true);
    assert.equal(nextSurfaceChecklist.recommendedSurface?.surface, 'Brand-Musinsa');
    assert.equal(nextSurfaceChecklist.recommendedSurface?.route, '/brand/musinsa');
    assert.equal(nextSurfaceChecklist.recommendedNextFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextSurfaceChecklist.recommendedNextSection, 'TopNav/Context');
    assert.equal(nextSurfaceChecklist.totalFrames, 2);
    assert.equal(nextSurfaceChecklist.totalSections, 12);
    assert.equal(nextSurfaceChecklist.frames[0]?.frame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextSurfaceChecklist.frames[0]?.checklistSections[0]?.section, 'TopNav/Context');
    assert.equal(nextSurfaceChecklist.frames[0]?.checklistSections[0]?.isRecommended, true);
    assert.equal(nextSectionAction.hasRecommendedSection, true);
    assert.equal(nextSectionAction.activeBlocker.kind, 'review-readiness');
    assert.match(nextSectionAction.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(nextSectionAction.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(nextSectionAction.recommendedSurface?.surface, 'Brand-Musinsa');
    assert.equal(nextSectionAction.recommendedSurface?.route, '/brand/musinsa');
    assert.equal(nextSectionAction.recommendedFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextSectionAction.recommendedSection, 'TopNav/Context');
    assert.equal(nextSectionAction.checklistFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(nextSectionAction.checklistFirstSection, 'TopNav/Context');
    assert.equal(nextSectionAction.checklistSectionCount, 6);
    assert.match(nextSectionAction.checklistPreview[0] ?? '', /TopNav\/Context/);
    assert.equal(nextSectionAction.actionItems.length > 0, true);
    assert.equal(nextSectionAction.fallbackPreview, null);
    assert.equal(closeout.blockedSurfaceCount > 0, true);
    assert.equal(closeout.activeBlocker.kind, 'review-readiness');
    assert.match(closeout.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(closeout.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(closeout.readySurfaceCount, 0);
    assert.equal(typeof closeout.recommendedNextSurface, 'string');
    assert.equal(typeof closeout.recommendedNextFrame, 'string');
    assert.equal(closeout.recommendedNextSection, 'TopNav/Context');
    assert.equal(closeout.recommendedNextSurfaceFrameCount, 2);
    assert.equal(closeout.recommendedNextSurfaceSectionCount, 12);
    assert.match(closeout.recommendedNextSurfaceChecklistPath ?? '', /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(closeout.recommendedNextSurfaceChecklistFirstFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(closeout.recommendedNextSurfaceChecklistFirstSection, 'TopNav/Context');
    assert.match(closeout.recommendedNextSectionActionCardPath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.match(closeout.recommendedNextSectionActionFirstItem ?? '', /Open route/);
    assert.equal(closeout.figmaRetryPacket?.retryReady, false);
    assert.equal(closeout.figmaRetryPacket?.status, 'not-current-retry-target');
    assert.match(closeout.figmaRetryPacket?.markdownPath ?? '', /compare-entry-figma-retry-packet\.md$/);
    assert.equal(closeout.recommendedNextSurfaceSectionPreview.length > 0, true);
    assert.match(closeout.recommendedNextSurfaceSectionPreview[0] ?? '', /TopNav\/Context/);
    assert.equal(closeout.topBlockedSurfaces.length > 0, true);
    assert.equal(closeout.topBlockedSections.length > 0, true);
    assert.match(closeout.topBlockedSections[0] ?? '', /TopNav\/Context/);
    assert.equal(closeout.topBlockedFrames.length > 0, true);
    assert.match(linear.sun11Note, /Do not start SUN-11 yet/);
    assert.equal(linear.activeBlocker.kind, 'review-readiness');
    assert.match(linear.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(linear.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(linear.blockedSurfaceCount > 0, true);
    assert.equal(linear.readySurfaceCount, 0);
    assert.equal(typeof linear.recommendedNextSurface, 'string');
    assert.equal(typeof linear.recommendedNextFrame, 'string');
    assert.equal(linear.recommendedNextSection, 'TopNav/Context');
    assert.equal(linear.recommendedNextSurfaceFrameCount, 2);
    assert.equal(linear.recommendedNextSurfaceSectionCount, 12);
    assert.match(linear.recommendedNextSurfaceChecklistPath ?? '', /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(linear.recommendedNextSurfaceChecklistFirstFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(linear.recommendedNextSurfaceChecklistFirstSection, 'TopNav/Context');
    assert.match(linear.recommendedNextSectionActionCardPath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.match(linear.recommendedNextSectionActionFirstItem ?? '', /Open route/);
    assert.equal(linear.figmaRetryPacket?.retryReady, false);
    assert.equal(linear.figmaRetryPacket?.status, 'not-current-retry-target');
    assert.equal(linear.recommendedNextSurfaceSectionPreview.length > 0, true);
    assert.match(linear.recommendedNextSurfaceSectionPreview[0] ?? '', /TopNav\/Context/);
    assert.equal(linear.topBlockedSurfaces.length > 0, true);
    assert.equal(linear.topBlockedSections.length > 0, true);
    assert.match(linear.topBlockedSections[0] ?? '', /TopNav\/Context/);
    assert.equal(linear.topBlockedFrames.length > 0, true);
    assert.equal(approval.readyToUnblock, false);
    assert.equal(approval.activeBlocker.kind, 'review-readiness');
    assert.match(approval.activeBlocker.target ?? '', /Brand-Musinsa/);
    assert.match(approval.activeBlocker.evidencePath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.equal(approval.blockedSurfaceCount > 0, true);
    assert.equal(approval.readySurfaceCount, 0);
    assert.equal(typeof approval.recommendedNextSurface, 'string');
    assert.equal(typeof approval.recommendedNextFrame, 'string');
    assert.equal(approval.recommendedNextSection, 'TopNav/Context');
    assert.equal(approval.recommendedNextSurfaceFrameCount, 2);
    assert.equal(approval.recommendedNextSurfaceSectionCount, 12);
    assert.match(approval.recommendedNextSurfaceChecklistPath ?? '', /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(approval.recommendedNextSurfaceChecklistFirstFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(approval.recommendedNextSurfaceChecklistFirstSection, 'TopNav/Context');
    assert.match(approval.recommendedNextSectionActionCardPath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.match(approval.recommendedNextSectionActionFirstItem ?? '', /Open route/);
    assert.equal(approval.figmaRetryPacket?.retryReady, false);
    assert.equal(approval.figmaRetryPacket?.status, 'not-current-retry-target');
    assert.equal(approval.recommendedNextSurfaceSectionPreview.length > 0, true);
    assert.match(approval.recommendedNextSurfaceSectionPreview[0] ?? '', /TopNav\/Context/);
    assert.equal(approval.topBlockedSurfaces.length > 0, true);
    assert.equal(approval.topBlockedSections.length > 0, true);
    assert.match(approval.topBlockedSections[0] ?? '', /TopNav\/Context/);
    assert.equal(approval.topBlockedFrames.length > 0, true);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('compare entry review pipeline reports READY for completed review artifacts', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-review-ready-'));

  try {
    await writeFixtureFiles(artifactDir, 'ready');

    runScript(scriptPaths.status, artifactDir);
    runScript(scriptPaths.missingDetail, artifactDir);
    runScript(scriptPaths.frameProgress, artifactDir);
    runScript(scriptPaths.surfaceQueue, artifactDir);
    runScript(scriptPaths.surfaceStatus, artifactDir);
    runScript(scriptPaths.nextSurface, artifactDir);
    runScript(scriptPaths.nextFrame, artifactDir);
    runScript(scriptPaths.nextSection, artifactDir);
    runScript(scriptPaths.sectionProgress, artifactDir);
    runScript(scriptPaths.nextSurfaceSections, artifactDir);
    runScript(scriptPaths.nextSurfaceChecklist, artifactDir);
    runScript(scriptPaths.nextSectionAction, artifactDir);
    runScript(scriptPaths.mobileBrandTopnavPreview, artifactDir);
    runScript(scriptPaths.figmaRetryPacket, artifactDir);
    runScript(scriptPaths.closeout, artifactDir);
    runScript(scriptPaths.gate, artifactDir);
    runScript(scriptPaths.focusPlan, artifactDir);
    runScript(scriptPaths.frameProgress, artifactDir);
    runScript(scriptPaths.surfaceQueue, artifactDir);
    runScript(scriptPaths.surfaceStatus, artifactDir);
    runScript(scriptPaths.nextSurface, artifactDir);
    runScript(scriptPaths.nextFrame, artifactDir);
    runScript(scriptPaths.nextSection, artifactDir);
    runScript(scriptPaths.sectionProgress, artifactDir);
    runScript(scriptPaths.nextSurfaceSections, artifactDir);
    runScript(scriptPaths.nextSurfaceChecklist, artifactDir);
    runScript(scriptPaths.nextSectionAction, artifactDir);
    runScript(scriptPaths.mobileBrandTopnavPreview, artifactDir);
    runScript(scriptPaths.figmaRetryPacket, artifactDir);
    runScript(scriptPaths.status, artifactDir);
    runScript(scriptPaths.linear, artifactDir);
    runScript(scriptPaths.approval, artifactDir);
    runScript(scriptPaths.gate, artifactDir, ['--strict']);

    const status = await readJson<{ readyToUnblock: boolean; missing: string[]; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceChecklistPath: string; recommendedNextSectionActionCardPath: string; recommendedNextSectionActionFirstItem: string | null }>(
      path.join(artifactDir, 'compare-entry-review-status.json'),
    );
    const gate = await readJson<{
      gateState: string;
      readyToUnblock: boolean;
      artifactAuditState: string;
      artifactAuditSummary: {
        state: string;
        activeBlockerMismatchCount: number | null;
        activeBlockerFilesChecked: number | null;
      };
      activeBlocker: { kind: string; target: string | null; nextAction: string };
    }>(
      path.join(artifactDir, 'compare-entry-review-gate.json'),
    );
    const missingDetail = await readJson<{ totalPending: number; build: { frames: Array<{ frame: string; pending: string[] }> } }>(
      path.join(artifactDir, 'compare-entry-review-missing-detail.json'),
    );
    const focusPlan = await readJson<{
      activeBlocker: { kind: string; target: string | null; nextAction: string };
      totalActions: number;
      topActions: Array<{ label: string }>;
    }>(
      path.join(artifactDir, 'compare-entry-review-focus-plan.json'),
    );
    const frameProgress = await readJson<{ totalFrames: number; totalPending: number }>(
      path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
    );
    const sectionProgress = await readJson<{
      totalFrames: number;
      totalSections: number;
      recommendedNextSection: string | null;
      frames: unknown[];
    }>(path.join(artifactDir, 'compare-entry-review-section-progress-board.json'));
    const surfaceQueue = await readJson<{ totalSurfaces: number; recommendedSurfaceOrder: string[] }>(
      path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
    );
    const surfaceStatus = await readJson<{
      activeBlocker: { kind: string; target: string | null; nextAction: string };
      blockedSurfaceCount: number;
      readySurfaceCount: number;
      recommendedNextSurface: string | null;
      recommendedNextFrame: string | null;
      recommendedNextSection: string | null;
      recommendedNextSurfaceChecklistPath: string;
    }>(
      path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
    );
    const nextSurface = await readJson<{
      activeBlocker: { kind: string; target: string | null; nextAction: string };
      hasRecommendedSurface: boolean;
      recommendedSurface: { surface: string } | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-surface-packet.json'));
    const nextFrame = await readJson<{
      activeBlocker: { kind: string; target: string | null; nextAction: string };
      hasRecommendedFrame: boolean;
      recommendedFrame: { frame: string } | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-frame-packet.json'));
    const nextSection = await readJson<{
      hasRecommendedSection: boolean;
      recommendedSection: { section: string } | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-section-packet.json'));
    const nextSurfaceSections = await readJson<{
      activeBlocker: { kind: string; target: string | null; nextAction: string };
      hasRecommendedSurface: boolean;
      recommendedSurface: { surface: string } | null;
      recommendedNextFrame: string | null;
      recommendedNextSection: string | null;
      totalFrames: number;
      totalSections: number;
      frames: unknown[];
    }>(path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.json'));
    const nextSurfaceChecklist = await readJson<{
      activeBlocker: { kind: string; target: string | null; nextAction: string };
      hasRecommendedSurface: boolean;
      recommendedSurface: { surface: string } | null;
      recommendedNextFrame: string | null;
      recommendedNextSection: string | null;
      totalFrames: number;
      totalSections: number;
      frames: unknown[];
    }>(path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'));
    const nextSectionAction = await readJson<{
      hasRecommendedSection: boolean;
      activeBlocker: { kind: string; target: string | null; nextAction: string };
      recommendedSurface: { surface: string } | null;
      recommendedFrame: string | null;
      recommendedSection: string | null;
      checklistFrame: string | null;
      checklistFirstSection: string | null;
      checklistSectionCount: number;
      checklistPreview: string[];
      fallbackPreview: unknown | null;
    }>(path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'));
    const closeout = await readJson<{ recommendedState: string; activeBlocker: { kind: string; target: string | null; nextAction: string }; followUp: string[]; handoffNotes: string[]; topBlockedSurfaces: string[]; topBlockedSections: string[]; topBlockedFrames: string[]; blockedSurfaceCount: number; readySurfaceCount: number; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceFrameCount: number; recommendedNextSurfaceSectionCount: number; recommendedNextSurfaceChecklistPath: string | null; recommendedNextSurfaceChecklistFirstFrame: string | null; recommendedNextSurfaceChecklistFirstSection: string | null; recommendedNextSectionActionCardPath: string | null; recommendedNextSectionActionFirstItem: string | null; recommendedNextSurfaceSectionPreview: string[] }>(
      path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
    );
    const linear = await readJson<{ activeBlocker: { kind: string; target: string | null; nextAction: string }; sun10Comment: string; sun11Note: string; sun12Note: string; topBlockedSurfaces: string[]; topBlockedSections: string[]; topBlockedFrames: string[]; blockedSurfaceCount: number; readySurfaceCount: number; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceFrameCount: number; recommendedNextSurfaceSectionCount: number; recommendedNextSurfaceChecklistPath: string | null; recommendedNextSurfaceChecklistFirstFrame: string | null; recommendedNextSurfaceChecklistFirstSection: string | null; recommendedNextSectionActionCardPath: string | null; recommendedNextSectionActionFirstItem: string | null; recommendedNextSurfaceSectionPreview: string[] }>(
      path.join(artifactDir, 'compare-entry-linear-update-draft.json'),
    );
    const approval = await readJson<{ readyToUnblock: boolean; activeBlocker: { kind: string; target: string | null; nextAction: string }; followUp: string[]; handoffNotes: string[]; artifactAuditState: string; topBlockedSurfaces: string[]; topBlockedSections: string[]; topBlockedFrames: string[]; blockedSurfaceCount: number; readySurfaceCount: number; recommendedNextSurface: string | null; recommendedNextFrame: string | null; recommendedNextSection: string | null; recommendedNextSurfaceFrameCount: number; recommendedNextSurfaceSectionCount: number; recommendedNextSurfaceChecklistPath: string | null; recommendedNextSurfaceChecklistFirstFrame: string | null; recommendedNextSurfaceChecklistFirstSection: string | null; recommendedNextSectionActionCardPath: string | null; recommendedNextSectionActionFirstItem: string | null; recommendedNextSurfaceSectionPreview: string[] }>(
      path.join(artifactDir, 'compare-entry-approval-board.json'),
    );

    assert.equal(status.readyToUnblock, true);
    assert.deepEqual(status.missing, []);
    assert.equal(status.recommendedNextSurface, null);
    assert.equal(status.recommendedNextFrame, null);
    assert.equal(status.recommendedNextSection, null);
    assert.match(status.recommendedNextSurfaceChecklistPath, /compare-entry-review-next-surface-checklist\.html$/);
    assert.match(status.recommendedNextSectionActionCardPath, /compare-entry-review-next-section-action-card\.html$/);
    assert.match(
      status.recommendedNextSectionActionFirstItem ?? '',
      /No recommended section remains/,
    );
    assert.equal(missingDetail.totalPending, 0);
    assert.deepEqual(missingDetail.build.frames, []);
    assert.equal(focusPlan.activeBlocker.kind, 'none');
    assert.equal(focusPlan.activeBlocker.target, null);
    assert.match(focusPlan.activeBlocker.nextAction, /SUN-11/);
    assert.equal(focusPlan.totalActions, 0);
    assert.deepEqual(focusPlan.topActions, []);
    assert.equal(frameProgress.totalFrames, 0);
    assert.equal(frameProgress.totalPending, 0);
    assert.equal(sectionProgress.totalFrames, 0);
    assert.equal(sectionProgress.totalSections, 0);
    assert.equal(sectionProgress.recommendedNextSection, null);
    assert.deepEqual(sectionProgress.frames, []);
    assert.equal(surfaceQueue.totalSurfaces, 0);
    assert.deepEqual(surfaceQueue.recommendedSurfaceOrder, []);
    assert.equal(surfaceStatus.activeBlocker.kind, 'none');
    assert.equal(surfaceStatus.activeBlocker.target, null);
    assert.match(surfaceStatus.activeBlocker.nextAction, /SUN-11/);
    assert.equal(surfaceStatus.blockedSurfaceCount, 0);
    assert.equal(surfaceStatus.readySurfaceCount, 0);
    assert.equal(surfaceStatus.recommendedNextSurface, null);
    assert.equal(surfaceStatus.recommendedNextFrame, null);
    assert.equal(surfaceStatus.recommendedNextSection, null);
    assert.match(surfaceStatus.recommendedNextSurfaceChecklistPath, /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(nextSurface.activeBlocker.kind, 'none');
    assert.equal(nextSurface.activeBlocker.target, null);
    assert.match(nextSurface.activeBlocker.nextAction, /SUN-11/);
    assert.equal(nextSurface.hasRecommendedSurface, false);
    assert.equal(nextSurface.recommendedSurface, null);
    assert.equal(nextFrame.activeBlocker.kind, 'none');
    assert.equal(nextFrame.activeBlocker.target, null);
    assert.match(nextFrame.activeBlocker.nextAction, /SUN-11/);
    assert.equal(nextFrame.hasRecommendedFrame, false);
    assert.equal(nextFrame.recommendedFrame, null);
    assert.equal(nextSection.hasRecommendedSection, false);
    assert.equal(nextSection.recommendedSection, null);
    assert.equal(nextSurfaceSections.activeBlocker.kind, 'none');
    assert.equal(nextSurfaceSections.activeBlocker.target, null);
    assert.match(nextSurfaceSections.activeBlocker.nextAction, /SUN-11/);
    assert.equal(nextSurfaceSections.hasRecommendedSurface, false);
    assert.equal(nextSurfaceSections.recommendedSurface, null);
    assert.equal(nextSurfaceSections.recommendedNextFrame, null);
    assert.equal(nextSurfaceSections.recommendedNextSection, null);
    assert.equal(nextSurfaceSections.totalFrames, 0);
    assert.equal(nextSurfaceSections.totalSections, 0);
    assert.deepEqual(nextSurfaceSections.frames, []);
    assert.equal(nextSurfaceChecklist.activeBlocker.kind, 'none');
    assert.equal(nextSurfaceChecklist.activeBlocker.target, null);
    assert.match(nextSurfaceChecklist.activeBlocker.nextAction, /SUN-11/);
    assert.equal(nextSurfaceChecklist.hasRecommendedSurface, false);
    assert.equal(nextSurfaceChecklist.recommendedSurface, null);
    assert.equal(nextSurfaceChecklist.recommendedNextFrame, null);
    assert.equal(nextSurfaceChecklist.recommendedNextSection, null);
    assert.equal(nextSurfaceChecklist.totalFrames, 0);
    assert.equal(nextSurfaceChecklist.totalSections, 0);
    assert.deepEqual(nextSurfaceChecklist.frames, []);
    assert.equal(nextSectionAction.hasRecommendedSection, false);
    assert.equal(nextSectionAction.activeBlocker.kind, 'none');
    assert.equal(nextSectionAction.activeBlocker.target, null);
    assert.match(nextSectionAction.activeBlocker.nextAction, /SUN-11|approval board/);
    assert.equal(nextSectionAction.recommendedSurface, null);
    assert.equal(nextSectionAction.recommendedFrame, null);
    assert.equal(nextSectionAction.recommendedSection, null);
    assert.equal(nextSectionAction.checklistFrame, null);
    assert.equal(nextSectionAction.checklistFirstSection, null);
    assert.equal(nextSectionAction.checklistSectionCount, 0);
    assert.deepEqual(nextSectionAction.checklistPreview, []);
    assert.equal(nextSectionAction.fallbackPreview, null);
    assert.equal(gate.gateState, 'READY');
    assert.equal(gate.readyToUnblock, true);
    assert.equal(gate.artifactAuditState, 'PENDING');
    assert.equal(gate.artifactAuditSummary.state, 'PENDING');
    assert.equal(gate.artifactAuditSummary.activeBlockerMismatchCount, null);
    assert.equal(gate.artifactAuditSummary.activeBlockerFilesChecked, null);
    assert.equal(gate.activeBlocker.kind, 'none');
    assert.equal(gate.activeBlocker.target, null);
    assert.match(gate.activeBlocker.nextAction, /SUN-11/);
    assert.equal(closeout.recommendedState, 'Ready to post approval');
    assert.equal(closeout.activeBlocker.kind, 'none');
    assert.equal(closeout.activeBlocker.target, null);
    assert.match(closeout.activeBlocker.nextAction, /SUN-11/);
    assert.equal(closeout.followUp.length > 0, true);
    assert.equal(closeout.handoffNotes.length > 0, true);
    assert.equal(closeout.blockedSurfaceCount, 0);
    assert.equal(closeout.readySurfaceCount, 0);
    assert.equal(closeout.recommendedNextSurface, null);
    assert.equal(closeout.recommendedNextFrame, null);
    assert.equal(closeout.recommendedNextSection, null);
    assert.equal(closeout.recommendedNextSurfaceFrameCount, 0);
    assert.equal(closeout.recommendedNextSurfaceSectionCount, 0);
    assert.match(closeout.recommendedNextSurfaceChecklistPath ?? '', /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(closeout.recommendedNextSurfaceChecklistFirstFrame, null);
    assert.equal(closeout.recommendedNextSurfaceChecklistFirstSection, null);
    assert.match(closeout.recommendedNextSectionActionCardPath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.match(closeout.recommendedNextSectionActionFirstItem ?? '', /No recommended section remains/);
    assert.deepEqual(closeout.recommendedNextSurfaceSectionPreview, []);
    assert.deepEqual(closeout.topBlockedSurfaces, []);
    assert.deepEqual(closeout.topBlockedSections, []);
    assert.deepEqual(closeout.topBlockedFrames, []);
    assert.match(linear.sun10Comment, /unblock SUN-11/);
    assert.equal(linear.activeBlocker.kind, 'none');
    assert.equal(linear.activeBlocker.target, null);
    assert.match(linear.activeBlocker.nextAction, /SUN-11/);
    assert.match(linear.sun11Note, /Implementation can start/);
    assert.match(linear.sun12Note, /Implementation can start/);
    assert.equal(linear.blockedSurfaceCount, 0);
    assert.equal(linear.readySurfaceCount, 0);
    assert.equal(linear.recommendedNextSurface, null);
    assert.equal(linear.recommendedNextFrame, null);
    assert.equal(linear.recommendedNextSection, null);
    assert.equal(linear.recommendedNextSurfaceFrameCount, 0);
    assert.equal(linear.recommendedNextSurfaceSectionCount, 0);
    assert.match(linear.recommendedNextSurfaceChecklistPath ?? '', /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(linear.recommendedNextSurfaceChecklistFirstFrame, null);
    assert.equal(linear.recommendedNextSurfaceChecklistFirstSection, null);
    assert.match(linear.recommendedNextSectionActionCardPath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.match(linear.recommendedNextSectionActionFirstItem ?? '', /No recommended section remains/);
    assert.deepEqual(linear.recommendedNextSurfaceSectionPreview, []);
    assert.deepEqual(linear.topBlockedSurfaces, []);
    assert.deepEqual(linear.topBlockedSections, []);
    assert.deepEqual(linear.topBlockedFrames, []);
    assert.equal(approval.readyToUnblock, true);
    assert.equal(approval.activeBlocker.kind, 'none');
    assert.equal(approval.activeBlocker.target, null);
    assert.match(approval.activeBlocker.nextAction, /SUN-11/);
    assert.equal(approval.artifactAuditState, 'PENDING');
    assert.equal(approval.followUp.length > 0, true);
    assert.equal(approval.handoffNotes.length > 0, true);
    assert.equal(approval.blockedSurfaceCount, 0);
    assert.equal(approval.readySurfaceCount, 0);
    assert.equal(approval.recommendedNextSurface, null);
    assert.equal(approval.recommendedNextFrame, null);
    assert.equal(approval.recommendedNextSection, null);
    assert.equal(approval.recommendedNextSurfaceFrameCount, 0);
    assert.equal(approval.recommendedNextSurfaceSectionCount, 0);
    assert.match(approval.recommendedNextSurfaceChecklistPath ?? '', /compare-entry-review-next-surface-checklist\.html$/);
    assert.equal(approval.recommendedNextSurfaceChecklistFirstFrame, null);
    assert.equal(approval.recommendedNextSurfaceChecklistFirstSection, null);
    assert.match(approval.recommendedNextSectionActionCardPath ?? '', /compare-entry-review-next-section-action-card\.html$/);
    assert.match(approval.recommendedNextSectionActionFirstItem ?? '', /No recommended section remains/);
    assert.deepEqual(approval.recommendedNextSurfaceSectionPreview, []);
    assert.deepEqual(approval.topBlockedSurfaces, []);
    assert.deepEqual(approval.topBlockedSections, []);
    assert.deepEqual(approval.topBlockedFrames, []);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('compare entry review finalize runner refreshes archive and latest handoff', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-review-finalize-'));

  try {
    await writeFixtureFiles(artifactDir, 'blocked');

    runShellScript(scriptPaths.finalize, artifactDir);

    const status = await readJson<{ readyToUnblock: boolean }>(
      path.join(artifactDir, 'compare-entry-review-status.json'),
    );
    const approval = await readJson<{ readyToUnblock: boolean; activeBlocker: { kind: string } }>(
      path.join(artifactDir, 'compare-entry-approval-board.json'),
    );
    const closeout = await readJson<{
      activeBlocker: { kind: string };
      figmaRetryPacket: {
        mcpAttemptHistory: { totalAttempts: number; latestOperation: string | null; latestTool: string | null } | null;
      } | null;
    }>(path.join(artifactDir, 'compare-entry-review-closeout-draft.json'));
    const linear = await readJson<{
      activeBlocker: { kind: string };
      figmaRetryPacket: {
        mcpAttemptHistory: { totalAttempts: number; latestOperation: string | null; latestTool: string | null } | null;
      } | null;
    }>(path.join(artifactDir, 'compare-entry-linear-update-draft.json'));
    const approvalJson = await readJson<{
      figmaRetryPacket: {
        mcpAttemptHistory: { totalAttempts: number; latestOperation: string | null; latestTool: string | null } | null;
      } | null;
      links: {
        latestHandoffHtml: string;
        latestHandoffJson: string;
        archiveIndexJson: string;
      };
    }>(path.join(artifactDir, 'compare-entry-approval-board.json'));
    const delta = await readJson<{ hasPreviousSession: boolean; changed: boolean }>(
      path.join(artifactDir, 'compare-entry-review-delta.json'),
    );
    const audit = await readJson<{ auditState: string; missing: string[] }>(
      path.join(artifactDir, 'compare-entry-review-artifact-audit.json'),
    );
    const manifest = await readJson<{ files: string[] }>(
      path.join(artifactDir, 'compare-entry-review-sessions', '2026-03-27-000000-000', 'manifest.json'),
    );
    const latestHandoff = await readFile(
      path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.md'),
      'utf8',
    );
    const latestHandoffHtml = await readFile(
      path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
      'utf8',
    );
    const latestHandoffJson = await readJson<{
      hasSession: boolean;
      session: { sessionId: string; query: string | null };
      currentRecommendedEntry: {
        recommendedNextSurface: string | null;
        recommendedNextFrame: string | null;
        recommendedNextSection: string | null;
        figmaRetryPacketStatus: string | null;
      };
      activeBlocker: { kind: string; target: string | null };
      artifactAuditSummary: {
        state: string;
        activeBlockerMismatchCount: number | null;
        activeBlockerFilesChecked: number | null;
      };
      links: { approvalBoard: string; artifactAudit: string; indexJson: string };
    }>(path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.json'));
    const archiveIndex = await readFile(
      path.join(artifactDir, 'compare-entry-review-sessions', 'index.html'),
      'utf8',
    );
    const archiveIndexJson = await readJson<{
      ok: boolean;
      latestHandoffLinks: Array<{ label: string; href: string }>;
      sessions: Array<{
        sessionId: string;
        recommendedNextSurface: string | null;
        recommendedNextFrame: string | null;
        recommendedNextSection: string | null;
        activeBlocker: {
          kind: string | null;
          target: string | null;
          latestStatus: string | null;
          latestOperation: string | null;
          latestTool: string | null;
        };
        artifactAuditSummary: {
          state: string | null;
          activeBlockerMismatchCount: number | null;
          activeBlockerFilesChecked: number | null;
        };
        links: {
          manifest: string;
          approvalBoard: string;
          artifactAudit: string;
          figmaRetryPacket: string;
        };
      }>;
    }>(path.join(artifactDir, 'compare-entry-review-sessions', 'index.json'));
    const evidenceSummary = await readJson<{
      evidenceState: string;
      gateState: string;
      readyToUnblock: boolean;
      activeBlocker: { kind: string; target: string | null };
      artifactAuditSummary: {
        state: string;
        activeBlockerMismatchCount: number | null;
        activeBlockerFilesChecked: number | null;
      };
      links: {
        approvalBoardJson: string;
        latestHandoffJson: string;
        archiveIndexJson: string;
        manualUiSlicePacket: string;
        figmaCaptureReference: string;
        manualNodeEvidence: string;
        manualNodeApplyCommand: string;
        manualNodeApplyCommandReadiness: string;
        manualUnblockCockpit: string;
        figmaUnblockPlan: string;
      };
      validationCommands: Array<{ command: string; expected: string }>;
    }>(path.join(artifactDir, 'compare-entry-review-evidence-summary.json'));
    const evidenceMarkdown = await readFile(
      path.join(artifactDir, 'compare-entry-review-evidence-summary.md'),
      'utf8',
    );

    assert.equal(status.readyToUnblock, false);
    assert.equal(approval.readyToUnblock, false);
    assert.equal(approval.activeBlocker.kind, 'review-readiness');
    assert.equal(closeout.activeBlocker.kind, 'review-readiness');
    assert.equal(linear.activeBlocker.kind, 'review-readiness');
    assert.equal(closeout.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts, 1);
    assert.equal(closeout.figmaRetryPacket?.mcpAttemptHistory?.latestOperation, 'unspecified');
    assert.equal(linear.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts, 1);
    assert.equal(approvalJson.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts, 1);
    assert.match(approvalJson.links.latestHandoffHtml, /latest-handoff\.html$/);
    assert.match(approvalJson.links.latestHandoffJson, /latest-handoff\.json$/);
    assert.match(approvalJson.links.archiveIndexJson, /index\.json$/);
    assert.equal(delta.hasPreviousSession, false);
    assert.equal(delta.changed, false);
    assert.equal(audit.auditState, 'READY');
    assert.deepEqual(audit.missing, []);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-approval-board.html')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-missing-detail.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-focus-plan.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-frame-progress-board.html')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-section-progress-board.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-surface-queue.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-surface-status-board.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-next-surface-packet.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-next-surface-section-packet.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-next-surface-checklist.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-next-section-action-card.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-next-frame-packet.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-next-section-packet.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-figma-mcp-attempt.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-figma-mcp-attempt.json')), true);
    assert.equal(
      manifest.files.some((file) => file.endsWith('compare-entry-figma-mcp-attempt-history.md')),
      true,
    );
    assert.equal(
      manifest.files.some((file) => file.endsWith('compare-entry-figma-mcp-attempt-history.json')),
      true,
    );
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-figma-retry-packet.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-figma-retry-packet.json')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-manual-ui-slice-packet.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-figma-capture-reference.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-manual-node-evidence.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-manual-node-apply-command.md')), true);
    assert.equal(
      manifest.files.some((file) => file.endsWith('compare-entry-manual-node-apply-command-readiness.md')),
      true,
    );
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-manual-unblock-cockpit.html')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-figma-unblock-plan.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-delta.md')), true);
    assert.equal(manifest.files.some((file) => file.endsWith('compare-entry-review-artifact-audit.md')), true);
    assert.match(latestHandoff, /recommendedNextSurface: `Brand-Musinsa`/);
    assert.match(latestHandoff, /recommendedNextFrame: `CompareEntry\/Desktop\/Brand-Musinsa`/);
    assert.match(latestHandoff, /recommendedNextSection: `TopNav\/Context`/);
    assert.match(latestHandoff, /figmaRetryPacketStatus: `not-current-retry-target`/);
    assert.match(latestHandoff, /activeBlocker: `review-readiness`/);
    assert.match(latestHandoff, /activeBlockerTarget: `Brand-Musinsa -> CompareEntry\/Desktop\/Brand-Musinsa -> TopNav\/Context`/);
    assert.match(latestHandoff, /compare-entry-figma-retry-packet\.md/);
    assert.match(latestHandoff, /artifactAuditState: `READY`/);
    assert.match(latestHandoff, /activeBlockerMismatchCount: `0`/);
    assert.match(latestHandoff, /activeBlockerFilesChecked: `\d+`/);
    assert.match(latestHandoff, /session index json: `.*index\.json`/);
    assert.match(latestHandoffHtml, /Current Recommended Entry/);
    assert.match(latestHandoffHtml, /Active Blocker Summary/);
    assert.match(latestHandoffHtml, /Artifact Audit Summary/);
    assert.match(latestHandoffHtml, /review-readiness/);
    assert.match(latestHandoffHtml, /Blocker Mismatches/);
    assert.match(latestHandoffHtml, /Brand-Musinsa/);
    assert.match(latestHandoffHtml, /CompareEntry\/Desktop\/Brand-Musinsa/);
    assert.match(latestHandoffHtml, /TopNav\/Context/);
    assert.match(latestHandoffHtml, /Next Section Action Card/);
    assert.match(latestHandoffHtml, /Figma MCP Attempt/);
    assert.match(latestHandoffHtml, /Figma MCP Attempt History/);
    assert.match(latestHandoffHtml, /Figma Retry Packet/);
    assert.match(latestHandoffHtml, /Archive Index JSON/);
    assert.match(latestHandoffHtml, /Latest Handoff JSON/);
    assert.equal(latestHandoffJson.hasSession, true);
    assert.equal(latestHandoffJson.session.sessionId, '2026-03-27-000000-000');
    assert.equal(latestHandoffJson.currentRecommendedEntry.recommendedNextSurface, 'Brand-Musinsa');
    assert.equal(latestHandoffJson.currentRecommendedEntry.recommendedNextFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(latestHandoffJson.currentRecommendedEntry.recommendedNextSection, 'TopNav/Context');
    assert.equal(latestHandoffJson.currentRecommendedEntry.figmaRetryPacketStatus, 'not-current-retry-target');
    assert.equal(latestHandoffJson.activeBlocker.kind, 'review-readiness');
    assert.equal(
      latestHandoffJson.activeBlocker.target,
      'Brand-Musinsa -> CompareEntry/Desktop/Brand-Musinsa -> TopNav/Context',
    );
    assert.equal(latestHandoffJson.artifactAuditSummary.state, 'READY');
    assert.equal(latestHandoffJson.artifactAuditSummary.activeBlockerMismatchCount, 0);
    assert.equal((latestHandoffJson.artifactAuditSummary.activeBlockerFilesChecked ?? 0) > 0, true);
    assert.match(latestHandoffJson.links.approvalBoard, /compare-entry-approval-board\.html$/);
    assert.match(latestHandoffJson.links.artifactAudit, /compare-entry-review-artifact-audit\.md$/);
    assert.match(latestHandoffJson.links.indexJson, /index\.json$/);
    const closeoutMarkdown = await readFile(path.join(artifactDir, 'compare-entry-review-closeout-draft.md'), 'utf8');
    const linearMarkdown = await readFile(path.join(artifactDir, 'compare-entry-linear-update-draft.md'), 'utf8');
    assert.match(closeoutMarkdown, /attemptHistoryCount/);
    assert.match(closeoutMarkdown, /Active Blocker/);
    assert.match(closeoutMarkdown, /review-readiness/);
    assert.match(linearMarkdown, /attemptHistoryCount/);
    assert.match(linearMarkdown, /Active Blocker/);
    assert.match(linearMarkdown, /review-readiness/);
    const approvalHtml = await readFile(path.join(artifactDir, 'compare-entry-approval-board.html'), 'utf8');
    assert.match(approvalHtml, /Figma MCP Attempt History/);
    assert.match(approvalHtml, /Latest Handoff JSON/);
    assert.match(approvalHtml, /Archive Index JSON/);
    assert.match(archiveIndex, /Recommended Surface/);
    assert.match(archiveIndex, /Figma Retry Status/);
    assert.match(archiveIndex, /Active Blocker/);
    assert.match(archiveIndex, /Artifact Audit/);
    assert.match(archiveIndex, /Blocker Mismatches/);
    assert.match(archiveIndex, /Blocker Files Checked/);
    assert.match(archiveIndex, /Latest Handoff Board/);
    assert.match(archiveIndex, /Latest Handoff Markdown/);
    assert.match(archiveIndex, /Latest Handoff JSON/);
    assert.match(archiveIndex, /Archive Index JSON/);
    assert.match(archiveIndex, /latest-handoff\.html/);
    assert.match(archiveIndex, /latest-handoff\.md/);
    assert.match(archiveIndex, /latest-handoff\.json/);
    assert.match(archiveIndex, /index\.json/);
    assert.match(archiveIndex, /review-readiness/);
    assert.match(archiveIndex, /READY/);
    assert.match(archiveIndex, /not-current-retry-target/);
    assert.match(archiveIndex, /Brand-Musinsa/);
    assert.match(archiveIndex, /CompareEntry\/Desktop\/Brand-Musinsa/);
    assert.match(archiveIndex, /TopNav\/Context/);
    assert.match(archiveIndex, /next section action/);
    assert.match(archiveIndex, /figma mcp attempt/);
    assert.match(archiveIndex, /figma mcp attempt history/);
    assert.match(archiveIndex, /figma retry/);
    assert.equal(archiveIndexJson.ok, true);
    assert.equal(archiveIndexJson.latestHandoffLinks.some((link) => link.href === 'latest-handoff.json'), true);
    assert.equal(archiveIndexJson.latestHandoffLinks.some((link) => link.href === 'index.json'), true);
    assert.equal(archiveIndexJson.sessions[0]?.sessionId, '2026-03-27-000000-000');
    assert.equal(archiveIndexJson.sessions[0]?.recommendedNextSurface, 'Brand-Musinsa');
    assert.equal(archiveIndexJson.sessions[0]?.recommendedNextFrame, 'CompareEntry/Desktop/Brand-Musinsa');
    assert.equal(archiveIndexJson.sessions[0]?.recommendedNextSection, 'TopNav/Context');
    assert.equal(archiveIndexJson.sessions[0]?.activeBlocker.kind, 'review-readiness');
    assert.equal(archiveIndexJson.sessions[0]?.activeBlocker.latestStatus, null);
    assert.equal(archiveIndexJson.sessions[0]?.activeBlocker.latestOperation, null);
    assert.equal(archiveIndexJson.sessions[0]?.activeBlocker.latestTool, null);
    assert.equal(archiveIndexJson.sessions[0]?.artifactAuditSummary.state, 'READY');
    assert.equal(archiveIndexJson.sessions[0]?.artifactAuditSummary.activeBlockerMismatchCount, 0);
    assert.equal((archiveIndexJson.sessions[0]?.artifactAuditSummary.activeBlockerFilesChecked ?? 0) > 0, true);
    assert.match(archiveIndexJson.sessions[0]?.links.manifest ?? '', /manifest\.json$/);
    assert.match(archiveIndexJson.sessions[0]?.links.approvalBoard ?? '', /compare-entry-approval-board\.html$/);
    assert.match(archiveIndexJson.sessions[0]?.links.artifactAudit ?? '', /compare-entry-review-artifact-audit\.md$/);
    assert.match(archiveIndexJson.sessions[0]?.links.figmaRetryPacket ?? '', /compare-entry-figma-retry-packet\.md$/);
    assert.equal(evidenceSummary.evidenceState, 'READY');
    assert.equal(evidenceSummary.gateState, 'BLOCKED');
    assert.equal(evidenceSummary.readyToUnblock, false);
    assert.equal(evidenceSummary.activeBlocker.kind, 'review-readiness');
    assert.equal(
      evidenceSummary.activeBlocker.target,
      'Brand-Musinsa -> CompareEntry/Desktop/Brand-Musinsa -> TopNav/Context',
    );
    assert.equal(evidenceSummary.artifactAuditSummary.state, 'READY');
    assert.equal(evidenceSummary.artifactAuditSummary.activeBlockerMismatchCount, 0);
    assert.equal((evidenceSummary.artifactAuditSummary.activeBlockerFilesChecked ?? 0) > 0, true);
    assert.match(evidenceSummary.links.approvalBoardJson, /compare-entry-approval-board\.json$/);
    assert.match(evidenceSummary.links.latestHandoffJson, /latest-handoff\.json$/);
    assert.match(evidenceSummary.links.archiveIndexJson, /index\.json$/);
    assert.match(evidenceSummary.links.manualUiSlicePacket, /compare-entry-manual-ui-slice-packet\.md$/);
    assert.match(evidenceSummary.links.figmaCaptureReference, /compare-entry-figma-capture-reference\.md$/);
    assert.match(evidenceSummary.links.manualNodeEvidence, /compare-entry-manual-node-evidence\.md$/);
    assert.match(evidenceSummary.links.manualNodeApplyCommand, /compare-entry-manual-node-apply-command\.md$/);
    assert.match(
      evidenceSummary.links.manualNodeApplyCommandReadiness,
      /compare-entry-manual-node-apply-command-readiness\.md$/,
    );
    assert.match(evidenceSummary.links.manualUnblockCockpit, /compare-entry-manual-unblock-cockpit\.html$/);
    assert.match(evidenceSummary.links.figmaUnblockPlan, /compare-entry-figma-unblock-plan\.md$/);
    assert.equal(
      evidenceSummary.validationCommands.some((entry) =>
        entry.command.includes('ntl:compare-entry-review-ready-check'),
      ),
      true,
    );
    assert.match(evidenceMarkdown, /Compare Entry Review Evidence Summary/);
    assert.match(evidenceMarkdown, /archive index json/);
    assert.match(evidenceMarkdown, /manual UI slice packet/);
    assert.match(evidenceMarkdown, /Figma capture reference/);
    assert.match(evidenceMarkdown, /manual node evidence/);
    assert.match(evidenceMarkdown, /manual node apply command/);
    assert.match(evidenceMarkdown, /manual node apply command readiness/);
    assert.match(evidenceMarkdown, /manual unblock cockpit/);
    assert.match(evidenceMarkdown, /Figma unblock plan/);
    assert.match(evidenceMarkdown, /npm run ntl:compare-entry-review-ready-check/);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('compare entry review ready-check runner fails for blocked state and passes for ready state', async () => {
  const blockedArtifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-ready-check-blocked-'));
  const readyArtifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-ready-check-ready-'));

  try {
    await writeFixtureFiles(blockedArtifactDir, 'blocked');
    const blockedResult = runShellScript(scriptPaths.readyCheck, blockedArtifactDir, 1);

    await writeFixtureFiles(readyArtifactDir, 'ready');
    const readyResult = runShellScript(scriptPaths.readyCheck, readyArtifactDir, 0);

    const readyGate = await readJson<{ gateState: string; readyToUnblock: boolean }>(
      path.join(readyArtifactDir, 'compare-entry-review-gate.json'),
    );
    assert.match(blockedResult.stdout, /Compare entry review ready check blocked/);
    assert.match(blockedResult.stdout, /artifactAuditState: READY/);
    assert.match(blockedResult.stdout, /activeBlockerMismatchCount: 0/);
    assert.match(blockedResult.stdout, /activeBlockerFilesChecked: \d+/);
    assert.match(blockedResult.stdout, /activeBlocker: review-readiness/);
    assert.match(blockedResult.stdout, /nextAction:/);
    assert.match(readyResult.stdout, /Compare entry review ready check passed/);
    assert.match(readyResult.stdout, /artifactAuditState: READY/);
    assert.match(readyResult.stdout, /activeBlockerMismatchCount: 0/);
    assert.match(readyResult.stdout, /activeBlocker: none/);
    assert.equal(readyGate.gateState, 'READY');
    assert.equal(readyGate.readyToUnblock, true);
  } finally {
    await rm(blockedArtifactDir, { recursive: true, force: true });
    await rm(readyArtifactDir, { recursive: true, force: true });
  }
});

test('compare entry review delta compares the latest session against the previous archived session', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-review-delta-'));

  try {
    await writeFixtureFiles(artifactDir, 'blocked', {
      generatedAt: '2026-03-27T00:00:00.000Z',
      displayedCount: 10,
    });
    runShellScript(scriptPaths.finalize, artifactDir);

    await writeFixtureFiles(artifactDir, 'ready', {
      generatedAt: '2026-03-27T01:00:00.000Z',
      displayedCount: 16,
    });
    runShellScript(scriptPaths.finalize, artifactDir);
    runScript(scriptPaths.delta, artifactDir);

    const delta = await readJson<{
      hasPreviousSession: boolean;
      changed: boolean;
      readyToUnblock: boolean;
      currentSessionId: string;
      previousSessionId: string;
      changedFields: Array<{ key: string }>;
    }>(path.join(artifactDir, 'compare-entry-review-delta.json'));
    const latestSessionDelta = await readJson<{ currentSessionId: string }>(
      path.join(
        artifactDir,
        'compare-entry-review-sessions',
        '2026-03-27-010000-000',
        'compare-entry-review-delta.json',
      ),
    );

    assert.equal(delta.hasPreviousSession, true);
    assert.equal(delta.changed, true);
    assert.equal(delta.readyToUnblock, true);
    assert.equal(delta.currentSessionId, '2026-03-27-010000-000');
    assert.equal(delta.previousSessionId, '2026-03-27-000000-000');
    assert.equal(delta.changedFields.some((entry) => entry.key === 'displayedCount'), true);
    assert.equal(delta.changedFields.some((entry) => entry.key === 'gateState'), true);
    assert.equal(delta.changedFields.some((entry) => entry.key === 'activeBlockerKind'), true);
    assert.equal(delta.changedFields.some((entry) => entry.key === 'activeBlockerTarget'), true);
    assert.equal(delta.changedFields.some((entry) => entry.key === 'activeBlockerLatestStatus'), false);
    assert.equal(delta.changedFields.some((entry) => entry.key === 'activeBlockerLatestOperation'), false);
    assert.equal(latestSessionDelta.currentSessionId, '2026-03-27-010000-000');
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('compare entry review artifact audit fails when a required artifact is missing', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-review-audit-'));

  try {
    await writeFixtureFiles(artifactDir, 'ready');
    runShellScript(scriptPaths.finalize, artifactDir);

    await rm(path.join(artifactDir, 'compare-entry-review-delta.md'), { force: true });
    runScript(scriptPaths.audit, artifactDir, [], 1);

    const audit = await readJson<{
      auditState: string;
      missing: string[];
      activeBlockerFilesChecked: number;
      activeBlockerFieldsChecked: string[];
      activeBlockerMismatchCount: number;
    }>(
      path.join(artifactDir, 'compare-entry-review-artifact-audit.json'),
    );

    assert.equal(audit.auditState, 'BROKEN');
    assert.equal(audit.activeBlockerFilesChecked > 0, true);
    assert.equal(audit.activeBlockerFieldsChecked.includes('kind'), true);
    assert.equal(audit.activeBlockerMismatchCount, 0);
    assert.equal(
      audit.missing.some((entry) => entry.endsWith('compare-entry-review-delta.md')),
      true,
    );
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('compare entry review artifact audit fails when active blocker artifacts diverge', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-review-blocker-audit-'));

  try {
    await writeFixtureFiles(artifactDir, 'ready');
    runShellScript(scriptPaths.finalize, artifactDir);

    const nextSurfacePacketPath = path.join(artifactDir, 'compare-entry-review-next-surface-packet.json');
    const nextSurfacePacket = await readJson<{
      activeBlocker: { kind: string; target: string | null };
    }>(nextSurfacePacketPath);
    nextSurfacePacket.activeBlocker = {
      ...nextSurfacePacket.activeBlocker,
      kind: 'stale-blocker',
      target: 'Stale -> Surface',
    };
    await writeFile(nextSurfacePacketPath, JSON.stringify(nextSurfacePacket, null, 2) + '\n', 'utf8');

    const latestHandoffJsonPath = path.join(
      artifactDir,
      'compare-entry-review-sessions',
      'latest-handoff.json',
    );
    const latestHandoffJson = await readJson<{
      activeBlocker: { kind: string; target: string | null };
    }>(latestHandoffJsonPath);
    latestHandoffJson.activeBlocker = {
      ...latestHandoffJson.activeBlocker,
      kind: 'stale-handoff-json',
      target: 'Stale -> Handoff JSON',
    };
    await writeFile(latestHandoffJsonPath, JSON.stringify(latestHandoffJson, null, 2) + '\n', 'utf8');

    const archiveIndexJsonPath = path.join(
      artifactDir,
      'compare-entry-review-sessions',
      'index.json',
    );
    const archiveIndexJson = await readJson<{
      sessions: Array<{ activeBlocker: { kind: string; target: string | null } }>;
    }>(archiveIndexJsonPath);
    archiveIndexJson.sessions[0].activeBlocker = {
      ...archiveIndexJson.sessions[0].activeBlocker,
      kind: 'stale-archive-index-json',
      target: 'Stale -> Archive Index JSON',
    };
    await writeFile(archiveIndexJsonPath, JSON.stringify(archiveIndexJson, null, 2) + '\n', 'utf8');

    runScript(scriptPaths.audit, artifactDir, [], 1);

    const audit = await readJson<{
      auditState: string;
      activeBlockerFilesChecked: number;
      activeBlockerFieldsChecked: string[];
      activeBlockerMismatchCount: number;
      activeBlockerMismatches: Array<{ file: string; field: string; expected: string | null; actual: string | null }>;
      nextActions: string[];
    }>(path.join(artifactDir, 'compare-entry-review-artifact-audit.json'));

    assert.equal(audit.auditState, 'BROKEN');
    assert.equal(audit.activeBlockerFilesChecked > 0, true);
    assert.deepEqual(audit.activeBlockerFieldsChecked, [
      'kind',
      'target',
      'latestStatus',
      'latestOperation',
      'latestTool',
    ]);
    assert.equal(audit.activeBlockerMismatchCount, audit.activeBlockerMismatches.length);
    assert.equal(
      audit.activeBlockerMismatches.some(
        (entry) =>
          entry.file.endsWith('compare-entry-review-next-surface-packet.json') &&
          entry.field === 'kind' &&
          entry.expected === 'none' &&
          entry.actual === 'stale-blocker',
      ),
      true,
    );
    assert.equal(
      audit.activeBlockerMismatches.some(
        (entry) =>
          entry.file.endsWith('compare-entry-review-next-surface-packet.json') &&
          entry.field === 'target' &&
          entry.expected === null &&
          entry.actual === 'Stale -> Surface',
      ),
      true,
    );
    assert.equal(
      audit.activeBlockerMismatches.some(
        (entry) =>
          entry.file.endsWith(path.join('compare-entry-review-sessions', 'latest-handoff.json')) &&
          entry.field === 'kind' &&
          entry.expected === 'none' &&
          entry.actual === 'stale-handoff-json',
      ),
      true,
    );
    assert.equal(
      audit.activeBlockerMismatches.some(
        (entry) =>
          entry.file.endsWith(path.join('compare-entry-review-sessions', 'index.json')) &&
          entry.field === 'kind' &&
          entry.expected === 'none' &&
          entry.actual === 'stale-archive-index-json',
      ),
      true,
    );
    assert.equal(
      audit.activeBlockerMismatches.some(
        (entry) =>
          entry.file.endsWith(path.join('compare-entry-review-sessions', 'index.json')) &&
          entry.field === 'target' &&
          entry.expected === null &&
          entry.actual === 'Stale -> Archive Index JSON',
      ),
      true,
    );
    assert.equal(
      audit.activeBlockerMismatches.some(
        (entry) =>
          entry.file.endsWith(path.join('compare-entry-review-sessions', 'latest-handoff.json')) &&
          entry.field === 'target' &&
          entry.expected === null &&
          entry.actual === 'Stale -> Handoff JSON',
      ),
      true,
    );
    assert.equal(
      audit.nextActions.some((entry) => entry.includes('all activeBlocker-bearing review artifacts')),
      true,
    );
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});

test('compare entry review gate stays blocked when artifact audit is broken', async () => {
  const artifactDir = await mkdtemp(path.join(os.tmpdir(), 'compare-entry-gate-audit-blocked-'));

  try {
    await writeFixtureFiles(artifactDir, 'ready');
    runShellScript(scriptPaths.finalize, artifactDir);

    await rm(path.join(artifactDir, 'compare-entry-review-delta.md'), { force: true });
    runScript(scriptPaths.audit, artifactDir, [], 1);
    runScript(scriptPaths.gate, artifactDir);
    runScript(scriptPaths.gate, artifactDir, ['--strict'], 1);
    runScript(scriptPaths.approval, artifactDir);

    const gate = await readJson<{
      gateState: string;
      readyToUnblock: boolean;
      artifactAuditState: string;
      artifactAuditSummary: {
        state: string;
        missingCount: number | null;
        activeBlockerMismatchCount: number | null;
        activeBlockerFilesChecked: number | null;
      };
      activeBlocker: { kind: string; latestOperation: string | null; evidencePath: string | null };
      missing: string[];
    }>(path.join(artifactDir, 'compare-entry-review-gate.json'));
    const approval = await readJson<{
      readyToUnblock: boolean;
      activeBlocker: { kind: string; latestOperation: string | null; evidencePath: string | null };
      artifactAuditState: string;
      artifactAuditSummary: {
        state: string;
        missingCount: number | null;
        activeBlockerMismatchCount: number | null;
        activeBlockerFilesChecked: number | null;
      };
      artifactAuditMissing: string[];
    }>(path.join(artifactDir, 'compare-entry-approval-board.json'));

    assert.equal(gate.gateState, 'BLOCKED');
    assert.equal(gate.readyToUnblock, false);
    assert.equal(gate.artifactAuditState, 'BROKEN');
    assert.equal(gate.artifactAuditSummary.state, 'BROKEN');
    assert.equal((gate.artifactAuditSummary.missingCount ?? 0) > 0, true);
    assert.equal(gate.artifactAuditSummary.activeBlockerMismatchCount, 0);
    assert.equal(gate.artifactAuditSummary.activeBlockerFilesChecked > 0, true);
    assert.equal(gate.missing.includes('artifact audit is broken'), true);
    assert.equal(gate.activeBlocker.kind, 'artifact-audit');
    assert.equal(gate.activeBlocker.latestOperation, 'artifact-audit');
    assert.equal(gate.activeBlocker.evidencePath, 'compare-entry-review-artifact-audit.md');
    assert.equal(approval.readyToUnblock, false);
    assert.equal(approval.activeBlocker.kind, 'artifact-audit');
    assert.equal(approval.activeBlocker.latestOperation, 'artifact-audit');
    assert.equal(approval.activeBlocker.evidencePath, 'compare-entry-review-artifact-audit.md');
    assert.equal(approval.artifactAuditState, 'BROKEN');
    assert.equal(approval.artifactAuditSummary.state, 'BROKEN');
    assert.equal(approval.artifactAuditSummary.activeBlockerMismatchCount, 0);
    assert.equal(approval.artifactAuditSummary.activeBlockerFilesChecked > 0, true);
    assert.equal(
      approval.artifactAuditMissing.some((entry) => entry.endsWith('compare-entry-review-delta.md')),
      true,
    );
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
});
