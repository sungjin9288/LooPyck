import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-manual-node-evidence.md'),
  json: path.join(artifactDir, 'compare-entry-manual-node-evidence.json'),
};

function envValue(name, fallback = '') {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

function envBool(name, fallback = null) {
  const value = process.env[name];
  if (value === 'true' || value === '1' || value === 'yes') return true;
  if (value === 'false' || value === '0' || value === 'no') return false;
  return fallback;
}

function parseFigmaNodeUrl(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  const directMatch = trimmed.match(/^\d+:\d+$/);
  if (directMatch) return { nodeId: trimmed, fileKey: '', isUrl: false };
  const urlMatch = trimmed.match(/[?&]node-id=(\d+)[-:](\d+)/);
  const fileMatch = trimmed.match(/figma\.com\/(?:design|file)\/([^/?#]+)/);
  if (urlMatch) {
    return {
      nodeId: `${urlMatch[1]}:${urlMatch[2]}`,
      fileKey: fileMatch?.[1] ?? '',
      isUrl: true,
    };
  }
  return { nodeId: '', fileKey: fileMatch?.[1] ?? '', isUrl: Boolean(fileMatch) };
}

function formatList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

async function readExistingEvidence() {
  try {
    return JSON.parse(await readFile(outputPaths.json, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  const existingEvidence = await readExistingEvidence();
  const existingObserved = existingEvidence?.observed ?? {};
  const frameUrl = envValue('COMPARE_ENTRY_MANUAL_NODE_FRAME_URL', existingObserved.frameUrl);
  const sectionUrl = envValue('COMPARE_ENTRY_MANUAL_NODE_SECTION_URL', existingObserved.sectionUrl);
  const parsedFrameUrl = parseFigmaNodeUrl(frameUrl);
  const parsedSectionUrl = parseFigmaNodeUrl(sectionUrl);
  const contractVerified = envBool('COMPARE_ENTRY_MANUAL_NODE_CONTRACT_VERIFIED', null);
  const expectedFileKey = 'Oj35jzmgbwnxzpTTqTcxLi';
  const urlFileKeyMatches = {
    frame:
      !parsedFrameUrl.isUrl ||
      !parsedFrameUrl.fileKey ||
      parsedFrameUrl.fileKey === expectedFileKey,
    section:
      !parsedSectionUrl.isUrl ||
      !parsedSectionUrl.fileKey ||
      parsedSectionUrl.fileKey === expectedFileKey,
  };
  const urlValidationFailures = [
    ...(urlFileKeyMatches.frame ? [] : [`frameUrl fileKey ${parsedFrameUrl.fileKey} does not match ${expectedFileKey}`]),
    ...(urlFileKeyMatches.section
      ? []
      : [`sectionUrl fileKey ${parsedSectionUrl.fileKey} does not match ${expectedFileKey}`]),
  ];

  const evidence = {
    generatedAt: new Date().toISOString(),
    status: 'manual-node-evidence-pending',
    fileKey: expectedFileKey,
    target: {
      surface: 'Brand-Musinsa',
      route: '/brand/musinsa',
      frame: 'CompareEntry/Mobile/Brand-Musinsa',
      section: 'TopNav/Context',
    },
    observed: {
      frameId: envValue(
        'COMPARE_ENTRY_MANUAL_NODE_FRAME_ID',
        parsedFrameUrl.nodeId || existingObserved.frameId,
      ),
      sectionId: envValue(
        'COMPARE_ENTRY_MANUAL_NODE_SECTION_ID',
        parsedSectionUrl.nodeId || existingObserved.sectionId,
      ),
      frameUrl,
      sectionUrl,
      frameUrlFileKey: parsedFrameUrl.fileKey || existingObserved.frameUrlFileKey || '',
      sectionUrlFileKey: parsedSectionUrl.fileKey || existingObserved.sectionUrlFileKey || '',
      urlFileKeyMatches,
      urlValidationFailures,
      captureReferenceNodeId: envValue(
        'COMPARE_ENTRY_MANUAL_NODE_CAPTURE_REFERENCE_ID',
        existingObserved.captureReferenceNodeId || '10:2',
      ),
      frameNameMatches: envBool(
        'COMPARE_ENTRY_MANUAL_NODE_FRAME_NAME_MATCHES',
        contractVerified ?? existingObserved.frameNameMatches ?? null,
      ),
      sectionNameMatches: envBool(
        'COMPARE_ENTRY_MANUAL_NODE_SECTION_NAME_MATCHES',
        contractVerified ?? existingObserved.sectionNameMatches ?? null,
      ),
      visuallyMatchesPreview: envBool(
        'COMPARE_ENTRY_MANUAL_NODE_VISUALLY_MATCHES_PREVIEW',
        contractVerified ?? existingObserved.visuallyMatchesPreview ?? null,
      ),
      source: envValue('COMPARE_ENTRY_MANUAL_NODE_SOURCE', existingObserved.source || 'manual-figma-ui-check'),
      notes: envValue(
        'COMPARE_ENTRY_MANUAL_NODE_NOTES',
        existingObserved.notes || 'No manual node evidence recorded yet.',
      ),
    },
    worksheetPolicy:
      'Only check CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context after frameId and sectionId are non-empty and both names match the target contract.',
    requiredBeforeWorksheetCheck: [
      'frameId is recorded.',
      'sectionId is recorded.',
      'copied Figma URLs, if provided, belong to file Oj35jzmgbwnxzpTTqTcxLi.',
      'frame name exactly matches CompareEntry/Mobile/Brand-Musinsa.',
      'section name exactly matches TopNav/Context.',
      'visual content matches compare-entry-manual-ui-slice-packet.md or the approved capture reference.',
    ],
  };

  const readyForWorksheetCheck = Boolean(
    evidence.observed.frameId &&
      evidence.observed.sectionId &&
      urlValidationFailures.length === 0 &&
      evidence.observed.frameNameMatches === true &&
      evidence.observed.sectionNameMatches === true &&
      evidence.observed.visuallyMatchesPreview === true,
  );

  evidence.readyForWorksheetCheck = readyForWorksheetCheck;
  evidence.status = readyForWorksheetCheck
    ? 'ready-for-single-worksheet-check'
    : 'manual-node-evidence-pending';
  evidence.nextSteps = readyForWorksheetCheck
    ? [
        'Check only CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context in compare-entry-manual-build-worksheet.md.',
        'Add the recorded frameId and sectionId to the Mobile Brand build notes.',
        'Run npm run ntl:compare-entry-review-finalize.',
        'Run npm run ntl:compare-entry-review-ready-check.',
      ]
    : [
        'Open the Figma file and inspect the captured or manually rebuilt node.',
        'Rename or rebuild the frame and section until names match the target contract.',
        'Rerun this command with COMPARE_ENTRY_MANUAL_NODE_FRAME_ID and COMPARE_ENTRY_MANUAL_NODE_SECTION_ID.',
        'Do not check the worksheet while this artifact is manual-node-evidence-pending.',
      ];

  await writeFile(outputPaths.json, `${JSON.stringify(evidence, null, 2)}\n`, 'utf8');

  const markdown = `# Compare Entry Manual Node Evidence

## Summary

- generatedAt: \`${evidence.generatedAt}\`
- status: \`${evidence.status}\`
- readyForWorksheetCheck: \`${evidence.readyForWorksheetCheck}\`
- fileKey: \`${evidence.fileKey}\`
- target: \`${evidence.target.surface} -> ${evidence.target.frame} -> ${evidence.target.section}\`
- route: \`${evidence.target.route}\`

## Observed Node

- frameId: \`${evidence.observed.frameId || 'none'}\`
- sectionId: \`${evidence.observed.sectionId || 'none'}\`
- frameUrl: \`${evidence.observed.frameUrl || 'none'}\`
- sectionUrl: \`${evidence.observed.sectionUrl || 'none'}\`
- frameUrlFileKey: \`${evidence.observed.frameUrlFileKey || 'none'}\`
- sectionUrlFileKey: \`${evidence.observed.sectionUrlFileKey || 'none'}\`
- urlValidationFailures: \`${evidence.observed.urlValidationFailures.length ? evidence.observed.urlValidationFailures.join('; ') : 'none'}\`
- captureReferenceNodeId: \`${evidence.observed.captureReferenceNodeId || 'none'}\`
- frameNameMatches: \`${evidence.observed.frameNameMatches}\`
- sectionNameMatches: \`${evidence.observed.sectionNameMatches}\`
- visuallyMatchesPreview: \`${evidence.observed.visuallyMatchesPreview}\`
- source: \`${evidence.observed.source}\`
- notes: ${evidence.observed.notes}

## Worksheet Policy

${evidence.worksheetPolicy}

## Required Before Worksheet Check

${formatList(evidence.requiredBeforeWorksheetCheck)}

## Next Steps

${formatList(evidence.nextSteps)}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        status: evidence.status,
        readyForWorksheetCheck: evidence.readyForWorksheetCheck,
      frameId: evidence.observed.frameId || null,
      sectionId: evidence.observed.sectionId || null,
      urlValidationFailures: evidence.observed.urlValidationFailures,
      markdownPath: outputPaths.markdown,
        jsonPath: outputPaths.json,
      },
      null,
      2,
    )}\n`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
