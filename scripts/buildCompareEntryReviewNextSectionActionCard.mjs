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
  nextSurfaceSectionPacketJson: path.join(
    artifactDir,
    'compare-entry-review-next-surface-section-packet.json',
  ),
  nextSurfaceChecklistJson: path.join(
    artifactDir,
    'compare-entry-review-next-surface-checklist.json',
  ),
  nextSectionPacketJson: path.join(artifactDir, 'compare-entry-review-next-section-packet.json'),
};

const outputPaths = {
  html: path.join(artifactDir, 'compare-entry-review-next-section-action-card.html'),
  markdown: path.join(artifactDir, 'compare-entry-review-next-section-action-card.md'),
  json: path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'),
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

function resolveFallbackPreview(recommendedFrame, recommendedSection) {
  if (
    recommendedFrame !== 'CompareEntry/Mobile/Brand-Musinsa' ||
    recommendedSection !== 'TopNav/Context'
  ) {
    return null;
  }

  return {
    reason: 'Figma MCP Starter plan limit fallback for the current next slice.',
    previewHtml: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html'),
    previewJson: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.json'),
    figmaTemplate: path.join(rootDir, 'scripts', 'figmaCompareEntryMobileBrandTopNavTemplate.mjs'),
    generatorCommand: 'npm run ntl:compare-entry-mobile-brand-topnav-preview',
    worksheetPolicy: 'Do not check the build worksheet until the Figma node is actually created.',
  };
}

function formatFallbackMarkdown(fallbackPreview) {
  if (!fallbackPreview) return '';

  return `
## Figma Limit Fallback

- reason: \`${fallbackPreview.reason}\`
- preview html: \`${fallbackPreview.previewHtml}\`
- preview json: \`${fallbackPreview.previewJson}\`
- figma template: \`${fallbackPreview.figmaTemplate}\`
- generator command: \`${fallbackPreview.generatorCommand}\`
- worksheet policy: \`${fallbackPreview.worksheetPolicy}\`
`;
}

function formatFallbackHtml(fallbackPreview) {
  if (!fallbackPreview) return '';

  return `
      <section class="fallback">
        <h2>Figma Limit Fallback</h2>
        <p>${escapeHtml(fallbackPreview.reason)}</p>
        <div class="links">
          <a class="link-card" href="${fallbackPreview.previewHtml}"><strong>Fallback Preview HTML</strong><code>${escapeHtml(fallbackPreview.previewHtml)}</code></a>
          <a class="link-card" href="${fallbackPreview.previewJson}"><strong>Fallback Preview JSON</strong><code>${escapeHtml(fallbackPreview.previewJson)}</code></a>
          <a class="link-card" href="${fallbackPreview.figmaTemplate}"><strong>Figma Plugin Template</strong><code>${escapeHtml(fallbackPreview.figmaTemplate)}</code></a>
        </div>
        <p><strong>Generator:</strong> <code>${escapeHtml(fallbackPreview.generatorCommand)}</code></p>
        <p><strong>Worksheet policy:</strong> ${escapeHtml(fallbackPreview.worksheetPolicy)}</p>
      </section>`;
}

function buildTargetLabel(recommendedSurface, recommendedFrame, recommendedSection) {
  if (!recommendedSurface?.surface || !recommendedFrame || !recommendedSection) return null;
  return `${recommendedSurface.surface} -> ${recommendedFrame} -> ${recommendedSection}`;
}

function resolveActiveBlocker(gate, summaryInput) {
  const target = buildTargetLabel(
    summaryInput.recommendedSurface,
    summaryInput.recommendedFrame,
    summaryInput.recommendedSection,
  );
  const gateBlocker = gate?.activeBlocker ?? null;

  if (
    gateBlocker &&
    (
      gateBlocker.kind === 'none' ||
      gateBlocker.kind === 'artifact-audit' ||
      !gateBlocker.target ||
      gateBlocker.target === target
    )
  ) {
    return gateBlocker;
  }

  if (!summaryInput.hasRecommendedSection || summaryInput.readyToUnblock) {
    return {
      kind: 'none',
      summary: 'No recommended section remains in the next-section action card.',
      target: null,
      latestStatus: null,
      latestOperation: null,
      latestTool: null,
      evidencePath: path.join(artifactDir, 'compare-entry-approval-board.html'),
      nextAction: 'Open the approval board and decide whether SUN-10 can unblock SUN-11 / SUN-12.',
    };
  }

  return {
    kind: 'review-readiness',
    summary: 'The current next-section action card is the active review-readiness blocker.',
    target,
    latestStatus: summaryInput.gateState,
    latestOperation: 'next-section-action-card',
    latestTool: null,
    evidencePath: outputPaths.html,
    nextAction: `Complete ${target}, update the worksheets, then rerun the ready-check.`,
  };
}

function formatActiveBlockerMarkdown(activeBlocker) {
  return `## Active Blocker

- kind: \`${activeBlocker.kind}\`
- summary: ${activeBlocker.summary}
- target: \`${activeBlocker.target ?? 'none'}\`
- latestStatus: \`${activeBlocker.latestStatus ?? 'none'}\`
- latestOperation: \`${activeBlocker.latestOperation ?? 'none'}\`
- latestTool: \`${activeBlocker.latestTool ?? 'none'}\`
- evidencePath: \`${activeBlocker.evidencePath ?? 'none'}\`
- nextAction: ${activeBlocker.nextAction}
`;
}

function formatActiveBlockerHtml(activeBlocker) {
  return `
        <div class="panel">
          <h2>Active Blocker</h2>
          <ul>
            <li>${escapeHtml(`kind: ${activeBlocker.kind}`)}</li>
            <li>${escapeHtml(`summary: ${activeBlocker.summary}`)}</li>
            <li>${escapeHtml(`target: ${activeBlocker.target ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestStatus: ${activeBlocker.latestStatus ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestOperation: ${activeBlocker.latestOperation ?? 'none'}`)}</li>
            <li>${escapeHtml(`latestTool: ${activeBlocker.latestTool ?? 'none'}`)}</li>
            <li>${escapeHtml(`evidencePath: ${activeBlocker.evidencePath ?? 'none'}`)}</li>
            <li>${escapeHtml(`nextAction: ${activeBlocker.nextAction}`)}</li>
          </ul>
        </div>`;
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [nextSurfaceSectionPacketRaw, nextSurfaceChecklistRaw, nextSectionPacketRaw] =
    await Promise.all([
      readFile(inputPaths.nextSurfaceSectionPacketJson, 'utf8'),
      readFile(inputPaths.nextSurfaceChecklistJson, 'utf8'),
      readFile(inputPaths.nextSectionPacketJson, 'utf8'),
    ]);

  const nextSurfaceSectionPacket = JSON.parse(nextSurfaceSectionPacketRaw);
  const nextSurfaceChecklist = JSON.parse(nextSurfaceChecklistRaw);
  const nextSectionPacket = JSON.parse(nextSectionPacketRaw);
  let gate = null;
  try {
    gate = JSON.parse(await readFile(inputPaths.gateJson, 'utf8'));
  } catch {
    gate = null;
  }

  const recommendedSurface =
    nextSurfaceSectionPacket.recommendedSurface ?? nextSurfaceChecklist.recommendedSurface ?? null;
  const recommendedFrame =
    nextSurfaceSectionPacket.recommendedNextFrame ?? nextSurfaceChecklist.recommendedNextFrame ?? null;
  const recommendedSection =
    nextSurfaceSectionPacket.recommendedNextSection ??
    nextSurfaceChecklist.recommendedNextSection ??
    nextSectionPacket.recommendedSection?.section ??
    null;
  const sectionPhase = nextSectionPacket.recommendedSection?.phase ?? null;

  const recommendedFrameChecklist = Array.isArray(nextSurfaceChecklist.frames)
    ? nextSurfaceChecklist.frames.find((frame) => frame.frame === recommendedFrame) ?? null
    : null;
  const sectionChecklist = Array.isArray(recommendedFrameChecklist?.checklistSections)
    ? recommendedFrameChecklist.checklistSections
    : [];
  const checklistPreview = sectionChecklist.slice(0, 5).map((section) => section.checklistLabel);
  const firstChecklistFrame = recommendedFrameChecklist?.frame ?? null;
  const firstChecklistSection = sectionChecklist[0]?.section ?? null;

  const links = {
    manualPacket: path.join(artifactDir, 'compare-entry-manual-figma-packet.html'),
    frameSpecs: path.join(artifactDir, 'compare-entry-manual-frame-specs.md'),
    buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    reviewWorksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
    decisionLog: path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
    nextSurfaceChecklist: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.html'),
    nextSurfaceSectionPacket: path.join(
      artifactDir,
      'compare-entry-review-next-surface-section-packet.html',
    ),
    nextSectionPacket: path.join(artifactDir, 'compare-entry-review-next-section-packet.html'),
    gate: path.join(artifactDir, 'compare-entry-review-gate.md'),
    figmaRetryPacket: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
    latestHandoff: path.join(artifactDir, 'compare-entry-review-sessions', 'latest-handoff.html'),
    approvalBoard: path.join(artifactDir, 'compare-entry-approval-board.html'),
  };
  const fallbackPreview = resolveFallbackPreview(recommendedFrame, recommendedSection);

  const actionItems = recommendedSurface && recommendedFrame && recommendedSection
    ? [
        `Open route \`${recommendedSurface.route}\` and work inside \`${recommendedFrame}\`.`,
        `Start with section \`${recommendedSection}\`${sectionPhase ? ` (${sectionPhase})` : ''}.`,
        `Use \`${links.manualPacket}\` and \`${links.frameSpecs}\` as the visual/reference source of truth.`,
        ...(fallbackPreview
          ? [
              `If Figma MCP is rate-limited, open \`${fallbackPreview.previewHtml}\` and keep the worksheet unchecked until the Figma node exists.`,
              `Before checking the worksheet, confirm the active blocker in \`${links.gate}\` and retry packet \`${links.figmaRetryPacket}\`.`,
            ]
          : []),
        `Mirror section progress into \`${links.buildWorksheet}\`, then note review status in \`${links.reviewWorksheet}\` and \`${links.decisionLog}\`.`,
        'After the section update, re-run `npm run ntl:compare-entry-review-finalize` and `npm run ntl:compare-entry-review-ready-check`.',
      ]
    : [
        'No recommended section remains. Open the approval board and decide whether SUN-10 is ready to unblock implementation.',
      ];

  const summaryInput = {
    gateState: nextSurfaceSectionPacket.gateState ?? nextSectionPacket.gateState ?? 'unknown',
    readyToUnblock: Boolean(
      nextSurfaceSectionPacket.readyToUnblock ?? nextSectionPacket.readyToUnblock,
    ),
    hasRecommendedSection: Boolean(recommendedSurface && recommendedFrame && recommendedSection),
    recommendedSurface,
    recommendedFrame,
    recommendedSection,
  };
  const activeBlocker = resolveActiveBlocker(gate, summaryInput);

  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: summaryInput.gateState,
    readyToUnblock: summaryInput.readyToUnblock,
    activeBlocker,
    hasRecommendedSection: summaryInput.hasRecommendedSection,
    recommendedSurface: recommendedSurface
      ? {
          surface: recommendedSurface.surface,
          label: recommendedSurface.label,
          route: recommendedSurface.route,
          totalPending: Number(recommendedSurface.totalPending ?? 0),
        }
      : null,
    recommendedFrame,
    recommendedSection,
    sectionPhase,
    checklistFrame: firstChecklistFrame,
    checklistFirstSection: firstChecklistSection,
    checklistSectionCount: sectionChecklist.length,
    checklistPreview,
    focusActions: Array.isArray(nextSectionPacket.focusActions) ? nextSectionPacket.focusActions : [],
    siblingSections: Array.isArray(nextSectionPacket.siblingSections)
      ? nextSectionPacket.siblingSections
      : [],
    actionItems,
    fallbackPreview,
    links,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Next Section Action Card

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
- recommendedFrame: \`${summary.recommendedFrame ?? 'none'}\`
- recommendedSection: \`${summary.recommendedSection ?? 'none'}\`
- sectionPhase: \`${summary.sectionPhase ?? 'none'}\`
- checklistSectionCount: \`${summary.checklistSectionCount}\`

${formatActiveBlockerMarkdown(summary.activeBlocker)}

## Action Items

${formatMarkdownList(summary.actionItems, 'none')}

## Checklist Preview

${formatMarkdownList(summary.checklistPreview, 'none')}

## Sibling Sections

${formatMarkdownList(summary.siblingSections, 'none')}

## Focus Actions

${formatMarkdownList(summary.focusActions, 'none')}
${formatFallbackMarkdown(summary.fallbackPreview)}

## Related Artifacts

- manual packet: \`${links.manualPacket}\`
- frame specs: \`${links.frameSpecs}\`
- build worksheet: \`${links.buildWorksheet}\`
- review worksheet: \`${links.reviewWorksheet}\`
- decision log: \`${links.decisionLog}\`
- next surface checklist: \`${links.nextSurfaceChecklist}\`
- next surface section packet: \`${links.nextSurfaceSectionPacket}\`
- next section packet: \`${links.nextSectionPacket}\`
- gate: \`${links.gate}\`
- figma retry packet: \`${links.figmaRetryPacket}\`
- latest handoff: \`${links.latestHandoff}\`
- approval board: \`${links.approvalBoard}\`
${summary.fallbackPreview ? `- fallback preview html: \`${summary.fallbackPreview.previewHtml}\`
- fallback preview json: \`${summary.fallbackPreview.previewJson}\`
- figma plugin template: \`${summary.fallbackPreview.figmaTemplate}\`` : ''}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  const html = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Compare Entry Review Next Section Action Card</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f4f7fb;
        --panel: rgba(255,255,255,0.94);
        --line: #d6deeb;
        --text: #172033;
        --muted: #5e6a82;
        --fallback: #fff7ed;
        --fallback-line: #fdba74;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: "SF Pro Display", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
        background: linear-gradient(180deg, #eef4ff 0%, #f4f7fb 30%, #f8fafc 100%);
        color: var(--text);
      }
      main {
        max-width: 1200px;
        margin: 0 auto;
        padding: 32px 24px 56px;
        display: grid;
        gap: 18px;
      }
      .hero, .panel, .fallback {
        border: 1px solid var(--line);
        border-radius: 24px;
        background: var(--panel);
        padding: 22px;
      }
      .fallback {
        background: var(--fallback);
        border-color: var(--fallback-line);
        display: grid;
        gap: 14px;
      }
      .hero h1 { margin: 0 0 10px; font-size: 34px; line-height: 1.05; }
      .hero p, .panel p { margin: 0; color: var(--muted); }
      .summary, .grid-2, .links {
        display: grid;
        gap: 14px;
      }
      .summary { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
      .grid-2 { grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); }
      .links { grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
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
      h2 { margin: 0 0 10px; font-size: 18px; }
      ul { margin: 0; padding-left: 20px; display: grid; gap: 8px; }
      code {
        background: #eef3fb;
        border-radius: 10px;
        padding: 2px 6px;
        font-family: "SFMono-Regular", ui-monospace, monospace;
      }
    </style>
  </head>
  <body>
    <main>
      <section class="hero">
        <h1>Compare Entry Review Next Section Action Card</h1>
        <p>수동 reviewer가 지금 바로 시작해야 하는 route / frame / section / 실행 순서를 한 화면으로 묶은 진입 카드입니다.</p>
      </section>

      <section class="summary">
        <div class="metric"><strong>Gate</strong><span>${escapeHtml(summary.gateState)}</span></div>
        <div class="metric"><strong>Active Blocker</strong><span>${escapeHtml(summary.activeBlocker.kind)}</span></div>
        <div class="metric"><strong>Surface</strong><span>${escapeHtml(summary.recommendedSurface?.surface ?? 'none')}</span></div>
        <div class="metric"><strong>Route</strong><span>${escapeHtml(summary.recommendedSurface?.route ?? 'none')}</span></div>
        <div class="metric"><strong>Frame</strong><span>${escapeHtml(summary.recommendedFrame ?? 'none')}</span></div>
        <div class="metric"><strong>Section</strong><span>${escapeHtml(summary.recommendedSection ?? 'none')}</span></div>
        <div class="metric"><strong>Checklist Count</strong><span>${escapeHtml(summary.checklistSectionCount)}</span></div>
      </section>

      <section class="grid-2">
${formatActiveBlockerHtml(summary.activeBlocker)}
        <div class="panel">
          <h2>Action Items</h2>
          <ul>${formatHtmlList(summary.actionItems)}</ul>
        </div>
        <div class="panel">
          <h2>Checklist Preview</h2>
          <ul>${formatHtmlList(summary.checklistPreview)}</ul>
        </div>
      </section>

      <section class="grid-2">
        <div class="panel">
          <h2>Sibling Sections</h2>
          <ul>${formatHtmlList(summary.siblingSections)}</ul>
        </div>
        <div class="panel">
          <h2>Focus Actions</h2>
          <ul>${formatHtmlList(summary.focusActions)}</ul>
        </div>
      </section>
${formatFallbackHtml(summary.fallbackPreview)}

      <section class="links">
        <a class="link-card" href="${links.manualPacket}"><strong>Manual Packet</strong><code>${escapeHtml(links.manualPacket)}</code></a>
        <a class="link-card" href="${links.frameSpecs}"><strong>Frame Specs</strong><code>${escapeHtml(links.frameSpecs)}</code></a>
        <a class="link-card" href="${links.buildWorksheet}"><strong>Build Worksheet</strong><code>${escapeHtml(links.buildWorksheet)}</code></a>
        <a class="link-card" href="${links.reviewWorksheet}"><strong>Review Worksheet</strong><code>${escapeHtml(links.reviewWorksheet)}</code></a>
        <a class="link-card" href="${links.decisionLog}"><strong>Decision Log</strong><code>${escapeHtml(links.decisionLog)}</code></a>
        <a class="link-card" href="${links.nextSurfaceChecklist}"><strong>Next Surface Checklist</strong><code>${escapeHtml(links.nextSurfaceChecklist)}</code></a>
        <a class="link-card" href="${links.nextSurfaceSectionPacket}"><strong>Next Surface Section Packet</strong><code>${escapeHtml(links.nextSurfaceSectionPacket)}</code></a>
        <a class="link-card" href="${links.nextSectionPacket}"><strong>Next Section Packet</strong><code>${escapeHtml(links.nextSectionPacket)}</code></a>
        <a class="link-card" href="${links.latestHandoff}"><strong>Latest Handoff</strong><code>${escapeHtml(links.latestHandoff)}</code></a>
        <a class="link-card" href="${links.approvalBoard}"><strong>Approval Board</strong><code>${escapeHtml(links.approvalBoard)}</code></a>
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
        recommendedSurface: summary.recommendedSurface?.surface ?? null,
        recommendedFrame: summary.recommendedFrame,
        recommendedSection: summary.recommendedSection,
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
