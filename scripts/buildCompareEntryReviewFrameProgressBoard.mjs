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
  missingDetailJson: path.join(artifactDir, 'compare-entry-review-missing-detail.json'),
  focusPlanJson: path.join(artifactDir, 'compare-entry-review-focus-plan.json'),
  gateJson: path.join(artifactDir, 'compare-entry-review-gate.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-frame-progress-board.html'),
  json: path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
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

function ensureFrameSummary(target, frameName) {
  if (!target.has(frameName)) {
    target.set(frameName, {
      frame: frameName,
      buildPending: [],
      reviewPending: [],
      focusActions: [],
    });
  }

  return target.get(frameName);
}

function collectFrames(missingDetail, focusPlan) {
  const frames = new Map();

  for (const frame of missingDetail.build?.frames ?? []) {
    ensureFrameSummary(frames, frame.frame).buildPending = frame.pending ?? [];
  }

  for (const frame of missingDetail.review?.frames ?? []) {
    ensureFrameSummary(frames, frame.frame).reviewPending = frame.pending ?? [];
  }

  for (const action of focusPlan.topActions ?? []) {
    const separatorIndex = typeof action.label === 'string' ? action.label.indexOf(': ') : -1;
    if (separatorIndex <= 0) continue;
    const frameName = action.label.slice(0, separatorIndex);
    const detail = action.label.slice(separatorIndex + 2);
    if (!frameName.startsWith('CompareEntry/')) continue;
    ensureFrameSummary(frames, frameName).focusActions.push(detail);
  }

  return [...frames.values()]
    .map((frame) => {
      const buildPendingCount = frame.buildPending.length;
      const reviewPendingCount = frame.reviewPending.length;
      const totalPending = buildPendingCount + reviewPendingCount;
      let phase = 'Ready';
      if (buildPendingCount > 0) phase = 'Build Pending';
      else if (reviewPendingCount > 0) phase = 'Review Pending';

      return {
        ...frame,
        buildPendingCount,
        reviewPendingCount,
        totalPending,
        phase,
      };
    })
    .sort((a, b) => b.totalPending - a.totalPending || a.frame.localeCompare(b.frame));
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const missingDetailRaw = await readFile(inputPaths.missingDetailJson, 'utf8');
  let focusPlanRaw = null;
  let gateRaw = null;

  try {
    focusPlanRaw = await readFile(inputPaths.focusPlanJson, 'utf8');
  } catch {
    focusPlanRaw = null;
  }

  try {
    gateRaw = await readFile(inputPaths.gateJson, 'utf8');
  } catch {
    gateRaw = null;
  }

  const missingDetail = JSON.parse(missingDetailRaw);
  const focusPlan = focusPlanRaw ? JSON.parse(focusPlanRaw) : { topActions: [] };
  const gate = gateRaw ? JSON.parse(gateRaw) : { gateState: 'PENDING', readyToUnblock: false };
  const frames = collectFrames(missingDetail, focusPlan);

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: gate.gateState ?? 'unknown',
    readyToUnblock: Boolean(gate.readyToUnblock),
    totalFrames: frames.length,
    totalPending: missingDetail.totalPending ?? 0,
    buildCrossCutPendingCount: (missingDetail.build?.crossCutPending ?? []).length,
    reviewCrossCutPendingCount: (missingDetail.review?.crossCutPending ?? []).length,
    decisionPendingCount: (missingDetail.decision?.pending ?? []).length,
    frames,
    topActions: focusPlan.topActions ?? [],
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Frame Progress</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.94);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
        --ok: #0f9f6e;
        --warn: #b7791f;
        --bad: #c53030;
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
      .hero, .panel, .frame-card {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p, .frame-card p { margin: 0; color: var(--muted); }
      .summary, .grid-2, .frames {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .frames { grid-template-columns: repeat(auto-fit, minmax(340px, 1fr)); }
      .metric {
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
      h2, h3 { margin: 0 0 10px; }
      h2 { font-size: 18px; }
      h3 { font-size: 17px; line-height: 1.3; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      .badge-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0 14px;
      }
      .badge {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border-radius: 999px;
        padding: 7px 12px;
        font-size: 12px;
        font-weight: 700;
      }
      .badge.build { background: rgba(197, 48, 48, 0.12); color: var(--bad); }
      .badge.review { background: rgba(183, 121, 31, 0.12); color: var(--warn); }
      .badge.ready { background: rgba(15, 159, 110, 0.12); color: var(--ok); }
      .section-block {
        display: grid;
        gap: 10px;
        margin-top: 14px;
      }
      .empty {
        padding: 16px;
        border: 1px dashed var(--line);
        border-radius: 18px;
        color: var(--muted);
        background: #fff;
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
        <h1>Compare Entry Frame Progress</h1>
        <p>\`missing detail\`과 \`focus plan\` 기준으로 frame별 build/review pending을 한 번에 보는 진행 board입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Ready To Unblock</strong><span>${escapeHtml(summary.readyToUnblock ? 'true' : 'false')}</span></div>
        <div class="metric"><strong>Total Frames With Pending</strong><span>${escapeHtml(summary.totalFrames)}</span></div>
        <div class="metric"><strong>Total Pending</strong><span>${escapeHtml(summary.totalPending)}</span></div>
        <div class="metric"><strong>Decision Pending</strong><span>${escapeHtml(summary.decisionPendingCount)}</span></div>
        <div class="metric"><strong>Build Cross-Cut Pending</strong><span>${escapeHtml(summary.buildCrossCutPendingCount)}</span></div>
        <div class="metric"><strong>Review Cross-Cut Pending</strong><span>${escapeHtml(summary.reviewCrossCutPendingCount)}</span></div>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Top Focus Actions</h2>
          <ul>${formatList((summary.topActions ?? []).map((item) => `[P${item.priority}] ${item.label}`))}</ul>
        </section>
        <section class="panel">
          <h2>Root Artifacts</h2>
          <ul>
            <li><code>${escapeHtml(inputPaths.missingDetailJson)}</code></li>
            <li><code>${escapeHtml(inputPaths.focusPlanJson)}</code></li>
            <li><code>${escapeHtml(inputPaths.gateJson)}</code></li>
            <li><code>${escapeHtml(outputPaths.html)}</code></li>
          </ul>
        </section>
      </section>

      <section class="frames">
        ${
          frames.length
            ? frames
                .map(
                  (frame) => `
            <article class="frame-card">
              <h3>${escapeHtml(frame.frame)}</h3>
              <p>현재 phase: <strong>${escapeHtml(frame.phase)}</strong></p>
              <div class="badge-row">
                <span class="badge ${frame.phase === 'Ready' ? 'ready' : frame.buildPendingCount > 0 ? 'build' : 'review'}">${escapeHtml(frame.phase)}</span>
                <span class="badge ${frame.buildPendingCount > 0 ? 'build' : 'ready'}">Build ${escapeHtml(frame.buildPendingCount)}</span>
                <span class="badge ${frame.reviewPendingCount > 0 ? 'review' : 'ready'}">Review ${escapeHtml(frame.reviewPendingCount)}</span>
                <span class="badge ${frame.totalPending > 0 ? 'review' : 'ready'}">Total ${escapeHtml(frame.totalPending)}</span>
              </div>

              <div class="section-block">
                <h2>Build Pending</h2>
                <ul>${formatList(frame.buildPending)}</ul>
              </div>

              <div class="section-block">
                <h2>Review Pending</h2>
                <ul>${formatList(frame.reviewPending)}</ul>
              </div>

              <div class="section-block">
                <h2>Focus Actions</h2>
                <ul>${formatList(frame.focusActions)}</ul>
              </div>
            </article>`,
                )
                .join('\n')
            : '<div class="empty">No frame-level pending items. Current worksheet state is clean.</div>'
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
        jsonPath: outputPaths.json,
        totalFrames: summary.totalFrames,
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
