import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const evidencePath = path.join(artifactDir, 'compare-entry-manual-node-evidence.json');
const worksheetPath = path.join(artifactDir, 'compare-entry-manual-build-worksheet.md');

const targetFrameHeading = '### CompareEntry/Mobile/Brand-Musinsa';
const nextFrameHeading = '### CompareEntry/Mobile/Category-Sneakers';
const targetCheckbox = '- [ ] `TopNav/Context`';
const checkedTargetCheckbox = '- [x] `TopNav/Context`';

function assertReady(evidence) {
  const failures = [];
  if (evidence?.readyForWorksheetCheck !== true) failures.push('readyForWorksheetCheck is not true');
  if (!evidence?.observed?.frameId) failures.push('frameId is missing');
  if (!evidence?.observed?.sectionId) failures.push('sectionId is missing');
  if (evidence?.observed?.frameNameMatches !== true) failures.push('frameNameMatches is not true');
  if (evidence?.observed?.sectionNameMatches !== true) failures.push('sectionNameMatches is not true');
  if (evidence?.observed?.visuallyMatchesPreview !== true) failures.push('visuallyMatchesPreview is not true');
  if (failures.length) {
    const error = new Error(`Manual node evidence is not ready: ${failures.join(', ')}`);
    error.failures = failures;
    throw error;
  }
}

function replaceWithinFrame(markdown, evidence) {
  const frameStart = markdown.indexOf(targetFrameHeading);
  if (frameStart === -1) throw new Error(`Target frame heading not found: ${targetFrameHeading}`);

  const frameEnd = markdown.indexOf(nextFrameHeading, frameStart);
  if (frameEnd === -1) throw new Error(`Next frame heading not found: ${nextFrameHeading}`);

  const before = markdown.slice(0, frameStart);
  const frameBlock = markdown.slice(frameStart, frameEnd);
  const after = markdown.slice(frameEnd);

  if (frameBlock.includes(checkedTargetCheckbox)) {
    return { markdown, changed: false, reason: 'target checkbox already checked' };
  }
  if (!frameBlock.includes(targetCheckbox)) {
    throw new Error(`Target checkbox not found inside ${targetFrameHeading}`);
  }

  const checkedBlock = frameBlock.replace(targetCheckbox, checkedTargetCheckbox);
  const evidenceNote = [
    `- first fold: Figma file \`${evidence.fileKey}\` page \`SUN-10 Compare Entry\` now includes \`CompareEntry/Mobile/Brand-Musinsa\` with \`TopNav/Context\` section (\`frameId ${evidence.observed.frameId}\`, \`sectionId ${evidence.observed.sectionId}\`). The section was verified through manual node evidence before checking this worksheet item.`,
    '- copy adjustments:',
    '- mobile/desktop adaptation:',
    '- unresolved question: Remaining mobile Brand sections are still pending; do not unblock SUN-11/SUN-12 from this partial slice.',
  ].join('\n');

  const updatedBlock = checkedBlock.replace(
    /- first fold:\n- copy adjustments:\n- mobile\/desktop adaptation:\n- unresolved question:/,
    evidenceNote,
  );

  return {
    markdown: `${before}${updatedBlock}${after}`,
    changed: true,
    reason: 'target checkbox checked from ready manual node evidence',
  };
}

async function main() {
  const evidence = JSON.parse(await readFile(evidencePath, 'utf8'));
  assertReady(evidence);

  const worksheet = await readFile(worksheetPath, 'utf8');
  const result = replaceWithinFrame(worksheet, evidence);

  if (result.changed) {
    await writeFile(worksheetPath, result.markdown, 'utf8');
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        changed: result.changed,
        reason: result.reason,
        worksheetPath,
        frameId: evidence.observed.frameId,
        sectionId: evidence.observed.sectionId,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
