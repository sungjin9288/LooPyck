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
  buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
  reviewWorksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
  decisionLog: path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-review-missing-detail.md'),
  json: path.join(artifactDir, 'compare-entry-review-missing-detail.json'),
};

function cleanFieldValue(value) {
  return value.replaceAll('`', '').replaceAll('*', '').trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSection(markdown, title) {
  const pattern = new RegExp(`## ${escapeRegExp(title)}\\n\\n([\\s\\S]*?)(?=\\n## |$)`);
  const match = markdown.match(pattern);
  return match ? match[1].trim() : '';
}

function extractUncheckedCheckboxes(markdown) {
  return [...markdown.matchAll(/^- \[ \] (.+)$/gm)].map((match) => cleanFieldValue(match[1]));
}

function parseFramePending(markdown) {
  const lines = markdown.split('\n');
  const frames = [];
  let currentFrame = null;
  let currentLines = [];

  const flush = () => {
    if (!currentFrame) return;
    const pending = extractUncheckedCheckboxes(currentLines.join('\n'));
    if (pending.length > 0) {
      frames.push({
        frame: currentFrame,
        pending,
      });
    }
    currentFrame = null;
    currentLines = [];
  };

  for (const line of lines) {
    if (line.startsWith('### ')) {
      flush();
      currentFrame = cleanFieldValue(line.slice(4));
      continue;
    }

    if (line.startsWith('## ')) {
      flush();
      continue;
    }

    if (currentFrame) {
      currentLines.push(line);
    }
  }

  flush();
  return frames;
}

function extractDecisionField(markdown, label) {
  const pattern = new RegExp(`^- ${escapeRegExp(label)}:\\s*(.+)$`, 'm');
  const match = markdown.match(pattern);
  if (!match) return null;
  const cleaned = cleanFieldValue(match[1]);
  if (!cleaned || cleaned.includes('|')) return null;
  return cleaned;
}

function formatList(items, emptyState) {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [buildWorksheet, reviewWorksheet, decisionLog] = await Promise.all([
    readFile(inputPaths.buildWorksheet, 'utf8'),
    readFile(inputPaths.reviewWorksheet, 'utf8'),
    readFile(inputPaths.decisionLog, 'utf8'),
  ]);

  const buildCrossCutPending = extractUncheckedCheckboxes(extractSection(buildWorksheet, 'Cross-Cut Build Checks'));
  const reviewCrossCutPending = extractUncheckedCheckboxes(extractSection(reviewWorksheet, 'Cross-Cut Review Questions'));
  const buildFrames = parseFramePending(buildWorksheet);
  const reviewFrames = parseFramePending(reviewWorksheet);
  const decisionPending = [
    ['Outcome', extractDecisionField(decisionLog, 'Outcome')],
    ['Unblock Decision', extractDecisionField(decisionLog, 'Does `SUN-10` unblock `SUN-11` / `SUN-12`?')],
    ['Reviewer Confidence', extractDecisionField(decisionLog, 'Reviewer confidence')],
  ]
    .filter(([, value]) => !value)
    .map(([label]) => label);

  const totalPending =
    buildCrossCutPending.length +
    reviewCrossCutPending.length +
    decisionPending.length +
    buildFrames.reduce((sum, frame) => sum + frame.pending.length, 0) +
    reviewFrames.reduce((sum, frame) => sum + frame.pending.length, 0);

  const nextFocus = [
    ...buildFrames.flatMap((frame) => frame.pending.map((item) => `${frame.frame}: ${item}`)),
    ...reviewFrames.flatMap((frame) => frame.pending.map((item) => `${frame.frame}: ${item}`)),
    ...decisionPending.map((item) => `Decision Log: ${item}`),
  ].slice(0, 10);

  const summary = {
    generatedAt: new Date().toISOString(),
    totalPending,
    build: {
      crossCutPending: buildCrossCutPending,
      frames: buildFrames,
    },
    review: {
      crossCutPending: reviewCrossCutPending,
      frames: reviewFrames,
    },
    decision: {
      pending: decisionPending,
    },
    nextFocus,
    inputPaths,
  };

  await writeFile(outputPaths.json, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  const markdown = `# Compare Entry Review Missing Detail

## Summary

- generatedAt: \`${summary.generatedAt}\`
- totalPending: \`${summary.totalPending}\`

## Build Cross-Cut Pending

${formatList(summary.build.crossCutPending, 'none')}

## Build Frame Pending

${summary.build.frames.length
  ? summary.build.frames.map((frame) => `### ${frame.frame}\n\n${formatList(frame.pending, 'none')}`).join('\n\n')
  : '- none'}

## Review Cross-Cut Pending

${formatList(summary.review.crossCutPending, 'none')}

## Review Frame Pending

${summary.review.frames.length
  ? summary.review.frames.map((frame) => `### ${frame.frame}\n\n${formatList(frame.pending, 'none')}`).join('\n\n')
  : '- none'}

## Decision Pending

${formatList(summary.decision.pending, 'none')}

## Next Focus

${formatList(summary.nextFocus, 'none')}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
        totalPending,
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
