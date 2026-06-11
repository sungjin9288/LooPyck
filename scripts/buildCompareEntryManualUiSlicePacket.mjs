import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = process.env.COMPARE_ENTRY_ARTIFACT_DIR
  ? path.resolve(process.env.COMPARE_ENTRY_ARTIFACT_DIR)
  : path.join(rootDir, 'output', 'playwright');

const outputPaths = {
  markdown: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.md'),
  json: path.join(artifactDir, 'compare-entry-manual-ui-slice-packet.json'),
};

const links = {
  unblockPlan: path.join(artifactDir, 'compare-entry-figma-unblock-plan.md'),
  retryPacket: path.join(artifactDir, 'compare-entry-figma-retry-packet.md'),
  previewHtml: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.html'),
  previewJson: path.join(artifactDir, 'compare-entry-mobile-brand-topnav-preview.json'),
  actionCard: path.join(artifactDir, 'compare-entry-review-next-section-action-card.html'),
  buildWorksheet: path.join(artifactDir, 'compare-entry-manual-build-worksheet.md'),
  reviewWorksheet: path.join(artifactDir, 'compare-entry-design-review-worksheet.md'),
  decisionLog: path.join(artifactDir, 'compare-entry-design-review-decision-log.md'),
  gate: path.join(artifactDir, 'compare-entry-review-gate.md'),
  manualChecklist: path.join(rootDir, 'docs', 'COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md'),
  figmaTemplate: path.join(rootDir, 'scripts', 'figmaCompareEntryMobileBrandTopNavTemplate.mjs'),
};

const packet = {
  generatedAt: new Date().toISOString(),
  status: 'ready-for-manual-figma-ui-build',
  figmaFileKey: 'Oj35jzmgbwnxzpTTqTcxLi',
  pageName: 'SUN-10 Compare Entry',
  route: '/brand/musinsa',
  target: {
    surface: 'Brand-Musinsa',
    frame: 'CompareEntry/Mobile/Brand-Musinsa',
    section: 'TopNav/Context',
    slice: 'Brand-Musinsa -> CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context',
  },
  worksheetPolicy: 'Do not check the build worksheet until the real Figma frameId and sectionId are known.',
  frameSpec: {
    name: 'CompareEntry/Mobile/Brand-Musinsa',
    width: 393,
    height: 852,
    x: 'Align x with CompareEntry/Desktop/Brand-Musinsa if it exists; otherwise use a clear area around x=160.',
    y: 1120,
    fill: '#0D1117',
    layout: 'Vertical auto-layout, fixed width/height, padding 20/18/28/18, item spacing 0.',
  },
  sectionSpec: {
    name: 'TopNav/Context',
    width: 357,
    height: 128,
    fill: '#111827',
    stroke: '#243447',
    radius: 24,
    layout: 'Vertical auto-layout, fill horizontal, padding 16/18/16/18, item spacing 14.',
  },
  hierarchy: [
    {
      name: 'TopNav/Context/RouteIdentity',
      type: 'horizontal row',
      notes: 'Fill horizontal, center aligned, gap 11.',
    },
    {
      name: 'TopNav/Context/LogoMark',
      type: 'frame',
      notes: '38x38, radius 13, fill #F4FF3A, contains text L in #0D1117.',
    },
    {
      name: 'TopNav/Context/RouteCopy',
      type: 'vertical group',
      notes: 'Contains eyebrow and title.',
    },
    {
      name: 'TopNav/Context/Eyebrow',
      type: 'text',
      notes: 'Brand Compare Entry, 12px semibold, #F4FF3A.',
    },
    {
      name: 'TopNav/Context/Title',
      type: 'text',
      notes: '무신사 비교 시작, 18px bold, #F8FAFC.',
    },
    {
      name: 'TopNav/Context/MobileStatusRail',
      type: 'horizontal row',
      notes: 'Fill horizontal, gap 8, contains MOBILE/ROUTE/SUN-10 chips.',
    },
  ],
  chips: [
    { label: 'MOBILE', value: '393', fill: '#182235', stroke: '#334155' },
    { label: 'ROUTE', value: '/brand/musinsa', fill: '#182235', stroke: '#334155' },
    { label: 'SUN-10', value: 'TopNav', fill: '#1B2A1F', stroke: '#59D26F' },
  ],
  placeholderSpec: {
    name: 'SUN-10 Remaining Sections Placeholder',
    width: 357,
    height: 650,
    fill: '#0B1220',
    stroke: '#1E293B',
    radius: 28,
    title: 'Mobile Brand sections remain pending',
    body:
      'This mobile frame intentionally contains only TopNav/Context. Continue with Hero/Search, QuickRoutes, CompareProof, SiblingNavigation, and ShortlistReentry before review approval.',
  },
  acceptanceChecks: [
    'Figma page is named SUN-10 Compare Entry.',
    'Frame name exactly matches CompareEntry/Mobile/Brand-Musinsa.',
    'Section name exactly matches TopNav/Context.',
    'TopNav/Context contains RouteIdentity, LogoMark, RouteCopy, Eyebrow, Title, MobileStatusRail, and the three chips.',
    'Fallback placeholder remains visibly separate from TopNav/Context.',
    'No worksheet item is checked until the frameId and sectionId are captured from Figma.',
  ],
  afterManualBuild: [
    'Record the real frameId and sectionId in tasks/todo.md.',
    'Check only CompareEntry/Mobile/Brand-Musinsa -> TopNav/Context in compare-entry-manual-build-worksheet.md.',
    'Run npm run ntl:compare-entry-review-finalize.',
    'Run npm run ntl:compare-entry-review-ready-check.',
    'Continue with the next recommended section only after the gate artifacts point to the next slice.',
  ],
  links,
};

