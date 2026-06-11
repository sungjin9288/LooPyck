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
  nextSectionPacketJson: path.join(artifactDir, 'compare-entry-review-next-section-packet.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-section-progress-board.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-section-progress-board.md'),
  json: path.join(artifactDir, 'compare-entry-review-section-progress-board.json'),
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

function routeForSurface(surface) {
  if (surface === 'Brand-Musinsa') return '/brand/musinsa';
  if (surface === 'Category-Sneakers') return '/category/sneakers';
  if (surface === 'Search-Results-Hood') return '/?q=남자%20후드&sort=sim';
  return 'unknown';
}

function getFrameSections(frameName) {
  if (!frameName) return [];
  if (frameName.includes('Search-Results-Hood')) {
    return [
      'SearchSummaryMetrics',
      'CompareHighlights',
      'ResultGrid',
      'ShortlistEntry',
      'DetailEntryHint',
    ];
  }
  if (frameName.includes('Brand-Musinsa') || frameName.includes('Category-Sneakers')) {
    return [
      'TopNav/Context',
      'Hero/Search',
      'QuickRoutes',
      'CompareProof',
      'SiblingNavigation',
      'ShortlistReentry',
    ];
  }
  return [];
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [frameProgressRaw, nextSectionPacketRaw] = await Promise.all([
    readFile(inputPaths.frameProgressJson, 'utf8'),
    readFile(inputPaths.nextSectionPacketJson, 'utf8'),
  ]);

  const frameProgress = JSON.parse(frameProgressRaw);
  const nextSectionPacket = JSON.parse(nextSectionPacketRaw);
  const recommendedFrameName = nextSectionPacket?.recommendedFrame?.frame ?? null;
  const recommendedSectionName = nextSectionPacket?.recommendedSection?.section ?? null;
  const recommendedSectionPhase = nextSectionPacket?.recommendedSection?.phase ?? null;

  const frames = Array.isArray(frameProgress.frames)
    ? frameProgress.frames.map((frame) => {
        const identity = parseFrameIdentity(frame.frame);
        const sections = getFrameSections(frame.frame).map((section, index) => ({
          section,
          order: index + 1,
          phase:
            frame.frame === recommendedFrameName && section === recommendedSectionName
              ? recommendedSectionPhase ?? frame.phase ?? 'Unknown'
              : frame.phase ?? 'Unknown',
          isRecommended: frame.frame === recommendedFrameName && section === recommendedSectionName,
        }));

        return {
          frame: frame.frame,
          viewport: identity.viewport,
          surface: identity.surface,
          route: routeForSurface(identity.surface),
          phase: frame.phase ?? 'Unknown',
          totalPending: Number(frame.totalPending ?? 0),
          buildPendingCount: Number(frame.buildPendingCount ?? 0),
          reviewPendingCount: Number(frame.reviewPendingCount ?? 0),
          focusActions: Array.isArray(frame.focusActions) ? frame.focusActions : [],
          sections,
        };
      })
    : [];

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: frameProgress.gateState ?? 'unknown',
    readyToUnblock: Boolean(frameProgress.readyToUnblock),
    totalFrames: frames.length,
    totalSections: frames.reduce((sum, frame) => sum + frame.sections.length, 0),
    totalPending: Number(frameProgress.totalPending ?? 0),
    recommendedNextSurface: nextSectionPacket?.recommendedSurface?.surface ?? null,
    recommendedNextFrame: recommendedFrameName,
    recommendedNextSection: recommendedSectionName,
    frames,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Section Progress Board

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- totalFrames: \`${summary.totalFrames}\`
- totalSections: \`${summary.totalSections}\`
- totalPending: \`${summary.totalPending}\`
- recommendedNextSurface: \`${summary.recommendedNextSurface ?? 'none'}\`
- recommendedNextFrame: \`${summary.recommendedNextFrame ?? 'none'}\`
- recommendedNextSection: \`${summary.recommendedNextSection ?? 'none'}\`

## Frames

${
  summary.frames.length
    ? summary.frames
        .map(
          (frame) => `### ${frame.frame}

- route: \`${frame.route}\`
- viewport: \`${frame.viewport}\`
- phase: \`${frame.phase}\`
- totalPending: \`${frame.totalPending}\`
- buildPending: \`${frame.buildPendingCount}\`
- reviewPending: \`${frame.reviewPendingCount}\`

#### Sections

${formatMarkdownList(
  frame.sections.map(
    (section) =>
      `${section.order}. ${section.section} | phase=${section.phase}${section.isRecommended ? ' | recommended' : ''}`,
  ),
)}

#### Focus Actions

${formatMarkdownList(frame.focusActions, 'none')}`,
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
    <title>Compare Entry Section Progress</title>
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
      .summary, .frames, .grid-2 {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .frames { grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
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
        color: var(--warn);
        background: rgba(183, 121, 31, 0.12);
      }
      .badge.recommended {
        color: var(--ok);
        background: rgba(15, 159, 110, 0.12);
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
        <h1>Compare Entry Section Progress</h1>
        <p>frame backlog 위에 semantic section order를 덮어써서 manual Figma build 순서를 section 단위로 보는 board입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Ready To Unblock</strong><span>${escapeHtml(summary.readyToUnblock ? 'true' : 'false')}</span></div>
        <div class="metric"><strong>Total Frames</strong><span>${escapeHtml(summary.totalFrames)}</span></div>
        <div class="metric"><strong>Total Sections</strong><span>${escapeHtml(summary.totalSections)}</span></div>
        <div class="metric"><strong>Total Pending</strong><span>${escapeHtml(summary.totalPending)}</span></div>
        <div class="metric"><strong>Recommended Next Surface</strong><span>${escapeHtml(summary.recommendedNextSurface ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Frame</strong><span>${escapeHtml(summary.recommendedNextFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Section</strong><span>${escapeHtml(summary.recommendedNextSection ?? 'none')}</span></div>
      </section>

      <section class="frames">
        ${
          summary.frames.length
            ? summary.frames
                .map(
                  (frame) => `
                    <article class="frame-card">
                      <h2>${escapeHtml(frame.frame)}</h2>
                      <p>${escapeHtml(frame.route)}</p>
                      <div class="badge-row">
                        <span class="badge">${escapeHtml(frame.phase)}</span>
                        <span class="badge">${escapeHtml(`pending ${frame.totalPending}`)}</span>
                        <span class="badge">${escapeHtml(`build ${frame.buildPendingCount}`)}</span>
                        <span class="badge">${escapeHtml(`review ${frame.reviewPendingCount}`)}</span>
                      </div>
                      <section class="grid-2">
                        <section class="panel">
                          <h3>Sections</h3>
                          <ul>${formatHtmlList(
                            frame.sections.map(
                              (section) =>
                                `${section.order}. ${section.section} | ${section.phase}${section.isRecommended ? ' | recommended' : ''}`,
                            ),
                          )}</ul>
                        </section>
                        <section class="panel">
                          <h3>Focus Actions</h3>
                          <ul>${formatHtmlList(frame.focusActions, 'none')}</ul>
                        </section>
                      </section>
                    </article>
                  `,
                )
                .join('')
            : '<section class="panel"><p>No frame backlog remains.</p></section>'
        }
      </section>
    </main>
  </body>
</html>
`;

  await writeFile(outputPaths.html, html, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        htmlPath: outputPaths.html,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        totalFrames: summary.totalFrames,
        totalSections: summary.totalSections,
        recommendedNextSection: summary.recommendedNextSection,
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
