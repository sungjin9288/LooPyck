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
  markdown: path.join(artifactDir, 'compare-entry-figma-capture-reference.md'),
  json: path.join(artifactDir, 'compare-entry-figma-capture-reference.json'),
};

async function readExistingReference() {
  try {
    return JSON.parse(await readFile(outputPaths.json, 'utf8'));
  } catch {
    return null;
  }
}

function envValue(name, fallback = '') {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : fallback;
}

const existingReference = await readExistingReference();
const captureNodeId = envValue(
  'COMPARE_ENTRY_FIGMA_CAPTURE_NODE_ID',
  existingReference?.captureNodeId || '9:2',
);
const captureUrl =
  envValue('COMPARE_ENTRY_FIGMA_CAPTURE_URL') ||
  existingReference?.captureUrl ||
  `https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi?node-id=${captureNodeId.replace(':', '-')}`;
const metadataStatus = envValue(
  'COMPARE_ENTRY_FIGMA_CAPTURE_METADATA_STATUS',
  existingReference?.metadataObservation?.status || 'verified',
);
const contractNameMatch =
  process.env.COMPARE_ENTRY_FIGMA_CAPTURE_CONTRACT_MATCH === 'true'
    ? true
    : process.env.COMPARE_ENTRY_FIGMA_CAPTURE_CONTRACT_MATCH === 'unknown'
      ? 'unknown'
      : existingReference?.metadataObservation?.contractNameMatch ?? false;

const summary = {
  generatedAt: new Date().toISOString(),
  status: 'reference-captured',
  fileKey: 'Oj35jzmgbwnxzpTTqTcxLi',
  captureNodeId,
  captureUrl,
  tool: 'mcp__figma__.generate_figma_design',
  source: {
    previewHtml: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html'),
    previewJson: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.json'),
    localUrl: 'http://127.0.0.1:4173/compare-entry-mobile-brand-topnav-preview.html',
  },
  targetContract: {
    page: 'SUN-10 Compare Entry',
    frame: 'CompareEntry/Mobile/Brand-Musinsa',
    section: 'TopNav/Context',
  },
  metadataObservation: {
    status: metadataStatus,
    capturedRootName:
      envValue(
        'COMPARE_ENTRY_FIGMA_CAPTURE_ROOT_NAME',
        existingReference?.metadataObservation?.capturedRootName ||
          'Compare Entry Mobile Brand TopNav Preview',
      ),
    capturedMobileFrameName:
      envValue(
        'COMPARE_ENTRY_FIGMA_CAPTURE_FRAME_NAME',
        existingReference?.metadataObservation?.capturedMobileFrameName || '393px mobile frame preview',
      ),
    capturedTopNavName: envValue(
      'COMPARE_ENTRY_FIGMA_CAPTURE_SECTION_NAME',
      existingReference?.metadataObservation?.capturedTopNavName || 'Section',
    ),
    contractNameMatch,
  },
  worksheetPolicy:
    'Do not check the manual build worksheet from this raw capture. Use it as visual reference until the Figma frame/section are renamed or rebuilt to match the target contract.',
  nextSteps: [
    'Use the captured node as pixel reference for manual Figma UI build.',
    'Create or rename the real frame to CompareEntry/Mobile/Brand-Musinsa.',
    'Create or rename the real section to TopNav/Context.',
    'Only after the target frame and section names match, record their node IDs and check the matching worksheet item.',
    'Run npm run ntl:compare-entry-review-finalize and npm run ntl:compare-entry-review-ready-check.',
  ],
};

function formatList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  await writeFile(outputPaths.json, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

  const markdown = `# Compare Entry Figma Capture Reference

## Summary

- generatedAt: \`${summary.generatedAt}\`
- status: \`${summary.status}\`
- fileKey: \`${summary.fileKey}\`
- captureNodeId: \`${summary.captureNodeId}\`
- captureUrl: ${summary.captureUrl}
- tool: \`${summary.tool}\`

## Source

- preview html: \`${summary.source.previewHtml}\`
- preview json: \`${summary.source.previewJson}\`
- localUrl: \`${summary.source.localUrl}\`

## Target Contract

- page: \`${summary.targetContract.page}\`
- frame: \`${summary.targetContract.frame}\`
- section: \`${summary.targetContract.section}\`

## Metadata Observation

- capturedRootName: \`${summary.metadataObservation.capturedRootName}\`
- capturedMobileFrameName: \`${summary.metadataObservation.capturedMobileFrameName}\`
- capturedTopNavName: \`${summary.metadataObservation.capturedTopNavName}\`
- metadataStatus: \`${summary.metadataObservation.status}\`
- contractNameMatch: \`${summary.metadataObservation.contractNameMatch}\`

## Worksheet Policy

${summary.worksheetPolicy}

## Next Steps

${formatList(summary.nextSteps)}
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        status: summary.status,
        captureNodeId: summary.captureNodeId,
        contractNameMatch: summary.metadataObservation.contractNameMatch,
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
