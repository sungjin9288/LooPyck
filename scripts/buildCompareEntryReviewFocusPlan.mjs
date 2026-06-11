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
  missingDetailJson: path.join(artifactDir, 'compare-entry-review-missing-detail.json'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-focus-plan.md'),
  json: path.join(artifactDir, 'compare-entry-review-focus-plan.json'),
};

function formatList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function toAction(label, priority, kind) {
  return { label, priority, kind };
}

function pushFrameActions(target, frames, kind, priority, limit = 6) {
  let count = 0;
  for (const frame of frames) {
    for (const pending of frame.pending ?? []) {
      if (count >= limit) return;
      target.push(toAction(`${frame.frame}: ${pending}`, priority, kind));
      count += 1;
    }
  }
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [gateRaw, missingDetailRaw] = await Promise.all([
    readFile(inputPaths.gateJson, 'utf8'),
    readFile(inputPaths.missingDetailJson, 'utf8'),
  ]);

  const gate = JSON.parse(gateRaw);
  const missingDetail = JSON.parse(missingDetailRaw);

  const actions = [];
  const activeBlocker = gate.activeBlocker ?? {
    kind: 'unknown',
    summary: 'Gate did not provide an active blocker summary.',
    target: null,
    latestStatus: null,
    latestOperation: null,
    evidencePath: null,
    nextAction: 'Run `npm run ntl:compare-entry-review-gate` after refreshing review artifacts.',
  };

  if (activeBlocker.kind !== 'none') {
    const target = activeBlocker.target ? ` (${activeBlocker.target})` : '';
    actions.push(toAction(`Active Blocker: ${activeBlocker.kind}${target}`, 0, 'active-blocker'));
  }

  for (const item of missingDetail.decision?.pending ?? []) {
    actions.push(toAction(`Decision Log: ${item}`, 1, 'decision'));
  }
  for (const item of missingDetail.build?.crossCutPending ?? []) {
    actions.push(toAction(`Build Cross-Cut: ${item}`, 2, 'build-cross-cut'));
  }
  pushFrameActions(actions, missingDetail.build?.frames ?? [], 'build-frame', 3);
  for (const item of missingDetail.review?.crossCutPending ?? []) {
    actions.push(toAction(`Review Cross-Cut: ${item}`, 4, 'review-cross-cut'));
  }
  pushFrameActions(actions, missingDetail.review?.frames ?? [], 'review-frame', 5);

  actions.sort((a, b) => a.priority - b.priority || a.label.localeCompare(b.label));

  const totalActions = actions.length;
  const topActions = actions.slice(0, 12);
  const summary = {
    generatedAt: new Date().toISOString(),
    gateState: gate.gateState ?? 'unknown',
    readyToUnblock: Boolean(gate.readyToUnblock),
    activeBlocker,
    totalPending: missingDetail.totalPending ?? 0,
    totalActions,
    topActions,
    recommendedSequence: [
      activeBlocker.kind === 'none'
        ? 'No active blocker remains; proceed to SUN-11 / SUN-12 implementation handoff.'
        : `Resolve active blocker first: ${activeBlocker.nextAction}`,
      'Resolve decision log fields only when review intent is clear.',
      'Finish build cross-cut and frame shell gaps before review polish.',
      'Complete review cross-cut and frame checklist after visual build is done.',
      'Re-run `npm run ntl:compare-entry-review-finalize` and then `npm run ntl:compare-entry-review-gate:strict`.',
    ],
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Focus Plan

## Summary

- generatedAt: \`${summary.generatedAt}\`
- gateState: \`${summary.gateState}\`
- readyToUnblock: \`${summary.readyToUnblock ? 'true' : 'false'}\`
- activeBlocker: \`${summary.activeBlocker.kind}\`
- activeBlockerTarget: \`${summary.activeBlocker.target ?? 'none'}\`
- activeBlockerLatestStatus: \`${summary.activeBlocker.latestStatus ?? 'none'}\`
- activeBlockerLatestOperation: \`${summary.activeBlocker.latestOperation ?? 'none'}\`
- activeBlockerEvidencePath: \`${summary.activeBlocker.evidencePath ?? 'none'}\`
- totalPending: \`${summary.totalPending}\`
- totalActions: \`${summary.totalActions}\`

## Active Blocker

- summary: ${summary.activeBlocker.summary}
- nextAction: ${summary.activeBlocker.nextAction}

## Top Actions

${formatList(summary.topActions.map((item) => `[P${item.priority}] ${item.label}`), 'none')}

## Recommended Sequence

${formatList(summary.recommendedSequence, 'none')}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        totalActions,
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
