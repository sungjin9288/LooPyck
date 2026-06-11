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
  statusJson: path.join(artifactDir, 'compare-entry-review-status.json'),
  frameProgressJson: path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
  sectionProgressJson: path.join(artifactDir, 'compare-entry-review-section-progress-board.json'),
  surfaceQueueJson: path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
  surfaceStatusJson: path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
  nextFramePacketJson: path.join(artifactDir, 'compare-entry-review-next-frame-packet.json'),
  nextSectionPacketJson: path.join(artifactDir, 'compare-entry-review-next-section-packet.json'),
  nextSurfaceSectionPacketJson: path.join(artifactDir, 'compare-entry-review-next-surface-section-packet.json'),
  nextSurfaceChecklistJson: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.json'),
  nextSurfaceChecklistHtml: path.join(artifactDir, 'compare-entry-review-next-surface-checklist.html'),
  nextSectionActionCardJson: path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'),
  nextSectionActionCardHtml: path.join(artifactDir, 'compare-entry-review-next-section-action-card.html'),
  figmaRetryPacketJson: path.join(artifactDir, 'compare-entry-figma-retry-packet.json'),
  figmaRetryPacketMarkdown: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
  decisionLog: path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
  buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
  reviewWorksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-closeout-draft.md'),
  json: path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
};

