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
  nextFramePacketJson: path.join(artifactDir, 'compare-entry-review-next-frame-packet.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-next-section-packet.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-next-section-packet.md'),
  json: path.join(artifactDir, 'compare-entry-review-next-section-packet.json'),
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

function pickRecommendedSection(frame) {
  const frameSections = getFrameSections(frame?.frame);
  const buildPending = Array.isArray(frame?.buildPending) ? frame.buildPending : [];
  if (buildPending.length > 0) {
    const primarySection = frameSections[0] ?? buildPending[0];
    return {
      section: primarySection,
      phase: 'Build Pending',
      queuePosition: 1,
      remainingInPhase: frameSections.length > 0 ? frameSections.slice(1) : buildPending.slice(1),
    };
  }

  const reviewPending = Array.isArray(frame?.reviewPending) ? frame.reviewPending : [];
  if (reviewPending.length > 0) {
    const primarySection = frameSections[0] ?? reviewPending[0];
    return {
      section: primarySection,
      phase: 'Review Pending',
      queuePosition: 1,
      remainingInPhase: frameSections.length > 0 ? frameSections.slice(1) : reviewPending.slice(1),
    };
  }

  return null;
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const nextFramePacketRaw = await readFile(inputPaths.nextFramePacketJson, 'utf8');
  const nextFramePacket = JSON.parse(nextFramePacketRaw);
  const recommendedSurface = nextFramePacket.recommendedSurface ?? null;
  const recommendedFrame = nextFramePacket.recommendedFrame ?? null;
  const recommendedSection = pickRecommendedSection(recommendedFrame);
  const frameSections = getFrameSections(recommendedFrame?.frame);

  const links = {
    manualPacket: nextFramePacket.links?.manualPacket ?? path.join(artifactDir, 'compare-entry-manual-figma-packet.html'),
    frameSpecs: nextFramePacket.links?.frameSpecs ?? path.join(artifactDir, 'compare-entry-manual-frame-specs.md'),
    buildWorksheet: nextFramePacket.links?.buildWorksheet ?? path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    reviewWorksheet: nextFramePacket.links?.reviewWorksheet ?? path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
    decisionLog: nextFramePacket.links?.decisionLog ?? path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
    nextSurfacePacket: nextFramePacket.links?.nextSurfacePacket ?? path.join(artifactDir, 'compare-entry-review-next-surface-packet.html'),
    nextFramePacket: path.join(artifactDir, 'compare-entry-review-next-frame-packet.html'),
    frameProgress: nextFramePacket.links?.frameProgress ?? path.join(artifactDir, 'compare-entry-review-frame-progress-board.html'),
    focusPlan: nextFramePacket.links?.focusPlan ?? path.join(artifactDir, 'compare-entry-review-focus-plan.md'),
    missingDetail: nextFramePacket.links?.missingDetail ?? path.join(artifactDir, 'compare-entry-review-missing-detail.md'),
    approvalBoard: nextFramePacket.links?.approvalBoard ?? path.join(artifactDir, 'compare-entry-approval-board.html'),
    latestHandoff: nextFramePacket.links?.latestHandoff ?? path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
  };

  const sectionQueue = recommendedFrame
    ? frameSections.length > 0
      ? frameSections
      : [
          ...(Array.isArray(recommendedFrame.buildPending) ? recommendedFrame.buildPending : []),
          ...(Array.isArray(recommendedFrame.reviewPending)
            ? recommendedFrame.reviewPending.map((item) => `[review] ${item}`)
            : []),
        ]
    : [];

  const nextSteps = recommendedSection
    ? [
        `Open \`${links.nextFramePacket}\` and confirm the current recommended frame and sibling frame order.`,
        `Start with section \`${recommendedSection.section}\` in \`${recommendedFrame.frame}\` on route \`${recommendedSurface?.route ?? 'none'}\`.`,
        recommendedSection.phase === 'Build Pending'
          ? `Complete the build work for \`${recommendedSection.section}\` before moving to the next build section.`
          : `Complete the review checks for \`${recommendedSection.section}\` before moving to the next review section.`,
        recommendedSection.remainingInPhase.length
          ? `Then continue with the remaining ${recommendedSection.phase.toLowerCase()} queue: ${recommendedSection.remainingInPhase.join(', ')}.`
          : `No remaining ${recommendedSection.phase.toLowerCase()} queue remains after this section.`,
        'Re-run `npm run ntl:compare-entry-review-finalize` and `npm run ntl:compare-entry-review-ready-check` after the section update.',
      ]
    : [
        'No recommended section remains. Open the approval board and confirm whether `SUN-10` is ready to unblock implementation.',
      ];

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: nextFramePacket.gateState ?? 'unknown',
    readyToUnblock: Boolean(nextFramePacket.readyToUnblock),
    hasRecommendedSection: Boolean(recommendedSection),
    recommendedSurface: recommendedSurface
      ? {
          surface: recommendedSurface.surface,
          label: recommendedSurface.label,
          route: recommendedSurface.route,
          totalPending: Number(recommendedSurface.totalPending ?? 0),
        }
      : null,
    recommendedFrame: recommendedFrame
      ? {
          frame: recommendedFrame.frame,
          viewport: recommendedFrame.viewport,
          phase: recommendedFrame.phase,
          totalPending: Number(recommendedFrame.totalPending ?? 0),
          buildPendingCount: Number(recommendedFrame.buildPendingCount ?? 0),
          reviewPendingCount: Number(recommendedFrame.reviewPendingCount ?? 0),
        }
      : null,
    recommendedSection: recommendedSection
      ? {
          section: recommendedSection.section,
          phase: recommendedSection.phase,
          queuePosition: recommendedSection.queuePosition,
          remainingCount: recommendedSection.remainingInPhase.length,
        }
      : null,
    siblingSections: recommendedSection ? recommendedSection.remainingInPhase : [],
    sectionQueue,
    focusActions: Array.isArray(recommendedFrame?.focusActions) ? recommendedFrame.focusActions : [],
    buildCrossCutPending: Array.isArray(nextFramePacket.buildCrossCutPending) ? nextFramePacket.buildCrossCutPending : [],
    reviewCrossCutPending: Array.isArray(nextFramePacket.reviewCrossCutPending) ? nextFramePacket.reviewCrossCutPending : [],
    decisionPending: Array.isArray(nextFramePacket.decisionPending) ? nextFramePacket.decisionPending : [],
    nextSteps,
    links,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Next Section Packet

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- hasRecommendedSection: \`${summary.hasRecommendedSection ? 'true' : 'false'}\`
- recommendedSurface: \`${summary.recommendedSurface?.surface ?? 'none'}\`
- route: \`${summary.recommendedSurface?.route ?? 'none'}\`
- recommendedFrame: \`${summary.recommendedFrame?.frame ?? 'none'}\`
- recommendedSection: \`${summary.recommendedSection?.section ?? 'none'}\`
- sectionPhase: \`${summary.recommendedSection?.phase ?? 'none'}\`

## Next Steps

${formatMarkdownList(summary.nextSteps, 'none')}

## Section Queue

${formatMarkdownList(summary.sectionQueue, 'none')}

## Sibling Sections

${formatMarkdownList(summary.siblingSections, 'none')}

## Focus Actions

${formatMarkdownList(summary.focusActions, 'none')}

## Cross-Cut Pending

### Build

${formatMarkdownList(summary.buildCrossCutPending, 'none')}

### Review

${formatMarkdownList(summary.reviewCrossCutPending, 'none')}

### Decision

${formatMarkdownList(summary.decisionPending, 'none')}

## Related Artifacts

- manual packet: \`${links.manualPacket}\`
- frame specs: \`${links.frameSpecs}\`
- build worksheet: \`${links.buildWorksheet}\`
- review worksheet: \`${links.reviewWorksheet}\`
- decision log: \`${links.decisionLog}\`
- next surface packet: \`${links.nextSurfacePacket}\`
- next frame packet: \`${links.nextFramePacket}\`
- frame progress: \`${links.frameProgress}\`
- focus plan: \`${links.focusPlan}\`
- missing detail: \`${links.missingDetail}\`
- approval board: \`${links.approvalBoard}\`
- latest handoff: \`${links.latestHandoff}\`
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Review Next Section Packet</title>
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
        max-width: 1320px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel, .link-card {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p { margin: 0; color: var(--muted); }
      .summary, .grid-2, .links {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .links { grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
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
      h2 { margin: 0 0 10px; font-size: 18px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
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
        <h1>Compare Entry Review Next Section Packet</h1>
        <p>추천 frame 안에서 가장 먼저 손대야 하는 section 하나만 기준으로 build/review queue를 고정한 packet입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Generated</strong><span>${escapeHtml(summary.generatedAt)}</span></div>
        <div class="metric"><strong>Gate State</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Recommended Surface</strong><span>${escapeHtml(summary.recommendedSurface?.surface ?? 'none')}</span></div>
        <div class="metric"><strong>Route</strong><span>${escapeHtml(summary.recommendedSurface?.route ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Frame</strong><span>${escapeHtml(summary.recommendedFrame?.frame ?? 'none')}</span></div>
        <div class="metric"><strong>Recommended Section</strong><span>${escapeHtml(summary.recommendedSection?.section ?? 'none')}</span></div>
      </section>

      <section class="grid-2">
        <section class="panel">
          <h2>Next Steps</h2>
          <ul>${formatHtmlList(summary.nextSteps)}</ul>
        </section>
        <section class="panel">
          <h2>Section Queue</h2>
          <ul>${formatHtmlList(summary.sectionQueue)}</ul>
        </section>
        <section class="panel">
          <h2>Sibling Sections</h2>
          <ul>${formatHtmlList(summary.siblingSections)}</ul>
        </section>
        <section class="panel">
          <h2>Focus Actions</h2>
          <ul>${formatHtmlList(summary.focusActions)}</ul>
        </section>
        <section class="panel">
          <h2>Build Cross-Cut Pending</h2>
          <ul>${formatHtmlList(summary.buildCrossCutPending)}</ul>
        </section>
        <section class="panel">
          <h2>Review / Decision Pending</h2>
          <ul>${formatHtmlList([...summary.reviewCrossCutPending, ...summary.decisionPending])}</ul>
        </section>
      </section>

      <section class="panel">
        <h2>Current Section</h2>
        <p><span class="badge">${escapeHtml(summary.recommendedSection?.phase ?? 'none')}</span></p>
        <p>${escapeHtml(summary.recommendedSection?.section ?? 'No recommended section')}</p>
      </section>

      <section class="links">
        <a class="link-card" href="${links.manualPacket}"><strong>Manual Packet</strong><code>${links.manualPacket}</code></a>
        <a class="link-card" href="${links.frameSpecs}"><strong>Frame Specs</strong><code>${links.frameSpecs}</code></a>
        <a class="link-card" href="${links.buildWorksheet}"><strong>Build Worksheet</strong><code>${links.buildWorksheet}</code></a>
        <a class="link-card" href="${links.reviewWorksheet}"><strong>Review Worksheet</strong><code>${links.reviewWorksheet}</code></a>
        <a class="link-card" href="${links.decisionLog}"><strong>Decision Log</strong><code>${links.decisionLog}</code></a>
        <a class="link-card" href="${links.nextSurfacePacket}"><strong>Next Surface Packet</strong><code>${links.nextSurfacePacket}</code></a>
        <a class="link-card" href="${links.nextFramePacket}"><strong>Next Frame Packet</strong><code>${links.nextFramePacket}</code></a>
        <a class="link-card" href="${links.frameProgress}"><strong>Frame Progress</strong><code>${links.frameProgress}</code></a>
        <a class="link-card" href="${links.focusPlan}"><strong>Focus Plan</strong><code>${links.focusPlan}</code></a>
        <a class="link-card" href="${links.missingDetail}"><strong>Missing Detail</strong><code>${links.missingDetail}</code></a>
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
        recommendedSection: recommendedSection?.section ?? null,
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
