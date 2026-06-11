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
const outputPath = path.join(sessionsDir, 'index.html');
const jsonOutputPath = path.join(sessionsDir, 'index.json');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function readSessionEntries() {
  const entries = await readdir(sessionsDir, { withFileTypes: true });
  const sessions = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(sessionsDir, entry.name, 'manifest.json');
    try {
      const manifestRaw = await readFile(manifestPath, 'utf8');
      const manifest = JSON.parse(manifestRaw);
      let status = null;
      let surfaceStatus = null;
      try {
        status = JSON.parse(
          await readFile(path.join(sessionsDir, entry.name, 'compare-entry-review-status.json'), 'utf8'),
        );
      } catch {
        status = null;
      }
      try {
        surfaceStatus = JSON.parse(
          await readFile(
            path.join(sessionsDir, entry.name, 'compare-entry-review-surface-status-board.json'),
            'utf8',
          ),
        );
      } catch {
        surfaceStatus = null;
      }
      let figmaRetryPacket = null;
      try {
        figmaRetryPacket = JSON.parse(
          await readFile(path.join(sessionsDir, entry.name, 'compare-entry-figma-retry-packet.json'), 'utf8'),
        );
      } catch {
        figmaRetryPacket = null;
      }
      let gate = null;
      try {
        gate = JSON.parse(
          await readFile(path.join(sessionsDir, entry.name, 'compare-entry-review-gate.json'), 'utf8'),
        );
      } catch {
        gate = null;
      }
      let artifactAudit = null;
      try {
        artifactAudit = JSON.parse(
          await readFile(path.join(sessionsDir, entry.name, 'compare-entry-review-artifact-audit.json'), 'utf8'),
        );
      } catch {
        artifactAudit = null;
      }
      const activeBlocker = gate?.activeBlocker ?? null;
      const artifactAuditSummary = gate?.artifactAuditSummary ?? {
        state: artifactAudit?.auditState ?? 'PENDING',
        missingCount: Array.isArray(artifactAudit?.missing) ? artifactAudit.missing.length : null,
        activeBlockerMismatchCount: artifactAudit?.activeBlockerMismatchCount ?? null,
        activeBlockerFilesChecked: artifactAudit?.activeBlockerFilesChecked ?? null,
      };
      sessions.push({
        sessionId: manifest.sessionId ?? entry.name,
        generatedAt: manifest.generatedAt ?? null,
        query: manifest.query ?? null,
        displayedCount: manifest.displayedCount ?? null,
        recommendedNextSurface: surfaceStatus?.recommendedNextSurface ?? status?.recommendedNextSurface ?? null,
        recommendedNextFrame: surfaceStatus?.recommendedNextFrame ?? status?.recommendedNextFrame ?? null,
        recommendedNextSection: surfaceStatus?.recommendedNextSection ?? status?.recommendedNextSection ?? null,
        figmaRetryStatus: figmaRetryPacket?.status ?? null,
        figmaRetryReady: Boolean(figmaRetryPacket?.retryReady),
        activeBlockerKind: activeBlocker?.kind ?? null,
        activeBlockerTarget: activeBlocker?.target ?? null,
        activeBlockerLatestStatus: activeBlocker?.latestStatus ?? null,
        activeBlockerLatestOperation: activeBlocker?.latestOperation ?? null,
        activeBlockerLatestTool: activeBlocker?.latestTool ?? null,
        artifactAuditState: artifactAuditSummary.state ?? null,
        artifactAuditMissingCount: artifactAuditSummary.missingCount ?? null,
        activeBlockerMismatchCount: artifactAuditSummary.activeBlockerMismatchCount ?? null,
        activeBlockerFilesChecked: artifactAuditSummary.activeBlockerFilesChecked ?? null,
        manifestPath,
        boardPath: path.join(sessionsDir, entry.name, 'compare-entry-design-review-board.html'),
        manualPacketPath: path.join(sessionsDir, entry.name, 'compare-entry-manual-figma-packet.html'),
        frameSpecsPath: path.join(sessionsDir, entry.name, 'compare-entry-manual-frame-specs.md'),
        buildWorksheetPath: path.join(sessionsDir, entry.name, 'compare-entry-manual-build-worksheet.md'),
        statusBoardPath: path.join(sessionsDir, entry.name, 'compare-entry-review-status-board.html'),
        missingDetailPath: path.join(sessionsDir, entry.name, 'compare-entry-review-missing-detail.md'),
        focusPlanPath: path.join(sessionsDir, entry.name, 'compare-entry-review-focus-plan.md'),
        frameProgressPath: path.join(sessionsDir, entry.name, 'compare-entry-review-frame-progress-board.html'),
        sectionProgressPath: path.join(sessionsDir, entry.name, 'compare-entry-review-section-progress-board.html'),
        surfaceQueuePath: path.join(sessionsDir, entry.name, 'compare-entry-review-surface-queue.md'),
        surfaceStatusPath: path.join(sessionsDir, entry.name, 'compare-entry-review-surface-status-board.html'),
        nextSurfacePath: path.join(sessionsDir, entry.name, 'compare-entry-review-next-surface-packet.html'),
        nextSurfaceSectionPath: path.join(sessionsDir, entry.name, 'compare-entry-review-next-surface-section-packet.html'),
        nextSurfaceChecklistPath: path.join(sessionsDir, entry.name, 'compare-entry-review-next-surface-checklist.html'),
        nextSectionActionPath: path.join(
          sessionsDir,
          entry.name,
          'compare-entry-review-next-section-action-card.html',
        ),
        figmaMcpAttemptPath: path.join(sessionsDir, entry.name, 'compare-entry-figma-mcp-attempt.md'),
        figmaMcpAttemptJsonPath: path.join(sessionsDir, entry.name, 'compare-entry-figma-mcp-attempt.json'),
        figmaMcpAttemptHistoryPath: path.join(
          sessionsDir,
          entry.name,
          'compare-entry-figma-mcp-attempt-history.md',
        ),
        figmaMcpAttemptHistoryJsonPath: path.join(
          sessionsDir,
          entry.name,
          'compare-entry-figma-mcp-attempt-history.json',
        ),
        figmaRetryPacketPath: path.join(sessionsDir, entry.name, 'compare-entry-figma-retry-packet.md'),
        figmaRetryPacketJsonPath: path.join(sessionsDir, entry.name, 'compare-entry-figma-retry-packet.json'),
        nextFramePath: path.join(sessionsDir, entry.name, 'compare-entry-review-next-frame-packet.html'),
        nextSectionPath: path.join(sessionsDir, entry.name, 'compare-entry-review-next-section-packet.html'),
        closeoutDraftPath: path.join(sessionsDir, entry.name, 'compare-entry-review-closeout-draft.md'),
        gatePath: path.join(sessionsDir, entry.name, 'compare-entry-review-gate.md'),
        deltaPath: path.join(sessionsDir, entry.name, 'compare-entry-review-delta.md'),
        artifactAuditPath: path.join(sessionsDir, entry.name, 'compare-entry-review-artifact-audit.md'),
        linearUpdatePath: path.join(sessionsDir, entry.name, 'compare-entry-linear-update-draft.md'),
        approvalBoardPath: path.join(sessionsDir, entry.name, 'compare-entry-approval-board.html'),
        worksheetPath: path.join(sessionsDir, entry.name, 'compare-entry-design-review-worksheet.md'),
        decisionLogPath: path.join(sessionsDir, entry.name, 'compare-entry-design-review-decision-log.md'),
        packetPath: path.join(sessionsDir, entry.name, 'compare-entry-design-review-packet.md'),
      });
    } catch {
      // Ignore incomplete session folders.
    }
  }

  sessions.sort((a, b) => String(b.sessionId).localeCompare(String(a.sessionId)));
  return sessions;
}

