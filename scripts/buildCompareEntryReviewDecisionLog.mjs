import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'output', 'playwright');
const surfaceSummaryPath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');
const outputPath = path.join(artifactDir, 'compare-entry-design-review-decision-log.md');

async function main() {
  const raw = await readFile(surfaceSummaryPath, 'utf8');
  const summary = JSON.parse(raw);
  await mkdir(artifactDir, { recursive: true });

  const markdown = `# Compare Entry Design Review Decision Log

## Session Metadata

- Review Session ID:
- Review Date:
- Reviewer:
- Figma file: https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi
- Source summary: \`${surfaceSummaryPath}\`
- Generated At: \`${summary.generatedAt ?? 'unknown'}\`
- Brand Route: \`${summary.routes?.brand ?? 'unknown'}\`
- Search Route: \`${summary.routes?.search ?? 'unknown'}\`
- Query: \`${summary.search?.query ?? 'unknown'}\`
- Displayed Count: \`${summary.search?.displayedCount ?? 'unknown'}\`

## Review Inputs

- Review board: \`output/playwright/compare-entry-design-review-board.html\`
- Review worksheet: \`output/playwright/compare-entry-design-review-worksheet.md\`
- Review packet: \`output/playwright/compare-entry-design-review-packet.md\`
- Approval checklist: \`docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md\`

## Decision

- Outcome: \`Approved\` | \`Approved With Follow-up\` | \`Needs Revision\`
- Does \`SUN-10\` unblock \`SUN-11\` / \`SUN-12\`?: \`Yes\` | \`No\`
- Reviewer confidence: \`High\` | \`Medium\` | \`Low\`

## Frame-Level Notes

### Desktop

- Brand-Musinsa:
- Category-Sneakers:
- Search-Results-Hood:

### Mobile

- Brand-Musinsa:
- Category-Sneakers:
- Search-Results-Hood:

## Required Revisions

1.
2.
3.

## Approved With Follow-up Notes

- implementation follow-up:
- copy polish follow-up:
- token / component cleanup follow-up:

## Handoff Notes

- \`SUN-11\` landing scope:
- \`SUN-12\` search-result scope:
- should any node be renamed before implementation?:
- should any primitive be split further before implementation?:

## Linear Update Draft

\`\`\`text
Outcome:
Unblocks:
Required revisions:
Follow-up:
\`\`\`
`;

  await writeFile(outputPath, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
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
