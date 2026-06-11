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
  surfaceQueueJson: path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
  nextSurfaceChecklistJson: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'),
  nextSurfaceChecklistHtml: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.html'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-surface-status-board.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-surface-status-board.md'),
  json: path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
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

  const [surfaceQueueRaw] = await Promise.all([readFile(inputPaths.surfaceQueueJson, 'utf8')]);
  const surfaceQueue = JSON.parse(surfaceQueueRaw);

  let nextSurfaceChecklist = null;
  try {
    nextSurfaceChecklist = JSON.parse(await readFile(inputPaths.nextSurfaceChecklistJson, 'utf8'));
  } catch {
    nextSurfaceChecklist = null;
  }

  let gate = null;
  try {
    gate = JSON.parse(await readFile(inputPaths.gateJson, 'utf8'));
  } catch {
    gate = null;
  }

  const activeBlocker = gate?.activeBlocker ?? {
    kind: 'unknown',
    summary: 'Gate artifact was not available when this surface status board was generated.',
    target: null,
    latestStatus: null,
    latestOperation: null,
    latestTool: null,
    evidencePath: null,
    nextAction: 'Run `npm run ntl:compare-entry-review-gate` and rebuild the surface status board.',
  };

  const surfaces = Array.isArray(surfaceQueue.surfaces)
    ? surfaceQueue.surfaces.map((surface) => ({
        surface: surface.surface,
        state: Number(surface.totalPending) > 0 ? 'BLOCKED' : 'READY',
        totalPending: Number(surface.totalPending ?? 0),
        buildPendingCount: Number(surface.buildPendingCount ?? 0),
        reviewPendingCount: Number(surface.reviewPendingCount ?? 0),
        viewports: Array.isArray(surface.viewports) ? surface.viewports : [],
        frameCount: Array.isArray(surface.frames) ? surface.frames.length : 0,
        nextFrames: Array.isArray(surface.frames)
          ? surface.frames.slice(0, 3).map((frame) => `${frame.frame} (${frame.totalPending})`)
          : [],
        topActions: Array.isArray(surface.topActions) ? surface.topActions.slice(0, 5) : [],
      }))
    : [];

  const blockedSurfaces = surfaces.filter((surface) => surface.state === 'BLOCKED');
  const readySurfaces = surfaces.filter((surface) => surface.state === 'READY');
  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: surfaceQueue.gateState ?? 'unknown',
    readyToUnblock: Boolean(surfaceQueue.readyToUnblock),
    activeBlocker,
    totalSurfaces: surfaces.length,
    blockedSurfaceCount: blockedSurfaces.length,
    readySurfaceCount: readySurfaces.length,
    totalPending: Number(surfaceQueue.totalPending ?? 0),
    recommendedNextSurface: blockedSurfaces[0]?.surface ?? null,
    recommendedNextFrame: nextSurfaceChecklist?.recommendedNextFrame ?? null,
    recommendedNextSection: nextSurfaceChecklist?.recommendedNextSection ?? null,
    recommendedNextSurfaceChecklistPath: inputPaths.nextSurfaceChecklistHtml,
    blockedSurfaces: blockedSurfaces.map((surface) => `${surface.surface} (${surface.totalPending})`),
    readySurfaces: readySurfaces.map((surface) => surface.surface),
    surfaces,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Surface Status Board

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- activeBlocker: \`${summary.activeBlocker.kind}\`
- activeBlockerTarget: \`${summary.activeBlocker.target ?? 'none'}\`
- activeBlockerLatestStatus: \`${summary.activeBlocker.latestStatus ?? 'none'}\`
- activeBlockerLatestOperation: \`${summary.activeBlocker.latestOperation ?? 'none'}\`
- activeBlockerEvidencePath: \`${summary.activeBlocker.evidencePath ?? 'none'}\`
- totalSurfaces: \`${summary.totalSurfaces}\`
- blockedSurfaceCount: \`${summary.blockedSurfaceCount}\`
- readySurfaceCount: \`${summary.readySurfaceCount}\`
- totalPending: \`${summary.totalPending}\`
- recommendedNextSurface: \`${summary.recommendedNextSurface ?? 'none'}\`
- recommendedNextFrame: \`${summary.recommendedNextFrame ?? 'none'}\`
- recommendedNextSection: \`${summary.recommendedNextSection ?? 'none'}\`
- recommendedNextSurfaceChecklistPath: \`${summary.recommendedNextSurfaceChecklistPath}\`

## Active Blocker

- summary: ${summary.activeBlocker.summary}
- nextAction: ${summary.activeBlocker.nextAction}

## Blocked Surfaces

${formatMarkdownList(summary.blockedSurfaces, 'none')}

## Ready Surfaces

${formatMarkdownList(summary.readySurfaces, 'none')}

## Surface Details

${
  summary.surfaces.length
    ? summary.surfaces
        .map(
          (surface) => `### ${surface.surface}

