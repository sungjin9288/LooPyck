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
  frameProgressJson: path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
  focusPlanJson: path.join(artifactDir, 'compare-entry-review-focus-plan.json'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-surface-queue.md'),
  json: path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
};

function formatList(items, emptyState = 'none') {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseFrameIdentity(frameName) {
  const match = String(frameName).match(/^CompareEntry\/(Desktop|Mobile)\/(.+)$/);
  if (!match) {
    return {
      viewport: 'Unknown',
      surface: String(frameName),
    };
  }

  return {
    viewport: match[1],
    surface: match[2],
  };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const frameProgressRaw = await readFile(inputPaths.frameProgressJson, 'utf8');
  let focusPlanRaw = null;

  try {
    focusPlanRaw = await readFile(inputPaths.focusPlanJson, 'utf8');
  } catch {
    focusPlanRaw = null;
  }

  const frameProgress = JSON.parse(frameProgressRaw);
  const focusPlan = focusPlanRaw ? JSON.parse(focusPlanRaw) : { topActions: [] };
  const surfaceMap = new Map();

  for (const frame of frameProgress.frames ?? []) {
    const identity = parseFrameIdentity(frame.frame);
    if (!surfaceMap.has(identity.surface)) {
      surfaceMap.set(identity.surface, {
        surface: identity.surface,
        totalPending: 0,
        buildPendingCount: 0,
        reviewPendingCount: 0,
        viewports: [],
        frames: [],
        topActions: [],
      });
    }

    const surfaceEntry = surfaceMap.get(identity.surface);
    surfaceEntry.totalPending += Number(frame.totalPending ?? 0);
    surfaceEntry.buildPendingCount += Number(frame.buildPendingCount ?? 0);
    surfaceEntry.reviewPendingCount += Number(frame.reviewPendingCount ?? 0);
    if (!surfaceEntry.viewports.includes(identity.viewport)) {
      surfaceEntry.viewports.push(identity.viewport);
    }
    surfaceEntry.frames.push({
      frame: frame.frame,
      viewport: identity.viewport,
      totalPending: Number(frame.totalPending ?? 0),
      buildPendingCount: Number(frame.buildPendingCount ?? 0),
      reviewPendingCount: Number(frame.reviewPendingCount ?? 0),
      phase: frame.phase ?? 'Unknown',
    });
  }

  for (const action of focusPlan.topActions ?? []) {
    if (typeof action.label !== 'string') continue;
    const frameName = action.label.split(': ')[0];
    const identity = parseFrameIdentity(frameName);
    if (!surfaceMap.has(identity.surface)) continue;
    surfaceMap.get(identity.surface).topActions.push(action.label);
  }

  const surfaces = [...surfaceMap.values()]
    .map((surface) => ({
      ...surface,
      frames: surface.frames.sort((a, b) => b.totalPending - a.totalPending || a.frame.localeCompare(b.frame)),
      topActions: surface.topActions.slice(0, 6),
    }))
    .sort((a, b) => b.totalPending - a.totalPending || a.surface.localeCompare(b.surface));

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: frameProgress.gateState ?? 'unknown',
    readyToUnblock: Boolean(frameProgress.readyToUnblock),
    totalSurfaces: surfaces.length,
    totalFrames: Number(frameProgress.totalFrames ?? 0),
    totalPending: Number(frameProgress.totalPending ?? 0),
    recommendedSurfaceOrder: surfaces.map((surface) => `${surface.surface} (${surface.totalPending})`),
    surfaces,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Surface Queue

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- totalSurfaces: \`${summary.totalSurfaces}\`
- totalFrames: \`${summary.totalFrames}\`
- totalPending: \`${summary.totalPending}\`

## Recommended Surface Order

${formatList(summary.recommendedSurfaceOrder, 'none')}

## Surface Queue

${
  summary.surfaces.length
    ? summary.surfaces
        .map(
          (surface) => `### ${surface.surface}

- totalPending: \`${surface.totalPending}\`
- buildPending: \`${surface.buildPendingCount}\`
- reviewPending: \`${surface.reviewPendingCount}\`
- viewports: \`${surface.viewports.join(', ')}\`

#### Frames

${formatList(
  surface.frames.map(
    (frame) =>
      `${frame.frame} | phase=${frame.phase} | total=${frame.totalPending} | build=${frame.buildPendingCount} | review=${frame.reviewPendingCount}`,
  ),
)}

#### Top Actions

${formatList(surface.topActions, 'none')}`,
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
    <title>Compare Entry Surface Queue</title>
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
      .hero, .panel, .surface-card {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p { margin: 0; color: var(--muted); }
      .summary, .surfaces {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .surfaces { grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
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
      h2, h3 { margin: 0 0 10px; }
      h2 { font-size: 18px; }
      h3 { font-size: 18px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      .badges {
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
        color: var(--warn);
        background: rgba(183, 121, 31, 0.12);
      }
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
        <h1>Compare Entry Surface Queue</h1>
        <p>manual reviewer가 frame이 아니라 surface 단위로 backlog를 처리할 수 있게 정리한 queue board입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Total Surfaces</strong><span>${escapeHtml(summary.totalSurfaces)}</span></div>
        <div class="metric"><strong>Total Frames</strong><span>${escapeHtml(summary.totalFrames)}</span></div>
        <div class="metric"><strong>Total Pending</strong><span>${escapeHtml(summary.totalPending)}</span></div>
      </section>

      <section class="panel">
        <h2>Recommended Surface Order</h2>
        <ul>${(summary.recommendedSurfaceOrder ?? []).map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>none</li>'}</ul>
      </section>

      <section class="surfaces">
        ${
          summary.surfaces.length
            ? summary.surfaces
                .map(
                  (surface) => `
            <article class="surface-card">
              <h3>${escapeHtml(surface.surface)}</h3>
              <div class="badges">
                <span class="badge">Pending ${escapeHtml(surface.totalPending)}</span>
                <span class="badge">Build ${escapeHtml(surface.buildPendingCount)}</span>
                <span class="badge">Review ${escapeHtml(surface.reviewPendingCount)}</span>
              </div>
              <p><code>${escapeHtml(surface.viewports.join(', '))}</code></p>
              <h2>Frames</h2>
              <ul>
                ${surface.frames
                  .map(
                    (frame) =>
                      `<li>${escapeHtml(frame.frame)} | phase=${escapeHtml(frame.phase)} | total=${escapeHtml(frame.totalPending)} | build=${escapeHtml(frame.buildPendingCount)} | review=${escapeHtml(frame.reviewPendingCount)}</li>`,
                  )
                  .join('')}
              </ul>
              <h2>Top Actions</h2>
              <ul>${surface.topActions.map((item) => `<li>${escapeHtml(item)}</li>`).join('') || '<li>none</li>'}</ul>
            </article>`,
                )
                .join('\n')
            : '<article class="surface-card"><p>No pending surface queue.</p></article>'
        }
      </section>
    </main>
  </body>
</html>`;

  await writeFile(
    path.join(artifactDir, 'compare-entry-review-surface-queue.html'),
    html,
    'utf8',
  );

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        htmlPath: path.join(artifactDir, 'compare-entry-review-surface-queue.html'),
        totalSurfaces: summary.totalSurfaces,
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
