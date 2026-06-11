import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const artifactDir = path.join(rootDir, 'output', 'playwright');
const surfaceSummaryPath = path.join(artifactDir, 'netlify-compare-entry-surface-reference.json');
const outputPath = path.join(artifactDir, 'compare-entry-manual-frame-specs.md');

const frameSpecs = [
  {
    key: 'brand',
    route: '/brand/musinsa',
    sourceFiles: ['app/brand/[slug]/page.tsx', 'components/landing/CompareEntryPage.tsx'],
    desktopFrame: 'CompareEntry/Desktop/Brand-Musinsa',
    mobileFrame: 'CompareEntry/Mobile/Brand-Musinsa',
    widthDesktop: '1440',
    widthMobile: '393',
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
    copyRules: [
      'eyebrow는 `Brand Compare Entry`를 유지한다.',
      'title은 `무신사 비교 시작`을 유지한다.',
      'starter tags는 `무신사스탠다드 / 무신사 한정판 / 무신사 세일` 3개를 모두 유지한다.',
      'compare lens 3개 signal의 의미를 축약하지 않는다.',
    ],
    mobileNotes: [
      'Hero와 CompareLens는 stacked block으로 바꿔도 된다.',
      'QuickRoutes는 1-column card stack 또는 horizontal chip strip을 허용한다.',
    ],
    primitives: [
      'CompareEntry/Hero',
      'CompareEntry/CompareLens',
      'CompareEntry/SearchEntry',
      'CompareEntry/QuickRouteCard',
      'CompareEntry/ShortlistReentry',
      'CompareEntry/SectionHeader',
    ],
    artifacts: ['compare-entry-brand-hero.png', 'compare-entry-brand-routes.png', 'compare-entry-brand-shortlist.png'],
  },
  {
    key: 'category',
    route: '/category/sneakers',
    sourceFiles: ['app/category/[slug]/page.tsx', 'components/landing/CompareEntryPage.tsx'],
    desktopFrame: 'CompareEntry/Desktop/Category-Sneakers',
    mobileFrame: 'CompareEntry/Mobile/Category-Sneakers',
    widthDesktop: '1440',
    widthMobile: '393',
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
    copyRules: [
      'title은 `👟 스니커즈 비교 시작`을 유지한다.',
      'starter keywords 5개를 모두 유지한다.',
      'compare lens에서 price spread / option / delivery 축이 그대로 읽혀야 한다.',
      'search entry heading은 카테고리 compare entry 의미를 유지한다.',
    ],
    mobileNotes: [
      'QuickRoutes는 chip strip이나 vertical stack으로 전환 가능하다.',
      'ShortlistReentry는 독립 section 또는 sticky affordance 후보로 둘 수 있다.',
    ],
    primitives: [
      'CompareEntry/Hero',
      'CompareEntry/CompareLens',
      'CompareEntry/SearchEntry',
      'CompareEntry/QuickRouteCard',
      'CompareEntry/Proof',
      'CompareEntry/SiblingNavigation',
    ],
    artifacts: ['category.png'],
  },
  {
    key: 'search',
    route: '/?q=남자%20후드&sort=sim',
    sourceFiles: ['app/page.tsx', 'components/product/InfiniteProductGrid.tsx', 'components/product/ComparisonHighlights.tsx'],
    desktopFrame: 'CompareEntry/Desktop/Search-Results-Hood',
    mobileFrame: 'CompareEntry/Mobile/Search-Results-Hood',
    widthDesktop: '1440',
    widthMobile: '393',
    sections: ['SearchSummaryMetrics', 'CompareHighlights', 'ResultGrid', 'ShortlistEntry', 'DetailEntryHint'],
    copyRules: [
      'summary metric label 3개는 `최저 결제가 / 비교 가능 상품 / 최대 결제가 차이`로 고정한다.',
      'highlight zone은 `Compare Ready` 의미가 first scan에서 보여야 한다.',
      'result card는 mall count / trust / PDP / checkout evidence / shortlist action 신호를 유지한다.',
      '동적 숫자는 placeholder token으로 둔다.',
    ],
    mobileNotes: [
      'HighlightCard는 1개씩 vertical scan 가능한 구조를 우선한다.',
      'ResultGrid는 dense masonry보다 single-column 또는 2-column scan hierarchy를 우선한다.',
    ],
    primitives: [
      'CompareEntry/SummaryMetricCard',
      'CompareEntry/HighlightCard',
      'CompareEntry/ResultCard',
      'CompareEntry/ShortlistSection',
      'CompareEntry/ShortlistButton',
    ],
    artifacts: [
      'compare-entry-search-summary.png',
      'compare-entry-search-highlights.png',
      'compare-entry-search-highlight-card.png',
      'compare-entry-search-result-card.png',
    ],
  },
];

