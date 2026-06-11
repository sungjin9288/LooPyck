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
  surfaceStatusJson: path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
  surfaceQueueJson: path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
  frameProgressJson: path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
  missingDetailJson: path.join(artifactDir, 'compare-entry-review-missing-detail.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-next-surface-packet.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-next-surface-packet.md'),
  json: path.join(artifactDir, 'compare-entry-review-next-surface-packet.json'),
};

const surfaceMetaByName = {
  'Brand-Musinsa': {
    label: 'Brand Entry',
    route: '/brand/musinsa',
    sourcePrompt: '브랜드 랜딩 compare funnel 진입',
  },
  'Category-Sneakers': {
    label: 'Category Entry',
    route: '/category/sneakers',
    sourcePrompt: '카테고리 랜딩 compare funnel 진입',
  },
  'Search-Results-Hood': {
    label: 'Search Result Entry',
    route: '/?q=남자%20후드&sort=sim',
    sourcePrompt: '검색 결과 compare hierarchy 진입',
  },
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

function getSurfaceMeta(surface) {
  return surfaceMetaByName[surface] ?? {
    label: 'Unknown Surface',
    route: 'unknown',
    sourcePrompt: 'unknown',
  };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [surfaceStatusRaw, surfaceQueueRaw, frameProgressRaw, missingDetailRaw] = await Promise.all([
    readFile(inputPaths.surfaceStatusJson, 'utf8'),
    readFile(inputPaths.surfaceQueueJson, 'utf8'),
    readFile(inputPaths.frameProgressJson, 'utf8'),
    readFile(inputPaths.missingDetailJson, 'utf8'),
  ]);

  const surfaceStatus = JSON.parse(surfaceStatusRaw);
  const surfaceQueue = JSON.parse(surfaceQueueRaw);
  const frameProgress = JSON.parse(frameProgressRaw);
  const missingDetail = JSON.parse(missingDetailRaw);

  const recommendedSurfaceName = surfaceStatus.recommendedNextSurface ?? null;
  const surfaceMeta = recommendedSurfaceName ? getSurfaceMeta(recommendedSurfaceName) : null;
  const surfaceEntry = recommendedSurfaceName
    ? (surfaceQueue.surfaces ?? []).find((surface) => surface.surface === recommendedSurfaceName) ?? null
    : null;

  const detailedFrames = surfaceEntry
    ? (surfaceEntry.frames ?? []).map((frame) => {
        const detailedFrame = (frameProgress.frames ?? []).find((entry) => entry.frame === frame.frame) ?? null;
        return {
          frame: frame.frame,
          viewport: frame.viewport,
          phase: detailedFrame?.phase ?? frame.phase ?? 'Unknown',
          totalPending: Number(detailedFrame?.totalPending ?? frame.totalPending ?? 0),
          buildPendingCount: Number(detailedFrame?.buildPendingCount ?? frame.buildPendingCount ?? 0),
          reviewPendingCount: Number(detailedFrame?.reviewPendingCount ?? frame.reviewPendingCount ?? 0),
          buildPending: Array.isArray(detailedFrame?.buildPending) ? detailedFrame.buildPending : [],
          reviewPending: Array.isArray(detailedFrame?.reviewPending) ? detailedFrame.reviewPending : [],
          focusActions: Array.isArray(detailedFrame?.focusActions) ? detailedFrame.focusActions : [],
        };
      })
    : [];

  const links = {
    manualPacket: path.join(artifactDir, 'compare-entry-manual-figma-packet.html'),
    frameSpecs: path.join(artifactDir, 'compare-entry-manual-frame-specs.md'),
    buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    reviewWorksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
    decisionLog: path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
    missingDetail: path.join(artifactDir, 'compare-entry-review-missing-detail.md'),
    focusPlan: path.join(artifactDir, 'compare-entry-review-focus-plan.md'),
    frameProgress: path.join(artifactDir, 'compare-entry-review-frame-progress-board.html'),
    surfaceQueue: path.join(artifactDir, 'compare-entry-review-surface-queue.html'),
    surfaceStatus: path.join(artifactDir, 'compare-entry-review-surface-status-board.html'),
    gate: path.join(artifactDir, 'compare-entry-review-gate.md'),
    figmaRetryPacket: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
    approvalBoard: path.join(artifactDir, 'compare-entry-approval-board.html'),
    latestHandoff: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
  };
  const activeBlocker = normalizeActiveBlocker(surfaceStatus.activeBlocker, {
    kind: surfaceStatus.readyToUnblock ? 'none' : 'unknown',
    summary: 'Surface status board did not provide an active blocker summary.',
    evidencePath: links.surfaceStatus,
    nextAction: 'Refresh `npm run ntl:compare-entry-review-surface-status` and rebuild this packet.',
  });

  const nextSteps = recommendedSurfaceName
    ? [
        `Open \`${links.manualPacket}\`, \`${links.frameSpecs}\`, \`${links.buildWorksheet}\` first.`,
        `Start on \`${recommendedSurfaceName}\` route \`${surfaceMeta.route}\` and preserve the current entry meaning: ${surfaceMeta.sourcePrompt}.`,
        ...detailedFrames.map(
          (frame, index) =>
            `Step ${index + 1}: finish ${frame.frame} (${frame.phase}, total pending ${frame.totalPending}).`,
        ),
        'After the surface frames are built, clear the corresponding review worksheet checks for the same frames.',
        'Then re-run `npm run ntl:compare-entry-review-finalize` and `npm run ntl:compare-entry-review-ready-check`.',
      ]
    : [
        'No blocked surface remains. Open the approval board and confirm whether `SUN-10` is ready to unblock `SUN-11` / `SUN-12`.',
      ];

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: surfaceStatus.gateState ?? 'unknown',
    readyToUnblock: Boolean(surfaceStatus.readyToUnblock),
    activeBlocker,
    hasRecommendedSurface: Boolean(recommendedSurfaceName && surfaceEntry),
    recommendedSurface: recommendedSurfaceName && surfaceEntry
      ? {
          surface: recommendedSurfaceName,
          label: surfaceMeta?.label ?? 'Unknown Surface',
          route: surfaceMeta?.route ?? 'unknown',
          sourcePrompt: surfaceMeta?.sourcePrompt ?? 'unknown',
          totalPending: Number(surfaceEntry?.totalPending ?? 0),
          buildPendingCount: Number(surfaceEntry?.buildPendingCount ?? 0),
          reviewPendingCount: Number(surfaceEntry?.reviewPendingCount ?? 0),
          frameCount: detailedFrames.length,
          viewports: Array.isArray(surfaceEntry?.viewports) ? surfaceEntry.viewports : [],
          topActions: Array.isArray(surfaceEntry?.topActions) ? surfaceEntry.topActions : [],
          frames: detailedFrames,
        }
      : null,
    buildCrossCutPending: Array.isArray(missingDetail.build?.crossCutPending) ? missingDetail.build.crossCutPending : [],
    reviewCrossCutPending: Array.isArray(missingDetail.review?.crossCutPending) ? missingDetail.review.crossCutPending : [],
    decisionPending: Array.isArray(missingDetail.decision?.pending) ? missingDetail.decision.pending : [],
    nextSteps,
    links,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Next Surface Packet

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- activeBlocker: \`${summary.activeBlocker.kind}\`
- activeBlockerTarget: \`${summary.activeBlocker.target ?? 'none'}\`
- activeBlockerLatestStatus: \`${summary.activeBlocker.latestStatus ?? 'none'}\`
- activeBlockerLatestOperation: \`${summary.activeBlocker.latestOperation ?? 'none'}\`
- hasRecommendedSurface: \`${summary.hasRecommendedSurface ? 'true' : 'false'}\`
- recommendedSurface: \`${summary.recommendedSurface?.surface ?? 'none'}\`
- route: \`${summary.recommendedSurface?.route ?? 'none'}\`
- totalPending: \`${summary.recommendedSurface?.totalPending ?? 0}\`
- buildPending: \`${summary.recommendedSurface?.buildPendingCount ?? 0}\`
- reviewPending: \`${summary.recommendedSurface?.reviewPendingCount ?? 0}\`

${formatActiveBlockerMarkdown(summary.activeBlocker)}

## Next Steps

${formatMarkdownList(summary.nextSteps, 'none')}

## Build Cross-Cut Pending

${formatMarkdownList(summary.buildCrossCutPending, 'none')}

## Review Cross-Cut Pending

${formatMarkdownList(summary.reviewCrossCutPending, 'none')}

## Decision Pending

${formatMarkdownList(summary.decisionPending, 'none')}

## Surface Top Actions

${formatMarkdownList(summary.recommendedSurface?.topActions ?? [], 'none')}

## Frames

${
  detailedFrames.length
    ? detailedFrames
        .map(
          (frame) => `### ${frame.frame}

- viewport: \`${frame.viewport}\`
- phase: \`${frame.phase}\`
- totalPending: \`${frame.totalPending}\`
- buildPending: \`${frame.buildPendingCount}\`
- reviewPending: \`${frame.reviewPendingCount}\`

#### Build Pending

${formatMarkdownList(frame.buildPending, 'none')}

#### Review Pending

${formatMarkdownList(frame.reviewPending, 'none')}

#### Focus Actions

${formatMarkdownList(frame.focusActions, 'none')}`,
        )
        .join('\n\n')
    : '- none'
}

