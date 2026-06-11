import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'output', 'playwright');
const surfaceSummaryPath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');
const outputPath = path.join(artifactDir, 'compare-entry-manual-figma-packet.html');

const docs = {
  checklist: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md'),
  manifest: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_FIGMA_MANIFEST.md'),
  content: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_CONTENT_MATRIX.md'),
  inventory: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_COMPONENT_INVENTORY.md'),
  reviewChecklist: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md'),
};

const artifacts = {
  board: path.join(artifactDir, 'compare-entry-design-review-board.html'),
  packet: path.join(artifactDir, 'compare-entry-design-review-packet.md'),
  worksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
  archiveIndex: path.join(artifactDir, 'compare-entry-review-sessions', 'index.html'),
};

const frameGroups = [
  {
    title: 'Desktop',
    width: '1440',
    frames: [
      'CompareEntry/Desktop/Brand-Musinsa',
      'CompareEntry/Desktop/Category-Sneakers',
      'CompareEntry/Desktop/Search-Results-Hood',
    ],
  },
  {
    title: 'Mobile',
    width: '393',
    frames: [
      'CompareEntry/Mobile/Brand-Musinsa',
      'CompareEntry/Mobile/Category-Sneakers',
      'CompareEntry/Mobile/Search-Results-Hood',
    ],
  },
];

const entrySectionOrder = [
  'TopNav/Context',
  'Hero',
  'CompareLens',
  'SearchEntry',
  'QuickRoutes',
  'ShortlistReentry',
  'CompareProof',
  'SiblingNavigation',
];

const searchSectionOrder = [
  'SearchSummaryMetrics',
  'CompareHighlights',
  'ResultGrid',
  'ShortlistEntry',
  'DetailEntryHint',
];