const placeholderTokens = [
  '{lowestCheckoutPrice}',
  '{compareReadyCount}',
  '{priceSpread}',
  '{mallCount}',
  '{shortlistCount}',
  '{verifiedCount}',
];

async function main() {
  const raw = await readFile(surfaceSummaryPath, 'utf8');
  const summary = JSON.parse(raw);
  await mkdir(artifactDir, { recursive: true });

  const frameMatrixRows = frameSpecs
    .flatMap((spec) => [
      `| ${spec.desktopFrame} | desktop | ${spec.widthDesktop} | ${spec.route} | ${spec.artifacts.map((name) => `\`${name}\``).join(', ')} |`,
      `| ${spec.mobileFrame} | mobile | ${spec.widthMobile} | ${spec.route} | ${spec.artifacts.map((name) => `\`${name}\``).join(', ')} |`,
    ])
    .join('\n');

  const sections = frameSpecs
    .map((spec) => {
      const relatedArtifacts = spec.artifacts
        .map((name) => `- \`${name}\`: ${path.join(artifactDir, name)}`)
        .join('\n');
      const sourceFiles = spec.sourceFiles.map((file) => `- \`${file}\``).join('\n');
      const sectionOrder = spec.sections.map((section) => `1. \`${section}\``).join('\n');
      const copyRules = spec.copyRules.map((rule) => `- ${rule}`).join('\n');
      const mobileNotes = spec.mobileNotes.map((note) => `- ${note}`).join('\n');
      const primitives = spec.primitives.map((primitive) => `- \`${primitive}\``).join('\n');

      return `## ${spec.desktopFrame.split('/').pop()}

### Route / Sources

- route: \`${spec.route}\`
- desktop frame: \`${spec.desktopFrame}\`
- mobile frame: \`${spec.mobileFrame}\`
- desktop width: \`${spec.widthDesktop}\`
- mobile width: \`${spec.widthMobile}\`

source files:
${sourceFiles}

### Section Order

${sectionOrder}

### Copy / Meaning Rules

${copyRules}

### Mobile Adaptation Notes

${mobileNotes}

### Primitive Boundaries That Must Stay Visible

${primitives}

### Reference Artifacts

${relatedArtifacts}
`;
    })
    .join('\n');

  const markdown = `# Compare Entry Manual Frame Specs

generatedAt: \`${summary.generatedAt ?? 'unknown'}\`  
baseUrl: \`${summary.baseUrl ?? 'unknown'}\`  
query: \`${summary.search?.query ?? 'unknown'}\`  
displayedCount: \`${summary.search?.displayedCount ?? 'unknown'}\`

## Purpose

이 문서는 \`Compare Entry\` page의 desktop/mobile 6개 frame을 수동으로 만들 때, 각 frame을 어떤 route / section order / copy invariant / primitive boundary 기준으로 그려야 하는지 한 파일에서 보게 하기 위한 build spec이다.

\`compare-entry-manual-figma-packet.html\` 이 single-screen overview라면, 이 문서는 frame-by-frame 제작 시트다.

## Frame Matrix

| Frame | Variant | Width | Route | Reference Artifacts |
| --- | --- | --- | --- | --- |
${frameMatrixRows}

## Shared Placeholder Tokens

${placeholderTokens.map((token) => `- \`${token}\``).join('\n')}

## Shared Rules

- desktop/mobile 모두 frame 이름은 manifest와 정확히 일치해야 한다.
- section order는 바꾸지 않는다.
- entry frame은 \`Hero -> CompareLens -> SearchEntry\` 흐름이 first fold에서 읽혀야 한다.
- search result frame은 \`SearchSummaryMetrics -> CompareHighlights -> ResultGrid\` 흐름이 먼저 읽혀야 한다.
- \`SummaryMetricCard / HighlightCard / ResultCard / ShortlistButton\` 경계는 시각적으로 identifiable 해야 한다.

${sections}

## Related Review Artifacts

- \`${path.join(artifactDir, 'compare-entry-manual-figma-packet.html')}\`
- \`${path.join(artifactDir, 'compare-entry-design-review-packet.md')}\`
- \`${path.join(artifactDir, 'compare-entry-design-review-worksheet.md')}\`
- \`${path.join(artifactDir, 'compare-entry-design-review-decision-log.md')}\`
- \`${path.join(artifactDir, 'compare-entry-design-review-board.html')}\`
`;

  await writeFile(outputPath, markdown, 'utf8');

  process.stdout.write(
    JSON.stringify(
      {
        ok: true,
        outputPath,
        frames: frameSpecs.length * 2,
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
