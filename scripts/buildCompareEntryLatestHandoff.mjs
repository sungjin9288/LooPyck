import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');
const sessionsDir = path.join(artifactDir, 'compare-entry-review-sessions');
const outputPath = path.join(sessionsDir, 'latest-handoff.md');
const htmlOutputPath = path.join(sessionsDir, 'latest-handoff.html');
const jsonOutputPath = path.join(sessionsDir, 'latest-handoff.json');

async function findLatestSession() {
  const entries = await readdir(sessionsDir, { withFileTypes: true });
  const sessionNames = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => b.localeCompare(a));

  for (const sessionName of sessionNames) {
    const manifestPath = path.join(sessionsDir, sessionName, 'manifest.json');
    try {
      const manifestRaw = await readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestRaw);
      return {
        sessionName,
        manifestPath,
        manifest,
      };
    } catch {
      // Ignore incomplete session directories.
    }
  }

  return null;
}

function buildArtifactLinks(sessionName) {
  const baseDir = path.join(sessionsDir, sessionName);
  return {
    manifest: path.join(baseDir, 'manifest.json'),
    board: path.join(baseDir, 'compare-entry-design-review-board.html'),
    packet: path.join(baseDir, 'compare-entry-design-review-packet.md'),
    worksheet: path.join(baseDir, 'compare-entry-design-review-worksheet.md'),
    decisionLog: path.join(baseDir, 'compare-entry-design-review-decision-log.md'),
    manualPacket: path.join(baseDir, 'compare-entry-manual-figma-packet.html'),
    frameSpecs: path.join(baseDir, 'compare-entry-manual-frame-specs.md'),
    buildWorksheet: path.join(baseDir, 'compare-entry-manual-build-worksheet.md'),
    index: path.join(sessionsDir, 'index.html'),
    indexJson: path.join(sessionsDir, 'index.json'),
    statusBoard: path.join(artifactDir, 'compare-entry-review-status-board.html'),
    statusJson: path.join(artifactDir, 'compare-entry-review-status.json'),
    missingDetail: path.join(artifactDir, 'compare-entry-review-missing-detail.md'),
    missingDetailJson: path.join(artifactDir, 'compare-entry-review-missing-detail.json'),
    focusPlan: path.join(artifactDir, 'compare-entry-review-focus-plan.md'),
    focusPlanJson: path.join(artifactDir, 'compare-entry-review-focus-plan.json'),
    frameProgress: path.join(artifactDir, 'compare-entry-review-frame-progress-board.html'),
    frameProgressJson: path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
    sectionProgress: path.join(artifactDir, 'compare-entry-review-section-progress-board.md'),
    sectionProgressHtml: path.join(artifactDir, 'compare-entry-review-section-progress-board.html'),
    sectionProgressJson: path.join(artifactDir, 'compare-entry-review-section-progress-board.json'),
    surfaceQueue: path.join(artifactDir, 'compare-entry-review-surface-queue.md'),
    surfaceQueueHtml: path.join(artifactDir, 'compare-entry-review-surface-queue.html'),
    surfaceQueueJson: path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
    surfaceStatus: path.join(artifactDir, 'compare-entry-review-surface-status-board.md'),
    surfaceStatusHtml: path.join(artifactDir, 'compare-entry-review-surface-status-board.html'),
    surfaceStatusJson: path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
    nextSurfacePacket: path.join(artifactDir, 'compare-entry-review-next-surface-packet.md'),
    nextSurfacePacketHtml: path.join(artifactDir, 'compare-entry-review-next-surface-packet.html'),
    nextSurfacePacketJson: path.join(artifactDir, 'compare-entry-review-next-surface-packet.json'),
    nextSurfaceSectionPacket: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.md'),
    nextSurfaceSectionPacketHtml: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.html'),
    nextSurfaceSectionPacketJson: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.json'),
    nextSurfaceChecklist: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.md'),
    nextSurfaceChecklistHtml: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.html'),
    nextSurfaceChecklistJson: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'),
    nextSectionActionCard: path.join(artifactDir, 'compare-entry-review-next-section-action-card.md'),
    nextSectionActionCardHtml: path.join(
      artifactDir,
      'compare-entry-review-next-section-action-card.html',
    ),
    nextSectionActionCardJson: path.join(
      artifactDir,
      'compare-entry-review-next-section-action-card.json',
    ),
    figmaMcpAttempt: path.join(artifactDir, 'compare-entry-figma-mcp-attempt.md'),
    figmaMcpAttemptJson: path.join(artifactDir, 'compare-entry-figma-mcp-attempt.json'),
    figmaMcpAttemptHistory: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.md'),
    figmaMcpAttemptHistoryJson: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.json'),
    sessionFigmaMcpAttempt: path.join(baseDir, 'compare-entry-figma-mcp-attempt.md'),
    sessionFigmaMcpAttemptJson: path.join(baseDir, 'compare-entry-figma-mcp-attempt.json'),
    sessionFigmaMcpAttemptHistory: path.join(baseDir, 'compare-entry-figma-mcp-attempt-history.md'),
    sessionFigmaMcpAttemptHistoryJson: path.join(baseDir, 'compare-entry-figma-mcp-attempt-history.json'),
    nextFramePacket: path.join(artifactDir, 'compare-entry-review-next-frame-packet.md'),
    nextFramePacketHtml: path.join(artifactDir, 'compare-entry-review-next-frame-packet.html'),
    nextFramePacketJson: path.join(artifactDir, 'compare-entry-review-next-frame-packet.json'),
    nextSectionPacket: path.join(artifactDir, 'compare-entry-review-next-section-packet.md'),
    nextSectionPacketHtml: path.join(artifactDir, 'compare-entry-review-next-section-packet.html'),
    nextSectionPacketJson: path.join(artifactDir, 'compare-entry-review-next-section-packet.json'),
    closeoutDraft: path.join(artifactDir, 'compare-entry-review-closeout-draft.md'),
    closeoutJson: path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
    gateDraft: path.join(artifactDir, 'compare-entry-review-gate.md'),
    gateJson: path.join(artifactDir, 'compare-entry-review-gate.json'),
    deltaDraft: path.join(artifactDir, 'compare-entry-review-delta.md'),
    deltaJson: path.join(artifactDir, 'compare-entry-review-delta.json'),
    artifactAudit: path.join(artifactDir, 'compare-entry-review-artifact-audit.md'),
    artifactAuditJson: path.join(artifactDir, 'compare-entry-review-artifact-audit.json'),
    sessionArtifactAudit: path.join(baseDir, 'compare-entry-review-artifact-audit.md'),
    sessionArtifactAuditJson: path.join(baseDir, 'compare-entry-review-artifact-audit.json'),
    linearUpdateDraft: path.join(artifactDir, 'compare-entry-linear-update-draft.md'),
    linearUpdateText: path.join(artifactDir, 'compare-entry-linear-update-draft.txt'),
    linearUpdateJson: path.join(artifactDir, 'compare-entry-linear-update-draft.json'),
    approvalBoard: path.join(artifactDir, 'compare-entry-approval-board.html'),
    approvalBoardJson: path.join(artifactDir, 'compare-entry-approval-board.json'),
    figmaRetryPacket: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
    figmaRetryPacketJson: path.join(artifactDir, 'compare-entry-figma-retry-packet.json'),
    sessionFigmaRetryPacket: path.join(baseDir, 'compare-entry-figma-retry-packet.md'),
    sessionFigmaRetryPacketJson: path.join(baseDir, 'compare-entry-figma-retry-packet.json'),
  };
}