function cleanFieldValue(value) {
  return value
    .replaceAll('`', '')
    .replaceAll('*', '')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractDecisionField(markdown, label) {
  const pattern = new RegExp(`^- ${escapeRegExp(label)}:[ \\t]*([^\\n]+)$`, 'm');
  const match = markdown.match(pattern);
  if (!match) return null;
  const cleaned = cleanFieldValue(match[1]);
  if (!cleaned || cleaned.includes('|')) return null;
  return cleaned;
}

function extractSection(markdown, title) {
  const pattern = new RegExp(`## ${title}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = markdown.match(pattern);
  return match ? match[1].trim() : '';
}

function extractListItems(sectionMarkdown, kind) {
  if (!sectionMarkdown) return [];

  const lines = sectionMarkdown.split('\n');
  const items = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (kind === 'ordered') {
      const match = trimmed.match(/^\d+\.\s*(.*)$/);
      if (!match) continue;
      const value = cleanFieldValue(match[1]);
      if (value) items.push(value);
      continue;
    }

    if (kind === 'labeled') {
      if (!trimmed.startsWith('- ')) continue;
      const value = cleanFieldValue(trimmed.slice(2));
      const [, remainder = ''] = value.split(':');
      if (!remainder.trim()) continue;
      items.push(value);
    }
  }

  return items;
}

function formatList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function buildTargetLabel(target) {
  if (!target) return null;
  return [target.surface, target.frame, target.section].filter(Boolean).join(' -> ') || null;
}

async function readOptionalJson(filePath) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function buildTopBlockedFrames(frameProgress) {
  return Array.isArray(frameProgress?.frames)
    ? frameProgress.frames
        .filter((frame) => Number(frame.totalPending) > 0)
        .slice(0, 3)
        .map((frame) => `${frame.frame} (${frame.totalPending})`)
    : [];
}

function buildTopBlockedSurfaces(surfaceQueue) {
  return Array.isArray(surfaceQueue?.surfaces)
    ? surfaceQueue.surfaces
        .filter((surface) => Number(surface.totalPending) > 0)
        .slice(0, 3)
        .map((surface) => `${surface.surface} (${surface.totalPending})`)
    : [];
}

function buildTopBlockedSections(sectionProgress) {
  if (!Array.isArray(sectionProgress?.frames)) return [];

  return sectionProgress.frames
    .filter((frame) => Number(frame.totalPending) > 0 && Array.isArray(frame.sections))
    .flatMap((frame) =>
      frame.sections
        .slice()
        .sort(
          (left, right) =>
            Number(Boolean(right.isRecommended)) - Number(Boolean(left.isRecommended)) ||
            Number(left.order ?? 0) - Number(right.order ?? 0),
        )
        .map((section) => ({
          label: `${frame.frame} -> ${section.section}`,
          isRecommended: Boolean(section.isRecommended),
        })),
    )
    .sort((left, right) => Number(right.isRecommended) - Number(left.isRecommended))
    .slice(0, 5)
    .map((entry) => entry.label);
}

function buildRecommendedSurfaceSectionPreview(nextSurfaceSectionPacket) {
  if (!Array.isArray(nextSurfaceSectionPacket?.orderedSections)) return [];

  return nextSurfaceSectionPacket.orderedSections
    .slice(0, 5)
    .map((section) => `${section.frame} -> ${section.section}`);
}

function buildNextActions(
  status,
  decision,
  recommendedNextSurface,
  recommendedNextFrame,
  recommendedNextSection,
  recommendedNextSectionActionCardPath,
  recommendedNextSectionActionFirstItem,
  figmaRetryPacket,
  topBlockedSurfaces,
  topBlockedFrames,
  topBlockedSections,
) {
  if (status.readyToUnblock) {
    return [
      'Post the closeout summary to `SUN-10` and attach the latest review artifacts.',
      'Move `SUN-10` to the approved/done state and clear the blocker on `SUN-11` / `SUN-12`.',
      'Start `SUN-11` and `SUN-12` implementation on the approved node boundary without reopening frame review.',
    ];
  }

  const actions = [];
  if (status.build.pending > 0) {
    actions.push('Finish the remaining manual build worksheet checkboxes before asking for approval.');
  }
  if (status.review.pending > 0) {
    actions.push('Complete the review worksheet pass/fail checklist for all six frames.');
  }
  if (!decision.outcome) {
    actions.push('Select a review outcome in the decision log.');
  }
  if (!decision.unblocks) {
    actions.push('Decide whether `SUN-10` unblocks `SUN-11` / `SUN-12` in the decision log.');
  }
  if (!decision.confidence) {
    actions.push('Record reviewer confidence in the decision log.');
  }
  if (recommendedNextSectionActionFirstItem) {
    actions.push(`Use the action card first: ${recommendedNextSectionActionFirstItem}`);
  }
  if (recommendedNextSectionActionCardPath) {
    actions.push(`Open \`${recommendedNextSectionActionCardPath}\` first for the current route/frame/section execution card.`);
  }
  if (figmaRetryPacket?.retryReady) {
    actions.push(`When Figma MCP is available, run the retry packet first: \`${figmaRetryPacket.markdownPath}\`.`);
    actions.push('Keep the manual build worksheet unchecked until the retry packet produces an actual Figma frameId and sectionId.');
  }
  if (recommendedNextSection) {
    actions.push(`Use the recommended next section first: ${recommendedNextSection}.`);
    actions.push('Open `output/playwright/compare-entry-review-next-section-packet.html` first for the section-level execution packet.');
  }
  if (recommendedNextFrame) {
    actions.push(`Use the recommended next frame first: ${recommendedNextFrame}.`);
    actions.push('Use `output/playwright/compare-entry-review-next-frame-packet.html` to confirm the frame-level queue and sibling frame order.');
  }
  if (recommendedNextSurface) {
    actions.push(`Use the recommended next surface first: ${recommendedNextSurface}.`);
    actions.push('Use `output/playwright/compare-entry-review-next-surface-packet.html` to verify the sibling frame order and route-level context.');
    actions.push('Use `output/playwright/compare-entry-review-next-surface-section-packet.html` to work through the full section backlog inside the current recommended surface.');
    actions.push('Use `output/playwright/compare-entry-review-next-surface-checklist.html` as the execution checklist while filling the current recommended surface.');
  }
  if (topBlockedSurfaces.length > 0) {
    actions.push(`Close the highest-pending surfaces first: ${topBlockedSurfaces.join(', ')}.`);
  }
  if (topBlockedFrames.length > 0) {
    actions.push(`Start with the highest-pending frames first: ${topBlockedFrames.join(', ')}.`);
  }
  if (topBlockedSections.length > 0) {
    actions.push(`Use the highest-pending sections as the first editing slice: ${topBlockedSections.join(', ')}.`);
  }
  if (!actions.length) {
    actions.push('Re-run the status and closeout commands after updating the review artifacts.');
  }
  actions.push('Open `output/playwright/compare-entry-review-focus-plan.md`, `compare-entry-review-next-section-packet.html`, `compare-entry-review-next-frame-packet.html`, `compare-entry-review-next-surface-packet.html`, `compare-entry-review-frame-progress-board.html`, then `compare-entry-review-missing-detail.md` for the full frame-level checklist.');
  actions.push('Re-run `npm run ntl:compare-entry-review-finalize` and `npm run ntl:compare-entry-review-gate:strict` after edits.');
  return actions;
}

