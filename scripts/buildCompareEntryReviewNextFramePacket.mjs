import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  formatActiveBlockerHtml,
  formatActiveBlockerMarkdown,
  normalizeActiveBlocker,
} from './compareEntryActiveBlocker.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const inputPaths = {
  nextSurfacePacketJson: path.join(artifactDir, 'compare-entry-review-next-surface-packet.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-next-frame-packet.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-next-frame-packet.md'),
  json: path.join(artifactDir, 'compare-entry-review-next-frame-packet.json'),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatMarkdownList(items, emptyState = 'none') {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function formatHtmlList(items, emptyState = 'none') {
  if (!items.length) return `<li>${escapeHtml(emptyState)}</li>`;
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const nextSurfacePacketRaw = await readFile(inputPaths.nextSurfacePacketJson, 'utf8');
  const nextSurfacePacket = JSON.parse(nextSurfacePacketRaw);
  const recommendedSurface = nextSurfacePacket.recommendedSurface ?? null;
  const recommendedFrame = Array.isArray(recommendedSurface?.frames) ? recommendedSurface.frames[0] ?? null : null;
  const siblingFrames = Array.isArray(recommendedSurface?.frames) ? recommendedSurface.frames.slice(1) : [];

  const links = {
    manualPacket: nextSurfacePacket.links?.manualPacket ?? path.join(artifactDir, 'compare-entry-manual-figma-packet.html'),
    frameSpecs: nextSurfacePacket.links?.frameSpecs ?? path.join(artifactDir, 'compare-entry-manual-frame-specs.md'),
    buildWorksheet: nextSurfacePacket.links?.buildWorksheet ?? path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    reviewWorksheet: nextSurfacePacket.links?.reviewWorksheet ?? path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
    decisionLog: nextSurfacePacket.links?.decisionLog ?? path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
    nextSurfacePacket: path.join(artifactDir, 'compare-entry-review-next-surface-packet.html'),
    frameProgress: nextSurfacePacket.links?.frameProgress ?? path.join(artifactDir, 'compare-entry-review-frame-progress-board.html'),
    focusPlan: nextSurfacePacket.links?.focusPlan ?? path.join(artifactDir, 'compare-entry-review-focus-plan.md'),
    missingDetail: nextSurfacePacket.links?.missingDetail ?? path.join(artifactDir, 'compare-entry-review-missing-detail.md'),
    gate: nextSurfacePacket.links?.gate ?? path.join(artifactDir, 'compare-entry-review-gate.md'),
    figmaRetryPacket: nextSurfacePacket.links?.figmaRetryPacket ?? path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
    approvalBoard: nextSurfacePacket.links?.approvalBoard ?? path.join(artifactDir, 'compare-entry-approval-board.html'),
    latestHandoff: nextSurfacePacket.links?.latestHandoff ?? path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
  };
  const activeBlocker = normalizeActiveBlocker(nextSurfacePacket.activeBlocker, {
    kind: nextSurfacePacket.readyToUnblock ? 'none' : 'unknown',
    summary: 'Next surface packet did not provide an active blocker summary.',
    evidencePath: links.nextSurfacePacket,
    nextAction: 'Refresh `npm run ntl:compare-entry-review-next-surface` and rebuild this packet.',
  });

  const nextSteps = recommendedFrame
    ? [
        `Open \`${links.nextSurfacePacket}\` and confirm the current recommended surface and sibling frame order.`,
        `Start with \`${recommendedFrame.frame}\` on route \`${recommendedSurface.route}\`.`,
        `Finish all build-pending items for \`${recommendedFrame.frame}\` before moving to review checks.`,
        `Mark the matching review worksheet checks for \`${recommendedFrame.frame}\` after the frame build is visually complete.`,
        siblingFrames.length
          ? `Then continue with sibling frames: ${siblingFrames.map((frame) => frame.frame).join(', ')}.`
          : 'No sibling frame remains after this frame.',
        'Re-run `npm run ntl:compare-entry-review-finalize` and `npm run ntl:compare-entry-review-ready-check` after the frame update.',
      ]
    : [
        'No recommended frame remains. Open the approval board and confirm whether `SUN-10` is ready to unblock implementation.',
      ];

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: nextSurfacePacket.gateState ?? 'unknown',
    readyToUnblock: Boolean(nextSurfacePacket.readyToUnblock),
    activeBlocker,
    hasRecommendedFrame: Boolean(recommendedSurface && recommendedFrame),
    recommendedSurface: recommendedSurface
      ? {
          surface: recommendedSurface.surface,
          label: recommendedSurface.label,
          route: recommendedSurface.route,
          sourcePrompt: recommendedSurface.sourcePrompt,
          totalPending: Number(recommendedSurface.totalPending ?? 0),
          frameCount: Number(recommendedSurface.frameCount ?? 0),
        }
      : null,
    recommendedFrame: recommendedFrame
      ? {
          frame: recommendedFrame.frame,
          viewport: recommendedFrame.viewport,
          phase: recommendedFrame.phase,
          totalPending: Number(recommendedFrame.totalPending ?? 0),
          buildPendingCount: Number(recommendedFrame.buildPendingCount ?? 0),
          reviewPendingCount: Number(recommendedFrame.reviewPendingCount ?? 0),
          buildPending: Array.isArray(recommendedFrame.buildPending) ? recommendedFrame.buildPending : [],
          reviewPending: Array.isArray(recommendedFrame.reviewPending) ? recommendedFrame.reviewPending : [],
          focusActions: Array.isArray(recommendedFrame.focusActions) ? recommendedFrame.focusActions : [],
        }
      : null,
    siblingFrames: siblingFrames.map((frame) => ({
      frame: frame.frame,
      viewport: frame.viewport,
      totalPending: Number(frame.totalPending ?? 0),
      phase: frame.phase ?? 'Unknown',
    })),
    buildCrossCutPending: Array.isArray(nextSurfacePacket.buildCrossCutPending) ? nextSurfacePacket.buildCrossCutPending : [],
    reviewCrossCutPending: Array.isArray(nextSurfacePacket.reviewCrossCutPending) ? nextSurfacePacket.reviewCrossCutPending : [],
    decisionPending: Array.isArray(nextSurfacePacket.decisionPending) ? nextSurfacePacket.decisionPending : [],
    nextSteps,
    links,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Next Frame Packet

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- activeBlocker: \`${summary.activeBlocker.kind}\`
- activeBlockerTarget: \`${summary.activeBlocker.target ?? 'none'}\`
- activeBlockerLatestStatus: \`${summary.activeBlocker.latestStatus ?? 'none'}\`
- activeBlockerLatestOperation: \`${summary.activeBlocker.latestOperation ?? 'none'}\`
- hasRecommendedFrame: \`${summary.hasRecommendedFrame ? 'true' : 'false'}\`
- recommendedSurface: \`${summary.recommendedSurface?.surface ?? 'none'}\`
- route: \`${summary.recommendedSurface?.route ?? 'none'}\`
- recommendedFrame: \`${summary.recommendedFrame?.frame ?? 'none'}\`
- viewport: \`${summary.recommendedFrame?.viewport ?? 'none'}\`
- totalPending: \`${summary.recommendedFrame?.totalPending ?? 0}\`
- buildPending: \`${summary.recommendedFrame?.buildPendingCount ?? 0}\`
- reviewPending: \`${summary.recommendedFrame?.reviewPendingCount ?? 0}\`

${formatActiveBlockerMarkdown(summary.activeBlocker)}

## Next Steps

${formatMarkdownList(summary.nextSteps, 'none')}

## Build Pending

${formatMarkdownList(summary.recommendedFrame?.buildPending ?? [], 'none')}

## Review Pending

${formatMarkdownList(summary.recommendedFrame?.reviewPending ?? [], 'none')}

## Focus Actions

${formatMarkdownList(summary.recommendedFrame?.focusActions ?? [], 'none')}

## Sibling Frames

${formatMarkdownList(summary.siblingFrames.map((frame) => `${frame.frame} (${frame.totalPending})`), 'none')}

## Cross-Cut Pending

### Build

${formatMarkdownList(summary.buildCrossCutPending, 'none')}

### Review

${formatMarkdownList(summary.reviewCrossCutPending, 'none')}

### Decision

${formatMarkdownList(summary.decisionPending, 'none')}

## Related Artifacts

- manual packet: \`${links.manualPacket}\`
- frame specs: \`${links.frameSpecs}\`
- build worksheet: \`${links.buildWorksheet}\`
- review worksheet: \`${links.reviewWorksheet}\`
- decision log: \`${links.decisionLog}\`
- next surface packet: \`${links.nextSurfacePacket}\`
- frame progress: \`${links.frameProgress}\`
- focus plan: \`${links.focusPlan}\`
- missing detail: \`${links.missingDetail}\`
- review gate: \`${links.gate}\`
- figma retry packet: \`${links.figmaRetryPacket}\`
- approval board: \`${links.approvalBoard}\`
- latest handoff: \`${links.latestHandoff}\`
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Review Next Frame Packet</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.94);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
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
        max-width: 1360px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel, .frame-card, .link-card {
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
      .metric {
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff;
      }
      .metric strong {
        display: block;
        margin-bottom: 8px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
      }
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 700;
        color: var(--warn);
        background: rgba(183, 121, 31, 0.12);
      }
      h2, h3 { margin: 0 0 10px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      .section-block { display: grid; gap: 10px; margin-top: 14px; }
      .link-card { display: grid; gap: 8px; color: inherit; text-decoration: none; }
      .link-card:hover { border-color: #94a3b8; }
      code {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        background: #eef2f8;
        padding: 4px 8px;
        border-radius: 10px;
        word-break: break-word;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Review Next Frame Packet</h1>
        <p>추천 surface 안에서 가장 먼저 손대야 하는 frame 하나만 기준으로 build/review pending과 후속 순서를 고정한 packet입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Active Blocker</strong><span>${escapeHtml(summary.activeBlocker.kind)}</span></div>
        <div class="metric"><strong>Recommended Surface</strong><span>${escapeHtml(summary.recommendedSurface?.surface ?? 'none')}</span></div>
        <div class="metric"><strong>Route</strong><span>${escapeHtml(summary.recommendedSurface?.route ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Frame</strong><span>${escapeHtml(summary.recommendedFrame?.frame ?? 'none')}</span></div>
        <div class="metric"><strong>Total Pending</strong><span>${escapeHtml(summary.recommendedFrame?.totalPending ?? 0)}</span></div>
      </section>

      <section class="grid-2">
${formatActiveBlockerHtml(summary.activeBlocker, escapeHtml)}
        <section class="panel">
          <h2>Next Steps</h2>
          <ul>${formatHtmlList(summary.nextSteps)}</ul>
        </section>
        <section class="panel">
          <h2>Sibling Frames</h2>
          <ul>${formatHtmlList(summary.siblingFrames.map((frame) => `${frame.frame} (${frame.totalPending})`))}</ul>
        </section>
      </section>

      <section class="frame-card">
        <h2>${escapeHtml(summary.recommendedFrame?.frame ?? 'No recommended frame')}</h2>
        <div class="section-block">
          <span class="badge">${escapeHtml(summary.recommendedFrame?.phase ?? 'none')} | viewport ${escapeHtml(summary.recommendedFrame?.viewport ?? 'none')}</span>
          <p>build=${escapeHtml(summary.recommendedFrame?.buildPendingCount ?? 0)} / review=${escapeHtml(summary.recommendedFrame?.reviewPendingCount ?? 0)}</p>
        </div>
        <div class="section-block">
          <strong>Build Pending</strong>
          <ul>${formatHtmlList(summary.recommendedFrame?.buildPending ?? [])}</ul>
        </div>
        <div class="section-block">
          <strong>Review Pending</strong>
          <ul>${formatHtmlList(summary.recommendedFrame?.reviewPending ?? [])}</ul>
        </div>
        <div class="section-block">
          <strong>Focus Actions</strong>
          <ul>${formatHtmlList(summary.recommendedFrame?.focusActions ?? [])}</ul>
        </div>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Build Cross-Cut Pending</h2>
          <ul>${formatHtmlList(summary.buildCrossCutPending)}</ul>
        </section>
        <section class="panel">
          <h2>Review / Decision Pending</h2>
          <div class="section-block">
            <strong>Review</strong>
            <ul>${formatHtmlList(summary.reviewCrossCutPending)}</ul>
          </div>
          <div class="section-block">
            <strong>Decision</strong>
            <ul>${formatHtmlList(summary.decisionPending)}</ul>
          </div>
        </section>
      </section>

      <section class="links">
        <a class="link-card" href="${links.manualPacket}"><strong>Manual Packet</strong><code>${links.manualPacket}</code></a>
        <a class="link-card" href="${links.frameSpecs}"><strong>Frame Specs</strong><code>${links.frameSpecs}</code></a>
        <a class="link-card" href="${links.buildWorksheet}"><strong>Build Worksheet</strong><code>${links.buildWorksheet}</code></a>
        <a class="link-card" href="${links.reviewWorksheet}"><strong>Review Worksheet</strong><code>${links.reviewWorksheet}</code></a>
        <a class="link-card" href="${links.decisionLog}"><strong>Decision Log</strong><code>${links.decisionLog}</code></a>
        <a class="link-card" href="${links.nextSurfacePacket}"><strong>Next Surface Packet</strong><code>${links.nextSurfacePacket}</code></a>
        <a class="link-card" href="${links.frameProgress}"><strong>Frame Progress</strong><code>${links.frameProgress}</code></a>
        <a class="link-card" href="${links.focusPlan}"><strong>Focus Plan</strong><code>${links.focusPlan}</code></a>
        <a class="link-card" href="${links.missingDetail}"><strong>Missing Detail</strong><code>${links.missingDetail}</code></a>
        <a class="link-card" href="${links.gate}"><strong>Review Gate</strong><code>${links.gate}</code></a>
        <a class="link-card" href="${links.figmaRetryPacket}"><strong>Figma Retry Packet</strong><code>${links.figmaRetryPacket}</code></a>
        <a class="link-card" href="${links.approvalBoard}"><strong>Approval Board</strong><code>${links.approvalBoard}</code></a>
        <a class="link-card" href="${links.latestHandoff}"><strong>Latest Handoff</strong><code>${links.latestHandoff}</code></a>
      </section>
    </main>
  </body>
</html>`;

  await writeFile(outputPaths.html, html, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        htmlPath: outputPaths.html,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        recommendedFrame: recommendedFrame?.frame ?? null,
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