const contentRules = {
  brand: [
    'eyebrow: Brand Compare Entry',
    'title: 무신사 비교 시작',
    'starter tags: 무신사스탠다드 / 무신사 한정판 / 무신사 세일',
    'compare lens 3개 signal 의미 유지',
  ],
  category: [
    'title: 👟 스니커즈 비교 시작',
    'starter keywords 5개 유지',
    'compare lens에서 price spread / option / delivery 의미 유지',
  ],
  search: [
    'summary labels: 최저 결제가 / 비교 가능 상품 / 최대 결제가 차이',
    'highlight zone은 Compare Ready 의미 유지',
    'result card는 mall count / trust / PDP / checkout evidence / shortlist action 유지',
    'dynamic values는 placeholder token으로 유지',
  ],
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderLinkCard(label, target) {
  return `<a class="link-card" href="${escapeHtml(target)}"><strong>${escapeHtml(label)}</strong><code>${escapeHtml(target)}</code></a>`;
}

async function main() {
  const raw = await readFile(surfaceSummaryPath, 'utf8');
  const summary = JSON.parse(raw);
  await mkdir(artifactDir, { recursive: true });

  const frameColumns = frameGroups
    .map(
      (group) => `
        <section class="panel">
          <h2>${escapeHtml(group.title)} Frames</h2>
          <p>width: <code>${escapeHtml(group.width)}</code>, height: <code>hug content</code></p>
          <ul>
            ${group.frames.map((frame) => `<li><code>${escapeHtml(frame)}</code></li>`).join('')}
          </ul>
        </section>
      `,
    )
    .join('');

  const contentColumns = [
    ['Brand Frame', contentRules.brand],
    ['Category Frame', contentRules.category],
    ['Search Result Frame', contentRules.search],
  ]
    .map(
      ([title, items]) => `
        <section class="panel">
          <h2>${escapeHtml(title)}</h2>
          <ul>
            ${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
          </ul>
        </section>
      `,
    )
    .join('');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Manual Figma Packet</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.92);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
        --accent: #0f172a;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, var(--bg) 24%, #f8fafc 100%);
        color: var(--text);
      }
      main {
        max-width: 1440px;
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
      .hero p {
        margin: 0;
        color: var(--muted);
      }
      .summary, .grid-2, .grid-3, .links {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .grid-3 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
      .metric {
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff;
      }
      .metric strong,
      .panel h2 {
        display: block;
        margin: 0 0 8px;
      }
      .panel h2 {
        font-size: 18px;
      }
      .metric strong {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
      }
      .metric span, .panel p, li {
        color: var(--text);
      }
      code {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        background: #eef2f8;
        padding: 4px 8px;
        border-radius: 10px;
        word-break: break-all;
      }
      ul, ol {
        margin: 0;
        padding-left: 20px;
        display: grid;
        gap: 8px;
      }
      .links {
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      }
      .link-card {
        display: grid;
        gap: 8px;
        padding: 14px 16px;
        border: 1px solid var(--line);
        border-radius: 18px;
        background: #fff;
        color: inherit;
        text-decoration: none;
      }
      .link-card:hover { border-color: #94a3b8; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Manual Figma Packet</h1>
        <p>Figma MCP limit이 막힌 상태에서 사람이 바로 frame을 만들고 review까지 이어가기 위한 single-screen reference packet입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt ?? 'unknown')}</span></div>
        <div class="metric"><strong>Brand Route</strong><span>${escapeHtml(summary.routes?.brand ?? 'unknown')}</span></div>
        <div class="metric"><strong>Search Route</strong><span>${escapeHtml(summary.routes?.search ?? 'unknown')}</span></div>
        <div class="metric"><strong>Query / Count</strong><span>${escapeHtml(summary.search?.query ?? 'unknown')} / ${escapeHtml(summary.search?.displayedCount ?? 'unknown')}</span></div>
      </section>

      <section class="panel">
        <h2>Build Flow</h2>
        <ol>
          <li>Run <code>npm run ntl:compare-entry-review-prep</code></li>
          <li>Open the Figma kickoff file: <code>https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi</code></li>
          <li>Create the 6 frames in the order listed below</li>
          <li>Assemble sections using the required order</li>
          <li>Use the review board + worksheet + checklist to decide <code>Approved</code> or <code>Needs Revision</code></li>
        </ol>
      </section>

      <section class="links">
        ${renderLinkCard('Manual Build Checklist', docs.checklist)}
        ${renderLinkCard('Figma Manifest', docs.manifest)}
        ${renderLinkCard('Content Matrix', docs.content)}
        ${renderLinkCard('Component Inventory', docs.inventory)}
        ${renderLinkCard('Review Checklist', docs.reviewChecklist)}
        ${renderLinkCard('Review Board', artifacts.board)}
        ${renderLinkCard('Review Worksheet', artifacts.worksheet)}
        ${renderLinkCard('Review Packet', artifacts.packet)}
        ${renderLinkCard('Archive Index', artifacts.archiveIndex)}
      </section>

      <section class="grid-2">
        ${frameColumns}
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Entry Frame Section Order</h2>
          <ol>
            ${entrySectionOrder.map((item) => `<li><code>${escapeHtml(item)}</code></li>`).join('')}
          </ol>
        </section>
        <section class="panel">
          <h2>Search Result Section Order</h2>
          <ol>
            ${searchSectionOrder.map((item) => `<li><code>${escapeHtml(item)}</code></li>`).join('')}
          </ol>
        </section>
      </section>

      <section class="grid-3">
        ${contentColumns}
      </section>

      <section class="panel">
        <h2>Done Criteria</h2>
        <ul>
          <li>desktop 3 frame, mobile 3 frame created</li>
          <li>frame naming matches the manifest</li>
          <li>section order is preserved</li>
          <li>content matrix meaning is preserved</li>
          <li><code>HighlightCard</code>, <code>ResultCard</code>, <code>SummaryMetricCard</code>, <code>ShortlistButton</code> boundaries are visually clear</li>
          <li>worksheet is filled and outcome is recorded</li>
          <li>review outcome is <code>Approved</code> or <code>Approved With Follow-up</code></li>
        </ul>
      </section>
    </main>
  </body>
</html>`;

  await writeFile(outputPath, html, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        outputPath,
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
