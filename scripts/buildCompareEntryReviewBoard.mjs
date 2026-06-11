import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'output', 'playwright');
const surfaceSummaryPath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');
const outputPath = path.join(artifactDir, 'compare-entry-design-review-board.html');

const screenshotLabels = {
  brandHero: 'Brand Hero',
  brandRoutes: 'Brand Routes',
  brandShortlist: 'Brand Shortlist Re-entry',
  searchSummary: 'Search Summary Metrics',
  searchHighlights: 'Search Highlights',
  searchHighlightCard: 'Search Highlight Card',
  searchResultCard: 'Search Result Card',
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function main() {
  const raw = await readFile(surfaceSummaryPath, 'utf8');
  const summary = JSON.parse(raw);
  await mkdir(artifactDir, { recursive: true });

  const cards = Object.entries(screenshotLabels)
    .map(([key, label]) => {
      const imagePath = summary.screenshots?.[key];
      return `
        <section class="card">
          <div class="card-head">
            <h2>${escapeHtml(label)}</h2>
            <code>${escapeHtml(imagePath ?? '(missing)')}</code>
          </div>
          ${
            imagePath
              ? `<img src="${escapeHtml(imagePath)}" alt="${escapeHtml(label)}" />`
              : '<div class="missing">Screenshot missing</div>'
          }
        </section>
      `;
    })
    .join('\n');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Design Review Board</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f5f7fb;
        --panel: #ffffff;
        --line: #d7deea;
        --text: #152033;
        --muted: #5d6a82;
        --accent: #0f172a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, var(--bg) 26%, #f7f8fb 100%);
        color: var(--text);
      }
      main {
        max-width: 1600px;
        margin: 0 auto;
        padding: 32px 24px 56px;
      }
      .hero {
        display: grid;
        gap: 16px;
        margin-bottom: 24px;
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: rgba(255,255,255,0.82);
        backdrop-filter: blur(10px);
      }
      h1 {
        margin: 0;
        font-size: 32px;
        line-height: 1.1;
      }
      .summary {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 12px;
      }
      .metric {
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: var(--panel);
      }
      .metric strong,
      .checklist strong {
        display: block;
        margin-bottom: 6px;
        font-size: 12px;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: var(--muted);
      }
      .metric span {
        font-size: 15px;
        word-break: break-all;
      }
      .checklist {
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 20px;
        background: #f9fbff;
      }
      .checklist ul {
        margin: 0;
        padding-left: 18px;
        display: grid;
        gap: 8px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
        gap: 16px;
      }
      .card {
        display: grid;
        gap: 12px;
        padding: 18px;
        border: 1px solid var(--line);
        border-radius: 22px;
        background: rgba(255,255,255,0.9);
      }
      .card-head {
        display: grid;
        gap: 8px;
      }
      .card h2 {
        margin: 0;
        font-size: 19px;
      }
      code {
        padding: 8px 10px;
        border-radius: 12px;
        background: #eef2f8;
        color: #334155;
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        word-break: break-all;
      }
      img {
        width: 100%;
        height: auto;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff;
      }
      .missing {
        padding: 40px 16px;
        border: 1px dashed var(--line);
        border-radius: 18px;
        color: var(--muted);
        text-align: center;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <div>
          <h1>Compare Entry Design Review Board</h1>
        </div>
        <div class="summary">
          <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt ?? 'unknown')}</span></div>
          <div class="metric"><strong>Brand Route</strong><span>${escapeHtml(summary.routes?.brand ?? 'unknown')}</span></div>
          <div class="metric"><strong>Search Route</strong><span>${escapeHtml(summary.routes?.search ?? 'unknown')}</span></div>
          <div class="metric"><strong>Query / Count</strong><span>${escapeHtml(summary.search?.query ?? 'unknown')} / ${escapeHtml(summary.search?.displayedCount ?? 'unknown')}</span></div>
        </div>
        <div class="checklist">
          <strong>Review Flow</strong>
          <ul>
            <li>Run <code>npm run ntl:compare-entry-review-prep</code></li>
            <li>Review this board with the Figma kickoff file</li>
            <li>Fill <code>output/playwright/compare-entry-design-review-worksheet.md</code></li>
            <li>Decide <code>Approved</code>, <code>Approved With Follow-up</code>, or <code>Needs Revision</code></li>
          </ul>
        </div>
      </section>
      <section class="grid">
        ${cards}
      </section>
    </main>
  </body>
</html>`;

  await writeFile(outputPath, html, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        surfaceSummaryPath,
        outputPath,
        screenshots: Object.keys(summary.screenshots ?? {}).length,
        displayedCount: summary.search?.displayedCount ?? null,
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