- state: \`${surface.state}\`
- totalPending: \`${surface.totalPending}\`
- buildPending: \`${surface.buildPendingCount}\`
- reviewPending: \`${surface.reviewPendingCount}\`
- frameCount: \`${surface.frameCount}\`
- viewports: \`${surface.viewports.join(', ')}\`

#### Next Frames

${formatMarkdownList(surface.nextFrames, 'none')}

#### Top Actions

${formatMarkdownList(surface.topActions, 'none')}`,
        )
        .join('\n\n')
    : '- none'
}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Surface Status Board</title>
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
        max-width: 1440px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel, .surface-card {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p { margin: 0; color: var(--muted); }
      .summary, .grid-2, .surfaces {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .surfaces { grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); }
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
      .badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0 14px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 700;
      }
      .badge.ready { background: rgba(15, 159, 110, 0.12); color: var(--ok); }
      .badge.blocked { background: rgba(197, 48, 48, 0.12); color: var(--bad); }
      .badge.warn { background: rgba(183, 121, 31, 0.12); color: var(--warn); }
      h2, h3 { margin: 0 0 10px; }
      h2 { font-size: 18px; }
      h3 { font-size: 18px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      .section-block {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Surface Status Board</h1>
        <p>Surface queue를 기반으로 Brand / Category / Search 단위 완료 상태와 우선순위를 정리한 board입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Active Blocker</strong><span>${escapeHtml(summary.activeBlocker.kind)}</span></div>
        <div class="metric"><strong>Blocked Surfaces</strong><span>${escapeHtml(summary.blockedSurfaceCount)}</span></div>
        <div class="metric"><strong>Ready Surfaces</strong><span>${escapeHtml(summary.readySurfaceCount)}</span></div>
        <div class="metric"><strong>Total Pending</strong><span>${escapeHtml(summary.totalPending)}</span></div>
        <div class="metric"><strong>Recommended Next Surface</strong><span>${escapeHtml(summary.recommendedNextSurface ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Frame</strong><span>${escapeHtml(summary.recommendedNextFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Section</strong><span>${escapeHtml(summary.recommendedNextSection ?? 'none')}</span></div>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Blocked Surfaces</h2>
          <ul>${formatHtmlList(summary.blockedSurfaces)}</ul>
        </section>
        <section class="panel">
          <h2>Ready Surfaces</h2>
          <ul>${formatHtmlList(summary.readySurfaces)}</ul>
        </section>
        <section class="panel">
          <h2>Active Blocker</h2>
          <ul>
            <li>${escapeHtml(`kind: ${summary.activeBlocker.kind}`)}</li>
            <li>${escapeHtml(`summary: ${summary.activeBlocker.summary}`)}</li>
            <li>${escapeHtml(`target: ${summary.activeBlocker.target ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestStatus: ${summary.activeBlocker.latestStatus ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestOperation: ${summary.activeBlocker.latestOperation ?? 'none'}`)}</li>
            <li>${escapeHtml(`evidencePath: ${summary.activeBlocker.evidencePath ?? 'none'}`)}</li>
            <li>${escapeHtml(`nextAction: ${summary.activeBlocker.nextAction}`)}</li>
          </ul>
        </section>
        <section class="panel">
          <h2>Recommended Checklist Entry</h2>
          <ul>
            <li>${escapeHtml(`path: ${summary.recommendedNextSurfaceChecklistPath}`)}</li>
            <li>${escapeHtml(`frame: ${summary.recommendedNextFrame ?? 'none'}`)}</li>
            <li>${escapeHtml(`section: ${summary.recommendedNextSection ?? 'none'}`)}</li>
          </ul>
        </section>
      </section>

      <section class="surfaces">
        ${
          summary.surfaces.length
            ? summary.surfaces
                .map(
                  (surface) => `<article class="surface-card">
            <h3>${escapeHtml(surface.surface)}</h3>
            <div class="badge-row">
              <span class="badge ${surface.state === 'READY' ? 'ready' : 'blocked'}">${escapeHtml(surface.state)}</span>
              <span class="badge warn">pending ${escapeHtml(surface.totalPending)}</span>
              <span class="badge warn">build ${escapeHtml(surface.buildPendingCount)}</span>
              <span class="badge warn">review ${escapeHtml(surface.reviewPendingCount)}</span>
            </div>
            <p>viewports: ${escapeHtml(surface.viewports.join(', ') || 'none')}</p>
            <div class="section-block">
              <h2>Next Frames</h2>
              <ul>${formatHtmlList(surface.nextFrames)}</ul>
            </div>
            <div class="section-block">
              <h2>Top Actions</h2>
              <ul>${formatHtmlList(surface.topActions)}</ul>
            </div>
          </article>`,
                )
                .join('')
            : '<section class="panel"><h2>No Surface Backlog</h2><p>All surfaces are clear.</p></section>'
        }
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
        totalSurfaces: summary.totalSurfaces,
        blockedSurfaceCount: summary.blockedSurfaceCount,
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
