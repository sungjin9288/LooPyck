import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'output', 'playwright');
const surfaceSummaryPath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');
const reviewPacketPath = path.join(artifactDir, 'compare-entry-design-review-packet.md');
const outputPath = path.join(artifactDir, 'compare-entry-design-review-worksheet.md');

const reviewCriteria = [
  'frame completeness',
  'hierarchy clarity',
  'content fidelity',
  'component readiness',
  'handoff safety',
];

const frameGroups = [
  {
    title: 'Desktop Frames',
    frames: [
      'CompareEntry/Desktop/Brand-Musinsa',
      'CompareEntry/Desktop/Category-Sneakers',
      'CompareEntry/Desktop/Search-Results-Hood',
    ],
  },
  {
    title: 'Mobile Frames',
    frames: [
      'CompareEntry/Mobile/Brand-Musinsa',
      'CompareEntry/Mobile/Category-Sneakers',
      'CompareEntry/Mobile/Search-Results-Hood',
    ],
  },
];

function buildCriteriaChecklist() {
  return reviewCriteria.map((criterion) => `- [ ] ${criterion}`).join('\n');
}

function buildFrameSections() {
  return frameGroups
    .map(
      (group) => `## ${group.title}

${group.frames
  .map(
    (frame) => `### ${frame}

${buildCriteriaChecklist()}

- Notes:
  - first fold:
  - production shell correspondence:
  - follow-up:
`,
  )
  .join('\n')}`,
    )
    .join('\n');
}

async function main() {
  const raw = await readFile(surfaceSummaryPath, 'utf8');
  const summary = JSON.parse(raw);
  await mkdir(artifactDir, { recursive: true });

  const markdown = `# Compare Entry Design Review Worksheet

## Session Info

- Reviewer:
- Review Date:
- Outcome: \`Approved\` | \`Approved With Follow-up\` | \`Needs Revision\`
- Figma kickoff file: https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi

## Reference Inputs

- Surface summary: \`${surfaceSummaryPath}\`
- Review packet: \`${reviewPacketPath}\`
- Generated At: \`${summary.generatedAt ?? 'unknown'}\`
- Brand Route: \`${summary.routes?.brand ?? 'unknown'}\`
- Search Route: \`${summary.routes?.search ?? 'unknown'}\`
- Query: \`${summary.search?.query ?? 'unknown'}\`
- Displayed Count: \`${summary.search?.displayedCount ?? 'unknown'}\`

## Refresh Order

1. \`npm run ntl:compare-entry-review-prep\`
2. Open \`output/playwright/compare-entry-design-review-packet.md\`
3. Open \`docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md\`
4. Fill this worksheet while reviewing Figma frames

## Cross-Cut Review Questions

- [ ] hero / compare lens / search CTA priority is unambiguous
- [ ] quick routes and shortlist re-entry strengthen workflow continuity
- [ ] summary metrics, highlight card, result card read as distinct hierarchy modes
- [ ] production shell meaning is preserved while visual clarity improves
- [ ] \`SUN-11\` / \`SUN-12\` ownership split still looks implementation-safe

${buildFrameSections()}

## Final Decision Notes

- Approval summary:
- Required revisions:
  - 
- Follow-up items for implementation:
  - 
`;

  await writeFile(outputPath, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        surfaceSummaryPath,
        reviewPacketPath,
        outputPath,
        displayedCount: summary.search?.displayedCount ?? null,
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