async function main() {
  await mkdir(sessionsDir, { recursive: true });
  const latest = await findLatestSession();

  if (!latest) {
    const emptyState = `# Compare Entry Latest Handoff\n\nNo archived review session found yet.\n`;
    await writeFile(outputPath, emptyState, 'utf8');
    await writeFile(
      htmlOutputPath,
      '<!doctype html><html lang="ko"><body><main><h1>Compare Entry Latest Handoff</h1><p>No archived review session found yet.</p></main></body></html>',
      'utf8',
    );
    await writeFile(
      jsonOutputPath,
      JSON.stringify(
        {
          ok: true,
          hasSession: false,
          session: null,
          currentRecommendedEntry: null,
          activeBlocker: null,
          artifactAuditSummary: null,
          links: {},
        },
        null,
        2,
      ) + '\n',
      'utf8',
    );
    process.stdout.write(
      JSON.stringify(
        {
          ok: true,
          outputPath,
          htmlOutputPath,
          jsonOutputPath,
          hasSession: false,
        },
        null,
        2,
      ) + '\n',
    );
    return;
  }

  const links = buildArtifactLinks(latest.sessionName);
  const { manifest } = latest;
  let status = null;
  let surfaceStatus = null;
  let figmaRetryPacket = null;
  let gate = null;
  let artifactAudit = null;
  try {
    status = JSON.parse(await readFile(links.statusJson, 'utf8'));
  } catch {
    status = null;
  }
  try {
    surfaceStatus = JSON.parse(await readFile(links.surfaceStatusJson, 'utf8'));
  } catch {
    surfaceStatus = null;
  }
  try {
    figmaRetryPacket = JSON.parse(await readFile(links.figmaRetryPacketJson, 'utf8'));
  } catch {
    figmaRetryPacket = null;
  }
  try {
    gate = JSON.parse(await readFile(links.gateJson, 'utf8'));
  } catch {
    gate = null;
  }
  try {
    artifactAudit = JSON.parse(await readFile(links.artifactAuditJson, 'utf8'));
  } catch {
    artifactAudit = null;
  }
  const recommendedNextSurface = surfaceStatus?.recommendedNextSurface ?? status?.recommendedNextSurface ?? null;
  const recommendedNextFrame = surfaceStatus?.recommendedNextFrame ?? status?.recommendedNextFrame ?? null;
  const recommendedNextSection = surfaceStatus?.recommendedNextSection ?? status?.recommendedNextSection ?? null;
  const recommendedNextSurfaceChecklistPath =
    surfaceStatus?.recommendedNextSurfaceChecklistPath ??
    status?.recommendedNextSurfaceChecklistPath ??
    links.nextSurfaceChecklistHtml;
  const activeBlocker = gate?.activeBlocker ?? null;
  const artifactAuditSummary = gate?.artifactAuditSummary ?? {
    state: artifactAudit?.auditState ?? 'PENDING',
    ready: artifactAudit?.auditState === 'READY',
    missingCount: Array.isArray(artifactAudit?.missing) ? artifactAudit.missing.length : null,
    activeBlockerMismatchCount: artifactAudit?.activeBlockerMismatchCount ?? null,
    activeBlockerFilesChecked: artifactAudit?.activeBlockerFilesChecked ?? null,
    activeBlockerFieldsChecked: artifactAudit?.activeBlockerFieldsChecked ?? [],
  };
  const handoffJson = {
    ok: true,
    hasSession: true,
    session: {
      sessionId: manifest.sessionId ?? latest.sessionName,
      generatedAt: manifest.generatedAt ?? null,
      baseUrl: manifest.baseUrl ?? null,
      query: manifest.query ?? null,
      displayedCount: manifest.displayedCount ?? null,
    },
    currentRecommendedEntry: {
      recommendedNextSurface,
      recommendedNextFrame,
      recommendedNextSection,
      recommendedNextSurfaceChecklistPath,
      figmaRetryPacketStatus: figmaRetryPacket?.status ?? null,
      figmaRetryPacketReady: Boolean(figmaRetryPacket?.retryReady),
      figmaRetryPacketPath: links.figmaRetryPacket,
    },
    activeBlocker,
    artifactAuditSummary,
    links,
    commands: {
      refresh: 'npm run ntl:compare-entry-review-prep',
      status: [
        'npm run ntl:compare-entry-review-status',
        'npm run ntl:compare-entry-review-frame-progress',
        'npm run ntl:compare-entry-review-section-progress',
        'npm run ntl:compare-entry-review-surface-queue',
        'npm run ntl:compare-entry-review-surface-status',
        'npm run ntl:compare-entry-review-next-surface',
        'npm run ntl:compare-entry-review-next-surface-sections',
        'npm run ntl:compare-entry-review-next-surface-checklist',
        'npm run ntl:compare-entry-review-next-frame',
        'npm run ntl:compare-entry-review-next-section',
        'npm run ntl:compare-entry-review-closeout',
        'npm run ntl:compare-entry-review-gate',
        'npm run ntl:compare-entry-review-delta',
        'npm run ntl:compare-entry-review-artifact-audit',
        'npm run ntl:compare-entry-linear-update',
        'npm run ntl:compare-entry-approval-board',
        'npm run ntl:compare-entry-review-finalize',
        'npm run ntl:compare-entry-review-ready-check',
      ],
    },
    handoffRule: [
      'SUN-10 manual frame build must use the latest session artifacts.',
      'Do not start SUN-11 / SUN-12 before Approved or Approved With Follow-up is recorded.',
    ],
  };

  const markdown = `# Compare Entry Latest Handoff

## Latest Session

- sessionId: \`${manifest.sessionId ?? latest.sessionName}\`
- generatedAt: \`${manifest.generatedAt ?? 'unknown'}\`
- baseUrl: \`${manifest.baseUrl ?? 'unknown'}\`
- query: \`${manifest.query ?? 'unknown'}\`
- displayedCount: \`${manifest.displayedCount ?? 'unknown'}\`

## Current Recommended Entry

- recommendedNextSurface: \`${recommendedNextSurface ?? 'none'}\`
- recommendedNextFrame: \`${recommendedNextFrame ?? 'none'}\`
- recommendedNextSection: \`${recommendedNextSection ?? 'none'}\`
- recommendedNextSurfaceChecklistPath: \`${recommendedNextSurfaceChecklistPath}\`
- figmaRetryPacketStatus: \`${figmaRetryPacket?.status ?? 'none'}\`
- figmaRetryPacketReady: \`${figmaRetryPacket?.retryReady ? 'true' : 'false'}\`
- figmaRetryPacketPath: \`${links.figmaRetryPacket}\`
- activeBlocker: \`${activeBlocker?.kind ?? 'none'}\`
- activeBlockerTarget: \`${activeBlocker?.target ?? 'none'}\`
- activeBlockerLatestStatus: \`${activeBlocker?.latestStatus ?? 'none'}\`
- activeBlockerLatestOperation: \`${activeBlocker?.latestOperation ?? 'none'}\`
- activeBlockerEvidencePath: \`${activeBlocker?.evidencePath ?? 'none'}\`
- activeBlockerNextAction: \`${activeBlocker?.nextAction ?? 'none'}\`
- artifactAuditState: \`${artifactAuditSummary.state ?? 'PENDING'}\`
- artifactAuditMissingCount: \`${artifactAuditSummary.missingCount ?? 'unknown'}\`
- activeBlockerMismatchCount: \`${artifactAuditSummary.activeBlockerMismatchCount ?? 'unknown'}\`
- activeBlockerFilesChecked: \`${artifactAuditSummary.activeBlockerFilesChecked ?? 'unknown'}\`
- activeBlockerFieldsChecked: \`${(artifactAuditSummary.activeBlockerFieldsChecked ?? []).join(', ') || 'none'}\`

## Open In Order

1. \`${links.manualPacket}\`
2. \`${links.frameSpecs}\`
3. \`${links.buildWorksheet}\`
4. \`${links.board}\`
5. \`${links.worksheet}\`
6. \`${links.decisionLog}\`
7. \`${links.statusBoard}\`
8. \`${links.missingDetail}\`
9. \`${links.focusPlan}\`
10. \`${links.frameProgress}\`
11. \`${links.sectionProgressHtml}\`
12. \`${links.surfaceQueue}\`
13. \`${links.surfaceStatusHtml}\`
14. \`${links.nextSurfacePacketHtml}\`
15. \`${links.nextSurfaceSectionPacketHtml}\`
16. \`${links.nextSurfaceChecklistHtml}\`
17. \`${links.nextSectionActionCardHtml}\`
18. \`${links.figmaRetryPacket}\`
19. \`${links.figmaMcpAttemptHistory}\`
20. \`${links.nextFramePacketHtml}\`
21. \`${links.nextSectionPacketHtml}\`
22. \`${links.deltaDraft}\`
23. \`${links.closeoutDraft}\`
24. \`${links.gateDraft}\`
25. \`${links.linearUpdateDraft}\`
26. \`${links.approvalBoard}\`

## Current Session Artifacts

- manifest: \`${links.manifest}\`
- review board: \`${links.board}\`
- review packet: \`${links.packet}\`
- review worksheet: \`${links.worksheet}\`
- decision log: \`${links.decisionLog}\`
- manual packet: \`${links.manualPacket}\`
- frame specs: \`${links.frameSpecs}\`
- build worksheet: \`${links.buildWorksheet}\`
- current status board: \`${links.statusBoard}\`
- current status json: \`${links.statusJson}\`
- current missing detail: \`${links.missingDetail}\`
- current missing detail json: \`${links.missingDetailJson}\`
- current focus plan: \`${links.focusPlan}\`
- current focus plan json: \`${links.focusPlanJson}\`
- current frame progress board: \`${links.frameProgress}\`
- current frame progress board json: \`${links.frameProgressJson}\`
- current section progress board: \`${links.sectionProgress}\`
- current section progress board html: \`${links.sectionProgressHtml}\`
- current section progress board json: \`${links.sectionProgressJson}\`
- current surface queue: \`${links.surfaceQueue}\`
- current surface queue html: \`${links.surfaceQueueHtml}\`
- current surface queue json: \`${links.surfaceQueueJson}\`
- current surface status board: \`${links.surfaceStatus}\`
- current surface status board html: \`${links.surfaceStatusHtml}\`
- current surface status board json: \`${links.surfaceStatusJson}\`
- current next surface packet: \`${links.nextSurfacePacket}\`
- current next surface packet html: \`${links.nextSurfacePacketHtml}\`
- current next surface packet json: \`${links.nextSurfacePacketJson}\`
- current next surface section packet: \`${links.nextSurfaceSectionPacket}\`
- current next surface section packet html: \`${links.nextSurfaceSectionPacketHtml}\`
- current next surface section packet json: \`${links.nextSurfaceSectionPacketJson}\`
- current next surface checklist: \`${links.nextSurfaceChecklist}\`
- current next surface checklist html: \`${links.nextSurfaceChecklistHtml}\`
- current next surface checklist json: \`${links.nextSurfaceChecklistJson}\`
- current next section action card: \`${links.nextSectionActionCard}\`
- current next section action card html: \`${links.nextSectionActionCardHtml}\`
- current next section action card json: \`${links.nextSectionActionCardJson}\`
- current Figma MCP attempt: \`${links.figmaMcpAttempt}\`
- current Figma MCP attempt json: \`${links.figmaMcpAttemptJson}\`
- current Figma MCP attempt history: \`${links.figmaMcpAttemptHistory}\`
- current Figma MCP attempt history json: \`${links.figmaMcpAttemptHistoryJson}\`
- archived session Figma MCP attempt: \`${links.sessionFigmaMcpAttempt}\`
- archived session Figma MCP attempt json: \`${links.sessionFigmaMcpAttemptJson}\`
- archived session Figma MCP attempt history: \`${links.sessionFigmaMcpAttemptHistory}\`
- archived session Figma MCP attempt history json: \`${links.sessionFigmaMcpAttemptHistoryJson}\`
- current next frame packet: \`${links.nextFramePacket}\`
- current next frame packet html: \`${links.nextFramePacketHtml}\`
- current next frame packet json: \`${links.nextFramePacketJson}\`
- current next section packet: \`${links.nextSectionPacket}\`
- current next section packet html: \`${links.nextSectionPacketHtml}\`
- current next section packet json: \`${links.nextSectionPacketJson}\`
- current closeout draft: \`${links.closeoutDraft}\`
- current closeout json: \`${links.closeoutJson}\`
- current review gate: \`${links.gateDraft}\`
- current review gate json: \`${links.gateJson}\`
- current review delta: \`${links.deltaDraft}\`
- current review delta json: \`${links.deltaJson}\`
- current artifact audit: \`${links.artifactAudit}\`
- current artifact audit json: \`${links.artifactAuditJson}\`
- archived session artifact audit: \`${links.sessionArtifactAudit}\`
- archived session artifact audit json: \`${links.sessionArtifactAuditJson}\`
- current linear update draft: \`${links.linearUpdateDraft}\`
- current linear update text: \`${links.linearUpdateText}\`
- current linear update json: \`${links.linearUpdateJson}\`
- current approval board: \`${links.approvalBoard}\`
- current approval board json: \`${links.approvalBoardJson}\`
- latest handoff json: \`${jsonOutputPath}\`
- current Figma retry packet: \`${links.figmaRetryPacket}\`
- current Figma retry packet json: \`${links.figmaRetryPacketJson}\`
- archived session Figma retry packet: \`${links.sessionFigmaRetryPacket}\`
- archived session Figma retry packet json: \`${links.sessionFigmaRetryPacketJson}\`
- session index: \`${links.index}\`
- session index json: \`${links.indexJson}\`

## Refresh Command

\`\`\`bash
npm run ntl:compare-entry-review-prep
\`\`\`

## Status Command

\`\`\`bash
npm run ntl:compare-entry-review-status
npm run ntl:compare-entry-review-frame-progress
npm run ntl:compare-entry-review-section-progress
npm run ntl:compare-entry-review-surface-queue
npm run ntl:compare-entry-review-surface-status
npm run ntl:compare-entry-review-next-surface
npm run ntl:compare-entry-review-next-surface-sections
npm run ntl:compare-entry-review-next-surface-checklist
npm run ntl:compare-entry-review-next-frame
npm run ntl:compare-entry-review-next-section
npm run ntl:compare-entry-review-closeout
npm run ntl:compare-entry-review-gate
npm run ntl:compare-entry-review-delta
npm run ntl:compare-entry-review-artifact-audit
npm run ntl:compare-entry-linear-update
npm run ntl:compare-entry-approval-board
npm run ntl:compare-entry-review-finalize
npm run ntl:compare-entry-review-ready-check
\`\`\`

## Handoff Rule

- \`SUN-10\` 수동 frame 제작은 항상 이 latest session artifact 기준으로 진행한다.
- \`Approved\` 또는 \`Approved With Follow-up\` 이 기록되기 전에는 \`SUN-11\` / \`SUN-12\` 를 시작하지 않는다.
`;

  await writeFile(outputPath, markdown, 'utf8');
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Latest Handoff</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.94);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, #f4f7fb 30%, #f8fafc 100%);
        color: var(--text);
      }
      main {
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .hero h1 {
        margin: 0 0 10px;
        font-size: 34px;
        line-height: 1.05;
      }
      .hero p, .panel p {
        margin: 0;
        color: var(--muted);
      }
      .summary, .links, .grid-2 {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .links { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .metric, .link-card {
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff;
      }
      .metric strong {
        display: block;
        margin: 0 0 8px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
      }
      .link-card {
        display: grid;
        gap: 8px;
        color: inherit;
        text-decoration: none;
      }
      .link-card:hover { border-color: #94a3b8; }
      h2 {
        margin: 0 0 10px;
        font-size: 18px;
      }
      ol, ul {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 8px;
      }
      code {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        background: #eef2f8;
        padding: 4px 8px;
        border-radius: 10px;
        word-break: break-all;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Latest Handoff</h1>
        <p>최신 archived review session 기준으로 수동 Figma build와 review artifact를 바로 여는 stable handoff board입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Session</strong><span>${manifest.sessionId ?? latest.sessionName}</span></div>
        <div class="metric"><strong>Generated</strong><span>${manifest.generatedAt ?? 'unknown'}</span></div>
        <div class="metric"><strong>Query</strong><span>${manifest.query ?? 'unknown'}</span></div>
        <div class="metric"><strong>Displayed Count</strong><span>${manifest.displayedCount ?? 'unknown'}</span></div>
        <div class="metric"><strong>Recommended Surface</strong><span>${recommendedNextSurface ?? 'none'}</span></div>
        <div class="metric"><strong>Recommended Frame</strong><span>${recommendedNextFrame ?? 'none'}</span></div>
        <div class="metric"><strong>Recommended Section</strong><span>${recommendedNextSection ?? 'none'}</span></div>
        <div class="metric"><strong>Figma Retry Status</strong><span>${figmaRetryPacket?.status ?? 'none'}</span></div>
        <div class="metric"><strong>Figma Retry Ready</strong><span>${figmaRetryPacket?.retryReady ? 'true' : 'false'}</span></div>
        <div class="metric"><strong>Active Blocker</strong><span>${activeBlocker?.kind ?? 'none'}</span></div>
        <div class="metric"><strong>Blocker Latest Status</strong><span>${activeBlocker?.latestStatus ?? 'none'}</span></div>
        <div class="metric"><strong>Artifact Audit</strong><span>${artifactAuditSummary.state ?? 'PENDING'}</span></div>
        <div class="metric"><strong>Blocker Mismatches</strong><span>${artifactAuditSummary.activeBlockerMismatchCount ?? 'unknown'}</span></div>
        <div class="metric"><strong>Blocker Files Checked</strong><span>${artifactAuditSummary.activeBlockerFilesChecked ?? 'unknown'}</span></div>
      </section>

      <section class="panel">
        <h2>Current Recommended Entry</h2>
        <ul>
          <li>surface: <strong>${recommendedNextSurface ?? 'none'}</strong></li>
          <li>frame: <strong>${recommendedNextFrame ?? 'none'}</strong></li>
          <li>section: <strong>${recommendedNextSection ?? 'none'}</strong></li>
          <li>checklist: <code>${recommendedNextSurfaceChecklistPath}</code></li>
          <li>figma retry status: <strong>${figmaRetryPacket?.status ?? 'none'}</strong></li>
          <li>figma retry packet: <code>${links.figmaRetryPacket}</code></li>
        </ul>
      </section>

      <section class="panel">
        <h2>Active Blocker Summary</h2>
        <ul>
          <li>kind: <strong>${activeBlocker?.kind ?? 'none'}</strong></li>
          <li>target: <strong>${activeBlocker?.target ?? 'none'}</strong></li>
          <li>latest status: <strong>${activeBlocker?.latestStatus ?? 'none'}</strong></li>
          <li>latest operation: <strong>${activeBlocker?.latestOperation ?? 'none'}</strong></li>
          <li>latest tool: <strong>${activeBlocker?.latestTool ?? 'none'}</strong></li>
          <li>evidence: <code>${activeBlocker?.evidencePath ?? 'none'}</code></li>
          <li>next action: ${activeBlocker?.nextAction ?? 'none'}</li>
        </ul>
      </section>

      <section class="panel">
        <h2>Artifact Audit Summary</h2>
        <ul>
          <li>state: <strong>${artifactAuditSummary.state ?? 'PENDING'}</strong></li>
          <li>missing count: <strong>${artifactAuditSummary.missingCount ?? 'unknown'}</strong></li>
          <li>active blocker mismatches: <strong>${artifactAuditSummary.activeBlockerMismatchCount ?? 'unknown'}</strong></li>
          <li>active blocker files checked: <strong>${artifactAuditSummary.activeBlockerFilesChecked ?? 'unknown'}</strong></li>
          <li>active blocker fields checked: <strong>${(artifactAuditSummary.activeBlockerFieldsChecked ?? []).join(', ') || 'none'}</strong></li>
        </ul>
      </section>

      <section class="panel">
        <h2>Open In Order</h2>
        <ol>
          <li><code>${links.manualPacket}</code></li>
          <li><code>${links.frameSpecs}</code></li>
          <li><code>${links.buildWorksheet}</code></li>
          <li><code>${links.board}</code></li>
          <li><code>${links.worksheet}</code></li>
          <li><code>${links.decisionLog}</code></li>
          <li><code>${links.statusBoard}</code></li>
          <li><code>${links.missingDetail}</code></li>
          <li><code>${links.focusPlan}</code></li>
          <li><code>${links.frameProgress}</code></li>
          <li><code>${links.sectionProgressHtml}</code></li>
          <li><code>${links.surfaceQueue}</code></li>
          <li><code>${links.surfaceStatusHtml}</code></li>
          <li><code>${links.nextSurfacePacketHtml}</code></li>
          <li><code>${links.nextSurfaceSectionPacketHtml}</code></li>
          <li><code>${links.nextSurfaceChecklistHtml}</code></li>
          <li><code>${links.nextSectionActionCardHtml}</code></li>
          <li><code>${links.figmaRetryPacket}</code></li>
          <li><code>${links.figmaMcpAttemptHistory}</code></li>
          <li><code>${links.nextFramePacketHtml}</code></li>
          <li><code>${links.nextSectionPacketHtml}</code></li>
          <li><code>${links.deltaDraft}</code></li>
          <li><code>${links.closeoutDraft}</code></li>
          <li><code>${links.gateDraft}</code></li>
          <li><code>${links.linearUpdateDraft}</code></li>
          <li><code>${links.approvalBoard}</code></li>
        </ol>
      </section>

      <section class="links">
        <a class="link-card" href="${links.manualPacket}"><strong>Manual Packet</strong><code>${links.manualPacket}</code></a>
        <a class="link-card" href="${links.frameSpecs}"><strong>Frame Specs</strong><code>${links.frameSpecs}</code></a>
        <a class="link-card" href="${links.buildWorksheet}"><strong>Build Worksheet</strong><code>${links.buildWorksheet}</code></a>
        <a class="link-card" href="${links.board}"><strong>Review Board</strong><code>${links.board}</code></a>
        <a class="link-card" href="${links.worksheet}"><strong>Review Worksheet</strong><code>${links.worksheet}</code></a>
        <a class="link-card" href="${links.decisionLog}"><strong>Decision Log</strong><code>${links.decisionLog}</code></a>
        <a class="link-card" href="${links.packet}"><strong>Review Packet</strong><code>${links.packet}</code></a>
        <a class="link-card" href="${links.statusBoard}"><strong>Status Board</strong><code>${links.statusBoard}</code></a>
        <a class="link-card" href="${links.missingDetail}"><strong>Missing Detail</strong><code>${links.missingDetail}</code></a>
        <a class="link-card" href="${links.focusPlan}"><strong>Focus Plan</strong><code>${links.focusPlan}</code></a>
        <a class="link-card" href="${links.frameProgress}"><strong>Frame Progress</strong><code>${links.frameProgress}</code></a>
        <a class="link-card" href="${links.sectionProgressHtml}"><strong>Section Progress</strong><code>${links.sectionProgressHtml}</code></a>
        <a class="link-card" href="${links.surfaceQueueHtml}"><strong>Surface Queue</strong><code>${links.surfaceQueueHtml}</code></a>
        <a class="link-card" href="${links.surfaceStatusHtml}"><strong>Surface Status</strong><code>${links.surfaceStatusHtml}</code></a>
        <a class="link-card" href="${links.nextSurfacePacketHtml}"><strong>Next Surface Packet</strong><code>${links.nextSurfacePacketHtml}</code></a>
        <a class="link-card" href="${links.nextSurfaceSectionPacketHtml}"><strong>Next Surface Sections</strong><code>${links.nextSurfaceSectionPacketHtml}</code></a>
        <a class="link-card" href="${links.nextSurfaceChecklistHtml}"><strong>Next Surface Checklist</strong><code>${links.nextSurfaceChecklistHtml}</code></a>
        <a class="link-card" href="${links.nextSectionActionCardHtml}"><strong>Next Section Action Card</strong><code>${links.nextSectionActionCardHtml}</code></a>
        <a class="link-card" href="${links.figmaMcpAttempt}"><strong>Figma MCP Attempt</strong><code>${links.figmaMcpAttempt}</code></a>
        <a class="link-card" href="${links.figmaMcpAttemptHistory}"><strong>Figma MCP Attempt History</strong><code>${links.figmaMcpAttemptHistory}</code></a>
        <a class="link-card" href="${links.sessionFigmaMcpAttempt}"><strong>Session Figma MCP Attempt</strong><code>${links.sessionFigmaMcpAttempt}</code></a>
        <a class="link-card" href="${links.sessionFigmaMcpAttemptHistory}"><strong>Session Figma MCP Attempt History</strong><code>${links.sessionFigmaMcpAttemptHistory}</code></a>
        <a class="link-card" href="${links.figmaRetryPacket}"><strong>Figma Retry Packet</strong><code>${links.figmaRetryPacket}</code></a>
        <a class="link-card" href="${links.sessionFigmaRetryPacket}"><strong>Session Figma Retry Packet</strong><code>${links.sessionFigmaRetryPacket}</code></a>
        <a class="link-card" href="${links.nextFramePacketHtml}"><strong>Next Frame Packet</strong><code>${links.nextFramePacketHtml}</code></a>
        <a class="link-card" href="${links.nextSectionPacketHtml}"><strong>Next Section Packet</strong><code>${links.nextSectionPacketHtml}</code></a>
        <a class="link-card" href="${links.deltaDraft}"><strong>Review Delta</strong><code>${links.deltaDraft}</code></a>
        <a class="link-card" href="${links.artifactAudit}"><strong>Artifact Audit</strong><code>${links.artifactAudit}</code></a>
        <a class="link-card" href="${links.sessionArtifactAudit}"><strong>Session Artifact Audit</strong><code>${links.sessionArtifactAudit}</code></a>
        <a class="link-card" href="${links.closeoutDraft}"><strong>Closeout Draft</strong><code>${links.closeoutDraft}</code></a>
        <a class="link-card" href="${links.gateDraft}"><strong>Review Gate</strong><code>${links.gateDraft}</code></a>
        <a class="link-card" href="${links.linearUpdateDraft}"><strong>Linear Update Draft</strong><code>${links.linearUpdateDraft}</code></a>
        <a class="link-card" href="${links.approvalBoard}"><strong>Approval Board</strong><code>${links.approvalBoard}</code></a>
        <a class="link-card" href="${links.index}"><strong>Archive Index</strong><code>${links.index}</code></a>
        <a class="link-card" href="${links.indexJson}"><strong>Archive Index JSON</strong><code>${links.indexJson}</code></a>
        <a class="link-card" href="${jsonOutputPath}"><strong>Latest Handoff JSON</strong><code>${jsonOutputPath}</code></a>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Refresh Command</h2>
          <p><code>npm run ntl:compare-entry-review-prep</code></p>
        </section>
        <section class="panel">
          <h2>Status Command</h2>
          <p><code>npm run ntl:compare-entry-review-status</code></p>
          <p><code>npm run ntl:compare-entry-review-frame-progress</code></p>
          <p><code>npm run ntl:compare-entry-review-section-progress</code></p>
          <p><code>npm run ntl:compare-entry-review-surface-queue</code></p>
          <p><code>npm run ntl:compare-entry-review-surface-status</code></p>
          <p><code>npm run ntl:compare-entry-review-next-surface</code></p>
          <p><code>npm run ntl:compare-entry-review-next-surface-sections</code></p>
          <p><code>npm run ntl:compare-entry-review-next-surface-checklist</code></p>
          <p><code>npm run ntl:compare-entry-review-next-frame</code></p>
          <p><code>npm run ntl:compare-entry-review-next-section</code></p>
          <p><code>npm run ntl:compare-entry-figma-mcp-attempt</code></p>
          <p><code>npm run ntl:compare-entry-figma-retry-packet</code></p>
          <p><code>npm run ntl:compare-entry-review-closeout</code></p>
          <p><code>npm run ntl:compare-entry-review-gate</code></p>
          <p><code>npm run ntl:compare-entry-review-delta</code></p>
          <p><code>npm run ntl:compare-entry-review-artifact-audit</code></p>
          <p><code>npm run ntl:compare-entry-linear-update</code></p>
          <p><code>npm run ntl:compare-entry-approval-board</code></p>
          <p><code>npm run ntl:compare-entry-review-finalize</code></p>
          <p><code>npm run ntl:compare-entry-review-ready-check</code></p>
        </section>
        <section class="panel">
          <h2>Handoff Rule</h2>
          <ul>
            <li><code>SUN-10</code> 수동 frame 제작은 항상 이 latest session artifact 기준으로 진행합니다.</li>
            <li><code>Approved</code> 또는 <code>Approved With Follow-up</code> 전에는 <code>SUN-11</code> / <code>SUN-12</code> 를 시작하지 않습니다.</li>
          </ul>
        </section>
      </section>
    </main>
  </body>
</html>`;
  await writeFile(htmlOutputPath, html, 'utf8');
  await writeFile(jsonOutputPath, JSON.stringify(handoffJson, null, 2) + '\n', 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        htmlOutputPath,
        jsonOutputPath,
        hasSession: true,
        sessionId: manifest.sessionId ?? latest.sessionName,
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
