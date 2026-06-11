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
  nextSurfaceSectionPacketJson: path.join(
    artifactDir,
    'compare-entry-review-next-surface-section-packet.json',
  ),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.md'),
  json: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'),
};

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatMarkdownChecklist(items, emptyState = 'none') {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- [ ] ${item}`).join('\n');
}

function formatHtmlChecklist(items, emptyState = 'none') {
  if (!items.length) return `<li>${escapeHtml(emptyState)}</li>`;
  return items
    .map(
      (item) =>
        `<li><label><input type="checkbox" disabled /> <span>${escapeHtml(item)}</span></label></li>`,
    )
    .join('');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const nextSurfaceSectionPacketRaw = await readFile(
    inputPaths.nextSurfaceSectionPacketJson,
    'utf8',
  );
  const nextSurfaceSectionPacket = JSON.parse(nextSurfaceSectionPacketRaw);

  const recommendedSurface = nextSurfaceSectionPacket.recommendedSurface ?? null;
  const recommendedNextFrame = nextSurfaceSectionPacket.recommendedNextFrame ?? null;
  const recommendedNextSection = nextSurfaceSectionPacket.recommendedNextSection ?? null;

  const frames = Array.isArray(nextSurfaceSectionPacket.frames)
    ? nextSurfaceSectionPacket.frames.map((frame) => ({
        frame: frame.frame,
        viewport: frame.viewport ?? 'unknown',
        route: frame.route ?? recommendedSurface?.route ?? 'unknown',
        phase: frame.phase ?? 'Unknown',
        totalPending: Number(frame.totalPending ?? 0),
        checklistSections: Array.isArray(frame.sections)
          ? frame.sections.map((section) => ({
              order: Number(section.order ?? 0),
              section: section.section,
              phase: section.phase ?? frame.phase ?? 'Unknown',
              isRecommended: Boolean(section.isRecommended),
              checklistLabel: `${section.order}. ${section.section} | phase=${section.phase ?? frame.phase ?? 'Unknown'}${
                section.isRecommended ? ' | recommended' : ''
              }`,
            }))
          : [],
      }))
    : [];

  const flatChecklist = frames.flatMap((frame) =>
    frame.checklistSections.map((section) => ({
      frame: frame.frame,
      section: section.section,
      checklistLabel: `${frame.frame} -> ${section.checklistLabel}`,
      isRecommended: section.isRecommended,
    })),
  );

  const nextSteps = recommendedSurface
    ? [
        `Start in \`${recommendedSurface.surface}\` route \`${recommendedSurface.route}\`.`,
        recommendedNextFrame && recommendedNextSection
          ? `Begin with \`${recommendedNextFrame} -> ${recommendedNextSection}\` first.`
          : 'No recommended frame or section is currently selected.',
        'Check sections in order and mirror the same progress into the manual build worksheet.',
        'When the surface checklist is complete, re-run `npm run ntl:compare-entry-review-finalize` and `npm run ntl:compare-entry-review-ready-check`.',
      ]
    : [
        'No recommended surface remains. Open the approval board and confirm whether `SUN-10` is ready to unblock implementation.',
      ];

  const links = {
    nextSurfaceSectionPacket: path.join(
      artifactDir,
      'compare-entry-review-next-surface-section-packet.html',
    ),
    nextFramePacket: path.join(artifactDir, 'compare-entry-review-next-frame-packet.html'),
    nextSectionPacket: path.join(artifactDir, 'compare-entry-review-next-section-packet.html'),
    buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    gate: nextSurfaceSectionPacket.links?.gate ?? path.join(artifactDir, 'compare-entry-review-gate.md'),
    figmaRetryPacket: nextSurfaceSectionPacket.links?.figmaRetryPacket ?? path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
    approvalBoard: path.join(artifactDir, 'compare-entry-approval-board.html'),
    latestHandoff: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
  };
  const activeBlocker = normalizeActiveBlocker(nextSurfaceSectionPacket.activeBlocker, {
    kind: nextSurfaceSectionPacket.readyToUnblock ? 'none' : 'unknown',
    summary: 'Next surface section packet did not provide an active blocker summary.',
    evidencePath: links.nextSurfaceSectionPacket,
    nextAction: 'Refresh `npm run ntl:compare-entry-review-next-surface-sections` and rebuild this checklist.',
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: nextSurfaceSectionPacket.gateState ?? 'unknown',
    readyToUnblock: Boolean(nextSurfaceSectionPacket.readyToUnblock),
    activeBlocker,
    hasRecommendedSurface: Boolean(recommendedSurface),
    recommendedSurface: recommendedSurface
      ? {
          surface: recommendedSurface.surface,
          label: recommendedSurface.label,
          route: recommendedSurface.route,
          sourcePrompt: recommendedSurface.sourcePrompt,
          totalPending: Number(recommendedSurface.totalPending ?? 0),
          frameCount: Number(recommendedSurface.frameCount ?? frames.length),
        }
      : null,
    recommendedNextFrame,
    recommendedNextSection,
    totalFrames: frames.length,
    totalSections: flatChecklist.length,
    frames,
    nextSteps,
    links,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Next Surface Checklist

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- activeBlocker: \`${summary.activeBlocker.kind}\`
- activeBlockerTarget: \`${summary.activeBlocker.target ?? 'none'}\`
- activeBlockerLatestStatus: \`${summary.activeBlocker.latestStatus ?? 'none'}\`
- activeBlockerLatestOperation: \`${summary.activeBlocker.latestOperation ?? 'none'}\`
- recommendedSurface: \`${summary.recommendedSurface?.surface ?? 'none'}\`
- route: \`${summary.recommendedSurface?.route ?? 'none'}\`
- totalFrames: \`${summary.totalFrames}\`
- totalSections: \`${summary.totalSections}\`
- recommendedNextFrame: \`${summary.recommendedNextFrame ?? 'none'}\`
- recommendedNextSection: \`${summary.recommendedNextSection ?? 'none'}\`

${formatActiveBlockerMarkdown(summary.activeBlocker)}

## Next Steps

${summary.nextSteps.map((step) => `- ${step}`).join('\n')}

## Surface Checklist

${
  frames.length
    ? frames
        .map(
          (frame) => `### ${frame.frame}

- route: \`${frame.route}\`
- viewport: \`${frame.viewport}\`
- phase: \`${frame.phase}\`
- totalPending: \`${frame.totalPending}\`

#### Checklist

${formatMarkdownChecklist(frame.checklistSections.map((section) => section.checklistLabel), 'none')}`,
        )
        .join('\n\n')
    : '- none'
}

