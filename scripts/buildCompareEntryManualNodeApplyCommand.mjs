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
  actionCard: path.join(artifactDir, 'compare-entry-review-next-section-action-card.json'),
  manualNodeEvidence: path.join(artifactDir, 'compare-entry-manual-node-evidence.json'),
  manualUiSlicePacket: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.json'),
  gate: path.join(artifactDir, 'compare-entry-review-gate.json'),
};

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-manual-node-apply-command.md'),
  json: path.join(artifactDir, 'compare-entry-manual-node-apply-command.json'),
};

async function readJson(filePath, fallback = null) {
  try {
    return JSON.parse(await readFile(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function formatList(items, emptyState = 'none') {
  if (!items.length) return `- ${emptyState}`;
  return items.map((item) => `- ${item}`).join('\n');
}

function shellSingleQuote(value) {
  return `'${String(value).replaceAll("'", "'\"'\"'")}'`;
}

async function main() {
  await mkdir(artifactDir, { recursive: true });

  const [actionCard, evidence, slicePacket, gate] = await Promise.all([
    readJson(inputPaths.actionCard, {}),
    readJson(inputPaths.manualNodeEvidence, {}),
    readJson(inputPaths.manualUiSlicePacket, {}),
    readJson(inputPaths.gate, {}),
  ]);

  const target = {
    surface: slicePacket?.target?.surface ?? actionCard?.recommendedSurface?.surface ?? 'Brand-Musinsa',
    route: slicePacket?.route ?? actionCard?.recommendedSurface?.route ?? '/brand/musinsa',
    frame: slicePacket?.target?.frame ?? actionCard?.recommendedFrame ?? 'CompareEntry/Mobile/Brand-Musinsa',
    section: slicePacket?.target?.section ?? actionCard?.recommendedSection ?? 'TopNav/Context',
  };
  const targetLabel = `${target.surface} -> ${target.frame} -> ${target.section}`;
  const fileKey = slicePacket?.figmaFileKey ?? evidence?.fileKey ?? 'Oj35jzmgbwnxzpTTqTcxLi';
  const frameUrlPlaceholder = `https://www.figma.com/design/${fileKey}/LooPyck?node-id=FRAME-NODE-ID`;
  const sectionUrlPlaceholder = `https://www.figma.com/design/${fileKey}/LooPyck?node-id=SECTION-NODE-ID`;
  const command = [
    'npm run ntl:compare-entry-manual-node-apply -- \\',
    `  ${shellSingleQuote(frameUrlPlaceholder)} \\`,
    `  ${shellSingleQuote(sectionUrlPlaceholder)} \\`,
    '  CONTRACT_VERIFIED',
  ].join('\n');

  const payload = {
    generatedAt: new Date().toISOString(),
    status: evidence?.readyForWorksheetCheck
      ? 'ready-evidence-present'
      : gate?.activeBlocker?.kind === 'figma-mcp-rate-limit'
        ? 'waiting-for-manual-figma-node-urls'
        : 'review-current-gate',
    target,
    targetLabel,
    fileKey,
    currentEvidence: {
      status: evidence?.status ?? 'unknown',
      readyForWorksheetCheck: Boolean(evidence?.readyForWorksheetCheck),
      frameId: evidence?.observed?.frameId || null,
      sectionId: evidence?.observed?.sectionId || null,
      frameUrl: evidence?.observed?.frameUrl || null,
      sectionUrl: evidence?.observed?.sectionUrl || null,
    },
    activeBlocker: gate?.activeBlocker ?? null,
    command,
    requiredBeforeRunning: [
      `Figma page is named ${slicePacket?.pageName ?? 'SUN-10 Compare Entry'}.`,
      `Frame name exactly matches ${target.frame}.`,
      `Section name exactly matches ${target.section}.`,
      'Visual slice matches compare-entry-manual-ui-slice-packet.md or the approved preview.',
      'You copied the frame URL and section URL from the real manually created Figma nodes, not from an unverified raw capture.',
    ],
    links: {
      actionCardHtml: path.join(artifactDir, 'compare-entry-review-next-section-action-card.html'),
      manualUiSlicePacket: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.md'),
      manualNodeEvidence: path.join(artifactDir, 'compare-entry-manual-node-evidence.md'),
      fallbackPreview: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html'),
      gate: path.join(artifactDir, 'compare-entry-review-gate.md'),
      buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
    },
  };

  await writeFile(outputPaths.json, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const markdown = `# Compare Entry Manual Node Apply Command

## Summary

- generatedAt: \`${payload.generatedAt}\`
- status: \`${payload.status}\`
- target: \`${payload.targetLabel}\`
- route: \`${payload.target.route}\`
- fileKey: \`${payload.fileKey}\`
- currentEvidenceStatus: \`${payload.currentEvidence.status}\`
- currentReadyForWorksheetCheck: \`${payload.currentEvidence.readyForWorksheetCheck}\`
- activeBlocker: \`${payload.activeBlocker?.kind ?? 'none'}\`

## Required Before Running

${formatList(payload.requiredBeforeRunning)}

## One Command

\`\`\`bash
${payload.command}
\`\`\`

Replace \`FRAME-NODE-ID\` and \`SECTION-NODE-ID\` with the copied Figma node IDs from the frame and section URLs. Keep \`CONTRACT_VERIFIED\` only after the target names and visual match are manually verified.

## Current Evidence

- frameId: \`${payload.currentEvidence.frameId ?? 'none'}\`
- sectionId: \`${payload.currentEvidence.sectionId ?? 'none'}\`
- frameUrl: \`${payload.currentEvidence.frameUrl ?? 'none'}\`
- sectionUrl: \`${payload.currentEvidence.sectionUrl ?? 'none'}\`

## Open Order

1. \`${payload.links.actionCardHtml}\`
2. \`${payload.links.manualUiSlicePacket}\`
3. \`${payload.links.fallbackPreview}\`
4. \`${payload.links.manualNodeEvidence}\`
5. \`${payload.links.gate}\`
6. \`${payload.links.buildWorksheet}\`
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');

  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        status: payload.status,
        target: payload.targetLabel,
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
