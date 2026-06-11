import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'output', 'playwright');
const surfaceSummaryPath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');
const outputPath = path.join(artifactDir, 'compare-entry-manual-build-worksheet.md');

const frameGroups = [
  {
    title: 'Desktop Frames',
    width: '1440',
    frames: [
      {
        name: 'CompareEntry/Desktop/Brand-Musinsa',
        route: '/brand/musinsa',
        sections: [
          'TopNav/Context',
          'Hero',
          'CompareLens',
          'SearchEntry',
          'QuickRoutes',
          'ShortlistReentry',
          'CompareProof',
          'SiblingNavigation',
        ],
        primitives: [
          'CompareEntry/Hero',
          'CompareEntry/CompareLens',
          'CompareEntry/SearchEntry',
          'CompareEntry/QuickRouteCard',
          'CompareEntry/ShortlistReentry',
          'CompareEntry/SectionHeader',
        ],
      },
      {
        name: 'CompareEntry/Desktop/Category-Sneakers',
        route: '/category/sneakers',
        sections: [
          'TopNav/Context',
          'Hero',
          'CompareLens',
          'SearchEntry',
          'QuickRoutes',
          'ShortlistReentry',
          'CompareProof',
          'SiblingNavigation',
        ],
        primitives: [
          'CompareEntry/Hero',
          'CompareEntry/CompareLens',
          'CompareEntry/SearchEntry',
          'CompareEntry/QuickRouteCard',
          'CompareEntry/Proof',
          'CompareEntry/SiblingNavigation',
        ],
      },
      {
        name: 'CompareEntry/Desktop/Search-Results-Hood',
        route: '/?q=남자%20후드&sort=sim',
        sections: ['SearchSummaryMetrics', 'CompareHighlights', 'ResultGrid', 'ShortlistEntry', 'DetailEntryHint'],
        primitives: [
          'CompareEntry/SummaryMetricCard',
          'CompareEntry/HighlightCard',
          'CompareEntry/ResultCard',
          'CompareEntry/ShortlistSection',
          'CompareEntry/ShortlistButton',
        ],
      },
    ],
  },
  {
    title: 'Mobile Frames',
    width: '393',
    frames: [
      {
        name: 'CompareEntry/Mobile/Brand-Musinsa',
        route: '/brand/musinsa',
        sections: [
          'TopNav/Context',
          'Hero',
          'CompareLens',
          'SearchEntry',
          'QuickRoutes',
          'ShortlistReentry',
          'CompareProof',
          'SiblingNavigation',
        ],
        primitives: [
          'CompareEntry/Hero',
          'CompareEntry/CompareLens',
          'CompareEntry/SearchEntry',
          'CompareEntry/QuickRouteCard',
          'CompareEntry/ShortlistReentry',
          'CompareEntry/SectionHeader',
        ],
      },
      {
        name: 'CompareEntry/Mobile/Category-Sneakers',
        route: '/category/sneakers',
        sections: [
          'TopNav/Context',
          'Hero',
          'CompareLens',
          'SearchEntry',
          'QuickRoutes',
          'ShortlistReentry',
          'CompareProof',
          'SiblingNavigation',
        ],
        primitives: [
          'CompareEntry/Hero',
          'CompareEntry/CompareLens',
          'CompareEntry/SearchEntry',
          'CompareEntry/QuickRouteCard',
          'CompareEntry/Proof',
          'CompareEntry/SiblingNavigation',
        ],
      },
      {
        name: 'CompareEntry/Mobile/Search-Results-Hood',
        route: '/?q=남자%20후드&sort=sim',
        sections: ['SearchSummaryMetrics', 'CompareHighlights', 'ResultGrid', 'ShortlistEntry', 'DetailEntryHint'],
        primitives: [
          'CompareEntry/SummaryMetricCard',
          'CompareEntry/HighlightCard',
          'CompareEntry/ResultCard',
          'CompareEntry/ShortlistSection',
          'CompareEntry/ShortlistButton',
        ],
      },
    ],
  },
];

function buildFrameSection(frame, width) {
  const sections = frame.sections.map((section) => `- [ ] \`${section}\``).join('\n');
  const primitives = frame.primitives.map((primitive) => `- [ ] \`${primitive}\``).join('\n');

  return `### ${frame.name}

- Route: \`${frame.route}\`
- Width: \`${width}\`

#### Section Build Checklist

${sections}

#### Primitive Visibility Checklist

${primitives}

#### Build Notes

- first fold:
- copy adjustments:
- mobile/desktop adaptation:
- unresolved question:
`;
}

async function main() {
  const raw = await readFile(surfaceSummaryPath, 'utf8');
  const summary = JSON.parse(raw);
  await mkdir(artifactDir, { recursive: true });

  const frameSections = frameGroups
    .map((group) => `## ${group.title}\n\n${group.frames.map((frame) => buildFrameSection(frame, group.width)).join('\n')}`)
    .join('\n');

  const markdown = `# Compare Entry Manual Build Worksheet

## Session Info

- Builder:
- Build Date:
- Figma file: https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi
- Generated At: \`${summary.generatedAt ?? 'unknown'}\`
- Brand Route: \`${summary.routes?.brand ?? 'unknown'}\`
- Search Route: \`${summary.routes?.search ?? 'unknown'}\`
- Query: \`${summary.search?.query ?? 'unknown'}\`
- Displayed Count: \`${summary.search?.displayedCount ?? 'unknown'}\`

## Build Inputs

- Surface summary: \`${surfaceSummaryPath}\`
- Manual packet: \`output/playwright/compare-entry-manual-figma-packet.html\`
- Frame specs: \`output/playwright/compare-entry-manual-frame-specs.md\`
- Manual build checklist: \`docs/COMPARE_ENTRY_FUNNEL_MANUAL_FIGMA_BUILD_CHECKLIST.md\`

## Build Order

1. \`npm run ntl:compare-entry-review-prep\`
2. Open \`output/playwright/compare-entry-manual-figma-packet.html\`
3. Open \`output/playwright/compare-entry-manual-frame-specs.md\`
4. Build desktop 3 frames
5. Build mobile 3 frames
6. Fill this worksheet while building
7. Move to review with \`compare-entry-design-review-board.html\`, \`compare-entry-design-review-worksheet.md\`, \`compare-entry-design-review-decision-log.md\`

## Cross-Cut Build Checks

- [ ] desktop/mobile 6개 frame 이름이 manifest와 일치한다
- [ ] route-specific copy meaning을 깨지 않았다
- [ ] section order를 바꾸지 않았다
- [ ] HighlightCard / ResultCard / SummaryMetricCard / ShortlistButton 경계가 보인다
- [ ] search-result frame에서 compare-ready zone이 generic grid보다 먼저 읽힌다

${frameSections}

## Handoff To Review

- [ ] \`compare-entry-design-review-board.html\` 과 production shell correspondence 확인
- [ ] \`compare-entry-design-review-worksheet.md\` 작성 시작
- [ ] \`compare-entry-design-review-decision-log.md\` 에 outcome 초안 기록

## Build Summary

- Completed frames:
- Open issues:
  - 
- Ready for review: \`Yes\` | \`No\`
`;

  await writeFile(outputPath, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        frames: frameGroups.reduce((count, group) => count + group.frames.length, 0),
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