function formatList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

async function main() {
  await mkdir(artifactDir, { recursive: true });
  await writeFile(outputPaths.json, `${JSON.stringify(packet, null, 2)}\n`, 'utf8');

  const markdown = `# Compare Entry Manual UI Slice Packet

## Summary

- generatedAt: \`${packet.generatedAt}\`
- status: \`${packet.status}\`
- Figma fileKey: \`${packet.figmaFileKey}\`
- page: \`${packet.pageName}\`
- route: \`${packet.route}\`
- target: \`${packet.target.slice}\`
- worksheetPolicy: \`${packet.worksheetPolicy}\`

## Frame Spec

- name: \`${packet.frameSpec.name}\`
- size: \`${packet.frameSpec.width}x${packet.frameSpec.height}\`
- position: \`${packet.frameSpec.x}; y=${packet.frameSpec.y}\`
- fill: \`${packet.frameSpec.fill}\`
- layout: ${packet.frameSpec.layout}

## Section Spec

- name: \`${packet.sectionSpec.name}\`
- size: \`${packet.sectionSpec.width}x${packet.sectionSpec.height}\`
- fill: \`${packet.sectionSpec.fill}\`
- stroke: \`${packet.sectionSpec.stroke}\`
- radius: \`${packet.sectionSpec.radius}\`
- layout: ${packet.sectionSpec.layout}

## Required Hierarchy

${packet.hierarchy.map((node) => `- \`${node.name}\` (${node.type}): ${node.notes}`).join('\n')}

## Chips

${packet.chips.map((chip) => `- \`${chip.label}\` -> \`${chip.value}\`, fill \`${chip.fill}\`, stroke \`${chip.stroke}\``).join('\n')}

## Placeholder

- name: \`${packet.placeholderSpec.name}\`
- size: \`${packet.placeholderSpec.width}x${packet.placeholderSpec.height}\`
- fill: \`${packet.placeholderSpec.fill}\`
- stroke: \`${packet.placeholderSpec.stroke}\`
- radius: \`${packet.placeholderSpec.radius}\`
- title: \`${packet.placeholderSpec.title}\`
- body: ${packet.placeholderSpec.body}

## Acceptance Checks

${formatList(packet.acceptanceChecks)}

## After Manual Build

${formatList(packet.afterManualBuild)}

## Artifact Open Order

1. \`${links.actionCard}\`
2. \`${links.previewHtml}\`
3. \`${links.unblockPlan}\`
4. \`${links.manualChecklist}\`
5. \`${links.buildWorksheet}\`
6. \`${links.reviewWorksheet}\`
7. \`${links.decisionLog}\`
8. \`${links.gate}\`

## Related References

- retry packet: \`${links.retryPacket}\`
- preview json: \`${links.previewJson}\`
- Figma template: \`${links.figmaTemplate}\`
`;

  await writeFile(outputPaths.markdown, markdown, 'utf8');
  process.stdout.write(
    `${JSON.stringify(
      {
        ok: true,
        status: packet.status,
        target: packet.target.slice,
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