## Related Artifacts

- next surface section packet: \`${links.nextSurfaceSectionPacket}\`
- next frame packet: \`${links.nextFramePacket}\`
- next section packet: \`${links.nextSectionPacket}\`
- build worksheet: \`${links.buildWorksheet}\`
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
    <title>Compare Entry Review Next Surface Checklist</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.94);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
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
      .summary, .frames, .links, .grid-2 {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .frames, .links { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
      .metric, .link-card {
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
      .link-card { display: grid; gap: 8px; color: inherit; text-decoration: none; }
      .link-card:hover { border-color: #94a3b8; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      li label {
        display: flex;
        gap: 10px;
        align-items: flex-start;
      }
      code {
        font-family: "SFMono-Regular", Menlo, monospace;
        font-size: 12px;
        background: #eef2f8;
        padding: 4px 8px;
        border-radius: 10px;
        word-break: break-all;
      }
      h2, h3 { margin: 0 0 10px; }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Review Next Surface Checklist</h1>
        <p>현재 추천 surface 안의 frame/section backlog를 실제 체크박스 형태로 풀어낸 실행용 checklist입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Active Blocker</strong><span>${escapeHtml(summary.activeBlocker.kind)}</span></div>
        <div class="metric"><strong>Recommended Surface</strong><span>${escapeHtml(summary.recommendedSurface?.surface ?? 'none')}</span></div>
        <div class="metric"><strong>Route</strong><span>${escapeHtml(summary.recommendedSurface?.route ?? 'none')}</span></div>
        <div class="metric"><strong>Total Frames</strong><span>${escapeHtml(summary.totalFrames)}</span></div>
        <div class="metric"><strong>Total Sections</strong><span>${escapeHtml(summary.totalSections)}</span></div>
        <div class="metric"><strong>Recommended Next Frame</strong><span>${escapeHtml(summary.recommendedNextFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Next Section</strong><span>${escapeHtml(summary.recommendedNextSection ?? 'none')}</span></div>
      </section>

      <section class="grid-2">
${formatActiveBlockerHtml(summary.activeBlocker, escapeHtml)}
        <section class="panel">
          <h2>Next Steps</h2>
          <ul>${summary.nextSteps.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ul>
        </section>
        <section class="panel">
          <h2>Related Artifacts</h2>
          <ul>
            <li><code>${escapeHtml(links.nextSurfaceSectionPacket)}</code></li>
            <li><code>${escapeHtml(links.nextFramePacket)}</code></li>
            <li><code>${escapeHtml(links.nextSectionPacket)}</code></li>
            <li><code>${escapeHtml(links.buildWorksheet)}</code></li>
            <li><code>${escapeHtml(links.gate)}</code></li>
            <li><code>${escapeHtml(links.figmaRetryPacket)}</code></li>
            <li><code>${escapeHtml(links.approvalBoard)}</code></li>
            <li><code>${escapeHtml(links.latestHandoff)}</code></li>
          </ul>
        </section>
      </section>

      <section class="frames">
        ${
          frames.length
            ? frames
                .map(
                  (frame) => `<article class="frame-card">
            <h2>${escapeHtml(frame.frame)}</h2>
            <p class="muted">route <code>${escapeHtml(frame.route)}</code> · viewport ${escapeHtml(frame.viewport)} · phase ${escapeHtml(frame.phase)}</p>
            <p class="muted">totalPending ${escapeHtml(frame.totalPending)}</p>
            <ul>${formatHtmlChecklist(frame.checklistSections.map((section) => section.checklistLabel), 'none')}</ul>
          </article>`,
                )
                .join('')
            : '<article class="frame-card"><h2>No Recommended Surface</h2><p class="muted">Open the approval board and confirm whether SUN-10 is ready to unblock implementation.</p></article>'
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
        recommendedSurface: summary.recommendedSurface?.surface ?? null,
        totalFrames: summary.totalFrames,
        totalSections: summary.totalSections,
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
