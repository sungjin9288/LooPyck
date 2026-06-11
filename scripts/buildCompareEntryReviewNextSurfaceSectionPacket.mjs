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
  sectionProgressJson: path.join(artifactDir, 'compare-entry-review-section-progress-board.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.md'),
  json: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.json'),
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

  const [nextSurfacePacketRaw, sectionProgressRaw] = await Promise.all([
    readFile(inputPaths.nextSurfacePacketJson, 'utf8'),
    readFile(inputPaths.sectionProgressJson, 'utf8'),
  ]);

  const nextSurfacePacket = JSON.parse(nextSurfacePacketRaw);
  const sectionProgress = JSON.parse(sectionProgressRaw);
  const recommendedSurface = nextSurfacePacket.recommendedSurface ?? null;
  const recommendedFrame = sectionProgress.recommendedNextFrame ?? null;
  const recommendedSection = sectionProgress.recommendedNextSection ?? null;

  const frames = recommendedSurface
    ? (Array.isArray(sectionProgress.frames) ? sectionProgress.frames : []).filter(
        (frame) => frame.surface === recommendedSurface.surface,
      )
    : [];

  const sections = frames.flatMap((frame) =>
    (Array.isArray(frame.sections) ? frame.sections : []).map((section) => ({
      frame: frame.frame,
      viewport: frame.viewport,
      route: frame.route,
      phase: section.phase ?? frame.phase ?? 'Unknown',
      order: Number(section.order ?? 0),
      section: section.section,
      isRecommended: Boolean(section.isRecommended),
      totalPending: Number(frame.totalPending ?? 0),
    })),
  );

  const orderedSections = sections
    .slice()
    .sort(
      (left, right) =>
        Number(Boolean(right.isRecommended)) - Number(Boolean(left.isRecommended)) ||
        left.frame.localeCompare(right.frame) ||
        Number(left.order) - Number(right.order),
    );

  const nextSteps = recommendedSurface
    ? [
        `Open \`${nextSurfacePacket.links?.nextSurfacePacket ?? outputPaths.html}\` and confirm the current recommended surface.`,
        `Work only inside \`${recommendedSurface.surface}\` route \`${recommendedSurface.route}\` until the surface-level section backlog is cleared.`,
        recommendedSection && recommendedFrame
          ? `Start with \`${recommendedFrame} -> ${recommendedSection}\` first.`
          : 'No recommended section is currently selected.',
        ...frames.map(
          (frame, index) =>
            `Frame ${index + 1}: ${frame.frame} (${frame.phase}, section count ${Array.isArray(frame.sections) ? frame.sections.length : 0}).`,
        ),
        'After each section update, mirror the same progress in the build/review worksheet before moving to the next frame.',
        'When the surface queue is done, re-run `npm run ntl:compare-entry-review-finalize` and `npm run ntl:compare-entry-review-ready-check`.',
      ]
    : ['No recommended surface remains. Open the approval board and confirm whether `SUN-10` is ready to unblock implementation.'];

  const links = {
    nextSurfacePacket: path.join(artifactDir, 'compare-entry-review-next-surface-packet.html'),
    nextFramePacket: path.join(artifactDir, 'compare-entry-review-next-frame-packet.html'),
    nextSectionPacket: path.join(artifactDir, 'compare-entry-review-next-section-packet.html'),
    sectionProgress: path.join(artifactDir, 'compare-entry-review-section-progress-board.html'),
    buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    reviewWorksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
    decisionLog: path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
    gate: nextSurfacePacket.links?.gate ?? path.join(artifactDir, 'compare-entry-review-gate.md'),
    figmaRetryPacket: nextSurfacePacket.links?.figmaRetryPacket ?? path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
    approvalBoard: path.join(artifactDir, 'compare-entry-approval-board.html'),
    latestHandoff: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
  };
  const activeBlocker = normalizeActiveBlocker(nextSurfacePacket.activeBlocker, {
    kind: nextSurfacePacket.readyToUnblock ? 'none' : 'unknown',
    summary: 'Next surface packet did not provide an active blocker summary.',
    evidencePath: links.nextSurfacePacket,
    nextAction: 'Refresh `npm run ntl:compare-entry-review-next-surface` and rebuild this packet.',
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: nextSurfacePacket.gateState ?? sectionProgress.gateState ?? 'unknown',
    readyToUnblock: Boolean(nextSurfacePacket.readyToUnblock ?? sectionProgress.readyToUnblock),
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
    recommendedNextFrame: recommendedFrame,
    recommendedNextSection: recommendedSection,
    totalFrames: frames.length,
    totalSections: sections.length,
    frames,
    orderedSections,
    nextSteps,
    links,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Next Surface Section Packet

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

${formatMarkdownList(summary.nextSteps, 'none')}

## Surface Section Queue

${formatMarkdownList(
  orderedSections.map(
    (section, index) =>
      `${index + 1}. ${section.frame} -> ${section.section} | phase=${section.phase}${section.isRecommended ? ' | recommended' : ''}`,
  ),
  'none',
)}

## Frames

${
  frames.length
    ? frames
        .map(
          (frame) => `### ${frame.frame}

- route: \`${frame.route}\`
- viewport: \`${frame.viewport}\`
- phase: \`${frame.phase}\`
- totalPending: \`${frame.totalPending}\`

#### Sections

${formatMarkdownList(
  (Array.isArray(frame.sections) ? frame.sections : []).map(
    (section) =>
      `${section.order}. ${section.section} | phase=${section.phase}${section.isRecommended ? ' | recommended' : ''}`,
  ),
  'none',
)}`,
        )
        .join('\n\n')
    : '- none'
}

## Related Artifacts

- next surface packet: \`${links.nextSurfacePacket}\`
- next frame packet: \`${links.nextFramePacket}\`
- next section packet: \`${links.nextSectionPacket}\`
- section progress: \`${links.sectionProgress}\`
- build worksheet: \`${links.buildWorksheet}\`
- review worksheet: \`${links.reviewWorksheet}\`
- decision log: \`${links.decisionLog}\`
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
    <title>Compare Entry Review Next Surface Section Packet</title>
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
        margin-bottom: 8px;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: var(--muted);
      }
      .link-card {
        display: grid;
        gap: 8px;
        color: inherit;
        text-decoration: none;
      }
      .link-card:hover { border-color: #94a3b8; }
      h2, h3 { margin: 0 0 10px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Review Next Surface Section Packet</h1>
        <p>추천 surface 안에서 frame 간 section backlog를 한 번에 훑고, 어느 frame / 어느 section부터 수동 Figma 작업을 시작할지 결정하는 packet입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Active Blocker</strong><span>${escapeHtml(summary.activeBlocker.kind)}</span></div>
        <div class="metric"><strong>Recommended Surface</strong><span>${escapeHtml(summary.recommendedSurface?.surface ?? 'none')}</span></div>
        <div class="metric"><strong>Route</strong><span>${escapeHtml(summary.recommendedSurface?.route ?? 'none')}</span></div>
        <div class="metric"><strong>Total Frames</strong><span>${escapeHtml(summary.totalFrames)}</span></div>
        <div class="metric"><strong>Total Sections</strong><span>${escapeHtml(summary.totalSections)}</span></div>
        <div class="metric"><strong>Recommended Frame</strong><span>${escapeHtml(summary.recommendedNextFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Section</strong><span>${escapeHtml(summary.recommendedNextSection ?? 'none')}</span></div>
      </section>

      <section class="grid-2">
${formatActiveBlockerHtml(summary.activeBlocker, escapeHtml)}
        <section class="panel">
          <h2>Next Steps</h2>
          <ul>${formatHtmlList(summary.nextSteps)}</ul>
        </section>
        <section class="panel">
          <h2>Surface Section Queue</h2>
          <ul>${formatHtmlList(
            orderedSections.map(
              (section, index) =>
                `${index + 1}. ${section.frame} -> ${section.section} | phase=${section.phase}${section.isRecommended ? ' | recommended' : ''}`,
            ),
          )}</ul>
        </section>
      </section>

      <section class="frames">
        ${frames
          .map(
            (frame) => `
              <article class="frame-card">
                <h3>${escapeHtml(frame.frame)}</h3>
                <p>${escapeHtml(`${frame.route} • ${frame.viewport} • ${frame.phase} • pending ${frame.totalPending}`)}</p>
                <ul>${formatHtmlList(
                  (Array.isArray(frame.sections) ? frame.sections : []).map(
                    (section) =>
                      `${section.order}. ${section.section} | phase=${section.phase}${section.isRecommended ? ' | recommended' : ''}`,
                  ),
                )}</ul>
              </article>
            `,
          )
          .join('')}
      </section>

      <section class="links">
        <a class="link-card" href="${escapeHtml(links.nextSurfacePacket)}"><strong>Next Surface Packet</strong><code>${escapeHtml(links.nextSurfacePacket)}</code></a>
        <a class="link-card" href="${escapeHtml(links.nextFramePacket)}"><strong>Next Frame Packet</strong><code>${escapeHtml(links.nextFramePacket)}</code></a>
        <a class="link-card" href="${escapeHtml(links.nextSectionPacket)}"><strong>Next Section Packet</strong><code>${escapeHtml(links.nextSectionPacket)}</code></a>
        <a class="link-card" href="${escapeHtml(links.sectionProgress)}"><strong>Section Progress</strong><code>${escapeHtml(links.sectionProgress)}</code></a>
        <a class="link-card" href="${escapeHtml(links.buildWorksheet)}"><strong>Build Worksheet</strong><code>${escapeHtml(links.buildWorksheet)}</code></a>
        <a class="link-card" href="${escapeHtml(links.reviewWorksheet)}"><strong>Review Worksheet</strong><code>${escapeHtml(links.reviewWorksheet)}</code></a>
        <a class="link-card" href="${escapeHtml(links.decisionLog)}"><strong>Decision Log</strong><code>${escapeHtml(links.decisionLog)}</code></a>
        <a class="link-card" href="${escapeHtml(links.gate)}"><strong>Review Gate</strong><code>${escapeHtml(links.gate)}</code></a>
        <a class="link-card" href="${escapeHtml(links.figmaRetryPacket)}"><strong>Figma Retry Packet</strong><code>${escapeHtml(links.figmaRetryPacket)}</code></a>
        <a class="link-card" href="${escapeHtml(links.approvalBoard)}"><strong>Approval Board</strong><code>${escapeHtml(links.approvalBoard)}</code></a>
        <a class="link-card" href="${escapeHtml(links.latestHandoff)}"><strong>Latest Handoff</strong><code>${escapeHtml(links.latestHandoff)}</code></a>
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
        recommendedSection: summary.recommendedNextSection,
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
