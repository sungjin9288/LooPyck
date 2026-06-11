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
  closeoutJson: path.join(artifactDir, 'compare-entry-review-closeout-draft.json'),
  frameProgressJson: path.join(artifactDir, 'compare-entry-review-frame-progress-board.json'),
  surfaceQueueJson: path.join(artifactDir, 'compare-entry-review-surface-queue.json'),
  surfaceStatusJson: path.join(artifactDir, 'compare-entry-review-surface-status-board.json'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-linear-update-draft.md'),
  text: path.join(artifactDir, 'compare-entry-linear-update-draft.txt'),
  json: path.join(artifactDir, 'compare-entry-linear-update-draft.json'),
};

function formatBulletList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [gateRaw, closeoutRaw, frameProgressRaw, surfaceQueueRaw, surfaceStatusRaw] = await Promise.all([
    readFile(inputPaths.gateJson, 'utf8'),
    readFile(inputPaths.closeoutJson, 'utf8'),
    readFile(inputPaths.frameProgressJson, 'utf8'),
    readFile(inputPaths.surfaceQueueJson, 'utf8'),
    readFile(inputPaths.surfaceStatusJson, 'utf8'),
  ]);

  const gate = JSON.parse(gateRaw);
  const closeout = JSON.parse(closeoutRaw);
  const frameProgress = JSON.parse(frameProgressRaw);
  const surfaceQueue = JSON.parse(surfaceQueueRaw);
  const surfaceStatus = JSON.parse(surfaceStatusRaw);
  const missing = Array.isArray(gate.missing) ? gate.missing : [];
  const nextActions = Array.isArray(gate.nextActions) ? gate.nextActions : [];
  const revisions = Array.isArray(closeout.revisions) ? closeout.revisions : [];
  const followUp = Array.isArray(closeout.followUp) ? closeout.followUp : [];
  const handoffNotes = Array.isArray(closeout.handoffNotes) ? closeout.handoffNotes : [];
  const figmaRetryPacket = closeout.figmaRetryPacket ?? null;
  const activeBlocker = gate.activeBlocker ?? closeout.activeBlocker ?? {
    kind: 'unknown',
    summary: 'No active blocker summary was provided.',
    target: null,
    latestStatus: null,
    latestOperation: null,
    latestTool: null,
    evidencePath: null,
    nextAction: 'Regenerate the review gate and closeout draft.',
  };
  const recommendedNextSurfaceSectionPreview = Array.isArray(closeout.recommendedNextSurfaceSectionPreview)
    ? closeout.recommendedNextSurfaceSectionPreview
    : [];
  const topBlockedSections = Array.isArray(closeout.topBlockedSections) ? closeout.topBlockedSections : [];
  const topBlockedFrames = Array.isArray(frameProgress.frames)
    ? frameProgress.frames
        .filter((frame) => Number(frame.totalPending) > 0)
        .slice(0, 3)
        .map((frame) => `${frame.frame} (${frame.totalPending})`)
    : [];
  const topBlockedSurfaces = Array.isArray(surfaceQueue.surfaces)
    ? surfaceQueue.surfaces
        .filter((surface) => Number(surface.totalPending) > 0)
        .slice(0, 3)
        .map((surface) => `${surface.surface} (${surface.totalPending})`)
    : [];

  const statusSummary = gate.readyToUnblock
    ? 'SUN-10 is ready to unblock implementation.'
    : 'SUN-10 is still blocked pending manual review completion.';

  const sun10Comment = gate.readyToUnblock
    ? `Compare Entry manual review result\n\nStatus: ${gate.gateState}\nreadyToUnblock: ${gate.readyToUnblock}\nrecommendedState: ${gate.recommendedState ?? 'unknown'}\nBuild completion: ${gate.build?.checked ?? 0}/${gate.build?.total ?? 0}\nReview completion: ${gate.review?.checked ?? 0}/${gate.review?.total ?? 0}\nOutcome: ${gate.decision?.outcome ?? 'unknown'}\nUnblocks: ${gate.decision?.unblocks ?? 'unknown'}\nConfidence: ${gate.decision?.confidence ?? 'unknown'}\n\nRequired revisions:\n${formatBulletList(revisions, 'none recorded')}\n\nFollow-up:\n${formatBulletList(followUp, 'none recorded')}\n\nHandoff notes:\n${formatBulletList(handoffNotes, 'none recorded')}\n\nNext:\n- unblock SUN-11\n- unblock SUN-12\n- keep SUN-13 in validation wait until implementation lands`
    : `Compare Entry manual review result\n\nStatus: ${gate.gateState}\nreadyToUnblock: ${gate.readyToUnblock}\nrecommendedState: ${gate.recommendedState ?? 'unknown'}\nBuild completion: ${gate.build?.checked ?? 0}/${gate.build?.total ?? 0}\nReview completion: ${gate.review?.checked ?? 0}/${gate.review?.total ?? 0}\nBlocked surfaces: ${surfaceStatus.blockedSurfaceCount ?? 0}\nReady surfaces: ${surfaceStatus.readySurfaceCount ?? 0}\nRecommended next surface: ${surfaceStatus.recommendedNextSurface ?? 'none'}\nRecommended next frame: ${closeout.recommendedNextFrame ?? 'none'}\nRecommended next section: ${closeout.recommendedNextSection ?? 'none'}\nRecommended surface frame count: ${closeout.recommendedNextSurfaceFrameCount ?? 0}\nRecommended surface section count: ${closeout.recommendedNextSurfaceSectionCount ?? 0}\nRecommended surface checklist path: ${closeout.recommendedNextSurfaceChecklistPath ?? 'none'}\nRecommended surface checklist first frame: ${closeout.recommendedNextSurfaceChecklistFirstFrame ?? 'none'}\nRecommended surface checklist first section: ${closeout.recommendedNextSurfaceChecklistFirstSection ?? 'none'}\nRecommended next section action card path: ${closeout.recommendedNextSectionActionCardPath ?? 'none'}\nRecommended next section action first item: ${closeout.recommendedNextSectionActionFirstItem ?? 'none'}\nOutcome: ${gate.decision?.outcome ?? 'unselected'}\nUnblocks: ${gate.decision?.unblocks ?? 'unselected'}\nConfidence: ${gate.decision?.confidence ?? 'unselected'}\n\nMissing:\n${formatBulletList(missing, 'none')}\n\nTop blocked surfaces:\n${formatBulletList(topBlockedSurfaces, 'none')}\n\nRecommended surface section preview:\n${formatBulletList(recommendedNextSurfaceSectionPreview, 'none')}\n\nTop blocked sections:\n${formatBulletList(topBlockedSections, 'none')}\n\nTop blocked frames:\n${formatBulletList(topBlockedFrames, 'none')}\n\nNext:\n${formatBulletList(nextActions, 'rerun finalize after updates')}`;

  const sun11Note = gate.readyToUnblock
    ? `SUN-10 approved. Implementation can start on the approved Compare Entry landing nodes. Follow-up items remain limited to:\n${formatBulletList(followUp, 'none recorded')}`
    : `SUN-10 is still blocked. Do not start SUN-11 yet.\nBlocking items:\n${formatBulletList(missing, 'none')}\nBlocked surfaces: ${surfaceStatus.blockedSurfaceCount ?? 0}\nReady surfaces: ${surfaceStatus.readySurfaceCount ?? 0}\nRecommended next surface: ${surfaceStatus.recommendedNextSurface ?? 'none'}\nRecommended surface frame count: ${closeout.recommendedNextSurfaceFrameCount ?? 0}\nRecommended surface section count: ${closeout.recommendedNextSurfaceSectionCount ?? 0}\nRecommended surface checklist path: ${closeout.recommendedNextSurfaceChecklistPath ?? 'none'}\nRecommended surface checklist first frame: ${closeout.recommendedNextSurfaceChecklistFirstFrame ?? 'none'}\nRecommended surface checklist first section: ${closeout.recommendedNextSurfaceChecklistFirstSection ?? 'none'}\nRecommended next section action card path: ${closeout.recommendedNextSectionActionCardPath ?? 'none'}\nRecommended next section action first item: ${closeout.recommendedNextSectionActionFirstItem ?? 'none'}\nTop blocked surfaces:\n${formatBulletList(topBlockedSurfaces, 'none')}\nRecommended surface section preview:\n${formatBulletList(recommendedNextSurfaceSectionPreview, 'none')}\nTop blocked sections:\n${formatBulletList(topBlockedSections, 'none')}\nTop blocked frames:\n${formatBulletList(topBlockedFrames, 'none')}`;

  const sun12Note = gate.readyToUnblock
    ? `SUN-10 approved. Implementation can start on the approved search hierarchy nodes. Handoff notes:\n${formatBulletList(handoffNotes, 'none recorded')}`
    : `SUN-10 is still blocked. Do not start SUN-12 yet.\nBlocking items:\n${formatBulletList(missing, 'none')}\nBlocked surfaces: ${surfaceStatus.blockedSurfaceCount ?? 0}\nReady surfaces: ${surfaceStatus.readySurfaceCount ?? 0}\nRecommended next surface: ${surfaceStatus.recommendedNextSurface ?? 'none'}\nRecommended surface frame count: ${closeout.recommendedNextSurfaceFrameCount ?? 0}\nRecommended surface section count: ${closeout.recommendedNextSurfaceSectionCount ?? 0}\nRecommended surface checklist path: ${closeout.recommendedNextSurfaceChecklistPath ?? 'none'}\nRecommended surface checklist first frame: ${closeout.recommendedNextSurfaceChecklistFirstFrame ?? 'none'}\nRecommended surface checklist first section: ${closeout.recommendedNextSurfaceChecklistFirstSection ?? 'none'}\nRecommended next section action card path: ${closeout.recommendedNextSectionActionCardPath ?? 'none'}\nRecommended next section action first item: ${closeout.recommendedNextSectionActionFirstItem ?? 'none'}\nTop blocked surfaces:\n${formatBulletList(topBlockedSurfaces, 'none')}\nRecommended surface section preview:\n${formatBulletList(recommendedNextSurfaceSectionPreview, 'none')}\nTop blocked sections:\n${formatBulletList(topBlockedSections, 'none')}\nTop blocked frames:\n${formatBulletList(topBlockedFrames, 'none')}`;

  const payload = {
    generatedAt: new Date().toISOString(),
    gateState: gate.gateState ?? 'unknown',
    readyToUnblock: Boolean(gate.readyToUnblock),
    recommendedState: gate.recommendedState ?? null,
    blockedSurfaceCount: Number(surfaceStatus.blockedSurfaceCount ?? 0),
    readySurfaceCount: Number(surfaceStatus.readySurfaceCount ?? 0),
    recommendedNextSurface: surfaceStatus.recommendedNextSurface ?? null,
    recommendedNextFrame: closeout.recommendedNextFrame ?? null,
    recommendedNextSection: closeout.recommendedNextSection ?? null,
    recommendedNextSurfaceFrameCount: Number(closeout.recommendedNextSurfaceFrameCount ?? 0),
    recommendedNextSurfaceSectionCount: Number(closeout.recommendedNextSurfaceSectionCount ?? 0),
    recommendedNextSurfaceChecklistPath: closeout.recommendedNextSurfaceChecklistPath ?? null,
    recommendedNextSurfaceChecklistFirstFrame: closeout.recommendedNextSurfaceChecklistFirstFrame ?? null,
    recommendedNextSurfaceChecklistFirstSection: closeout.recommendedNextSurfaceChecklistFirstSection ?? null,
    recommendedNextSectionActionCardPath: closeout.recommendedNextSectionActionCardPath ?? null,
    recommendedNextSectionActionFirstItem: closeout.recommendedNextSectionActionFirstItem ?? null,
    figmaRetryPacket,
    activeBlocker,
    recommendedNextSurfaceSectionPreview,
    topBlockedSurfaces,
    topBlockedSections,
    topBlockedFrames,
    sun10Comment,
    sun11Note,
    sun12Note,
  };

  const markdown = `# Compare Entry Linear Update Draft

## Status Summary

- generatedAt: \`${payload.generatedAt}\`
- gateState: \`${payload.gateState}\`
- readyToUnblock: \`${payload.readyToUnblock ? 'true' : 'false'}\`
- recommendedState: \`${payload.recommendedState ?? 'unknown'}\`

${statusSummary}

## Figma Retry Packet

- status: \`${payload.figmaRetryPacket?.status ?? 'none'}\`
- retryReady: \`${payload.figmaRetryPacket?.retryReady ? 'true' : 'false'}\`
- target: \`${payload.figmaRetryPacket?.target ? `${payload.figmaRetryPacket.target.surface ?? 'none'} -> ${payload.figmaRetryPacket.target.frame ?? 'none'} -> ${payload.figmaRetryPacket.target.section ?? 'none'}` : 'none'}\`
- markdown: \`${payload.figmaRetryPacket?.markdownPath ?? 'none'}\`
- json: \`${payload.figmaRetryPacket?.jsonPath ?? 'none'}\`
- attemptHistoryCount: \`${payload.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts ?? 0}\`
- attemptHistoryMarkdown: \`${payload.figmaRetryPacket?.mcpAttemptHistory?.markdownPath ?? 'none'}\`
- latestAttempt: \`${payload.figmaRetryPacket?.mcpAttemptHistory?.latestOperation ?? 'none'} via ${payload.figmaRetryPacket?.mcpAttemptHistory?.latestTool ?? 'none'}\`

## Active Blocker

- kind: \`${payload.activeBlocker.kind}\`
- summary: \`${payload.activeBlocker.summary}\`
- target: \`${payload.activeBlocker.target ?? 'none'}\`
- latestStatus: \`${payload.activeBlocker.latestStatus ?? 'none'}\`
- latestOperation: \`${payload.activeBlocker.latestOperation ?? 'none'}\`
- latestTool: \`${payload.activeBlocker.latestTool ?? 'none'}\`
- evidencePath: \`${payload.activeBlocker.evidencePath ?? 'none'}\`
- nextAction: \`${payload.activeBlocker.nextAction}\`

## SUN-10 Comment Draft

\`\`\`text
${sun10Comment}
\`\`\`

## SUN-11 Blocker Update Draft

\`\`\`text
${sun11Note}
\`\`\`

## SUN-12 Blocker Update Draft

\`\`\`text
${sun12Note}
\`\`\`
`;

  const text = `SUN-10 COMMENT\n${sun10Comment}\n\n---\nSUN-11 NOTE\n${sun11Note}\n\n---\nSUN-12 NOTE\n${sun12Note}\n\n---\nFIGMA RETRY PACKET\nstatus: ${payload.figmaRetryPacket?.status ?? 'none'}\nretryReady: ${payload.figmaRetryPacket?.retryReady ? 'true' : 'false'}\nmarkdown: ${payload.figmaRetryPacket?.markdownPath ?? 'none'}\njson: ${payload.figmaRetryPacket?.jsonPath ?? 'none'}\nattemptHistoryCount: ${payload.figmaRetryPacket?.mcpAttemptHistory?.totalAttempts ?? 0}\nattemptHistoryMarkdown: ${payload.figmaRetryPacket?.mcpAttemptHistory?.markdownPath ?? 'none'}\nlatestAttempt: ${payload.figmaRetryPacket?.mcpAttemptHistory?.latestOperation ?? 'none'} via ${payload.figmaRetryPacket?.mcpAttemptHistory?.latestTool ?? 'none'}\n\n---\nACTIVE BLOCKER\nkind: ${payload.activeBlocker.kind}\ntarget: ${payload.activeBlocker.target ?? 'none'}\nlatestStatus: ${payload.activeBlocker.latestStatus ?? 'none'}\nlatestOperation: ${payload.activeBlocker.latestOperation ?? 'none'}\nevidencePath: ${payload.activeBlocker.evidencePath ?? 'none'}\nnextAction: ${payload.activeBlocker.nextAction}\n`;

  await Promise.all([
    writeFile(outputPaths.markdown, markdown, 'utf8'),
    writeFile(outputPaths.text, text, 'utf8'),
    writeFile(outputPaths.json, JSON.stringify(payload, null, 2) + '\n', 'utf8'),
  ]);

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        readyToUnblock: payload.readyToUnblock,
        markdownPath: outputPaths.markdown,
        textPath: outputPaths.text,
        jsonPath: outputPaths.json,
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