## Related Artifacts

- manual packet: \`${links.manualPacket}\`
- frame specs: \`${links.frameSpecs}\`
- build worksheet: \`${links.buildWorksheet}\`
- review worksheet: \`${links.reviewWorksheet}\`
- decision log: \`${links.decisionLog}\`
- missing detail: \`${links.missingDetail}\`
- focus plan: \`${links.focusPlan}\`
- frame progress: \`${links.frameProgress}\`
- surface queue: \`${links.surfaceQueue}\`
- surface status: \`${links.surfaceStatus}\`
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
    <title>Compare Entry Review Next Surface Packet</title>
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
        max-width: 1400px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel, .frame-card {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p { margin: 0; color: var(--muted); }
      .summary, .grid-2, .frames, .links {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .frames { grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
      .links { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
      .metric, .link-card {
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
      h3 { line-height: 1.35; }
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
        <h1>Compare Entry Review Next Surface Packet</h1>
        <p>추천된 다음 surface 하나만 보고도 수동 Figma frame 작성과 review follow-up을 바로 시작할 수 있도록 route, frame order, pending checklist를 묶은 packet입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Active Blocker</strong><span>${escapeHtml(summary.activeBlocker.kind)}</span></div>
        <div class="metric"><strong>Recommended Surface</strong><span>${escapeHtml(summary.recommendedSurface?.surface ?? 'none')}</span></div>
        <div class="metric"><strong>Route</strong><span>${escapeHtml(summary.recommendedSurface?.route ?? 'none')}</span></div>
        <div class="metric"><strong>Total Pending</strong><span>${escapeHtml(summary.recommendedSurface?.totalPending ?? 0)}</span></div>
        <div class="metric"><strong>Frame Count</strong><span>${escapeHtml(summary.recommendedSurface?.frameCount ?? 0)}</span></div>
      </section>

      <section class="grid-2">
${formatActiveBlockerHtml(summary.activeBlocker, escapeHtml)}
        <section class="panel">
          <h2>Next Steps</h2>
          <ul>${formatHtmlList(summary.nextSteps)}</ul>
        </section>
        <section class="panel">
          <h2>Cross-Cut Pending</h2>
          <div class="section-block">
            <strong>Build</strong>
            <ul>${formatHtmlList(summary.buildCrossCutPending)}</ul>
          </div>
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

      <section class="panel">
        <h2>Surface Top Actions</h2>
        <ul>${formatHtmlList(summary.recommendedSurface?.topActions ?? [])}</ul>
      </section>

      <section class="frames">
        ${
          detailedFrames.length
            ? detailedFrames
                .map(
                  (frame) => `<article class="frame-card">
          <h3>${escapeHtml(frame.frame)}</h3>
          <div class="section-block">
            <span class="badge">${escapeHtml(frame.phase)} | total ${escapeHtml(frame.totalPending)}</span>
            <p>viewport=${escapeHtml(frame.viewport)} / build=${escapeHtml(frame.buildPendingCount)} / review=${escapeHtml(frame.reviewPendingCount)}</p>
          </div>
          <div class="section-block">
            <strong>Build Pending</strong>
            <ul>${formatHtmlList(frame.buildPending)}</ul>
          </div>
          <div class="section-block">
            <strong>Review Pending</strong>
            <ul>${formatHtmlList(frame.reviewPending)}</ul>
          </div>
          <div class="section-block">
            <strong>Focus Actions</strong>
            <ul>${formatHtmlList(frame.focusActions)}</ul>
          </div>
        </article>`,
                )
                .join('\n')
            : '<section class="panel"><p>No recommended surface remains. Use the approval board to confirm whether the review can unblock implementation.</p></section>'
        }
      </section>

      <section class="links">
        <a class="link-card" href="${links.manualPacket}"><strong>Manual Packet</strong><code>${links.manualPacket}</code></a>
        <a class="link-card" href="${links.frameSpecs}"><strong>Frame Specs</strong><code>${links.frameSpecs}</code></a>
        <a class="link-card" href="${links.buildWorksheet}"><strong>Build Worksheet</strong><code>${links.buildWorksheet}</code></a>
        <a class="link-card" href="${links.reviewWorksheet}"><strong>Review Worksheet</strong><code>${links.reviewWorksheet}</code></a>
        <a class="link-card" href="${links.decisionLog}"><strong>Decision Log</strong><code>${links.decisionLog}</code></a>
        <a class="link-card" href="${links.missingDetail}"><strong>Missing Detail</strong><code>${links.missingDetail}</code></a>
        <a class="link-card" href="${links.focusPlan}"><strong>Focus Plan</strong><code>${links.focusPlan}</code></a>
        <a class="link-card" href="${links.frameProgress}"><strong>Frame Progress</strong><code>${links.frameProgress}</code></a>
        <a class="link-card" href="${links.surfaceQueue}"><strong>Surface Queue</strong><code>${links.surfaceQueue}</code></a>
        <a class="link-card" href="${links.surfaceStatus}"><strong>Surface Status</strong><code>${links.surfaceStatus}</code></a>
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
        recommendedSurface: recommendedSurfaceName,
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
