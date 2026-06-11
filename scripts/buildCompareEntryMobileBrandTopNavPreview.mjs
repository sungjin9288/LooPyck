import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html'),
  json: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.json'),
};

const templatePath = path.join(rootDir, 'scripts', 'figmaCompareEntryMobileBrandTopNavTemplate.mjs');
const actionCardPath = path.join(artifactDir, 'compare-entry-review-next-section-action-card.html');
const buildWorksheetPath = path.join(artifactDir, 'compare-entry-manual-build-worksheet.md');

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const summary = {
    generatedAt: new Date().toISOString(),
    status: 'figma-rate-limit-fallback-preview',
    frame: 'CompareEntry/Mobile/Brand-Musinsa',
    section: 'TopNav/Context',
    route: '/brand/musinsa',
    width: 393,
    figmaFileKey: 'Oj35jzmgbwnxzpTTqTcxLi',
    worksheetPolicy: 'Do not check the build worksheet until the Figma node is actually created.',
    templatePath,
    actionCardPath,
    buildWorksheetPath,
    figmaCaptureReady: true,
    outputs: outputPaths,
  };

  await writeFile(outputPaths.json, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Mobile Brand TopNav Preview</title>
    <script src="https://mcp.figma.com/mcp/html-to-design/capture.js" async></script>
    <style>
      :root {
        color-scheme: light;
        --bg: #eef2f7;
        --ink: #0d1117;
        --panel: #111827;
        --line: #243447;
        --muted: #94a3b8;
        --lime: #f4ff3a;
        --white: #f8fafc;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background:
          radial-gradient(circle at 20% 12%, rgba(244, 255, 58, 0.22), transparent 26%),
          linear-gradient(135deg, #f8fafc 0%, var(--bg) 48%, #dbe4f0 100%);
        color: #172033;
      }
      main {
        max-width: 1080px;
        margin: 0 auto;
        padding: 32px 20px 56px;
        display: grid;
        gap: 22px;
      }
      .hero {
        display: grid;
        gap: 10px;
      }
      .hero p {
        max-width: 760px;
        margin: 0;
        color: #5e6a82;
        line-height: 1.6;
      }
      h1 {
        margin: 0;
        font-size: clamp(28px, 5vw, 48px);
        letter-spacing: -0.05em;
      }
      .stage {
        display: grid;
        grid-template-columns: minmax(0, 393px) minmax(280px, 1fr);
        gap: 24px;
        align-items: start;
      }
      .phone {
        width: 393px;
        max-width: 100%;
        min-height: 852px;
        border-radius: 46px;
        padding: 20px 18px 28px;
        background: var(--ink);
        box-shadow: 0 30px 90px rgba(15, 23, 42, 0.28);
      }
      .top-nav {
        min-height: 128px;
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 16px 18px;
        display: grid;
        gap: 14px;
      }
      .identity {
        display: flex;
        gap: 11px;
        align-items: center;
      }
      .mark {
        width: 38px;
        height: 38px;
        border-radius: 13px;
        display: grid;
        place-items: center;
        background: var(--lime);
        color: var(--ink);
        font-weight: 800;
        font-size: 19px;
      }
      .copy {
        min-width: 0;
      }
      .eyebrow {
        color: var(--lime);
        font-size: 12px;
        font-weight: 700;
        line-height: 15px;
      }
      .title {
        color: var(--white);
        font-size: 18px;
        font-weight: 800;
        line-height: 22px;
      }
      .rail {
        display: flex;
        gap: 8px;
        overflow: hidden;
      }
      .chip {
        min-width: 0;
        border: 1px solid #334155;
        border-radius: 13px;
        background: #182235;
        padding: 7px 10px;
      }
      .chip.is-build {
        border-color: #59d26f;
        background: #1b2a1f;
      }
      .chip strong {
        display: block;
        color: var(--muted);
        font-size: 9px;
        line-height: 11px;
      }
      .chip span {
        display: block;
        color: var(--white);
        font-size: 10px;
        font-weight: 700;
        line-height: 13px;
        white-space: nowrap;
      }
      .placeholder {
        min-height: 650px;
        margin-top: 0;
        border: 1px solid #1e293b;
        border-radius: 28px;
        background: #0b1220;
        padding: 24px 20px;
      }
      .placeholder h2 {
        margin: 0 0 12px;
        color: #e5e7eb;
        font-size: 22px;
        line-height: 27px;
        letter-spacing: -0.04em;
      }
      .placeholder p {
        margin: 0;
        color: var(--muted);
        font-size: 14px;
        line-height: 20px;
      }
      .panel {
        border: 1px solid #d6deeb;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.9);
        padding: 20px;
      }
      .panel h2 {
        margin: 0 0 12px;
        font-size: 18px;
      }
      .panel ul {
        margin: 0;
        padding-left: 18px;
        color: #334155;
        line-height: 1.7;
      }
      code {
        display: inline-block;
        max-width: 100%;
        border-radius: 10px;
        background: #eef2f8;
        padding: 3px 7px;
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        word-break: break-all;
      }
      @media (max-width: 860px) {
        .stage {
          grid-template-columns: 1fr;
        }
        .phone {
          margin: 0 auto;
        }
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Mobile Brand TopNav/Context Preview</h1>
        <p>
          Figma MCP rate limit fallback preview for <code>${escapeHtml(summary.frame)}</code>.
          This is not a worksheet completion artifact. Use it only as the visual reference for the
          next Figma write attempt.
        </p>
      </section>
      <section class="stage">
        <div class="phone" aria-label="CompareEntry/Mobile/Brand-Musinsa" data-figma-name="CompareEntry/Mobile/Brand-Musinsa">
          <section class="top-nav" aria-label="TopNav/Context" data-figma-name="TopNav/Context">
            <div class="identity">
              <div class="mark">L</div>
              <div class="copy">
                <div class="eyebrow">Brand Compare Entry</div>
                <div class="title">무신사 비교 시작</div>
              </div>
            </div>
            <div class="rail">
              <div class="chip"><strong>MOBILE</strong><span>393</span></div>
              <div class="chip"><strong>ROUTE</strong><span>/brand/musinsa</span></div>
              <div class="chip is-build"><strong>SUN-10</strong><span>TopNav</span></div>
            </div>
          </section>
          <section class="placeholder" aria-label="SUN-10 Remaining Sections Placeholder" data-figma-name="SUN-10 Remaining Sections Placeholder">
            <h2>Mobile Brand sections remain pending</h2>
            <p>
              This mobile frame intentionally contains only TopNav/Context. Continue with
              Hero/Search, QuickRoutes, CompareProof, SiblingNavigation, and ShortlistReentry
              before review approval.
            </p>
          </section>
        </div>
        <aside class="panel">
          <h2>Execution Notes</h2>
          <ul>
            <li>Figma file key: <code>${escapeHtml(summary.figmaFileKey)}</code></li>
            <li>Template: <code>${escapeHtml(templatePath)}</code></li>
            <li>Action card: <code>${escapeHtml(actionCardPath)}</code></li>
            <li>Worksheet policy: ${escapeHtml(summary.worksheetPolicy)}</li>
            <li>Expected next gate result remains <code>BLOCKED</code> until the Figma node exists and all required sections are completed.</li>
          </ul>
        </aside>
      </section>
    </main>
  </body>
</html>
`;

  await writeFile(outputPaths.html, html, 'utf8');
  process.stdout.write(`${outputPaths.html}\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
