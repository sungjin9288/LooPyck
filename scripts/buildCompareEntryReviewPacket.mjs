import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'output', 'playwright');
const sourcePath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');
const outputPath = path.join(artifactDir, 'compare-entry-design-review-packet.md');

const screenshotLabels = {
  brandHero: 'Brand Hero',
  brandRoutes: 'Brand Routes',
  brandShortlist: 'Brand Shortlist Re-entry',
  searchSummary: 'Search Summary Metrics',
  searchHighlights: 'Search Highlights',
  searchHighlightCard: 'Search Highlight Card',
  searchResultCard: 'Search Result Card',
};

async function main() {
  const raw = await readFile(sourcePath, 'utf8');
  const summary = JSON.parse(raw);
  await mkdir(artifactDir, { recursive: true });

  const screenshotSections = Object.entries(screenshotLabels)
    .map(([key, label]) => {
      const imagePath = summary.screenshots?.[key];
      const safePath = typeof imagePath === 'string' ? imagePath : '(missing)';
      return [
        `## ${label}`,
        '',
        `- Path: \`${safePath}\``,
        imagePath ? `![${label}](${imagePath})` : '- Screenshot missing',
      ].join('\n');
    })
    .join('\n\n');

  const markdown = `# Compare Entry Design Review Packet

## Summary

- Generated At: \`${summary.generatedAt ?? 'unknown'}\`
- Base URL: \`${summary.baseUrl ?? 'unknown'}\`
- Session: \`${summary.session ?? 'unknown'}\`
- Brand Route: \`${summary.routes?.brand ?? 'unknown'}\`
- Search Route: \`${summary.routes?.search ?? 'unknown'}\`
- Query: \`${summary.search?.query ?? 'unknown'}\`
- Displayed Count: \`${summary.search?.displayedCount ?? 'unknown'}\`

## Review Use

- Command refresh order:
  1. \`npm run ntl:compare-entry-surfaces\`
  2. \`node scripts/buildCompareEntryReviewPacket.mjs\`
- Approval gate reference:
  - \`docs/COMPARE_ENTRY_FUNNEL_DESIGN_REVIEW_CHECKLIST.md\`
- Figma kickoff file:
  - https://www.figma.com/design/Oj35jzmgbwnxzpTTqTcxLi

## Recommended Review Questions

- Hero, compare lens, search CTA 중 first-fold primary action이 하나로 읽히는가
- Quick routes와 shortlist re-entry가 workflow continuity를 강화하는가
- Search summary, highlight card, result card가 서로 다른 hierarchy mode로 보이는가
- Production shell 의미를 잃지 않고 더 명확한 visual direction으로 정리됐는가

${screenshotSections}

## Review Outcome Template

- Outcome: \`Approved\` | \`Approved With Follow-up\` | \`Needs Revision\`
- Notes:
  - hierarchy:
  - content fidelity:
  - primitive shell:
  - handoff safety:
`;

  await writeFile(outputPath, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        sourcePath,
        outputPath,
        screenshots: Object.keys(summary.screenshots ?? {}).length,
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