async function main() {
  await mkdir(sessionsDir, { recursive: true });
  const sessions = await readSessionEntries();
  const latestHandoffLinks = [
    {
      label: 'Latest Handoff Board',
      href: 'latest-handoff.html',
      description: 'Current reviewer-facing handoff summary',
    },
    {
      label: 'Latest Handoff Markdown',
      href: 'latest-handoff.md',
      description: 'Stable manual handoff note',
    },
    {
      label: 'Latest Handoff JSON',
      href: 'latest-handoff.json',
      description: 'Machine-readable automation context',
    },
    {
      label: 'Archive Index JSON',
      href: 'index.json',
      description: 'Machine-readable archived session index',
    },
  ];
  const latestHandoffLinkCards = latestHandoffLinks
    .map(
      (link) => `
        <a class="quick-link" href="${escapeHtml(link.href)}">
          <strong>${escapeHtml(link.label)}</strong>
          <span>${escapeHtml(link.description)}</span>
          <code>${escapeHtml(link.href)}</code>
        </a>
      `,
    )
    .join('\n');
  const sessionIndexJson = {
    ok: true,
    generatedAt: new Date().toISOString(),
    sessionsDir,
    latestHandoffLinks,
    sessions: sessions.map((session) => {
      const sessionDirName = path.basename(path.dirname(session.manifestPath));
      return {
        sessionId: session.sessionId,
        generatedAt: session.generatedAt,
        query: session.query,
        displayedCount: session.displayedCount,
        recommendedNextSurface: session.recommendedNextSurface,
        recommendedNextFrame: session.recommendedNextFrame,
        recommendedNextSection: session.recommendedNextSection,
        figmaRetryStatus: session.figmaRetryStatus,
        figmaRetryReady: session.figmaRetryReady,
        activeBlocker: {
          kind: session.activeBlockerKind,
          target: session.activeBlockerTarget,
          latestStatus: session.activeBlockerLatestStatus,
          latestOperation: session.activeBlockerLatestOperation,
          latestTool: session.activeBlockerLatestTool,
        },
        artifactAuditSummary: {
          state: session.artifactAuditState,
          missingCount: session.artifactAuditMissingCount,
          activeBlockerMismatchCount: session.activeBlockerMismatchCount,
          activeBlockerFilesChecked: session.activeBlockerFilesChecked,
        },
        links: {
          manifest: `${sessionDirName}/manifest.json`,
          board: `${sessionDirName}/compare-entry-design-review-board.html`,
          approvalBoard: `${sessionDirName}/compare-entry-approval-board.html`,
          gate: `${sessionDirName}/compare-entry-review-gate.md`,
          artifactAudit: `${sessionDirName}/compare-entry-review-artifact-audit.md`,
          nextSectionAction: `${sessionDirName}/compare-entry-review-next-section-action-card.html`,
          figmaMcpAttempt: `${sessionDirName}/compare-entry-figma-mcp-attempt.md`,
          figmaMcpAttemptHistory: `${sessionDirName}/compare-entry-figma-mcp-attempt-history.md`,
          figmaRetryPacket: `${sessionDirName}/compare-entry-figma-retry-packet.md`,
        },
      };
    }),
  };

  const rows = sessions
    .map(
      (session) => `
        <tr>
          <td><strong>${escapeHtml(session.sessionId)}</strong></td>
          <td>${escapeHtml(session.generatedAt ?? 'unknown')}</td>
          <td>${escapeHtml(session.query ?? 'unknown')}</td>
          <td>${escapeHtml(session.displayedCount ?? 'unknown')}</td>
          <td>${escapeHtml(session.recommendedNextSurface ?? 'none')}</td>
          <td>${escapeHtml(session.recommendedNextFrame ?? 'none')}</td>
          <td>${escapeHtml(session.recommendedNextSection ?? 'none')}</td>
          <td>${escapeHtml(session.figmaRetryStatus ?? 'none')}</td>
          <td>${escapeHtml(session.figmaRetryReady ? 'true' : 'false')}</td>
          <td>${escapeHtml(session.activeBlockerKind ?? 'none')}</td>
          <td>${escapeHtml(session.activeBlockerTarget ?? 'none')}</td>
          <td>${escapeHtml(session.activeBlockerLatestStatus ?? 'none')}</td>
          <td>${escapeHtml(session.artifactAuditState ?? 'unknown')}</td>
          <td>${escapeHtml(session.artifactAuditMissingCount ?? 'unknown')}</td>
          <td>${escapeHtml(session.activeBlockerMismatchCount ?? 'unknown')}</td>
          <td>${escapeHtml(session.activeBlockerFilesChecked ?? 'unknown')}</td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.manifestPath)) + '/manifest.json')}">manifest</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.boardPath)) + '/compare-entry-design-review-board.html')}">board</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.manualPacketPath)) + '/compare-entry-manual-figma-packet.html')}">manual packet</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.frameSpecsPath)) + '/compare-entry-manual-frame-specs.md')}">frame specs</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.buildWorksheetPath)) + '/compare-entry-manual-build-worksheet.md')}">build worksheet</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.statusBoardPath)) + '/compare-entry-review-status-board.html')}">status board</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.missingDetailPath)) + '/compare-entry-review-missing-detail.md')}">missing detail</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.focusPlanPath)) + '/compare-entry-review-focus-plan.md')}">focus plan</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.frameProgressPath)) + '/compare-entry-review-frame-progress-board.html')}">frame progress</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.sectionProgressPath)) + '/compare-entry-review-section-progress-board.html')}">section progress</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.surfaceQueuePath)) + '/compare-entry-review-surface-queue.md')}">surface queue</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.surfaceStatusPath)) + '/compare-entry-review-surface-status-board.html')}">surface status</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.nextSurfacePath)) + '/compare-entry-review-next-surface-packet.html')}">next surface</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.nextSurfaceSectionPath)) + '/compare-entry-review-next-surface-section-packet.html')}">next surface sections</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.nextSurfaceChecklistPath)) + '/compare-entry-review-next-surface-checklist.html')}">next surface checklist</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.nextSectionActionPath)) + '/compare-entry-review-next-section-action-card.html')}">next section action</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.figmaMcpAttemptPath)) + '/compare-entry-figma-mcp-attempt.md')}">figma mcp attempt</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.figmaMcpAttemptJsonPath)) + '/compare-entry-figma-mcp-attempt.json')}">figma mcp attempt json</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.figmaMcpAttemptHistoryPath)) + '/compare-entry-figma-mcp-attempt-history.md')}">figma mcp attempt history</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.figmaMcpAttemptHistoryJsonPath)) + '/compare-entry-figma-mcp-attempt-history.json')}">figma mcp attempt history json</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.figmaRetryPacketPath)) + '/compare-entry-figma-retry-packet.md')}">figma retry</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.figmaRetryPacketJsonPath)) + '/compare-entry-figma-retry-packet.json')}">figma retry json</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.nextFramePath)) + '/compare-entry-review-next-frame-packet.html')}">next frame</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.nextSectionPath)) + '/compare-entry-review-next-section-packet.html')}">next section</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.closeoutDraftPath)) + '/compare-entry-review-closeout-draft.md')}">closeout draft</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.gatePath)) + '/compare-entry-review-gate.md')}">gate</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.deltaPath)) + '/compare-entry-review-delta.md')}">delta</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.artifactAuditPath)) + '/compare-entry-review-artifact-audit.md')}">artifact audit</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.linearUpdatePath)) + '/compare-entry-linear-update-draft.md')}">linear update</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.approvalBoardPath)) + '/compare-entry-approval-board.html')}">approval board</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.worksheetPath)) + '/compare-entry-design-review-worksheet.md')}">worksheet</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.decisionLogPath)) + '/compare-entry-design-review-decision-log.md')}">decision log</a></td>
          <td><a href="${escapeHtml(path.basename(path.dirname(session.packetPath)) + '/compare-entry-design-review-packet.md')}">packet</a></td>
        </tr>
      `,
    )
    .join('\n');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Review Session Index</title>
    <style>
      body {
        margin: 0;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: #f5f7fb;
        color: #152033;
      }
      main {
        max-width: 1280px;
        margin: 0 auto;
        padding: 32px 24px 56px;
      }
      h1 { margin: 0 0 12px; font-size: 32px; }
      p { margin: 0 0 20px; color: #5d6a82; }
      .quick-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
        margin: 0 0 24px;
      }
      .quick-link {
        display: grid;
        gap: 8px;
        padding: 16px;
        border: 1px solid #d7deea;
        border-radius: 16px;
        background: #fff;
        box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);
      }
      .quick-link span {
        color: #5d6a82;
        font-size: 13px;
      }
      .quick-link code {
        color: #334155;
        font-size: 12px;
        overflow-wrap: anywhere;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        background: #fff;
        border: 1px solid #d7deea;
        border-radius: 18px;
        overflow: hidden;
      }
      th, td {
        padding: 14px 16px;
        border-bottom: 1px solid #e8edf5;
        text-align: left;
        vertical-align: top;
      }
      th {
        background: #eef3fb;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #5d6a82;
      }
      tr:last-child td { border-bottom: none; }
      a { color: #0f172a; text-decoration: none; }
      a:hover { text-decoration: underline; }
      .empty {
        padding: 24px;
        border: 1px dashed #d7deea;
        border-radius: 18px;
        background: #fff;
        color: #5d6a82;
      }
    </style>
  </head>
  <body>
    <main>
      <h1>Compare Entry Review Session Index</h1>
      <p>Prep runner or archive command로 생성된 session snapshot 목록입니다.</p>
      <section class="quick-links" aria-label="Stable latest handoff links">
        ${latestHandoffLinkCards}
      </section>
      ${
        sessions.length > 0
          ? `<table>
              <thead>
                <tr>
                  <th>Session</th>
                  <th>Generated</th>
                  <th>Query</th>
                  <th>Displayed Count</th>
                  <th>Recommended Surface</th>
                  <th>Recommended Frame</th>
                  <th>Recommended Section</th>
                  <th>Figma Retry Status</th>
                  <th>Figma Retry Ready</th>
                  <th>Active Blocker</th>
                  <th>Blocker Target</th>
                  <th>Blocker Latest Status</th>
                  <th>Artifact Audit</th>
                  <th>Audit Missing Count</th>
                  <th>Blocker Mismatches</th>
                  <th>Blocker Files Checked</th>
                  <th>Manifest</th>
                  <th>Board</th>
                  <th>Manual Packet</th>
                  <th>Frame Specs</th>
                  <th>Build Worksheet</th>
                  <th>Status Board</th>
                  <th>Missing Detail</th>
                  <th>Focus Plan</th>
                  <th>Frame Progress</th>
                  <th>Section Progress</th>
                  <th>Surface Queue</th>
                  <th>Surface Status</th>
                  <th>Next Surface</th>
                  <th>Next Surface Sections</th>
                  <th>Next Surface Checklist</th>
                  <th>Next Section Action</th>
                  <th>Figma MCP Attempt</th>
                  <th>Figma MCP Attempt JSON</th>
                  <th>Figma MCP Attempt History</th>
                  <th>Figma MCP Attempt History JSON</th>
                  <th>Figma Retry</th>
                  <th>Figma Retry JSON</th>
                  <th>Next Frame</th>
                  <th>Next Section</th>
                  <th>Closeout Draft</th>
                  <th>Gate</th>
                  <th>Delta</th>
                  <th>Artifact Audit</th>
                  <th>Linear Update</th>
                  <th>Approval Board</th>
                  <th>Worksheet</th>
                  <th>Decision Log</th>
                  <th>Packet</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>`
          : '<div class="empty">No archived review sessions yet.</div>'
      }
    </main>
  </body>
</html>`;

  await writeFile(outputPath, html, 'utf8');
  await writeFile(jsonOutputPath, JSON.stringify(sessionIndexJson, null, 2) + '\n', 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        jsonOutputPath,
        sessions: sessions.length,
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
