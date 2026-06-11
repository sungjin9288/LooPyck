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
  closeoutJson: path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
  linearUpdateJson: path.join(artifactDir, 'compare-entry-linear-update-draft.json'),
  frameProgressJson: path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
  surfaceQueueJson: path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
  surfaceStatusJson: path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
  nextSurfacePacket: path.join(artifactDir, 'compare-entry-review-next-surface-packet.html'),
  nextSurfaceSectionPacket: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.html'),
  nextSurfaceChecklist: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.html'),
  nextSectionActionCard: path.join(artifactDir, 'compare-entry-review-next-section-action-card.html'),
  figmaRetryPacketMarkdown: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
  figmaRetryPacketJson: path.join(artifactDir, 'compare-entry-figma-retry-packet.json'),
  figmaMcpAttemptHistoryMarkdown: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.md'),
  figmaMcpAttemptHistoryJson: path.join(artifactDir, 'compare-entry-figma-mcp-attempt-history.json'),
  nextFramePacketJson: path.join(artifactDir, 'compare-entry-review-next-frame-packet.json'),
  nextFramePacket: path.join(artifactDir, 'compare-entry-review-next-frame-packet.html'),
  nextSectionPacketJson: path.join(artifactDir, 'compare-entry-review-next-section-packet.json'),
  nextSectionPacket: path.join(artifactDir, 'compare-entry-review-next-section-packet.html'),
  surfaceQueue: path.join(artifactDir, 'compare-entry-review-surface-queue.html'),
  surfaceStatus: path.join(artifactDir, 'compare-entry-review-surface-status-board.html'),
  missingDetail: path.join(artifactDir, 'compare-entry-review-missing-detail.md'),
  focusPlan: path.join(artifactDir, 'compare-entry-review-focus-plan.md'),
  frameProgress: path.join(artifactDir, 'compare-entry-review-frame-progress-board.html'),
  sectionProgress: path.join(artifactDir, 'compare-entry-review-section-progress-board.html'),
  artifactAuditJson: path.join(artifactDir, 'compare-entry-review-artifact-audit.json'),
  archiveIndexJson: path.join(artifactDir, 'compare-entry-review-sessions', 'index.json'),
  latestHandoffHtml: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
  latestHandoffJson: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-approval-board.html'),
  json: path.join(artifactDir, 'compare-entry-approval-board.json'),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatList(items, emptyState = 'none') {
  if (!items.length) return `<li>${escapeHtml(emptyState)}</li>`;
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function formatPreformatted(value) {
  return escapeHtml(value || '');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [gateRaw, closeoutRaw, linearRaw, frameProgressRaw, surfaceQueueRaw, surfaceStatusRaw, nextFramePacketRaw, nextSectionPacketRaw] = await Promise.all([
    readFile(inputPaths.gateJson, 'utf8'),
    readFile(inputPaths.closeoutJson, 'utf8'),
    readFile(inputPaths.linearUpdateJson, 'utf8'),
    readFile(inputPaths.frameProgressJson, 'utf8'),
    readFile(inputPaths.surfaceQueueJson, 'utf8'),
    readFile(inputPaths.surfaceStatusJson, 'utf8'),
    readFile(inputPaths.nextFramePacketJson, 'utf8'),
    readFile(inputPaths.nextSectionPacketJson, 'utf8'),
  ]);

  const gate = JSON.parse(gateRaw);
  const closeout = JSON.parse(closeoutRaw);
  const linear = JSON.parse(linearRaw);
  const frameProgress = JSON.parse(frameProgressRaw);
  const surfaceQueue = JSON.parse(surfaceQueueRaw);
  const surfaceStatus = JSON.parse(surfaceStatusRaw);
  const nextFramePacket = JSON.parse(nextFramePacketRaw);
  const nextSectionPacket = JSON.parse(nextSectionPacketRaw);
  let artifactAudit = null;
  try {
    artifactAudit = JSON.parse(await readFile(inputPaths.artifactAuditJson, 'utf8'));
  } catch {
    artifactAudit = null;
  }

  const approval = {
    generatedAt: new Date().toISOString(),
    gateState: gate.gateState ?? 'unknown',
    readyToUnblock: Boolean(gate.readyToUnblock),
    recommendedState: gate.recommendedState ?? 'unknown',
    build: gate.build ?? null,
    review: gate.review ?? null,
    decision: gate.decision ?? null,
    activeBlocker: gate.activeBlocker ?? {
      kind: 'unknown',
      summary: 'No active blocker summary was provided by the review gate.',
      target: null,
      latestStatus: null,
      latestOperation: null,
      latestTool: null,
      evidencePath: null,
      nextAction: 'Regenerate the review gate.',
    },
    artifactAuditState: artifactAudit?.auditState ?? 'PENDING',
    artifactAuditSummary: gate.artifactAuditSummary ?? {
      state: artifactAudit?.auditState ?? 'PENDING',
      ready: artifactAudit?.auditState === 'READY',
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
    },
    artifactAuditMissing: Array.isArray(artifactAudit?.missing) ? artifactAudit.missing : [],
    blockedSurfaceCount: Number(surfaceStatus?.blockedSurfaceCount ?? 0),
    readySurfaceCount: Number(surfaceStatus?.readySurfaceCount ?? 0),
    recommendedNextSurface: surfaceStatus?.recommendedNextSurface ?? null,
    recommendedNextFrame: nextFramePacket?.recommendedFrame?.frame ?? null,
    recommendedNextFrameViewport: nextFramePacket?.recommendedFrame?.viewport ?? null,
    recommendedNextSection: nextSectionPacket?.recommendedSection?.section ?? null,
    recommendedNextSectionPhase: nextSectionPacket?.recommendedSection?.phase ?? null,
    recommendedNextSurfaceFrameCount: Number(closeout?.recommendedNextSurfaceFrameCount ?? 0),
    recommendedNextSurfaceSectionCount: Number(closeout?.recommendedNextSurfaceSectionCount ?? 0),
    recommendedNextSurfaceChecklistPath: closeout?.recommendedNextSurfaceChecklistPath ?? inputPaths.nextSurfaceChecklist,
    recommendedNextSurfaceChecklistFirstFrame: closeout?.recommendedNextSurfaceChecklistFirstFrame ?? null,
    recommendedNextSurfaceChecklistFirstSection: closeout?.recommendedNextSurfaceChecklistFirstSection ?? null,
    recommendedNextSectionActionCardPath:
      closeout?.recommendedNextSectionActionCardPath ?? inputPaths.nextSectionActionCard,
    recommendedNextSectionActionFirstItem:
      closeout?.recommendedNextSectionActionFirstItem ?? null,
    figmaRetryPacket: closeout?.figmaRetryPacket ?? null,
    recommendedNextSurfaceSectionPreview: Array.isArray(closeout?.recommendedNextSurfaceSectionPreview)
      ? closeout.recommendedNextSurfaceSectionPreview
      : [],
    topBlockedSurfaces: Array.isArray(surfaceQueue?.surfaces)
      ? surfaceQueue.surfaces
          .filter((surface) => Number(surface.totalPending) > 0)
          .slice(0, 3)
          .map((surface) => `${surface.surface} (${surface.totalPending})`)
      : [],
    topBlockedSections: Array.isArray(closeout?.topBlockedSections) ? closeout.topBlockedSections : [],
    topBlockedFrames: Array.isArray(frameProgress?.frames)
      ? frameProgress.frames
          .filter((frame) => Number(frame.totalPending) > 0)
          .slice(0, 3)
          .map((frame) => `${frame.frame} (${frame.totalPending})`)
      : [],
    missing: Array.isArray(gate.missing) ? gate.missing : [],
    nextActions: Array.isArray(gate.nextActions) ? gate.nextActions : [],
    revisions: Array.isArray(closeout.revisions) ? closeout.revisions : [],
    followUp: Array.isArray(closeout.followUp) ? closeout.followUp : [],
    handoffNotes: Array.isArray(closeout.handoffNotes) ? closeout.handoffNotes : [],
    sun10Comment: linear.sun10Comment ?? '',
    sun11Note: linear.sun11Note ?? '',
    sun12Note: linear.sun12Note ?? '',
    links: inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(approval, null, 2) + '\n', 'utf8');

  const badgeTone = approval.readyToUnblock ? 'ok' : 'bad';
  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Approval Board</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.94);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
        --ok: #0f9f6e;
        --bad: #c53030;
        --warn: #b7791f;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, #f4f7fb 30%, #f8fafc 100%);
        color: var(--text);
      }
      main {
        max-width: 1320px;
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
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p { margin: 0; color: var(--muted); }
      .summary, .grid-2, .links {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .links { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
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
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 8px 12px;
        font-size: 13px;
        font-weight: 700;
      }
      .badge.ok { background: rgba(15, 159, 110, 0.12); color: var(--ok); }
      .badge.bad { background: rgba(197, 48, 48, 0.12); color: var(--bad); }
      .link-card { display: grid; gap: 8px; color: inherit; text-decoration: none; }
      .link-card:hover { border-color: #94a3b8; }
      h2 { margin: 0 0 10px; font-size: 18px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      pre {
        margin: 0;
        padding: 16px;
        border-radius: 16px;
        background: #0f172a;
        color: #e2e8f0;
        overflow: auto;
        font-size: 12px;
        line-height: 1.55;
        white-space: pre-wrap;
        word-break: break-word;
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
        <h1>Compare Entry Approval Board</h1>
        <p>Gate, closeout, Linear update draft를 한 화면에 모아 <code>SUN-10</code> 승인 여부와 후속 unblock 행동을 바로 판단하는 board입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(approval.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span class="badge ${badgeTone}">${escapeHtml(approval.gateState)}</span></div>
        <div class="metric"><strong>Recommended State</strong><span>${escapeHtml(approval.recommendedState)}</span></div>
        <div class="metric"><strong>Build Completion</strong><span>${escapeHtml(`${approval.build?.checked ?? 0}/${approval.build?.total ?? 0}`)}</span></div>
        <div class="metric"><strong>Review Completion</strong><span>${escapeHtml(`${approval.review?.checked ?? 0}/${approval.review?.total ?? 0}`)}</span></div>
        <div class="metric"><strong>Outcome</strong><span>${escapeHtml(approval.decision?.outcome ?? 'unselected')}</span></div>
        <div class="metric"><strong>Artifact Audit</strong><span class="badge ${approval.artifactAuditState === 'READY' ? 'ok' : 'bad'}">${escapeHtml(approval.artifactAuditState)}</span></div>
        <div class="metric"><strong>Audit Missing Count</strong><span>${escapeHtml(approval.artifactAuditSummary.missingCount ?? 'unknown')}</span></div>
        <div class="metric"><strong>Blocker Mismatches</strong><span>${escapeHtml(approval.artifactAuditSummary.activeBlockerMismatchCount ?? 'unknown')}</span></div>
        <div class="metric"><strong>Blocker Files Checked</strong><span>${escapeHtml(approval.artifactAuditSummary.activeBlockerFilesChecked ?? 'unknown')}</span></div>
        <div class="metric"><strong>Blocked Surfaces</strong><span>${escapeHtml(approval.blockedSurfaceCount)}</span></div>
        <div class="metric"><strong>Ready Surfaces</strong><span>${escapeHtml(approval.readySurfaceCount)}</span></div>
        <div class="metric"><strong>Recommended Next Surface</strong><span>${escapeHtml(surfaceStatus?.recommendedNextSurface ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Frame</strong><span>${escapeHtml(approval.recommendedNextFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Section</strong><span>${escapeHtml(approval.recommendedNextSection ?? 'none')}</span></div>
        <div class="metric"><strong>Figma Retry Status</strong><span>${escapeHtml(approval.figmaRetryPacket?.status ?? 'none')}</span></div>
        <div class="metric"><strong>Figma Retry Ready</strong><span class="badge ${approval.figmaRetryPacket?.retryReady ? 'ok' : 'bad'}">${escapeHtml(approval.figmaRetryPacket?.retryReady ? 'true' : 'false')}</span></div>
        <div class="metric"><strong>Figma MCP Attempts</strong><span>${escapeHtml(approval.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts ?? 0)}</span></div>
        <div class="metric"><strong>Latest MCP Attempt</strong><span>${escapeHtml(approval.figmaRetryPacket?.mcpAttemptHistory?.latestOperation ?? 'none')}</span></div>
        <div class="metric"><strong>Active Blocker</strong><span class="badge ${approval.activeBlocker.kind === 'none' ? 'ok' : 'bad'}">${escapeHtml(approval.activeBlocker.kind)}</span></div>
        <div class="metric"><strong>Recommended Surface Frames</strong><span>${escapeHtml(approval.recommendedNextSurfaceFrameCount)}</span></div>
        <div class="metric"><strong>Recommended Surface Sections</strong><span>${escapeHtml(approval.recommendedNextSurfaceSectionCount)}</span></div>
        <div class="metric"><strong>Checklist First Frame</strong><span>${escapeHtml(approval.recommendedNextSurfaceChecklistFirstFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Checklist First Section</strong><span>${escapeHtml(approval.recommendedNextSurfaceChecklistFirstSection ?? 'none')}</span></div>
        <div class="metric"><strong>Action Card First Item</strong><span>${escapeHtml(approval.recommendedNextSectionActionFirstItem ?? 'none')}</span></div>
        <div class="metric"><strong>Top Blocked Frames</strong><span>${escapeHtml(approval.topBlockedFrames.length)}</span></div>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Blocking Items</h2>
          <ul>${formatList(approval.missing)}</ul>
        </section>
        <section class="panel">
          <h2>Active Blocker Summary</h2>
          <ul>
            <li>${escapeHtml(`kind: ${approval.activeBlocker.kind}`)}</li>
            <li>${escapeHtml(`summary: ${approval.activeBlocker.summary}`)}</li>
            <li>${escapeHtml(`target: ${approval.activeBlocker.target ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestStatus: ${approval.activeBlocker.latestStatus ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestOperation: ${approval.activeBlocker.latestOperation ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestTool: ${approval.activeBlocker.latestTool ?? 'none'}`)}</li>
            <li>${escapeHtml(`evidencePath: ${approval.activeBlocker.evidencePath ?? 'none'}`)}</li>
            <li>${escapeHtml(`nextAction: ${approval.activeBlocker.nextAction}`)}</li>
          </ul>
        </section>
        <section class="panel">
          <h2>Artifact Audit Gaps</h2>
          <ul>${formatList(approval.artifactAuditMissing)}</ul>
        </section>
        <section class="panel">
          <h2>Top Blocked Surfaces</h2>
          <ul>${formatList(approval.topBlockedSurfaces)}</ul>
        </section>
        <section class="panel">
          <h2>Top Blocked Sections</h2>
          <ul>${formatList(approval.topBlockedSections)}</ul>
        </section>
        <section class="panel">
          <h2>Recommended Surface Section Preview</h2>
          <ul>${formatList(approval.recommendedNextSurfaceSectionPreview)}</ul>
        </section>
        <section class="panel">
          <h2>Recommended Surface Checklist</h2>
          <ul>
            <li>${escapeHtml(`path: ${approval.recommendedNextSurfaceChecklistPath}`)}</li>
            <li>${escapeHtml(`first frame: ${approval.recommendedNextSurfaceChecklistFirstFrame ?? 'none'}`)}</li>
            <li>${escapeHtml(`first section: ${approval.recommendedNextSurfaceChecklistFirstSection ?? 'none'}`)}</li>
          </ul>
        </section>
        <section class="panel">
          <h2>Recommended Action Card</h2>
          <ul>
            <li>${escapeHtml(`path: ${approval.recommendedNextSectionActionCardPath}`)}</li>
            <li>${escapeHtml(`first action: ${approval.recommendedNextSectionActionFirstItem ?? 'none'}`)}</li>
          </ul>
        </section>
        <section class="panel">
          <h2>Figma Retry Packet</h2>
          <ul>
            <li>${escapeHtml(`status: ${approval.figmaRetryPacket?.status ?? 'none'}`)}</li>
            <li>${escapeHtml(`retryReady: ${approval.figmaRetryPacket?.retryReady ? 'true' : 'false'}`)}</li>
            <li>${escapeHtml(`target: ${approval.figmaRetryPacket?.target ? `${approval.figmaRetryPacket.target.surface ?? 'none'} -> ${approval.figmaRetryPacket.target.frame ?? 'none'} -> ${approval.figmaRetryPacket.target.section ?? 'none'}` : 'none'}`)}</li>
            <li>${escapeHtml(`markdown: ${approval.figmaRetryPacket?.markdownPath ?? 'none'}`)}</li>
            <li>${escapeHtml(`json: ${approval.figmaRetryPacket?.jsonPath ?? 'none'}`)}</li>
            <li>${escapeHtml(`attempt history count: ${approval.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts ?? 0}`)}</li>
            <li>${escapeHtml(`attempt history markdown: ${approval.figmaRetryPacket?.mcpAttemptHistory?.markdownPath ?? 'none'}`)}</li>
            <li>${escapeHtml(`latest attempt: ${approval.figmaRetryPacket?.mcpAttemptHistory?.latestOperation ?? 'none'} via ${approval.figmaRetryPacket?.mcpAttemptHistory?.latestTool ?? 'none'}`)}</li>
          </ul>
        </section>
        <section class="panel">
          <h2>Top Blocked Frames</h2>
          <ul>${formatList(approval.topBlockedFrames)}</ul>
        </section>
        <section class="panel">
          <h2>Next Actions</h2>
          <ul>${formatList(approval.nextActions)}</ul>
        </section>
        <section class="panel">
          <h2>Required Revisions</h2>
          <ul>${formatList(approval.revisions)}</ul>
        </section>
        <section class="panel">
          <h2>Follow-up Notes</h2>
          <ul>${formatList(approval.followUp)}</ul>
        </section>
      </section>

      <section class="links">
        <a class="link-card" href="${inputPaths.latestHandoffHtml}"><strong>Latest Handoff</strong><code>${inputPaths.latestHandoffHtml}</code></a>
        <a class="link-card" href="${inputPaths.latestHandoffJson}"><strong>Latest Handoff JSON</strong><code>${inputPaths.latestHandoffJson}</code></a>
        <a class="link-card" href="${inputPaths.archiveIndexJson}"><strong>Archive Index JSON</strong><code>${inputPaths.archiveIndexJson}</code></a>
        <a class="link-card" href="${inputPaths.gateJson.replace('.json', '.md')}"><strong>Review Gate</strong><code>${inputPaths.gateJson.replace('.json', '.md')}</code></a>
        <a class="link-card" href="${inputPaths.artifactAuditJson.replace('.json', '.md')}"><strong>Artifact Audit</strong><code>${inputPaths.artifactAuditJson.replace('.json', '.md')}</code></a>
        <a class="link-card" href="${inputPaths.missingDetail}"><strong>Missing Detail</strong><code>${inputPaths.missingDetail}</code></a>
        <a class="link-card" href="${inputPaths.focusPlan}"><strong>Focus Plan</strong><code>${inputPaths.focusPlan}</code></a>
        <a class="link-card" href="${inputPaths.frameProgress}"><strong>Frame Progress</strong><code>${inputPaths.frameProgress}</code></a>
        <a class="link-card" href="${inputPaths.sectionProgress}"><strong>Section Progress</strong><code>${inputPaths.sectionProgress}</code></a>
        <a class="link-card" href="${inputPaths.surfaceQueue}"><strong>Surface Queue</strong><code>${inputPaths.surfaceQueue}</code></a>
        <a class="link-card" href="${inputPaths.surfaceStatus}"><strong>Surface Status</strong><code>${inputPaths.surfaceStatus}</code></a>
        <a class="link-card" href="${inputPaths.nextSurfacePacket}"><strong>Next Surface Packet</strong><code>${inputPaths.nextSurfacePacket}</code></a>
        <a class="link-card" href="${inputPaths.nextSurfaceSectionPacket}"><strong>Next Surface Sections</strong><code>${inputPaths.nextSurfaceSectionPacket}</code></a>
        <a class="link-card" href="${inputPaths.nextSurfaceChecklist}"><strong>Next Surface Checklist</strong><code>${inputPaths.nextSurfaceChecklist}</code></a>
        <a class="link-card" href="${inputPaths.nextSectionActionCard}"><strong>Next Section Action Card</strong><code>${inputPaths.nextSectionActionCard}</code></a>
        <a class="link-card" href="${inputPaths.figmaRetryPacketMarkdown}"><strong>Figma Retry Packet</strong><code>${inputPaths.figmaRetryPacketMarkdown}</code></a>
        <a class="link-card" href="${inputPaths.figmaRetryPacketJson}"><strong>Figma Retry Packet JSON</strong><code>${inputPaths.figmaRetryPacketJson}</code></a>
        <a class="link-card" href="${inputPaths.figmaMcpAttemptHistoryMarkdown}"><strong>Figma MCP Attempt History</strong><code>${inputPaths.figmaMcpAttemptHistoryMarkdown}</code></a>
        <a class="link-card" href="${inputPaths.figmaMcpAttemptHistoryJson}"><strong>Figma MCP Attempt History JSON</strong><code>${inputPaths.figmaMcpAttemptHistoryJson}</code></a>
        <a class="link-card" href="${inputPaths.nextFramePacket}"><strong>Next Frame Packet</strong><code>${inputPaths.nextFramePacket}</code></a>
        <a class="link-card" href="${inputPaths.nextSectionPacket}"><strong>Next Section Packet</strong><code>${inputPaths.nextSectionPacket}</code></a>
        <a class="link-card" href="${inputPaths.closeoutJson.replace('.json', '.md')}"><strong>Closeout Draft</strong><code>${inputPaths.closeoutJson.replace('.json', '.md')}</code></a>
        <a class="link-card" href="${artifactDir}/compare-entry-linear-update-draft.md"><strong>Linear Update Draft</strong><code>${artifactDir}/compare-entry-linear-update-draft.md</code></a>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>SUN-10 Comment Draft</h2>
          <pre>${formatPreformatted(approval.sun10Comment)}</pre>
        </section>
        <section class="panel">
          <h2>SUN-11 Blocker Update</h2>
          <pre>${formatPreformatted(approval.sun11Note)}</pre>
        </section>
        <section class="panel">
          <h2>SUN-12 Blocker Update</h2>
          <pre>${formatPreformatted(approval.sun12Note)}</pre>
        </section>
        <section class="panel">
          <h2>Commands</h2>
          <ul>
            <li><code>npm run ntl:compare-entry-review-finalize</code></li>
            <li><code>npm run ntl:compare-entry-review-gate:strict</code></li>
            <li><code>npm run ntl:compare-entry-linear-update</code></li>
            <li><code>npm run ntl:compare-entry-review-ready-check</code></li>
          </ul>
        </section>
      </section>
    </main>
  </body>
</html>`;

  await writeFile(outputPaths.html, html, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        readyToUnblock: approval.readyToUnblock,
        htmlPath: outputPaths.html,
        jsonPath: outputPaths.json,
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
