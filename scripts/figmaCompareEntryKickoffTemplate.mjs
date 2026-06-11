export const description = 'Create Compare Entry redesign kickoff pages, frames, and section skeletons in the Figma kickoff file';

export const code = String.raw`const createdNodeIds = [];
const mutatedNodeIds = [];

const pageSpecs = [
  {
    name: 'Compare Entry',
    frames: [
      {
        name: 'CompareEntry/Desktop/Brand-Musinsa',
        width: 1440,
        kind: 'entry',
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
      },
      {
        name: 'CompareEntry/Desktop/Category-Sneakers',
        width: 1440,
        kind: 'entry',
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
      },
      {
        name: 'CompareEntry/Desktop/Search-Results-Hood',
        width: 1440,
        kind: 'search',
        sections: [
          'SearchSummaryMetrics',
          'CompareHighlights',
          'ResultGrid',
          'ShortlistEntry',
          'DetailEntryHint',
        ],
      },
      {
        name: 'CompareEntry/Mobile/Brand-Musinsa',
        width: 393,
        kind: 'entry',
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
      },
      {
        name: 'CompareEntry/Mobile/Category-Sneakers',
        width: 393,
        kind: 'entry',
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
      },
      {
        name: 'CompareEntry/Mobile/Search-Results-Hood',
        width: 393,
        kind: 'search',
        sections: [
          'SearchSummaryMetrics',
          'CompareHighlights',
          'ResultGrid',
          'ShortlistEntry',
          'DetailEntryHint',
        ],
      },
    ],
  },
  {
    name: 'Product Detail Compare',
    frames: [
      {
        name: 'ProductDetail/Desktop/Placeholder',
        width: 1440,
        kind: 'placeholder',
        sections: ['DecisionBlock', 'MallCompareTable', 'PriceHistory', 'TrustSupport'],
      },
      {
        name: 'ProductDetail/Mobile/Placeholder',
        width: 393,
        kind: 'placeholder',
        sections: ['DecisionBlock', 'MallCompareTable', 'PriceHistory', 'TrustSupport'],
      },
    ],
  },
  {
    name: 'Design System Notes',
    frames: [
      {
        name: 'DesignSystem/PrimitiveChecklist',
        width: 1440,
        kind: 'notes',
        sections: [
          'SectionHeader',
          'HeroTextStack',
          'SignalRow',
          'QuickRouteChip',
          'QuickRouteCard',
          'SearchEntryShell',
          'SortChip',
          'PrimarySearchButton',
          'SummaryMetricCard',
          'HighlightCard',
          'ResultCard',
          'ShortlistSection',
          'ShortlistItemCard',
          'ShortlistButton',
        ],
      },
    ],
  },
];

const fontRegular = { family: 'Inter', style: 'Regular' };
const fontMedium = { family: 'Inter', style: 'Medium' };
const fontBold = { family: 'Inter', style: 'Bold' };

await figma.loadFontAsync(fontRegular);
await figma.loadFontAsync(fontMedium);
await figma.loadFontAsync(fontBold);

function hexToPaint(hex, opacity = 1) {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(normalized, 16);
  return {
    type: 'SOLID',
    color: {
      r: ((bigint >> 16) & 255) / 255,
      g: ((bigint >> 8) & 255) / 255,
      b: (bigint & 255) / 255,
    },
    opacity,
  };
}

function createTextNode(name, text, size, fontName, fillHex = '#0f172a') {
  const node = figma.createText();
  node.name = name;
  node.fontName = fontName;
  node.fontSize = size;
  node.characters = text;
  node.fills = [hexToPaint(fillHex)];
  createdNodeIds.push(node.id);
  return node;
}

function ensurePage(pageName) {
  let page = figma.root.children.find((entry) => entry.name === pageName);
  if (page) return { page, mutated: false };

  if (figma.root.children.length === 1) {
    const first = figma.root.children[0];
    if (first.children.length === 0 && !pageSpecs.some((spec) => spec.name === first.name)) {
      first.name = pageName;
      mutatedNodeIds.push(first.id);
      return { page: first, mutated: true };
    }
  }

  if (figma.root.children.length >= 3) {
    throw new Error('Starter-plan fallback expects a maximum of 3 pages. Remove extra pages or rename existing pages before running this scaffold.');
  }

  page = figma.createPage();
  page.name = pageName;
  createdNodeIds.push(page.id);
  return { page, mutated: false };
}

function configureFrameShell(frame, width) {
  frame.layoutMode = 'VERTICAL';
  frame.primaryAxisSizingMode = 'AUTO';
  frame.counterAxisSizingMode = 'FIXED';
  frame.resize(width, 100);
  frame.layoutSizingHorizontal = 'FIXED';
  frame.layoutSizingVertical = 'HUG';
  frame.counterAxisAlignItems = 'MIN';
  frame.primaryAxisAlignItems = 'MIN';
  frame.paddingTop = 32;
  frame.paddingRight = 32;
  frame.paddingBottom = 32;
  frame.paddingLeft = 32;
  frame.itemSpacing = 20;
  frame.cornerRadius = 24;
  frame.fills = [hexToPaint('#f8fafc')];
  frame.strokes = [hexToPaint('#cbd5e1')];
  frame.strokeWeight = 1;
}

function createSectionCard(sectionName, width, kind) {
  const card = figma.createFrame();
  card.name = sectionName;
  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'AUTO';
  card.counterAxisSizingMode = 'FIXED';
  card.resize(width, 100);
  card.layoutSizingHorizontal = 'FIXED';
  card.layoutSizingVertical = 'HUG';
  card.counterAxisAlignItems = 'MIN';
  card.primaryAxisAlignItems = 'MIN';
  card.paddingTop = 20;
  card.paddingRight = 20;
  card.paddingBottom = 20;
  card.paddingLeft = 20;
  card.itemSpacing = 8;
  card.cornerRadius = 20;
  card.fills = [hexToPaint('#ffffff', 0.92)];
  card.strokes = [hexToPaint('#e2e8f0')];
  card.strokeWeight = 1;
  createdNodeIds.push(card.id);

  const label = createTextNode(
    sectionName + '/Label',
    sectionName,
    18,
    fontBold,
    '#0f172a',
  );
  card.appendChild(label);

  label.layoutSizingHorizontal = 'FILL';
  label.layoutSizingVertical = 'HUG';

  const helper = createTextNode(
    sectionName + '/Helper',
    kind === 'notes'
      ? 'Shared primitive or token checklist placeholder'
      : 'Skeleton placeholder for redesign direction and content placement',
    12,
    fontRegular,
    '#64748b',
  );
  card.appendChild(helper);
  helper.layoutSizingHorizontal = 'FILL';
  helper.layoutSizingVertical = 'HUG';

  return card;
}

function buildFrame(page, spec, frameIndex) {
  const existing = page.findOne((node) => node.type === 'FRAME' && node.name === spec.name);
  if (existing && existing.type === 'FRAME') {
    mutatedNodeIds.push(existing.id);
    return existing;
  }

  const frame = figma.createFrame();
  frame.name = spec.name;
  configureFrameShell(frame, spec.width);

  const title = createTextNode(
    spec.name + '/Title',
    spec.name,
    spec.kind === 'notes' ? 28 : 32,
    fontBold,
    '#020617',
  );
  frame.appendChild(title);
  title.layoutSizingHorizontal = 'FILL';
  title.layoutSizingVertical = 'HUG';

  const subtitle = createTextNode(
    spec.name + '/Subtitle',
    spec.kind === 'search'
      ? 'Search result hierarchy skeleton'
      : spec.kind === 'notes'
        ? 'Primitive inventory and design-system notes placeholder'
        : 'Compare entry funnel skeleton',
    14,
    fontRegular,
    '#475569',
  );
  frame.appendChild(subtitle);
  subtitle.layoutSizingHorizontal = 'FILL';
  subtitle.layoutSizingVertical = 'HUG';

  for (const sectionName of spec.sections) {
    const section = createSectionCard(sectionName, spec.width - 64, spec.kind);
    frame.appendChild(section);
    section.layoutSizingHorizontal = 'FILL';
    section.layoutSizingVertical = 'HUG';
  }

  frame.x = frameIndex * (spec.width + 120);
  frame.y = 0;
  page.appendChild(frame);
  createdNodeIds.push(frame.id);
  return frame;
}

const pageResults = [];

for (const pageSpec of pageSpecs) {
  const { page } = ensurePage(pageSpec.name);
  await figma.setCurrentPageAsync(page);

  const builtFrames = pageSpec.frames.map((frameSpec, index) => {
    const frame = buildFrame(page, frameSpec, index);
    return { id: frame.id, name: frame.name };
  });

  pageResults.push({
    pageId: page.id,
    pageName: page.name,
    frames: builtFrames,
  });
}

return {
  createdNodeIds,
  mutatedNodeIds,
  pageResults,
};`;