function buildActiveBlocker({
  status,
  figmaRetryPacket,
  recommendedNextSurface,
  recommendedNextFrame,
  recommendedNextSection,
  recommendedNextSectionActionCardPath,
  nextActions,
}) {
  if (status.readyToUnblock) {
    return {
      kind: 'none',
      summary: 'No active blocker. SUN-10 can unblock SUN-11 / SUN-12.',
      target: null,
      latestStatus: null,
      latestOperation: null,
      latestTool: null,
      evidencePath: null,
      nextAction: 'Proceed with SUN-11 / SUN-12 handoff.',
    };
  }

  const attemptHistory = figmaRetryPacket?.mcpAttemptHistory ?? null;
  const latestStatus = attemptHistory?.latestStatus ?? null;
  const latestOperation = attemptHistory?.latestOperation ?? null;
  const latestTool = attemptHistory?.latestTool ?? null;

  if (figmaRetryPacket?.retryReady) {
    const rateLimited = latestStatus === 'rate-limited';
    return {
      kind: rateLimited ? 'figma-mcp-rate-limit' : 'figma-mcp-retry-ready',
      summary: rateLimited
        ? 'Figma MCP is rate-limited for the current retry-ready slice. Worksheet must remain unchecked until a real Figma node is created.'
        : 'Figma retry packet is ready, but SUN-10 remains blocked until the retry produces a real Figma frameId and sectionId.',
      target: buildTargetLabel(figmaRetryPacket.target),
      latestStatus,
      latestOperation,
      latestTool,
      evidencePath: figmaRetryPacket.markdownPath ?? attemptHistory?.markdownPath ?? null,
      nextAction: 'Retry the Figma template when MCP quota is available, then check only the created slice and rerun the ready-check.',
    };
  }

  return {
    kind: 'review-readiness',
    summary: 'SUN-10 build/review inputs are incomplete, so the review gate remains blocked.',
    target: [recommendedNextSurface, recommendedNextFrame, recommendedNextSection].filter(Boolean).join(' -> ') || null,
    latestStatus: null,
    latestOperation: null,
    latestTool: null,
    evidencePath: recommendedNextSectionActionCardPath ?? null,
    nextAction: nextActions[0] ?? 'Complete the next pending review input and rerun the ready-check.',
  };
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [statusRaw, frameProgressRaw, sectionProgressRaw, surfaceQueueRaw, surfaceStatusRaw, nextFramePacketRaw, nextSectionPacketRaw, nextSurfaceSectionPacketRaw, nextSurfaceChecklistRaw, nextSectionActionCardRaw, decisionLog, buildWorksheet, reviewWorksheet] = await Promise.all([
    readFile(inputPaths.statusJson, 'utf8'),
    readFile(inputPaths.frameProgressJson, 'utf8'),
    readFile(inputPaths.sectionProgressJson, 'utf8'),
    readFile(inputPaths.surfaceQueueJson, 'utf8'),
    readFile(inputPaths.surfaceStatusJson, 'utf8'),
    readFile(inputPaths.nextFramePacketJson, 'utf8'),
    readFile(inputPaths.nextSectionPacketJson, 'utf8'),
    readFile(inputPaths.nextSurfaceSectionPacketJson, 'utf8'),
    readFile(inputPaths.nextSurfaceChecklistJson, 'utf8'),
    readFile(inputPaths.nextSectionActionCardJson, 'utf8'),
    readFile(inputPaths.decisionLog, 'utf8'),
    readFile(inputPaths.buildWorksheet, 'utf8'),
    readFile(inputPaths.reviewWorksheet, 'utf8'),
  ]);

  const status = JSON.parse(statusRaw);
  const frameProgress = JSON.parse(frameProgressRaw);
  const sectionProgress = JSON.parse(sectionProgressRaw);
  const surfaceQueue = JSON.parse(surfaceQueueRaw);
  const surfaceStatus = JSON.parse(surfaceStatusRaw);
  const nextFramePacket = JSON.parse(nextFramePacketRaw);
  const nextSectionPacket = JSON.parse(nextSectionPacketRaw);
  const nextSurfaceSectionPacket = JSON.parse(nextSurfaceSectionPacketRaw);
  const nextSurfaceChecklist = JSON.parse(nextSurfaceChecklistRaw);
  const nextSectionActionCard = JSON.parse(nextSectionActionCardRaw);
  const retryPacket = await readOptionalJson(inputPaths.figmaRetryPacketJson);
  const figmaRetryPacket = retryPacket
      ? {
          retryReady: Boolean(retryPacket.retryReady),
          status: retryPacket.status ?? null,
          target: retryPacket.target ?? null,
          markdownPath: inputPaths.figmaRetryPacketMarkdown,
          jsonPath: inputPaths.figmaRetryPacketJson,
          mcpAttemptHistory: retryPacket.mcpAttemptHistory ?? null,
        }
      : null;
  const decision = {
    outcome: extractDecisionField(decisionLog, 'Outcome'),
    unblocks: extractDecisionField(decisionLog, 'Does `SUN-10` unblock `SUN-11` / `SUN-12`?'),
    confidence: extractDecisionField(decisionLog, 'Reviewer confidence'),
  };

  const revisions = extractListItems(extractSection(decisionLog, 'Required Revisions'), 'ordered');
  const followUp = extractListItems(extractSection(decisionLog, 'Approved With Follow-up Notes'), 'labeled');
  const handoffNotes = extractListItems(extractSection(decisionLog, 'Handoff Notes'), 'labeled');
  const builder = extractDecisionField(buildWorksheet, 'Builder');
  const reviewer = extractDecisionField(reviewWorksheet, 'Reviewer');
  const topBlockedSurfaces = buildTopBlockedSurfaces(surfaceQueue);
  const topBlockedFrames = buildTopBlockedFrames(frameProgress);
  const topBlockedSections = buildTopBlockedSections(sectionProgress);
  const recommendedNextFrame = nextFramePacket.recommendedFrame?.frame ?? null;
  const recommendedNextSection = nextSectionPacket.recommendedSection?.section ?? null;
  const recommendedNextSurfaceFrameCount = Number(nextSurfaceSectionPacket.totalFrames ?? 0);
  const recommendedNextSurfaceSectionCount = Number(nextSurfaceSectionPacket.totalSections ?? 0);
  const recommendedNextSurfaceSectionPreview = buildRecommendedSurfaceSectionPreview(nextSurfaceSectionPacket);
  const recommendedNextSurfaceChecklistFirstFrame =
    nextSurfaceChecklist.frames?.[0]?.frame ?? null;
  const recommendedNextSurfaceChecklistFirstSection =
    nextSurfaceChecklist.frames?.[0]?.checklistSections?.[0]?.section ?? null;

  const nextActions = buildNextActions(
    status,
    decision,
    surfaceStatus.recommendedNextSurface ?? null,
    recommendedNextFrame,
    recommendedNextSection,
    inputPaths.nextSectionActionCardHtml,
    nextSectionActionCard?.actionItems?.[0] ?? null,
    figmaRetryPacket,
    topBlockedSurfaces,
    topBlockedFrames,
    topBlockedSections,
  );
  const activeBlocker = buildActiveBlocker({
    status,
    figmaRetryPacket,
    recommendedNextSurface: surfaceStatus.recommendedNextSurface ?? null,
    recommendedNextFrame,
    recommendedNextSection,
    recommendedNextSectionActionCardPath: inputPaths.nextSectionActionCardHtml,
    nextActions,
  });

  const summary = {
    generatedAt: new Date().toISOString(),
    sourceGeneratedAt: status.generatedAt ?? null,
    readyToUnblock: Boolean(status.readyToUnblock),
    build: status.build,
    review: status.review,
    decision,
    missing: Array.isArray(status.missing) ? status.missing : [],
    revisions,
    followUp,
    handoffNotes,
    blockedSurfaceCount: Number(surfaceStatus.blockedSurfaceCount ?? 0),
    readySurfaceCount: Number(surfaceStatus.readySurfaceCount ?? 0),
    recommendedNextSurface: surfaceStatus.recommendedNextSurface ?? null,
    recommendedNextFrame,
    recommendedNextSection,
    recommendedNextSurfaceFrameCount,
    recommendedNextSurfaceSectionCount,
    recommendedNextSurfaceSectionPreview,
    recommendedNextSurfaceChecklistPath: inputPaths.nextSurfaceChecklistHtml,
    recommendedNextSurfaceChecklistFirstFrame,
    recommendedNextSurfaceChecklistFirstSection,
    recommendedNextSectionActionCardPath: inputPaths.nextSectionActionCardHtml,
    recommendedNextSectionActionFirstItem: nextSectionActionCard?.actionItems?.[0] ?? null,
    activeBlocker,
    figmaRetryPacket,
    topBlockedSurfaces,
    topBlockedFrames,
    topBlockedSections,
    builder,
    reviewer,
    recommendedState: status.readyToUnblock
      ? 'Ready to post approval'
      : decision.outcome === 'Needs Revision'
        ? 'Needs revision'
        : 'Blocked pending review completion',
    nextActions,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const linearDraft = summary.readyToUnblock
    ? `SUN-10 review outcome: ${decision.outcome ?? 'unknown'}
Unblocks: ${decision.unblocks ?? 'unknown'}
Reviewer confidence: ${decision.confidence ?? 'unknown'}
Build completion: ${status.build.checked}/${status.build.total}
Review completion: ${status.review.checked}/${status.review.total}
Blocked surfaces: ${summary.blockedSurfaceCount}
Ready surfaces: ${summary.readySurfaceCount}
Recommended next surface: ${summary.recommendedNextSurface ?? 'none'}
Recommended next frame: ${summary.recommendedNextFrame ?? 'none'}
Recommended next section: ${summary.recommendedNextSection ?? 'none'}
Recommended surface frame count: ${summary.recommendedNextSurfaceFrameCount}
Recommended surface section count: ${summary.recommendedNextSurfaceSectionCount}
Recommended surface checklist path: ${summary.recommendedNextSurfaceChecklistPath}
Recommended surface checklist first frame: ${summary.recommendedNextSurfaceChecklistFirstFrame ?? 'none'}
Recommended surface checklist first section: ${summary.recommendedNextSurfaceChecklistFirstSection ?? 'none'}
Recommended next section action card path: ${summary.recommendedNextSectionActionCardPath}
Recommended next section action first item: ${summary.recommendedNextSectionActionFirstItem ?? 'none'}
Figma retry packet status: ${summary.figmaRetryPacket?.status ?? 'none'}
Figma retry packet ready: ${summary.figmaRetryPacket?.retryReady ? 'true' : 'false'}
Figma retry packet path: ${summary.figmaRetryPacket?.markdownPath ?? 'none'}
Figma MCP attempt history count: ${summary.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts ?? 0}
Figma MCP latest attempt: ${summary.figmaRetryPacket?.mcpAttemptHistory?.latestOperation ?? 'none'} via ${summary.figmaRetryPacket?.mcpAttemptHistory?.latestTool ?? 'none'}
Active blocker: ${summary.activeBlocker.kind}
Active blocker target: ${summary.activeBlocker.target ?? 'none'}
Active blocker latest status: ${summary.activeBlocker.latestStatus ?? 'none'}
Active blocker latest operation: ${summary.activeBlocker.latestOperation ?? 'none'}
Active blocker next action: ${summary.activeBlocker.nextAction}

Required revisions:
${formatList(revisions, 'none recorded')}

Follow-up:
${formatList(followUp, 'none recorded')}

Handoff notes:
${formatList(handoffNotes, 'none recorded')}

Next:
- unblock SUN-11 and SUN-12
- keep SUN-13 waiting for implementation and validation refresh`
    : `SUN-10 review is not ready to unblock implementation.
Current state: ${summary.recommendedState}
Build completion: ${status.build.checked}/${status.build.total}
Review completion: ${status.review.checked}/${status.review.total}

Missing:
${formatList(summary.missing, 'none recorded')}

Top blocked frames:
${formatList(summary.topBlockedFrames, 'none recorded')}

Top blocked surfaces:
${formatList(summary.topBlockedSurfaces, 'none recorded')}

Top blocked sections:
${formatList(summary.topBlockedSections, 'none recorded')}

Next:
${formatList(summary.nextActions, 'rerun review prep and status commands')}`;

  const markdown = `# Compare Entry Review Closeout Draft

## Current Status

- generatedAt: \`${summary.generatedAt}\`
- review session source: \`${summary.sourceGeneratedAt ?? 'unknown'}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- recommendedState: \`${summary.recommendedState}\`
- build completion: \`${status.build.checked}/${status.build.total}\`
- review completion: \`${status.review.checked}/${status.review.total}\`
- blockedSurfaceCount: \`${summary.blockedSurfaceCount}\`
- readySurfaceCount: \`${summary.readySurfaceCount}\`
- recommendedNextSurface: \`${summary.recommendedNextSurface ?? 'none'}\`
- recommendedNextFrame: \`${summary.recommendedNextFrame ?? 'none'}\`
- recommendedNextSection: \`${summary.recommendedNextSection ?? 'none'}\`
- recommendedNextSurfaceFrameCount: \`${summary.recommendedNextSurfaceFrameCount}\`
- recommendedNextSurfaceSectionCount: \`${summary.recommendedNextSurfaceSectionCount}\`
- recommendedNextSurfaceChecklistPath: \`${summary.recommendedNextSurfaceChecklistPath}\`
- recommendedNextSurfaceChecklistFirstFrame: \`${summary.recommendedNextSurfaceChecklistFirstFrame ?? 'none'}\`
- recommendedNextSurfaceChecklistFirstSection: \`${summary.recommendedNextSurfaceChecklistFirstSection ?? 'none'}\`
- recommendedNextSectionActionCardPath: \`${summary.recommendedNextSectionActionCardPath}\`
- recommendedNextSectionActionFirstItem: \`${summary.recommendedNextSectionActionFirstItem ?? 'none'}\`
- figmaRetryPacketStatus: \`${summary.figmaRetryPacket?.status ?? 'none'}\`
- figmaRetryPacketReady: \`${summary.figmaRetryPacket?.retryReady ? 'true' : 'false'}\`
- figmaRetryPacketPath: \`${summary.figmaRetryPacket?.markdownPath ?? 'none'}\`
- figmaMcpAttemptHistoryCount: \`${summary.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts ?? 0}\`
- figmaMcpLatestAttempt: \`${summary.figmaRetryPacket?.mcpAttemptHistory?.latestOperation ?? 'none'} via ${summary.figmaRetryPacket?.mcpAttemptHistory?.latestTool ?? 'none'}\`
- activeBlocker: \`${summary.activeBlocker.kind}\`
- activeBlockerTarget: \`${summary.activeBlocker.target ?? 'none'}\`
- activeBlockerLatestStatus: \`${summary.activeBlocker.latestStatus ?? 'none'}\`
- activeBlockerLatestOperation: \`${summary.activeBlocker.latestOperation ?? 'none'}\`
- activeBlockerEvidencePath: \`${summary.activeBlocker.evidencePath ?? 'none'}\`
- decision outcome: \`${decision.outcome ?? 'unselected'}\`
- decision unblocks: \`${decision.unblocks ?? 'unselected'}\`
- reviewer confidence: \`${decision.confidence ?? 'unselected'}\`
- builder: \`${builder ?? 'unfilled'}\`
- reviewer: \`${reviewer ?? 'unfilled'}\`

## Missing Or Blocking Items

${formatList(summary.missing, 'none')}

## Required Revisions

${formatList(revisions, 'none recorded')}

## Follow-up Notes

${formatList(followUp, 'none recorded')}

## Handoff Notes

${formatList(handoffNotes, 'none recorded')}

## Top Blocked Surfaces

${formatList(summary.topBlockedSurfaces, 'none recorded')}

## Top Blocked Frames

${formatList(summary.topBlockedFrames, 'none recorded')}

## Top Blocked Sections

${formatList(summary.topBlockedSections, 'none recorded')}

## Recommended Surface Section Preview

${formatList(summary.recommendedNextSurfaceSectionPreview, 'none recorded')}

## Recommended Surface Checklist

- path: \`${summary.recommendedNextSurfaceChecklistPath}\`
- first frame: \`${summary.recommendedNextSurfaceChecklistFirstFrame ?? 'none'}\`
- first section: \`${summary.recommendedNextSurfaceChecklistFirstSection ?? 'none'}\`

## Recommended Section Action Card

- path: \`${summary.recommendedNextSectionActionCardPath}\`
- first action: \`${summary.recommendedNextSectionActionFirstItem ?? 'none'}\`

## Figma Retry Packet

- status: \`${summary.figmaRetryPacket?.status ?? 'none'}\`
- retryReady: \`${summary.figmaRetryPacket?.retryReady ? 'true' : 'false'}\`
- target: \`${summary.figmaRetryPacket?.target ? `${summary.figmaRetryPacket.target.surface ?? 'none'} -> ${summary.figmaRetryPacket.target.frame ?? 'none'} -> ${summary.figmaRetryPacket.target.section ?? 'none'}` : 'none'}\`
- markdown: \`${summary.figmaRetryPacket?.markdownPath ?? 'none'}\`
- json: \`${summary.figmaRetryPacket?.jsonPath ?? 'none'}\`
- attemptHistoryCount: \`${summary.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts ?? 0}\`
- attemptHistoryMarkdown: \`${summary.figmaRetryPacket?.mcpAttemptHistory?.markdownPath ?? 'none'}\`
- attemptHistoryJson: \`${summary.figmaRetryPacket?.mcpAttemptHistory?.jsonPath ?? 'none'}\`
- latestAttempt: \`${summary.figmaRetryPacket?.mcpAttemptHistory?.latestOperation ?? 'none'} via ${summary.figmaRetryPacket?.mcpAttemptHistory?.latestTool ?? 'none'}\`

## Active Blocker

- kind: \`${summary.activeBlocker.kind}\`
- summary: \`${summary.activeBlocker.summary}\`
- target: \`${summary.activeBlocker.target ?? 'none'}\`
- latestStatus: \`${summary.activeBlocker.latestStatus ?? 'none'}\`
- latestOperation: \`${summary.activeBlocker.latestOperation ?? 'none'}\`
- latestTool: \`${summary.activeBlocker.latestTool ?? 'none'}\`
- evidencePath: \`${summary.activeBlocker.evidencePath ?? 'none'}\`
- nextAction: \`${summary.activeBlocker.nextAction}\`

## Recommended Next Actions

${formatList(summary.nextActions, 'no next actions')}

## SUN-10 Closeout Draft

\`\`\`text
${linearDraft}
\`\`\`

## Commands

\`\`\`bash
npm run ntl:compare-entry-review-status
npm run ntl:compare-entry-review-closeout
\`\`\`
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        readyToUnblock: summary.readyToUnblock,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        missing: summary.missing.length,
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
